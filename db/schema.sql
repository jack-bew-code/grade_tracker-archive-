-- Grade tracker tables. Run with: npm run db:setup
-- Deleting a parent deletes everything under it (ON DELETE CASCADE).

CREATE TABLE IF NOT EXISTS courses (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  weighting_mode TEXT NOT NULL DEFAULT 'credits' CHECK (weighting_mode IN ('credits', 'percent')),
  target_grade   DOUBLE PRECISION,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS years (
  id            SERIAL PRIMARY KEY,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  position      INTEGER NOT NULL DEFAULT 0,
  weight        DOUBLE PRECISION NOT NULL DEFAULT 0,   -- % of the course
  total_credits INTEGER NOT NULL DEFAULT 120
);

CREATE TABLE IF NOT EXISTS semesters (
  id       SERIAL PRIMARY KEY,
  year_id  INTEGER NOT NULL REFERENCES years(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modules (
  id          SERIAL PRIMARY KEY,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  credits     DOUBLE PRECISION,   -- used in "credits" mode
  weight      DOUBLE PRECISION    -- % of the year, used in "percent" mode
);

CREATE TABLE IF NOT EXISTS components (
  id        SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  kind      TEXT NOT NULL DEFAULT 'exam' CHECK (kind IN ('exam', 'coursework', 'other')),
  weight    DOUBLE PRECISION NOT NULL DEFAULT 0,   -- % of the module
  grade     DOUBLE PRECISION,                      -- your real mark
  predicted DOUBLE PRECISION,                      -- a "what-if" mark
  due_date  DATE
);

-- Added with login: each course belongs to one Clerk user.
ALTER TABLE courses ADD COLUMN IF NOT EXISTS user_id TEXT;
CREATE INDEX IF NOT EXISTS courses_user_id_idx ON courses (user_id);

-- Every course must belong to someone (no "unowned" courses that anyone could see).
ALTER TABLE courses ALTER COLUMN user_id SET NOT NULL;
