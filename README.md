# Grade Tracker

Plan your degree and track your grades. Next.js + shadcn/ui + Neon Postgres.

Course → Years → Semesters → Modules → Exams/Coursework. Add things as you find out about them —
weights are worked out from the start (e.g. "banked 0.6% of the 0.8% of your degree graded so far").

## Setup

1. `npm install`
2. Get a database URL into `.env.local` (`DATABASE_URL=...`). This project uses Neon via the Vercel Marketplace:
   `npx vercel link` then `npx vercel env pull .env.local`
3. `npm run db:setup` — creates the tables (safe to re-run)
4. `npm run db:seed` — optional example course
5. `npm run dev` → http://localhost:3000

## Where things live

- `lib/grades.ts` — all the grade maths (tested in `lib/grades.test.ts`, run `npm test`)
- `lib/queries.ts` — reading from the database
- `lib/actions.ts` — Server Actions for every change
- `db/schema.sql` — the tables
- `app/` — pages (`/`, `/setup`, `/courses/[courseId]`)
- `components/` — the tree, overview, plan, forms; `components/ui/` is shadcn
