# NetGuard

Network Security Management, Alert Triage & Incident Response Platform.

NetGuard is a web-based security operations console for Snort telemetry. It ingests IDS events, correlates them into actionable alerts and incidents, and gives operators a focused interface for investigation, triage, and incident response.

> [!IMPORTANT]
> This project is designed for a local or lab security operations workflow. It is not a replacement for a full enterprise SIEM stack, but it is a practical platform for understanding alert handling, incident workflows, and telemetry exploration.

## Overview

NetGuard combines a TypeScript-based Express backend with a React frontend to provide a complete SOC-style workflow:

- Snort event ingestion via authenticated API or ingest key
- Security event exploration with filtering and raw payload inspection
- Alert creation and lifecycle management
- Incident grouping and ownership tracking
- Investigation timeline with notes, actions, and containment records
- Live updates over WebSockets
- Analytics summaries for MTTD and operational trends
- Swagger/OpenAPI documentation

## Key capabilities

- Event ingestion API for IDS telemetry
- Role-based access control for admin, analyst, and viewer users
- Persistent local database support via PGlite, with PostgreSQL compatibility for production deployment
- Dashboard views for overview, alerts, incidents, and analytics
- Real-time event updates and reconnect-safe client synchronization
- API-first design with schema validation using Zod

## Architecture

NetGuard follows a simple layered design:

- Frontend: React 19 + Vite + TypeScript
- Backend: Express + TypeScript
- Data layer: Drizzle ORM + PostgreSQL / PGlite
- Auth: JWT + bcrypt
- Real-time: WebSocket gateway
- Docs: Swagger UI / OpenAPI

```text
React SPA
  └─ NetGuard UI
       │
       v
Express API
  ├─ Authentication
  ├─ Security events
  ├─ Alerts
  ├─ Incidents
  └─ Analytics
       │
       v
Database (PGlite or PostgreSQL)
```

## Repository structure

```text
.
├── docs/                           # Project documentation and design notes
├── src/
│   ├── components/                 # React UI and feature modules
│   ├── context/                    # App state providers
│   ├── db/                         # Drizzle schema and initialization
│   ├── server/                    # API controllers, services, and middleware
│   ├── types/                     # Shared TypeScript types
│   ├── App.tsx                    # Application entry and tab routing
│   ├── index.css                  # Global styles
│   └── main.tsx                   # React bootstrap
├── drizzle.config.ts              # Drizzle configuration
├── index.html                     # Vite HTML entry
├── metadata.json                  # Project metadata
├── package.json                   # Scripts and package dependencies
├── server.ts                      # Express server start-up and routing
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite configuration
├── bun.lock                       # Bun lockfile
├── .gitignore                    # Git ignores
├── MASTER.md                      # Architecture and operations specification
└── README.md                      # Project overview and setup guide
```

## Quick start

### Prerequisites

- Node.js 22+
- npm or bun
- A modern browser

### Install dependencies

```bash
npm install
# or
bun install
```

### Start the application in development mode

```bash
npm run dev
# or
bun run dev
```

The app starts the Express server and serves the Vite frontend in development mode.

### Production build

```bash
npm run build
npm run start
```

## Configuration

NetGuard supports a local embedded database by default, which makes it easy to run out of the box. If you want to connect to PostgreSQL instead, set environment variables before starting the app.

### Default local setup

No environment variables are required to run locally. The application automatically uses PGlite and stores its persistent data under `.data/netguard_pg`.

## Authentication and default access

On first startup, NetGuard bootstraps an admin user automatically if none exists:

- Email: `lead_admin@netguard.local`
- Password: `SecurePassword123!`

This is intended for local demos and lab environments. Change the password immediately in a real or shared environment.

## Ingesting Snort events

The ingest endpoint accepts a single event or a batch of events:

```http
POST /api/events/ingest
```

Example body:

```json
{
  "timestamp": "2026-11-01T12:00:00.000Z",
  "generatorId": 1,
  "signatureId": 2001219,
  "signatureRevision": 4,
  "signatureMessage": "ET SCAN Potential SSH Scan OUTBOUND",
  "classification": "Attempted Information Leak",
  "priority": 1,
  "protocol": "TCP",
  "sourceIp": "192.168.1.105",
  "sourcePort": 49152,
  "destinationIp": "10.0.0.1",
  "destinationPort": 22,
  "rawPayload": "SSH-2.0-OpenSSH_8.2p1"
}
```

You can authenticate with either:

- a valid admin/analyst JWT in the `Authorization: Bearer ...` header, or
- the `X-Ingest-Key` header matching `INGEST_API_KEY`

## API and documentation

NetGuard exposes the main API surface under `/api` and includes Swagger documentation at:

- `http://localhost:3000/api/docs`

The following major routes are included:

- `/api/auth`
- `/api/users`
- `/api/events`
- `/api/alerts`
- `/api/incidents`
- `/api/analytics`
- `/api/docs`

## Security notes

- JWT signing uses a configurable secret.
- Bcrypt is used for password hashing.
- Ingest authorization supports dedicated API keys for automation.
- Always rotate secrets and use environment-based configuration in non-local deployments.

