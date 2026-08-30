# Task Master

A TypeScript/Node.js backend for collaborative task tracking. The project provides user authentication, project membership management, task lifecycle workflows, comments, attachments, AI-generated task descriptions, and real-time notifications over WebSockets.

## 1. Project Overview

### Project name

Task Master

### Purpose and problem it solves

Task Master is a backend API for team task management. It helps users:

- register and authenticate securely
- create personal or project-based tasks
- organize work within projects
- assign tasks to users
- manage comments and file attachments on tasks
- accept or reject project invitations
- receive real-time notifications for task-related updates

This project focuses on the API layer for a collaborative task-tracking workflow, with Prisma for database access, PostgreSQL for persistence, JWT-based auth, and Redis for task-list caching.

### Key implemented features

The current codebase implements the following features:

- User registration, login, token refresh, and logout
- JWT-based access tokens and refresh tokens
- Protected routes and project authorization checks
- Project creation, update, deletion, and member management
- Project invitations and invitation acceptance/rejection
- Personal tasks and project tasks
- Task filtering, sorting, and pagination
- Assigning and updating task status
- Task comments
- Task attachments with Cloudinary upload integration
- AI-generated task descriptions using Groq
- Swagger/OpenAPI documentation at `/api-docs`
- WebSocket-based real-time notifications per user
- Redis-backed task list caching

### Current project status

The repository is a functional backend API with unit and integration tests, local PostgreSQL/Redis/Cloudinary integration, and a Prisma-backed data model. It is configured for local development and testing rather than a production deployment document.

> This README documents only what exists in the current repository. Planned or future features are not described as implemented features.

---

## 2. Tech Stack

| Technology           | Purpose in this project                                                |
| -------------------- | ---------------------------------------------------------------------- |
| Node.js              | JavaScript runtime for the backend service                             |
| TypeScript           | Static typing and compile-time validation                              |
| Express.js           | REST API server and route handling                                     |
| PostgreSQL           | Primary relational database                                            |
| Prisma ORM           | Database schema definition, migrations, client generation, and queries |
| Prisma PG adapter    | PostgreSQL driver adapter used by Prisma                               |
| pg                   | PostgreSQL client used by the Prisma adapter and database pool         |
| JWT (`jsonwebtoken`) | Access token and refresh token generation/verification                 |
| Argon2               | Password hashing                                                       |
| Redis                | Task-list cache invalidation and retrieval                             |
| Cloudinary           | File hosting and attachment upload storage                             |
| Multer               | Multipart file upload handling for task attachments                    |
| Zod                  | Request validation and schema parsing                                  |
| Helmet               | Security headers                                                       |
| CORS                 | Cross-origin request handling                                          |
| Swagger UI / JSDoc   | API documentation at `/api-docs`                                       |
| WebSockets (`ws`)    | Real-time user notifications                                           |
| Groq SDK             | AI task description generation                                         |
| Jest + ts-jest       | Unit and integration testing                                           |
| Supertest            | HTTP testing for Express routes                                        |
| ESLint + Prettier    | Linting and formatting                                                 |
| Husky                | Git hooks for validation                                               |

---

## 3. Prerequisites

### Required tools and services

- Node.js: a modern LTS version is recommended. The repo does not pin an exact `engines` version in `package.json`, but the stack uses TypeScript 5.9, Jest 30, and Express 5, so Node 20+ is a safe baseline.
- npm: recent npm version compatible with the project dependencies
- PostgreSQL: a running local PostgreSQL server or a reachable PostgreSQL instance
- Redis: a running Redis instance for task cache support
- Cloudinary account: required for attachments to upload files
- Groq API key: required for the AI description route at `/tasks/ai/generate-description`

### Database requirements

The app uses PostgreSQL via Prisma. The schema is configured in `prisma/schema.prisma` with:

```prisma
datasource db {
  provider = "postgresql"
}
```

