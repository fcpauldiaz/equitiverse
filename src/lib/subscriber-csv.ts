import { z } from 'zod'

const emailSchema = z.string().email()

export function parseSubscriberEmailsCsv(content: string): {
  emails: string[]
  invalid: string[]
} {
  const seen = new Set<string>()
  const emails: string[] = []
  const invalid: string[] = []

  for (const line of content.split(/\r?\n/)) {
    const cells = line
      .split(',')
      .map((cell) => cell.trim().replace(/^["']|["']$/g, ''))

    for (const cell of cells) {
      if (!cell || /^email$/i.test(cell)) {
        continue
      }

      const normalized = cell.toLowerCase()

      if (seen.has(normalized)) {
        continue
      }

      seen.add(normalized)

      const parsed = emailSchema.safeParse(normalized)

      if (parsed.success) {
        emails.push(normalized)
      } else {
        invalid.push(cell)
      }
    }
  }

  return { emails, invalid }
}

export function formatSubscribersCsv(emails: string[]): string {
  return ['email', ...emails].join('\n')
}
