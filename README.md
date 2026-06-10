# Library Management System (Full-Stack + Observability + CI/CD)

Full-stack library management project with a `NestJS` backend, a `React + Vite` frontend, MySQL persistence, JWT authentication, a Gemini-powered chat endpoint, and basic observability support.

## Purpose of this project

This is a learning project to sharpen backend development skills while learning the basics of testing, caching MySQL and migrations. During the course of this project, bugs were encountered. A detailed bug report is present in `BUG_COMMENTS.ms`. The domain is kept relatively simple to explore engineering concepts:

- unit, integration and e2e testing
- CI & CD
- MySQL and migrations
- frontend testing (Vitest)
- AI Integration using tools, RAG and Redis Clients
- Authentication using only JWT and Authorization using role guards
- Security mechanisms

## Key Highlights

- Full-stack system built with NestJS + React + MySQL
- Secure authentication using JWT + RBAC
- Complete borrow/return lifecycle with business rules enforcement
- Dockerized multi-service architecture (frontend, backend, MySQL, Redis, - observability stack)
- Production-style CI pipeline (lint, tests, audit, build)
- Observability stack using Prometheus, Grafana, Loki
- AI-powered chatbot using Google Gemini API
- End-to-end testing with Jest + Playwright
- Input validation, security headers, and API hardening (Helmet, CSP, HSTS)

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

## Engineering Decisions

- NestJS → modular architecture + scalable backend structure
- TypeORM → rapid development with migration support
- MySQL → relational consistency for borrow constraints
- Redis → supporting cache layer (future-ready design)
- Docker Compose → reproducible local development environment
- Prometheus/Grafana/Loki → full observability stack for learning production monitoring patterns
- Playwright + Jest → separation of unit, integration, and E2E testing

## Core Features

### Users

- User registration and lookup
- Auto-generated customer codes (cus001)
- Role-based access control

### Books

- CRUD operations for books
- Search by name, ISBN, or author
- Enforced unique ISBN constraint

### Borrowing System

- Borrow and return workflow
- Prevents double borrowing of active books
- Tracks borrowing history and due dates

### Authentication

- JWT-based login system
- Role-protected routes (admin/member)
- Password hashing with bcrypt

### AI Chatbot

- Natural language book search using Google Gemini
- Example: “Do you have books by Robert C. Martin?”

### Metrics

- Prometheus /metrics endpoint for system observability

## Security Mechanisms

- CORS restricted to frontend origin
- helmet is configured. This includes
  - contentSecurityPolicy (CSP) which controls what is allowed to load
  - hsts forces browser domain to switch to HTTPS
- X-Powered-By is disabled
- Global Validation is enabled:
- npm audit and lint is integrated into CI to prevent audit risks

## Testing Strategy

- Unit tests (Jest(backend) and vitest (Frontend))
- Integration tests (API + DB layer)
- End-to-end tests (Supertest)
- CI pipeline runs:
  - Linting
  - Dependency audit
  - Automated test suites
  - Build verification

## License

This project is currently marked `UNLICENSED`.