A valid `DATABASE_URL` is required. The app expects a PostgreSQL database and connects through Prisma with `@prisma/adapter-pg` and `pg`.

### Cloudinary requirements

Cloudinary credentials are required for file uploads. The app expects these environment variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

These values are obtained from your Cloudinary dashboard after creating an account and a Cloudinary product setup.

### Redis requirements

Redis is used by `src/services/redis.ts` and `src/config/redis.ts`. The app calls `redisClient.connect()` on startup. If `REDIS_URL` is missing or Redis is unavailable, the application will fail during startup.

---

## 4. Project Structure

```text
.
├── .env
├── .env.example
├── .env.test
├── .gitignore
├── eslint.config.js
├── jest.config.js
├── jest.integration.config.js
├── package.json
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── postman/
│   └── task_master.postman_collection
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── cloudinary.ts
│   │   ├── jwt.ts
│   │   ├── prisma.ts
│   │   ├── redis.ts
│   │   └── swagger.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── projectAuthorization.middleware.ts
│   │   └── validate.middleware.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── tasks/
│   │   └── users/
│   ├── routes/
│   │   └── index.ts
│   ├── schemas/
│   │   └── common.schema.ts
│   ├── services/
│   │   ├── ai.ts
│   │   └── redis.ts
│   ├── utils/
│   │   ├── appError.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── token.ts
│   └── webSocket/
│       ├── webSocket.handler.ts
│       ├── webSocket.manager.ts
│       └── webSocket.types.ts
├── tests/
│   ├── helpers/
│   │   └── testDatabase.ts
│   ├── integration/
│   ├── setup.ts
│   └── unit/
├── tsconfig.json
├── dist/                       # generated by TypeScript build
├── coverage/                   # generated by Jest coverage
└── README.md
```

### Directory responsibilities

- `src/app.ts`: Express application bootstrap and middleware registration
- `src/server.ts`: server startup, Prisma connection, Redis connection, WebSocket initialization
- `src/config/`: environment and infrastructure configuration for Prisma, Redis, JWT, Cloudinary, Swagger
- `src/middleware/`: auth, validation, project-role checks, and central error handling
- `src/modules/`: feature modules organized by auth, users, projects, and tasks
- `src/services/`: shared service logic such as AI and Redis cache helpers
- `src/utils/`: JWT helpers, password hashing, token hashing, app error class
- `src/webSocket/`: WebSocket authentication and notification management
- `src/generated/prisma/`: generated Prisma client files
- `prisma/`: database schema and migrations
- `tests/`: Jest integration and unit tests
- `postman/`: exported collection for API testing
- `coverage/`: generated by test coverage runs
- `dist/`: generated output from `tsc`

---

## 5. Installation & Setup

Follow these steps from a fresh clone.

### 1) Clone the repository

```bash
git clone <repository-url>
cd task-master
```

### 2) Install dependencies

```bash
npm install
```

### 3) Create environment files

Create a local `.env` from the example file:

```bash
cp .env.example .env
```

The repository also includes `.env.test` for integration tests. Do not commit production secrets.

### 4) Configure required environment variables

Populate `.env` with values for the variables the app actually reads at runtime:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `REDIS_URL`
- `GROQ_API_KEY`

`JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` are present in the example file, but the current app hardcodes `15m` and `7d` in `src/config/jwt.ts` and does not read those env vars at runtime.

See the full environment variable docs in the next section.

### 5) Obtain external credentials

- Cloudinary: create a Cloudinary account and copy the Cloud Name, API Key, and API Secret from the dashboard.
- Groq: create or use an existing Groq API key to enable AI-generated descriptions.
- PostgreSQL: use your local PostgreSQL instance or a managed PostgreSQL service.
- Redis: run a local Redis server or use a service URL.

### 6) Configure PostgreSQL and Redis

