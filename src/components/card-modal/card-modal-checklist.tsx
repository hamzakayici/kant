"use client"

import { Check, CheckSquare, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

type CardModalChecklistProps = {
  items: any[]
  newItem: string
  onNewItemChange: (value: string) => void
  onAddItem: (e: React.KeyboardEvent) => void
  onToggle: (itemId: string, done: boolean) => void
  onDelete: (itemId: string) => void
  onEdit: (itemId: string, content: string) => void
  canUpdateCard?: boolean
}

export function CardModalChecklist({
  items,
  newItem,
  onNewItemChange,
  onAddItem,
  onToggle,
  onDelete,
  onEdit,
  canUpdateCard = true,
}: CardModalChecklistProps) {
  const doneCount = items.filter((i) => i.isDone).length
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <section className="rounded-xl border border-border/60 bg-muted/10 p-4">
      <div className="mb-4 flex items-center gap-2">
        <CheckSquare className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Kontrol Listesi</h2>
        {items.length > 0 ? (
          <span className="text-xs text-muted-foreground">%{progress}</span>
        ) : null}
      </div>

      {items.length > 0 ? (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{doneCount}/{items.length} tamamlandı</span>
            <span>%{progress}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start gap-3 rounded-lg px-1 py-1 hover:bg-muted/40"
          >
            <button
              type="button"
              onClick={() => onToggle(item.id, !item.isDone)}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                item.isDone
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/50",
              )}
            >
              {item.isDone ? <Check className="size-3.5" /> : null}
            </button>
            <input
              key={`${item.id}-${item.content}`}
              type="text"
              defaultValue={item.content}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.value = item.content
                  e.currentTarget.blur()
                } else if (e.key === "Enter") {
                  e.currentTarget.blur()
                }
              }}
              onBlur={(e) => {
                if (e.target.value !== item.content) {
                  onEdit(item.id, e.target.value)
                }
              }}
              className={cn(
                "min-w-0 flex-1 bg-transparent text-sm focus:outline-none",
                item.isDone && "text-muted-foreground line-through",
              )}
            />
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-border/80 px-3 py-2">
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Öğe ekle..."
          value={newItem}
          onChange={(e) => onNewItemChange(e.target.value)}
          onKeyDown={onAddItem}
          className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </section>
  )
}
