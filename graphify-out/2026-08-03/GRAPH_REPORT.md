# Graph Report - kant  (2026-08-03)

## Corpus Check
- 259 files · ~102,244 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1621 nodes · 4243 edges · 117 communities (68 shown, 49 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `932d5c8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- compilerOptions
- Prisma 7 Driver Adapter Implementation Guide
- Model Queries
- Driver Adapters
- Upgrade to Prisma ORM 7
- Server Actions
- Relation Queries
- Removed Features
- Özellikler
- roleActions.ts
- Raw Queries
- Prisma CLI Reference
- Client Methods
- Filter Conditions and Operators
- Query Options
- Dağıtım
- prisma db push
- prisma dev
- prisma generate
- prisma studio
- Prisma Client API Reference
- Troubleshooting Prisma Compute
- Prisma Config
- prisma.ts
- actions.ts
- prisma migrate dev
- prisma db seed
- Environment Variables
- Kimlik Doğrulama ve Yetkiler
- Başlangıç Rehberi
- page.tsx
- useModal
- prisma db pull
- prisma init
- prisma migrate deploy
- Prisma Database Setup
- Prisma Accelerate Users
- ESM and CommonJS Support
- Constructor Options
- Schema Changes
- Transactions
- Workflow
- KanbanBoard.tsx
- auth.ts
- Prisma Compute Framework Readiness
- MongoDB Setup
- Core Workflows
- Modeller
- prisma db execute
- Prisma Platform CLI App Deploy
- MySQL Setup
- management-api
- prisma migrate diff
- prisma migrate reset
- PostgreSQL Setup
- Prisma Postgres Setup
- SQLite Setup
- SQL Server Setup
- create-db-cli
- api-basics
- Column.tsx
- prisma format
- prisma migrate resolve
- prisma validate
- CockroachDB Setup
- decision-stay-or-migrate
- console-and-connections
- README.md
- prisma migrate status
- Prisma Compute
- migrations-mapping
- schema-contract-mapping
- Prisma MongoDB Upgrade Path
- management-api-sdk
- Mimari
- page.tsx
- layout.tsx
- dependencies
- page.tsx
- seed-users.js
- page.tsx
- next-auth.d.ts
- DatePickerPopover.tsx
- AGENTS.md
- bcryptjs
- clsx
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- eslint.config.mjs
- jszip
- lucide-react
- next
- next-auth
- next.config.ts
- pg
- @prisma/adapter-pg
- @prisma/client
- react
- react-dom
- tailwind-merge
- @tailwindcss/typography
- @tiptap/extension-bubble-menu
- @tiptap/extension-text-style
- @tiptap/extension-underline
- @tiptap/pm
- @tiptap/react
- @tiptap/starter-kit
- postcss.config.mjs
- { GET, POST }
- README.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 234 edges
2. `getUserDisplayName()` - 55 edges
3. `Button()` - 43 edges
4. `prisma` - 40 edges
5. `isTelegramEnabled()` - 35 edges
6. `scripts` - 30 edges
7. `ChatPageClient()` - 29 edges
8. `getUserPermissions()` - 29 edges
9. `getUserInitial()` - 29 edges
10. `handleTelegramUpdate()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `KanbanBoard()` --indirect_call--> `card()`  [INFERRED]
  src/components/KanbanBoard.tsx → prisma/mock-card-content.ts
- `CardModal()` --references--> `jszip`  [EXTRACTED]
  src/components/card-modal/CardModal.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `ToggleGroupItem()` --references--> `react`  [EXTRACTED]
  src/components/ui/toggle-group.tsx → package.json
- `searchCards()` --indirect_call--> `card()`  [INFERRED]
  src/app/actions.ts → prisma/mock-card-content.ts

## Import Cycles
- None detected.

## Communities (117 total, 49 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.10
Nodes (21): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tsx, @types/bcryptjs, @types/file-saver (+13 more)

### Community 1 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 2 - "Prisma 7 Driver Adapter Implementation Guide"
Cohesion: 0.07
Nodes (46): AppSidebar(), AppSidebarProps, navMain, navSecondary, NavDocuments(), NavMain(), NavSecondary(), NavUser() (+38 more)

### Community 3 - "Model Queries"
Cohesion: 0.09
Nodes (39): adminGenerateTelegramLinkCodeForUser(), adminLinkTelegramAccount(), adminLookupTelegramUser(), adminUnlinkTelegramAccount(), cancelMtprotoSenderSetup(), clearTelegramWebhook(), completeMtprotoSenderSetup(), discoverTelegramTopics() (+31 more)

### Community 4 - "Driver Adapters"
Cohesion: 0.10
Nodes (32): cardShareInclude, createForumTopic(), getForumTopic(), safeTelegramCall(), TelegramMessage, resolveTelegramOutboundSender(), TelegramOutboundSender, TelegramSenderNotReadyError (+24 more)

### Community 5 - "Upgrade to Prisma ORM 7"
Cohesion: 0.19
Nodes (10): TelegramUserMapping, FilterMode, AvatarImage(), Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader() (+2 more)

### Community 6 - "Server Actions"
Cohesion: 0.14
Nodes (13): API ve Server Actions, Arama, Checklist, Dosya ve Paylaşım, Hata Yönetimi, Kart İşlemleri (`src/app/actions.ts`), Kolon, Proje / Board (+5 more)

### Community 7 - "Relation Queries"
Cohesion: 0.13
Nodes (21): callTelegramApi(), deleteTelegramMessage(), downloadTelegramFile(), editForumTopic(), editTelegramMessage(), ForumTopic, getTelegramFile(), sendTelegramMediaFile() (+13 more)

### Community 8 - "Removed Features"
Cohesion: 0.15
Nodes (35): POST(), sendTelegramMessage(), getTelegramBotUsername(), getTelegramWebhookSecret(), getTelegramInboundContent(), AppSettingsDelegate, getAppSettingsDelegate(), getTelegramDefaultTopicIdFromEnv() (+27 more)

### Community 9 - "Özellikler"
Cohesion: 0.08
Nodes (24): Arama, Board Ayarları, Dashboard, Dosya Yönetimi, Dışa Aktarım, Filtreleme, Görüntüleme, Görünüm Modları (+16 more)

### Community 10 - "roleActions.ts"
Cohesion: 0.09
Nodes (41): createCard(), createProject(), deleteBoard(), deleteCard(), getCardForModal(), reorderBoards(), assignUserRole(), changeMyPassword() (+33 more)

### Community 11 - "Raw Queries"
Cohesion: 0.07
Nodes (30): scripts, build, db:generate, db:normalize-orders, db:push, db:seed, dev, docker:down (+22 more)

### Community 12 - "Prisma CLI Reference"
Cohesion: 0.22
Nodes (21): main(), buildRemotePath(), ensureBoardOpenCloudStructure(), getBoardRoot(), resolveBoard(), resolveCard(), resolveChatGroup(), StoredFile (+13 more)

### Community 13 - "Client Methods"
Cohesion: 0.22
Nodes (8): KanbanBoardSkeleton(), KanbanBoardSkeletonProps, KanbanCardSkeleton(), KanbanCardSkeletonProps, KanbanColumnSkeleton(), KanbanColumnSkeletonProps, BoardCardSkeleton(), Skeleton()

### Community 14 - "Filter Conditions and Operators"
Cohesion: 0.14
Nodes (21): updateBoard(), BoardCard(), EditBoardModal(), BoardHeader(), BoardHeaderProps, BoardMember, BoardUser, ICONS (+13 more)

### Community 15 - "Query Options"
Cohesion: 0.13
Nodes (23): deleteColumn(), moveColumnPosition(), updateColumn(), updateColumnAllowedRoles(), CATEGORIES, CATEGORY_LABELS, COLORS, ProcessStatesClient() (+15 more)

### Community 16 - "Dağıtım"
Cohesion: 0.07
Nodes (27): 1. Ortam dosyası, 1. Ortam Hazırlığı, 2. Build, 2. Docker ile production, 3. SSL (Let's Encrypt), 3. Çalıştırma, 4. Sunucuda harici Nginx kullanıyorsanız, 5. Telegram webhook (production) (+19 more)

### Community 17 - "prisma db push"
Cohesion: 0.15
Nodes (25): ChatPageClient(), ChatNotifications(), ChatNotificationsProps, EMPTY_GROUPS, getGroupsSignature(), useChatGroupsLive(), useMarkChatGroupRead(), fetchChatGroups() (+17 more)

### Community 18 - "prisma dev"
Cohesion: 0.28
Nodes (15): isOpenCloudInsecure(), buildDavUrl(), createOpenCloudPublicShare(), davRequest(), deleteFromOpenCloud(), downloadFromOpenCloud(), ensureOpenCloudDirectory(), getAuthHeader() (+7 more)

### Community 19 - "prisma generate"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 20 - "prisma studio"
Cohesion: 0.06
Nodes (39): ColumnCardList, ColumnCardListComponent(), ColumnCardListProps, mapVirtualIndex(), useColumnScrollRoot(), KanbanBoardDndContext, KanbanBoardDndContextValue, useKanbanBoardDndOptional() (+31 more)

### Community 21 - "Prisma Client API Reference"
Cohesion: 0.16
Nodes (22): BoardFilter(), ChatComposer(), ChatComposerProps, ChatMessageBubble(), ChatMessageBubbleProps, ChatMessageItem, ChatMessageContent(), CardShareSnapshot (+14 more)

### Community 22 - "Troubleshooting Prisma Compute"
Cohesion: 0.23
Nodes (14): envFilePath, main(), upsertEnvFile(), authHeader(), bootstrapOpenCloud(), discoverSpaceId(), encodeWebDavBaseForEnv(), ensureOpenCloudRoot() (+6 more)

### Community 23 - "Prisma Config"
Cohesion: 0.12
Nodes (16): Bağlantı hatası, Depolama Modları, Docker tam stack (önerilen), Dosya URL'leri, Giriş başarısız (Logon failed), Görseller yüklenmiyor, Klasör Yapısı, Mevcut Dosyaları Senkronize Etme (+8 more)

### Community 24 - "prisma.ts"
Cohesion: 0.17
Nodes (25): createShareLink(), GET(), GET(), POST(), formatBytes(), PublicSharePage(), CardModalAttachments(), CardModalAttachmentsProps (+17 more)

### Community 25 - "actions.ts"
Cohesion: 0.15
Nodes (25): addCardComment(), addChecklistItem(), deleteAttachment(), deleteChecklistItem(), editChecklistItem(), getCardDescriptionHistory(), moveCard(), toggleCardAssignee() (+17 more)

### Community 26 - "prisma migrate dev"
Cohesion: 0.11
Nodes (11): GET(), GET(), { handlers, signIn, signOut, auth }, canUserAccessAttachment(), adapter, createPrismaClient(), getPrismaClient(), globalForPrisma (+3 more)

### Community 27 - "prisma db seed"
Cohesion: 0.20
Nodes (22): main(), processUpdate(), sleep(), main(), discoverTelegramChats(), getTelegramBotHealth(), getTelegramIntegrationStatus(), getTelegramStatus() (+14 more)

### Community 28 - "Environment Variables"
Cohesion: 0.14
Nodes (13): 1. Telegram Bot Oluşturma, 2. Telegram Süper Grup, 3. Webhook Kaydı, 4. Kullanıcı Hesap Bağlama, Akış, Kurulum, Mimari, Sorun Giderme (+5 more)

### Community 29 - "Kimlik Doğrulama ve Yetkiler"
Cohesion: 0.11
Nodes (17): 1. Legacy Enum Rolleri, 2. Dinamik CustomRole, API Route Kimlik Doğrulama, Credentials Provider, Hesap Askıya Alma, Hesap Güvenliği, İzin Sistemi, Kimlik Doğrulama Akışı (+9 more)

### Community 30 - "Başlangıç Rehberi"
Cohesion: 0.11
Nodes (18): 1. Projeyi klonlayın, 2. Bağımlılıkları yükleyin, 3. Ortam değişkenlerini ayarlayın, 4. Veritabanını hazırlayın (yalnızca yerel dev), 5. Geliştirme sunucusunu başlatın, Başlangıç Rehberi, Büyük dosya / Trello import hatası, Docker ile Tam Stack (+10 more)

### Community 31 - "page.tsx"
Cohesion: 0.12
Nodes (26): createChatGroup(), deleteChatMessage(), editChatMessage(), sendChatMessage(), ChatDropOverlay(), ChatPageClientProps, ChatQuotedMessage(), QuotedMessage (+18 more)

### Community 32 - "useModal"
Cohesion: 0.15
Nodes (17): AttachmentShareLinkDialogProps, ConfirmModalProps, ICONS, AVAILABLE_ICONS, COVER_PRESETS, PromptModalProps, ModalContext, ModalContextType (+9 more)

### Community 33 - "prisma db pull"
Cohesion: 0.27
Nodes (10): ChatPendingAttachments(), isVoiceAttachment(), useChatMediaUpload(), useVoiceRecorder(), appendImageDimensions(), extractFilesFromClipboard(), getVoiceRecordingMimeType(), PendingChatAttachment (+2 more)

### Community 34 - "prisma init"
Cohesion: 0.10
Nodes (23): assertCanAccessCard(), ChatGroupBase, enrichChatGroupsBatch(), getUserChatGroups(), markChatGroupAsRead(), shareCardToChat(), getChatMessages(), POST() (+15 more)

### Community 35 - "prisma migrate deploy"
Cohesion: 0.23
Nodes (11): ExtractedTelegramMedia, extractTelegramMedia(), fileRefToMedia(), getTelegramMessageBody(), isAudioMimeType(), isImageMimeType(), isVideoMimeType(), TelegramFileRef (+3 more)

### Community 36 - "Prisma Database Setup"
Cohesion: 0.28
Nodes (11): getUserBoardsForChat(), ChatPage(), ChatPageProps, buildForumSendParams(), getApiCredentials(), isMtprotoConfigured(), sendUserForumFiles(), sendUserForumMessage() (+3 more)

### Community 37 - "Prisma Accelerate Users"
Cohesion: 0.18
Nodes (14): addBoardMember(), canManageBoardMembers(), removeBoardMember(), BoardMember, BoardMembersPopover(), BoardUser, Checkbox(), Label() (+6 more)

### Community 38 - "ESM and CommonJS Support"
Cohesion: 0.14
Nodes (13): CardModalSkeleton(), DashboardShell(), DashboardShellProps, GlobalChat(), GlobalChatProps, CardModalContext, CardModalContextValue, CardModalProvider() (+5 more)

### Community 39 - "Constructor Options"
Cohesion: 0.25
Nodes (8): 1. Image'in build edilmesi, 2. Dockge'de stack oluştur, 3. Environment değişkenleri, 4. Erişim, 5. Güncelleme, docker-compose.yml vs compose.dockge.yml, Dockge ile Deploy (yalnızca YAML), Sorun giderme

### Community 40 - "Schema Changes"
Cohesion: 0.22
Nodes (8): name, prisma, seed, private, repository, type, url, version

### Community 41 - "Transactions"
Cohesion: 0.28
Nodes (5): ActivityItem, InboxActivityPane(), InboxActivityPaneProps, InboxSidebar(), InboxSidebarProps

### Community 42 - "Workflow"
Cohesion: 0.36
Nodes (5): main(), CardRow, normalizeBoardCardOrders(), normalizeColumnCardOrders(), Tx

### Community 43 - "KanbanBoard.tsx"
Cohesion: 0.26
Nodes (13): createColumn(), reorderColumns(), ConfirmModal(), KanbanBoard(), applyCardDragOver(), applyCardMoveAtIndex(), applyColumnReorder(), BoardColumn (+5 more)

### Community 44 - "auth.ts"
Cohesion: 0.31
Nodes (5): CardModalHeaderProps, Badge(), badgeVariants, Button(), buttonVariants

### Community 45 - "Prisma Compute Framework Readiness"
Cohesion: 0.62
Nodes (6): clampIndex(), computeDropIndex(), computeFromDom(), computeVisibleInsertIndex(), countRenderedVisibleCards(), mapVisibleInsertToDropIndex()

### Community 46 - "MongoDB Setup"
Cohesion: 0.17
Nodes (12): API Routes, Dosya İşlemleri, Dışa Aktarım, `GET /api/attachments/[id]`, `GET /api/download/[token]`, `GET /api/export/trello?boardId=<id>`, `GET /api/s/[token]`, `GET/POST /api/auth/[...nextauth]` (+4 more)

### Community 47 - "Core Workflows"
Cohesion: 0.25
Nodes (13): POST(), getOpenCloudConfig(), getOpenCloudPublicUrl(), getStorageProvider(), normalizeWebDavBase(), requireOpenCloudStorage(), StorageProvider, resolvePublicUrl() (+5 more)

### Community 48 - "Modeller"
Cohesion: 0.09
Nodes (22): ActivityLog, Attachment, Bağlantı, Board, BoardMember, Card, CardDescriptionHistory, ChatGroup / ChatGroupMember / ChatMessage (+14 more)

### Community 49 - "prisma db execute"
Cohesion: 0.57
Nodes (5): ShareCardToChatDialog(), ShareCardToChatDialogProps, boardKey(), getLastShareChatGroupId(), rememberLastShareChatGroupId()

### Community 61 - "Column.tsx"
Cohesion: 0.60
Nodes (3): CreateProjectWrapper(), FileUploader(), useModal()

### Community 68 - "README.md"
Cohesion: 0.33
Nodes (6): Hızlı Başlangıç, İçindekiler, Kant Dokümantasyonu, Kod Tabanı Grafiği, Teknoloji Özeti, Varsayılan Kullanıcılar

### Community 73 - "Prisma Compute"
Cohesion: 0.15
Nodes (13): Cursor Entegrasyonu, Git Hook (Opsiyonel), Grafiği Oluşturma, Graphify — Kod Tabanı Bilgi Grafiği, İnteraktif Görselleştirme, Kod Değişikliği Sonrası, Kurulum, NPM Scriptleri (+5 more)

### Community 79 - "Mimari"
Cohesion: 0.11
Nodes (19): Bileşen Mimarisi, Board Çekirdeği, Dashboard, Dizin Yapısı, Dosya Yükleme, Genel Bakış, Görünümler, İletişim (+11 more)

### Community 85 - "page.tsx"
Cohesion: 0.07
Nodes (44): card(), ENRICHED_CARD_CONTENT, EnrichedCardContent, EnrichedChecklistItem, mergeCardContent(), addDays(), applyEnrichedContentToCard(), COMMENT_AUTHORS (+36 more)

### Community 86 - "layout.tsx"
Cohesion: 0.11
Nodes (34): GET(), toDataUrl(), generateMetadata(), getCardOgImageUrl(), buildCardShareTelegramPayload(), buildCardShareTelegramReplyMarkup(), CardShareAttachment, cardShareRelations (+26 more)

### Community 96 - "page.tsx"
Cohesion: 0.08
Nodes (36): authenticate(), ChatMessageSearchBar(), CreateProjectModal(), LoginForm(), AvatarBadge(), AvatarGroup(), AvatarGroupCount(), DialogOverlay() (+28 more)

### Community 100 - "page.tsx"
Cohesion: 0.17
Nodes (17): ICONS, HOURS, PlannerDayScheduleProps, PlannerTaskListProps, ProjectsStats(), Card(), CardAction(), CardContent() (+9 more)

### Community 101 - "next-auth.d.ts"
Cohesion: 0.33
Nodes (5): JWT, next-auth, next-auth/jwt, Session, User

### Community 103 - "DatePickerPopover.tsx"
Cohesion: 0.11
Nodes (30): BoardTimelineView(), dayDiff(), getBarMetrics(), startOfDay(), TimelineCard, toDate(), Card(), CardModalActivity() (+22 more)

### Community 108 - "@dnd-kit/sortable"
Cohesion: 0.18
Nodes (11): @base-ui/react, class-variance-authority, @dnd-kit/sortable, dependencies, @base-ui/react, class-variance-authority, @dnd-kit/sortable, @tiptap/extension-color (+3 more)

### Community 119 - "react"
Cohesion: 0.06
Nodes (49): react, react, ChartAreaInteractive(), chartData, chartData, columns, DataTable(), schema (+41 more)

### Community 135 - "README.md"
Cohesion: 0.23
Nodes (4): Docker, Dokümantasyon, Hızlı başlangıç, Kant

## Knowledge Gaps
- **490 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+485 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `page.tsx` to `Prisma 7 Driver Adapter Implementation Guide`, `Model Queries`, `Upgrade to Prisma ORM 7`, `roleActions.ts`, `Client Methods`, `Filter Conditions and Operators`, `Query Options`, `prisma db push`, `Prisma Client API Reference`, `prisma.ts`, `actions.ts`, `page.tsx`, `useModal`, `prisma db pull`, `prisma init`, `Prisma Accelerate Users`, `KanbanBoard.tsx`, `auth.ts`, `page.tsx`, `page.tsx`, `DatePickerPopover.tsx`, `react`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `dependencies` connect `@dnd-kit/sortable` to `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, `Schema Changes`, `MySQL Setup`, `prisma migrate diff`, `prisma migrate reset`, `PostgreSQL Setup`, `Prisma Postgres Setup`, `SQLite Setup`, `SQL Server Setup`, `create-db-cli`, `api-basics`, `prisma format`, `prisma migrate resolve`, `prisma validate`, `CockroachDB Setup`, `dependencies`, `bcryptjs`, `clsx`, `@dnd-kit/core`, `@dnd-kit/utilities`, `jszip`, `lucide-react`, `next`, `next-auth`, `pg`, `@prisma/adapter-pg`, `@prisma/client`, `react`, `react-dom`, `tailwind-merge`, `@tailwindcss/typography`, `@tiptap/extension-bubble-menu`, `@tiptap/extension-text-style`, `@tiptap/extension-underline`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `page.tsx`, `Prisma 7 Driver Adapter Implementation Guide`, `@dnd-kit/sortable`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Prisma 7 Driver Adapter Implementation Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._