Make sure PostgreSQL and Redis are running before starting the app. Example local values:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/task_master_dev
REDIS_URL=redis://localhost:6379
```

### 7) Run Prisma setup

Generate the Prisma client if it has not already been generated:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

If you are working in an environment that already has the schema applied, you may use:

```bash
npx prisma migrate deploy
```

### 8) Start the app

```bash
npm run dev
```

The server starts on the configured `PORT` value, and uses the default `6000` if `PORT` is not set.

---

## 6. Environment Variables

The project expects the following environment variables.

### `.env.example`

```env
NODE_ENV=
PORT=

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

REDIS_URL=

GROQ_API_KEY=
```

### Variable definitions

| Variable                 | Required           | Purpose                                                                                       |
| ------------------------ | ------------------ | --------------------------------------------------------------------------------------------- |
| `NODE_ENV`               | Yes                | Runtime environment; used by Prisma config and app logic                                      |
| `PORT`                   | Yes for local runs | HTTP port for the Express server                                                              |
| `DATABASE_URL`           | Yes                | PostgreSQL connection string for Prisma                                                       |
| `JWT_ACCESS_SECRET`      | Yes                | Secret used to sign access tokens                                                             |
| `JWT_REFRESH_SECRET`     | Yes                | Secret used to sign refresh tokens                                                            |
| `JWT_ACCESS_EXPIRES_IN`  | Yes                | Access token expiration setting (app config currently hardcodes `15m` in `src/config/jwt.ts`) |
| `JWT_REFRESH_EXPIRES_IN` | Yes                | Refresh token expiration setting (app config currently hardcodes `7d` in `src/config/jwt.ts`) |
| `CLOUDINARY_CLOUD_NAME`  | Yes                | Cloudinary account cloud name                                                                 |
| `CLOUDINARY_API_KEY`     | Yes                | Cloudinary API key                                                                            |
| `CLOUDINARY_API_SECRET`  | Yes                | Cloudinary API secret                                                                         |
| `REDIS_URL`              | Yes                | Connection string for Redis cache                                                             |
| `GROQ_API_KEY`           | Yes for AI route   | API key used by the Groq SDK                                                                  |

### Important warning

Never commit `.env`, `.env.local`, or any real secrets to the repository. The project currently includes a local `.env` in the working tree; keep it out of version control.

---

## 7. Database Setup

### PostgreSQL configuration

The application expects PostgreSQL to be running and available at the connection string supplied in `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/task_master_dev
```

The Prisma schema is located at `prisma/schema.prisma` and the datasource is configured as PostgreSQL.

### Prisma setup

The Prisma config is defined at `prisma.config.ts`:

```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

### Migration commands

Run migrations in a fresh environment:

```bash
npx prisma migrate dev
```

For a deployment-style sync:

```bash
npx prisma migrate deploy
```

### Prisma client generation

Generate the Prisma client:

```bash
npx prisma generate
```

The generated files are written to `src/generated/prisma/`.

### Seed data

There is no seed script implemented in this repository. No seed data command is defined in `package.json`.

---

## 8. Running the Application

The scripts in `package.json` are:

```json
{
  "test": "jest --runInBand",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage --runInBand",
  "test:integration": "jest --config jest.integration.config.js",
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "lint": "eslint src",
  "lint:fix": "eslint src --fix",
  "format": "prettier --write \"src/**/*.ts\"",
  "prepare": "husky"
}
```

### Start in development mode

```bash
npm run dev
```

This uses `ts-node-dev` and watches the TypeScript source.

### Build the app

```bash
npm run build
```

The TypeScript build writes output to `dist/` because `tsconfig.json` sets:

```json
"outDir": "./dist"
```

### Start in production mode

```bash
npm run build
npm start
```

### Expected local URL and port

The app creates an HTTP server in `src/server.ts` and reads the port with:

```ts
const PORT = Number.parseInt(process.env.PORT ?? "6000", 10);
```

So the expected local base URL is:

```text
http://localhost:PORT
```

If `PORT` is not set in `.env`, the server defaults to port `6000`.

