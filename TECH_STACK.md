# Fraudies - Complete Tech Stack Documentation

## 📚 **Table of Contents**
1. [Tech Stack Overview](#tech-stack-overview)
2. [Architecture](#architecture)
3. [Backend Services](#backend-services)
4. [Frontend](#frontend)
5. [Infrastructure](#infrastructure)
6. [Development Setup](#development-setup)
7. [Deployment Guide](#deployment-guide)

---

## 🏗️ **Tech Stack Overview**

### **Backend API (NestJS)**
- **Framework**: NestJS 10.x (Node.js + TypeScript)
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x
- **Port**: 3001

### **ML Engine (Python)**
- **Framework**: FastAPI 0.104+
- **Runtime**: Python 3.10+
- **ML Library**: scikit-learn 1.3.2
- **Port**: 8000

### **Frontend (Next.js)**
- **Framework**: Next.js 14.2 (React 18)
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.4
- **Animations**: GSAP 3.12, Framer Motion 12.40
- **Icons**: Lucide React
- **Port**: 3000

### **Database & Infrastructure**
- **Primary DB**: PostgreSQL 15 (Alpine)
- **ORM**: Prisma 5.10
- **Cache**: Redis 7 (Alpine)
- **Containerization**: Docker + Docker Compose

---

## 🎯 **Architecture**

```
┌─────────────────┐
│   Next.js App   │  Port 3000
│   (Frontend)    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   NestJS API    │  Port 3001
│  (Backend API)  │
└────┬────────┬───┘
     │        │
     │        └─────────────┐
     ▼                      ▼
┌──────────┐      ┌─────────────────┐
│PostgreSQL│      │  FastAPI ML     │  Port 8000
│  (Prisma)│      │    Engine       │
└──────────┘      └─────────────────┘
     ▲
     │
┌──────────┐
│  Redis   │  Port 6379
│ (Cache)  │
└──────────┘
```

### **Request Flow:**
1. User interacts with Next.js frontend (port 3000)
2. Frontend calls NestJS API (port 3001)
3. NestJS validates request, checks auth (JWT)
4. For fraud scoring: NestJS → FastAPI ML Engine (port 8000)
5. ML Engine returns risk score + factors
6. NestJS saves to PostgreSQL via Prisma
7. Response returned to frontend

---

## 🔧 **Backend Services**

### **1. NestJS API (`backend/api/`)**

#### **Dependencies:**
```json
{
  "@nestjs/core": "10.x",
  "@nestjs/jwt": "10.x",
  "@nestjs/passport": "10.x",
  "@prisma/client": "5.10.x",
  "bcrypt": "5.1.1",
  "passport-jwt": "4.0.1",
  "class-validator": "0.14.0"
}
```

#### **Key Features:**
- **Authentication**: JWT-based with bcrypt password hashing
- **Validation**: class-validator + class-transformer
- **ORM**: Prisma with PostgreSQL
- **API Prefix**: `/api/v1`
- **CORS**: Configurable via `CORS_ORIGIN` env var
- **Logging**: Structured JSON logging via custom interceptor

#### **Modules:**
- `auth` - Login, registration, JWT strategy
- `transactions` - CRUD, webhook ingestion, fraud scoring
- `audit` - Audit trail for transaction status changes
- `health` - Health check endpoint
- `prisma` - Database client service
- `webhook` - External webhook handling

#### **Environment Variables:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fraudies?schema=public"
PORT=3001
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://localhost:3000
ML_ENGINE_URL=http://localhost:8000
WEBHOOK_SECRET=your-webhook-secret-here
```

#### **Database Schema (Prisma):**
- **User**: id, email, passwordHash, role (ADMIN/ANALYST), createdAt
- **Transaction**: id, userId, amount, type, status, riskScore, riskFactors[], ipAddress, deviceId
- **AuditLog**: statusBefore, statusAfter, actorId, reason
- **WebhookEvent**: payload (JSON), source, processedAt

#### **API Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/health

GET    /api/v1/transactions
GET    /api/v1/transactions/flagged
GET    /api/v1/transactions/stats
GET    /api/v1/transactions/:id
POST   /api/v1/transactions
POST   /api/v1/transactions/webhook
PATCH  /api/v1/transactions/:id/status
```

---

### **2. ML Engine (`backend/ml-engine/`)**

#### **Dependencies:**
```txt
fastapi>=0.104.1
uvicorn[standard]>=0.24.0
scikit-learn>=1.3.2
pandas>=2.1.3
numpy>=1.26.2
joblib>=1.3.2
pydantic>=2.5.2
```

#### **Key Features:**
- **Model**: Gradient Boosting Classifier (scikit-learn)
- **Explainability**: SHAP values for feature contributions
- **Features**: 13 engineered features from transaction data
- **Thresholds**:
  - `HIGH_RISK_THRESHOLD`: 0.70 (FLAGGED)
  - `PENDING_THRESHOLD`: 0.40 (PENDING)
  - Below 0.40: APPROVED

#### **Feature Engineering:**
- Amount-based: transaction amount, amount deviation from user average
- Velocity: transactions in last hour, transactions in last day
- Behavioral: is_unusual_hour, is_new_device, is_international
- Type encoding: one-hot encoding for transaction types

#### **Environment Variables:**
```env
HIGH_RISK_THRESHOLD=0.70
PENDING_THRESHOLD=0.40
CORS_ORIGIN=http://localhost:3001
```

#### **API Endpoints:**
```
GET  /         - Health check
POST /predict  - Score transaction for fraud risk
```

#### **Request/Response:**
```json
// POST /predict
{
  "transactionId": "txn_123",
  "userId": "usr_456",
  "amount": 1250.50,
  "type": "PURCHASE",
  "ipAddress": "192.168.1.1",
  "deviceId": "dev_abc",
  "timestamp": "2025-01-15T10:30:00Z"
}

// Response
{
  "transactionId": "txn_123",
  "riskScore": 0.87,
  "status": "FLAGGED",
  "factors": [
    "High amount deviation",
    "Velocity check: 8 transactions in 3 minutes",
    "New device fingerprint"
  ]
}
```

---

## 🎨 **Frontend**

### **Next.js 14 (`frontend/`)**

#### **Dependencies:**
```json
{
  "next": "14.2.16",
  "react": "18.x",
  "tailwindcss": "3.4.0",
  "gsap": "3.12.5",
  "framer-motion": "12.40.0",
  "lucide-react": "0.454.0"
}
```

#### **Key Features:**
- **App Router**: Next.js 14 app directory structure
- **Server Components**: Default for static content
- **Client Components**: Interactive UI (dashboard, forms)
- **API Client**: Fetch-based client in `lib/api-client.ts`
- **Authentication**: JWT stored in localStorage
- **Styling**: Utility-first with custom design system

#### **Pages:**
```
/                         - Landing page (marketing)
/login                    - Authentication
/register                 - User registration
/dashboard                - Overview with metrics
/dashboard/transactions   - Transaction list
/dashboard/alerts         - Flagged transactions
```

#### **Environment Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

#### **Design System:**
- **Colors**: Black background, emerald green accent (#10b981)
- **Typography**: Inter font family
- **Components**: Modular in `components/` directory
- **Utilities**: Custom CSS in `globals.css`

---

## 🗄️ **Infrastructure**

### **PostgreSQL 15**
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Credentials**: postgres/password (change in production)
- **Volume**: `postgres-data` for persistence
- **Health Check**: `pg_isready -U postgres`

### **Redis 7**
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Volume**: `redis-data` for persistence
- **Persistence**: AOF (append-only file) enabled

### **Docker Compose Services:**
```yaml
services:
  postgres:
    image: postgres:15-alpine
    ports: ["5432:5432"]
    volumes: [postgres-data:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis-data:/data]
```

---

## 💻 **Development Setup**

### **Prerequisites:**
- Node.js 20+
- Python 3.10+
- Docker & Docker Compose
- npm or pnpm

### **Quick Start:**

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd fintech-fraudies

# 2. Start infrastructure
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Setup database
cd backend/api
npm install
npx prisma migrate deploy
npx prisma generate

# 5. Start ML Engine
cd ../ml-engine
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 6. Start API
cd ../api
npm run dev

# 7. Start Frontend
cd ../../frontend
npm install
npm run dev
```

### **Verify Installation:**
- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1/health
- ML Engine: http://localhost:8000
- PostgreSQL: `psql -h localhost -U postgres -d fraudies`

---

## 🚀 **Deployment Guide**


### **Pre-Deployment Checklist**

#### **Security:**
- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Generate strong WEBHOOK_SECRET
- [ ] Use environment-specific DATABASE_URL
- [ ] Enable HTTPS/TLS for all services
- [ ] Configure firewall rules (only expose necessary ports)
- [ ] Set up rate limiting
- [ ] Enable CORS only for production domains
- [ ] Review and harden Prisma schema
- [ ] Set up database backups

#### **Environment Variables:**
- [ ] Set NODE_ENV=production
- [ ] Update CORS_ORIGIN to production domain
- [ ] Update NEXT_PUBLIC_API_URL to production API
- [ ] Configure ML_ENGINE_URL for internal network
- [ ] Set secure DATABASE_URL with SSL

#### **Database:**
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Create database backups strategy
- [ ] Set up connection pooling (PgBouncer recommended)
- [ ] Configure PostgreSQL for production (shared_buffers, max_connections)

#### **Performance:**
- [ ] Enable Next.js production build optimizations
- [ ] Configure Redis for session/cache management
- [ ] Set up CDN for static assets
- [ ] Enable gzip/brotli compression
- [ ] Optimize ML model loading time

---

## **Deployment Option 1: Traditional VPS (AWS EC2, DigitalOcean, etc.)**

### **Architecture:**
```
┌─────────────────────────────────────────────┐
│              Load Balancer (NGINX)           │
│         (SSL Termination, Reverse Proxy)     │
└──────────┬────────────────┬─────────────────┘
           │                │
           ▼                ▼
    ┌──────────┐    ┌──────────────┐
    │ Next.js  │    │   NestJS API │
    │  (PM2)   │    │     (PM2)    │
    └──────────┘    └───────┬──────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  ML Engine   │
                    │   (Gunicorn) │
                    └──────────────┘
           ┌────────┴────────┐
           ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │PostgreSQL│      │  Redis   │
    └──────────┘      └──────────┘
```

### **Step-by-Step Deployment:**

#### **1. Provision Server (Ubuntu 22.04 LTS)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.10+
sudo apt install -y python3 python3-pip python3-venv

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install NGINX
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

#### **2. Setup PostgreSQL**
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE fraudies;
CREATE USER fraudies_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE fraudies TO fraudies_user;
\q

# Configure PostgreSQL for external connections (if needed)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host fraudies fraudies_user 127.0.0.1/32 scram-sha-256

sudo systemctl restart postgresql
```

#### **3. Setup Redis**
```bash
# Configure Redis
sudo nano /etc/redis/redis.conf
# Set: bind 127.0.0.1
# Set: requirepass your_redis_password

sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

#### **4. Deploy Backend API**
```bash
# Create application directory
sudo mkdir -p /var/www/fraudies/api
sudo chown $USER:$USER /var/www/fraudies

# Clone/copy your code
cd /var/www/fraudies/api
# (Upload via git clone, rsync, or scp)

# Install dependencies
npm install --production

# Setup environment
cat > .env << EOF
DATABASE_URL="postgresql://fraudies_user:strong_password_here@localhost:5432/fraudies?schema=public"
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://yourdomain.com
ML_ENGINE_URL=http://localhost:8000
WEBHOOK_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Build application
npm run build

# Setup PM2
pm2 start npm --name "fraudies-api" -- start
pm2 save
pm2 startup
```

#### **5. Deploy ML Engine**
```bash
# Create directory
cd /var/www/fraudies
mkdir ml-engine && cd ml-engine

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cat > .env << EOF
HIGH_RISK_THRESHOLD=0.70
PENDING_THRESHOLD=0.40
CORS_ORIGIN=http://localhost:3001
EOF

# Install Gunicorn
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/fraudies-ml.service
```

**ML Engine Service File:**
```ini
[Unit]
Description=Fraudies ML Engine
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/fraudies/ml-engine
Environment="PATH=/var/www/fraudies/ml-engine/.venv/bin"
ExecStart=/var/www/fraudies/ml-engine/.venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/fraudies/ml-access.log \
    --error-logfile /var/log/fraudies/ml-error.log
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Create log directory
sudo mkdir -p /var/log/fraudies
sudo chown www-data:www-data /var/log/fraudies

# Start service
sudo systemctl daemon-reload
sudo systemctl start fraudies-ml
sudo systemctl enable fraudies-ml
```

#### **6. Deploy Frontend**
```bash
# Create directory
cd /var/www/fraudies
mkdir frontend && cd frontend

# Install dependencies
npm install --production

# Setup environment
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
EOF

# Build
npm run build

# Setup PM2
pm2 start npm --name "fraudies-frontend" -- start
pm2 save
```

#### **7. Configure NGINX**
```bash
sudo nano /etc/nginx/sites-available/fraudies
```

**NGINX Configuration:**
```nginx
# Upstream for API
upstream api_backend {
    server 127.0.0.1:3001;
}

# Upstream for ML Engine (optional if only used internally)
upstream ml_backend {
    server 127.0.0.1:8000;
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API subdomain
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fraudies /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

#### **8. Setup Monitoring**
```bash
# Install monitoring tools
pm2 install pm2-logrotate

# View logs
pm2 logs fraudies-api
pm2 logs fraudies-frontend
sudo journalctl -u fraudies-ml -f

# Monitor resources
pm2 monit
```

---

## **Deployment Option 2: Docker (Production)**

### **Create Production Dockerfiles:**

**Backend API Dockerfile:**
```dockerfile
# backend/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001
CMD ["npm", "start"]
```

**ML Engine Dockerfile:**
```dockerfile
# backend/ml-engine/Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

**Production docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: fraudies
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - fraudies-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - fraudies-network

  ml-engine:
    build:
      context: ./backend/ml-engine
      dockerfile: Dockerfile
    environment:
      HIGH_RISK_THRESHOLD: ${HIGH_RISK_THRESHOLD}
      PENDING_THRESHOLD: ${PENDING_THRESHOLD}
    restart: unless-stopped
    networks:
      - fraudies-network

  api:
    build:
      context: ./backend/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      ML_ENGINE_URL: http://ml-engine:8000
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
      CORS_ORIGIN: ${CORS_ORIGIN}
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
      - ml-engine
    restart: unless-stopped
    networks:
      - fraudies-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped
    networks:
      - fraudies-network

volumes:
  postgres-data:
  redis-data:

networks:
  fraudies-network:
    driver: bridge
```

---

## **Deployment Option 3: Cloud Platforms**

### **AWS (Recommended)**

#### **Architecture:**
- **Frontend**: AWS Amplify or S3 + CloudFront
- **API**: ECS Fargate or Elastic Beanstalk
- **ML Engine**: ECS Fargate or Lambda (with container)
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Load Balancer**: Application Load Balancer (ALB)

#### **Steps:**
1. Create RDS PostgreSQL instance
2. Create ElastiCache Redis cluster
3. Deploy API to ECS Fargate
4. Deploy ML Engine to ECS Fargate
5. Deploy Frontend to Amplify
6. Configure ALB with SSL (ACM certificate)
7. Set up CloudWatch for monitoring

### **Vercel (Frontend) + Railway/Render (Backend)**

#### **Frontend on Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### **Backend on Railway:**
1. Connect GitHub repo to Railway
2. Add services: API, ML Engine, PostgreSQL, Redis
3. Configure environment variables
4. Deploy

### **Heroku**
```bash
# Create apps
heroku create fraudies-api
heroku create fraudies-ml
heroku create fraudies-frontend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini -a fraudies-api

# Add Redis
heroku addons:create heroku-redis:mini -a fraudies-api

# Deploy
git push heroku main
```

---

## **Post-Deployment**

### **Health Checks:**
```bash
# API Health
curl https://api.yourdomain.com/api/v1/health

# ML Engine Health
curl https://api.yourdomain.com:8000/

# Frontend
curl https://yourdomain.com
```

### **Monitoring:**
- Set up APM (New Relic, Datadog, or Sentry)
- Configure log aggregation (ELK stack or CloudWatch)
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure alerts for errors and performance

### **Backup Strategy:**
```bash
# Automated PostgreSQL backups
pg_dump -h localhost -U fraudies_user fraudies > backup_$(date +%Y%m%d).sql

# Setup cron job
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

---

## **Performance Optimization**

### **Database:**
- Add indexes for frequently queried fields
- Use connection pooling (PgBouncer)
- Optimize Prisma queries with `select` and `include`
- Enable query logging and analyze slow queries

### **API:**
- Implement caching with Redis
- Use compression middleware
- Optimize payload sizes
- Implement rate limiting

### **Frontend:**
- Enable Next.js Image Optimization
- Use static generation where possible
- Implement code splitting
- Enable CDN caching

### **ML Engine:**
- Cache model predictions for duplicate transactions
- Use model quantization for faster inference
- Scale horizontally with multiple workers

---

## **Troubleshooting**

### **Common Issues:**

**Issue**: Database connection failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
psql "$DATABASE_URL"
```

**Issue**: ML Engine not responding
```bash
# Check service status
sudo systemctl status fraudies-ml

# Check logs
sudo journalctl -u fraudies-ml -n 50
```

**Issue**: CORS errors
```bash
# Verify CORS_ORIGIN matches frontend domain
# Check NGINX proxy headers
```

---

## **Security Best Practices**

1. **Use environment variables** for all secrets
2. **Enable HTTPS** everywhere (Let's Encrypt)
3. **Implement rate limiting** on API endpoints
4. **Use parameterized queries** (Prisma handles this)
5. **Validate all inputs** (class-validator)
6. **Hash passwords** (bcrypt with 10+ rounds)
7. **Set secure HTTP headers** (helmet middleware)
8. **Regular security updates** (Dependabot)
9. **Implement RBAC** (role-based access control)
10. **Audit logs** for all sensitive operations

---

## **Cost Estimation (Monthly)**

### **VPS Deployment:**
- DigitalOcean Droplet (4GB RAM): $24/month
- Managed PostgreSQL (1GB): $15/month
- Managed Redis (256MB): $10/month
- Domain + SSL: $12/year
- **Total: ~$50/month**

### **AWS Deployment:**
- RDS PostgreSQL (t3.micro): $15/month
- ElastiCache Redis (t3.micro): $12/month
- ECS Fargate (2 tasks): $30/month
- ALB: $16/month
- S3 + CloudFront: $5/month
- **Total: ~$80/month**

---

## **Support & Resources**

- **NestJS**: https://docs.nestjs.com
- **FastAPI**: https://fastapi.tiangolo.com
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **PostgreSQL**: https://www.postgresql.org/docs

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0
