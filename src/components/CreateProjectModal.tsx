"use client"

import { useState, useEffect } from "react"
import {
  Briefcase,
  Check,
  ChevronDown,
  Folder,
  Layout,
  Activity,
  Star,
  Heart,
  Target,
  Compass,
  Rocket,
  Map,
  Users,
} from "lucide-react"
import { createProject } from "@/app/actions"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const ICONS = [
  { id: "Folder", icon: Folder },
  { id: "Briefcase", icon: Briefcase },
  { id: "Layout", icon: Layout },
  { id: "Activity", icon: Activity },
  { id: "Star", icon: Star },
  { id: "Heart", icon: Heart },
  { id: "Target", icon: Target },
  { id: "Compass", icon: Compass },
  { id: "Rocket", icon: Rocket },
  { id: "Map", icon: Map },
]

export default function CreateProjectModal({
  onClose,
  user,
  allUsers = [],
}: {
  onClose: () => void
  user: any
  allUsers?: any[]
}) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [identifier, setIdentifier] = useState("")
  const [userEditedIdentifier, setUserEditedIdentifier] = useState(false)
  const [description, setDescription] = useState("")
  const [startingNumber, setStartingNumber] = useState<number>(1)
  const [isPrivate, setIsPrivate] = useState(false)
  const [icon, setIcon] = useState("Folder")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<any[]>([])
  const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false)

  useEffect(() => {
    if (!userEditedIdentifier) {
      const generated = title
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 3)
        .toUpperCase()
      setIdentifier(generated)
    }
  }, [title, userEditedIdentifier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !identifier) return
    setIsSubmitting(true)

    try {
      const newId = await createProject({
        name: title,
        identifier: identifier.toUpperCase(),
        description,
        startingNumber,
        isPrivate,
        icon,
        memberIds: selectedMembers.map((m) => m.id),
      })
      router.push(`/b/${newId}`)
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
    }
  }

  const toggleMember = (u: any) => {
    if (selectedMembers.find((m) => m.id === u.id)) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== u.id))
    } else {
      setSelectedMembers([...selectedMembers, u])
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Proje Oluştur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <Label>Proje tipi</Label>
            <div className="md:col-span-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                <Briefcase className="size-4 text-primary" />
                Klasik proje
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <Label htmlFor="title">Proje adı</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="örn. EcoTech"
              className="md:col-span-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-start">
            <div>
              <Label htmlFor="identifier">Tanımlayıcı</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Görev ID&apos;lerinde kullanılır
              </p>
            </div>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => {
                setUserEditedIdentifier(true)
                setIdentifier(e.target.value.toUpperCase())
              }}
              required
              maxLength={5}
              placeholder="ECO"
              className="w-32 uppercase md:col-span-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <div>
              <Label htmlFor="startingNumber">Başlangıç numarası</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                İlk kart numarası
              </p>
            </div>
            <Input
              id="startingNumber"
              type="number"
              value={startingNumber}
              onChange={(e) => setStartingNumber(parseInt(e.target.value) || 1)}
              min={1}
              required
              className="w-32 md:col-span-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <Label htmlFor="description">Açıklama</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="EcoTech web sitesi yenilemesi"
              className="md:col-span-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <Label>İkon</Label>
            <div className="flex flex-wrap gap-2 md:col-span-3">
              {ICONS.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIcon(item.id)}
                  className={cn(
                    icon === item.id &&
                      "border-primary/50 bg-primary/20 text-primary",
                  )}
                >
                  <item.icon className="size-5" />
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <Label>Sahip</Label>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground md:col-span-3">
              <Avatar className="size-6">
                <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user?.email}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-center">
            <div>
              <Label>Gizli proje</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Sadece üyeler görebilir
              </p>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="md:col-span-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4 md:items-start">
            <Label className="pt-3">Üyeler</Label>
            <div className="relative md:col-span-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedMembers.length > 0 ? (
                      selectedMembers.slice(0, 3).map((m) => (
                        <Avatar key={m.id} className="size-7 border-2 border-card">
                          <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                            {m.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))
                    ) : (
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Users className="size-3.5" />
                      </div>
                    )}
                  </div>
                  <span>
                    {selectedMembers.length > 0
                      ? `${selectedMembers.length} üye seçildi`
                      : "Üye seçin..."}
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground" />
              </Button>

              {isMembersDropdownOpen ? (
                <div className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                  <div className="custom-scrollbar max-h-60 overflow-y-auto p-2">
                    {allUsers
                      .filter((u) => u.id !== user.id)
                      .map((u) => {
                        const isSelected = !!selectedMembers.find(
                          (m) => m.id === u.id,
                        )
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleMember(u)}
                            className="flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-accent"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                                  {u.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-foreground">
                                {u.email}
                              </span>
                            </div>
                            {isSelected ? (
                              <Check className="size-5 text-primary" />
                            ) : null}
                          </button>
                        )
                      })}
                    {allUsers.length <= 1 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Sistemde başka kullanıcı bulunamadı.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title || !identifier}
            >
              {isSubmitting ? "Oluşturuluyor..." : "Proje Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
