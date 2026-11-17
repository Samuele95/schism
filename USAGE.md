# Schism — install and run

## What you have

`schism/` is an agent skill for injecting, tuning or ablating one behaviour of a language model. It holds the method, 15 technique cards, the role prompts for its Alchemist tournament and the run templates, but no code: the agent writes the code at run time, checks it against each card's self-check and keeps it in a `workbench/` folder for later runs.

## Requirements

- **Skills:** `schism` and `alchemist` installed where the driving agent can load them. The WSP skill is optional; when present, Schism hands general weight reading and writing to it.
- **A prompt compiler:** anything that turns a prompt, or a request for one, into a prompt. [Prometheus](https://samuele95.github.io/prometheus/) is the recommended one; a plain call to a capable LLM also works. Name it in the brief's `compiler` block.
- **Weights branch:** a machine that can load the model in bf16 (or 4-bit), with Python ≥ 3.10 and `torch`, `transformers`, `peft`, `accelerate`, `optuna`, `scikit-learn`, `datasets`. Optional: `bitsandbytes` (4-bit), `lm-eval` (capability meter).
- **Semantic branch:** a headless LLM agent invocation (the sampling command) and a local embedding model, which the agent chooses. `sentence-transformers` and `scikit-learn`.

## Install

Place `schism/` in the skills folder your LLM agent loads from, next to `alchemist/` (and `prometheus/`, if it is your compiler).

## Run

Name the behaviour, the model and how you are running it. For example:

- *Interactive:* "Use Schism to reduce slop in Qwen3-4B-Instruct. I'm here, ask me if something is ambiguous."
  The brief gets `deployment: present`. You confirm the brief after Phase 1, and you pick from the front at the end.
- *Unattended, overnight:* write the brief yourself (copy `schism/assets/run-brief.yaml`), set `deployment: unattended` and `approved: true`, then start the agent with "Run the Schism brief at runs/<id>/brief.yaml."
  Without `approved: true`, Alchemist builds the tournament harness and stops after the floor. A live tournament spends tokens nobody approved.
- *Closed model:* "Use Schism on the semantic branch to make this model less sycophantic."
- *Injecting a behaviour:* "Use Schism to make Qwen3-4B-Instruct answer in plain, terse English by default, the way it does when I ask for it." The contrast pair puts the instructed behaviour on the GOOD side, so the run makes it the default (`schism/SKILL.md`, Three operations).

**First run:** before anything else, do a calibration run on a small open model (about 1–2B parameters) with the slop preset. It checks the workbench's implementations against their self-checks, and every later run on that machine reuses what it checked.

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
