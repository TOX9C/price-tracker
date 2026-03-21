# Deployment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy PriceHawk backend to Railway/Render and frontend to Vercel with CI/CD pipeline.

**Architecture:** Backend runs in Docker container with PostgreSQL database. Frontend builds with Vite and deploys to Vercel edge network. GitHub Actions handles CI/CD with automated tests and deployments on push to main.

**Tech Stack:** Docker, Docker Compose, GitHub Actions, Railway/Render, Vercel, PostgreSQL

---

## File Structure

```
# Backend deployment
Dockerfile
docker-compose.yml
.dockerignore
.env.example
railway.toml              # Railway config (or render.yaml)

# CI/CD
.github/
└── workflows/
    ├── backend-ci.yml     # Backend tests on PR
    ├── frontend-ci.yml    # Frontend tests on PR
    └── deploy.yml         # Deploy on merge to main

# Frontend deployment
web/
├── vercel.json            # Vercel config
└── .env.example

# Database
src/db/
└── migrations/
    └── 001_initial_schema.sql  # Already exists
```

---

## Task 1: Docker Configuration

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create Dockerfile**

Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy migrations
COPY src/db/migrations ./dist/db/migrations

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user for security
USER nodejs

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/internal/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
```

- [ ] **Step 2: Create .dockerignore**

Create `.dockerignore`:
```
node_modules
dist
*.log
.env
.env.local
.git
.gitignore
README.md
docs
tests
coverage
web
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add Docker configuration for backend"
```

---

## Task 2: Docker Compose for Local Development

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pricehawk-db
    environment:
      POSTGRES_USER: pricehawk
      POSTGRES_PASSWORD: pricehawk_dev
      POSTGRES_DB: pricehawk
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/db/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pricehawk"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      target: development
    container_name: pricehawk-api
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://pricehawk:pricehawk_dev@postgres:5432/pricehawk
      JWT_SECRET: dev_jwt_secret_change_in_production
      JWT_EXPIRES_IN: 1h
      JWT_REFRESH_EXPIRES_IN: 7d
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

- [ ] **Step 2: Add development Dockerfile target**

Update `Dockerfile` to add development target:
```dockerfile
# Development stage (add after the FROM node:20-alpine AS builder line)
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml Dockerfile
git commit -m "feat: add Docker Compose for local development"
```

---

## Task 3: Environment Configuration

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create .env.example**

Create `.env.example`:
```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://pricehawk:pricehawk_dev@localhost:5432/pricehawk

# Authentication
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend (for CORS)
FRONTEND_URL=http://localhost:5173

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_CRON=0 * * * *
```

- [ ] **Step 2: Create frontend .env.example**

Create `web/.env.example`:
```bash
VITE_API_URL=/api/v1
```

- [ ] **Step 3: Commit**

```bash
git add .env.example web/.env.example
git commit -m "feat: add environment configuration examples"
```

---

## Task 4: Railway Configuration

**Files:**
- Create: `railway.toml`

- [ ] **Step 1: Create railway.toml**

Create `railway.toml`:
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node dist/index.js"
healthcheckPath = "/api/v1/internal/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "pricehawk-backend"

[[services.variables]]
name = "NODE_ENV"
value = "production"

[[services.variables]]
name = "PORT"
value = "3000"
```

- [ ] **Step 2: Alternative - Create render.yaml**

If using Render instead, create `render.yaml`:
```yaml
services:
  - type: web
    name: pricehawk-api
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: pricehawk-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true

databases:
  - name: pricehawk-db
    databaseName: pricehawk
    user: pricehawk
```

- [ ] **Step 3: Commit**

```bash
git add railway.toml
git commit -m "feat: add Railway deployment configuration"
```

---

## Task 5: Vercel Configuration

**Files:**
- Create: `web/vercel.json`

- [ ] **Step 1: Create vercel.json**

Create `web/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://pricehawk-api.railway.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Update vite.config.ts for production**

Ensure `web/vite.config.ts` has production settings:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
  // ... rest of config
})
```

