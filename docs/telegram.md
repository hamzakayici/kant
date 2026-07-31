# Telegram Sohbet Entegrasyonu

Kant sohbet grupları, Telegram forum konularıyla çift yönlü senkronize çalışır.

## Mimari

```
Kant Web (ChatPanel)  ←→  PostgreSQL  ←→  Telegram Bot API
                              ↑
                    Webhook (/api/telegram/webhook)
```

- Tüm **Kant projesi** tek bir Telegram **süper grup** kullanır
- Her **sohbet grubu** (hangi panoda olursa olsun) bu grupta ayrı bir **forum konusu** olur
- Web'den gönderilen mesajlar Telegram'a, Telegram'dan gelen mesajlar siteye yazılır

## Kurulum

### 1. Telegram Bot Oluşturma

1. [@BotFather](https://t.me/BotFather) ile yeni bot oluşturun
2. **Gizlilik modunu kapatın:** BotFather → `/setprivacy` → botunuzu seçin → **Disable**
   - Bu adım olmadan bot grup mesajlarını okuyamaz
3. Bot token'ını `.env` dosyasına ekleyin:

```env
TELEGRAM_BOT_TOKEN="123456:ABC..."
TELEGRAM_BOT_USERNAME="kant_sohbet_bot"
TELEGRAM_WEBHOOK_SECRET="rastgele-gizli-anahtar"
AUTH_URL="https://siteniz.com"
```

Geliştirme için: `AUTH_URL="http://localhost:3000"`

### 2. Telegram Süper Grup

1. Yeni bir Telegram **süper grup** oluşturun
2. Grup ayarlarından **Konular (Topics)** özelliğini açın
3. Botu gruba ekleyin ve **yönetici** yapın (mesaj gönderme + konu yönetimi yetkisi)
4. Grup ID'sini alın (ör. `@userinfobot` veya `getUpdates` ile, genelde `-100...` formatında)
5. Kant'ta **Ayarlar → Telegram** sayfasından süper grup ID'sini girin

### 3. Webhook Kaydı

**Production:** Ayarlar → Telegram sayfasından **Webhook Kaydet** butonuna tıklayın.

**Geliştirme (localhost):** Webhook çalışmaz; bunun yerine ayrı terminalde:

```bash
npm run telegram:poll
```

Bu komut long polling ile Telegram mesajlarını dinler.

Kurulum kontrolü:

```bash
npm run telegram:setup
```

Manuel kayıt:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://siteniz.com/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Geliştirme ortamında [ngrok](https://ngrok.com) gibi bir tünel kullanmanız gerekir.

### 4. Kullanıcı Hesap Bağlama

1. Kullanıcı **Ayarlar → Telegram** sayfasından bağlantı kodu oluşturur
2. Telegram'da bota `/start KOD` gönderir
3. Bağlandıktan sonra Telegram'dan yazdığı mesajlar kendi adıyla görünür

## Veritabanı

```bash
npm run db:push
```

Yeni alanlar:
- `Board.telegramSupergroupId`
- `ChatGroup.telegramTopicId`
- `ChatMessage.source` (`web` | `telegram`)
- `ChatMessage.telegramMessageId`
- `User.telegramUserId`, `telegramUsername`, `telegramLinkCode`

## Akış

### Yeni sohbet grubu
`createChatGroup` → otomatik Telegram forum konusu oluşturulur (süper grup tanımlıysa)

### Web'den mesaj
`sendChatMessage` → DB'ye kayıt → Telegram konusuna gönderim

**Gönderen adı:** Telegram Bot API mesajları her zaman bot adıyla gönderir. Kant'tan kendi adınızla göndermek için MTProto oturumu gerekir:

```bash
# .env: TELEGRAM_API_ID ve TELEGRAM_API_HASH (https://my.telegram.org/apps)
npm run telegram:user-session -- kullanici@email.com
```

Oturum olmadan Kant'tan giden mesajlarda yalnızca metin görünür (bot adı gönderen olarak kalır).

### Telegram'dan mesaj
Webhook → konu ID ile grup bulunur → bağlı kullanıcı doğrulanır → DB'ye kayıt

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Mesajlar Telegram'a gitmiyor | Süper grup ID doğru mu? Bot yönetici mi? Forum açık mı? |
| Telegram mesajları sitede görünmüyor | Gizlilik modu kapalı mı? `npm run telegram:poll` çalışıyor mu? |
| Bot grup mesajlarını görmüyor | BotFather → `/setprivacy` → **Disable**, botu gruba yeniden ekleyin |
| Kullanıcı mesaj gönderemiyor | Hesabını `/settings/telegram` üzerinden bağlamalı |
| Eski gruplar eşlenmedi | Pano ayarlarından **Grupları Senkronize Et** |
| Grup ID değişti | Konular açılınca süper gruba dönüşür; yeni ID'yi pano ayarlarına girin |
