"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Briefcase,
  Compass,
  Folder,
  Heart,
  Layout,
  Map,
  MoreVertical,
  Rocket,
  Star,
  Target,
  Activity,
} from "lucide-react"
import EditBoardModal from "./EditBoardModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getBoardCoverUrl } from "@/lib/attachment-url"
import { resolveBoardIconId } from "@/lib/board-icons"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Folder,
  Briefcase,
  Layout,
  Activity,
  Star,
  Heart,
  Target,
  Compass,
  Rocket,
  Map,
}

export default function BoardCard({ board }: { board: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()
  const totalCards =
    board.columns?.reduce(
      (sum: number, col: any) => sum + (col._count?.cards || 0),
      0,
    ) || 0

  const IconComponent =
    ICONS[resolveBoardIconId(board.icon)] || Folder
  const coverUrl = getBoardCoverUrl(board.coverImage)

  return (
    <>
      <div className="group relative">
        <Card
          className={cn(
            "relative min-h-[220px] cursor-pointer overflow-hidden transition-all duration-200",
            "hover:ring-2 hover:ring-primary/20 hover:shadow-lg",
            coverUrl && "pt-0",
          )}
          onClick={() => router.push(`/b/${board.id}`)}
        >
          {coverUrl ? (
            <div className="relative h-28 w-full overflow-hidden">
              <img
                src={coverUrl}
                alt=""
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-card via-card/40 to-transparent" />
            </div>
          ) : null}

          <CardHeader className={cn("relative", coverUrl && "pt-4")}>
            <div className="flex items-start justify-between gap-3">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm",
                  coverUrl
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/15 text-primary",
                )}
              >
                <IconComponent className="size-5" />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsEditing(true)
                }}
              >
                <MoreVertical className="size-4" />
              </Button>
            </div>
            <CardTitle className="mt-3 line-clamp-1 text-lg">{board.name}</CardTitle>
            {board.description ? (
              <CardDescription className="line-clamp-2">
                {board.description}
              </CardDescription>
            ) : (
              <CardDescription>
                {board.identifier} panosu
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="mt-auto flex items-center justify-between gap-3 pt-0">
            <div className="flex min-w-0 items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                {board.identifier}
              </Badge>
              {totalCards > 0 ? (
                <Badge variant="secondary">{totalCards} görev</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Boş pano</span>
              )}
            </div>
            <div className="relative flex h-8 shrink-0 items-center">
              <span className="pr-1 text-xs whitespace-nowrap text-muted-foreground transition-opacity group-hover:opacity-0">
                {new Date(board.createdAt).toLocaleDateString("tr-TR")}
              </span>
              <div
                className={cn(
                  "absolute right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md",
                  "scale-90 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100",
                )}
              >
                <ArrowUpRight className="size-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing ? (
        <EditBoardModal board={board} onClose={() => setIsEditing(false)} />
      ) : null}
    </>
  )
}
