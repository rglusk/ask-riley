# ask-riley MCP benchmarks

Tracks tool-call count for the same benchmark question across changes to `src/server.ts`, so the effect of each change is visible.

**Benchmark question:** "tell me about Riley Glusker"

| Date | Change | Tool calls | Notes |
|---|---|---|---|
| 2026-07-17 21:58:55 PDT | Baseline (`get-contact`, `get-project`, `search-experience` only) | 9 | `get-contact` ×1, `search-experience` ×2, `get-project` ×6 (one per project id) |
| 2026-07-17 22:01:42 PDT | Added `get-overview` composite tool; redirected `get-project`/`search-experience` descriptions to point broad questions at it | 1 | `get-overview` ×1 (single call answered the full benchmark question) |
