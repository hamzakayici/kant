import { cn } from "@/lib/utils"
import { formatUnreadCount } from "@/lib/chat-unread"

export function ChatUnreadBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  const label = formatUnreadCount(count)
  if (!label) return null

  return (
    <span
      className={cn(
        "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground",
        className,
      )}
    >
      {label}
    </span>
  )
}
