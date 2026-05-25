# Library Management System

Full-stack library management project with a `NestJS` backend, a `React + Vite` frontend, MySQL persistence, JWT authentication, a Gemini-powered chat endpoint, and basic observability support.

## What This Repo Includes

- `backend/` - NestJS API for users, books, borrowing, authentication, chatbot, and metrics
- `frontend/` - React app that currently calls the backend root endpoint and renders the response
- `docker-compose.yml` - multi-service local stack for frontend, backend, MySQL, Prometheus, Grafana, and Loki
- `.github/workflows/ci.yml` - backend CI pipeline for lint, audit, test, and build
- `.github/workflows/cd.yml` - backend Docker image build and push workflow for `main`

## Current Features

- User registration and lookup with generated customer codes such as `cus001`
- Book creation, updates, deletion, and lookup by name, ISBN, or author
- Borrow and return flow with active borrow tracking
- JWT-based login and a sample admin-only RBAC route
- Swagger API docs in non-production environments
- Prometheus metrics endpoint at `/metrics`
- Chat endpoint backed by Google Gemini for book-related queries

## Tech Stack

- Backend: `NestJS`, `TypeScript`, `TypeORM`, `MySQL`, `Passport`, `JWT`, `Swagger`
- Frontend: `React 19`, `TypeScript`, `Vite`
- Observability: `Prometheus`, `Grafana`, `Loki`
- Testing: `Jest`, `Playwright`
- Containerization: `Docker`, `Docker Compose`

## Project Structure

```text
libraryManagementProject/
  backend/
    src/
      auth/
      book/
      borrow/
      chatbot/
      common/
      metrics/
      user/
  frontend/
    src/
      components/
  docker-compose.yml
  prometheus.yml
  loki-config.yaml
```

## Environment Variables

Create `backend/.env` for local backend and Docker Compose usage.

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=library_db
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GEMINI_API_KEY=your_gemini_api_key
```

Create `backend/.env.test` for the real integration suite:

```env
NODE_ENV=test
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USERNAME=root
DB_PASSWORD=test_password
DB_NAME=library_test_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
JWT_SECRET=integration_jwt_secret
SESSION_SECRET=integration_session_secret
GEMINI_API_KEY=test-key-not-used
```

Notes:

- `SESSION_SECRET` is required at startup.
- `JWT_SECRET` falls back to `secret` in code if omitted, but you should still set it explicitly.
- `GEMINI_API_KEY` is required if you want the `/chat` endpoint to work.
- When running with Docker Compose, `DB_HOST` should match the MySQL service hostname used by the containers.

## Local Development

From the repository root, install dependencies in each app:

```bash
cd backend
npm install

cd ../frontend
npm install

cd ..
```

From the repository root, run the backend:

```bash
cd backend
npm run start:dev
```

From the repository root, run the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api`
- Metrics: `http://localhost:3000/metrics`

## Docker Compose

Start the full stack from the repository root:

```bash
docker compose up --build
```

Exposed services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- Loki: `http://localhost:3100`

The compose file builds:

- `frontend` from [`frontend/Dockerfile`](/c:/Users/admin/Desktop/projects/Backend_Projects/libraryManagementProject/frontend/Dockerfile)
- `libraryapp` from [`backend/Dockerfile`](/c:/Users/admin/Desktop/projects/Backend_Projects/libraryManagementProject/backend/Dockerfile)

It also provisions a MySQL container with persistent storage via the `mysql_data` volume.

## Backend Scripts

From the repository root:

```bash
cd backend
npm run build
npm run start
npm run start:dev
npm run start:debug
npm run start:prod
npm run lint
npm run test
npm run test:watch
npm run test:cov
npm run test:ci
npm run test:e2e
npm run test:integration
npm run test:integration:watch
npm run test:all
```

The integration test command now checks the dedicated MySQL and Redis services and will try to start them with Docker Compose if they are not already running. You can still start them yourself first if you prefer:

```bash
docker compose -f docker-compose.test.yml up -d

cd backend
npm run test:integration
```

If Docker Desktop is not running or your user cannot access the Docker daemon, the preflight step will stop early with a clear error before Jest starts.

Playwright is also configured in the backend:

