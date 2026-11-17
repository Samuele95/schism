# Card — Multi-objective TPE

**What it buys.** The search engine, used twice in Schism: to build the floor (Phase 3), and as a move the compiler may make for numeric knobs inside a tournament iteration.

## Setup

```python
optuna.create_study(
    directions=["minimize", "minimize"],          # behaviour meter, preservation meter (order = report order)
    sampler=optuna.samplers.TPESampler(
        n_startup_trials=30, n_ei_candidates=128, multivariate=True, seed=<run seed>),
    storage=JournalStorage(JournalFileBackend("floor/study.jsonl")))   # JournalFileStorage on Optuna < 4
study.optimize(objective, n_trials=100)
```

Each trial: reset (`cards/lora-lifecycle.md`) → apply the knobs → meters on the dev split. Store parameters and every meter value as trial attributes. The Pareto front is `study.best_trials` (no other trial is at least as good on every objective and better on one); sort it by objective values in order. No weighted sum.

## How TPE chooses

The first 30 trials sample uniformly. Then TPE splits finished trials into a good group (roughly the top tenth; with two objectives, by non-domination rank then contribution to the front) and the rest, fits kernel densities ℓ(x) to the good group and g(x) to the rest, draws 128 candidates from ℓ and runs the one with the highest ℓ(x)/g(x). Thirty random trials first, because densities fitted to three points lock the search onto its first lucky region.

## Shape the search space for multivariate TPE

Multivariate TPE models jointly only parameters present in every trial with the same fixed distribution; everything else falls back to independent sampling and loses the joint model. Hence these odd-looking choices, which you keep:

| Natural | Shaped |
|---|---|
| sample `direction_index` only when global | always sample it; ignore it when per layer |
| `min_weight ∈ [0, max_weight]` | `min_weight ∈ [0, 1]`, multiply by max_weight after |
| `end ∈ [start+1, L]` | `start ∈ [0, L/2]`, `end ∈ [L/2+1, L]` |
| a separate "MLP on/off" choice | `max_weight ∈ [−0.25, 1.5]`, clamp at 0 |
| a weight in [1e-4, 1] uniform | `log=True` |

## As a compiler move

Inside an iteration, the compiler may run a small TPE (≤ 20 trials, 6 start-up) on the **probe** split over 2–4 knobs of a technique it has already chosen, counting each trial as one probe call. It submits the best probe trial as its candidate. Never on dev: that would let the compiler see what the testers see.

## Resume and interruption

The journal file is written after every trial. On interruption, mark the running trial pruned; on restart, load the study from the journal and continue. Store the brief's hash in the study's user attributes and refuse to resume a study whose brief changed.

## Self-check

Run 20 trials on a toy two-objective function of two parameters with a known Pareto front; the reported best trials must all be non-dominated, and a second run with the same seed must propose the same 20 parameter sets.
