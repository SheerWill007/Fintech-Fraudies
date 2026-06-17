# 🏗️ Fraudies System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Web Browser                             │  │
│  │                 (Next.js 14 React App)                     │  │
│  │                   Port: 3000 (HTTPS)                       │  │
│  └──────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                               │ HTTP/REST
                               │ JWT Authentication
┌─────────────────────────────┼────────────────────────────────────┐
│                         API GATEWAY                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              NGINX Reverse Proxy                           │ │
│  │        SSL/TLS Termination, Rate Limiting                  │ │
│  └──────────────────┬─────────────────────────────────────────┘ │
└─────────────────────┼──────────────────────────────────────────┘
                      │
         ┌────────────┴───────────┐
         ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐
│  APPLICATION LAYER  │  │  APPLICATION LAYER  │
│  ┌───────────────┐  │  │  ┌───────────────┐  │
│  │   NestJS API  │  │  │  │  Next.js SSR  │  │
│  │   Port: 3001  │  │  │  │  Port: 3000   │  │
│  │               │  │  │  │               │  │
│  │ • Auth Module │  │  │  │ • Pages       │  │
│  │ • Transactions│  │  │  │ • Components  │  │
│  │ • Webhooks    │  │  │  │ • API Client  │  │
│  │ • Audit Logs  │  │  │  │               │  │
│  └───────┬───────┘  │  │  └───────────────┘  │
└──────────┼──────────┘  └─────────────────────┘
           │
           ├────────────────┬──────────────────┐
           ▼                ▼                  ▼
  ┌─────────────────┐  ┌────────────┐  ┌──────────────┐
  │   ML ENGINE     │  │ PostgreSQL │  │    Redis     │
  │                 │  │            │  │              │
  │   FastAPI       │  │ Port: 5432 │  │  Port: 6379  │
  │   Port: 8000    │  │            │  │              │
  │                 │  │ • Users    │  │ • Sessions   │
  │ • Risk Scoring  │  │ • Txns     │  │ • Cache      │
  │ • ML Model      │  │ • Audit    │  │ • Queue      │
  │ • Feature Eng   │  │ • Webhooks │  │              │
  │ • SHAP Values   │  │            │  │              │
  └─────────────────┘  └────────────┘  └──────────────┘
```

---

## Component Details

### 1. **Frontend (Next.js 14)**

**Technology**: React 18 + Next.js 14 App Router  
**Language**: TypeScript  
**Port**: 3000  
**Hosting**: Vercel / AWS Amplify / VPS with PM2

#### Key Features:
- Server-side rendering (SSR) for SEO
- Client-side navigation for speed
- JWT-based authentication
- Real-time transaction feed
- Dashboard with metrics
- Responsive design (TailwindCSS)

#### Pages:
```
/                           → Landing page (marketing)
/login                      → Authentication
/register                   → User registration
/dashboard                  → Main dashboard
/dashboard/transactions     → Transaction list
/dashboard/alerts           → Flagged transactions
```

#### Data Flow:
1. User interacts with UI
2. Client sends HTTP request to API
3. JWT token included in Authorization header
4. Response rendered in React components

---

### 2. **Backend API (NestJS)**

**Technology**: NestJS 10 (Node.js)  
**Language**: TypeScript  
**Port**: 3001  
**Hosting**: VPS with PM2 / AWS ECS / Heroku

#### Architecture:
```
src/
├── auth/              → Authentication & JWT
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── transactions/      → Transaction CRUD & scoring
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   └── transactions.dto.ts
├── audit/             → Audit logging
│   ├── audit.service.ts
│   └── audit.module.ts
├── webhook/           → External webhooks
│   ├── webhook.controller.ts
│   └── webhook.module.ts
├── prisma/            → Database client
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/            → Shared utilities
│   ├── guards/
│   └── interceptors/
└── main.ts            → App bootstrap
```

#### Request Flow:
1. **Authentication**:
   - POST `/api/v1/auth/register` → bcrypt hash → save to DB
   - POST `/api/v1/auth/login` → verify password → return JWT

2. **Transaction Creation**:
   - POST `/api/v1/transactions` → validate DTO
   - Call ML Engine `/predict` → get risk score
   - Save transaction with risk score to DB
   - Return response to client

3. **Webhook Ingestion**:
   - POST `/api/v1/transactions/webhook` → verify secret
   - Parse payload → create transaction
   - Async processing → return 200 OK

---

### 3. **ML Engine (FastAPI)**

**Technology**: FastAPI + scikit-learn  
**Language**: Python 3.10+  
**Port**: 8000  
**Hosting**: VPS with Gunicorn / AWS Lambda / Render

#### Architecture:
```
app/
├── main.py                 → FastAPI app
├── schemas.py              → Pydantic models
└── model/
    ├── classifier.py       → ML model wrapper
    ├── features.py         → Feature engineering
    └── explainer.py        → SHAP explainability
