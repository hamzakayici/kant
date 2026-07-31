# Graph Report - kant  (2026-07-30)

## Corpus Check
- 148 files · ~710,880 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1517 nodes · 1643 edges · 135 communities (100 shown, 35 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- devDependencies
- compilerOptions
- Prisma 7 Driver Adapter Implementation Guide
- Model Queries
- Driver Adapters
- Upgrade to Prisma ORM 7
- Server Actions
- Relation Queries
- Removed Features
- Özellikler
- roleActions.ts
- Raw Queries
- Prisma CLI Reference
- Client Methods
- Filter Conditions and Operators
- Query Options
- Dağıtım
- prisma db push
- prisma dev
- prisma generate
- prisma studio
- Prisma Client API Reference
- Troubleshooting Prisma Compute
- Prisma Config
- prisma.ts
- actions.ts
- prisma migrate dev
- prisma db seed
- Environment Variables
- Kimlik Doğrulama ve Yetkiler
- Başlangıç Rehberi
- page.tsx
- useModal
- prisma db pull
- prisma init
- prisma migrate deploy
- Prisma Database Setup
- Prisma Accelerate Users
- ESM and CommonJS Support
- Constructor Options
- Schema Changes
- Transactions
- Workflow
- KanbanBoard.tsx
- auth.ts
- Prisma Compute Framework Readiness
- MongoDB Setup
- Core Workflows
- Modeller
- prisma db execute
- Prisma Platform CLI App Deploy
- MySQL Setup
- management-api
- prisma migrate diff
- prisma migrate reset
- PostgreSQL Setup
- Prisma Postgres Setup
- SQLite Setup
- SQL Server Setup
- create-db-cli
- api-basics
- Column.tsx
- prisma format
- prisma migrate resolve
- prisma validate
- CockroachDB Setup
- decision-stay-or-migrate
- console-and-connections
- README.md
- prisma migrate status
- Prisma Compute Config
- create-prisma Compute Flow
- Quick Rules
- Prisma Compute
- migrations-mapping
- schema-contract-mapping
- Prisma MongoDB Upgrade Path
- management-api-sdk
- endpoints
- Mimari
- prisma mcp
- SDK and API Automation
- client-api-mapping
- Service Tokens
- Veritabanı
- page.tsx
- layout.tsx
- prisma debug
- Prisma Client Setup
- verify-cutover-checklist
- Prisma 7 Client Instantiation
- dependencies
- Bileşen Mimarisi
- BoardListDnd.tsx
- auth.config.ts
- page.tsx
- Yapılandırma
- README.md
- seed-users.js
- next-auth.d.ts
- page.tsx
- DatePickerPopover.tsx
- AGENTS.md
- bcryptjs
- clsx
- @dnd-kit/core
- @dnd-kit/sortable
- @dnd-kit/utilities
- eslint.config.mjs
- jszip
- lucide-react
- next
- next-auth
- next.config.ts
- pg
- @prisma/adapter-pg
- @prisma/client
- react
- react-dom
- tailwind-merge
- @tailwindcss/typography
- @tiptap/extension-bubble-menu
- @tiptap/extension-color
- @tiptap/extension-link
- @tiptap/extension-text-style
- @tiptap/extension-underline
- @tiptap/pm
- @tiptap/react
- @tiptap/starter-kit
- postcss.config.mjs
- { GET, POST }

## God Nodes (most connected - your core abstractions)
1. `Troubleshooting Prisma Compute` - 20 edges
2. `CardModal()` - 19 edges
3. `useModal()` - 16 edges
4. `getUserPermissions()` - 16 edges
5. `hasPermission()` - 16 edges
6. `compilerOptions` - 16 edges
7. `Prisma Client API Reference` - 14 edges
8. `Prisma Compute Framework Readiness` - 14 edges
9. `Upgrade to Prisma ORM 7` - 14 edges
10. `Modeller` - 14 edges

## Surprising Connections (you probably didn't know these)
- `CardModal()` --references--> `jszip`  [EXTRACTED]
  src/components/CardModal.tsx → package.json
- `createCard()` --calls--> `getUserPermissions()`  [EXTRACTED]
  src/app/actions.ts → src/lib/permissions.ts
- `createCard()` --calls--> `hasPermission()`  [EXTRACTED]
  src/app/actions.ts → src/lib/permissions.ts
- `CardModal()` --calls--> `moveCard()`  [EXTRACTED]
  src/components/CardModal.tsx → src/app/actions.ts
- `deleteCard()` --calls--> `getUserPermissions()`  [EXTRACTED]
  src/app/actions.ts → src/lib/permissions.ts

## Import Cycles
- None detected.

## Communities (135 total, 35 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss (+29 more)

### Community 1 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+22 more)

### Community 2 - "Prisma 7 Driver Adapter Implementation Guide"
Cohesion: 0.07
Nodes (29): Architecture Overview, Argument Mapping (input), Checklist, Column Type Inference, ColumnTypeEnum values, Conversion Helpers, Database-Specific Notes, E2E Tests (with PrismaClient) (+21 more)

### Community 3 - "Model Queries"
Cohesion: 0.07
Nodes (27): aggregate, Aggregation Operations, Atomic operations, count, create, Create Operations, createMany, createManyAndReturn (+19 more)

### Community 4 - "Driver Adapters"
Cohesion: 0.07
Nodes (27): Accept self-signed certificates, After (v7), Available Adapters, Before (v6), Configuration, Connection Pool Configuration, Driver Adapters, Installation (+19 more)

### Community 5 - "Upgrade to Prisma ORM 7"
Cohesion: 0.08
Nodes (25): 1. Update package.json for ESM-first projects, 2. Update tsconfig.json, 3. Update schema.prisma, 4. Create prisma.config.ts, 5. Install a driver adapter (SQL providers only), 6. Update client instantiation, 7. Replace Prisma.validator with satisfies, 8. Run migrations and generate (+17 more)

### Community 6 - "Server Actions"
Cohesion: 0.08
Nodes (25): API Routes, API ve Server Actions, Arama, Checklist, Dosya İşlemleri, Dosya ve Paylaşım, Dışa Aktarım, `GET /api/attachments/[id]` (+17 more)

### Community 7 - "Relation Queries"
Cohesion: 0.08
Nodes (23): Connect existing, Count Relations, Create or connect, Create with relations, Delete related, Disconnect, every, Filter counted relations (+15 more)

### Community 8 - "Removed Features"
Cohesion: 0.08
Nodes (23): Alternatives, Auto-generate after migrate, Auto-seed after migrate, Automatic Behaviors Removed, CLI Flags Removed, Client Middleware, Common Middleware Patterns, Custom counter with extensions (+15 more)

### Community 9 - "Özellikler"
Cohesion: 0.08
Nodes (24): Arama, Board Ayarları, Dashboard, Dosya Yönetimi, Dışa Aktarım, Filtreleme, Görüntüleme, Görünüm Modları (+16 more)

### Community 10 - "roleActions.ts"
Cohesion: 0.25
Nodes (19): assignUserRole(), changeMyPassword(), createRole(), createUser(), deleteRole(), deleteUserAction(), getRoles(), toggleUserStatus() (+11 more)

### Community 11 - "Raw Queries"
Cohesion: 0.09
Nodes (21): BigInt handling, Database-Specific Features, Date handling, Delete example, Dynamic table/column names, $executeRaw, Handling Results, Insert example (+13 more)

### Community 12 - "Prisma CLI Reference"
Cohesion: 0.10
Nodes (20): Boundary: Compute, Bun Runtime, Client Generation, Command Categories, Current Command Behavior, Current Prisma CLI Setup, Database Operations, Environment Variables (+12 more)

### Community 13 - "Client Methods"
Cohesion: 0.10
Nodes (18): Add custom methods, Add model methods, Chain extensions, Client Methods, $connect(), $disconnect(), $extends(), Graceful shutdown (+10 more)

### Community 14 - "Filter Conditions and Operators"
Cohesion: 0.10
Nodes (20): AND (explicit), AND (implicit), Array Field Filters, Combined, Comparison, Equality, every, Filter Conditions and Operators (+12 more)

### Community 15 - "Query Options"
Cohesion: 0.10
Nodes (20): cursor, distinct, Filtered include, include, Include relation count, Multiple distinct fields, Negative take (reverse), Nested include (+12 more)

### Community 16 - "Dağıtım"
Cohesion: 0.10
Nodes (21): 1. Ortam Hazırlığı, 2. Build, 3. Çalıştırma, Backup, Dağıtım, docker-compose.yml, Docker ile Dağıtım, Dockerfile (+13 more)

### Community 17 - "prisma db push"
Cohesion: 0.10
Nodes (19): Accept data loss, Basic push, Command, Common Patterns, Comparison with migrate dev, Examples, Follow-up Command, Force reset (+11 more)

### Community 18 - "prisma dev"
Cohesion: 0.10
Nodes (19): Background mode, Command, Configuration, Custom ports, Examples, Force remove (stops first), Instance Management, List all instances (+11 more)

### Community 19 - "prisma generate"
Cohesion: 0.10
Nodes (19): After schema changes, Basic generation, Bun Runtime, CI/CD pipeline, Command, Common Patterns, Compiler Build Tuning, Current Generator Behavior (+11 more)

### Community 20 - "prisma studio"
Cohesion: 0.10
Nodes (19): Command, Common Workflow, Custom port, Don't open browser, Edit Records, Examples, Features, Filter Data (+11 more)

### Community 21 - "Prisma Client API Reference"
Cohesion: 0.10
Nodes (19): Client Instantiation, Client Methods, Create records, Delete records, Filter Operators, Find records, How to Use, Model Query Methods (+11 more)

### Community 22 - "Troubleshooting Prisma Compute"
Cohesion: 0.10
Nodes (20): Accidental Prisma Postgres Provisioning, Auth Fails, Bun Entrypoint Missing, Compute Config Invalid, `create-prisma --yes` Did Not Deploy, Database Wiring or Schema Did Not Apply, Env Changes Did Not Apply, First Checks (+12 more)

### Community 23 - "Prisma Config"
Cohesion: 0.10
Nodes (19): After (v7) - prisma.config.ts, Basic Configuration, Before (v6) - schema.prisma, Configuration Options, Custom Config Path, datasource.directUrl, datasource.shadowDatabaseUrl, datasource.url (+11 more)

### Community 24 - "prisma.ts"
Cohesion: 0.10
Nodes (3): adapter, globalForPrisma, pool

### Community 25 - "actions.ts"
Cohesion: 0.26
Nodes (16): addCardComment(), addChecklistItem(), createShareLink(), deleteAttachment(), deleteChecklistItem(), editChecklistItem(), getCardDescriptionHistory(), toggleCardAssignee() (+8 more)

### Community 26 - "prisma migrate dev"
Cohesion: 0.11
Nodes (18): After schema changes, Command, Common Patterns, Create and apply migration, Create without applying, Examples, Follow-up Commands, Full workflow (+10 more)

### Community 27 - "prisma db seed"
Cohesion: 0.11
Nodes (17): Best Practices, Command, Common Patterns, Common seed commands, Conditional seeding, Configuration, Current Workflow, Development reset (+9 more)

### Community 28 - "Environment Variables"
Cohesion: 0.11
Nodes (17): 1. Install dotenv, 2. Import in prisma.config.ts, Application Code, Bun Users, CI/CD Considerations, Entry point, Environment Variables, Multiple .env Files (+9 more)

### Community 29 - "Kimlik Doğrulama ve Yetkiler"
Cohesion: 0.11
Nodes (17): 1. Legacy Enum Rolleri, 2. Dinamik CustomRole, API Route Kimlik Doğrulama, Credentials Provider, Hesap Askıya Alma, Hesap Güvenliği, İzin Sistemi, Kimlik Doğrulama Akışı (+9 more)

### Community 30 - "Başlangıç Rehberi"
Cohesion: 0.11
Nodes (17): 1. Projeyi klonlayın, 2. Bağımlılıkları yükleyin, 3. Ortam değişkenlerini ayarlayın, 4. Veritabanını hazırlayın, 5. Geliştirme sunucusunu başlatın, Başlangıç Rehberi, Büyük dosya / Trello import hatası, Dosya Yükleme Dizini (+9 more)

### Community 31 - "page.tsx"
Cohesion: 0.16
Nodes (6): createChatGroup(), getChatMessages(), sendChatMessage(), ChatPanel(), InboxSidebar(), InboxWrapper()

### Community 32 - "useModal"
Cohesion: 0.18
Nodes (11): importTrelloBoard(), updateBoard(), ICONS, CreateProjectWrapper(), AVAILABLE_ICONS, EditBoardModal(), FileUploader(), ModalContext (+3 more)

### Community 33 - "prisma db pull"
Cohesion: 0.12
Nodes (16): Basic introspection, Command, Examples, Force overwrite, Generated Schema Example, MongoDB Introspection, Options, Post-Introspection Cleanup (+8 more)

### Community 34 - "prisma init"
Cohesion: 0.12
Nodes (16): Add an example model, Basic initialization, Bun Runtime, Command, Examples, Generated Config (Bun), Generated Config (Node.js default), Generated Schema (+8 more)

### Community 35 - "prisma migrate deploy"
Cohesion: 0.12
Nodes (16): Basic deployment, Best Practices, Check status first, Command, Comparison with migrate dev, Configuration, Docker deployment, Error Handling (+8 more)

### Community 36 - "Prisma Database Setup"
Cohesion: 0.12
Nodes (16): Bun Runtime, Configuration Files, Driver Adapters, How to Use, MongoDB, MySQL, PostgreSQL, Prisma Client Setup (Required) (+8 more)

### Community 37 - "Prisma Accelerate Users"
Cohesion: 0.12
Nodes (16): 1. Keep your Accelerate URL, 2. Install Accelerate extension, 3. Configure prisma.config.ts, 4. Instantiate client with accelerateUrl, Caching with Accelerate, Correct v7 Setup for Accelerate, Edge Runtime, Important (+8 more)

### Community 38 - "ESM and CommonJS Support"
Cohesion: 0.12
Nodes (16): Browser-Safe Types, Bun, "Cannot use import statement outside a module", CommonJS Projects, "ERR_REQUIRE_ESM", ESM and CommonJS Support, ESM Projects, File Extensions (+8 more)

### Community 39 - "Constructor Options"
Cohesion: 0.12
Nodes (15): accelerateUrl (For Accelerate users), adapter (Required for the SQL provider workflow), Basic Instantiation, comments, Constructor Options, errorFormat, log, Log Events (+7 more)

### Community 40 - "Schema Changes"
Cohesion: 0.12
Nodes (15): 1. Provider name, 2. Output is required, 3. engineType changed, 4. moduleFormat is explicit when needed, After Schema Changes, Datasource Block, Example Output Paths, Generated Entrypoints (+7 more)

### Community 41 - "Transactions"
Cohesion: 0.13
Nodes (14): All or nothing, Best Practices, Handle errors, Interactive Transactions, Isolation levels, Keep transactions short, Nested Writes, OrThrow in Transactions (+6 more)

### Community 42 - "Workflow"
Cohesion: 0.13
Nodes (14): Error Handling, Prerequisites, Prisma Postgres Setup, Reference Files, Step 1: Authenticate, Step 2: List available regions, Step 3: Create a project with a database, Step 4: Create a named connection (optional) (+6 more)

### Community 43 - "KanbanBoard.tsx"
Cohesion: 0.19
Nodes (8): createCard(), deleteCard(), moveCard(), ConfirmModal(), ConfirmModalProps, KanbanBoard(), PromptModal(), PromptModalProps

### Community 45 - "Prisma Compute Framework Readiness"
Cohesion: 0.14
Nodes (14): Astro, Bun, Elysia, and Plain Source Servers, CLI-First Model, CLI Matrix, Custom Build Artifacts, Hono, NestJS, Next.js (+6 more)

### Community 46 - "MongoDB Setup"
Cohesion: 0.14
Nodes (13): 1. Schema Configuration, 2. Environment Variable, Common Issues, Current Verification Notes, Driver Adapters, ID Field Requirement, "Invalid ObjectID", Migrations vs Introspection (+5 more)

### Community 47 - "Core Workflows"
Cohesion: 0.14
Nodes (13): 1. Console-first workflow, 2. Quick provisioning with create-db, 2b. Persistent databases with the Platform CLI, 3. Link an existing local project, 4. Programmatic provisioning with Management API, 5. Type-safe integration with Management API SDK, Core Workflows, How to Use (+5 more)

### Community 48 - "Modeller"
Cohesion: 0.14
Nodes (14): ActivityLog, Attachment, Board, BoardMember, Card, CardDescriptionHistory, ChatGroup / ChatGroupMember / ChatMessage, ChecklistItem (+6 more)

### Community 49 - "prisma db execute"
Cohesion: 0.15
Nodes (12): Command, Configuration, Current Option Surface, Examples, Execute from file, Execute from stdin, Execute `migrate diff` output, Limitations (+4 more)

### Community 50 - "Prisma Platform CLI App Deploy"
Cohesion: 0.15
Nodes (13): Agent Skill Installation, Auth and Project Binding, Build and Run Locally, Database and Env, Deploy, Deployment Story: GitHub vs CLI, Operations, Output Handling (+5 more)

### Community 51 - "MySQL Setup"
Cohesion: 0.15
Nodes (12): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, Common Issues, Connection String Format, Driver Adapter, JSON Support, MySQL Setup (+4 more)

### Community 52 - "management-api"
Cohesion: 0.15
Nodes (12): API exploration, Authentication methods, Base URL, Common endpoints, management-api, Notes, OAuth flow summary, Priority (+4 more)

### Community 53 - "prisma migrate diff"
Cohesion: 0.17
Nodes (11): Check for drift (CI), Command, Create baseline migration, Examples, Generate SQL for a schema change, Options, prisma migrate diff, Review pending migrations (+3 more)

### Community 54 - "prisma migrate reset"
Cohesion: 0.17
Nodes (11): Basic reset, Command, Configuration, Examples, Follow-up Steps, Force reset (CI/Automation), Options, prisma migrate reset (+3 more)

### Community 55 - "PostgreSQL Setup"
Cohesion: 0.17
Nodes (11): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, "Authentication failed", "Can't reach database server", Common Issues, Connection String Format, Driver Adapter (+3 more)

### Community 56 - "Prisma Postgres Setup"
Cohesion: 0.17
Nodes (11): 1. Schema Configuration, 2. Config Configuration, Connection String, Driver Adapter, Edge/serverless option, Features, Overview, Prisma Postgres Setup (+3 more)

### Community 57 - "SQLite Setup"
Cohesion: 0.17
Nodes (11): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, Common Issues, Connection String Format, "Database file not found", Driver Adapter, Limitations (+3 more)

### Community 58 - "SQL Server Setup"
Cohesion: 0.18
Nodes (10): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, Common Issues, Connection String Format, Driver Adapter, "Login failed for user", Prerequisites (+2 more)

### Community 59 - "create-db-cli"
Cohesion: 0.18
Nodes (10): Command discovery (`--help`), Commands, Common patterns, create-db-cli, `create` options, Lifecycle and claim flow, Priority, Programmatic usage (library API) (+2 more)

### Community 60 - "api-basics"
Cohesion: 0.18
Nodes (10): api-basics, Base URL, Collection, Error codes by HTTP status, Error Responses, Pagination, Resource ID Prefixes, Response Envelope (+2 more)

### Community 61 - "Column.tsx"
Cohesion: 0.33
Nodes (9): createColumn(), deleteColumn(), moveColumnPosition(), updateColumn(), updateColumnAllowedRoles(), CATEGORIES, COLORS, ProcessStatesClient() (+1 more)

### Community 62 - "prisma format"
Cohesion: 0.20
Nodes (9): Behavior, Command, Examples, Format default schema, Format specific schema, Options, prisma format, Use in Editor (+1 more)

### Community 63 - "prisma migrate resolve"
Cohesion: 0.20
Nodes (9): Command, Examples, Mark as Applied (Baselining), Mark as Rolled Back (Fixing Failures), Options, prisma migrate resolve, References, Use Cases (+1 more)

### Community 64 - "prisma validate"
Cohesion: 0.20
Nodes (9): Command, Common Errors, Examples, Options, prisma validate, Use in CI, Validate default schema, Validate specific schema (+1 more)

### Community 65 - "CockroachDB Setup"
Cohesion: 0.20
Nodes (9): 1. Schema Configuration, 2. Config Configuration, 3. Environment Variable, CockroachDB Setup, Common Issues, Driver Adapter, ID Generation, Prerequisites (+1 more)

### Community 66 - "decision-stay-or-migrate"
Cohesion: 0.20
Nodes (9): Bad, Blocker checks before migrating, decision-stay-or-migrate, Good, Priority, References, Stay-on-v6 hygiene, The facts the decision rests on (+1 more)

### Community 67 - "console-and-connections"
Cohesion: 0.20
Nodes (9): Adapter choices, Connection setup, console-and-connections, Console workflow, Linking an existing project, Local Studio, Priority, References (+1 more)

### Community 68 - "README.md"
Cohesion: 0.20
Nodes (5): Hızlı Başlangıç, İçindekiler, Kant Dokümantasyonu, Teknoloji Özeti, Varsayılan Kullanıcılar

### Community 69 - "prisma migrate status"
Cohesion: 0.22
Nodes (8): Check status, Command, Examples, Exit Codes, Options, prisma migrate status, What It Does, When to Use

### Community 70 - "Prisma Compute Config"
Cohesion: 0.22
Nodes (9): App Fields, Basic Shape, Database Scope, File Names and Discovery, Generating a Config with `init`, Monorepos and Multi-App Repos, Precedence, Prisma Compute Config (+1 more)

### Community 71 - "create-prisma Compute Flow"
Cohesion: 0.22
Nodes (9): Addon Notes, Basic Commands, create-prisma Compute Flow, Failure Handling, Generated Deploy Script, Generated Files to Preserve, PostgreSQL and Database Behavior, Reference (+1 more)

### Community 72 - "Quick Rules"
Cohesion: 0.22
Nodes (9): 1. Command Verification, 2. Auth and Workspace Selection, 3. Framework Readiness, 4. Runtime Host and Port Binding, 5. Typed Compute Config, 6. Branch, Environment, and Database, 7. Deploy Operations, 8. SDK and API (+1 more)

### Community 73 - "Prisma Compute"
Cohesion: 0.22
Nodes (9): Avoid, Decision Tree, Preferred Workflow, Prisma Compute, Prisma Compute CLI Surface, Rules by Priority, Send Feedback and Report CLI Issues, Source-of-Truth Order (+1 more)

### Community 74 - "migrations-mapping"
Cohesion: 0.22
Nodes (8): Bad, Good, migrations-mapping, Priority, Prisma Next: first-class, contract-driven migrations (Mongo included), References, v6: `db push` only, Why It Matters

### Community 75 - "schema-contract-mapping"
Cohesion: 0.22
Nodes (8): Bad, Environment requirements, Good, Priority, References, schema-contract-mapping, The mapping, Why It Matters

### Community 76 - "Prisma MongoDB Upgrade Path"
Cohesion: 0.22
Nodes (8): Decision table, Hand-off rule, If staying on v6: hygiene (a deliberate stay, not neglect), Prisma MongoDB Upgrade Path, Reference files, The decision, up front, The version landscape, Verified against

### Community 77 - "management-api-sdk"
Cohesion: 0.22
Nodes (8): Full SDK (OAuth + refresh), Install, management-api-sdk, OAuth SDK flow, Priority, References, Simple client (existing token), Why It Matters

### Community 78 - "endpoints"
Cohesion: 0.22
Nodes (8): Create connection, Create project (with database), Delete database, Delete project, endpoints, Get database, List projects, List regions

### Community 79 - "Mimari"
Cohesion: 0.22
Nodes (9): Dizin Yapısı, Dosya Yükleme, Genel Bakış, Kart Taşıma (Drag & Drop), Kimlik Doğrulama, Mimari, Sayfa Yapısı, Teknoloji Yığını (+1 more)

### Community 80 - "prisma mcp"
Cohesion: 0.25
Nodes (7): Command, Notes, prisma mcp, References, Typical Use Cases, Usage, What It Does

### Community 81 - "SDK and API Automation"
Cohesion: 0.25
Nodes (7): Compute SDK, Management API Concepts, Prefer the CLI for App Workflows, Regions, SDK and API Automation, SDK Build Strategies, Secrets and Redaction

### Community 82 - "client-api-mapping"
Cohesion: 0.25
Nodes (7): Bad, client-api-mapping, Good, Priority, References, The mapping, Why It Matters

### Community 83 - "Service Tokens"
Cohesion: 0.25
Nodes (7): auth, Creating a service token, OAuth 2.0 (for user-scoped access), Security practices, Service Tokens, Token scope, Using a service token

### Community 84 - "Veritabanı"
Cohesion: 0.25
Nodes (8): Bağlantı, Enum'lar, İlişki Diyagramı, Migration, Priority, Role, Seed, Veritabanı

### Community 85 - "page.tsx"
Cohesion: 0.32
Nodes (4): createProject(), searchCards(), CreateProjectModal(), GlobalSearch()

### Community 86 - "layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, ModalProvider(), Sidebar()

### Community 87 - "prisma debug"
Cohesion: 0.29
Nodes (6): Command, Example Output, Options, prisma debug, What It Does, When to Use

### Community 88 - "Prisma Client Setup"
Cohesion: 0.29
Nodes (6): 1. Install dependencies, 2. Add generator block, 3. Generate Prisma Client, 4. Instantiate Prisma Client, 5. Use a single instance, Prisma Client Setup

### Community 89 - "verify-cutover-checklist"
Cohesion: 0.29
Nodes (6): Checklist, Ground rules, Priority, References, verify-cutover-checklist, Why It Matters

### Community 90 - "Prisma 7 Client Instantiation"
Cohesion: 0.29
Nodes (6): Basic instantiation, Common mistakes, Key rules, Prisma 7 Client Instantiation, Required packages, Usage in application code

### Community 91 - "dependencies"
Cohesion: 0.29
Nodes (7): date-fns, file-saver, match-sorter, dependencies, date-fns, file-saver, match-sorter

### Community 93 - "Bileşen Mimarisi"
Cohesion: 0.33
Nodes (6): Bileşen Mimarisi, Board Çekirdeği, Dashboard, Görünümler, İletişim, Ortak

### Community 94 - "BoardListDnd.tsx"
Cohesion: 0.47
Nodes (4): reorderBoards(), BoardListDnd(), BoardListDndProps, SortableBoardCard()

### Community 97 - "Yapılandırma"
Cohesion: 0.50
Nodes (4): Middleware Matcher, next.config.ts, prisma.config.ts, Yapılandırma

### Community 98 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 101 - "next-auth.d.ts"
Cohesion: 0.50
Nodes (3): next-auth, Session, User

## Knowledge Gaps
- **988 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+983 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `@tiptap/pm`, `@tiptap/react`, `@tiptap/starter-kit`, `bcryptjs`, `clsx`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `jszip`, `lucide-react`, `next`, `next-auth`, `pg`, `@prisma/adapter-pg`, `@prisma/client`, `react`, `react-dom`, `tailwind-merge`, `@tailwindcss/typography`, `@tiptap/extension-bubble-menu`, `@tiptap/extension-color`, `@tiptap/extension-link`, `@tiptap/extension-text-style`, `@tiptap/extension-underline`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `jszip` connect `jszip` to `actions.ts`, `dependencies`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `CardModal()` connect `actions.ts` to `useModal`, `KanbanBoard.tsx`, `jszip`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _988 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
- **Should `Prisma 7 Driver Adapter Implementation Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._