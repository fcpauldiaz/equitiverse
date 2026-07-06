import 'dotenv/config'

import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import { db } from '../src/db/index.ts'
import { subscriberPreferences, users } from '../src/db/schema.ts'
import { hashPassword } from '../src/lib/auth.ts'

async function main() {
  const email = process.argv[2] ?? process.env.ADMIN_EMAIL
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error(
      'Usage: pnpm run db:seed -- admin@example.com your-password\nOr set ADMIN_EMAIL and ADMIN_PASSWORD in .env',
    )
    process.exit(1)
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)

  if (existing) {
    const passwordHash = await hashPassword(password)

    await db
      .update(users)
      .set({
        role: 'admin',
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))

    console.log(`Updated existing user ${email} to admin`)
    return
  }

  const userId = nanoid()
  const passwordHash = await hashPassword(password)

  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    name: 'Admin',
    passwordHash,
    role: 'admin',
  })

  await db.insert(subscriberPreferences).values({
    userId,
    digestFrequency: 'none',
  })

  console.log(`Created admin user: ${email}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
