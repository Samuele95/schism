# Schism — install and run

## What you have

`schism/` is an agent skill: the method, 15 technique cards, the role prompts for its Alchemist tournament, and run templates. It contains no code. The agent writes and self-checks the code at run time, then keeps it in a `workbench/` folder for later runs.

## Requirements

- **Skills:** `schism`, `alchemist` and `prometheus` installed where the driving agent can load them. The WSP skill is optional; when present, Schism hands general weight reading and writing to it.
- **Weights branch:** a machine that can load the model in bf16 (or 4-bit), with Python ≥ 3.10 and `torch`, `transformers`, `peft`, `accelerate`, `optuna`, `scikit-learn`, `datasets`. Optional: `bitsandbytes` (4-bit), `lm-eval` (capability meter).
- **Semantic branch:** a headless LLM agent invocation (the sampling command) and a local embedding model, which the agent chooses. `sentence-transformers` and `scikit-learn`.

## Install

Place `schism/` in the skills folder your LLM agent loads from, next to `alchemist/` and `prometheus/`.

## Run

Name the behaviour, the model and how you are running it. For example:

- *Interactive:* "Use Schism to reduce slop in Qwen3-4B-Instruct. I'm here, ask me if something is ambiguous."
  The brief gets `deployment: present`. You confirm the brief after Phase 1, and you pick from the front at the end.
- *Unattended, overnight:* write the brief yourself (copy `schism/assets/run-brief.yaml`), set `deployment: unattended` and `approved: true`, then start the agent with "Run the Schism brief at runs/<id>/brief.yaml."
  Without `approved: true`, Alchemist builds the tournament harness and stops after the floor. A live tournament spends tokens nobody approved.
- *Closed model:* "Use Schism on the semantic branch to make this model less sycophantic."

**First run:** do a calibration run before anything else. Use a small open model (about 1–2B parameters) and the slop preset. This checks the workbench's implementations against their self-checks, and every later run on that machine reuses the checked implementations.

## Models and reasoning effort

- **Orchestrator, Cartographer, Smith, Arbiter, Goodhart tester:** these need the strongest reasoning available. Use the strongest model your agent driver supports, with extended thinking enabled for these roles.
- **Behaviour, preservation and capability testers:** can run on a local model at temperature 0, but only after it passes the calibration check in `cards/llm-judges.md` (all 10 Frame anchors labelled correctly).
- **Meters and bench:** greedy decoding throughout, already fixed by the cards.

## Rough cost, weights branch

The figures below are rough, not measured.

| Part | Default | Rough cost |
|---|---|---|
| Floor: 100 TPE trials of ARA | GPU | one standard abliteration run on the same model |
| Map | 30 probe calls | minutes of GPU time; one long frontier-model session |
| Tournament: 3 tiers × up to 6 iterations | 6 subagent calls per iteration (compiler, 4 testers, judge) | up to ~110 subagent calls, plus bench time |
| Seal: vault pass for the whole front | GPU | minutes |

On the semantic branch, cost is dominated by closed-model samples. Set `samples_total` in the brief.

## Where results land

- `runs/<run-id>/seal/report.md`: outcome first, then the front, the head-to-head against the floor, and what needs your attention.
- `runs/<run-id>/exports/<candidate-id>/`: the exported model or adapter.
- `runs/<run-id>/ledger.md`: the full record.
