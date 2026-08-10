export type EnrichedChecklistItem = { content: string; isDone: boolean }

export type EnrichedCardContent = {
  description: string
  checklist: EnrichedChecklistItem[]
  comments: string[]
  descriptionHistory: string[]
  reminderMinutes?: number
}

function card(
  description: string,
  checklist: EnrichedChecklistItem[],
  comments: string[],
  descriptionHistory: string[],
  reminderMinutes?: number
): EnrichedCardContent {
  return { description, checklist, comments, descriptionHistory, reminderMinutes }
}

export const ENRICHED_CARD_CONTENT: Record<string, EnrichedCardContent> = {
  "Sidebar ve layout bileşenlerini güncelle": card(
    `<p><strong>Amaç:</strong> Zubee arayüzünü dashboard-01 tasarım sistemine taşımak ve tüm sayfalarda tutarlı bir kabuk (shell) deneyimi sağlamak.</p>
<ul>
<li>Mevcut sidebar daralt/genişlet davranışı korunacak</li>
<li>Mobil breakpoint'te drawer olarak açılacak</li>
<li>Aktif menü öğesi için görsel vurgu eklenecek</li>
</ul>
<p><strong>Kabul kriterleri:</strong> 1280px ve üzeri masaüstünde sabit sidebar; 768px altında hamburger menü; klavye ile gezinilebilirlik.</p>
<p><strong>Not:</strong> shadcn/ui bileşenleri ve mevcut tema değişkenleri kullanılacak, yeni renk token'ı eklenmeyecek.</p>`,
    [
      { content: "AppSidebar bileşenini dashboard-01 yapısına taşı", isDone: true },
      { content: "NavMain / NavSecondary alt bileşenlerini ayır", isDone: true },
      { content: "Mobil drawer ve overlay davranışı", isDone: false },
      { content: "Breadcrumb entegrasyonu", isDone: false },
      { content: "Erişilebilirlik (focus trap, aria)", isDone: false },
      { content: "Dark mode kontrast kontrolü", isDone: false },
    ],
    [
      "Sidebar genişliği 16rem olarak sabitlendi, içerik alanı scroll bağımsız çalışıyor.",
      "Mobilde menü açıkken arka plan scroll'u kilitlendi. QA için test listesi paylaşıldı.",
      "Tasarım ekibinden gelen son mockup'ta ikon boyutları 20px'e çekildi, uygulandı.",
    ],
    [
      "<p>İlk taslak: mevcut sidebar korunarak sadece renk güncellemesi.</p>",
      "<p>Dashboard-01 referansı eklendi. Nav grupları yeniden düzenlendi.</p>",
    ],
    120
  ),

  "Telegram sohbet entegrasyonu": card(
    `<p><strong>Kapsam:</strong> Kart detayından Telegram süper grubuna mesaj gönderme, webhook ile gelen mesajları Zubee aktivite akışına yansıtma.</p>
<p><strong>Teknik:</strong> BotFather token, webhook secret, forum topic ID yapılandırması. MTProto ile kullanıcı adına gönderim opsiyonel.</p>
<ul>
<li>Webhook: <code>POST /api/telegram/webhook</code></li>
<li>Paylaşım: kart linki + özet metin</li>
<li>Hata durumunda toast + log</li>
</ul>`,
    [
      { content: "Bot token ve webhook env doğrulama", isDone: true },
      { content: "Kart paylaşım dialog'u", isDone: true },
      { content: "Webhook imza doğrulama", isDone: true },
      { content: "Forum topic seçimi UI", isDone: false },
      { content: "Gelen mesaj → aktivite senkronu", isDone: false },
    ],
    [
      "Webhook test ortamında 200 dönüyor, Telegram'dan gelen update'ler loglanıyor.",
      "Production'da TELEGRAM_PUBLIC_APP_URL HTTPS olmalı; aksi halde webhook set edilemiyor.",
    ],
    ["<p>İlk faz: sadece outbound paylaşım.</p>"],
    60
  ),

  "Kart modalı performans iyileştirmesi": card(
    `<p>CardModal açılışında gereksiz re-render ve büyük attachment listelerinde yavaşlama gözlemlendi.</p>
<p><strong>Plan:</strong> React.memo alt bileşenler, virtual list (çok ek), lazy load description history.</p>
<p><strong>Ölçüm:</strong> Lighthouse TBT ve React Profiler ile önce/sonra karşılaştırma.</p>`,
    [
      { content: "Profiler ile darboğaz tespiti", isDone: true },
      { content: "CardModalAttachments memo", isDone: false },
      { content: "Description history lazy fetch", isDone: false },
      { content: "100+ checklist item senaryosu test", isDone: false },
    ],
    ["İlk profil: RichTextEditor mount maliyeti yüksek, lazy import denenecek."],
    [],
    1440
  ),

  "OpenCloud dosya depolama testleri": card(
    `<p>OpenCloud WebDAV yolu keşfi, upload, public share ve Zubee attachment URL çözümlemesi test edildi.</p>
<ul>
<li>Docker iç ağ: <code>https://opencloud:9200</code></li>
<li>OPENCLOUD_INSECURE=true geliştirme için</li>
<li>Production'da OpenCloud dışarı kapalı, sadece app erişir</li>
</ul>
<p><strong>Sonuç:</strong> Tüm upload senaryoları başarılı; büyük dosya (&gt;10MB) server action limiti ile uyumlu.</p>`,
    [
      { content: "docker-opencloud-init.ts smoke test", isDone: true },
      { content: "Görsel upload + cover", isDone: true },
      { content: "PDF eki indirme", isDone: true },
      { content: "Public share link süresi", isDone: true },
    ],
    ["Tüm upload senaryoları doğrulandı.", "OpenCloud volume backup prosedürü dokümante edildi."],
    [],
    undefined
  ),

  "Rol ve yetki sistemi dokümantasyonu": card(
    `<p>ADMIN, EDITOR, DESIGNER, REQUESTER rollerinin board ve kart seviyesindeki yetkileri tablo halinde dokümante edilecek.</p>
<p><strong>Çıktı:</strong> <code>docs/roles.md</code> + ayarlar sayfasına kısa yardım metni.</p>`,
    [
      { content: "Mevcut middleware ve action guard envanteri", isDone: false },
      { content: "Rol matrisi tablosu", isDone: false },
      { content: "Örnek kullanıcı senaryoları", isDone: false },
    ],
    ["Talep tarafından ek senaryo istendi: misafir salt okunur erişim."],
    [],
    2880
  ),

  "Planlayıcı sayfası yeniden tasarımı": card(
    `<p>Haftalık/aylık görünüm, sürükle-bırak ile tarih güncelleme ve kart özet chip'leri.</p>
<p><strong>Tasarım:</strong> Takvim grid + sağda seçili günün kart listesi. Mobil'de liste öncelikli.</p>`,
    [
      { content: "Takvim grid bileşeni", isDone: true },
      { content: "Kart sürükle → tarih güncelle", isDone: true },
      { content: "Filtre: proje / öncelik", isDone: false },
      { content: "Yazdırma görünümü", isDone: false },
    ],
    ["Yeni takvim ve görev listesi tamamlandı.", "Mobilde swipe ile hafta değiştirme eklendi."],
    ["<p>Eski liste-only planlayıcı.</p>", "<p>Takvim + liste hibrit tasarım onaylandı.</p>"],
    240
  ),

  "Ana sayfa hero bölümü tasarımı": card(
    `<p>Kurumsal site ana sayfası hero: başlık, alt metin, birincil/ikincil CTA, arka plan görseli veya gradient.</p>
<p><strong>Marka:</strong> Nokta Fikir renk paleti, max genişlik 1280px, tipografi Inter.</p>`,
    [
      { content: "Wireframe (Figma)", isDone: true },
      { content: "Desktop görsel tasarım", isDone: false },
      { content: "Mobil hero stack", isDone: false },
      { content: "CTA hover/focus states", isDone: false },
      { content: "LCP optimizasyonu (next/image)", isDone: false },
    ],
    ["Wireframe onaylandı, görsel tasarım Cuma'ya kadar.", "Stok görsel yerine özel fotoğraf çekimi planlanıyor."],
    [],
    30
  ),

  "Blog sayfası şablonu": card(
    `<p>Liste görünümü, kategori filtresi, arama ve detay sayfası şablonu. MDX veya CMS entegrasyonu sonraki faz.</p>`,
    [
      { content: "Liste grid / kart layout", isDone: false },
      { content: "Kategori sidebar", isDone: false },
      { content: "Okuma süresi meta", isDone: false },
      { content: "Open Graph görselleri", isDone: false },
    ],
    ["İçerik ekibi 12 blog taslağı gönderdi, şablon buna göre ayarlanacak."],
    [],
    480
  ),

  "İletişim formu entegrasyonu": card(
    `<p>Form alanları: ad, e-posta, konu, mesaj. Sunucu tarafı validasyon + e-posta bildirimi veya CRM webhook.</p>
<p><strong>Spam:</strong> honeypot + rate limit.</p>`,
    [
      { content: "Zod şema", isDone: false },
      { content: "Server action / API route", isDone: false },
      { content: "Başarı/hata UI", isDone: false },
      { content: "KVKK onay checkbox", isDone: false },
    ],
    [],
    [],
    720
  ),

  "SEO meta etiketleri": card(
    `<p>Tüm public sayfalar için title, description, canonical, og:image. Next.js metadata API kullanılacak.</p>
<ul>
<li>Ana sayfa, blog, iletişim, hizmetler</li>
<li>JSON-LD Organization şeması</li>
</ul>`,
    [
      { content: "Sayfa bazlı metadata export", isDone: false },
      { content: "og:image varsayılan 1200x630", isDone: false },
      { content: "sitemap.xml", isDone: false },
      { content: "robots.txt", isDone: false },
    ],
    ["Editor ekibi meta açıklamalarını Google Docs'ta hazırlıyor."],
    [],
    120
  ),

  "Mobil responsive kontroller": card(
    `<p>Breakpoint'ler: 375, 768, 1024, 1280. Chrome DevTools + gerçek cihaz (iPhone 14, Pixel 7).</p>
<p><strong>Checklist:</strong> taşma, dokunma hedefi min 44px, font ölçekleme.</p>`,
    [
      { content: "Ana sayfa mobil QA", isDone: true },
      { content: "Blog liste/detay", isDone: true },
      { content: "Form ve footer", isDone: false },
      { content: "Lighthouse mobile skor &gt; 90", isDone: false },
    ],
    ["iOS Safari'de 100vh sorunu tespit edildi, dvh birimi ile düzeltildi."],
    [],
    undefined
  ),

  "Footer link yapısı": card(
    `<p>Footer kolonları: Hizmetler, Şirket, Yasal, Sosyal. Tüm linkler CMS veya statik config'ten.</p>`,
    [
      { content: "Link envanteri (içerik)", isDone: true },
      { content: "Footer bileşeni", isDone: false },
      { content: "Çok dilli hazırlık (opsiyonel)", isDone: false },
    ],
    [],
    [],
    96
  ),

  "Onboarding ekranları": card(
    `<p>3 adımlı onboarding: değer önerisi, izinler (bildirim), hesap bağlama. Skip her adımda mümkün.</p>`,
    [
      { content: "Ekran 1-3 UI", isDone: true },
      { content: "Swipe / dot indicator", isDone: true },
      { content: "Analytics event'leri", isDone: false },
      { content: "A/B metin varyantı", isDone: false },
    ],
    ["Figma prototip kullanıcı testinde %78 tamamlama oranı."],
    [],
    360
  ),

  "Push bildirim altyapısı": card(
    `<p>FCM (Android) + APNs (iOS). Sunucu tarafı token kaydı ve topic subscribe.</p>
<p><strong>Gizlilik:</strong> opt-in onboarding'de açık rıza.</p>`,
    [
      { content: "Firebase proje kurulumu", isDone: false },
      { content: "Token persist API", isDone: false },
      { content: "Test push script", isDone: false },
    ],
    [],
    [],
    undefined
  ),

  "App Store görselleri": card(
    `<p>6.7\", 6.5\", 5.5\" screenshot setleri. Türkçe ve İngilizce metin overlay.</p>
<p><strong>ASO:</strong> anahtar kelime araştırması tamamlandı, başlık karakteri sınırına dikkat.</p>`,
    [
      { content: "Screenshot 1-5 TR", isDone: false },
      { content: "Screenshot 1-5 EN", isDone: false },
      { content: "App preview video (15sn)", isDone: false },
      { content: "Store listing metinleri", isDone: true },
    ],
    ["App Store Connect'e ilk build yüklendi, review bekleniyor.", "Tasarım: gradient arka plan + cihaz mockup kullanılacak."],
    [],
    45
  ),

  "Karanlık mod desteği": card(
    `<p>Sistem tercihi + uygulama içi toggle. Tüm shadcn token'ları dark variant ile uyumlu.</p>`,
    [
      { content: "next-themes entegrasyonu", isDone: false },
      { content: "Grafik/chart renkleri", isDone: false },
      { content: "Görsel kart kapakları kontrast", isDone: false },
    ],
    [],
    [],
    undefined
  ),

  "Beta test kullanıcı listesi": card(
    `<p>TestFlight (iOS) ve Play Internal Testing (Android). 50 kullanıcı davet, geri bildirim formu linki.</p>`,
    [
      { content: "Test kullanıcı e-posta listesi", isDone: true },
      { content: "TestFlight davet gönderimi", isDone: true },
      { content: "Google Play internal track", isDone: true },
      { content: "Geri bildirim Typeform", isDone: false },
    ],
    ["50 test kullanıcısı davet edildi.", "İlk 12 geri bildirim: çoğunlukla onboarding metni."],
    [],
    undefined
  ),

  "Sosyal medya içerik takvimi": card(
    `<p>Q3 için haftalık paylaşım planı: Instagram carousel, LinkedIn makale, X thread.</p>
<p><strong>Araçlar:</strong> Notion takvim + Canva şablonları.</p>`,
    [
      { content: "Instagram 12 post", isDone: true },
      { content: "LinkedIn 8 post", isDone: true },
      { content: "X / Twitter 16 post", isDone: false },
      { content: "Stories şablonları", isDone: false },
      { content: "Hashtag seti", isDone: true },
    ],
    ["Instagram ilk 4 post zamanlandı.", "LinkedIn sponsorlu post bütçesi ayrı kartta."],
    [],
    180
  ),

  "E-posta bülten şablonu": card(
    `<p>Responsive HTML e-posta: header logo, hero, 3 içerik bloğu, footer unsubscribe.</p>
<p>Litmus test: Gmail, Outlook, Apple Mail.</p>`,
    [
      { content: "MJML / React Email şablon", isDone: false },
      { content: "Dark mode e-posta test", isDone: false },
      { content: "UTM parametreleri", isDone: false },
    ],
    ["Marka renkleri #1a1a2e ve #e94560 olarak kullanılacak."],
    [],
    480
  ),

  "Lansman landing page metinleri": card(
    `<p>Hero, özellikler (3 kolon), sosyal kanıt, FAQ, CTA. Ton: profesyonel, kısa cümleler.</p>`,
    [
      { content: "Hero + alt başlık", isDone: false },
      { content: "3 özellik bloğu", isDone: false },
      { content: "FAQ 8 soru", isDone: false },
      { content: "CTA ve form metni", isDone: false },
    ],
    ["Talep ekibi ilk taslak metinleri Perşembe gönderecek."],
    [],
    240
  ),

  "Reklam bütçesi onayı": card(
    `<p>Google Ads + Meta toplam 45.000 TL Q3. Kanal dağılımı: %60 search, %40 sosyal.</p>
<p><strong>Durum:</strong> Finans onayı bekleniyor, son tarih geçti — acil takip.</p>`,
    [
      { content: "Medya planı Excel", isDone: true },
      { content: "Finans onayı", isDone: false },
      { content: "Kampanya oluşturma (onay sonrası)", isDone: false },
    ],
    ["Bütçe sunumu yönetime iletildi.", "Acil: onay olmazsa lansman tarihi kayar."],
    [],
    15
  ),

  "Influencer iş birliği listesi": card(
    `<p>10 mikro influencer (10-50K takipçi), sektör: teknoloji / üretkenlik.</p>`,
    [
      { content: "Aday listesi 20 kişi", isDone: true },
      { content: "İlk temas e-postası", isDone: false },
      { content: "Sözleşme şablonu", isDone: false },
    ],
    [],
    [],
    undefined
  ),

  "Kampanya performans raporu": card(
    `<p>İlk hafta: gösterim, tıklama, CTR, dönüşüm, CPA. Data Studio dashboard.</p>`,
    [
      { content: "GA4 event kurulumu", isDone: true },
      { content: "Haftalık rapor şablonu", isDone: true },
      { content: "Stakeholder sunumu", isDone: false },
    ],
    ["İlk hafta metrikleri olumlu: CTR %2.4, hedef %2.0."],
    [],
    undefined
  ),

  "Basın bülteni taslağı": card(
    `<p>Lansman tarihi, ürün özeti, alıntı (CEO), iletişim bilgisi. 400 kelime max.</p>`,
    [
      { content: "Taslak v1", isDone: false },
      { content: "Hukuk incelemesi", isDone: false },
      { content: "Dağıtım listesi (medya)", isDone: false },
    ],
    [],
    [],
    720
  ),
}

export function mergeCardContent<T extends { title: string; description?: string; checklist?: EnrichedChecklistItem[]; comment?: string }>(
  base: T
): T & { description?: string; checklist?: EnrichedChecklistItem[]; comments?: string[]; descriptionHistory?: string[]; reminderMinutes?: number } {
  const extra = ENRICHED_CARD_CONTENT[base.title]
  if (!extra) return base
  return {
    ...base,
    description: extra.description,
    checklist: extra.checklist,
    comments: extra.comments,
    descriptionHistory: extra.descriptionHistory,
    reminderMinutes: extra.reminderMinutes,
    comment: extra.comments[0] ?? base.comment,
  }
}
