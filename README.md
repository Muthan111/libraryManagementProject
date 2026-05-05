# Library Management API

A NestJS backend for managing library users, books, authentication, and borrow/return flows.

## Overview

This project provides:

- User management with generated customer codes such as `cus001`
- Book management with generated book codes such as `BK001`
- JWT-based authentication with role information in the token
- Basic role-based access control test endpoint for admins
- Borrow and return tracking with due dates and active borrow lookup
- Swagger documentation at `http://localhost:3000/api`
- MySQL persistence via TypeORM

## Tech Stack

- NestJS
- TypeScript
- TypeORM
- MySQL
- Passport
- JWT
- Swagger
- Jest
- Playwright

## Project Structure

```text
src/
  auth/      Authentication, JWT, local strategy, guards
  book/      Book entity, DTOs, controller, service
  borrow/    Borrow record entity, DTOs, controller, service
  common/    Global exception filter and request logger middleware
  user/      User entity, DTOs, roles, controller, service
```

## Environment Variables

Create a `.env` file in the project root with:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=library_db
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

## Installation

```bash
npm install
```

## Running the App

```bash
# development
npm run start:dev

# standard start
npm run start

# production
npm run build
npm run start:prod
```

The server listens on port `3000`.

## API Documentation

Swagger UI is available after startup at:

```text
http://localhost:3000/api
```

JWT-protected endpoints use the Swagger bearer auth scheme named `access-token`.

## Authentication

### Login

`POST /auth/login`

Request body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "jwt-token"
}
```

### Auth Test

`GET /auth`

Requires a bearer token.

### Role Test

`GET /auth/TestRBAC`

Requires a bearer token and `admin` role.

## Main Endpoints

### Users

- `GET /user` - list all users
- `POST /user` - create a user
- `GET /user/customer-code/:customerCode` - get a user by customer code
- `PATCH /user/:id` - update a user by numeric id
- `DELETE /user` - delete all users
- `DELETE /user/customer-code/:customerCode` - delete a user by customer code

Example create user payload:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "member"
}
```

### Books

- `GET /book` - list all books
- `POST /book` - create a book
- `PATCH /book/:id` - update a book by numeric id
- `DELETE /book/:id` - delete a book
- `GET /book/search/name/:name` - find a book by name
- `GET /book/search/isbn/:isbn` - find a book by ISBN
- `GET /book/search/author/:author` - find a book by author

Example create book payload:

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
- `GET /borrow/user/:id` - list borrows for a user by customer code
- `GET /borrow/active` - list all active borrows

Example borrow payload:

```json
{
  "customerCode": "cus001",
  "bookCode": "BK001",
  "dueDate": "2026-05-20T00:00:00.000Z"
}
```

## Business Rules

- User emails must be unique
- Book ISBN values must be unique
- User passwords are hashed with `bcrypt`
- Customer codes are generated after user creation
- Book codes are generated after book creation
- A book cannot be borrowed if it already has an active borrow record
- Returning a borrow record marks it as `RETURNED` and stores `returnDate`
- JWTs expire after `60s` based on the current auth module configuration

## Scripts

```bash
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
```

Playwright is also configured in `playwright.config.ts`, so browser tests can be run with:

```bash
npx playwright test
```

## Docker

The repository includes a `Dockerfile`.

```bash
docker build -t library-management-api .
docker run -p 3000:3000 --env-file .env library-management-api
```

## CI

GitHub Actions is configured in `.github/workflows/ci.yml` to:

- install dependencies
- run `npm run test:ci`
- run `npm run build`

## Current Notes

- Swagger is enabled, but request validation is only partially enforced because a global validation pipe is not configured in `main.ts`
- The borrow DTO currently decorates `customerCode` and `bookCode` as numbers even though the service expects string codes like `cus001` and `BK001`
- TypeORM is running with `synchronize: true`, which is convenient for development but should be reviewed before production use

## License

This project is marked `UNLICENSED` in `package.json`.
