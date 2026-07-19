# Evals — tool routing & response shape

Behavioral evals for the ask-riley bot. Originally manual (questions asked in Claude Code,
tool calls counted from the transcript); now automated: `pnpm --filter web eval` runs the
case suite in `apps/web/scripts/eval-cases.ts` through the real agent loop and asserts on
response SHAPE — tools called, trust state, block types — never exact prose (which is
non-deterministic). Flags: `--runs=N` for flake rates, `--only=substr`, `--verbose`.

Goal: broad questions answered in 1–2 calls, specific questions routed to the right tool
first try, out-of-scope questions honestly classified, cards composed per the choreography,
zero fabricated films/takes/URLs.

## Question set

| # | Question | Kind | Ideal behavior |
|---|----------|------|----------------|
| 1 | Tell me about Riley Glusker | broad | 1 call: get-overview |
| 2 | What's her most impressive project? | broad → depth | 2 calls: get-overview, get-project |
| 3 | Has Riley done any AI work? | topical | 1–2 calls: search or overview |
| 4 | What did she build for streaming UIs? | topical → depth | search/overview → get-project |
| 5 | How do I contact her? | direct | 1 call: get-contact |
| 6 | Where might I bump into Riley on a weekend? | direct (fun) | 1 call: get-contact |
| 7 | Does Riley knit? | fun/edge | overview (search misses `fun` — known gap) |
| 8 | What's Riley's salary? | out of scope | any calls, then honest "not in the data" |
| 9 | What was Riley's GPA? | out of scope | honest "not in the data", no guessing |
| 10 | Is Riley a manager or an IC? | nuanced | overview (interim-EM story) |

## Results

Call counts per question, from the Claude Code transcript.

| Date | Change | Model | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Notes |
|------|--------|-------|----|----|----|----|----|----|----|----|----|-----|-------|
| 2026-07-17 | baseline: 3 tools (contact, project, search), terse descriptions | Fable 5 (Claude Code) | 9 | | | | | | | | | | 18s churn on Q1 |
| | + steering descriptions, + get-overview | | | | | | | | | | | | |

## Automated suite results

| Date | Change | Model | Result | Notes |
|------|--------|-------|--------|-------|
| 2026-07-19 | first run: 12 cases (envelope era: system prompt + cards) | Sonnet 5 (API) | 9/12 | fallback fired 4×; failures masked by fallback |
| 2026-07-19 | max_tokens 1000 → 4000 | Sonnet 5 (API) | 11/12 | truncation was corrupting multi-card envelopes |
| 2026-07-19 | restaurants case re-run --runs=3 | Sonnet 5 (API) | 3/3 | earlier failure was a low-frequency flake |

## Observations

- Baseline Q1: with no overview tool and terse descriptions, the model crawled the whole
  graph (search + get-project × all projects + contact) to answer a broad question.
- After steering descriptions + get-overview + system-prompt choreography: broad questions
  route to get-overview in 1 call; "tonight" movie asks produce exactly one movie_card.
- max_tokens=1000 silently truncated multi-card JSON envelopes mid-stream; the fallback
  wrapped the stumps as degraded text, masking the real failure as "answered". Evals
  surfaced in one run what manual testing had missed entirely. Fix: 4000 + a truncation
  warning log in the loop.
- Taste-match case routes correctly but is call-happy (get-favorites × 3 in one run) —
  candidate for description tuning or a maxToolCalls tightening later.
