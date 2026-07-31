# Dağıtım

## Production — zubi.noktafikir.com

Yayın adresi: **https://zubi.noktafikir.com**

### 1. Ortam dosyası

```bash
cp .env.production.example .env.production
```

`.env.production` içinde mutlaka güncelleyin:

| Değişken | Değer |
|----------|--------|
| `AUTH_URL` | `https://zubi.noktafikir.com` |
| `NEXTAUTH_URL` | `https://zubi.noktafikir.com` |
| `TELEGRAM_PUBLIC_APP_URL` | `https://zubi.noktafikir.com` |
| `AUTH_SECRET` | `openssl rand -base64 32` çıktısı |
| `DATABASE_URL` | Güçlü DB şifresi |
| `KANT_AUTO_SEED` | `false` (ilk kurulumdan sonra) |

### 2. Docker ile production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  --env-file .env.production up -d --build
```

Bu komut:

- Uygulamayı `app:3000` üzerinde çalıştırır (dışarı açılmaz)
- `nginx` container'ı 80/443 portlarında `zubi.noktafikir.com` için proxy yapar
- PostgreSQL ve OpenCloud portlarını dışarı kapatır

### 3. SSL (Let's Encrypt)

İlk kurulumda sertifika yoksa önce yalnızca HTTP ile certbot çalıştırın:

```bash
# DNS: zubi.noktafikir.com → sunucu IP
docker run -it --rm \
  -v certbot_www:/var/www/certbot \
  -v certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d zubi.noktafikir.com
```

Ardından nginx container'ını yeniden başlatın:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart nginx
```

Nginx yapılandırması: `docker/nginx/zubi.noktafikir.com.conf`

### 4. Sunucuda harici Nginx kullanıyorsanız

`docker-compose.prod.yml` içindeki `nginx` servisini kaldırın; uygulamayı host'a bağlayın:

```yaml
# docker-compose.prod.yml — app servisi
ports:
  - "127.0.0.1:3000:3000"
```

Host nginx örneği (`server_name zubi.noktafikir.com`) aşağıdaki bölümde.

### 5. Telegram webhook (production)

```bash
npm run telegram:setup
# AUTH_URL=https://zubi.noktafikir.com olduğundan emin olun
```

---

## Docker ile Dağıtım

Proje Docker ve Docker Compose desteği ile gelir.

### docker-compose.yml

Tüm servisler tek dosyada tanımlıdır:

| Servis | Image | Port | Açıklama |
|--------|-------|------|----------|
| `db` | postgres:15-alpine | 5433 | PostgreSQL veritabanı |
| `opencloud` | opencloudeu/opencloud-rolling | — | OpenCloud dosya sunucusu |
| `opencloud-gateway` | nginx:alpine | 9200 | OpenCloud HTTPS proxy |
| `app` | Build (Dockerfile) | 3000 | Next.js uygulaması |

### Hızlı Başlangıç

```bash
# Tüm servisleri başlat (ilk kurulumda --build)
docker compose up -d --build

# Sadece veritabanı (yerel npm run dev için)
docker compose up db -d

# Logları izle
docker compose logs -f app
```

### Ortam Değişkenleri (Docker)

`docker-compose.yml` içinde tanımlı:

```yaml
environment:
  - DATABASE_URL=postgresql://kant_user:kant_password@db:5432/kant_db?schema=public
```

Production için `AUTH_SECRET` eklenmelidir:

```yaml
environment:
  - DATABASE_URL=postgresql://kant_user:kant_password@db:5432/kant_db?schema=public
  - AUTH_SECRET=your-production-secret
```

### Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build adımları:

1. Bağımlılıkları yükle (`npm ci`)
2. Prisma Client oluştur
3. Next.js production build
4. `npm start` ile çalıştır

### İlk Kurulum (Docker)

```bash
# Servisleri başlat
docker compose up -d

# Migration uygula
docker compose exec app npx prisma migrate deploy

# Seed verilerini yükle
docker compose exec app npx prisma db seed
```

---

## Manuel Production Dağıtımı

### 1. Ortam Hazırlığı

```bash
# Production ortam değişkenleri
export DATABASE_URL="postgresql://user:pass@host:5432/kant_db?schema=public"
export AUTH_SECRET="$(openssl rand -base64 32)"
export NODE_ENV=production
```

### 2. Build

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 3. Çalıştırma

```bash
npm start
# veya PM2 ile:
pm2 start npm --name kant -- start
```

---

## Veritabanı Yönetimi

### Migration

```bash
# Geliştirme
npx prisma migrate dev --name migration_adi

# Production
npx prisma migrate deploy
```

### Backup

```bash
# PostgreSQL dump
pg_dump -h localhost -U kant_user kant_db > backup.sql

# Restore
psql -h localhost -U kant_user kant_db < backup.sql
```

### Prisma Studio

Veritabanını GUI ile incelemek için:

```bash
npx prisma studio
```

---

## Dosya Depolama

Yüklenen dosyalar `uploads/` dizininde saklanır.

### Production Önerileri

- `uploads/` dizinini kalıcı bir volume olarak mount edin
- Docker Compose örneği:

```yaml
app:
  volumes:
    - uploads_data:/app/uploads

volumes:
  uploads_data:
```

- Büyük dosyalar için S3 veya benzeri object storage entegrasyonu düşünülebilir (şu an desteklenmiyor)

---

## Güvenlik Kontrol Listesi

- [ ] `AUTH_SECRET` güçlü ve benzersiz bir değer olmalı
- [ ] PostgreSQL şifresi production'da değiştirilmeli
- [ ] `uploads/` dizini web root'tan erişilemez olmalı (API üzerinden servis edilir)
- [ ] HTTPS kullanılmalı (reverse proxy: nginx, Caddy)
- [ ] Varsayılan seed şifreleri değiştirilmeli
- [ ] `isActive` ile kullanılmayan hesaplar askıya alınmalı

---

## Yönetim Scriptleri

`scripts/` klasöründeki araçlar production'da da kullanılabilir:

```bash
# Admin kullanıcı kontrolü
npx tsx scripts/check-admin.ts

# Admin kullanıcı adı değiştirme
npx tsx scripts/rename-admin.ts

# Tüm şifreleri sıfırlama
npx tsx scripts/reset-passwords.ts
```

---

## Reverse Proxy (Nginx Örneği)

```nginx
server {
    listen 80;
    server_name zubi.noktafikir.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name zubi.noktafikir.com;

    ssl_certificate /etc/letsencrypt/live/zubi.noktafikir.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zubi.noktafikir.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

> Production domain: **zubi.noktafikir.com** — tam Docker nginx yapılandırması: `docker/nginx/zubi.noktafikir.com.conf`

> `client_max_body_size 50M` — Server Actions body limiti ile uyumlu olmalıdır.

---

## Monitoring

- Next.js built-in logging (`console.error` API route'larda kullanılır)
- PostgreSQL bağlantı havuzu: `pg` Pool (Prisma adapter)
- Health check: `GET /` (auth gerektirir) veya özel health endpoint eklenebilir