```bash
cd backend
npx playwright test
```

## Frontend Scripts

From the repository root:

```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

## API Overview

### Root

- `GET /` - returns the default backend greeting

### Authentication

- `POST /auth/login` - validate user credentials and return a JWT
- `GET /auth` - test JWT-protected access
- `GET /auth/TestRBAC` - admin-only RBAC test route

Example login body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Users

- `GET /user` - list all users
- `POST /user` - create a user
- `GET /user/customer-code/:customerCode` - get a user by customer code
- `PATCH /user/:cusCode` - update a user by customer code
- `DELETE /user` - delete all users
- `DELETE /user/customer-code/:customerCode` - delete a user by customer code

Example create user body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "member"
}
```

### Books

- `GET /book?page=1&limit=10` - list books with pagination
- `POST /book` - create a book
- `PATCH /book/:id` - update a book by numeric id
- `DELETE /book/:id` - delete a book by numeric id
- `GET /book/search/name/:name` - search by book name
- `GET /book/search/isbn/:isbn` - search by ISBN
- `GET /book/search/author/:author` - search by author

Example paginated books response:

```json
{
  "data": [
    {
      "bookid": 1,
      "bookCode": "BK001",
      "name": "Clean Code",
      "Author": "Robert C. Martin",
      "ISBN": "9780132350884",
      "status": "AVAILABLE",
      "borrowedById": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Example create book body:

```json
{
  "name": "Clean Code",
  "Author": "Robert C. Martin",
  "ISBN": "9780132350884",
  "status": "AVAILABLE"
}
```

### Borrowing

- `POST /borrow` - create a borrow record
- `POST /borrow/:id/return` - return a borrowed book by borrow record id
- `GET /borrow/user/:id` - get borrow history for a user code
- `GET /borrow/active` - list active borrow records

Example borrow body:

```json
{
  "customerCode": "cus001",
  "bookCode": "BK001",
  "dueDate": "2026-05-20T00:00:00.000Z"
}
```

### Chatbot

- `POST /chat` - send a natural-language message to the Gemini-backed library assistant

Example chat body:

```json
{
  "message": "Do you have any books by Robert C. Martin?"
}
```

### Metrics

- `GET /metrics` - Prometheus metrics output

## Authentication Notes

- JWT bearer auth is registered in Swagger under the scheme name `access-token`.
- JWT expiration is configured in the auth module, not in the controller.
- Session support is also enabled with `passport` and `express-session`.

## Business Rules

- User emails must be unique.
- Book ISBN values must be unique.
- Passwords are hashed with `bcrypt`.
- Customer codes are generated after user creation.
- Book codes are generated after book creation.
- A book cannot be borrowed when an active borrow already exists for it.
- Returning a borrow record marks it as returned and stores a return date.

## Observability

- The backend exposes Prometheus-compatible metrics at `/metrics`.
- `docker-compose.yml` includes `prometheus`, `grafana`, and `loki` services for local monitoring.

## CI

GitHub Actions is configured in [`ci.yml`](/c:/Users/admin/Desktop/projects/Backend_Projects/libraryManagementProject/.github/workflows/ci.yml) to run inside `backend/` and:

- install dependencies
- lint the code
- run `npm audit --audit-level=high`
- run `npm run test:ci`
- run `npm run build`

## CD

GitHub Actions is also configured in [`cd.yml`](/c:/Users/admin/Desktop/projects/Backend_Projects/libraryManagementProject/.github/workflows/cd.yml).

This workflow:

- runs on pushes to the `main` branch
- uses `backend/` as the working directory
- logs in to Docker Hub with `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets
- builds the backend Docker image as `${DOCKER_USERNAME}/library-app:latest`
- pushes that image to Docker Hub

## Current Implementation Notes

- Swagger is only enabled when `NODE_ENV` is not `production`.
- Global validation is enabled with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- TypeORM currently uses `synchronize: true`, which is convenient for development but should be reviewed before production use.
- CORS is currently enabled without a restricted origin list.
- The frontend is currently a minimal page that fetches the backend root route and renders the response.
- Some routes such as `DELETE /user` are powerful development endpoints and should be protected before production deployment.

## License

This project is currently marked `UNLICENSED`.
