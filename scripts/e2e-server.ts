import { spawn } from 'node:child_process'
import { config as loadEnv } from 'dotenv'

loadEnv()

const adminEmail =
  process.env.PLAYWRIGHT_ADMIN_EMAIL ??
  process.env.ADMIN_EMAIL ??
  'admin@edgebyrs.com'

const adminPassword =
  process.env.PLAYWRIGHT_ADMIN_PASSWORD ??
  process.env.ADMIN_PASSWORD ??
  'test-password-12'

const appPort = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${appPort}`

const databaseUrl = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!databaseUrl?.startsWith('libsql://')) {
  console.error(
    'E2E tests require TURSO_DATABASE_URL (libsql://...) in .env or the environment.',
  )
  process.exit(1)
}

if (!authToken) {
  console.error('E2E tests require TURSO_AUTH_TOKEN in .env or the environment.')
  process.exit(1)
}

const env = {
  ...process.env,
  TURSO_DATABASE_URL: databaseUrl,
  TURSO_AUTH_TOKEN: authToken,
  ADMIN_EMAIL: adminEmail,
  ADMIN_PASSWORD: adminPassword,
  BETTER_AUTH_URL: baseUrl,
}

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
      shell: process.platform === 'win32',
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

await run('npm', ['run', 'db:push'])
await run('npm', ['run', 'db:seed'])

const dev = spawn('npm', ['run', 'dev', '--', '--port', String(appPort)], {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
})

dev.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

dev.on('exit', (code) => {
  process.exit(code ?? 0)
})