The app also exposes Swagger documentation at:

```text
http://localhost:PORT/api-docs
```

Health check:

```text
http://localhost:PORT/health
```

---

## 9. Testing

### Test types

The project includes both unit tests and integration tests.

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`

### Test directory structure

```text
tests/
├── helpers/
│   └── testDatabase.ts
├── integration/
│   ├── attachment.integration.test.ts
│   ├── auth.integration.test.ts
│   ├── comment.integration.test.ts
│   ├── env.test.ts
│   ├── health.test.ts
│   ├── invitation.integration.test.ts
│   ├── projects.integration.test.ts
│   ├── tasks.integration.test.ts
│   └── user.integration.test.ts
├── setup.ts
└── unit/
    ├── auth/
    ├── middleware/
    ├── projects/
    ├── tasks/
    └── users/
```

### Test environment and setup

The Jest config is split into two configs:

- `jest.config.js` for unit tests
- `jest.integration.config.js` for integration tests

`tests/setup.ts` loads `.env.test`:

```ts
import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
});
```

The repo includes `.env.test`:

```env
NODE_ENV=test

DATABASE_URL=postgresql://postgres:Postgres123%23@localhost:5432/task_master_test
```

### Database/test database setup

The helper in `tests/helpers/testDatabase.ts` clears test data before/after tests:

```ts
export const cleanDatabase = async (): Promise<void> => {
  await prisma.projectInvitation.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};
