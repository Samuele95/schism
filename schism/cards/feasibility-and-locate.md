# Card — Locating a behaviour, and the feasibility gate

**What it buys.** A written, evidenced hypothesis about where the behaviour lives, and an early stop when there is nothing to switch off. This is where Weight Space Programming (WSP) extends the baseline: the baseline never asks where; it edits a band and lets the search sort it out.

## What WSP showed (Takehi et al., 2026; early results, one model family)

A frontier model read raw weights as a program: identified games, shapes and languages from weights alone; found every induction head in a small transformer by composing weight matrices, without running it; fixed a failing policy with a small side path (3.5% of weights). On Qwen3.5-0.8B it traced looping to one direction written by the MLPs of two layers and subtracted it from 64 output columns in each (0.016% of weights): MATH-500 7.9 → 48.1 at a 50-forward-pass budget, but only 12.3 and 14.1 at 10 and 25 passes. Two limits carry over as rules: **weights alone failed** to tell a sycophantic model from an honest one until attention patterns on self-written texts were allowed; and editing **removed an obstacle but could not add a missing ability** (Gemma 3 270M, no gain). The model used was not one you have; whether a frontier LLM can do the same is a hypothesis this run tests.

## Instruments, cheapest first (count probe calls in the ledger)

1. **Layer profile** (no extra calls; from the fit capture): `cards/directions.md` instruments. Output: the band where the difference appears and stabilizes.
2. **Direction readout** (no calls): push normalize(r̂_ℓ) through the final norm's scale and the unembedding; list the top and bottom tokens it promotes. A refusal direction promoting "I", "Sorry", "cannot" is a sanity check that you found the behaviour and not the topic.
3. **Component attribution** (1–2 calls): on fit prompts, decompose each layer's write along r̂ into per-head contributions (split `W_O` by head blocks) and per-neuron contributions (columns of `W_down` times activations). Rank components by (bad − good) contribution along r̂. Output: candidate heads and neuron columns.
4. **Attention inspection on texts you write** (2–6 calls): craft 8–16 short texts that isolate the cue the behaviour reacts to (the user's suggested answer for sycophancy; a harmful verb for refusal; a cliché trigger for slop), with matched controls. Record attention from the decision token for the candidate heads. A head whose attention to the cue differs sharply between conditions is a mechanism, not just a correlate (WSP Exp. 7: the sycophant's head 10.2 attended to the user's suggestion 85.7% vs 0.75%).
5. **Matrix composition** (no calls): for candidate heads, compose QK and OV circuits with earlier heads' outputs, WSP Exp. 3 style, to check whether a candidate depends on an earlier component (a cue-detector head feeding a later writer).
6. **Causal confirmation** (2–6 calls): ablate the hypothesised components on probe prompts (project r̂ out of those heads or columns only, `cards/wsp-edit.md`) and measure the behaviour meter and first-token KL. A hypothesis is confirmed when the targeted ablation reduces the behaviour by at least half of what a broad band ablation of the same direction achieves.

On models too large to read (beyond a few billion parameters, or when weight tensors exceed what you can reason over), skip 5 and lean on 1–4 and 6: statistics computed in code, not reading.

## The feasibility gate

| Verdict | Evidence | Next |
|---|---|---|
| **switchable** | a confirmed component set (step 6) removes ≥ 50% of the behaviour on probe at first-token KL inside the loosest tier | Phase 3; the compiler favours sparse edits |
| **diffuse** | the difference is real (probe separability ≥ 0.75 in some band) but only broad edits move it | Phase 3; the compiler favours ARA-family edits |
| **absent** | separability near chance everywhere and no ablation moves the behaviour; or the brief asks to *add* an ability | stop; report what was measured |

If the probe budget for mapping runs out before a verdict, the verdict is **inconclusive**: proceed as diffuse and say so.

## Map report (`map/report.md`)

Hypotheses H1…Hn, each: the components, the evidence (numbers, prompt ids, figures), the confirmation result, confidence. Then the verdict with its evidence. The compiler cites hypothesis ids in its edit specs.

## Self-check

Step 3's per-head contributions summed over heads must equal the layer's attention write along r̂, and per-neuron contributions summed must equal the MLP write, to a relative error below 1e-4 in float32 or 1e-2 when the model runs in bf16 or fp16. If they don't, the head split or the activation hook is wrong.
