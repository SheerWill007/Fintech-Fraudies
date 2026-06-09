# Fraudies — Enterprise Fraud Detection Platform

> **Confidential — Enterprise Evaluation Distribution**  
> This document is intended for authorized technical and compliance personnel at licensed institutions.

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [System Architecture](#2-system-architecture)
3. [Transaction Lifecycle](#3-transaction-lifecycle)
4. [Repository Structure](#4-repository-structure)
5. [Technology Stack](#5-technology-stack)
6. [Security & Compliance Posture](#6-security--compliance-posture)
7. [Deployment Prerequisites](#7-deployment-prerequisites)
8. [Environment Configuration](#8-environment-configuration)
9. [Service Initialization](#9-service-initialization)
10. [API Reference](#10-api-reference)
11. [Operational Scripts](#11-operational-scripts)
12. [License & Proprietary Notice](#12-license--proprietary-notice)

---

## 1. Executive Overview

**Fraudies** is a high-performance, real-time fraud detection platform engineered for enterprise-grade transaction monitoring across financial institutions. The platform combines deterministic rule-based evaluation with machine learning risk scoring to deliver sub-second transaction assessment at institutional scale.

The system is designed to address core operational requirements critical to regulated financial environments:

- **Real-time risk scoring** on inbound transaction streams with deterministic sub-millisecond velocity checks via Redis
- **Immutable audit trail** ensuring every transaction decision is permanently logged for regulatory examination
- **Modular ML inference layer** built on a FastAPI service, separating scoring logic from core business orchestration for independent auditability
- **Role-based access controls** and JWT-authenticated API endpoints to enforce principle-of-least-privilege across analyst and system-level actors
- **Webhook ingestion interface** supporting secure, header-authenticated integration with upstream core banking systems, payment processors, and data providers

---

## 2. System Architecture

Fraudies is structured as a monorepo with a clean separation of concerns between the client-facing dashboard, the core orchestration API, and the isolated ML inference engine. The PostgreSQL-backed persistence layer is accessed exclusively through a typed Prisma ORM client, ensuring schema consistency across environments.

```
┌─────────────────────────────────────────────────────────────────┐
│                     External Ingestion Layer                    │
│          Client Applications  /  Upstream Webhooks             │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTPS / Webhook (X-Webhook-Secret)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   NestJS Orchestration API                       │
│              (Authentication · Routing · Audit)                  │
└───────┬──────────────────────┬───────────────────────┬──────────┘
        │                      │                       │
        ▼                      ▼                       ▼
┌──────────────┐   ┌────────────────────┐   ┌──────────────────┐
│  PostgreSQL  │   │  FastAPI ML Engine │   │  Redis Cache     │
│  (Prisma)    │   │  (Risk Scoring)    │   │  (Velocity Rules)│
└──────────────┘   └────────────────────┘   └──────────────────┘
        ▲
        │  WebSocket / Polling
┌───────┴──────────────────────────────────────────────────────────┐
│                   Next.js Analyst Dashboard                       │
│              (Real-time Monitoring · Alert Management)           │
└──────────────────────────────────────────────────────────────────┘
```

### Mermaid Diagram

```mermaid
graph TD
    User([External Client / Webhook]) -->|Ingest Transaction| API[NestJS Ingestion API]
    API -->|1. Store PENDING| DB[(PostgreSQL)]
    API -->|2. Score Request| ML[FastAPI ML Engine]
    ML -->|3. Evaluate Risk Score & Factors| API
    API -->|4. Update Status & Audit Log| DB
    Web[Next.js Dashboard] -->|Poll / WebSockets| API
    Web -->|Fetch Real-time Data| DB
```

---

## 3. Transaction Lifecycle

Each transaction processed by Fraudies follows a strictly ordered, auditable pipeline:

| Step | Component | Action |
| :---: | :--- | :--- |
| **1** | **NestJS API** | Transaction received via authenticated endpoint or webhook ingestion |
| **2** | **PostgreSQL** | Record persisted immediately with `PENDING` status — ensures no transaction is lost prior to scoring |
| **3** | **FastAPI ML Engine** | Transaction metadata forwarded to the isolated scoring service |
| **4** | **ML Engine** | Feature extraction and model inference produces a continuous risk score (`0.0–1.0`), a categorical status (`APPROVED`, `PENDING`, `FLAGGED`), and human-readable risk factor annotations |
| **5** | **PostgreSQL** | NestJS API writes the final score, status, and an immutable `AuditLog` record — this entry cannot be modified after creation |
| **6** | **Next.js Dashboard** | Analyst interface reflects updated status and risk metrics in real time via WebSocket or long-polling |

### Risk Score Classification

| Score Range | Classification | Recommended Action |
| :--- | :--- | :--- |
| `0.00 – 0.39` | `APPROVED` | Proceed — low-risk signal |
| `0.40 – 0.69` | `PENDING` | Hold for analyst review |
| `0.70 – 1.00` | `FLAGGED` | Escalate — high-risk signal; block or refer to compliance |

---

## 4. Repository Structure

```
fintech-fraudies/
├── frontend/                   # Next.js analyst dashboard
│   ├── app/                    # Next.js App Router (pages, layouts, routes)
│   ├── components/             # Reusable React UI components
│   ├── lib/                    # API client, utility functions, and type definitions
│   └── public/                 # Static assets
│
├── backend/
│   ├── api/                    # NestJS REST API — core business logic, auth, orchestration
│   ├── ml-engine/              # FastAPI Python service — ML model hosting and inference
│   └── database/               # Prisma schema, generated client, and migration history
│
├── docker-compose.yml          # PostgreSQL and Redis container definitions
└── package.json                # Monorepo root scripts and workspace configuration
```

---

## 5. Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 + Tailwind CSS | Server-rendered React dashboard with real-time analyst views |
| **Animations** | GSAP | Micro-animation layer for metric transitions and alert rendering |
| **Backend API** | NestJS (TypeScript) | High-throughput REST API handling authentication, webhook ingestion, and ML orchestration |
| **ML Engine** | FastAPI + Scikit-Learn, NumPy, Pandas, Pydantic | Isolated Python inference service; accepts raw transaction features and returns scored risk assessments |
| **Database** | PostgreSQL 14+ via Prisma ORM | Relational store for transaction records, user tables, and immutable audit logs |
| **Cache Layer** | Redis | Sub-millisecond key-value store for deterministic velocity-based fraud rules |

---

## 6. Security & Compliance Posture

### Authentication & Authorization
- All API endpoints — with the exception of the public webhook ingestion path — require a valid **JSON Web Token (JWT)** issued upon successful credential authentication via `POST /auth/login`.
- Webhook ingestion requires a pre-shared **`X-Webhook-Secret`** header for source validation.

### Audit Logging
- Every transaction state transition produces an immutable entry in the `AuditLog` table.
- Audit records capture the originating user, timestamp, ML score, risk factors, and final status decision.
- The audit table is append-only by schema design; no update operations are permitted post-creation.

### Data Isolation
- The ML inference engine operates as a fully isolated service with no direct database access. It receives only the transaction metadata required for scoring and returns a structured response. This limits the blast radius of any ML-layer compromise.
- The Redis cache holds only velocity metrics and rule counters — no personally identifiable information (PII) or account data is stored in-memory.

### Network Security Recommendations (Production)
- All inter-service communication should be restricted to a private VPC subnet with no public egress from the ML engine or database tiers.
- TLS 1.2+ should be enforced on all external-facing endpoints.
- The `X-Webhook-Secret` value should be rotated on a schedule aligned with your institution's key management policy.

---

## 7. Deployment Prerequisites

Ensure the following runtime dependencies are available on all target hosts prior to initialization:

| Dependency | Minimum Version | Notes |
| :--- | :--- | :--- |
| Node.js | 18.x LTS | Required for NestJS API and Next.js frontend |
| Docker | 20.x | Required for containerized PostgreSQL and Redis |
| Docker Compose | 2.x | Required for multi-container orchestration |
| Python | 3.9+ | Required for FastAPI ML Engine |
| pip + venv | Latest | Python package and environment management |

---

## 8. Environment Configuration

Copy the provided template to generate a local environment configuration file. All service credentials and connection strings are controlled via this file.

```bash
cp .env.example .env
```

Default credentials in `.env.example` are pre-configured for the Docker Compose service definitions. Modify all credentials before deploying to any non-local environment.

---

## 9. Service Initialization

### Step 1 — Start Database Services

Launch PostgreSQL and Redis via Docker Compose:

```bash
npm run docker:up
```

### Step 2 — Install Dependencies

Install all Node.js dependencies across the monorepo:

```bash
npm run install:all
```

Or individually:

```bash
# Frontend
cd frontend && npm install

# Backend API
cd ../backend/api && npm install
```

### Step 3 — Database Provisioning

Generate the typed Prisma client and apply schema migrations to the local PostgreSQL instance:

```bash
npm run db:generate
npm run db:migrate
```

### Step 4 — ML Engine Setup

The ML Engine must run within an isolated Python virtual environment:

```bash
cd backend/ml-engine

# Create and activate virtual environment
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start ML Engine on port 8000
uvicorn app.main:app --reload --port 8000
```

### Step 5 — Start Application Services

Open separate terminal sessions for each service:

```bash
# Terminal 1 — Frontend dashboard
npm run dev:frontend

# Terminal 2 — Backend API
npm run dev:backend

# Terminal 3 — ML Engine (if not started in Step 4)
npm run dev:ml
```

### Service Endpoints

| Service | Local URL |
| :--- | :--- |
| Next.js Analyst Dashboard | `http://localhost:3000` |
| NestJS Orchestration API | `http://localhost:3001/api/v1` |
| FastAPI ML Engine | `http://localhost:8000` |

---

## 10. API Reference

### Orchestration API — `http://localhost:3001/api/v1`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | None | Register a new analyst or system user |
| `POST` | `/auth/login` | None | Authenticate and receive a signed JWT |
| `POST` | `/transactions` | JWT | Submit a transaction for scoring |
| `GET` | `/transactions` | JWT | Retrieve all transactions for the authenticated user |
| `GET` | `/transactions/stats` | JWT | Retrieve aggregate metrics — volume, approval rates, alert counts |
| `POST` | `/transactions/webhook` | `X-Webhook-Secret` | Ingest transactions from authorized upstream systems |

### ML Inference Engine — `http://localhost:8000`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check — confirms service availability |
| `POST` | `/predict` | Accept transaction features and return a scored risk assessment |

#### Sample Scoring Request / Response

```json
// POST /predict — Request
{
  "transactionId": "TX-1234",
  "userId": "usr_99",
  "amount": 6200.00,
  "type": "TRANSFER",
  "ipAddress": "192.168.1.1",
  "deviceId": "dev_hash_99"
}
```

```json
// POST /predict — Response
{
  "transactionId": "TX-1234",
  "riskScore": 0.81,
  "status": "FLAGGED",
  "factors": [
    "Large transaction amount ($6,200.00)",
    "High-risk transaction type (TRANSFER)"
  ]
}
```

---

## 11. Operational Scripts

### Development

| Command | Description |
| :--- | :--- |
| `npm run dev:frontend` | Start the Next.js dashboard in development mode |
| `npm run dev:backend` | Start the NestJS API in watch mode |
| `npm run dev:ml` | Start the FastAPI ML Engine with hot reload |

### Production Builds

| Command | Description |
| :--- | :--- |
| `npm run build:frontend` | Compile an optimized production build of the dashboard |
| `npm run build:backend` | Compile the NestJS API for production deployment |

### Database Management

| Command | Description |
| :--- | :--- |
| `npm run db:generate` | Regenerate the Prisma client after schema changes |
| `npm run db:migrate` | Apply pending schema migrations to the target database |
| `npm run db:studio` | Open Prisma Studio for database inspection |

### Infrastructure

| Command | Description |
| :--- | :--- |
| `npm run docker:up` | Start PostgreSQL and Redis containers |
| `npm run docker:down` | Stop and remove all database containers |

---

## 12. License & Proprietary Notice

This software, its source code, architecture, and associated documentation are **proprietary and confidential**. Distribution, reproduction, or use beyond the scope of an authorized enterprise evaluation agreement is strictly prohibited.

All rights reserved. © Fraudies. Unauthorized use may result in civil and criminal liability under applicable intellectual property law.

For licensing inquiries, integration scoping, or enterprise support agreements, contact your designated account representative.
