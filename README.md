# SCORM Course Generator

Web system for creating and exporting educational courses in the **SCORM 1.2** standard, with content generation powered by **Artificial Intelligence** (Google Gemini / OpenAI).

<img width="2967" height="1591" alt="image" src="https://github.com/user-attachments/assets/2ef5d87e-59fd-44ff-a41b-67616ed2e9b1" />


---

## Features

- Create courses with multiple units and rich content (markdown)
- **Automatic course generation via AI** from Word documents (.docx/.doc)
  - AI uses **strictly the content from the uploaded document**, without inventing or adding extra information
  - Supports two modes: **automatic** (AI chooses the best resources) and **with markers** (precise control via markers in the document)
  - Automatically structures content into units with interactive resources (accordion, quiz, flipcard, etc.)
- Interactive course preview before export
- Export SCORM 1.2 packages compatible with any LMS
- Integrated dark mode in the SCORM player
- JWT authentication (login/registration)
- User management and activity logs
- Course PDF generation
- Image upload via Vercel Blob

---

## Stack

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Framework       | Next.js 15 (App Router)                                  |
| UI              | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui      |
| Database        | PostgreSQL via Prisma ORM                                |
| Authentication  | JWT (jose + jsonwebtoken) + bcryptjs                     |
| AI              | Google Gemini (`@google/generative-ai`) + OpenAI         |
| SCORM           | Generation of imsmanifest.xml + JS wrapper + ZIP (JSZip) |
| PDF             | jsPDF + html2canvas + Puppeteer                          |
| Testing         | Jest + Testing Library + Playwright                      |
| Deploy          | Vercel                                                   |
| Package manager | pnpm                                                     |

---

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (Supabase or Vercel Postgres)

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Create `.env.local` at the root:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For AI course generation
GOOGLE_AI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key   # optional

# For image uploads
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### 3. Database

```bash
# Create tables
pnpm db:migrate

# (Optional) Populate with initial data
pnpm db:seed
```

### 4. Run in development

```bash
pnpm dev
```

Access [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
pnpm dev              # development server
pnpm build            # production build (includes prisma generate)
pnpm start            # production server
pnpm lint             # ESLint
pnpm test             # unit tests (Jest)
pnpm test:coverage    # test coverage
pnpm test:e2e         # E2E tests (Playwright)
pnpm db:migrate       # database migrations
pnpm db:studio        # Prisma Studio (database UI)
pnpm db:seed          # database seeding
```

---

## SCORM Export

The export process generates a `.zip` file compatible with SCORM 1.2 containing:

- `imsmanifest.xml` — manifest with course structure
- `scorm-preview/index.html` — course homepage
- `scorm-preview/unidade/<id>.html` — one page per unit
- `_next/static/` — assets (CSS, JS, fonts)
- `scorm_api_wrapper.js` — SCORM API wrapper (1.2 and 2004)
- `images/` — course images

The ZIP package can be imported into any LMS compatible with SCORM 1.2 (Moodle, TalentLMS, etc.).

### Manual generation (development)

```bash
node generate-scorm-isolated.mjs "/path/to/course.json" "/path/output.zip"
```

---

## Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes (serverless)
│   │   ├── auth/               # Login/logout
│   │   ├── cursos/             # Course CRUD
│   │   ├── generate-course-from-text/  # AI generation
│   │   ├── generate-scorm-v2/  # SCORM export
│   │   ├── scorm-jobs/         # SCORM job queue
│   │   ├── scorm-status/       # Job status
│   │   ├── scorm-download/     # ZIP download
│   │   ├── users/              # User management
│   │   ├── activities/         # Activity logs
│   │   ├── extract-document/   # PDF/DOCX → text
│   │   └── upload-image/       # Image uploads
│   ├── scorm-preview/          # SCORM player (static Server Components)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── unidade/[unidadeId]/page.tsx
│   ├── cursos/                 # Course management
│   ├── home/                   # Dashboard
│   ├── login/                  # Authentication
│   ├── cadastro/               # Registration
│   └── usuarios/               # User management
├── components/                 # React components
│   ├── SCORMNavbar.tsx         # SCORM player navbar
│   ├── ThemeProvider.tsx       # Dark mode
│   ├── ExportModal.tsx         # Export modal
│   ├── PreviewCurso.tsx        # Interactive preview
│   ├── scorm/                  # SCORM components
│   └── ui/                     # shadcn/ui
├── hooks/                      # Custom hooks
│   ├── useSCORM.ts             # SCORM export
│   ├── useLMS.ts               # SCORM API integration
│   ├── useTheme.ts             # Dark mode
│   └── useCurso.ts             # Course data
├── lib/                        # Utilities and services
│   ├── scorm-build-service.ts  # In-memory SCORM generation
│   ├── scorm-service.ts        # SCORM logic
│   ├── auth.ts                 # Authentication
│   ├── prisma.ts               # Prisma client
│   └── pdf-service.ts          # PDF generation
├── types/                      # TypeScript types
└── context/                    # React Context

prisma/
└── schema.prisma               # Models: User, Curso, Activity, SCORMJob

generate-scorm-isolated.mjs     # Isolated SCORM build script
```

---

## Database

| Model      | Description                                    |
| ---------- | ---------------------------------------------- |
| `User`     | System users (name, position, login, password) |
| `Curso`    | Courses with units (JSON structure)            |
| `Activity` | User action logs                               |
| `SCORMJob` | Queue and status of async SCORM exports        |

---

## Deploy (Vercel)

1. Connect the repository on [Vercel](https://vercel.com)
2. Configure environment variables in the Vercel dashboard
3. Create a PostgreSQL database (Vercel Postgres or Supabase)
4. Automatic deployment on every push to `main` branch

> **Warning**: SCORM export via full Next.js build doesn't work on Vercel due to timeout (60s maximum on Pro plan, build takes 2-5 minutes). The current approach uses in-memory generation via `scorm-build-service.ts`.

---

## License

MIT License - Open source educational content generator.