```

The integration tests use a test database and disconnect it at the end of the suite.

### Mocking strategy

The tests are not primarily mock-heavy in the integration layer; they exercise the real request flow with Express + Prisma + PostgreSQL in a test database. Unit tests target controller/service behavior with mocked dependencies where appropriate, but the repository does not rely on a single universal mock pattern across all modules.

### Test setup and teardown

- `beforeEach` and `afterAll` hooks are used to clean database state in integration tests.
- `cleanDatabase` removes project invitations, project members, tasks, refresh tokens, projects, and users.
- `disconnectDatabase` disconnects Prisma and closes the PostgreSQL pool.

### Run all tests

```bash
npm test
```

### Run integration tests

```bash
npm run test:integration
```

### Run watch mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

The project is configured for coverage output in the root `coverage/` folder, as defined in `jest.config.js`.

### Common test-related issues

- PostgreSQL must be running
- `.env.test` must point to a valid test database URL
- Redis is started in server setup, so local Redis must also be available for app startup when integration tests run the app
- Missing JWT secret, Cloudinary, or Redis env values can cause application startup or route initialization to fail in some paths

---

## 10. API Documentation

The repository generates API docs from Swagger JSDoc comments in route files.

### Swagger URL

```text
http://localhost:PORT/api-docs
```

The Swagger server base is defined in `src/config/swagger.ts` as:

```ts
servers: [{ url: "http://localhost:3000/api/v1", description: "Local development server" }];
```

### API version

All routes are mounted under `/api/v1` in `src/app.ts` via:

```ts
app.use("/api/v1", routes);
```

### Auth endpoints

| Method | URL                     | Auth | Description                                     |
| ------ | ----------------------- | ---- | ----------------------------------------------- |
| POST   | `/api/v1/auth/register` | No   | Register a new user                             |
| POST   | `/api/v1/auth/login`    | No   | Login and receive JWTs                          |
| POST   | `/api/v1/auth/refresh`  | No   | Exchange a refresh token for a new access token |
| POST   | `/api/v1/auth/logout`   | No   | Revoke a refresh token                          |

Example registration body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Example login response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### User endpoints

| Method | URL                     | Auth | Description                |
| ------ | ----------------------- | ---- | -------------------------- |
| GET    | `/api/v1/users/profile` | Yes  | Get current user           |
| PATCH  | `/api/v1/users/profile` | Yes  | Update current user's name |

### Project endpoints

| Method | URL                                                 | Auth | Description                       |
| ------ | --------------------------------------------------- | ---- | --------------------------------- |
| POST   | `/api/v1/projects`                                  | Yes  | Create a project                  |
| GET    | `/api/v1/projects`                                  | Yes  | Get projects for the current user |
| GET    | `/api/v1/projects/:id`                              | Yes  | Get project by ID                 |
| PATCH  | `/api/v1/projects/:id`                              | Yes  | Update project                    |
| DELETE | `/api/v1/projects/:id`                              | Yes  | Delete project                    |
| GET    | `/api/v1/projects/:id/members`                      | Yes  | Get project members               |
| DELETE | `/api/v1/projects/:id/members/:userId`              | Yes  | Remove project member             |
| POST   | `/api/v1/projects/:id/invitations`                  | Yes  | Create invitation                 |
| PATCH  | `/api/v1/projects/invitations/:invitationId/accept` | Yes  | Accept invitation                 |
| PATCH  | `/api/v1/projects/invitations/:invitationId/reject` | Yes  | Reject invitation                 |

### Task endpoints

| Method | URL                                     | Auth | Description                         |
| ------ | --------------------------------------- | ---- | ----------------------------------- |
| POST   | `/api/v1/tasks`                         | Yes  | Create a task                       |
| GET    | `/api/v1/tasks`                         | Yes  | Get filtered/sorted/paginated tasks |
| GET    | `/api/v1/tasks/:id`                     | Yes  | Get a task by ID                    |
| PATCH  | `/api/v1/tasks/:id`                     | Yes  | Update task                         |
| DELETE | `/api/v1/tasks/:id`                     | Yes  | Delete task                         |
| PATCH  | `/api/v1/tasks/:id/assign`              | Yes  | Assign task                         |
| PATCH  | `/api/v1/tasks/:id/status`              | Yes  | Update status                       |
| POST   | `/api/v1/tasks/ai/generate-description` | Yes  | AI-generated task description       |

### Comment endpoints

| Method | URL                                         | Auth | Description    |
| ------ | ------------------------------------------- | ---- | -------------- |
| POST   | `/api/v1/tasks/:taskId/comments`            | Yes  | Create comment |
| GET    | `/api/v1/tasks/:taskId/comments`            | Yes  | List comments  |
| GET    | `/api/v1/tasks/:taskId/comments/:commentId` | Yes  | Get comment    |
| PATCH  | `/api/v1/tasks/:taskId/comments/:commentId` | Yes  | Update comment |
| DELETE | `/api/v1/tasks/:taskId/comments/:commentId` | Yes  | Delete comment |

### Attachment endpoints

| Method | URL                                               | Auth | Description             |
| ------ | ------------------------------------------------- | ---- | ----------------------- |
| POST   | `/api/v1/tasks/:taskId/attachments`               | Yes  | Upload attachment       |
| GET    | `/api/v1/tasks/:taskId/attachments`               | Yes  | Get attachments         |
| GET    | `/api/v1/tasks/:taskId/attachments/:attachmentId` | Yes  | Get specific attachment |
| DELETE | `/api/v1/tasks/:taskId/attachments/:attachmentId` | Yes  | Delete attachment       |

### Multipart/form-data upload

Attachment upload uses `multer` with `upload.single("file")` in `src/modules/tasks/task.routes.ts`.

Example curl:

```bash
curl -X POST http://localhost:3000/api/v1/tasks/<task-id>/attachments \
  -H "Authorization: Bearer <access-token>" \
  -F "file=@example.pdf"
```

### Standard response format

The controllers consistently use this success/error shape:

```json
{
  "success": true,
  "data": {}
}
```

and error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message"
  }
}
```

Validation errors include a `details` array from Zod:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "path": ["email"],
        "message": "Invalid email"
      }
    ]
  }
}
```

### Typical HTTP errors

- `400`: validation or invalid request data
- `401`: missing or invalid JWT
- `403`: authorization failure or project access denial
- `404`: not found
- `409`: conflict (duplicate email, duplicate invitation, etc.)
- `500`: unhandled server error

---

## 11. Authentication & Authorization

### Registration/login flow

The auth flow is implemented in:

- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.routes.ts`

