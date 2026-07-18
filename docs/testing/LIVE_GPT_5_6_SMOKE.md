# Live GPT-5.6 Smoke Evidence

## Final result

PASS — 2026-07-18, Asia/Calcutta.

The local server received `POST /api/compile` with `{ "action": "analyze", "mode": "live" }`. The server-only provider made two bounded OpenAI Responses API Structured Output calls: one for impacts and one for patches.

Redacted result:

```json
{
  "ok": true,
  "impactMode": "live",
  "impactSimulated": false,
  "impactModel": "gpt-5.6",
  "impactCount": 5,
  "patchMode": "live",
  "patchSimulated": false,
  "patchModel": "gpt-5.6",
  "patchCount": 5
}
```

## Privacy and integrity

- `store: false` is fixed in `lib/live-provider.ts` and asserted by the mocked provider contract test.
- The API key remained in the server process environment and was never printed, written, or returned.
- No raw live prompt, artifact payload, or model response is retained in this evidence file.
- Live output passed the same strict schema, known-ID, citation, exact-target, grounding, bounded-replacement, duplicate, conflict, and five-target coverage checks as Replay.
- Live never silently falls back to Replay.

## Fail-closed evidence

An earlier bounded run produced schema-valid but incorrectly mapped patch identifiers. The downstream citation validator rejected it with `CO-VAL-004`; no partial state was applied. Field descriptions and exact mapping instructions were tightened before the final passing run above.
