# ADR-003: Explicit Replay and Live providers behind one interface

Status: Accepted (M0)

## Context

Judges must be able to run the golden path with zero credentials, deterministically, on desktop and mobile — and the submission must also prove a real GPT-5.6 build. Hackathon truthfulness rules forbid presenting fixture output as live model output. These are two different evidence regimes that must never blur.

## Decision

One `CompilerProvider` interface (blueprint §8) with exactly two implementations:

- **ReplayProvider** — pure function over checked-in fixtures; byte-identical output per input, no network. Every envelope carries `mode: "replay"`, `simulated: true`, `model: null`, and the UI shows a persistent "Simulated" banner.
- **LiveProvider** — server-only adapter for the OpenAI Responses API, model `gpt-5.6`, Structured Outputs mirroring the contract schemas, `store: false`, fixed repo-versioned system prompt, ≤ 2 calls per run with timeouts. Envelopes carry `mode: "live"`, `model: "gpt-5.6"`; the UI badge reads "Live — GPT-5.6 · store: false".

Both implementations return the same envelope shape and pass the identical ADR-002 validation pipeline. Live failure surfaces as a typed `CO-PROV-*` error; the app never silently falls back to Replay while the mode says Live.

## Consequences

- Deterministic demo and repeated-demo gate (same fixture → same receipt) come for free from Replay.
- Provider parity is a contract test: both modes' outputs validate against one schema, so M4 Live work cannot drift from M3 Replay behaviour.
- Provenance is structural (in every envelope and receipt), not just UI copy — mislabelling simulated output as live would require falsifying typed data, which tests check.
- Cost: fixtures must be maintained in lockstep with contract changes; that's accepted as the price of a credential-free judge path.
