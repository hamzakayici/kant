/** Varsayılan admin şifre sıfırlama değeri (sunucu + istemci aynı metni göstersin diye). */
export const DEFAULT_RESET_PASSWORD = "Kant1234!"

export function resolveResetPassword() {
  return (
    process.env.KANT_RESET_PASSWORD?.trim() ||
    process.env.NEXT_PUBLIC_KANT_RESET_PASSWORD?.trim() ||
    DEFAULT_RESET_PASSWORD
  )
}

export function resetPasswordHint() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_KANT_RESET_PASSWORD?.trim() ||
      DEFAULT_RESET_PASSWORD
    )
  }
  return resolveResetPassword()
}
