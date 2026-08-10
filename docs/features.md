# Özellikler

## Panolar (Boards)

### Proje Oluşturma

Dashboard'dan yeni proje oluşturulabilir:

- **Ad:** Proje ismi
- **Identifier:** Kısa kod (örn. `ATF`) — kart numaralandırmasında kullanılır (ATF-1, ATF-2...)
- **Açıklama:** Opsiyonel proje açıklaması
- **Özel/Genel:** `isPrivate` ile erişim kontrolü
- **Üyeler:** Proje oluşturulurken üye atanabilir
- **Başlangıç numarası:** Kart sıra numarası başlangıcı
- **İkon:** Proje ikonu

### Dashboard

Ana sayfa (`/`) üye olunan projeleri listeler:

- Sürükle-bırak ile sıralama (`BoardListDnd`)
- Proje kartları: ikon, ad, identifier, kapak görseli
- Global arama (`GlobalSearch`)
- Yeni proje oluşturma butonu

### Board Ayarları

`/b/[id]/settings` sayfasında:

- Kolon ekleme/silme/düzenleme
- Kolon kategorileri: `BACKLOG`, `UNSTARTED`, `ACTIVE`, `DONE`
- Kolon renkleri
- Rol bazlı kolon kısıtlamaları (`allowedRoles`, `dragOutRoles`)

---

## Kanban Görünümü

### Kolonlar

Her board varsayılan kolonlarla oluşturulur. Kolonlar:

- Sürükle-bırak ile yeniden sıralanabilir
- Renk ve kategori atanabilir
- Rol bazlı erişim kısıtlaması yapılabilir

### Kartlar

Kart özellikleri:

| Özellik | Açıklama |
|---------|----------|
| Başlık | Kart adı |
| Açıklama | TipTap rich text editör |
| Öncelik | NONE, LOW, MEDIUM, HIGH, URGENT |
| Etiketler | Özel etiket dizisi |
| Tarihler | Başlangıç, bitiş, hatırlatma |
| Atananlar | Birden fazla kullanıcı atanabilir |
| Checklist | Yapılacaklar listesi |
| Kapak | Ek dosyadan kapak görseli |
| Ekler | Dosya yükleme |
| Yorumlar | Kart yorumları |
| Aktivite | Değişiklik geçmişi |
| Açıklama geçmişi | Versiyon kontrolü |

### Kart Modalı

Karta tıklandığında `CardModal` açılır:

- Sol panel: başlık, açıklama (rich text), checklist, ekler
- Sağ panel: atananlar, öncelik, etiketler, tarihler, yorumlar, aktivite

### Sürükle-Bırak

`@dnd-kit` kütüphanesi ile:

- Kartlar kolonlar arası taşınabilir
- Kartlar kolon içinde yeniden sıralanabilir
- Kolonlar board içinde yeniden sıralanabilir
- Dashboard'da projeler sıralanabilir

### Görünüm Modları

Board sayfasında üç görünüm:

| Görünüm | Bileşen | Açıklama |
|---------|---------|----------|
| Kanban | `KanbanBoard` | Klasik sütun görünümü |
| Liste | `BoardListView` | Tablo formatında kart listesi |
| Timeline | `BoardTimelineView` | Tarih bazlı zaman çizelgesi |

### Filtreleme

`BoardFilter` ile kartlar filtrelenebilir:

- Öncelik
- Atanan kişi
- Etiket
- Tarih aralığı

---

## Planner

`/planner` sayfası üye olunan tüm panolardaki kartları takvim/plan görünümünde gösterir:

- Başlangıç ve bitiş tarihlerine göre kartlar listelenir
- Tüm projelerden birleşik görünüm

---

## Sohbet

Her board'da sohbet grupları oluşturulabilir:

- **Grup oluşturma:** İsim ve üye seçimi
- **Mesajlaşma:** Metin mesajları
- **Dosya ekleme:** Mesajlara dosya eklenebilir
- **ChatPanel:** Board sayfasında sağ panel olarak açılır

---

## Dosya Yönetimi

### Yükleme

- `FileUploader` bileşeni ile kart veya sohbet mesajına dosya eklenir
- `POST /api/upload` endpoint'i dosyayı `uploads/` dizinine kaydeder
- Desteklenen: görseller, PDF, belgeler

### Görüntüleme

- `GET /api/attachments/[id]` — Oturum açmış kullanıcılar için inline görüntüleme
- Kart kapak görseli olarak kullanılabilir

### Paylaşım

Dosyalar public link ile paylaşılabilir:

1. `POST /api/share` ile link oluştur
2. Opsiyonel: süre sınırı (`expiresInDays`) ve şifre
3. Link formatı: `/public/share/<token>`
4. Public sayfa: inline görüntüleme veya indirme

---

## Trello Entegrasyonu

Canlı Trello API bağlantısı yoktur; JSON dosya tabanlı içe/dışa aktarım yapılır.

### Dışa Aktarım

```
GET /api/export/trello?boardId=<id>
```

Board'u Trello uyumlu JSON formatında indirir.

### İçe Aktarım

`importTrelloBoard(trelloJsonString)` server action:

- Trello listeleri → Zubee kolonları
- Trello kartları → Zubee kartları
- Checklist'ler ve yorumlar aktarılır
- `CreateProjectModal` içinde import UI mevcuttur

---

## Arama

`GlobalSearch` bileşeni:

- Tüm board'larda veya belirli bir board'da kart arar
- `match-sorter` ile fuzzy arama
- Başlık, açıklama ve etiketlerde arar

---

## Inbox / Aktivite

`InboxSidebar` bileşeni:

- Kart aktivite loglarını gösterir
- Board sayfasında bildirim paneli olarak kullanılır

---

## UI/UX

- **Dark tema:** `#0e0f11` arka plan, `#9fadbc` metin
- **Font:** Geist Sans + Geist Mono
- **Responsive:** Sidebar + ana içerik layout
- **Modal sistemi:** `ModalProvider` ile global modal yönetimi
- **Dil:** Karışık TR/EN (auth ve hatalar TR, dashboard/board EN)
