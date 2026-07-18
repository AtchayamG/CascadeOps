# ADR-001: Single Next.js application, dependency-light

Status: Accepted (M0)

## Context

CascadeOps P0 must ship a judge-verifiable golden path (blueprint §5) inside a hackathon window, runnable from a clean clone with zero credentials in Replay Mode. AGENTS.md mandates one dependency-light Next.js application with no database, authentication, vector store, queues, OAuth connectors or microservices. The entire P0 dataset is one curated fixture; all run state fits comfortably in memory for a single browser session.

## Decision

Build exactly one Next.js (App Router) application in strict TypeScript. Server route handlers host the compiler core and both providers; the browser holds per-session run state; fixtures are checked-in files. Persistence is limited to user-initiated export downloads. New runtime dependencies require explicit justification against blueprint §19 exclusions.

## Consequences

- Clean clone → install → run works credential-free; judges need only a browser.
- One deploy target, one build pipeline, one test surface; smallest possible operational risk during demo week.
- No horizontal scaling, multi-user or persistence story — deliberately out of scope (blueprint §19); reintroduction requires a blueprint revision, not an incidental dependency.
- Server-only boundaries (API key, Live provider) are enforced by Next.js server/client separation rather than a separate backend service.
