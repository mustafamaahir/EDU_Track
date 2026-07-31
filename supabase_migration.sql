-- Run this in Supabase SQL Editor to add superadmin support

-- 1. Add superadmin role support (status column already added earlier)
-- Update role check if you have a constraint:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Create admin_classes table
CREATE TABLE IF NOT EXISTS admin_classes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  UNIQUE(admin_id, class_name)
);

CREATE INDEX IF NOT EXISTS idx_admin_classes_admin_id ON admin_classes(admin_id);

-- 3. Create superadmin via SQL (replace password hash with your own)
-- Generate hash: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('yourpassword'))"
INSERT INTO users (username, password_hash, name, class_name, role, status)
VALUES (
  'superadmin',
  '$2b$12$REPLACE_WITH_YOUR_HASH',
  'Super Admin',
  '',
  'superadmin',
  'approved'
) ON CONFLICT (username) DO NOTHING;
