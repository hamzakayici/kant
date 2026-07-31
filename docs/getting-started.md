# Başlangıç Rehberi

Bu rehber, Kant projesini yerel ortamda çalıştırmak için gereken adımları açıklar.

## Gereksinimler

- **Node.js** 20+
- **npm** veya **pnpm**
- **PostgreSQL** 15+ (yerel veya Docker)

## Kurulum

### 1. Projeyi klonlayın

```bash
git clone <repo-url> kant
cd kant
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın

Proje kök dizininde `.env` dosyası oluşturun:

```env
# PostgreSQL bağlantı dizesi
DATABASE_URL="postgresql://kant_user:kant_password@localhost:5432/kant_db?schema=public"

# NextAuth JWT imzalama anahtarı (üretmek için: openssl rand -base64 32)
AUTH_SECRET="your-secret-key-here"
```

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `DATABASE_URL` | Evet | PostgreSQL connection string |
| `AUTH_SECRET` | Evet | NextAuth v5 JWT imzalama anahtarı |

## Docker ile Tam Stack

PostgreSQL, OpenCloud ve Kant uygulamasını tek komutla başlatmak için:

```bash
# İlk kurulum (build + seed dahil)
docker compose up -d --build

# veya
npm run docker:up:build
```

| Servis | Adres |
|--------|-------|
| Kant | http://localhost:3000 |
| OpenCloud | https://localhost:9200 |
| PostgreSQL | localhost:5433 |

OpenCloud giriş: `admin` / `kant_opencloud_dev`

Production için `.env` veya ortam değişkenlerinde `AUTH_SECRET` ve `OPENCLOUD_ADMIN_PASSWORD` değiştirin. Seed'i kapatmak için `KANT_AUTO_SEED=false`.

Yalnızca veritabanı (host'ta `npm run dev` için):

```bash
npm run docker:up:db
```

### 4. Veritabanını hazırlayın (yalnızca yerel dev)

Docker tam stack kullanıyorsanız bu adımı atlayın — migration ve seed container içinde otomatik çalışır.

Yalnızca PostgreSQL için:

```bash
npm run docker:up:db
```

PostgreSQL Docker üzerinde **5433** portunda çalışır (yerel PostgreSQL ile çakışmayı önlemek için). `.env` dosyasındaki `DATABASE_URL` buna göre ayarlanmalıdır:

```env
DATABASE_URL="postgresql://kant_user:kant_password@127.0.0.1:5433/kant_db?schema=public"
```

Migration ve seed:

```bash
npm run db:push
npm run db:seed
```

### 5. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

## NPM Scriptleri

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint kontrolü |

## Prisma Komutları

| Komut | Açıklama |
|-------|----------|
| `npx prisma generate` | Prisma Client oluşturur (`src/generated/prisma/client`) |
| `npx prisma migrate dev` | Geliştirme migration'ı uygular |
| `npx prisma db seed` | Seed verilerini yükler |
| `npx prisma studio` | Veritabanı GUI'si açar |

## Yardımcı Scriptler

`scripts/` klasöründe yönetim araçları bulunur:

| Script | Açıklama |
|--------|----------|
| `scripts/check-admin.ts` | Admin kullanıcı kontrolü |
| `scripts/rename-admin.ts` | Admin kullanıcı adı değiştirme |
| `scripts/reset-passwords.ts` | Kullanıcı şifrelerini sıfırlama |

Çalıştırmak için:

```bash
npx tsx scripts/check-admin.ts
```

## Dosya Yükleme Dizini

Yüklenen dosyalar `uploads/` klasörüne kaydedilir. OpenCloud etkinse dosyalar aynı pano/kart yapısıyla buluta da yansıtılır. Detaylar: [OpenCloud Rehberi](./opencloud.md).

## Sorun Giderme

### Prisma Client bulunamıyor

```bash
npx prisma generate
```

### Veritabanı bağlantı hatası

- PostgreSQL servisinin çalıştığını doğrulayın
- `DATABASE_URL` değerinin doğru olduğunu kontrol edin
- Docker kullanıyorsanız: `docker compose ps`

### NextAuth hatası

- `AUTH_SECRET` ortam değişkeninin tanımlı olduğundan emin olun
- Sunucuyu yeniden başlatın

### Büyük dosya / Trello import hatası

Server Actions body limiti 50 MB olarak ayarlanmıştır (`next.config.ts`). Daha büyük dosyalar için bu limiti artırabilirsiniz.
