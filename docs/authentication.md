# Kimlik Doğrulama ve Yetkiler

Zubee, **NextAuth v5** ile credentials (kullanıcı adı + şifre) tabanlı kimlik doğrulama kullanır.

## Kimlik Doğrulama Akışı

```
Kullanıcı → /login → Credentials Provider → bcrypt doğrulama → JWT Session
```

### Yapılandırma Dosyaları

| Dosya | Rol |
|-------|-----|
| `src/auth.config.ts` | Session callbacks, JWT stratejisi, sign-in sayfası |
| `src/auth.ts` | Credentials provider, Prisma kullanıcı sorgusu |
| `src/middleware.ts` | Route koruması ve yönlendirme |
| `src/types/next-auth.d.ts` | Session tip genişletmeleri |

### Credentials Provider

```typescript
// src/auth.ts
Credentials({
  credentials: {
    username: { label: "Kullanıcı Adı", type: "text" },
    password: { label: "Şifre", type: "password" },
  },
  async authorize(credentials) {
    // 1. Kullanıcıyı username ile bul
    // 2. isActive kontrolü
    // 3. bcrypt ile şifre doğrulama
    // 4. JWT'ye id, username, role, mustChangePassword ekle
  }
})
```

### Session Stratejisi

JWT tabanlı session kullanılır (`strategy: "jwt"`). Session alanları:

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | string | Kullanıcı UUID |
| `username` | string | Kullanıcı adı |
| `role` | string | Legacy enum rol |
| `mustChangePassword` | boolean | Şifre değişikliği gerekli mi |

## Middleware Koruması

`src/middleware.ts` tüm sayfaları korur (matcher dışındakiler hariç):

| Durum | Yönlendirme |
|-------|-------------|
| Oturum yok | `/login?from=<orijinal-url>` |
| Oturum var + `/login` | `/` (dashboard) |
| `mustChangePassword` + diğer sayfalar | `/force-change-password` |
| Şifre değişmiş + `/force-change-password` | `/` |

### Middleware Dışı Path'ler

- `/api/*` — API route'ları kendi auth kontrolünü yapar
- `/public/share/*` — Token tabanlı public erişim
- `/_next/static/*`, `/_next/image/*`, `/favicon.ico`

## Rol Sistemi

Zubee iki katmanlı rol sistemi kullanır:

### 1. Legacy Enum Rolleri

Prisma `Role` enum'u:

| Rol | Açıklama |
|-----|----------|
| `ADMIN` | Süper yönetici — tüm yetkilere sahip (`SUPER_ADMIN`) |
| `REQUESTER` | Talep oluşturucu |
| `DESIGNER` | Tasarımcı |
| `EDITOR` | Editör |

Bu roller hem kullanıcı seviyesinde (`User.role`) hem de board üyelik seviyesinde (`BoardMember.role`) kullanılır.

### 2. Dinamik CustomRole

`CustomRole` modeli ile özelleştirilebilir roller:

```typescript
{
  name: "Proje Yöneticisi",
  permissions: ["MANAGE_BOARDS", "CREATE_CARD", "UPDATE_CARD"],
  icon: "shield"
}
```

Kullanıcıya `customRoleId` ile atanır.

## İzin Sistemi

`src/lib/permissions.ts` dosyasında tanımlı izinler:

| İzin | Açıklama |
|------|----------|
| `MANAGE_ROLES` | Rol ve kullanıcı yönetimi |
| `CREATE_BOARD` | Yeni pano / proje oluşturma |
| `MANAGE_BOARDS` | Pano düzenleme ve silme |
| `CREATE_CARD` | Kart oluşturma |
| `DELETE_CARD` | Kart silme |
| `UPDATE_CARD` | Kart düzenleme |
| `ASSIGN_ASSIGNEES` | Karta sorumlu atama / kaldırma |
| `MANAGE_CHATS` | Sohbet grubu yönetimi |

### Yetki Kontrolü

```typescript
// Kullanıcının izinlerini al
const permissions = await getUserPermissions(userId)

// İzin kontrolü
if (hasPermission(permissions, "MANAGE_BOARDS")) {
  // İşleme devam et
}
```

- `ADMIN` rolü → `SUPER_ADMIN` döner (tüm izinler)
- Diğer roller → `customRole.permissions` dizisi

## Hesap Güvenliği

### Zorunlu Şifre Değişimi

Yeni kullanıcılar `mustChangePassword: true` ile oluşturulur. İlk girişte `/force-change-password` sayfasına yönlendirilir.

`changeMyPassword(newPassword)` server action'ı şifreyi günceller ve `mustChangePassword`'ü `false` yapar.

### Hesap Askıya Alma

`isActive: false` olan kullanıcılar giriş yapamaz:

```
"Hesabınız yönetici tarafından askıya alınmıştır."
```

`toggleUserStatus(id, isActive)` ile yönetilir.

## Kullanıcı Yönetimi

`/settings/roles` sayfası (`MANAGE_ROLES` izni gerekir):

| İşlem | Server Action |
|-------|---------------|
| Rol oluşturma | `createRole()` |
| Rol güncelleme | `updateRole()` |
| Rol silme | `deleteRole()` |
| Kullanıcı oluşturma | `createUser()` |
| Kullanıcı güncelleme | `updateUser()` |
| Kullanıcı silme | `deleteUserAction()` |
| Rol atama | `assignUserRole()` |
| Aktif/pasif | `toggleUserStatus()` |

## API Route Kimlik Doğrulama

API route'ları middleware dışında olduğu için kendi auth kontrolünü yapar:

```typescript
const session = await auth()
if (!session) {
  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
}
```

Public endpoint'ler (auth gerektirmez):

- `GET /api/s/[token]` — Inline dosya görüntüleme
- `GET /api/download/[token]` — Dosya indirme