- [ ] **Step 3: Commit**

```bash
git add web/vercel.json web/vite.config.ts
git commit -m "feat: add Vercel deployment configuration"
```

---

## Task 6: GitHub Actions CI

**Files:**
- Create: `.github/workflows/backend-ci.yml`
- Create: `.github/workflows/frontend-ci.yml`

- [ ] **Step 1: Create backend CI workflow**

Create `.github/workflows/backend-ci.yml`:
```yaml
name: Backend CI

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'
      - 'tsconfig.json'
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'
      - 'tsconfig.json'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: pricehawk_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/pricehawk_test
          JWT_SECRET: test_jwt_secret_for_ci
          JWT_EXPIRES_IN: 1h
          JWT_REFRESH_EXPIRES_IN: 7d
        run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

- [ ] **Step 2: Create frontend CI workflow**

Create `.github/workflows/frontend-ci.yml`:
```yaml
name: Frontend CI

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
  pull_request:
    branches: [main]
    paths:
      - 'web/**'

jobs:
  test:
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: web

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Run tests
        run: npm run test:run
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/
git commit -m "feat: add GitHub Actions CI workflows"
```

---

## Task 7: GitHub Actions Deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create deploy workflow**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-backend:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervConstitution/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: pricehawk-api

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-backend

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: web
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deployment workflow"
```

---

## Task 8: Database Migration Script

**Files:**
- Create: `scripts/db-migrate.sh`
- Create: `scripts/db-reset.sh`

- [ ] **Step 1: Create migration script**

Create `scripts/db-migrate.sh`:
```bash
#!/bin/bash
set -e

echo "Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run migrations
psql $DATABASE_URL -f src/db/migrations/001_initial_schema.sql

echo "Migrations completed successfully"
```

- [ ] **Step 2: Create reset script**

Create `scripts/db-reset.sh`:
```bash
#!/bin/bash
set -e

echo "⚠️  This will drop and recreate the database. Are you sure? (y/N)"
read -r response

if [[ "$response" != "y" && "$response" != "Y" ]]; then
  echo "Aborted"
  exit 0
fi

echo "Resetting database..."

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Drop and recreate
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE;" 2>/dev/null || true
psql $DATABASE_URL -c "CREATE SCHEMA public;"

# Run migrations
./scripts/db-migrate.sh

echo "Database reset complete"
```

- [ ] **Step 3: Make scripts executable**

```bash
chmod +x scripts/db-migrate.sh scripts/db-reset.sh
```

- [ ] **Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: add database migration scripts"
```

---

## Task 9: Health Check Endpoint

**Files:**
- Modify: `src/routes/internal.routes.ts`

- [ ] **Step 1: Add health endpoint**

The health endpoint should already exist in internal routes. Verify it works:

Check `src/routes/internal.routes.ts` has:
```typescript
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

If not, add it.

- [ ] **Step 2: Add database health check**

Add enhanced health check:
```typescript
import { queryOne } from '../config/database.js';

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await queryOne('SELECT 1');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/internal.routes.ts
git commit -m "feat: enhance health check with database status"
```

---

## Task 10: Production Environment Setup

- [ ] **Step 1: Set up Railway project**

1. Go to railway.app and create account
2. Create new project
3. Add PostgreSQL database
4. Deploy from GitHub repo

- [ ] **Step 2: Configure Railway environment variables**

Set in Railway dashboard:
```
NODE_ENV=production
JWT_SECRET=<generate-secure-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://your-app.vercel.app
SCHEDULER_ENABLED=true
```

- [ ] **Step 3: Set up Vercel project**

1. Go to vercel.com and create account
2. Import project from GitHub
3. Set root directory to `web`
4. Configure environment:
   - `VITE_API_URL=https://your-railway-app.railway.app/api/v1`

- [ ] **Step 4: Configure GitHub secrets**

Add secrets in repo settings:
```
RAILWAY_TOKEN=<railway-token>
VERCEL_TOKEN=<vercel-token>
VERCEL_ORG_ID=<org-id>
VERCEL_PROJECT_ID=<project-id>
```

