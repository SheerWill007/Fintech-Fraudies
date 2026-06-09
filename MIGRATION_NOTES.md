# Project Restructuring - Migration Notes

## What Changed

The project has been restructured from a Turborepo monorepo into a simpler frontend/backend architecture.

### Old Structure
```
fintech-fraudies-monorepo/
├── apps/
│   ├── web/
│   ├── api/
│   └── ml-engine/
├── packages/
│   ├── database/
│   ├── ui/
│   ├── config-typescript/
│   └── config-eslint/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json (with workspaces)
```

### New Structure
```
fintech-fraudies/
├── frontend/          # Next.js application
│   ├── app/
│   ├── components/    # Including UI components
│   ├── lib/
│   └── package.json
├── backend/
│   ├── api/           # NestJS API
│   │   ├── src/
│   │   ├── prisma/
│   │   └── package.json
│   ├── ml-engine/     # FastAPI ML service
│   │   ├── app/
│   │   ├── .venv/
│   │   └── requirements.txt
│   └── database/      # Prisma schema (reference)
│       ├── prisma/
│       └── package.json
├── docker-compose.yml
├── package.json       # Root scripts
└── README.md
```

## Files Deleted
- `turbo.json` - Turborepo configuration
- `pnpm-workspace.yaml` - PNPM workspace configuration
- `clean.js`, `init.js`, `project.txt` - Unnecessary scripts
- `apps/`, `packages/` - Old monorepo directories
- `.turbo/` - Turborepo cache
- `node_modules/` at root - Will be regenerated per package

## Files Created/Updated

### Environment Files
- **`backend/api/.env`** - Backend environment variables
- **`frontend/.env.local`** - Frontend environment variables

### Configuration Files
- **`package.json`** (root) - Updated with new script structure
- **`backend/api/package.json`** - Added Prisma dev dependency
- **`backend/api/prisma/schema.prisma`** - Copied from database package
- **`README.md`** - Updated with new structure and instructions

## Setup Instructions

### 1. Start Docker Services
```bash
npm run docker:up
```

### 2. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

**Backend API:**
```bash
cd backend/api
npm install
npx prisma generate
npx prisma migrate dev
```

**ML Engine:**
```bash
cd backend/ml-engine
python -m venv .venv
.venv\Scripts\activate.bat  # Windows CMD
# or .venv\Scripts\Activate.ps1  # Windows PowerShell
# or source .venv/bin/activate   # Linux/macOS
pip install -r requirements.txt
```

### 3. Run Development Servers

Open **3 separate terminal windows**:

**Terminal 1 - Frontend:**
```bash
npm run dev:frontend
# or: cd frontend && npm run dev
```

**Terminal 2 - Backend API:**
```bash
npm run dev:backend
# or: cd backend/api && npm run dev
```

**Terminal 3 - ML Engine:**
```bash
npm run dev:ml
# or: cd backend/ml-engine && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8000
```

## Available Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/v1
- **ML Engine**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Database Management

The Prisma schema is now located at `backend/api/prisma/schema.prisma`.

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## Notes

1. **No Turborepo**: The project no longer uses Turborepo. Each service runs independently.

2. **No PNPM Workspaces**: Each package manages its own `node_modules`.

3. **Shared UI Components**: The UI components from `packages/ui` are now in `frontend/components/ui/`.

4. **Prisma Client**: The Prisma client is generated in `backend/api/node_modules/.prisma/client/`.

5. **Environment Variables**: 
   - Frontend uses `.env.local`
   - Backend API uses `.env`
   - Both are gitignored

6. **Python Virtual Environment**: ML engine uses a local `.venv` directory for Python dependencies.

## Troubleshooting

### "Module not found" errors
Make sure to run `npm install` in both `frontend/` and `backend/api/` directories.

### Prisma Client errors
Run `npx prisma generate` from `backend/api/` directory.

### Database connection errors
Ensure Docker services are running: `npm run docker:up`

### ML Engine errors
Activate the virtual environment and install dependencies:
```bash
cd backend/ml-engine
.venv\Scripts\activate.bat
pip install -r requirements.txt
```
