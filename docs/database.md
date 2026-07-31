# Veritabanı

Kant, **PostgreSQL** veritabanı ve **Prisma 7** ORM kullanır. Prisma Client çıktısı `src/generated/prisma/client` dizininde oluşturulur.

## Bağlantı

```typescript
// src/lib/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
```

Prisma 7'de driver adapter pattern kullanılır (`@prisma/adapter-pg`).

## Enum'lar

### Role

Kullanıcı ve board üyelik rolleri:

| Değer | Açıklama |
|-------|----------|
| `REQUESTER` | Talep oluşturucu |
| `DESIGNER` | Tasarımcı |
| `EDITOR` | Editör |
| `ADMIN` | Süper yönetici (tüm yetkiler) |

### Priority

Kart öncelik seviyeleri:

| Değer | Açıklama |
|-------|----------|
| `NONE` | Öncelik yok |
| `LOW` | Düşük |
| `MEDIUM` | Orta |
| `HIGH` | Yüksek |
| `URGENT` | Acil |

## Modeller

### User

Kullanıcı hesabı.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Birincil anahtar |
| `username` | String | Benzersiz kullanıcı adı |
| `email` | String | Benzersiz e-posta |
| `password` | String | bcrypt hash |
| `mustChangePassword` | Boolean | İlk girişte şifre değişimi zorunlu |
| `isActive` | Boolean | Hesap aktif/pasif |
| `avatarUrl` | String? | Profil fotoğrafı |
| `color` | String? | Kullanıcı rengi |
| `role` | Role | Legacy enum rol |
| `customRoleId` | String? | Dinamik rol referansı |

**İlişkiler:** boards, cards, comments, activities, chatGroupMembers, chatMessages, assignedCards

### CustomRole

Dinamik rol tanımları.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Birincil anahtar |
| `name` | String | Benzersiz rol adı |
| `description` | String? | Açıklama |
| `icon` | String? | İkon |
| `permissions` | String[] | İzin listesi |

### Board

Proje panosu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Birincil anahtar |
| `name` | String | Proje adı |
| `identifier` | String | Kısa kod (örn. `ATF`) |
| `sequenceCounter` | Int | Kart numaralandırma sayacı |
| `description` | String? | Açıklama |
| `isPrivate` | Boolean | Özel/genel proje |
| `coverImage` | String? | Kapak görseli |
| `icon` | String? | Proje ikonu |
| `order` | Int | Dashboard sıralaması |

**İlişkiler:** members, columns, chatGroups

### BoardMember

Kullanıcı–board üyeliği.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `userId` | String | Kullanıcı referansı |
| `boardId` | String | Board referansı |
| `role` | Role | Board içi rol |

Benzersiz kısıt: `[userId, boardId]`

### Column

Kanban kolonu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `name` | String | Kolon adı |
| `order` | Int | Sıralama |
| `color` | String? | Renk |
| `category` | String? | Kategori: `BACKLOG`, `UNSTARTED`, `ACTIVE`, `DONE` |
| `allowedRoles` | String[] | Bu kolona kart ekleyebilen roller |
| `dragOutRoles` | String[] | Bu kolondan kart çıkarabilen roller |
| `boardId` | String | Board referansı |

### Card

Kanban kartı.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `sequenceId` | Int | Board içi sıra numarası (örn. ATF-42) |
| `title` | String | Kart başlığı |
| `description` | String? | Rich text açıklama |
| `startDate` | DateTime? | Başlangıç tarihi |
| `dueDate` | DateTime? | Bitiş tarihi |
| `order` | Int | Kolon içi sıralama |
| `priority` | Priority | Öncelik |
| `tags` | String[] | Etiketler |
| `coverAttachmentId` | String? | Kapak görseli |
| `coverMode` | String | Kapak modu (varsayılan: `COVER`) |
| `reminderMinutes` | Int? | Hatırlatma (dakika) |
| `isRecurring` | Boolean | Tekrarlayan görev |

**İlişkiler:** column, creator, attachments, comments, activities, checklists, descriptionHistories, assignees

### ChecklistItem

Kart checklist satırı.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `content` | String | Madde metni |
| `isDone` | Boolean | Tamamlandı mı |
| `cardId` | String | Kart referansı |

### Comment

Kart yorumu.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `content` | String | Yorum metni |
| `cardId` | String | Kart referansı |
| `authorId` | String | Yazar referansı |

### ActivityLog

Kart aktivite kaydı.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `action` | String | Yapılan işlem |
| `cardId` | String | Kart referansı |
| `userId` | String | Kullanıcı referansı |

### CardDescriptionHistory

Açıklama versiyon geçmişi.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `content` | String? | O anki açıklama içeriği |
| `cardId` | String | Kart referansı |
| `userId` | String | Düzenleyen kullanıcı |

### Attachment

Dosya eki.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `filename` | String | Dosya adı |
| `path` | String | `uploads/` altındaki yol |
| `mimeType` | String | MIME tipi |
| `size` | Int | Boyut (byte) |
| `width` / `height` | Int? | Görsel boyutları |
| `cardId` | String? | Kart referansı |
| `chatMessageId` | String? | Sohbet mesajı referansı |

### SharedLink

Dosya paylaşım linki.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `token` | String | Benzersiz paylaşım token'ı |
| `attachmentId` | String | Ek referansı |
| `expiresAt` | DateTime? | Son kullanma tarihi |
| `password` | String? | bcrypt hash (opsiyonel şifre) |

### ChatGroup / ChatGroupMember / ChatMessage

Board bazlı sohbet sistemi.

- **ChatGroup:** Board'a bağlı sohbet grubu
- **ChatGroupMember:** Grup üyeliği
- **ChatMessage:** Mesaj içeriği ve ekleri

## İlişki Diyagramı

```
User ──┬── BoardMember ── Board ──┬── Column ── Card
       │                          ├── ChatGroup ── ChatMessage
       │                          └── (members)
       ├── Comment
       ├── ActivityLog
       ├── CardDescriptionHistory
       └── CustomRole

Card ──┬── ChecklistItem
       ├── Attachment ── SharedLink
       ├── Comment
       └── ActivityLog
```

## Migration

```bash
# Yeni migration oluştur
npx prisma migrate dev --name migration_adi

# Production'da uygula
npx prisma migrate deploy
```

## Seed

`prisma/seed.ts` dört varsayılan kullanıcı oluşturur:

- `admin` (ADMIN)
- `requester` (REQUESTER)
- `designer` (DESIGNER)
- `editor` (EDITOR)

```bash
npx prisma db seed
```
