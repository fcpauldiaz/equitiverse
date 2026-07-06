export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.startsWith('[')) {
      try {
        const issues = JSON.parse(error.message) as Array<{ message?: string }>
        const message = issues.find((issue) => issue.message)?.message
        if (message) {
          return message
        }
      } catch {
        // fall through
      }
    }

    if (error.message.trim().length > 0) {
      return error.message
    }
  }

  return 'Something went wrong. Please try again.'
}

export function getLoginReasonMessage(reason: string | undefined): string | null {
  switch (reason) {
    case 'auth_required':
      return 'Sign in to access your portfolio.'
    case 'session_failed':
      return 'Your session could not be restored. Please sign in again.'
    default:
      return null
  }
}
