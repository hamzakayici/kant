import { cardShareSelect } from "@/lib/card-share"

export const chatMessageInclude = {
  author: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  attachments: true,
  card: {
    select: cardShareSelect,
  },
  replyTo: {
    include: {
      author: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
      attachments: true,
      card: {
        select: cardShareSelect,
      },
    },
  },
} as const
