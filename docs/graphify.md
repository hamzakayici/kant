# Graphify — Kod Tabanı Bilgi Grafiği

Kant projesi [Graphify](https://github.com/safishamsi/graphify) ile kod tabanının sorgulanabilir bir bilgi grafiğine dönüştürülmesini destekler. Graphify; dosyalar, fonksiyonlar, bileşenler ve dokümantasyon arasındaki ilişkileri otomatik çıkarır.

## Kurulum

Graphify bir Python aracıdır ve sistem genelinde kurulmalıdır:

```bash
# uv ile (önerilen)
uv tool install graphifyy

# veya pip ile
pip install graphifyy
```

Projeye Cursor entegrasyonu:

```bash
graphify install --project --platform cursor
```

Bu komut `.cursor/rules/graphify.mdc` dosyasını oluşturur; Cursor oturumlarında graf sorguları otomatik önerilir.

## NPM Scriptleri

| Komut | Açıklama |
|-------|----------|
| `npm run graphify:update` | Kod değişikliklerinden sonra grafiği günceller (AST, LLM gerekmez) |
| `npm run graphify:report` | `GRAPH_REPORT.md` özetini terminale yazdırır |
| `npm run graphify:html` | İnteraktif `graph.html` dosyasını tarayıcıda açar |

## Grafiği Oluşturma

İlk kurulum veya tam yeniden oluşturma:

```bash
graphify update .
```

Bu komut:
- `src/`, `prisma/`, `docs/` ve diğer kaynak dosyaları tarar
- AST ile fonksiyon, import ve çağrı ilişkilerini çıkarır
- `graphify-out/` altında çıktıları üretir

## Çıktılar

`graphify-out/` dizininde:

| Dosya | Açıklama |
|-------|----------|
| `graph.json` | Ham graf verisi (GraphRAG uyumlu) |
| `graph.html` | İnteraktif görselleştirme — tarayıcıda açın |
| `GRAPH_REPORT.md` | Topluluk analizi, god node'lar, sürpriz bağlantılar |
| `manifest.json` | Artımlı güncelleme için dosya manifesti |

Mevcut graf istatistikleri (son build):

- **1517** node
- **1643** edge
- **135** community

## Sorgulama

Kod tabanı hakkında soru sormak için:

```bash
# Genel soru (BFS traversal)
graphify query "Kimlik doğrulama akışı nasıl çalışır?"

# İki kavram arasındaki yol
graphify path "auth.ts" "middleware.ts"

# Bir kavramın açıklaması
graphify explain "CardModal"
```

### Örnek Sorgular

```bash
graphify query "Kart taşıma işlemi hangi dosyalarda yapılıyor?"
graphify query "Yetki kontrolü nerede uygulanıyor?"
graphify path "createCard" "hasPermission"
graphify explain "getUserPermissions"
```

## Kod Değişikliği Sonrası

Kod dosyalarını değiştirdikten sonra grafiği güncel tutun:

```bash
npm run graphify:update
# veya
graphify update .
```

Bu işlem yalnızca AST kullanır; API anahtarı veya LLM maliyeti gerektirmez.

Dokümantasyon (`.md`) değişiklikleri için tam semantik güncelleme gerekir — Cursor'da `/graphify --update` komutunu kullanın.

## Cursor Entegrasyonu

`.cursor/rules/graphify.mdc` kuralı aktif olduğunda Cursor agent'ları kod tabanını keşfetmeden önce graphify sorgularını kullanır:

1. `graphify query "<soru>"` — mimari veya akış soruları
2. `graphify path "<A>" "<B>"` — iki sembol arası bağımlılık yolu
3. `graphify explain "<kavram>"` — bir kavramla ilişkili tüm node'lar

`graphify-out/graph.json` yoksa önce `graphify update .` çalıştırın.

## Önemli God Node'lar

Graf analizine göre en bağlantılı çekirdek soyutlamalar:

| Node | Bağlantı | Açıklama |
|------|----------|----------|
| `CardModal()` | 19 edge | Kart detay modalı — en merkezi UI bileşeni |
| `useModal()` | 16 edge | Global modal yönetimi |
| `getUserPermissions()` | 16 edge | Yetki kontrolü giriş noktası |
| `hasPermission()` | 16 edge | İzin doğrulama |
| `actions.ts` | — | Ana server actions dosyası |
| `auth.ts` | — | NextAuth yapılandırması |

## Sürpriz Bağlantılar

Grafın ortaya çıkardığı beklenmedik ilişkiler:

- `CardModal()` → `jszip` (toplu indirme için)
- `createCard()` → `getUserPermissions()` / `hasPermission()` (kart oluşturma yetki kontrolü)
- `CardModal()` → `moveCard()` (modal içinden kart taşıma)

## İnteraktif Görselleştirme

```bash
npm run graphify:html
# veya
open graphify-out/graph.html
```

Graf görselleştirmesinde topluluklar renk kodlu olarak gösterilir; node'lara tıklayarak ilişkileri keşfedebilirsiniz.

## Git Hook (Opsiyonel)

Her commit sonrası otomatik graf güncellemesi için (git repo gerekir):

```bash
graphify hook install
```

Hook yalnızca değişen kod dosyalarını yeniden çıkarır.
