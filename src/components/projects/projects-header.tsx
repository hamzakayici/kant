import GlobalSearch from "@/components/GlobalSearch"
import CreateProjectWrapper from "@/components/CreateProjectWrapper"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function ProjectsHeader({
  user,
  allUsers,
  canCreateBoard = false,
}: {
  user: { id: string; email?: string | null; role?: string }
  allUsers?: { id: string; email: string; role?: string }[]
  canCreateBoard?: boolean
}) {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator
          orientation="vertical"
          className="hidden h-4 md:block data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Projeler</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Çalışma Alanları
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreateBoard
              ? "Devam etmek için bir proje seçin veya yeni bir tane oluşturun"
              : "Devam etmek için bir proje seçin"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canCreateBoard ? (
            <CreateProjectWrapper user={user} allUsers={allUsers} />
          ) : null}
          <GlobalSearch />
        </div>
      </div>
    </div>
  )
}
