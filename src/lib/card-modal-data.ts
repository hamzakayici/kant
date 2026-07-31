export const cardModalInclude = {
  assignees: true,
  creator: true,
  attachments: { orderBy: { createdAt: "desc" as const } },
  comments: {
    include: { author: true },
    orderBy: { createdAt: "desc" as const },
  },
  checklists: { orderBy: { createdAt: "asc" as const } },
  activities: {
    include: { user: true },
    orderBy: { createdAt: "desc" as const },
  },
  column: {
    select: { id: true, name: true, boardId: true },
  },
} as const