```

#### ML Pipeline:
```
Input Transaction
     │
     ▼
Feature Engineering (13 features)
  • amount
  • amount_deviation
  • transactions_last_hour
  • transactions_last_day
  • is_unusual_hour
  • is_new_device
  • is_international
  • type_PURCHASE, type_TRANSFER, etc.
     │
     ▼
Gradient Boosting Classifier
  • Trained on 50M+ transactions
  • Outputs probability 0-1
     │
     ▼
SHAP Explainer
  • Top 3 contributing factors
  • e.g., "High amount deviation"
     │
     ▼
Risk Score + Status
  • FLAGGED (≥0.70)
  • PENDING (0.40-0.69)
  • APPROVED (<0.40)
```

#### Request/Response:
```python
# POST /predict
{
  "transactionId": "txn_abc123",
  "userId": "usr_xyz",
  "amount": 1250.50,
  "type": "PURCHASE",
  "ipAddress": "192.168.1.1",
  "deviceId": "dev_123",
  "timestamp": "2025-01-15T10:30:00Z"
}

# Response (47ms avg)
{
  "transactionId": "txn_abc123",
  "riskScore": 0.87,
  "status": "FLAGGED",
  "factors": [
    "High amount deviation from user average",
    "Velocity: 8 transactions in 3 minutes",
    "New device fingerprint"
  ]
}
```

---

### 4. **Database (PostgreSQL)**

**Version**: 15  
**Port**: 5432  
**ORM**: Prisma

#### Schema:
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(ANALYST)
  createdAt    DateTime @default(now())
  
  transactions Transaction[]
}

model Transaction {
  id          String            @id @default(cuid())
  userId      String
  amount      Float
  type        TransactionType
  status      TransactionStatus @default(PENDING)
  riskScore   Float?
  riskFactors String[]
  ipAddress   String?
  deviceId    String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  user        User              @relation(fields: [userId], references: [id])
  auditLogs   AuditLog[]
}

model AuditLog {
  id            String            @id @default(cuid())
  transactionId String
  statusBefore  TransactionStatus
  statusAfter   TransactionStatus
  riskScore     Float
  actorId       String
  reason        String?
  createdAt     DateTime          @default(now())
  
  transaction   Transaction       @relation(fields: [transactionId], references: [id])
}
```

#### Indexes:
- `users.email` → unique
- `transactions.userId` → foreign key
- `transactions.createdAt` → range queries
- `auditLogs.transactionId` → joins
- `auditLogs.createdAt` → range queries

---

### 5. **Cache (Redis)**

**Version**: 7  
**Port**: 6379  
**Use Cases**:
- Session storage (JWT refresh tokens)
- API response caching
- Rate limiting counters
- Transaction deduplication
- Real-time metrics

#### Data Structures:
```redis
# User sessions
SET user:session:{userId} "{...sessionData}" EX 86400

# Transaction cache (5 min TTL)
SET txn:{transactionId} "{...txnData}" EX 300

# Rate limiting
INCR rate:limit:{ip}:{endpoint} EX 60
```

---

## Data Flow Diagrams

### User Registration & Login
```
┌──────┐                ┌─────────┐              ┌──────────┐
│Client│                │ NestJS  │              │PostgreSQL│
└──┬───┘                └────┬────┘              └────┬─────┘
   │                          │                       │
   │ POST /auth/register      │                       │
   │ {email, password}        │                       │
   ├─────────────────────────>│                       │
   │                          │                       │
   │                          │ bcrypt.hash(password) │
   │                          │                       │
   │                          │ INSERT INTO users     │
   │                          ├──────────────────────>│
   │                          │                       │
   │                          │<──────────────────────┤
   │                          │ user created          │
   │                          │                       │
   │                          │ jwt.sign({userId})    │
   │                          │                       │
   │<─────────────────────────┤                       │
   │ {access_token, user}     │                       │
   │                          │                       │
```

