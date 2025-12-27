# Technical Specification

## 1. Project Structure

The project follows a modular and scalable structure suitable for a production-ready multi-tenant SaaS application. The backend and frontend are maintained as separate services to support independent development and deployment.

---

## Backend Folder Structure
backend/
├── src/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middleware/
│ ├── utils/
│ └── config/
├── migrations/
├── seeds/
├── tests/
├── app.js
├── server.js
└── package.json

### Description of Backend Folders

- **controllers/**  
  Handles request logic for API endpoints.

- **models/**  
  Database models representing tables like tenants, users, projects, and tasks.

- **routes/**  
  API route definitions mapped to controllers.

- **middleware/**  
  JWT authentication, role authorization, tenant isolation, and error handling.

- **utils/**  
  Helper functions such as password hashing, audit logging, and token generation.

- **config/**  
  Configuration files for database and environment setup.

- **migrations/**  
  SQL or migration scripts to create and update database schema.

- **seeds/**  
  Initial seed data for super admin, tenants, users, projects, and tasks.

- **tests/**  
  Unit and integration tests.

---

## Frontend Folder Structure

frontend/
├── src/
│ ├── components/
│ ├── pages/
│ ├── services/
│ ├── hooks/
│ ├── context/
│ ├── utils/
│ ├── styles/
│ ├── App.js
│ └── index.js
├── public/
└── package.json

### Description of Frontend Folders

- **components/**  
  Reusable UI components.

- **pages/**  
  Application pages such as Login, Dashboard, Projects, and Users.

- **services/**  
  API communication logic using Axios or Fetch.

- **hooks/**  
  Custom React hooks for logic reuse.

- **context/**  
  Global state management (auth, user, tenant).

- **utils/**  
  Helper utilities and validation functions.

- **styles/**  
  Styling and CSS files.

---

## 2. Development Setup Guide

### Prerequisites

- Node.js v18+
- npm or yarn
- Docker & Docker Compose
- Git
- PostgreSQL (optional for non-Docker)

---

### Environment Variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000


---

### Installation Steps

1. Clone the repository:


git clone <repository-url>
cd multi-tenant-saas-project


2. Install backend dependencies:


cd backend
npm install


3. Install frontend dependencies:


cd ../frontend
npm install


---

### How to Run Locally

Using Docker (recommended):



docker-compose up -d


- Frontend: http://localhost:3000  
- Backend: http://localhost:5000  

---

### How to Run Tests

Backend tests:


cd backend
npm test


Frontend tests:


cd frontend
npm test
