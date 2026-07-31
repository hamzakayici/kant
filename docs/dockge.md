# Dockge ile Deploy

## Hata: `open Dockerfile: no such file or directory`

Bu hata, stack klasöründe **yalnızca compose dosyası** olduğunda görülür. `app` servisi `build: .` ile **tüm proje klasörünü** (Dockerfile, package.json, src/, prisma/ vb.) gerektirir.

**Yanlış:** Dockge editörüne sadece `docker-compose.yml` yapıştırmak  
**Doğru:** Git reposunun tamamını stack klasörüne almak

---

## Kurulum (önerilen — Git)

1. Dockge → **+ Compose**
2. Stack adı: `kant`
3. **Source / Git** (varsa):
   - Repository: `https://github.com/hamzakayici/kant.git`
   - Branch: `main`
   - Compose path: `docker-compose.yml`
4. **Environment** sekmesine `.env.production.example` içeriğini yapıştırıp şifreleri doldurun
5. **Deploy**

### Manuel clone (SSH)

```bash
cd /opt/stacks   # Dockge stacks dizini (kuruluma göre değişebilir)
git clone https://github.com/hamzakayici/kant.git kant
cd kant
cp .env.production.example .env
# .env dosyasını düzenleyin
```

Dockge'de stack path olarak `/opt/stacks/kant` gösterin.

---

## Gerekli dosyalar (stack kökünde olmalı)

```
kant/
├── Dockerfile          ← build için zorunlu
├── docker-compose.yml
├── docker/entrypoint.sh
├── package.json
├── prisma/
├── src/
└── .env                ← Dockge Environment veya bu dosya
```

---

## İlk deploy

```bash
docker compose up -d --build
```

Log:

```bash
docker compose logs -f app
```

Beklenen:

- `PostgreSQL hazır.`
- `Veritabanı şeması uygulanıyor...`
- `Kant başlatılıyor...`

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Dockerfile bulunamadı | Tüm repoyu clone edin, sadece compose değil |
| DB bağlantı hatası | `POSTGRES_PASSWORD` = `DATABASE_URL` içindeki şifre |
| Migration hatası | `docker compose down -v` sonra yeniden deploy (volume sıfırlar) |
| Port çakışması | 3000 veya 9200 başka serviste kullanılıyor olabilir |

---

## Güncelleme

```bash
cd /opt/stacks/kant
git pull
docker compose up -d --build
```
