# Dockge ile Deploy (yalnızca YAML)

Dockge'de **git clone gerekmez**. Hazır Docker image + bu compose dosyası yeterli.

## 1. Image'in build edilmesi

`main` branch'e push edildiğinde GitHub Actions otomatik image üretir:

`ghcr.io/hamzakayici/kant:latest`

İlk kez deploy etmeden önce [Actions](https://github.com/hamzakayici/kant/actions) sekmesinden **Publish Docker image** workflow'unun yeşil olduğundan emin olun.

Manuel tetiklemek için: Actions → Publish Docker image → **Run workflow**

## 2. Dockge'de stack oluştur

1. **+ Compose**
2. Stack adı: `kant`
3. Web editörüne `compose.dockge.yml` dosyasının **tüm içeriğini** yapıştırın  
   (repo'daki `docker-compose.yml` değil — o build gerektirir)
4. **Environment** sekmesine değişkenleri ekleyin (aşağıda)
5. **Deploy**

## 3. Environment değişkenleri

```env
AUTH_URL=https://zubi.noktafikir.com
NEXTAUTH_URL=https://zubi.noktafikir.com
NEXT_PUBLIC_APP_URL=https://zubi.noktafikir.com
TELEGRAM_PUBLIC_APP_URL=https://zubi.noktafikir.com

AUTH_SECRET=waE88UmOpSCeiqsTiQgkV1nGqgcnjL5sbnjSxM8sov0=

POSTGRES_USER=kant_user
POSTGRES_PASSWORD=kant_password
POSTGRES_DB=kant_db
DATABASE_URL=postgresql://kant_user:kant_password@db:5432/kant_db?schema=public

KANT_AUTO_SEED=true

OPENCLOUD_ADMIN_PASSWORD=kant_opencloud_dev
OPENCLOUD_PASSWORD=kant_opencloud_dev

TELEGRAM_BOT_TOKEN=...
TELEGRAM_BOT_USERNAME=...
TELEGRAM_WEBHOOK_SECRET=...
TELEGRAM_SUPERGROUP_ID=...
TELEGRAM_DEFAULT_TOPIC_ID=1
TELEGRAM_API_ID=...
TELEGRAM_API_HASH=...
```

İlk kurulumdan sonra `KANT_AUTO_SEED=false` yapın.

## 4. Erişim

- Kant: `http://SUNUCU_IP:3000` veya reverse proxy ile `https://zubi.noktafikir.com`
- OpenCloud: dışarıdan kapalı (Kant üzerinden dosya erişimi)

## 5. Güncelleme

GitHub'a push → Actions image'ı günceller → Dockge'de stack **Redeploy** (pull_policy: always yeni image'ı çeker)

## Sorun giderme

| Hata | Çözüm |
|------|--------|
| `open Dockerfile: no such file` | `docker-compose.yml` yerine `compose.dockge.yml` kullanın |
| `manifest unknown` / image pull failed | GitHub Actions workflow'unu çalıştırın |
| `denied: permission` (GHCR) | Repo public değilse sunucuda `docker login ghcr.io` |
| DB hatası | `POSTGRES_PASSWORD` ile `DATABASE_URL` şifresi aynı olmalı |
| Eski bozuk DB | Stack durdur → volume sil → yeniden deploy |

## docker-compose.yml vs compose.dockge.yml

| Dosya | Kullanım |
|-------|----------|
| `docker-compose.yml` | Sunucuda git clone + `docker compose build` |
| `compose.dockge.yml` | Dockge'ye yapıştır, build yok, hazır image |
