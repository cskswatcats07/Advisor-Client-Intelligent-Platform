# ACIP — Advisor Client Intelligence Platform

**Compliance-first, consent-based financial advisory operating system for Canadian independent financial professionals.**

Version: 1.0 | Canada-only data residency

---

## Product Vision

ACIP provides centralized client financial visibility, consent-driven data aggregation (FDX-aligned), advisory workflow support, compliance audit infrastructure, and AI-assisted draft workflows with regulatory safeguards.

The platform does **NOT**: execute trades, custody assets, provide autonomous financial advice, or represent itself as a registered dealer or insurer.

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, LowDB (prototype), Zod validation |
| Security | AES-256-GCM PII encryption, JWS (JOSE), SHA-256 hashing |
| Auth | Header-based RBAC (JWT-scoped in production roadmap) |

### Production Roadmap

- PostgreSQL (primary database) with row-level security
- Redis (session + token store)
- OpenTelemetry observability
- WAF + rate limiting (rate limiter currently in-memory)
- Blue/Green deployments, CI/CD pipeline

---

## Regulatory & Legal Framework

- **PIPEDA** (Privacy)
- **FINTRAC** (if AML features enabled)
- **CIRO** (if used by investment dealers)
- Provincial insurance and mortgage regulators

All outputs are illustrative and require advisor attestation before client delivery.

---

## Core Modules

### 4.1 Multi-Tenant Organization Model

Each organization contains: Owner, Advisors, Compliance users, Clients, System Admins.
Isolation enforced at database row level, header-scoped org claims, and audit log segmentation.

### 4.2 Client CRM & Financial Profile

- **Household management** — group clients into households
- **Asset classification** — cash, investments, real estate, vehicle, other
- **Liability categorization** — secured vs. unsecured with amortization
- **Net worth computation engine** — `POST /api/clients/:clientId/net-worth`
- **Risk profile storage** — versioned snapshots: `POST /api/clients/:clientId/risk-profiles`
- **KYC versioning** — immutable versions: `POST /api/clients/:clientId/kyc`
- **Institution relationships** — Canadian bank catalog with product mapping

### 4.3 Consent Engine (FDX-Aligned)

Consent objects include: consentId, orgId, clientId, advisorId, institutionId, scopes, duration, status.

**Client portal features:**
- Active connections list — `GET /api/fdx/v5/consents/client/:clientId`
- Scope transparency
- Expiry display
- One-click revocation — `DELETE /api/fdx/v5/consents/:consentId`
- Consent history log

### 4.4 FDX Data Aggregation Layer

- OAuth 2.0 authorization code flow
- Token encryption at rest
- Interaction ID tracking (`x-fapi-interaction-id`)
- JWS-signed responses (`x-jws-signature`)
- JWKS endpoint — `GET /api/fdx/v5/jwks`

### 4.5 Planning Engine

- Plan creation with immutable versioning
- Scenario modeling (what-if analysis)
- Canadian tax-aware projection engine
- Change diff comparison via version history
- Assumption registry

### 4.6 Compliance Module

- **Recommendation rationale required** — attestation enforced at API level
- **Suitability snapshot** — risk profile, investment horizon, net worth, and KYC version captured at recommendation time
- **Immutable recommendation records** — stored in audit trail
- **2-eye / 4-eye override enforcement** — via control tickets
- **Audit trail generation** — every action logged with actor hash and role

### 4.7 AI Copilot (Draft-Only)

Safeguards:
- All output includes **hallucination disclaimer**
- Prompt and output are **immutably logged**
- Advisor must **edit before attestation** is permitted
- **No direct client publishing** — `publishedToClient` flag enforced
- AI drafts retained for 7 years per data retention policy

### 4.8 Insights Engine (Internal Only)

Replaces "Personalized Offers" with compliance-safe internal insights:
- **Asset allocation drift detection** — alerts when >60% concentration
- **Risk mismatch alerts** — profile vs. portfolio comparison
- **Liquidity warnings** — emergency fund < 3 months
- **Conflict-of-interest flags** — undisclosed conflicts

Not client-facing unless advisor-approved via `POST /api/insights/:alertId/approve-for-client`.

### 4.9 Notification Engine

Supports: consent expiry alerts, 2FA challenges, compliance pending alerts, suspicious login detection, token failure alerts.

---

## Security & Privacy Controls

### Encryption
- AES-256-GCM for PII at rest
- SHA-256 with pepper for sensitive identifiers
- JWS response signing for FDX endpoints

### Audit Logs (Immutable)
Each event includes: eventId, orgId, actorHash, actorRole, clientId, action, timestamp, interactionId (if FDX), retentionExpiresAt.

### Rate Limiting
In-memory sliding window: 120 requests/minute per user. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## RBAC Permission Matrix

| Permission | Owner | Advisor | Associate | Compliance | Client | SysAdmin |
|---|---|---|---|---|---|---|
| client.read | ✓ | ✓ | ✓ | ✓ | | ✓ |
| client.write | ✓ | ✓ | ✓ | | | ✓ |
| consent.manage | ✓ | ✓ | | | | ✓ |
| plan.create | ✓ | ✓ | ✓ | | | ✓ |
| plan.read | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| compliance.approve | ✓ | | | ✓ | | ✓ |
| audit.read | ✓ | | | ✓ | | ✓ |
| audit.export | ✓ | | | ✓ | | ✓ |
| ai.generate | ✓ | ✓ | ✓ | | | ✓ |
| ai.attest | ✓ | ✓ | | | | ✓ |
| insights.read | ✓ | ✓ | ✓ | ✓ | | ✓ |
| reports.read | ✓ | ✓ | ✓ | ✓ | | ✓ |

