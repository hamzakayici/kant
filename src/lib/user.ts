export type UserNameFields = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  color?: string | null
}

export function getUserDisplayName(
  user?: UserNameFields | null,
  fallback = "Bilinmeyen Kullanıcı",
): string {
  if (!user) return fallback

  const full = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")

  if (full) return full

  if (user.email) {
    const local = user.email.split("@")[0]
    return local || user.email
  }

  return fallback
}

export function getUserInitial(
  user?: UserNameFields | string | null,
): string {
  if (!user) return "?"

  if (typeof user === "string") {
    const local = user.split("@")[0]
    return (local[0] || user[0] || "?").toUpperCase()
  }

  if (user.firstName?.trim()) {
    return user.firstName.trim()[0].toUpperCase()
  }

  if (user.lastName?.trim()) {
    return user.lastName.trim()[0].toUpperCase()
  }

  if (user.email) {
    const local = user.email.split("@")[0]
    return (local[0] || user.email[0] || "?").toUpperCase()
  }

  return "?"
}

/** @deprecated Use getUserDisplayName instead */
export function getUserLabel(
  user?: UserNameFields | string | null,
  fallback = "Bilinmeyen Kullanıcı",
): string {
  if (typeof user === "string") return user || fallback
  return getUserDisplayName(user, fallback)
}

export function getUserColorStyles(color?: string | null): import("react").CSSProperties {
  const hex = color || "#3b82f6"
  return {
    backgroundColor: hex,
    color: "#ffffff",
  }
}

export function getUserColorStylesWithOpacity(color?: string | null): import("react").CSSProperties {
  const hex = color || "#3b82f6"
  return {
    backgroundColor: `${hex}26`, // 15% opacity
    color: hex,
  }
}
