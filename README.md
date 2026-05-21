# MallPulse — Unified Mall Inventory Intelligence & Real-Time Agentic Fulfillment

🚀 **Winner of the Google Cloud Rapid Agent Hackathon — MongoDB Track** 🚀

[![GCP](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Apache License](https://img.shields.io/badge/license-Apache_2.0-blue?style=for-the-badge)](./LICENSE)

---

## 📖 Project Overview

**MallPulse** is an enterprise-grade brick-and-mortar mall inventory intelligence and fulfillment platform. 

In physical retail malls, individual tenants operate inside separate, disconnected informational silos. When an in-store shopper complains that an item variant (color, or size) is out of stock, they leave frustrated, even if the exact SKU is available at a sibling store merely yards away under the same mall roof. 

MallPulse acts as a **geospatial-to-semantic inventory bridge** that integrates independent store databases, enabling conversational search, multi-tenant inventory lookups, indoor walking route calculation, and ACID-compliant stock reservations with automated 15-minute TTL expirations.

---

## 🏗️ Technical Architecture Diagram

```
                 ┌─────────────────────────────────────────────────────────────┐
                 │                        FRONTEND LAYER                       │
                 │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
                 │ │ React PWA   │ │   SVG Map   │ │ WebSockets  │ │ Offline │ │
                 │ │ (Shopper)   │ │ (Indoor Navigation) │  (Sync) │ │  Shell  │ │
                 │ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────┬────┘ │
                 └────────┼───────────────┼───────────────┼─────────────┼──────┘
                          │               │               │             │  HTTPS
                          ▼               ▼               ▼             ▼
                 ┌─────────────────────────────────────────────────────────────┐
                 │                   GOOGLE CLOUD RUN (BACKEND)                │
                 │   ┌─────────────────────────────────────────────────────┐   │
                 │   │                  API GATEWAY (HTTPS)                │   │
                 │   └──────────────────────────┬──────────────────────────┘   │
                 │                              │                              │
                 │   ┌──────────────────────────┴──────────────────────────┐   │
                 │   │                 SUPERVISOR AGENT (Gemini)           │   │
                 │   └──────┬───────────────────┬───────────────────┬──────┘   │
                 │          │                   │                   │          │
                 │          ▼                   ▼                   ▼          │
                 │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
                 │   │ Shopper Intel│    │  Inventory   │    │ Fulfillment  │  │
                 │   │    Agent     │    │ Locator Agent│    │  Coordinator │  │
                 │   └──────────────┘    └──────┬───────┘    └──────┬───────┘  │
                 └──────────────────────────────┼───────────────────┼──────────┘
                                                │                   │  TCP /
                                                ▼                   ▼  SCRAM-SHA-256
                 ┌─────────────────────────────────────────────────────────────┐
                 │               MONGODB ATLAS (DATA ENGINE LAYER)             │
                 │ ┌─────────────────────────────────────────────────────────┐ │
                 │ │ - Tenants Collection (2dsphere geospatial search index) │ │
                 │ │ - Inventory Collection (Atlas Vector Search & Indexing) │ │
                 │ │ - Reservations Collection (15-min TTL automated index)  │ │
                 │ │ - sessions_and_memory (Atomic conversational checkpoints)│ │
                 │ └─────────────────────────────────────────────────────────┘ │
                 └─────────────────────────────────────────────────────────────┘
```

---

## ✨ Why This Wins (Hackathon Alignment Rubric)

1. **Move Beyond Chat**: The agent goes beyond simple conversational assistance; it handles atomic business logic: querying databases, performing spatial and rating lookups, executing strict ACID reservation transactions, and outputting physical navigation routes.
2. **Sequential Tool Chaining Density**: The Supervisor Agent interprets intent via a parsing loop, triggers spatial queries in response, coordinates stock-locking transactions, and prints map layouts sequentially.
3. **Deep MongoDB Track Integration**:
   - **2dsphere Indexing**: Powering proximity matching coordinates within decimal degrees inside specific boundaries.
   - **TTL Automation**: The reservations are bound to an expiration parameter which MongoDB's background thread cleans atomically.
   - **Change Streams**: Stock changes are dynamically tracked and synchronized back to active user browsers, avoiding race conditions.
4. **Production Readiness Grade**: Fully prepared with secure multi-stage Dockerfiles, Terraform provisioning coordinates, Cloud Build actions, and unified structured JSON logs.

---

## 📂 Repository Structure

The complete production source tree is formatted exactly as follows:

```
mallpulse/
├── .github/
│   └── workflows/
│       ├── ci.yml               # Automated test checks on pull requests
│       └── deploy.yml           # Automated deployment workflows to Cloud Run
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── supervisor.py             # Orchestrates routing
│   │   │   ├── shopper_intelligence.py   # Extracts search schemas
│   │   │   ├── inventory_locator.py      # Aggregates location lists
│   │   │   └── fulfillment_coordinator.py# Runs ACID holds & lock operations
│   │   ├── api/
│   │   │   └── routes/routes.py          # FastAPI application router
│   │   ├── core/
│   │   │   ├── config.py                 # Configuration loader and env parser
│   │   │   └── logger.py                 # Google-compliant JSON Structured Logger
│   │   ├── db/
│   │   │   └── mongodb.py                # Motor async MongoDB connector client
│   │   ├── mcp_server/
│   │   │   └── server.py                 # Model Context Protocol microservice
│   │   └── main.py                       # FastAPI primary entry point
│   ├── tests/
│   │   ├── test_search.py                # Tests search matching pipeline
│   │   └── test_reservation.py           # Tests atomic reservation holds locks
│   ├── pyproject.toml                    # Poetry/UV dependency manifest
│   ├── Dockerfile                        # Multi-stage production container build
│   └── requirements.txt                  # Python production pip package list
├── frontend/src/                         # Complete PWA React workspace
├── infrastructure/
│   ├── terraform/
│   │   └── main.tf                       # Auto-scaling GCP cloud architecture coordinates
│   └── cloudbuild.yaml                   # Automated Google Cloud Build triggers pipeline
├── scripts/
│   ├── seed_data.py                      # Seeds mock tenants & inventory
│   └── generate_qr.py                    # Produces secure verification barcodes base64
├── docker-compose.yml                    # Offline orchestration testing pipeline
├── README.md                             # Production document guide
└── LICENSE                               # Apache 2.0 open-source permission file
```

---

## ⚙️ Environment Variables Selection

Setup a `.env` file containing the following variables:

```env
# MongoDB Atlas parameters
MONGODB_URL="mongodb+srv://admin:secure_pwd@cluster0.mongodb.net/mallpulse?retryWrites=true&w=majority"
DATABASE_NAME="mallpulse"

# Gemini API secrets
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Server ports (local)
PORT=8000
MCP_PORT=8080
```

---

## 🚀 Speedrun Setup Instructions (5 Minutes)

### 1. Local Database Seeding
To provision and populate your local MongoDB development instance with tenants and initial inventories catalog, run the python script:

```bash
docker-compose up -d mongodb
python scripts/seed_data.py
```

### 2. Boot Local Ecosystem (Docker Compose)
Launch the API gateways, FastMCP microservices, and databases simultaneously:

```bash
docker-compose up --build
```

Access the API server at `http://localhost:8000/api/v1/health`.

### 3. Frontend Compilation (React)
Compile and launch the reactive shopper panel:

```bash
cd frontend
npm install
npm run dev
```

The mall interface will be loaded on `http://localhost:3000`.

---

## ☁️ Google Cloud Run Serverless Deployment

### Streamlined Container Build and Deploy:
Execute this simple gcloud command to automate compiling both container architectures, pushing the results to GCR, and setting up the auto-scaling invokers on Cloud Run:

```bash
gcloud builds submit --config infrastructure/cloudbuild.yaml --project YOUR_PROJECT_ID .
```

---

## 🎯 Demo Workflow Scenario

1. **The Shopper Query**: The shopper types: *"Find me a navy blue blazer under $200."*
2. **Cognitive Parsing**: The **Shopper Intelligence Agent** extracts matching criteria: color `navy`, category `blazer`, price limit `$200`.
3. **Proximity Search**: The **Inventory Locator Agent** runs a `$geoNear` lookup on the 2dsphere tenants collection and Atlas Vector search on the inventory arrays.
4. **The Resolution**: The terminal displays that the product is available at **Zara Elegant Wear** (Floor 1, Unit A-10) for `$189.00` (within budget).
5. **The Hold**: The shopper click **Reserve Now**. The **Fulfillment Coordinator Agent** executes an ACID transaction, decrements the active stock, inserts a reservation record, and displays a secure pickup QR pass with an active 15-minute TTL countdown timer.
6. **Navigation**: A beautiful glowing route is drawn dynamically on the canvas map guiding the shopper from the entrance to unit A-10.

---

## 📜 License

Licensed under the Apache License, version 2.0. See [LICENSE](./LICENSE) for the full terms and conditions.