Flow:

1. User submits `name`, `email`, and `password` to `/auth/register`
2. App checks if the email already exists
3. Password is hashed with Argon2
4. User record is created in PostgreSQL
5. User logs in via `/auth/login`
6. App verifies the password and returns access and refresh tokens

### JWT implementation

JWT helpers are in `src/utils/jwt.ts` and config in `src/config/jwt.ts`.

- access token secret: `JWT_ACCESS_SECRET`
- refresh token secret: `JWT_REFRESH_SECRET`
- access token lifetime: `15m` (hardcoded in config)
- refresh token lifetime: `7d` (hardcoded in config)

The token payload includes `userId` for access tokens and `userId` plus `jti` for refresh tokens.

### Authentication middleware

`src/middleware/auth.middleware.ts` checks the `Authorization` header and expects:

```http
Authorization: Bearer <access-token>
```

If missing or invalid, the middleware returns `401`.

### Project roles / RBAC

The project membership model uses `ProjectMemberRole`:

- `OWNER`
- `MEMBER`

The authorization middleware `src/middleware/projectAuthorization.middleware.ts` checks whether the current user is a project member and whether their role is allowed. For example:

- project owners are allowed to invite users
- project owners can remove members
- regular project members can view the project and tasks related to it

### Protected routes

Routes that require auth are wrapped with `authenticate` in the route definitions.

Examples:

- users profile endpoints
- all project routes
- all task routes
- comments and attachments routes

---

## 12. Attachments / Cloudinary

### Attachment upload flow

The attachment flow is implemented in:

- `src/modules/tasks/attachments/attachment.upload.ts`
- `src/modules/tasks/attachments/attachment.service.ts`
- `src/modules/tasks/attachments/cloudinary/cloudinary.service.ts`

Flow:

1. The client sends a multipart upload to `/api/v1/tasks/:taskId/attachments`
2. `multer.memoryStorage()` buffers the file in memory
3. The file is uploaded to Cloudinary through `cloudinary.uploader.upload_stream()`
4. The file metadata is saved to the Prisma `Attachment` table
5. The app stores:
   - `fileName`
   - `fileUrl`
   - `storageKey`
   - `mimeType`
   - `fileSize`
   - `taskId`
   - `uploadedById`

### Multer configuration

`src/modules/tasks/attachments/attachment.upload.ts` configures:

```ts
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
```

This means the app accepts a single uploaded file with a `10 MB` size limit.

### Cloudinary configuration

`src/config/cloudinary.ts` configures Cloudinary from environment variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The upload folder is:

```text
task-master/attachments
```

### File restrictions and behavior

The app does not currently enforce a strict MIME allowlist in code beyond the Cloudinary upload itself; file size is limited to 10 MB by Multer. The Cloudinary upload is configured with `resource_type: "auto"`.

### Authorization for attachments

Users can upload or view attachments if they satisfy one of these checks:

- they are the task creator
- they are the task assignee
- they are a member of the task's project

Deletion is restricted to the original uploader (`uploadedById === userId`).

---

## 13. Validation & Error Handling

### Zod validation

The project validates request bodies and route params using Zod. Common validation schemas are in:

- `src/schemas/common.schema.ts`
- `src/modules/auth/auth.schema.ts`
- `src/modules/users/user.schema.ts`
- `src/modules/projects/project.schema.ts`
- `src/modules/tasks/task.schema.ts`

Examples:

- `name` required and length-limited
- `email` must be a valid email
- `password` length restrictions
- UUID validation for IDs
- date validation for task `dueDate`

### Request validation

The middleware `src/middleware/validate.middleware.ts` does this:

```ts
schema.parse(req.params);
```

This catches invalid route parameter UUIDs and returns a `400` validation error through the central error handler.

