# Fraudies — Fraud Detection Dashboard

Fraudies is a full-stack fraud monitoring platform. A **FastAPI** backend generates a labelled dataset of 21,000 card/account transactions, benchmarks five machine-learning models, serves the best one with per-prediction explanations, and exposes portfolio analytics through a documented REST API. A **Next.js + Recharts** dashboard presents the analytics, an alert-review queue, the model evaluation and a live what-if simulator.

There is no database and no external service: the dataset lives in CSV, the model in a `joblib` file, and both are created automatically on first start.

> Educational portfolio project. The data is synthetic; it is not intended for production use in a regulated financial environment.

---

## Contents

1. [Features](#1-features)
2. [Architecture](#2-architecture)
3. [Quick start](#3-quick-start)
4. [Deployment: Vercel + Render](#4-deployment-vercel--render)
5. [Configuration](#5-configuration)
6. [Dataset](#6-dataset)
7. [Model selection](#7-model-selection)
8. [API reference](#8-api-reference)
9. [Testing](#9-testing)
10. [Project structure](#10-project-structure)
11. [Limitations](#11-limitations)

---

## 1. Features

| Page | What it does |
|---|---|
| **Overview** | KPIs (volume, fraud rate, fraud prevented/missed, open alerts) with 30-day deltas; daily/weekly volume and fraud cases; fraud rate by merchant category, channel and hour; risk-score distribution by class; highest-risk open alerts; most exposed customers. Filterable by date range, type, channel and category. |
| **Transactions** | Server-side search, filtering, sorting and pagination over every transaction. A detail drawer shows the TreeSHAP explanation, behavioural context and the customer's recent history. **Score new transaction** ingests a transaction in real time — velocity, spend ratio, account and device age are derived from the customer's history. |
| **Alerts** | Queue of FLAGGED (held by the model) and PENDING (manual-review band) transactions, sorted by risk, with Approve / Block decisions and a resolved history. |
| **Model** | Benchmark table for all five candidates, ROC curves, precision–recall curve, confusion matrix, feature attribution and the decision policy. One click re-runs the benchmark. |
| **Simulator** | Build a what-if transaction (presets for account takeover, card testing, stolen card, …) and watch the live model score and explain it. |
| **Data** | Active dataset summary and preview; upload your own labelled CSV/XLSX to retrain; reset to the sample data. |

Interactive API documentation is served at `/docs` (Swagger UI).

## 2. Architecture

```
+------------------------+        HTTPS / JSON        +-----------------------------+
|  Next.js dashboard     |  ----------------------->  |  FastAPI backend            |
|  (Vercel)              |        /api/*              |  (Render)                   |
|  TypeScript, Recharts  |                            |  data  ml  analytics  state |
+------------------------+                            +--------------+--------------+
                                                                     |
                                            +------------------------+-----------------------+
                                            |                                                |
                              backend/data/  (transactions.csv,               backend/models/model.joblib
                              uploads/, runtime/ reviews + live txns)         (model, metrics, OOF scores)
```

- **Startup.** `state.startup()` loads the active dataset (generating the 21,000-row sample if it is missing), fingerprints it, and loads the cached model if it was trained on exactly that data — otherwise it runs the full benchmark and caches the winner.
- **Development.** The Next.js dev server proxies `/api/*`, `/docs` and `/openapi.json` to `http://127.0.0.1:8000`, so no CORS setup is needed.
- **Production.** The browser calls the Render backend directly using `NEXT_PUBLIC_API_URL`, which is baked into the frontend at build time. The backend allows the Vercel origin through `FF_CORS_ORIGINS`.

| Layer | Technologies |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn, pandas, NumPy, scikit-learn, LightGBM, XGBoost, joblib |
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Space Grotesk + JetBrains Mono, Lenis, GSAP |
| Testing | pytest + FastAPI TestClient |
| Hosting | Vercel (frontend), Render (backend) |

## 3. Quick start

Prerequisites: Python 3.12+, Node.js 20+.

**Backend** (first start generates the data and trains the model, ~1–2 minutes; later starts take a second):

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (second terminal):

```bash
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000 for the dashboard and http://localhost:8000/docs for the API.

Useful scripts (from `backend/`):

```bash
python -m scripts.generate_dataset          # regenerate data/transactions.csv (21,000 rows)
python -m scripts.train --force             # re-run the benchmark and print the comparison
pytest                                      # API test suite
```

Docker alternative for the backend: `docker compose up --build` (data and model persist in named volumes).

## 4. Deployment: Vercel + Render

### Backend on Render

1. Push the repository to GitHub.
2. In Render: **New → Blueprint**, pick the repository. `render.yaml` defines the `fraudies-api` web service:
   - root directory `backend`
   - build: `pip install -r requirements.txt && python -m scripts.train` — the dataset is generated and the model trained **during the build**, so the server boots instantly
   - start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - health check: `/api/health`
3. Set `FF_CORS_ORIGINS` to your Vercel URL, e.g. `https://fraudies.vercel.app` (comma-separate several). To also allow preview deployments, set `FF_CORS_ORIGIN_REGEX`, e.g. `https://fraudies-.*\.vercel\.app`.
4. Note the service URL, e.g. `https://fraudies-api.onrender.com`.

(Without the blueprint: New → Web Service → Python, root directory `backend`, and the same build/start commands and environment variables.)

### Frontend on Vercel

1. **Add New → Project**, import the repository.
2. Set **Root Directory** to `frontend` (framework preset: Next.js).
3. Add the environment variable `NEXT_PUBLIC_API_URL` = your Render URL (no trailing slash).
4. Deploy. `NEXT_PUBLIC_API_URL` is compiled in at build time, so redeploy after changing it.

### Hosting notes

- **Cold starts.** Render's free instances sleep after inactivity; the first request can take ~30–60 s. The dashboard shows a "waking up" message and a Retry button.
- **Ephemeral disk.** On the free plan, analyst reviews, live-ingested transactions and uploads are lost on redeploy/restart; the sample dataset and model are rebuilt by the build step. For persistence, attach a Render disk and point `FF_DATA_DIR` / `FF_MODEL_DIR` at it.
- **Memory.** The free instance has 512 MB. Uploading very large datasets can exceed it — keep `FF_MAX_UPLOAD_MB` modest.

## 5. Configuration

All variables are optional for local development.

| Variable | Component | Default | Purpose |
|---|---|---|---|
| `FF_DATA_DIR` | Backend | `backend/data` | Sample dataset, `uploads/` and `runtime/` (reviews, live transactions) |
| `FF_MODEL_DIR` | Backend | `backend/models` | Persisted `model.joblib` |
| `FF_CORS_ORIGINS` | Backend | `http://localhost:3000,http://127.0.0.1:3000` | Allowed frontend origins (comma-separated) |
| `FF_CORS_ORIGIN_REGEX` | Backend | — | Optional origin regex, e.g. for Vercel previews |
| `FF_MAX_UPLOAD_MB` | Backend | `100` | Upload size limit |
| `FF_CV_FOLDS` | Backend | `5` | Cross-validation folds for the benchmark |
| `FF_TUNING_ITERATIONS` | Backend | `12` | Random-search iterations for the winning model (0 disables) |
| `FF_REVIEW_BACKLOG_DAYS` | Backend | `10` | Alerts older than this are pre-resolved when a dataset loads, so the queue holds recent work |
| `PORT` | Backend | `8000` | Set by Render |
| `API_URL` | Frontend (dev) | `http://127.0.0.1:8000` | Where the dev server proxies `/api` |
| `NEXT_PUBLIC_API_URL` | Frontend (build) | empty | Absolute backend URL in production |

See `.env.example`.

## 6. Dataset

`backend/scripts/generate_dataset.py` produces **21,000 transactions** over the 180 days to 14 Oct 2026 for 2,400 customers (seeded, fully reproducible), with a **3.2% fraud rate (672 rows)**.

Legitimate activity is sampled from per-customer profiles: home country, typical spend, devices, IPs and daily rhythm (lunchtime and evening peaks), plus realistic noise — travel abroad, new phones, VPN users, large one-off purchases.

Fraud is injected from five attack scenarios so the classes overlap the way they do in real portfolios:

| Scenario | Share | Signature |
|---|---|---|
| Account takeover | 33% | New device, VPN, foreign IP, failed logins, large transfers/cash advances |
| Stolen card, big ticket | 23% | Electronics / jewellery / gift cards / travel at 3–16× normal spend |
| Card testing | 22% | Bursts of tiny web purchases, high velocity — concentrated in one campaign window |
| Low-and-slow | 12% | Deliberately subtle, barely distinguishable from normal |
| Synthetic identity | 10% | Very young accounts moving money to crypto/wire |

Each row has 23 columns: identifiers, timestamp, amount, type, merchant category, channel, transaction/home country, IP, device, account and device age, new-device and VPN flags, IP reputation, 1 h / 24 h velocity, amount vs 30-day average, distance from home, failed logins, the `is_fraud` label and the generating scenario (analysis only — never a model input). The model uses 42 engineered features derived from these columns.

Uploads must follow the same schema (listed on the Data page and in `GET /api/dataset`).

## 7. Model selection

`backend/app/ml.py` benchmarks **Logistic Regression, Random Forest, HistGradientBoosting, XGBoost and LightGBM**:

1. **Out-of-time split.** The most recent 20% of transactions form the hold-out test set, because a fraud model always scores the future.
2. **Selection metric: PR-AUC** (average precision) from 5-fold stratified CV on the training window. At a ~3% base rate, ROC-AUC is above 0.97 for every candidate and hides the differences that matter; PR-AUC measures how clean the alert queue is at each catch rate.
3. **Tuning.** The winner gets a randomised hyper-parameter search, compared against its defaults on the same folds.
4. **Thresholds** come from out-of-fold predictions: *flag* at the max-F1 point, *manual review* at the lowest score that still reaches ~92% recall.
5. **Honest scores.** Every transaction shown in the dashboard is scored out-of-fold, never by a model that saw it in training. The final model is refit on all data for live scoring.
6. **Explanations.** Exact TreeSHAP contributions come from LightGBM/XGBoost natively (`pred_contrib`) and are grouped into readable risk factors.

Results on the bundled dataset:

| Model | CV PR-AUC | Test PR-AUC | Test ROC-AUC | Precision | Recall | F1 |
|---|---|---|---|---|---|---|
| **LightGBM (selected)** | **0.950** | 0.901 | 0.989 | 0.837 | 0.819 | 0.828 |
| XGBoost | 0.948 | 0.898 | 0.989 | 0.869 | 0.777 | 0.820 |
| HistGradientBoosting | 0.940 | 0.903 | 0.991 | 0.882 | 0.798 | 0.838 |
| Random Forest | 0.925 | 0.868 | 0.977 | 0.876 | 0.755 | 0.811 |
| Logistic Regression | 0.920 | 0.848 | 0.984 | 0.845 | 0.755 | 0.798 |

The gradient-boosted trees are close; LightGBM wins on the pre-registered selection metric. Over all 21,000 rows (out-of-fold) the policy flags 604 transactions, 572 of them fraud (precision 94.7%, recall 85%).

## 8. API reference

The authoritative reference is generated from the code at **`/docs`** (Swagger UI) and `/openapi.json`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health probe (used by Render) |
| GET | `/api/dataset` | Active dataset summary, schema and preview |
| POST | `/api/dataset/upload` | Upload a labelled CSV/XLSX and retrain |
| POST | `/api/dataset/reset` | Return to the sample dataset |
| POST | `/api/dataset/reset-activity` | Drop live transactions and analyst reviews |
| GET | `/api/filters` | Values for the filter controls |
| GET | `/api/overview` | KPIs, 30-day comparison, decision mix, detection quality |
| GET | `/api/analytics/timeseries` | Volume and fraud per day/week/month |
| GET | `/api/analytics/breakdown` | By type, channel, category or country |
| GET | `/api/analytics/hourly` | Fraud rate by hour |
| GET | `/api/analytics/risk-distribution` | Score histogram by class |
| GET | `/api/analytics/top-customers` | Customers with the largest fraud exposure |
| GET | `/api/transactions` | Search / filter / sort / paginate |
| GET | `/api/transactions/{id}` | Detail, SHAP contributions, customer history |
| POST | `/api/transactions` | Ingest and score a transaction in real time |
| POST | `/api/transactions/{id}/review` | Analyst decision: `approve` or `block` |
| GET | `/api/alerts` | Open or resolved alert queue |
| GET | `/api/model` | Selected model, benchmark, curves, importances |
| POST | `/api/model/score` | What-if scoring (nothing stored) |
| POST | `/api/model/retrain` | Re-run the benchmark on the active dataset |

Analytics endpoints accept `start`, `end`, `type`, `channel`, `category` and `country` filters (repeat a parameter for several values).

## 9. Testing

```bash
cd backend
pytest
```

The suite runs against an isolated temporary data directory with a smaller generated dataset, covering health, dataset/filters, the model benchmark, analytics, transaction search/sort, explanations, real-time ingestion and review, the simulator, and upload validation.

## 10. Project structure

```
.
|-- backend/
|   |-- app/
|   |   |-- main.py            Routes (FastAPI)
|   |   |-- config.py          Environment-driven configuration
|   |   |-- data.py            Dataset loading, validation, filters
|   |   |-- features.py        Feature engineering (shared by training and serving)
|   |   |-- ml.py              Benchmark, selection, training, inference
|   |   |-- explainer.py       TreeSHAP contributions -> risk factors
|   |   |-- analytics.py       Dashboard aggregations
|   |   |-- state.py           Startup, model cache, reviews, live ingestion
|   |   |-- schemas.py         Request bodies
|   |   `-- constants.py       Shared vocabularies and geography
|   |-- scripts/
|   |   |-- generate_dataset.py
|   |   `-- train.py
|   |-- tests/test_api.py
|   |-- data/                  Generated dataset, uploads, runtime state (git-ignored)
|   |-- models/                Persisted model (git-ignored)
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- app/                   Landing page and /dashboard/* pages
|   |-- components/dashboard/  Charts, drawer, filters, UI primitives
|   |-- lib/api.ts             Typed API client
|   `-- next.config.mjs        Dev proxy to the backend
|-- render.yaml                Render blueprint (backend)
|-- docker-compose.yml         Backend container for local use
`-- .env.example
```

Generated files (`backend/data/*.csv`, `backend/data/uploads/`, `backend/data/runtime/`, `backend/models/`) are git-ignored; they are recreated by the backend.

## 11. Limitations

- The dataset is synthetic. Real fraud data is noisier, labels arrive late (chargebacks), and patterns drift — evaluate on your own data before relying on any score.
- Behavioural features for live transactions are derived from the in-memory history; on a multi-instance deployment each instance would need shared storage.
- There is no authentication: the API and dashboard are a public demo. Put both behind an identity provider before using real data.
