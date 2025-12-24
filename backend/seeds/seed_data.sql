-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. SUPER ADMIN (NO TENANT)
-- =========================
INSERT INTO users (
  id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  NULL,
  'superadmin@system.com',
  '$2b$10$Q9QfZpYzWZ0pQf8FjZfY0O8QbGZl6Zb4Xxg5E1pQ8u0Cq1Zkz9yYy', -- Admin@123
  'System Super Admin',
  'super_admin',
  true,
  NOW(),
  NOW()
);

-- =========================
-- 2. TENANT: DEMO COMPANY
-- =========================
INSERT INTO tenants (
  id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Demo Company',
  'demo',
  'active',
  'pro',
  25,
  15,
  NOW(),
  NOW()
);

-- =========================
-- 3. TENANT ADMIN
-- =========================
INSERT INTO users (
  id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  t.id,
  'admin@demo.com',
  '$2b$10$1KZrZxYtY6G8wZp9QeYFxeZ4D5C0xY6p9KZlGQeY0Ck1PZ9yYy', -- Demo@123
  'Demo Admin',
  'tenant_admin',
  true,
  NOW(),
  NOW()
FROM tenants t WHERE t.subdomain = 'demo';

-- =========================
-- 4. REGULAR USERS
-- =========================
INSERT INTO users (
  id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'user1@demo.com',
'$2b$10$7Zp9QeYFxeZ4D5C0xY6p9KZlGQeY0Ck1PZ9yYyKZrZxYtY6G8w',
'Demo User One', 'user', true, NOW(), NOW()
FROM tenants t WHERE t.subdomain='demo';

INSERT INTO users (
  id, tenant_id, email, password_hash, full_name, role, is_active, created_at, updated_at
)
SELECT gen_random_uuid(), t.id, 'user2@demo.com',
'$2b$10$7Zp9QeYFxeZ4D5C0xY6p9KZlGQeY0Ck1PZ9yYyKZrZxYtY6G8w',
'Demo User Two', 'user', true, NOW(), NOW()
FROM tenants t WHERE t.subdomain='demo';

-- =========================
-- 5. PROJECTS
-- =========================
INSERT INTO projects (
  id, tenant_id, name, description, status, created_by, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  t.id,
  'Project Alpha',
  'First demo project',
  'active',
  u.id,
  NOW(),
  NOW()
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
WHERE t.subdomain = 'demo';

INSERT INTO projects (
  id, tenant_id, name, description, status, created_by, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  t.id,
  'Project Beta',
  'Second demo project',
  'active',
  u.id,
  NOW(),
  NOW()
FROM tenants t
JOIN users u ON u.tenant_id = t.id AND u.role = 'tenant_admin'
WHERE t.subdomain = 'demo';

-- =========================
-- 6. TASKS (5 TASKS)
-- =========================
INSERT INTO tasks (
  id, project_id, tenant_id, title, description, status, priority, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  p.tenant_id,
  'Design UI',
  'Create UI design',
  'todo',
  'high',
  NOW(),
  NOW()
FROM projects p WHERE p.name='Project Alpha';

INSERT INTO tasks (
  id, project_id, tenant_id, title, description, status, priority, created_at, updated_at
)
SELECT gen_random_uuid(), p.id, p.tenant_id,
'Build API', 'Develop backend APIs', 'in_progress', 'medium', NOW(), NOW()
FROM projects p WHERE p.name='Project Alpha';

INSERT INTO tasks (
  id, project_id, tenant_id, title, description, status, priority, created_at, updated_at
)
SELECT gen_random_uuid(), p.id, p.tenant_id,
'Write Tests', 'Add unit tests', 'todo', 'low', NOW(), NOW()
FROM projects p WHERE p.name='Project Beta';

INSERT INTO tasks (
  id, project_id, tenant_id, title, description, status, priority, created_at, updated_at
)
SELECT gen_random_uuid(), p.id, p.tenant_id,
'Deploy App', 'Docker deployment', 'todo', 'high', NOW(), NOW()
FROM projects p WHERE p.name='Project Beta';

INSERT INTO tasks (
  id, project_id, tenant_id, title, description, status, priority, created_at, updated_at
)
SELECT gen_random_uuid(), p.id, p.tenant_id,
'Review Code', 'Final review', 'completed', 'medium', NOW(), NOW()
FROM projects p WHERE p.name='Project Beta';
