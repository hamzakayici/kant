import { prisma } from "../src/lib/prisma"
import bcrypt from "bcryptjs"
import type { Priority, Role } from "../src/generated/prisma/client/enums"
import { mergeCardContent } from "./mock-card-content"

const DEFAULT_COLUMNS = [
  { name: "Bekleyen", order: 0, category: "BACKLOG", color: "#94a3b8" },
  { name: "Yapılacak", order: 1, category: "UNSTARTED", color: "#facc15" },
  { name: "Devam Ediyor", order: 2, category: "ACTIVE", color: "#60a5fa" },
  { name: "Tamamlandı", order: 3, category: "DONE STATUS / WON", color: "#4ade80" },
]

const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
]

const MOCK_IMAGE_URLS = [
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80",
  "https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&q=80",
  "https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=1200&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&q=80",
  "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=1200&q=80",
  "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80",
  "https://images.unsplash.com/photo-1611162617474-5b21e939e113?w=1200&q=80",
  "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80",
]

const MOCK_PDF_ATTACHMENT = {
  filename: "proje-dokumani.pdf",
  url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  mimeType: "application/pdf",
  size: 13264,
}

type MockAttachment = {
  filename: string
  url: string
  mimeType: string
  size?: number
  width?: number
  height?: number
  useAsCover?: boolean
}

type MockCard = {
  title: string
  columnIndex: number
  priority?: Priority
  tags?: string[]
  description?: string
  daysUntilDue?: number
  daysFromStart?: number
  assigneeEmails?: string[]
  checklist?: { content: string; isDone: boolean }[]
  comment?: string
  comments?: string[]
  descriptionHistory?: string[]
  reminderMinutes?: number
  attachments?: MockAttachment[]
}

type MockProject = {
  name: string
  identifier: string
  description: string
  icon: string
  coverImage: string
  memberEmails: { email: string; role: Role }[]
  cards: MockCard[]
}

