import bcrypt from 'bcryptjs'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'

import { db } from '#/db'
import {
  inviteTokens,
  passwordResetTokens,
  sessions,
  subscriberPreferences,
  users,
} from '#/db/schema'
import type { SessionUser, UserRole } from '#/lib/types'

const SESSION_COOKIE = 'rs_session'
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = nanoid(32)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  })

  setCookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  })

  return sessionId
}

export async function destroySession(): Promise<void> {
  const sessionId = getCookie(SESSION_COOKIE)

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  deleteCookie(SESSION_COOKIE, { path: '/' })
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const sessionId = getCookie(SESSION_COOKIE)

  if (!sessionId) {
    return null
  }

  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  if (!row || row.expiresAt < new Date() || row.user.disabledAt) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    deleteCookie(SESSION_COOKIE, { path: '/' })
    return null
  }

  return {
    id: row.user.id,
    email: row.user.email,
    name: row.user.name,
    role: row.user.role as UserRole,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()

  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN')
  }

  return user
}

export async function createInviteToken(
  email: string,
  createdBy: string,
): Promise<string> {
  const token = nanoid(48)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(inviteTokens).values({
    token,
    email: email.toLowerCase(),
    expiresAt,
    createdBy,
  })

  return token
}

export async function validateInviteToken(token: string) {
  const [invite] = await db
    .select()
    .from(inviteTokens)
    .where(
      and(
        eq(inviteTokens.token, token),
        gt(inviteTokens.expiresAt, new Date()),
        isNull(inviteTokens.usedAt),
      ),
    )
    .limit(1)

  return invite ?? null
}

export async function registerSubscriber(input: {
  email: string
  password: string
  name?: string
  inviteToken?: string
}): Promise<SessionUser> {
  const email = input.email.toLowerCase()

  if (input.inviteToken) {
    const invite = await validateInviteToken(input.inviteToken)

    if (!invite || invite.email !== email) {
      throw new Error('INVALID_INVITE')
    }
  } else {
    throw new Error('INVITE_REQUIRED')
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    throw new Error('EMAIL_EXISTS')
  }

  const userId = nanoid()
  const passwordHash = await hashPassword(input.password)

  await db.insert(users).values({
    id: userId,
    email,
    name: input.name ?? null,
    passwordHash,
    role: 'subscriber',
  })

  await db.insert(subscriberPreferences).values({
    userId,
    digestFrequency: 'weekly',
  })

  if (input.inviteToken) {
    await db
      .update(inviteTokens)
      .set({ usedAt: new Date() })
      .where(eq(inviteTokens.token, input.inviteToken))
  }

  await createSession(userId)

  const user = await getCurrentUser()

  if (!user) {
    throw new Error('SESSION_FAILED')
  }

  return user
}

const PASSWORD_RESET_DURATION_MS = 60 * 60 * 1000

export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (!user) {
    return null
  }

  const [activeUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, user.id), isNull(users.disabledAt)))
    .limit(1)

  if (!activeUser) {
    return null
  }

  await db
    .delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    )

  const token = nanoid(48)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_DURATION_MS)

  await db.insert(passwordResetTokens).values({
    token,
    userId: user.id,
    expiresAt,
  })

  return token
}

export async function validatePasswordResetToken(token: string) {
  const [row] = await db
    .select({
      token: passwordResetTokens.token,
      email: users.email,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(passwordResetTokens.userId, users.id))
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
        isNull(users.disabledAt),
      ),
    )
    .limit(1)

  return row ?? null
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const resetToken = await validatePasswordResetToken(token)

  if (!resetToken) {
    throw new Error('INVALID_RESET_TOKEN')
  }

  const passwordHash = await hashPassword(newPassword)

  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.email, resetToken.email))

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.token, token))

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, resetToken.email))
    .limit(1)

  if (user) {
    await db.delete(sessions).where(eq(sessions.userId, user.id))
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<SessionUser> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (!user || user.disabledAt) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const valid = await verifyPassword(password, user.passwordHash)

  if (!valid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  await createSession(user.id)

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  }
}
