/** Varsayılan admin şifre sıfırlama değeri (sunucu + istemci aynı metni göstersin diye). */
export const DEFAULT_RESET_PASSWORD = "Zubee1234!"

export function resolveResetPassword() {
  return (
    process.env.ZUBEE_RESET_PASSWORD?.trim() ||
    process.env.NEXT_PUBLIC_ZUBEE_RESET_PASSWORD?.trim() ||
    DEFAULT_RESET_PASSWORD
  )
}

export function resetPasswordHint() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_ZUBEE_RESET_PASSWORD?.trim() ||
      DEFAULT_RESET_PASSWORD
    )
  }
  return resolveResetPassword()
}