const MOCK_PROJECTS: MockProject[] = [
  {
    name: "Kant Platform",
    identifier: "KNT",
    description: "Kanban ve proje yönetim platformu geliştirme",
    icon: "Briefcase",
    coverImage: COVER_PRESETS[0],
    memberEmails: [
      { email: "admin@kant.com", role: "ADMIN" },
      { email: "hamzakayc@gmail.com", role: "ADMIN" },
      { email: "tasarim@kant.com", role: "DESIGNER" },
      { email: "editor@kant.com", role: "EDITOR" },
    ],
    cards: [
      {
        title: "Sidebar ve layout bileşenlerini güncelle",
        columnIndex: 2,
        priority: "HIGH",
        tags: ["ui", "frontend"],
        description: "Dashboard-01 tasarım sistemine geçiş.",
        daysUntilDue: 3,
        assigneeEmails: ["tasarim@kant.com"],
        checklist: [
          { content: "App sidebar", isDone: true },
          { content: "Nav bileşenleri", isDone: true },
          { content: "Mobil uyum", isDone: false },
        ],
        attachments: [
          {
            filename: "sidebar-tasarim.jpg",
            url: MOCK_IMAGE_URLS[0],
            mimeType: "image/jpeg",
            width: 1200,
            height: 800,
            useAsCover: true,
          },
          {
            ...MOCK_PDF_ATTACHMENT,
            filename: "layout-notlari.pdf",
          },
        ],
      },
      {
        title: "Telegram sohbet entegrasyonu",
        columnIndex: 2,
        priority: "MEDIUM",
        tags: ["backend", "telegram"],
        daysUntilDue: 7,
        assigneeEmails: ["admin@kant.com"],
        attachments: [
          {
            filename: "telegram-akisi.jpg",
            url: MOCK_IMAGE_URLS[1],
            mimeType: "image/jpeg",
            width: 1200,
            height: 800,
            useAsCover: true,
          },
        ],
      },
      {
        title: "Kart modalı performans iyileştirmesi",
        columnIndex: 1,
        priority: "LOW",
        tags: ["performans"],
        daysUntilDue: 14,
        attachments: [
          {
            filename: "performans-grafigi.jpg",
            url: MOCK_IMAGE_URLS[2],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "OpenCloud dosya depolama testleri",
        columnIndex: 3,
        priority: "NONE",
        tags: ["devops"],
        comment: "Tüm upload senaryoları doğrulandı.",
        attachments: [
          {
            filename: "opencloud-test.jpg",
            url: MOCK_IMAGE_URLS[3],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "test-raporu.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Rol ve yetki sistemi dokümantasyonu",
        columnIndex: 0,
        priority: "MEDIUM",
        tags: ["docs"],
        attachments: [
          {
            filename: "yetki-matrisi.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Planlayıcı sayfası yeniden tasarımı",
        columnIndex: 3,
        priority: "HIGH",
        tags: ["ui"],
        comment: "Yeni takvim ve görev listesi tamamlandı.",
        attachments: [
          {
            filename: "planlayici-onizleme.jpg",
            url: MOCK_IMAGE_URLS[4],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "planlayici-wireframe.jpg",
            url: MOCK_IMAGE_URLS[5],
            mimeType: "image/jpeg",
          },
        ],
      },
    ],
  },
  {
    name: "Web Sitesi Yenileme",
    identifier: "WEB",
    description: "Kurumsal web sitesi modernizasyon projesi",
    icon: "Layout",
    coverImage: COVER_PRESETS[1],
    memberEmails: [
      { email: "admin@kant.com", role: "ADMIN" },
      { email: "tasarim@kant.com", role: "DESIGNER" },
      { email: "talep@kant.com", role: "REQUESTER" },
    ],
    cards: [
      {
        title: "Ana sayfa hero bölümü tasarımı",
        columnIndex: 2,
        priority: "URGENT",
        tags: ["tasarım", "homepage"],
        daysUntilDue: 1,
        assigneeEmails: ["tasarim@kant.com"],
        checklist: [
          { content: "Wireframe", isDone: true },
          { content: "Görsel tasarım", isDone: false },
        ],
        attachments: [
          {
            filename: "hero-mockup.jpg",
            url: MOCK_IMAGE_URLS[6],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "marka-kilavuzu.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Blog sayfası şablonu",
        columnIndex: 1,
        priority: "MEDIUM",
        tags: ["içerik"],
        daysUntilDue: 10,
        attachments: [
          {
            filename: "blog-sablonu.jpg",
            url: MOCK_IMAGE_URLS[7],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "İletişim formu entegrasyonu",
        columnIndex: 0,
        priority: "LOW",
        tags: ["form"],
        attachments: [
          {
            filename: "form-alanlari.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "SEO meta etiketleri",
        columnIndex: 1,
        priority: "HIGH",
        tags: ["seo"],
        daysUntilDue: 5,
        assigneeEmails: ["editor@kant.com"],
        attachments: [
          {
            filename: "seo-checklist.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Mobil responsive kontroller",
        columnIndex: 3,
        priority: "MEDIUM",
        tags: ["qa"],
        attachments: [
          {
            filename: "mobil-test.jpg",
            url: MOCK_IMAGE_URLS[8],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "Footer link yapısı",
        columnIndex: 2,
        priority: "LOW",
        tags: ["içerik"],
        daysFromStart: -2,
        daysUntilDue: 4,
        attachments: [
          {
            filename: "footer-tasarim.jpg",
            url: MOCK_IMAGE_URLS[9],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
    ],
  },
  {
    name: "Mobil Uygulama",
    identifier: "MOB",
    description: "iOS ve Android uygulama geliştirme",
    icon: "Rocket",
    coverImage: COVER_PRESETS[2],
    memberEmails: [
      { email: "hamzakayc@gmail.com", role: "ADMIN" },
      { email: "tasarim@kant.com", role: "DESIGNER" },
      { email: "editor@kant.com", role: "EDITOR" },
    ],
    cards: [
      {
        title: "Onboarding ekranları",
        columnIndex: 2,
        priority: "HIGH",
        tags: ["ux", "mobile"],
        daysUntilDue: 6,
        assigneeEmails: ["tasarim@kant.com"],
        attachments: [
          {
            filename: "onboarding-ekranlari.jpg",
            url: MOCK_IMAGE_URLS[10],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "onboarding-akisi.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Push bildirim altyapısı",
        columnIndex: 0,
        priority: "MEDIUM",
        tags: ["backend"],
        attachments: [
          {
            filename: "push-bildirim-mockup.jpg",
            url: MOCK_IMAGE_URLS[11],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "App Store görselleri",
        columnIndex: 1,
        priority: "URGENT",
        tags: ["aso"],
        daysUntilDue: 2,
        assigneeEmails: ["tasarim@kant.com", "editor@kant.com"],
        attachments: [
          {
            filename: "app-store-screenshot-1.jpg",
            url: MOCK_IMAGE_URLS[12],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "app-store-screenshot-2.jpg",
            url: MOCK_IMAGE_URLS[13],
            mimeType: "image/jpeg",
          },
        ],
      },
      {
        title: "Karanlık mod desteği",
        columnIndex: 1,
        priority: "LOW",
        tags: ["ui"],
        attachments: [
          {
            filename: "dark-mode-onizleme.jpg",
            url: MOCK_IMAGE_URLS[14],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "Beta test kullanıcı listesi",
        columnIndex: 3,
        priority: "NONE",
        tags: ["qa"],
        comment: "50 test kullanıcısı davet edildi.",
        attachments: [
          {
            filename: "testflight-build.jpg",
            url: MOCK_IMAGE_URLS[15],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "beta-test-listesi.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
    ],
  },
  {
    name: "Pazarlama Kampanyası",
    identifier: "MKT",
    description: "Q3 dijital pazarlama ve lansman planı",
    icon: "Target",
    coverImage: COVER_PRESETS[3],
    memberEmails: [
      { email: "admin@kant.com", role: "ADMIN" },
      { email: "talep@kant.com", role: "REQUESTER" },
      { email: "editor@kant.com", role: "EDITOR" },
    ],
    cards: [
      {
        title: "Sosyal medya içerik takvimi",
        columnIndex: 2,
        priority: "HIGH",
        tags: ["sosyal", "içerik"],
        daysUntilDue: 4,
        assigneeEmails: ["editor@kant.com"],
        checklist: [
          { content: "Instagram", isDone: true },
          { content: "LinkedIn", isDone: true },
          { content: "X / Twitter", isDone: false },
        ],
        attachments: [
          {
            filename: "instagram-post.jpg",
            url: MOCK_IMAGE_URLS[16],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "sosyal-medya-takvimi.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "E-posta bülten şablonu",
        columnIndex: 1,
        priority: "MEDIUM",
        tags: ["email"],
        daysUntilDue: 8,
        attachments: [
          {
            filename: "email-sablonu.jpg",
            url: MOCK_IMAGE_URLS[17],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "Lansman landing page metinleri",
        columnIndex: 0,
        priority: "HIGH",
        tags: ["copywriting"],
        assigneeEmails: ["talep@kant.com"],
        attachments: [
          {
            filename: "landing-page-metinleri.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Reklam bütçesi onayı",
        columnIndex: 0,
        priority: "URGENT",
        tags: ["bütçe"],
        daysUntilDue: -1,
        attachments: [
          {
            filename: "reklam-butcesi.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
          {
            filename: "google-ads-banner.jpg",
            url: MOCK_IMAGE_URLS[18],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
      {
        title: "Influencer iş birliği listesi",
        columnIndex: 1,
        priority: "LOW",
        tags: ["pr"],
        attachments: [
          {
            filename: "influencer-listesi.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Kampanya performans raporu",
        columnIndex: 3,
        priority: "NONE",
        tags: ["analitik"],
        comment: "İlk hafta metrikleri olumlu.",
        attachments: [
          {
            filename: "kampanya-sonuclari.jpg",
            url: MOCK_IMAGE_URLS[19],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
          {
            filename: "kampanya-raporu.pdf",
            url: MOCK_PDF_ATTACHMENT.url,
            mimeType: MOCK_PDF_ATTACHMENT.mimeType,
            size: MOCK_PDF_ATTACHMENT.size,
          },
        ],
      },
      {
        title: "Basın bülteni taslağı",
        columnIndex: 2,
        priority: "MEDIUM",
        tags: ["pr"],
        daysFromStart: 0,
        daysUntilDue: 12,
        attachments: [
          {
            filename: "basin-bulteni-kapak.jpg",
            url: MOCK_IMAGE_URLS[0],
            mimeType: "image/jpeg",
            useAsCover: true,
          },
        ],
      },
    ],
  },
]

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d
}

const MOCK_CARD_ATTACHMENTS = new Map<string, MockAttachment[]>()
for (const project of MOCK_PROJECTS) {
  for (const card of project.cards) {
    const enriched = mergeCardContent(card)
    if (enriched.attachments?.length) {
      MOCK_CARD_ATTACHMENTS.set(card.title, enriched.attachments)
    }
  }
}

const COMMENT_AUTHORS = [
  "admin@kant.com",
  "tasarim@kant.com",
  "editor@kant.com",
  "talep@kant.com",
  "hamzakayc@gmail.com",
] as const

async function applyEnrichedContentToCard(
  cardId: string,
  mockCard: MockCard,
  usersByEmail: Record<string, { id: string }>,
  defaultAuthorId: string
) {
  const enriched = mergeCardContent(mockCard)

  await prisma.card.update({
    where: { id: cardId },
    data: {
      description: enriched.description,
      reminderMinutes: enriched.reminderMinutes ?? null,
    },
  })

  await prisma.checklistItem.deleteMany({ where: { cardId } })
  if (enriched.checklist?.length) {
    await prisma.checklistItem.createMany({
      data: enriched.checklist.map((item) => ({
        cardId,
        content: item.content,
        isDone: item.isDone,
      })),
    })
  }

  await prisma.comment.deleteMany({ where: { cardId } })
  const commentBodies =
    enriched.comments ?? (enriched.comment ? [enriched.comment] : [])
  for (const [index, content] of commentBodies.entries()) {
    const authorEmail = COMMENT_AUTHORS[index % COMMENT_AUTHORS.length]
    const authorId = usersByEmail[authorEmail]?.id ?? defaultAuthorId
    await prisma.comment.create({
      data: { cardId, content, authorId },
    })
  }

  await prisma.cardDescriptionHistory.deleteMany({ where: { cardId } })
  for (const [index, content] of (enriched.descriptionHistory ?? []).entries()) {
    await prisma.cardDescriptionHistory.create({
      data: {
        cardId,
        content,
        userId: defaultAuthorId,
        createdAt: new Date(Date.now() - (index + 1) * 86_400_000),
      },
    })
  }
}

async function enrichMockProjectContent(
  usersByEmail: Record<string, { id: string }>
) {
  const boards = await prisma.board.findMany({
    where: { identifier: { in: MOCK_PROJECTS.map((p) => p.identifier) } },
    include: {
      columns: { include: { cards: true } },
    },
  })

  const mockByTitle = new Map<string, MockCard>()
  for (const project of MOCK_PROJECTS) {
    for (const card of project.cards) {
      mockByTitle.set(card.title, card)
    }
  }

  const defaultAuthorId = usersByEmail["admin@kant.com"]?.id
  if (!defaultAuthorId) return

  let enrichedCount = 0

  for (const board of boards) {
    for (const column of board.columns) {
      for (const card of column.cards) {
        const mockCard = mockByTitle.get(card.title)
        if (!mockCard) continue

        await applyEnrichedContentToCard(
          card.id,
          mockCard,
          usersByEmail,
          defaultAuthorId
        )
        enrichedCount++
      }
    }
  }

  if (enrichedCount > 0) {
    console.log(`✓ ${enrichedCount} kart içeriği zenginleştirildi.`)
  }
}

async function createCardAttachments(
  cardId: string,
  attachments: MockAttachment[]
) {
  let coverAttachmentId: string | null = null

  for (const attachment of attachments) {
    if (!attachment.url) continue

    const created = await prisma.attachment.create({
      data: {
        filename: attachment.filename,
        path: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size ?? 0,
        width: attachment.width ?? null,
        height: attachment.height ?? null,
        storageProvider: "OPENCLOUD",
        cardId,
      },
    })

    if (attachment.useAsCover) {
      coverAttachmentId = created.id
    }
  }

  if (coverAttachmentId) {
    await prisma.card.update({
      where: { id: cardId },
      data: { coverAttachmentId, coverMode: "full" },
    })
  }
}

async function enrichMockProjectMedia() {
  const boards = await prisma.board.findMany({
    where: { identifier: { in: MOCK_PROJECTS.map((p) => p.identifier) } },
    include: {
      columns: {
        include: {
          cards: {
            include: { attachments: true },
          },
        },
      },
    },
  })

  let enrichedCount = 0

  for (const board of boards) {
    for (const column of board.columns) {
      for (const card of column.cards) {
        if (card.attachments.length > 0) continue

        const mockAttachments = MOCK_CARD_ATTACHMENTS.get(card.title)
        if (!mockAttachments?.length) continue

        await createCardAttachments(card.id, mockAttachments)
        enrichedCount++
      }
    }
  }

  if (enrichedCount > 0) {
    console.log(`✓ ${enrichedCount} karta görsel ve ek dosyalar eklendi.`)
  } else {
    console.log("Tüm mock kartlarda ekler zaten mevcut.")
  }
}

async function seedMockProjects(usersByEmail: Record<string, { id: string }>) {
  const existing = await prisma.board.findFirst({
    where: { identifier: "KNT" },
  })

  if (existing) {
    console.log("Mock projeler zaten mevcut, içerik zenginleştiriliyor...")
    await enrichMockProjectContent(usersByEmail)
    await enrichMockProjectMedia()
    return
  }

  const now = new Date()

  for (const [index, project] of MOCK_PROJECTS.entries()) {
    const adminUser =
      usersByEmail[project.memberEmails[0]?.email] ?? usersByEmail["admin@kant.com"]

    const board = await prisma.board.create({
      data: {
        name: project.name,
        identifier: project.identifier,
        description: project.description,
        icon: project.icon,
        coverImage: project.coverImage,
        order: index,
        sequenceCounter: project.cards.length + 1,
        members: {
          create: project.memberEmails.map((member) => ({
            userId: usersByEmail[member.email].id,
            role: member.role,
          })),
        },
        columns: {
          create: DEFAULT_COLUMNS,
        },
      },
      include: { columns: { orderBy: { order: "asc" } } },
    })

    for (const [cardIndex, rawCard] of project.cards.entries()) {
      const mockCard = mergeCardContent(rawCard)
      const column = board.columns[mockCard.columnIndex]
      if (!column) continue

      const assigneeIds = (mockCard.assigneeEmails ?? [])
        .map((email) => usersByEmail[email]?.id)
        .filter(Boolean)

      const commentBodies =
        mockCard.comments ?? (mockCard.comment ? [mockCard.comment] : [])

      const card = await prisma.card.create({
        data: {
          title: mockCard.title,
          description: mockCard.description,
          sequenceId: cardIndex + 1,
          order: cardIndex,
          priority: mockCard.priority ?? "NONE",
          tags: mockCard.tags ?? [],
          columnId: column.id,
          creatorId: adminUser.id,
          reminderMinutes: mockCard.reminderMinutes ?? null,
          startDate:
            mockCard.daysFromStart !== undefined
              ? addDays(now, mockCard.daysFromStart)
              : undefined,
          dueDate:
            mockCard.daysUntilDue !== undefined
              ? addDays(now, mockCard.daysUntilDue)
              : undefined,
          assignees:
            assigneeIds.length > 0
              ? { connect: assigneeIds.map((id) => ({ id })) }
              : undefined,
          checklists: mockCard.checklist
            ? {
                create: mockCard.checklist.map((item) => ({
                  content: item.content,
                  isDone: item.isDone,
                })),
              }
            : undefined,
          comments:
            commentBodies.length > 0
              ? {
                  create: commentBodies.map((content, index) => ({
                    content,
                    authorId:
                      usersByEmail[COMMENT_AUTHORS[index % COMMENT_AUTHORS.length]]
                        ?.id ?? adminUser.id,
                  })),
                }
              : undefined,
          descriptionHistories:
            mockCard.descriptionHistory && mockCard.descriptionHistory.length > 0
              ? {
                  create: mockCard.descriptionHistory.map((content, index) => ({
                    content,
                    userId: adminUser.id,
                    createdAt: new Date(Date.now() - (index + 1) * 86_400_000),
                  })),
                }
              : undefined,
          activities: {
            create: {
              action: "Kart oluşturuldu (mock veri)",
              userId: adminUser.id,
            },
          },
        },
      })

      await prisma.activityLog.create({
        data: {
          action: `'${mockCard.title}' kartı oluşturuldu`,
          cardId: card.id,
          userId: adminUser.id,
        },
      })

      if (mockCard.attachments?.length) {
        await createCardAttachments(card.id, mockCard.attachments)
      }
    }

    console.log(`✓ ${project.name} (${project.cards.length} kart)`)
  }
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@kant.com"
  const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD ?? "admin123"
  const adminPassword = await bcrypt.hash(adminPasswordPlain, 10)

  if (process.env.KANT_SEED_MINIMAL === "true") {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        firstName: "Admin",
        lastName: "Kullanıcı",
        role: "ADMIN",
        mustChangePassword: false,
        isActive: true,
        isSuperAdmin: true,
        password: adminPassword,
      },
      create: {
        email: adminEmail,
        firstName: "Admin",
        lastName: "Kullanıcı",
        password: adminPassword,
        role: "ADMIN",
        mustChangePassword: false,
        isActive: true,
      },
    })
    console.log(`Minimal seed: ${adminEmail} (ADMIN)`)
    return
  }

  const userPassword = await bcrypt.hash(process.env.SEED_USER_PASSWORD ?? "user123", 10)
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "hamzakayc@gmail.com"
  const ownerPasswordPlain = process.env.SEED_OWNER_PASSWORD

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { firstName: "Sistem", lastName: "Yöneticisi" },
    create: {
      email: adminEmail,
      firstName: "Sistem",
      lastName: "Yöneticisi",
      password: adminPassword,
      role: "ADMIN",
      mustChangePassword: false,
    },
  })

  const hamzaAdmin = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      firstName: "Hamza",
      lastName: "Kayıcı",
      role: "ADMIN",
      mustChangePassword: false,
      isActive: true,
      isSuperAdmin: true,
      ...(ownerPasswordPlain
        ? { password: await bcrypt.hash(ownerPasswordPlain, 10) }
        : {}),
    },
    create: {
      email: ownerEmail,
      firstName: "Hamza",
      lastName: "Kayıcı",
      password: await bcrypt.hash(ownerPasswordPlain ?? process.env.SEED_ADMIN_PASSWORD ?? "admin123", 10),
      role: "ADMIN",
      mustChangePassword: false,
      isActive: true,
      isSuperAdmin: true,
    },
  })

  const requester = await prisma.user.upsert({
    where: { email: "talep@kant.com" },
    update: { firstName: "Ayşe", lastName: "Demir" },
    create: {
      email: "talep@kant.com",
      firstName: "Ayşe",
      lastName: "Demir",
      password: userPassword,
      role: "REQUESTER",
      mustChangePassword: false,
    },
  })

  const designer = await prisma.user.upsert({
    where: { email: "tasarim@kant.com" },
    update: { firstName: "Elif", lastName: "Yıldız" },
    create: {
      email: "tasarim@kant.com",
      firstName: "Elif",
      lastName: "Yıldız",
      password: userPassword,
      role: "DESIGNER",
      mustChangePassword: false,
    },
  })

  const editor = await prisma.user.upsert({
    where: { email: "editor@kant.com" },
    update: { firstName: "Mehmet", lastName: "Kaya" },
    create: {
      email: "editor@kant.com",
      firstName: "Mehmet",
      lastName: "Kaya",
      password: userPassword,
      role: "EDITOR",
      mustChangePassword: false,
    },
  })

  const usersByEmail = {
    "admin@kant.com": admin,
    "hamzakayc@gmail.com": hamzaAdmin,
    "talep@kant.com": requester,
    "tasarim@kant.com": designer,
    "editor@kant.com": editor,
  }

  console.log("Kullanıcılar hazır.")
  await seedMockProjects(usersByEmail)
  console.log("Seed tamamlandı.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
