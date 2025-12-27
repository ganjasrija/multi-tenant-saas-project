# System Architecture Document

## 1. System Architecture Overview

This multi-tenant SaaS platform follows a standard three-tier architecture consisting of a client layer, application layer, and data layer. The architecture is designed to ensure scalability, security, and strict tenant data isolation.

### High-Level Architecture Components

1. **Client (Browser)**
   - Used by Super Admins, Tenant Admins, and End Users
   - Accesses the application through a web browser
   - Sends HTTP requests to the frontend application

2. **Frontend Application**
   - Built using React.js
   - Handles user interface, routing, and form validation
   - Communicates with the backend using REST APIs
   - Stores JWT token on successful authentication

3. **Backend API Server**
   - Built using Node.js and Express.js
   - Exposes RESTful API endpoints
   - Handles authentication, authorization, tenant isolation, and business logic
   - Validates JWT tokens and enforces role-based access control (RBAC)

4. **Database**
   - PostgreSQL relational database
   - Stores tenants, users, projects, tasks, and audit logs
   - Enforces data integrity using foreign keys and indexes

### Authentication Flow

1. User submits login credentials from the browser
2. Backend validates credentials and generates a JWT token
3. JWT token contains userId, tenantId, and role
4. Token is sent to the frontend and stored securely
5. For every API request, the frontend sends the token in the Authorization header
6. Backend validates the token and extracts tenant and role information
7. Requests are authorized and tenant-filtered before accessing data

The system architecture diagram is stored at:

docs/images/system-architecture.png

---

## 2. Database Schema Design (ERD)

The database schema is designed to support a multi-tenant SaaS architecture with strict data isolation. Each tenant-specific record is associated with a tenant using a `tenant_id` column.

### Core Tables

1. **tenants**
   - id (Primary Key)
   - name
   - subdomain
   - status
   - subscription_plan
   - max_users
   - max_projects

2. **users**
   - id (Primary Key)
   - tenant_id (Foreign Key → tenants.id)
   - email
   - password_hash
   - full_name
   - role

3. **projects**
   - id (Primary Key)
   - tenant_id (Foreign Key → tenants.id)
   - name
   - description
   - created_by (Foreign Key → users.id)

4. **tasks**
   - id (Primary Key)
   - project_id (Foreign Key → projects.id)
   - tenant_id (Foreign Key → tenants.id)
   - title
   - status
   - priority
   - assigned_to (Foreign Key → users.id)

5. **audit_logs**
   - id (Primary Key)
   - tenant_id (Foreign Key → tenants.id)
   - user_id (Foreign Key → users.id)
   - action
   - entity_type
   - entity_id

### Database Design Highlights

- All tenant-specific tables include `tenant_id`
- Foreign keys enforce referential integrity
- Indexes are created on tenant_id columns for performance
- Cascade delete is applied where appropriate

The database ERD diagram is stored at:

docs/images/database-erd.png

---

## 3. API Architecture

The backend exposes RESTful APIs organized by functional modules. Authentication and authorization are enforced using JWT and role-based access control.

### Authentication APIs
- POST /api/auth/register-tenant (Public)
- POST /api/auth/login (Public)
- GET /api/auth/me (Authenticated)
- POST /api/auth/logout (Authenticated)

### Tenant Management APIs
- GET /api/tenants/:tenantId (Tenant Admin, Super Admin)
- PUT /api/tenants/:tenantId (Tenant Admin, Super Admin)
- GET /api/tenants (Super Admin)

### User Management APIs
- POST /api/tenants/:tenantId/users (Tenant Admin)
- GET /api/tenants/:tenantId/users (Tenant Users)
- PUT /api/users/:userId (Tenant Admin / Self)
- DELETE /api/users/:userId (Tenant Admin)

### Project Management APIs
- POST /api/projects (Authenticated Users)
- GET /api/projects (Authenticated Users)
- PUT /api/projects/:projectId (Tenant Admin / Creator)
- DELETE /api/projects/:projectId (Tenant Admin / Creator)

### Task Management APIs
- POST /api/projects/:projectId/tasks (Authenticated Users)
- GET /api/projects/:projectId/tasks (Authenticated Users)
- PUT /api/tasks/:taskId (Authenticated Users)
- PATCH /api/tasks/:taskId/status (Authenticated Users)
