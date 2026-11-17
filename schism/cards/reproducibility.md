# Card — Workbench, pins, manifest, calibration

**What it buys.** A run someone else can replay, and implementations you do not have to rewrite.

## Workbench

`workbench/` holds one module per technique (`capture.py`, `directions.py`, `ablation.py`, `ara.py`, `meters.py`, `tpe_floor.py`, `semantic.py`, …) and `workbench/checks/<technique>.log` with the self-check results and the environment they ran on. Reuse an implementation only if its check log matches the current environment (torch, transformers, peft, GPU type); otherwise re-run the self-check first. Improve a module freely; re-run its check after every change. The run records the hash of every workbench file it used.

## Sources of chance, pinned

| Source | Pin |
|---|---|
| chat template date | `strftime_now` → fixed date |
| randomized SVD (MPOA, ARA fix 1) | reseed RNG before every call |
| ARA's initial A | CPU generator seeded per modify call |
| leftover adapters | zero A and B on every reset |
| datasets, classifier and judge model weights | commit hashes resolved at Frame, written into the brief |
| TPE proposals | sampler seed |
| generation in meters and bench | greedy |
| LLM judges and compilers | not pinnable: record model id, temperature, and every prompt and output in the run folder |
| hardware, drivers, packages | recorded, compared on replay |

Agent decisions are not replayable; the ledger plus the stored candidate specs are. A replay re-applies the stored specs and re-scores; it does not re-run the agents.

## Manifest (`seal/manifest.json`)

Brief (with pinned commits), workbench file hashes, every front candidate's spec, vault scores, the recommended candidate, environment (Python, OS, accelerator, driver, package versions), SHA-256 of each exported file, ledger hash.

## Self-check (every export)

Re-hash every exported file and compare with the manifest; re-load the export and reproduce the recommended candidate's greedy outputs on 5 probe prompts. Mismatch → the export is not delivered.

