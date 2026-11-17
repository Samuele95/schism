# Run ledger — <run-id>

Append-only. Reread from the top at the start of every phase and after any context compaction. One line per event, greppable prefix first. Never rewrite a past line; correct it with a new line that cites the old one.

Prefixes: `PHASE:` `DECISION:` `ASSUMPTION:` `DEVIATION:` `HYPOTHESIS:` `CHECK:` `BUDGET:` `CANDIDATE:` `VERDICTS:` `ERROR:` `WARN:` `RESULT:`

## Budget meter

| Budget | Limit | Used |
|---|---|---|
| mapping probe calls | | |
| tournament probe calls | | |
| tournament iterations (per tier) | | |
| closed-model samples | | |
| GPU hours | — | |

## Deviations

Mid-run ambiguities resolved without the user: the reading taken, the alternative, why.

## Log

```
PHASE: frame started 2026-11-20 21:04
ASSUMPTION: unattended; behaviour target defaulted to from_floor
DECISION: contrast pattern = instructions (same prompts, opposite system prompts) — topic probe on datasets pattern gave 0.94 accuracy on prompts alone
CHECK: response_prefix OK (TV 0.41) prefix="<think></think>\n"
CHECK: directions OK (swap sign; synthetic u cos 0.997)
BUDGET: mapping probe 14/30
HYPOTHESIS: H1 heads 13.4, 15.1 — confidence medium (map/report.md)
RESULT: map verdict=switchable
CANDIDATE: t0-i0 floor best trial #57 (keyword 0.08, KL 0.31)
VERDICTS: t1-i0 T1 pass T2 pass T3 pass T4 fail(synonym swap) → Alchemist iteration 1
...
```
