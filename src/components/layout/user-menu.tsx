import { LogOut } from "lucide-react"
import { signOut } from "@/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function UserMenu({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {email ? (
        <Badge variant="secondary" className="hidden sm:inline-flex px-3 py-1.5 text-xs">
          {email}
        </Badge>
      ) : null}
      <form
        action={async () => {
          "use server"
          await signOut()
        }}
      >
        <Button type="submit" variant="outline" size="icon-sm" title="Çıkış Yap">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  )
}
