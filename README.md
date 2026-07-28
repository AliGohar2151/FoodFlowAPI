# FoodFlow API

Multi-vendor food delivery backend — modular monolith.

## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| Runtime       | Node.js v20+                           |
| Language      | TypeScript (strict)                    |
| Framework     | Express.js                             |
| Database      | PostgreSQL + Prisma                    |
| Cache / Queue | Redis + BullMQ                         |
| Validation    | Zod                                    |
| Auth          | JWT (access + refresh tokens)          |
| Authorization | RBAC + Permissions + Resource Policies |

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL
- Redis

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Start development server
pnpm dev
```

## Scripts

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Start development server with hot reload |
| `pnpm build`         | Compile TypeScript to dist/              |
| `pnpm start`         | Run compiled production server           |
| `pnpm typecheck`     | Type-check without emitting              |
| `pnpm lint`          | Run ESLint                               |
| `pnpm lint:fix`      | Fix ESLint errors                        |
| `pnpm format`        | Format with Prettier                     |
| `pnpm format:check`  | Check formatting                         |
| `pnpm test`          | Run tests                                |
| `pnpm test:coverage` | Run tests with coverage                  |

## API

Base URL: `http://localhost:3000/api/v1`

Health checks:

- `GET /health`
- `GET /health/live`
- `GET /health/ready`

## Architecture

Modular monolith — see `docs/Architecture.md` for full details.

```
Request → Middleware → Controller → Service → Repository → PostgreSQL
```

## Documentation

See `docs/` for:

- `PRD.md` — Product requirements
- `Architecture.md` — Technical architecture
- `Design.md` — Database and API design
- `Rules.md` — Engineering rules
- `Phases.md` — Implementation phases
- `Memory.md` — Current project state
