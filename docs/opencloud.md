# OpenCloud Depolama

Kant, tüm dosya yönetimini **OpenCloud** üzerinden yapar. Yüklenen dosyalar OpenCloud'a kaydedilir ve uygulamadaki tüm linkler OpenCloud URL'leridir.

## Klasör Yapısı

```
Kant/
└── boards/
    └── {identifier}-{pano-adi}/
        ├── cards/
        │   └── {sequenceId}-{kart-basligi}/
        │       └── {timestamp}-{dosya-adi}
        ├── covers/
        │   └── {timestamp}-{kapak-dosyasi}
        └── chat/
            └── {sohbet-grubu}/
                └── {timestamp}-{dosya-adi}
```

## Yerel Geliştirme

### Docker tam stack (önerilen)

```bash
docker compose up -d --build
```

### Yalnızca OpenCloud (host'ta npm run dev)

```bash
npm run opencloud:up      # Docker container başlat (port 9200)
npm run opencloud:setup   # Bağlantı testi + .env güncelleme
npm run opencloud:sync    # Mevcut dosyaları OpenCloud'a aktar
npm run opencloud:logs    # Container logları
npm run opencloud:down    # Durdur
```

Yerel container `PROXY_TLS=true` ile HTTPS sunar. Tarayıcıda **http://localhost:9200** veya **https://localhost:9200** açabilirsiniz — HTTP otomatik olarak HTTPS'e yönlendirilir. İlk açılışta self-signed sertifika uyarısını kabul edin. Kant API bağlantısı için `OPENCLOUD_INSECURE=true` kullanılır.

### Yerel giriş bilgileri

| Alan | Değer |
|------|--------|
| Adres | https://localhost:9200 |
| Kullanıcı | `admin` |
| Şifre | `kant_opencloud_dev` |

Şifre yöneticisi (1Password vb.) farklı bir şifre dolduruyorsa devre dışı bırakıp şifreyi elle yazın.

## Ortam Değişkenleri

```env
OPENCLOUD_ENABLED=true
OPENCLOUD_URL=https://cloud.example.com
OPENCLOUD_USERNAME=kant
OPENCLOUD_PASSWORD=your-app-password
OPENCLOUD_ROOT=Kant
STORAGE_MODE=opencloud
```

| Değişken | Açıklama |
|----------|----------|
| `OPENCLOUD_ENABLED` | OpenCloud entegrasyonunu açar (zorunlu) |
| `OPENCLOUD_URL` | OpenCloud sunucu adresi |
| `OPENCLOUD_USERNAME` | WebDAV kullanıcı adı |
| `OPENCLOUD_PASSWORD` | Uygulama şifresi |
| `OPENCLOUD_ROOT` | Kök klasör adı (varsayılan: `Kant`) |
| `OPENCLOUD_WEBDAV_BASE` | Özel WebDAV yolu (opsiyonel) |
| `STORAGE_MODE` | `opencloud` (varsayılan), `dual` veya `local` |
| `OPENCLOUD_LINK_MODE` | `dav` (WebDAV URL) veya `files` (Files uygulaması) |
| `OPENCLOUD_PUBLIC_SHARES` | `false` ile herkese açık paylaşım linki oluşturmayı kapatır |

### Depolama Modları

| Mod | Davranış |
|-----|----------|
| `opencloud` | Yalnızca OpenCloud (önerilen) |
| `dual` | Yerel + OpenCloud mirror |
| `local` | Yalnızca `uploads/` (geliştirme) |

## Dosya URL'leri

Yüklenen her dosya için:

1. Dosya OpenCloud WebDAV üzerinden yüklenir
2. Mümkünse OpenCloud herkese açık paylaşım linki oluşturulur
3. `Attachment.path` alanına OpenCloud URL'si kaydedilir
4. UI'da gösterilen tüm linkler bu OpenCloud URL'sidir

Eski `/api/attachments/{id}` linkleri geriye dönük uyumluluk için OpenCloud URL'sine yönlendirilir.

## Ne Zaman Senkronize Olur?

- **Yeni pano oluşturulunca** → OpenCloud'da pano klasörü oluşturulur
- **Kart dosyası yüklenince** → `cards/{id}-{baslik}/` altına kaydedilir
- **Pano kapağı yüklenince** → `covers/` altına kaydedilir
- **Sohbet dosyası yüklenince** → `chat/{grup}/` altına kaydedilir
- **Dosya silinince** → OpenCloud'dan silinir
- **Paylaşım linki** → OpenCloud public share URL'si kopyalanır

## Mevcut Dosyaları Senkronize Etme

```bash
npm run opencloud:sync
```

Bu komut:
- Tüm panolar için klasör yapısını oluşturur
- Yerel dosyaları OpenCloud'a yükler
- `Attachment.path` alanını OpenCloud URL'si ile günceller
- Pano kapak görsellerini OpenCloud linklerine çevirir

## Sorun Giderme

### Bağlantı hatası

- `OPENCLOUD_URL` değerinin `/` ile bitmediğinden emin olun
- Kullanıcı adı/şifrenin doğru olduğunu kontrol edin

### Giriş başarısız (Logon failed)

- Kullanıcı: `admin`, şifre: `kant_opencloud_dev` (1Password otomatik doldurmasını kapatın)
- Volume/config uyumsuzluğunda: `npm run opencloud:reset`

### Görseller yüklenmiyor

OpenCloud herkese açık paylaşım linkleri için `OPENCLOUD_PUBLIC_SHARES=true` (varsayılan) olmalıdır. Paylaşım API'si devre dışıysa WebDAV URL'si kullanılır; bu URL tarayıcıda oturum gerektirebilir.

### Özel space kullanımı

```env
OPENCLOUD_WEBDAV_BASE=/dav/spaces/storage-users-1%24your-user-id-0000-000000000000
```