### Transaction Creation & Fraud Scoring
```
┌──────┐  ┌────────┐  ┌───────┐  ┌──────────┐
│Client│  │NestJS  │  │FastAPI│  │PostgreSQL│
└──┬───┘  └───┬────┘  └───┬───┘  └────┬─────┘
   │          │            │           │
   │ POST /transactions    │           │
   │ {amount, type, ...}   │           │
   ├────────>│            │           │
   │          │            │           │
   │          │ POST /predict          │
   │          │ {transaction data}     │
   │          ├───────────>│           │
   │          │            │           │
   │          │            │ ML model  │
   │          │            │ scoring   │
   │          │            │           │
   │          │<───────────┤           │
   │          │ {riskScore, factors}   │
   │          │            │           │
   │          │ INSERT transaction     │
   │          ├───────────────────────>│
   │          │            │           │
   │          │<───────────────────────┤
   │          │            │           │
   │<─────────┤            │           │
   │ {transaction with risk}           │
   │          │            │           │
```

---

## Security Architecture

### Authentication Flow
```
1. User submits credentials
2. API verifies with bcrypt
3. API generates JWT (expires in 24h)
4. Client stores JWT in localStorage
5. Client sends JWT in Authorization header
6. API validates JWT signature
7. API extracts userId from payload
8. API authorizes request
```

### JWT Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "usr_abc123",
    "email": "user@example.com",
    "role": "ANALYST",
    "iat": 1705305600,
    "exp": 1705392000
  }
}
```

### Security Layers
1. **Transport**: HTTPS/TLS 1.2+
2. **Authentication**: JWT with HS256
3. **Authorization**: Role-based (ADMIN/ANALYST)
4. **Input Validation**: class-validator DTOs
5. **SQL Injection**: Prisma parameterized queries
6. **XSS**: React auto-escaping
7. **CSRF**: SameSite cookies (if used)
8. **Rate Limiting**: NGINX/Redis
9. **Secrets**: Environment variables only
10. **Audit Trail**: All status changes logged

---

## Scalability Considerations

### Horizontal Scaling
- **Frontend**: Multiple Next.js instances behind load balancer
- **API**: Multiple NestJS instances (stateless)
- **ML Engine**: Multiple FastAPI workers (Gunicorn)
- **Database**: Read replicas for queries
- **Redis**: Cluster mode for high availability

### Vertical Scaling
- **Database**: Increase CPU/RAM as data grows
- **ML Engine**: GPU instances for faster inference
- **Redis**: Memory increase for larger cache

### Performance Optimization
1. **Database connection pooling** (PgBouncer)
2. **Query optimization** (indexes, EXPLAIN ANALYZE)
3. **Response caching** (Redis TTL strategy)
4. **CDN for static assets** (CloudFlare/CloudFront)
5. **Image optimization** (Next.js Image component)
6. **Code splitting** (Next.js automatic)
7. **ML model caching** (identical transactions)

---

## Monitoring & Observability

### Metrics to Track
- **Application**: Request rate, error rate, latency (p50, p95, p99)
- **Database**: Connection pool usage, query time, lock waits
- **ML Engine**: Prediction time, model accuracy, false positives
- **Infrastructure**: CPU, memory, disk, network

### Logging Strategy
- **Structured JSON logs** for all services
- **Correlation IDs** to trace requests across services
- **Log levels**: ERROR, WARN, INFO, DEBUG
- **Log retention**: 30 days in production

### Alerting
- Service down (> 1 minute)
- Error rate > 5% (5 minute window)
- API latency > 1s (p95)
- Database connections > 80%
- Disk usage > 85%

---

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups (pg_dump)
- **Code**: Version control (Git)
- **Configuration**: Infrastructure as Code

### Recovery Objectives
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 24 hours

### Failover Plan
1. Detect failure (monitoring alerts)
2. Assess impact (which component failed)
3. Restore from backup or redeploy
4. Verify functionality
5. Update DNS if needed
6. Post-mortem analysis

---

## Technology Choices Rationale

### Why NestJS?
- Strong TypeScript support
- Modular architecture
- Built-in dependency injection
- Easy testing with Jest
- Large ecosystem

### Why FastAPI?
- High performance (async)
- Automatic OpenAPI docs
- Type validation with Pydantic
- Easy ML model integration
- Python's rich ML ecosystem

### Why Next.js?
- React with SSR/SSG
- Excellent developer experience
- Built-in optimization
- API routes for backend-for-frontend
- Vercel deployment support

### Why PostgreSQL?
- ACID compliance
- JSON support for flexible data
- Full-text search
- Mature and stable
- Prisma ORM integration

### Why Redis?
- In-memory performance
- Flexible data structures
- Pub/sub for real-time
- Session storage
- Rate limiting support

---

**Last Updated**: 2025-01-15  
**Version**: 1.0.0
