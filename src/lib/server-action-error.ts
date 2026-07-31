let staleActionReloaded = false

export function isStaleServerActionError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : String(error)

  return (
    message.includes("Failed to fetch") ||
    message.includes("Server Action") ||
    message.includes("UnrecognizedActionError") ||
    message.includes("failed-to-find-server-action") ||
    message.includes("unexpected response was received from the server")
  )
}

export function recoverFromStaleServerAction(error: unknown): boolean {
  if (
    typeof window === "undefined" ||
    !isStaleServerActionError(error) ||
    staleActionReloaded
  ) {
    return false
  }

  staleActionReloaded = true
  window.location.reload()
  return true
}