---

## Task 11: Final Deployment Verification

- [ ] **Step 1: Push to main branch**

```bash
git push origin main
```

- [ ] **Step 2: Monitor deployment**

1. Check GitHub Actions workflow passes
2. Verify Railway deployment succeeds
3. Verify Vercel deployment succeeds

- [ ] **Step 3: Test production endpoints**

```bash
# Health check
curl https://your-railway-app.railway.app/api/v1/internal/health

# Register user
curl -X POST https://your-railway-app.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

- [ ] **Step 4: Test frontend**

1. Open https://your-app.vercel.app
2. Test registration flow
3. Test login flow
4. Test adding an item

---

## Task 12: Logging Setup

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Configure Pino logger**

Update `src/index.ts`:
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
});

// Use logger instead of console.log
logger.info({ port: env.PORT }, 'Server started');
```

- [ ] **Step 2: Add request logging middleware**

Create `src/middleware/request-logger.ts`:
```typescript
import pino from 'pino';
import { Request, Response, NextFunction } from 'express';

const logger = pino();

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: (req as any).user?.id,
    });
  });

  next();
}
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware/request-logger.ts src/index.ts
git commit -m "feat: add structured logging with Pino"
```

---

## Task 13: Database Backup Script

**Files:**
- Create: `scripts/db-backup.sh`

- [ ] **Step 1: Create backup script**

Create `scripts/db-backup.sh`:
```bash
#!/bin/bash
set -e

BACKUP_DIR=${BACKUP_DIR:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pricehawk_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
pg_dump $DATABASE_URL | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"

# Clean up old backups (keep last 7)
find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -delete
```

- [ ] **Step 2: Add to cron**

Add to Railway cron or use a scheduled job:
```yaml
# In railway.toml
[cron]
schedule = "0 2 * * *"  # Daily at 2 AM
command = "./scripts/db-backup.sh"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/db-backup.sh
git commit -m "feat: add database backup script"
```

---

## Task 14: CORS Production Configuration

**Files:**
- Modify: `src/app.ts`

- [ ] **Step 1: Update CORS configuration**

Update `src/app.ts`:
```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = [
      env.FRONTEND_URL,
      'https://pricehawk.vercel.app',
      /^https:\/\/pricehawk-.*\.vercel\.app$/, // Preview deployments
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });

    callback(null, isAllowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

- [ ] **Step 2: Commit**

```bash
git add src/app.ts
git commit -m "feat: configure production CORS with preview deployment support"
```

---

## Task 15: Sentry Error Tracking

**Files:**
- Modify: `package.json`
- Create: `src/utils/sentry.ts`

- [ ] **Step 1: Install Sentry**

```bash
npm install @sentry/node
```

- [ ] **Step 2: Configure Sentry**

Create `src/utils/sentry.ts`:
```typescript
import * as Sentry from '@sentry/node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}

export { Sentry };
```

- [ ] **Step 3: Add to app.ts**

```typescript
import { initSentry, Sentry } from './utils/sentry.js';

initSentry();

// Add Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Add Sentry error handler before other error handlers
app.use(Sentry.Handlers.errorHandler());
```

- [ ] **Step 4: Add to environment**

Add to `.env.example`:
```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
```

- [ ] **Step 5: Commit**

```bash
git add package.json src/utils/sentry.ts src/app.ts .env.example
git commit -m "feat: add Sentry error tracking"
```

---

## Summary

This plan sets up production deployment:

**Backend:**
- Docker container for consistent builds
- Railway/Render for hosting
- PostgreSQL database with migrations
- Health check endpoint for monitoring

**Frontend:**
- Vite production build
- Vercel for hosting
- API proxy configuration

**CI/CD:**
- Automated tests on PR
- Automatic deployment on merge to main
- Environment variable management

**Infrastructure:**
- Docker Compose for local development
- Database migration scripts
- Production environment configuration
