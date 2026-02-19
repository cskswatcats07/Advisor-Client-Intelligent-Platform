# Changelog

All notable changes to the Advisor Client Intelligence Platform (ACIP) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2026-02-19

### Added

- **ACIP rebrand** — Advisor Client Intelligence Platform; compliance-first positioning
- **RBAC** — Roles: Owner, Advisor, Associate, Compliance, Client, System Admin; granular permissions (client.read, client.write, consent.manage, plan.create, compliance.approve, audit.read/export, ai.generate/attest, insights.read, reports.read)
- **Client CRM** — Risk profile versioning, KYC versioning, net worth computation engine, Canadian bank catalog and product mapping
- **Consent engine** — FDX-aligned consents with clientId/advisorId/institutionId; client consent portal (active connections, scope transparency, one-click revocation, consent history)
- **Insights engine** — Internal-only alerts: allocation drift, risk mismatch, liquidity warnings, conflict-of-interest flags
- **Compliance** — Suitability snapshot at recommendation time; immutable recommendation records; 2-eye/4-eye controls
- **AI Copilot** — Hallucination disclaimer; mandatory edit before attestation; no direct client publishing; 7-year retention
- **Ethics** — Conflict disclosure module, advisor attestation tracking, client transparency dashboard
- **Data retention** — Policies for PII (7y), audit (10y), consent (permanent), AI drafts (7y); enforcement endpoint
- **Security** — Rate limiting (120 req/min); audit events with actorHash, actorRole, interactionId
- **FDX v5** — OAuth 2.0 authorization code flow, JWS-signed responses, JWKS endpoint

### Security

- PII encryption (AES-256-GCM), hashed actor identifiers in audit logs
- Permission-based API access; client role cannot access advisor-only endpoints