### Centralized error handling

The global error middleware is implemented in `src/middleware/error.middleware.ts`.

It classifies errors by type:

- `ZodError` -> `400` with `details`
- `AppError` -> status code from the app error
- unknown error -> `500`

### Standard error response format

```json
{
  "success": false,
  "error": {
    "message": "Validation failed"
  }
}
```

---

## 14. Database Schema

The main Prisma schema is in `prisma/schema.prisma`.

### Important models

- `User`
- `RefreshToken`
- `Project`
- `ProjectMember`
- `Task`
- `ProjectInvitation`
- `Comment`
- `Attachment`

### Relationships

- A `User` can own many `Project` records.
- A `User` can belong to many `Project` records via `ProjectMember`.
- A task belongs to one optional `Project` and has one creator and one optional assignee.
- A `ProjectInvitation` links a project, invited user, and inviting user.
- A `Comment` belongs to one task and one author.
- An `Attachment` belongs to one task and one uploading user.

### Mermaid schema diagram

```mermaid
erDiagram
  USER ||--o{ REFRESH_TOKEN : has
  USER ||--o{ PROJECT : owns
  USER ||--o{ PROJECT_MEMBER : joins
  USER ||--o{ TASK : creates
  USER ||--o{ TASK : assigned_to
  USER ||--o{ PROJECT_INVITATION : invited_user
  USER ||--o{ PROJECT_INVITATION : invited_by
  USER ||--o{ COMMENT : writes
  USER ||--o{ ATTACHMENT : uploads

  PROJECT ||--o{ PROJECT_MEMBER : members
  PROJECT ||--o{ TASK : contains
  PROJECT ||--o{ PROJECT_INVITATION : invitations

  TASK ||--o{ COMMENT : has
  TASK ||--o{ ATTACHMENT : has

  USER {
    string id
    string name
    string email
    string passwordHash
    boolean isActive
    datetime createdAt
    datetime updatedAt
  }

  PROJECT {
    string id
    string name
    string description
    string ownerId
    datetime createdAt
    datetime updatedAt
  }

  PROJECT_MEMBER {
    string id
    string projectId
    string userId
    enum role
    datetime createdAt
  }

  TASK {
    string id
    string title
    string description
    datetime dueDate
    enum status
    string projectId
    string creatorId
    string assigneeId
    datetime createdAt
    datetime updatedAt
  }

  PROJECT_INVITATION {
    string id
    string projectId
    string invitedUserId
    string invitedById
    enum status
    datetime createdAt
    datetime updatedAt
  }

  COMMENT {
    string id
    string content
    string taskId
    string authorId
    datetime createdAt
    datetime updatedAt
  }

  ATTACHMENT {
    string id
    string fileName
    string fileUrl
    string storageKey
    string mimeType
    int fileSize
    string taskId
    string uploadedById
    datetime createdAt
  }
```

---

## 15. Postman API Collection

The repository currently includes a Postman collection at:

```text
postman/task_master.postman_collection
```

There is no `docs/postman` directory in the current checkout, and there is no `docs/postman/task_master.postman_collection.json` file in this repository. Import the collection file that actually exists in `postman/`.

### How to import it

1. Open Postman
2. Click Import
3. Select the collection file from `postman/task_master.postman_collection`
4. The collection includes example requests for auth, users, projects, tasks, comments, attachments, and AI-generated descriptions

### Required Postman variables

The collection uses variables such as:

- `API_HOST`
- `API_VERSION`
- `access_token`
- `refresh_token`

These are defined in the collection file and are used to set bearer tokens and host values.

Do not paste real tokens, secrets, or credentials into the collection. Use a local environment with test or development data only.

---

## 16. Linting / Code Quality

The project defines linting and formatting scripts in `package.json`:

```bash
npm run lint
npm run lint:fix
npm run format
```

The ESLint configuration is in `eslint.config.js` and includes TypeScript support, Prettier integration, and Jest globals.

