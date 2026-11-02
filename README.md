<p align="center">
  <img src="./assets/readme/logo.svg" width="80%" alt="NetGuard, a local-first network security console for Snort telemetry, alert triage and incident response" />
</p>

<h1 style="font-weight:bold">Net Guard</h1>

<p align="center"><a  href=#>Deployed Link</a></p>
<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="NetGuard, a local-first network security console for Snort telemetry, alert triage and incident response" />
</p>

<p align="center">
  <strong>Network Security Management · Alert Triage · Incident Response</strong>
</p>

NetGuard is a web-based security operations console for working with **Snort IDS telemetry**. It receives security events, helps operators review and manage alerts, and brings incident ownership, investigation notes, response actions and operational analytics into one interface.

> [!IMPORTANT]
> NetGuard is designed for local and lab security-operations workflows. It is a practical environment for exploring IDS telemetry and incident handling, not a replacement for an enterprise SIEM platform.

## What you can do

- **Ingest IDS telemetry** through an authenticated API or dedicated ingest key.
- **Explore security events** with filtering and raw-payload inspection.
- **Triage alerts** and manage their lifecycle.
- **Coordinate incidents** with grouping, ownership and investigation timelines.
- **Record response work** through notes, actions and containment records.
- **Follow activity live** with WebSocket updates and reconnect-safe client synchronization.
- **Review operations** with dashboard summaries and MTTD-oriented analytics.

## How it fits together

<p align="center">
  <img src="./assets/readme/architecture.svg" width="100%" alt="NetGuard system map: Snort sends IDS telemetry to the Express API, which coordinates authentication, events, alerts, incidents and analytics, persists data in PGlite or PostgreSQL, and serves the React operator console over REST and WebSockets" />
</p>

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React 19, Vite, TypeScript | Operator dashboard and investigation views |
| API | Express, TypeScript | Authentication and security-workflow coordination |
| Data | Drizzle ORM, PGlite / PostgreSQL | Persistent application data |
| Authentication | JWT, bcrypt | Session tokens and password hashing |
| Live updates | WebSockets | Real-time event and workflow updates |
| API reference | Swagger UI / OpenAPI | Endpoint documentation |

## Get started

### Requirements

- Node.js 22 or later
- npm or Bun
- A modern browser

### Install and run

```bash
# Install dependencies
npm install
# or
bun install

# Start the application in development mode
npm run dev
# or
bun run dev
```

The development command starts the Express server and serves the Vite frontend. The API documentation is available at `http://localhost:3000/api/docs` when the application is running on its default local port.

### Build for production

```bash
npm run build
npm run start
```

## Local data and configuration

NetGuard uses **PGlite** by default, so a local run does not require a separate PostgreSQL server or environment variables. Persistent local data is stored under:

```text
.data/netguard_pg
```

For a PostgreSQL-backed deployment, configure the database connection through environment variables before starting the application. The exact deployment values depend on your environment.

## First-run administrator

On first startup, NetGuard creates an administrator account if one does not already exist:

| Field | Local demo value |
| --- | --- |
| Email | `lead_admin@netguard.local` |
| Password | `SecurePassword123!` |


> [!WARNING]
> These are documented local-demo credentials. Change the password immediately, rotate any exposed secrets, and do not use the default credentials in a shared or production environment.

## Send Snort events

The ingestion endpoint accepts a single event or a batch of events:

```http
POST /api/events/ingest
```

A single-event request body looks like this:

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

Authenticate the request using either:

- `Authorization: Bearer <token>` with a valid admin or analyst JWT, or
- `X-Ingest-Key: <key>` matching the configured `INGEST_API_KEY`.

## API surface

The main API routes are grouped under `/api`:

| Route | Purpose |
| --- | --- |
| `/api/auth` | Authentication |
| `/api/users` | User management |
| `/api/events` | Security event ingestion and exploration |
| `/api/alerts` | Alert lifecycle management |
| `/api/incidents` | Incident coordination and investigation |
| `/api/analytics` | Operational analytics |
| `/api/docs` | Swagger / OpenAPI documentation |

## Repository layout

```text
.
├── assets/
│   └── readme/              # README SVG artwork
├── docs/                    # Project documentation and design notes
├── src/
│   ├── components/          # React UI and feature modules
│   ├── context/             # App state providers
│   ├── db/                   # Drizzle schema and initialization
│   ├── server/               # API controllers, services and middleware
│   ├── types/                # Shared TypeScript types
│   ├── App.tsx               # Application entry and tab routing
│   ├── index.css             # Global styles
│   └── main.tsx              # React bootstrap
├── drizzle.config.ts
├── index.html
├── metadata.json
├── package.json
├── server.ts                 # Express server startup and routing
├── tsconfig.json
├── vite.config.ts
├── bun.lock
└── MASTER.md                 # Architecture and operations specification
```

## Security notes

- JWT signing uses a configurable secret.
- Passwords are hashed with bcrypt.
- Automated ingestion can use a dedicated API key.
- Rotate default credentials and secrets before exposing the application beyond a local lab.
- Use environment-based configuration for non-local deployments.

---

<p align="center">
  <sub>Built for practical IDS telemetry exploration and controlled incident workflows.</sub>
</p>
