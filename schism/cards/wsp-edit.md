# Card — WSP-style weight edits

**What it buys.** Edits narrower than a layer band, for behaviours the map localised: fewer weights changed, less collateral damage, and a protocol for improving an edit with a budget of forward passes.

## Sparse direction surgery

Restrict the projection to a set S of components the map confirmed:

- **Neuron columns** of `W_down` (WSP's Qwen fix): for columns j ∈ S, `W[:, j] −= λ · v (vᵀ W[:, j])`. As a LoRA: rank 1, B = −λv, A = (vᵀW) masked to zero outside S.
- **Attention heads:** apply the same to the column block of `W_O` that belongs to each head in S (columns h·d_head … (h+1)·d_head − 1).
- **Several layers:** one rank-1 slot per layer, each with its own λ and its own S.

Record the fraction of model weights changed; it is part of the result.

## Side path (experimental)

For a behaviour triggered by a detectable cue, add a gated correction instead of a permanent projection (WSP Exp. 4 added a small side path that switched itself off once its job was done). In a gated MLP: pick k neurons with the lowest activation on both conditions in a chosen layer; set their gate and up rows to read a detector direction d̂ (the cue direction from the map, read from Norm(h)); set their `W_down` columns to write −α·v. On good prompts the gate stays near zero, so the correction is near zero. This edits `gate_proj`, `up_proj` and `down_proj` rows and columns, so it is stored as a separate delta (dense, sparse), not a LoRA on writers: keep a CPU snapshot of the original rows and columns, apply with `copy_`, revert with `copy_`. Record that a non-writer edit was used.

## Keep-if-better under a budget

WSP's 50-pass result came from interleaving edits with measurements and keeping only improvements:

```
repeat until probe budget for this iteration is spent:
    propose one change (layer, set S, λ, α, technique)
    apply → measure the behaviour meter on probe bad-condition prompts + first-token KL on probe-neutral prompts (1 call)
    if behaviour improved and KL stayed inside the iteration's preservation target: keep
    else: revert
    log: change, measurements, kept/reverted
submit the kept state as the candidate edit spec
```

Probe split only: the testers judge on dev, and a compiler that measures on dev would see what the testers see.

## Combining with the standard modifiers

A composite candidate is allowed: for example ARA on a band plus sparse surgery outside it. Apply in a stated order and record it; the bench applies the same order.

## Self-check

1. Sparse surgery with S = all columns must reproduce the full directional ablation of `cards/directional-ablation.md` (mode none) exactly.
2. Columns outside S are bit-identical before and after.
3. Side path: on 10 good probe prompts, the side-path neurons' activations stay below 5% of their activation on bad probe prompts; otherwise the gate does not gate.
