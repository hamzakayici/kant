import { Upload } from "lucide-react"

export function ChatDropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-2 text-primary">
        <Upload className="size-8" />
        <p className="text-sm font-medium">Dosyaları buraya bırakın</p>
      </div>
    </div>
  )
}
