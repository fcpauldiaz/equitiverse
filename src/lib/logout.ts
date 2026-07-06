import type { RegisteredRouter } from '@tanstack/react-router'

import { logoutFn } from '#/server/functions'

export async function logout(router: RegisteredRouter) {
  await logoutFn()
  await router.invalidate()
  await router.navigate({ to: '/login' })
}
