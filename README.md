# Kant

Ekipler için Kanban proje yönetimi — panolar, kartlar, sohbet, dosya paylaşımı ve Trello içe/dışa aktarım.

**Repo:** https://github.com/hamzakayici/kant

## Hızlı başlangıç

```bash
npm install
cp .env.example .env
# .env içinde DATABASE_URL ve AUTH_SECRET ayarlayın
npm run db:push
npm run db:seed
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Dokümantasyon

Tüm rehberler [`docs/`](./docs/README.md) klasöründe:

- [Başlangıç](./docs/getting-started.md)
- [Mimari](./docs/architecture.md)
- [Dağıtım (Docker / production)](./docs/deployment.md)

## Docker

```bash
# Geliştirme
docker compose up -d --build

# Production (zubi.noktafikir.com) — sunucuda git clone
cp .env.production.example .env.production
npm run docker:prod

# Dockge — yalnızca YAML yapıştır (build yok)
# compose.dockge.yml içeriğini Dockge editörüne yapıştırın
# Detay: docs/dockge.md
```

Detaylar: [deployment.md](./docs/deployment.md) · Dockge: [dockge.md](./docs/dockge.md)
