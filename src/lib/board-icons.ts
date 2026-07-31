export function resolveBoardIconId(icon?: string | null) {
  if (icon === "Sparkles") return "Rocket"
  return icon || "Folder"
}
