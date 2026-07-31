import { CSS } from "@dnd-kit/utilities"
import type { Transform } from "@dnd-kit/utilities"

/**
 * dnd-kit sortable uses scale in CSS.Transform for layout gaps, which squashes
 * card height during drag. Translate-only keeps each card's original shape.
 */
export function sortableTranslateStyle(
  transform: Transform | null,
  transition?: string | null,
) {
  return {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition: transition ?? undefined,
  }
}
