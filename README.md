# ScormStack

**Create professional SCORM courses in minutes — no team, no technical knowledge, no expensive tools.**

Upload a Word or PDF document, AI structures the content, and the SCORM package is automatically generated — ready to import into Moodle or any LMS.

**Problem:** producing SCORM courses requires expensive tools, a technical team, and days of work.  
**Decision:** a web platform with AI generation that transforms documents into structured courses automatically.  
**Result:** course production time and cost reduced from days to minutes, with no team or specialized tools required

<img width="2967" height="1591" alt="image" src="https://github.com/user-attachments/assets/2ef5d87e-59fd-44ff-a41b-67616ed2e9b1" />

---

## Features

- Automatic course generation via AI from Word documents (.docx/.doc)
  - AI uses **strictly the content from the uploaded document**, without inventing or adding extra information
  - Two modes: **automatic** (AI chooses the best resources) and **with markers** (precise control via markers in the document)
  - Automatically structures content into units with interactive resources (accordion, quiz, flipcard, etc.)
- Manual course creation with multiple units and rich content (markdown)
- Interactive course preview before export
- Export SCORM 1.2 packages compatible with any LMS
- Player with integrated dark mode
- Course PDF generation
- JWT authentication (login/registration) with role-based access (ADMIN, GESTOR, CONTEUDISTA, REVISOR, CONVIDADO)
- Course ownership, access requests/collaborators, and an editorial review workflow
- Real-time co-editing (presence avatars and cursors) via Liveblocks
- User management and activity logs
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

## Technical Decisions

**Isolated Vite player** — the generated SCORM package runs completely independently inside the LMS, with no dependency on the main application. This ensures maximum compatibility with any LMS.

**Async generation with SCORMJob** — package generation is a heavy process. Instead of blocking the request, the job is queued and processed in the background, with status polling on the frontend. Solves Vercel's 60s timeout limit.

**AI as extractor, not inventor** — Gemini is used to structure content from documents without consistent formatting. The prompt is built to use exclusively the content of the uploaded document, without hallucinating extra information.

---

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL (Neon)

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env` at the root and fill in the values:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here

# AI course generation
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key   # optional

# Image uploads (optional)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Real-time collaboration (optional) — https://liveblocks.io
LIVEBLOCKS_SECRET_KEY=your-liveblocks-key
NEXT_PUBLIC_COLLAB_ENABLED=true
```

### 3. Database

```bash
pnpm db:migrate   # create tables
pnpm db:seed      # populate with initial data (optional)
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
│   │   ├── scorm-jobs/         # Job queue
│   │   ├── scorm-status/       # Job status
│   │   ├── scorm-download/     # ZIP download
│   │   ├── users/              # User management
│   │   ├── activities/         # Activity logs
│   │   ├── extract-document/   # PDF/DOCX → text
│   │   └── upload-image/       # Image uploads
│   ├── scorm-preview/          # SCORM player
│   ├── cursos/                 # Course management
│   ├── home/                   # Dashboard
│   ├── login/
│   ├── cadastro/
│   └── usuarios/
├── components/
│   ├── SCORMNavbar.tsx
│   ├── ThemeProvider.tsx
│   ├── ExportModal.tsx
│   ├── PreviewCurso.tsx
│   ├── scorm/
│   └── ui/                     # shadcn/ui
├── hooks/
│   ├── useSCORM.ts
│   ├── useLMS.ts
│   ├── useTheme.ts
│   └── useCurso.ts
├── lib/
│   ├── scorm-build-service.ts  # In-memory SCORM generation
│   ├── scorm-service.ts
│   ├── auth.ts
│   ├── prisma.ts
│   └── pdf-service.ts
├── types/
└── context/

prisma/
└── schema.prisma               # Models: User, Curso, CursoColaborador, CursoAccessRequest, CursoComentario, Activity, SCORMJob

generate-scorm-isolated.mjs     # Isolated SCORM build script
```

---

## Database

| Model                | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `User`               | System users, with role (ADMIN, GESTOR, CONTEUDISTA, REVISOR, CONVIDADO) |
| `Curso`              | Courses with units (JSON), owner, editorial status and version           |
| `CursoColaborador`   | Users granted access to edit a course                                    |
| `CursoAccessRequest` | Access requests to a course (pending/approved/denied/revoked)            |
| `CursoComentario`    | Review comments on a course                                              |
| `Activity`           | User action logs                                                         |
| `SCORMJob`           | Queue and status of async SCORM exports                                  |

---

## Deploy (Vercel)

1. Connect the repository on [Vercel](https://vercel.com)
2. Configure environment variables in the Vercel dashboard
3. Create a PostgreSQL database (Neon)
4. Automatic deployment on every push to `main` branch

> **Warning**: SCORM export via full Next.js build doesn't work on Vercel due to the 60s timeout limit. The current approach uses in-memory generation via `scorm-build-service.ts`.

---

## License

MIT — open source educational content generator.
