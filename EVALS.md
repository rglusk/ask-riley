# Evals — tool routing

Informal behavioral evals for the ask-riley MCP server: each question is run against the
server in Claude Code, and tool calls are counted from the transcript. Small n, single
runs — directional, not science. Goal: broad questions answered in 1–2 calls, specific
questions routed to the right tool first try, out-of-scope questions answered honestly.

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

## Observations

- Baseline Q1: with no overview tool and terse descriptions, the model crawled the whole
  graph (search + get-project × all projects + contact) to answer a broad question.
