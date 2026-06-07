# 💰 Personal Finance Tracker

A secure, full-stack **Personal Finance Tracker** built with a 3-tier Docker architecture. Track income and expenses, set monthly budgets, visualize spending trends, and monitor application performance in real time.

---

## 🧱 Architecture

```
User (Browser)
     │
     ▼ port 8080
┌─────────────────────┐     frontend-network
│  Frontend (Nginx)   │ ◄──────────────────────┐
│  React + Vite SPA   │                        │
└─────────────────────┘                        │
     │ /api/* proxy                            │
     ▼                                         │
┌─────────────────────┐  backend-network   monitoring-network
│  Backend (FastAPI)  │ ◄────────────────  ◄─────────────────┐
│  Python + Uvicorn   │                                      │
└─────────────────────┘                                      │
     │ motor (async)                                         │
     ▼                                          ┌────────────┴────────────┐
┌─────────────────────┐                         │  Prometheus  │  Grafana │
│  Database (MongoDB) │                         └─────────────────────────┘
│  No exposed ports   │
└─────────────────────┘
```

### Docker Networks

| Network             | Connected Containers       | Purpose                        |
|---------------------|----------------------------|--------------------------------|
| frontend-network    | ui, api                    | Public access & API routing    |
| backend-network     | api, db                    | Secure DB communication        |
| monitoring-network  | api, prometheus, grafana   | Metrics collection & dashboards|

---

## 🚀 Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Frontend   | React 18, Vite, React Router, Recharts |
| Web Server | Nginx Alpine (reverse proxy)           |
| Backend    | Python FastAPI, Uvicorn                |
| Database   | MongoDB 7 (Motor async driver)         |
| Monitoring | Prometheus, Grafana                    |
| Platform   | Docker, Docker Bridge Networks         |

---

## ✨ Features

- **Dashboard** — Summary cards (total income, expenses, savings), monthly spending bar chart, category pie chart, recent transactions table
- **Transactions** — Add income/expense with title, amount, category, date, and note; filter by type and category; delete entries
- **Budgets** — Set monthly spending limits per category, color-coded progress bars (green → orange → red), over-budget alerts
- **REST API** — Full Swagger/OpenAPI docs auto-generated at `/api/docs`
- **Monitoring** — Prometheus scrapes FastAPI metrics every 5s, Grafana dashboards show request rates and response times

---

## 📁 Project Structure

```
personal-finance-tracker/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── Dockerfile          # Multi-stage: Node build → Nginx serve
│   ├── nginx.conf
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Transactions.jsx
│           └── Budgets.jsx
├── prometheus/
│   └── prometheus.yml
└── README.md
```

---

## 🛠️ Setup & Installation

### Prerequisites

- Docker installed and running
- Git

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/personal-finance-tracker.git
cd personal-finance-tracker
```

### Step 2 — Create Docker networks

```bash
docker network create frontend-network
docker network create backend-network
docker network create monitoring-network
```

### Step 3 — Start the database

```bash
docker volume create finance-mongo-data

docker run -d \
  --name db \
  --network backend-network \
  -v finance-mongo-data:/data/db \
  mongo:7
```

### Step 4 — Build and run the backend

```bash
cd backend
docker build -t finance-backend .

docker run -d \
  --name api \
  --network backend-network \
  finance-backend

docker network connect frontend-network api
docker network connect monitoring-network api
```

Verify it is running:

```bash
docker logs api
# Expected: Application startup complete.
```

### Step 5 — Build and run the frontend

> ⚠️ Only run this **after** the `api` container is confirmed running. Nginx resolves the `api` hostname at startup.

```bash
cd ../frontend
docker build -t finance-frontend .

docker run -d \
  --name ui \
  --network frontend-network \
  -p 8080:80 \
  finance-frontend
```

### Step 6 — Start monitoring stack

```bash
cd ..

# Linux / macOS
docker run -d \
  --name prometheus \
  --network monitoring-network \
  -p 9090:9090 \
  -v $(pwd)/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

# Windows PowerShell
docker run -d `
  --name prometheus `
  --network monitoring-network `
  -p 9090:9090 `
  -v ${PWD}/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml `
  prom/prometheus

docker run -d \
  --name grafana \
  --network monitoring-network \
  -p 3000:3000 \
  grafana/grafana
```

### Step 7 — Verify all containers are running

```bash
docker ps
# Should show: db, api, ui, prometheus, grafana — all STATUS: Up
```

---

## 🌐 Access URLs

| Service            | URL                           | Credentials   |
|--------------------|-------------------------------|---------------|
| Finance App        | http://localhost:8080         | None required |
| API Swagger Docs   | http://localhost:8080/api/docs| None required |
| Prometheus         | http://localhost:9090         | None required |
| Grafana            | http://localhost:3000         | admin / admin |

---

## 📊 Grafana Setup

1. Open http://localhost:3000 and login with `admin / admin`
2. Go to **Connections → Data Sources → Add data source → Prometheus**
3. Set URL to `http://prometheus:9090` → click **Save & Test**
4. Go to **Dashboards → New → Import** → enter ID `17175` → select Prometheus → Import

---

## 🔒 Security Design

- Database has **no exposed ports** — accessible only within `backend-network`
- Backend API is **not publicly accessible** — internal only
- Only **port 8080** (Nginx) is exposed to the host machine
- Container DNS handles service discovery (`http://api:8000`, `http://db:27017`)
- Inter-container communication restricted by Docker network membership

---

## 🧹 Cleanup

```bash
# Stop and remove all containers
docker rm -f ui api db prometheus grafana

# Remove networks
docker network rm frontend-network backend-network monitoring-network

# Remove volume (WARNING: this deletes all stored data)
docker volume rm finance-mongo-data

# Remove images
docker rmi finance-frontend finance-backend
```

---

## 📡 API Endpoints

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | /transactions         | List all transactions (filterable)       |
| POST   | /transactions         | Create a new transaction                 |
| DELETE | /transactions/{id}    | Delete a transaction                     |
| GET    | /summary              | Dashboard totals + chart data            |
| GET    | /budgets              | List budgets with spent amounts          |
| POST   | /budgets              | Set or update a monthly budget           |
| DELETE | /budgets/{id}         | Delete a budget                          |
| GET    | /health               | Health check                             |
| GET    | /metrics              | Prometheus metrics                       |

---

## 🐛 Troubleshooting

**Backend exits immediately**
```bash
docker logs api
# If you see motor/pymongo import errors, check requirements.txt versions:
# motor==3.3.2 and pymongo==4.6.3 must be pinned together
```

**Frontend can't reach api (host not found)**
```bash
# Make sure api container is running BEFORE starting ui
docker ps | grep api
# Then rebuild ui after api is confirmed up
```

**Port 8080 not accessible on Windows**
```bash
# Try 127.0.0.1:8080 instead of localhost:8080
# Or check Windows Firewall settings
```

**Prometheus volume mount fails on Windows PowerShell**
```powershell
# Use ${PWD} instead of $(pwd)
-v ${PWD}/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
```

---

## 📄 License

MIT License — feel free to use this project for learning and portfolio purposes.

---

*Personal Finance Tracker — Dockerized Full-Stack Project*
