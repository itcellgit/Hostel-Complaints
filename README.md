# KLS Hostel Complaints Portal

A hostel complaint management system for the Karnataka Law Society (KLS), a
society that runs multiple colleges and hostels. This build implements the
portal end-to-end for **GIT (Gogte Institute of Technology)**'s two
dedicated hostels — GIT Boys Hostel and GIT Girls Hostel — on a data model
designed so onboarding every other college/hostel later is a **data-only**
change (no schema or code changes required).

## Domain model

```
Society
 └─ College (e.g. GIT)
     └─ Program (e.g. CSE, ECE)
 Hostel (BOYS or GIRLS)
  ├─ linked to one or more Colleges (GIT's hostels link to just GIT;
  |   a shared hostel elsewhere in the society can link several)
  ├─ Students (each belongs to exactly one hostel + one program)
  ├─ Staff tenure history (Rector = hostel incharge, Faculty Incharge)
  |   — one active Rector per hostel at a time, tracked with start/end dates
  └─ Complaints (filed by a resident Student, routed to Dean Infra)
```

### Complaint lifecycle

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
  └──────────────→ REJECTED
```

- Only an **active resident Student** can file a complaint, and only for
  their own hostel (not selectable — derived from their own record).
- Every complaint is auto-assigned to that hostel's **Dean Infra** and is
  visible to the hostel's **Faculty Incharge** (read + comment) and
  **Rector** (read-only oversight).
- **Dean Infra** is the only role that drives OPEN → IN_PROGRESS → RESOLVED
  (or → REJECTED).
- Once RESOLVED, either the **complainant Student** closes it (optional
  feedback/comment) or, if they don't, the **Faculty Incharge** closes it
  instead (comment required).
- Complaints display the linked student's **fee summary** (total paid,
  payment count, last payment) alongside the complaint details.

## Roles

| Role | Scope | Access |
|---|---|---|
| Admin | Society-wide | Creates colleges/hostels/programs, manages Rector/Faculty tenures, manages students & users, views everything |
| Principal | Their college | Read-only: hostels, students, complaints + a stats dashboard, for hostels housing their college's students |
| Society Registrar | Society-wide | Read-only: complaints + a society-wide stats dashboard |
| GIT Dean Infra | Hostels they're scoped to (data-driven, not hardcoded to "GIT") | Acts on (progresses/rejects) complaints for their hostels |
| Rector | Their one hostel | Hostel incharge: manages the student roster (add/bulk-upload/mark left), views complaints read-only |
| Faculty Incharge | Their hostel(s) | Views students read-only; views, comments on, and can close RESOLVED complaints |
| Student | Themselves | Views own profile & fee history, files and tracks/closes their own complaints |

Students log in with their **USN**; every other role logs in with an email
(`loginId`). All accounts created by an Admin/Rector get a generated
temporary password and must change it on first login.

## Tech stack

- **Client**: React 19, Vite, React Router, TanStack Query, Tailwind CSS v4, Recharts
- **Server**: Node/Express, PostgreSQL via Prisma ORM, JWT (httpOnly cookies) auth, zod validation, Multer + ExcelJS for the student bulk-upload
- **Repo layout**: npm workspaces monorepo — `client/`, `server/`, root `docker-compose.yml` for Postgres

```
hostel_complaints/
  client/     React + Vite + Tailwind SPA
  server/     Express API + Prisma schema/migrations/seed
  docker-compose.yml
```

## Setup

### 1. Database

Either run Postgres via Docker:

```
npm run db:up
```

...or, if you already have a local PostgreSQL server, run the one-time
setup script against it as a superuser (matches the credentials already in
`server/.env.example`):

```
psql -U postgres -f server/prisma/local-db-setup.sql
```

### 2. Install dependencies (root, installs both workspaces)

```
npm install
```

### 3. Configure environment

```
cp server/.env.example server/.env
```

Adjust `DATABASE_URL`/JWT secrets if you didn't use the defaults above.

### 4. Migrate & seed

```
npm run db:migrate
npm run db:seed
```

The seed creates GIT + 4 programs, both GIT hostels, and one account per
role (see below) plus sample students, fee payments, and complaints across
every lifecycle state.

### 5. Run

```
npm run dev
```

Client on `http://localhost:5173` (proxies `/api` to the server), server on
`http://localhost:4000`.

