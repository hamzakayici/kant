# Mimari

## Genel Bakış

Kant, Next.js App Router mimarisi üzerine kurulu full-stack bir uygulamadır. İş mantığının büyük kısmı **Server Actions** ile, dosya işlemleri ve dışa aktarım ise **API Routes** ile yönetilir.

```
┌─────────────────────────────────────────────────────┐
│                    Tarayıcı (React)                  │
│  KanbanBoard, CardModal, ChatPanel, Sidebar...      │
└──────────────────────┬──────────────────────────────┘
                       │ Server Actions / fetch
┌──────────────────────▼──────────────────────────────┐
│              Next.js App Router (Server)             │
│  actions.ts │ roleActions │ trelloActions │ API     │
└──────────────────────┬──────────────────────────────┘
                       │ Prisma Client
┌──────────────────────▼──────────────────────────────┐
│                   PostgreSQL                         │
└─────────────────────────────────────────────────────┘
         uploads/ (yerel dosya depolama)
```

## Teknoloji Yığını

| Katman | Teknoloji | Versiyon |
|--------|-----------|----------|
| Framework | Next.js | 16.2 |
| UI | React | 19.2 |
| Stil | Tailwind CSS | 4 |
| ORM | Prisma | 7.9 |
| Veritabanı | PostgreSQL | 15 |
| Auth | NextAuth | 5 (beta) |
| Rich Text | TipTap | 3.29 |
| Drag & Drop | @dnd-kit | 6.x |
| İkonlar | Lucide React | 1.27 |
| Tarih | date-fns | 4.4 |

## Dizin Yapısı

```
kant/
├── prisma/
│   ├── schema.prisma          # Veritabanı şeması
│   ├── seed.ts                # Başlangıç verileri
│   └── migrations/            # Migration dosyaları
├── prisma.config.ts           # Prisma 7 yapılandırması
├── scripts/                   # Yönetim scriptleri
├── uploads/                   # Yüklenen dosyalar (git dışı)
├── public/                    # Statik dosyalar
├── docs/                      # Proje dokümantasyonu
├── src/
│   ├── auth.ts                # NextAuth yapılandırması
│   ├── auth.config.ts         # Auth callbacks ve session
│   ├── middleware.ts          # Route koruması
│   ├── types/
│   │   └── next-auth.d.ts     # Session tip genişletmeleri
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── permissions.ts     # Yetki kontrolü
│   ├── generated/
│   │   └── prisma/client/     # Oluşturulan Prisma Client
│   ├── components/            # React bileşenleri
│   └── app/                   # Next.js App Router
│       ├── page.tsx           # Dashboard (proje listesi)
│       ├── layout.tsx         # Root layout + Sidebar
│       ├── actions.ts         # Ana server actions
│       ├── actions/
│       │   ├── roleActions.ts
│       │   └── trelloActions.ts
│       ├── login/
│       ├── force-change-password/
│       ├── planner/
│       ├── settings/roles/
│       ├── b/[id]/            # Board sayfaları
│       ├── public/share/[token]/
│       └── api/               # REST API route'ları
├── docker-compose.yml
├── Dockerfile
└── next.config.ts
```

## Sayfa Yapısı

| Route | Dosya | Açıklama |
|-------|-------|----------|
| `/` | `app/page.tsx` | Proje listesi (dashboard) |
| `/login` | `app/login/page.tsx` | Giriş sayfası |
| `/force-change-password` | `app/force-change-password/page.tsx` | Zorunlu şifre değişimi |
| `/b/[id]` | `app/b/[id]/page.tsx` | Kanban board görünümü |
| `/b/[id]/settings` | `app/b/[id]/settings/page.tsx` | Board/kolon ayarları |
| `/planner` | `app/planner/page.tsx` | Takvim/plan görünümü |
| `/settings/roles` | `app/settings/roles/page.tsx` | Rol ve kullanıcı yönetimi |
| `/public/share/[token]` | `app/public/share/[token]/page.tsx` | Public dosya paylaşımı |

## Bileşen Mimarisi

### Board Çekirdeği

- `KanbanBoard` — Ana board container, sütunları yönetir
- `Column` — Tek bir kolon, kartları listeler
- `Card` — Kart önizlemesi
- `CardModal` — Kart detay modalı (açıklama, checklist, yorumlar, ekler)

### Görünümler

- `BoardListView` — Liste görünümü
- `BoardTimelineView` — Zaman çizelgesi görünümü
- `BoardFilter` — Board filtreleme

### Dashboard

- `BoardListDnd` — Sürüklenebilir proje listesi
- `BoardCard` / `SortableBoardCard` — Proje kartları
- `CreateProjectModal` / `EditBoardModal` — Proje oluşturma/düzenleme
- `GlobalSearch` — Kart arama

### İletişim

- `ChatPanel` — Board sohbet paneli
- `InboxSidebar` — Aktivite bildirimleri

### Ortak

- `Sidebar` — Ana navigasyon
- `RichTextEditor` — TipTap tabanlı editör
- `FileUploader` — Dosya yükleme
- `ModalProvider` — Global modal yönetimi
- `ConfirmModal` / `PromptModal` — Onay ve giriş modalları

## Veri Akışı

### Kart Taşıma (Drag & Drop)

1. Kullanıcı kartı sürükler (`@dnd-kit`)
2. `moveCard(cardId, newColumnId, newOrder)` server action çağrılır
3. Kolon `allowedRoles` / `dragOutRoles` kontrolü yapılır
4. Prisma ile kart güncellenir
5. `revalidatePath` ile UI yenilenir

### Dosya Yükleme

1. `FileUploader` → `POST /api/upload`
2. Dosya `uploads/` dizinine yazılır
3. `Attachment` kaydı oluşturulur
4. Kart veya sohbet mesajına bağlanır

### Kimlik Doğrulama

1. `middleware.ts` her isteği kontrol eder
2. Oturum yoksa → `/login`
3. `mustChangePassword` ise → `/force-change-password`
4. Public share route'ları middleware dışında bırakılır

## Yapılandırma

### next.config.ts

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '50mb',  // Büyük Trello JSON ve dosyalar için
  },
}
```

### prisma.config.ts

Prisma 7 yapılandırması; `DATABASE_URL` ortam değişkeninden okunur.

### Middleware Matcher

Aşağıdaki path'ler middleware'den **hariç** tutulur:

- `/api/*`
- `/_next/static/*`
- `/_next/image/*`
- `/favicon.ico`
- `/public/share/*`
