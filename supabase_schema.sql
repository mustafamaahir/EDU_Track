-- ══════════════════════════════════════════════
--  EduTrack — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════

-- 1. Users table (students + admins)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- bcrypt hashed
  name          TEXT NOT NULL,
  class_name    TEXT NOT NULL,            -- e.g. "Form 3A"
  role          TEXT NOT NULL DEFAULT 'student'  -- 'student' or 'admin'
                CHECK (role IN ('student', 'admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Results table
CREATE TABLE IF NOT EXISTS results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week         TEXT NOT NULL,             -- e.g. "Week 1"
  subject      TEXT NOT NULL,
  score        NUMERIC(5,2) NOT NULL,
  max_score    NUMERIC(5,2) NOT NULL DEFAULT 100,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate subject entries per student per week
  UNIQUE (student_id, week, subject)
);

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_results_student  ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_week     ON results(week);
CREATE INDEX IF NOT EXISTS idx_users_username   ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_class      ON users(class_name);


-- ══════════════════════════════════════════════
--  SAMPLE DATA — remove before going live
-- ══════════════════════════════════════════════
-- Passwords below are bcrypt hashes of "pass123"
-- Generate real hashes with: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"

INSERT INTO users (username, password_hash, name, class_name, role) VALUES
  ('alice',   '$2b$12$PLACEHOLDER_HASH', 'Alice Mensah',   'Form 3A', 'student'),
  ('bob',     '$2b$12$PLACEHOLDER_HASH', 'Bob Asante',     'Form 3A', 'student'),
  ('carol',   '$2b$12$PLACEHOLDER_HASH', 'Carol Osei',     'Form 3A', 'student'),
  ('david',   '$2b$12$PLACEHOLDER_HASH', 'David Kofi',     'Form 3B', 'student'),
  ('teacher', '$2b$12$PLACEHOLDER_HASH', 'Mr. Acheampong', 'Admin',   'admin')
ON CONFLICT DO NOTHING;