The repo also includes a Husky prepare hook:

```json
"prepare": "husky"
```

and a `lint-staged` configuration:

```json
"lint-staged": {
  "*.{ts,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

---

## 17. Build & Production

### TypeScript build process

The TypeScript compiler configuration is defined in `tsconfig.json` and includes:

```json
"target": "ES2022",
"module": "CommonJS",
"rootDir": ".",
"outDir": "./dist",
"strict": true
```

Run the build:

```bash
npm run build
```

This produces the `dist/` output folder.

### Production startup

The server entrypoint is `src/server.ts` and the production start command is:

```bash
npm start
```

This runs:

```bash
node dist/server.js
```

### Production environment requirements

Use the same environment variables as local development, including:

- valid `DATABASE_URL`
- valid `JWT_ACCESS_SECRET`
- valid `JWT_REFRESH_SECRET`
- valid Cloudinary credentials
- valid Redis URL
- valid Groq API key if the AI route is used

The project does not currently define a separate production-only deployment setup or Docker configuration.

---

## 18. Security

The project includes several security measures and conventions:

- `helmet` middleware is enabled in `src/app.ts`
- `cors` middleware is enabled in `src/app.ts`
- authentication is enforced via JWT verification in `src/middleware/auth.middleware.ts`
- project-level authorization is enforced with `requireProjectRole`
- passwords are hashed with Argon2
- refresh tokens are stored as hashes in the database and compared during refresh/logout flows
- input validation is enforced with Zod
- file uploads are size-limited to 10 MB using Multer
- Cloudinary secrets and JWT secrets must never be committed to the repository

### Secret protection guidance

- keep `.env` local and untracked
- never expose API keys or secrets in code or documentation examples
- rotate credentials if they are ever committed accidentally

---

## 19. Troubleshooting

### Database connection issues

- Make sure PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Check that the database exists
- Run:

```bash
npx prisma migrate dev
```

if Prisma reports missing tables or schema drift.

### Prisma issues

- Regenerate the client if model changes are made:

```bash
npx prisma generate
```

- Check migration status:

```bash
npx prisma migrate status
```

### Missing environment variables

The app throws explicit errors for missing configuration values. Common ones:

- `DATABASE_URL` missing
- `REDIS_URL` missing
- `JWT_ACCESS_SECRET` missing
- `JWT_REFRESH_SECRET` missing
- Cloudinary variables missing

### Jest / test issues

- Ensure `postgres` and test DB are available
- Check `.env.test` points to the correct test database
- Run tests serially; the project sets `maxWorkers: 1` in both Jest configs
- If Prisma client generation fails, run `npx prisma generate`

### Cloudinary issues

- Confirm the Cloudinary account is active
- Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set
- Confirm the upload folder and API credentials are valid

### Port conflicts

If the app cannot bind to the expected port:

- change `PORT` in `.env`
- ensure no other process is using the port
- check for a previous Node.js server still running

### Build / TypeScript issues

```bash
npm run build
```

This will surface TypeScript or compile errors. The repository is configured with `strict: true`.

### Redis issues

- verify Redis is running locally
- confirm `REDIS_URL` is correctly set
- if Redis is unavailable, the app may fail on startup because of `await redisClient.connect()` in `src/server.ts`

---

## 20. Quick Start

Use this sequence for a fast local setup:

```bash
# 1. Clone
git clone https://github.com/maitrii-joshii/task-master.git
cd task-master

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Fill in the required environment variables in .env
#    with your PostgreSQL, Redis, Cloudinary, JWT, and Groq settings

# 5. Ensure PostgreSQL and Redis are running

# 6. Apply Prisma migrations
npx prisma generate
npx prisma migrate dev

# 7. Start the app
npm run dev

# 8. Open API docs
# http://localhost:3000/api-docs

# 9. Run tests
npm test
```

This is the current, repository-accurate workflow for setting up and running Task Master.