### Demo credentials (password for all: `Passw0rd!`)

| Role | Login ID |
|---|---|
| Admin | `admin@kls.edu` |
| Principal (GIT) | `principal.git@kls.edu` |
| Society Registrar | `registrar@kls.edu` |
| GIT Dean Infra | `dean.infra.git@kls.edu` |
| Rector (Boys / Girls) | `rector.boys@kls.edu` / `rector.girls@kls.edu` |
| Faculty Incharge (Boys / Girls) | `faculty.boys@kls.edu` / `faculty.girls@kls.edu` |
| Students | e.g. `2GI22CS001` (see `server/prisma/seed.js` for the full list) |

## Student bulk upload

Rector (own hostel) or Admin (any hostel) can upload a `.xlsx`/`.csv` roster
via **Students → Bulk upload**. Expected header row (any order):

```
firstName, lastName, usn, programCode, collegeCode (only if the hostel is
shared by multiple colleges), phone, address, parentName, parentPhone,
parent2Name (optional), parent2Phone (optional), emergencyContact
(optional), roomNo (optional)
```

Each row is imported independently (one bad row doesn't block the rest);
the response reports what was created, what failed and why, and the
generated temporary password for each new student account.

## Scalability notes

- **Onboarding a new college/hostel is data-only.** `Hostel` ↔ `College` is
  a many-to-many join (`HostelCollege`), and Dean Infra's scope is a data
  table (`DeanInfraHostel`) rather than an "if college === GIT" check
  anywhere in the code.
- Stateless JWT auth (httpOnly cookies) means the API can scale
  horizontally without sticky sessions.
- All foreign keys and common filter columns (`hostelId`, `usn`,
  `loginId`, complaint `status`) are indexed.
- Role-based data scoping lives in one place (`server/src/utils/scope.js`)
  and is reused by every list/detail/dashboard route, so adding a new
  role or tightening a scope is a one-file change.

## What's explicitly out of scope for this pass

Called out here rather than silently skipped:

- **Automated tests** — none included; recommend adding integration tests
  around the complaint lifecycle and role-scoping before production use.
- **Room/bed capacity enforcement** — room numbers are recorded, but the
  system won't stop a hostel from being over-allocated.
- **Complaint attachments** (photos of the issue).
- **Email/SMS notifications** on status changes or new complaints — the
  portal is currently pull-based (users check it themselves).
- **Fee dues/structure** — only payments *received* are modeled (a ledger),
  not what's owed or due dates/defaulter tracking.
- **Forgot-password flow** — a disabled/locked-out account currently needs
  an Admin to reset it.
- **Multiple Dean Infra per hostel** — a complaint auto-assigns to whichever
  Dean Infra is linked to that hostel; if a hostel ever has more than one,
  the first found is used. A claiming/round-robin queue would be needed to
  support that properly.
- **PDF/Excel export of reports**, an **admin audit log**, and
  **outpass/visitor logs** — common hostel-management features not asked
  for here but worth considering later.
- **Hostel transfer workflow** — moving an existing student to a different
  hostel isn't currently supported via the UI (only Admin editing the
  record directly would achieve it, without preserving history of the
  change).

## Security notes

- `xlsx` (SheetJS) has open advisories with no fix on the npm registry, so
  the bulk-upload feature uses `exceljs` instead. `exceljs`'s own zip-write
  dependency chain (`archiver`) has advisories too, but this server only
  ever *reads* uploaded spreadsheets — the vulnerable write path is never
  invoked. Worth re-checking on future dependency updates.
- `react-router-dom`'s current advisory concerns React Server Components
  "framework mode" (server actions); this app is a plain client-rendered
  SPA (`BrowserRouter`, no RSC/server actions), so it isn't exposed.
