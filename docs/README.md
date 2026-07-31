# Kant Dokümantasyonu

**Kant**, ekipler için geliştirilmiş gelişmiş bir Kanban proje yönetim uygulamasıdır. Trello/Linear tarzı panolar, kartlar, sohbet, dosya paylaşımı ve Trello JSON içe/dışa aktarım özellikleri sunar.

## İçindekiler

| Doküman | Açıklama |
|---------|----------|
| [Başlangıç Rehberi](./getting-started.md) | Kurulum, ortam değişkenleri ve ilk çalıştırma |
| [Mimari](./architecture.md) | Teknoloji yığını, dizin yapısı ve genel tasarım |
| [Veritabanı](./database.md) | Prisma şeması, modeller ve ilişkiler |
| [Kimlik Doğrulama ve Yetkiler](./authentication.md) | NextAuth, roller ve izin sistemi |
| [API ve Server Actions](./api.md) | REST endpoint'leri ve sunucu eylemleri |
| [Özellikler](./features.md) | Panolar, kartlar, sohbet, dosya paylaşımı, Trello |
| [Dağıtım](./deployment.md) | Docker, production ve bakım scriptleri |
| [Graphify](./graphify.md) | Kod tabanı bilgi grafiği, sorgulama ve Cursor entegrasyonu |
| [OpenCloud](./opencloud.md) | Ek dosya depolama ve pano/kart klasör senkronizasyonu |

## Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini ayarla (.env dosyası oluştur)
# DATABASE_URL=postgresql://...
# AUTH_SECRET=...

# Veritabanını hazırla
npx prisma migrate dev
npx prisma db seed

# Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Varsayılan Kullanıcılar

Seed sonrası aşağıdaki hesaplar oluşturulur:

| Kullanıcı Adı | Şifre | Rol |
|---------------|-------|-----|
| `admin` | `admin123` | ADMIN |
| `requester` | `user123` | REQUESTER |
| `designer` | `user123` | DESIGNER |
| `editor` | `user123` | EDITOR |

> İlk girişte şifre değişikliği zorunludur (`mustChangePassword`).

## Teknoloji Özeti

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Veritabanı:** PostgreSQL + Prisma 7
- **Kimlik Doğrulama:** NextAuth v5 (Credentials)
- **Editör:** TipTap
- **Sürükle-Bırak:** @dnd-kit
- **Kod Grafiği:** Graphify (sorgulanabilir mimari haritası)

## Kod Tabanı Grafiği

Proje Graphify ile indekslenmiştir. Kod tabanını keşfetmek için:

```bash
graphify query "Kimlik doğrulama nasıl çalışır?"
graphify path "createCard" "hasPermission"
npm run graphify:html   # interaktif görselleştirme
```

Detaylar: [Graphify Rehberi](./graphify.md) · Çıktılar: `graphify-out/`