---

## Data Retention Policy

| Data Type | Retention |
|---|---|
| Client PII | 7 years post relationship |
| Audit Logs | 7–10 years |
| Consent Logs | Permanent |
| AI Drafts | 7 years |

Enforcement: `POST /api/retention/enforce` (owner/system_admin only).

---

## Ethical Guardrails

The platform prevents unauthorized data scraping, undisclosed cross-selling, AI autonomous advice, and hidden compensation conflicts.

- **Conflict disclosure module** — `POST /api/ethics/conflicts`
- **Advisor attestation** — `POST /api/ethics/attestations`
- **Client transparency dashboard** — `GET /api/ethics/transparency/:clientId`

---

## API Endpoints

### Auth
- `GET /api/auth/bootstrap` — get seeded orgs/users
- `POST /api/auth/login` — login
- `GET /api/auth/me` — current user

### Clients
- `GET /api/clients` — list clients
- `POST /api/clients` — create client
- `GET /api/clients/:clientId/profile` — latest financial profile
- `POST /api/clients/:clientId/profile` — save financial profile
- `GET /api/clients/:clientId/pii` — decrypted PII (restricted)
- `GET /api/clients/:clientId/risk-profiles` — risk profile history
- `POST /api/clients/:clientId/risk-profiles` — create risk snapshot
- `GET /api/clients/:clientId/kyc` — KYC history
- `POST /api/clients/:clientId/kyc` — create KYC snapshot
- `GET /api/clients/:clientId/net-worth` — net worth history
- `POST /api/clients/:clientId/net-worth` — compute net worth
- `GET /api/clients/banks/catalog` — Canadian bank catalog
- `GET /api/clients/:clientId/bank-profile` — bank product mapping
- `PUT /api/clients/:clientId/bank-profile` — update mapping

### Plans
- `GET /api/plans` — list plans
- `POST /api/plans` — create plan
- `POST /api/plans/:planId/versions` — create version
- `GET /api/plans/:planId/versions` — list versions
- `POST /api/plans/scenarios` — create scenario

### Compliance
- `GET /api/compliance/audit` — audit trail
- `POST /api/compliance/recommendations` — create with suitability snapshot
- `POST /api/compliance/approvals/submit` — submit for review
- `POST /api/compliance/approvals/decision` — approve/reject
- `POST /api/compliance/disclosures/accept` — accept disclosure

### AI Copilot
- `POST /api/ai/drafts` — generate AI draft
- `POST /api/ai/edit` — edit draft (required before attestation)
- `POST /api/ai/attest` — attest edited draft

### Insights Engine
- `GET /api/insights/:clientId` — get computed insights
- `POST /api/insights/:clientId/generate` — generate and persist
- `POST /api/insights/:alertId/approve-for-client` — approve for client view
- `POST /api/insights/:alertId/resolve` — resolve alert

### Ethics
- `GET /api/ethics/conflicts` — list conflict disclosures
- `POST /api/ethics/conflicts` — file disclosure
- `GET /api/ethics/attestations` — list attestations
- `POST /api/ethics/attestations` — create attestation
- `GET /api/ethics/transparency/:clientId` — client transparency

### FDX v5 (Open Banking)
- `POST /api/fdx/v5/consents` — create consent
- `GET /api/fdx/v5/consents/client/:clientId` — client consent portal
- `DELETE /api/fdx/v5/consents/:consentId` — revoke consent
- `GET /api/fdx/v5/oauth/authorize` — OAuth authorize
- `POST /api/fdx/v5/oauth/token` — token exchange
- `GET /api/fdx/v5/jwks` — JWKS

### Data Retention
- `GET /api/retention/policies` — list policies
- `POST /api/retention/enforce` — enforce retention

### Other
- `GET /api/analytics/dashboard` — dashboard KPIs
- `GET /api/notifications/templates` — notification templates
- `POST /api/notifications/2fa/start` — start 2FA
- `POST /api/notifications/2fa/verify` — verify 2FA
- `GET /api/telemetry/logs` — API logs
- `GET /api/controls/tickets` — control tickets

---

## Development

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend + backend
npm run dev:all

# Or separately:
npm run dev          # frontend on :5173
npm run dev:server   # backend on :4000

# Health check
curl http://localhost:4000/health
```

### Demo Users

| Email | Role |
|---|---|
| owner@nmaple.ca | Owner |
| advisor@nmaple.ca | Advisor |
| compliance@nmaple.ca | Compliance |
| client@example.ca | Client |
| sysadmin@nmaple.ca | System Admin |

---

## MVP Roadmap

**Phase 1:** PostgreSQL migration, consent engine upgrade, basic FDX integration, client portal, compliance locking.

**Phase 2:** Multi-institution FDX integration, net worth engine (done), token lifecycle automation.

**Phase 3:** AI copilot hardening (done), advanced insights engine (done), supervisory automation.
