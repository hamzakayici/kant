# API ve Server Actions

Zubee'de iş mantığının büyük kısmı **Server Actions** ile, dosya ve dışa aktarım işlemleri **API Routes** ile yönetilir.

## API Routes

### Kimlik Doğrulama

#### `GET/POST /api/auth/[...nextauth]`

NextAuth handler'ları. Giriş, çıkış ve session yönetimi.

---

### Dosya İşlemleri

#### `POST /api/upload`

Kimlik doğrulamalı dosya yükleme.

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `file` | FormData | Yüklenecek dosya |
| `cardId` | string? | Kart referansı |
| `chatMessageId` | string? | Sohbet mesajı referansı |

Dosya `uploads/` dizinine kaydedilir, `Attachment` kaydı oluşturulur.

#### `GET /api/attachments/[id]`

Kimlik doğrulamalı dosya servisi (inline görüntüleme).

---

### Paylaşım

#### `POST /api/share`

Paylaşım linki oluşturma (auth gerekli).

**Request body:**

```json
{
  "attachmentId": "uuid",
  "expiresInDays": 7,
  "password": "opsiyonel-sifre"
}
```

**Response:**

```json
{
  "success": true,
  "link": "/public/share/abc123..."
}
```

#### `GET /api/s/[token]`

Public inline dosya görüntüleme (auth gerekmez). Süre ve şifre kontrolü yapılır.

#### `GET /api/download/[token]`

Public dosya indirme (auth gerekmez). `Content-Disposition: attachment` header'ı ile döner.

---

### Dışa Aktarım

#### `GET /api/export/trello?boardId=<id>`

Board'u Trello uyumlu JSON formatında dışa aktarır (auth gerekli).

---

## Server Actions

### Kart İşlemleri (`src/app/actions.ts`)

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `createCard` | title, columnId, boardId | Yeni kart oluşturur |
| `moveCard` | cardId, newColumnId, newOrder | Kartı taşır |
| `deleteCard` | cardId | Kartı siler |
| `updateCardTitle` | cardId, title | Başlık günceller |
| `updateCardDescription` | cardId, description | Açıklama günceller (geçmiş kaydı oluşturur) |
| `getCardDescriptionHistory` | cardId | Açıklama geçmişini getirir |
| `updateCardDates` | cardId, startDate, dueDate, reminderMinutes?, isRecurring? | Tarihleri günceller |
| `toggleCardAssignee` | cardId, assigneeId | Atanan kişiyi ekler/çıkarır |
| `updateCardPriority` | cardId, priority | Öncelik günceller |
| `updateCardTags` | cardId, tags | Etiketleri günceller |
| `updateCardCover` | cardId, coverAttachmentId, coverMode? | Kapak görseli ayarlar |

### Checklist

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `addChecklistItem` | cardId, content | Checklist maddesi ekler |
| `toggleChecklistItem` | itemId, isDone | Tamamlandı durumunu değiştirir |
| `editChecklistItem` | itemId, content | Madde metnini düzenler |
| `deleteChecklistItem` | itemId | Maddeyi siler |

### Yorumlar

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `addComment` | cardId, content | Yorum ekler |
| `addCardComment` | cardId, content | Yorum ekler (alternatif) |

### Proje / Board

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `createProject` | { name, identifier, description?, isPrivate, memberIds?, startingNumber?, icon? } | Yeni proje oluşturur |
| `updateBoard` | boardId, { name?, identifier?, coverImage?, icon? } | Board günceller |
| `deleteBoard` | boardId | Board siler |
| `reorderBoards` | boardIds[] | Dashboard sıralamasını günceller |

### Kolon

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `createColumn` | boardId, name, category, color | Yeni kolon oluşturur |
| `updateColumn` | columnId, { name?, color?, category?, order? } | Kolon günceller |
| `updateColumnAllowedRoles` | columnId, allowedRoles, dragOutRoles | Rol kısıtlamalarını ayarlar |
| `moveColumnPosition` | columnId, direction | Kolonu sola/sağa taşır |
| `deleteColumn` | columnId | Kolonu siler |

### Dosya ve Paylaşım

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `deleteAttachment` | attachmentId | Eki siler |
| `createShareLink` | attachmentId | Paylaşım linki oluşturur |

### Sohbet

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `createChatGroup` | name, boardId, memberIds | Sohbet grubu oluşturur |
| `sendChatMessage` | chatGroupId, content | Mesaj gönderir |
| `getChatMessages` | chatGroupId | Mesajları getirir |

### Arama

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `searchCards` | query, boardId? | Kart arama (match-sorter) |

---

### Rol Yönetimi (`src/app/actions/roleActions.ts`)

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `getRoles` | — | Tüm rolleri ve kullanıcıları getirir |
| `createRole` | name, description, permissions, icon? | Yeni rol oluşturur |
| `updateRole` | id, name, description, permissions, icon? | Rol günceller |
| `deleteRole` | id | Rol siler |
| `assignUserRole` | userId, roleId | Kullanıcıya rol atar |
| `createUser` | data | Yeni kullanıcı oluşturur |
| `updateUser` | id, data | Kullanıcı günceller |
| `toggleUserStatus` | id, isActive | Hesabı aktif/pasif yapar |
| `deleteUserAction` | id | Kullanıcı siler |
| `changeMyPassword` | newPassword | Kendi şifresini değiştirir |

---

### Trello (`src/app/actions/trelloActions.ts`)

| Action | Parametreler | Açıklama |
|--------|-------------|----------|
| `importTrelloBoard` | trelloJsonString | Trello JSON'dan board import eder |

Import işlemi listeleri kolonlara, kartları, checklist'leri ve yorumları dönüştürür.

---

## Hata Yönetimi

Server Actions hata durumunda `{ error: string }` döner. API Routes HTTP status kodları kullanır:

| Kod | Anlam |
|-----|-------|
| 200 | Başarılı |
| 400 | Geçersiz istek |
| 401 | Yetkisiz erişim |
| 404 | Kaynak bulunamadı |
| 500 | Sunucu hatası |
