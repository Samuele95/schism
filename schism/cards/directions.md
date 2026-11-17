# Card — Directions: difference of means, winsorization, projection

**What it buys.** One unit vector per layer that summarizes how the stream differs between bad and good prompts at the decision token: the input to directional ablation, and a cheap localisation instrument for the Cartographer.

## Difference of means

For every stream position ℓ = 0…L (embedding included):

```
μ_ℓ^bad  = mean over bad fit prompts of x_ℓ(p)
μ_ℓ^good = mean over good fit prompts of x_ℓ(p)
r̂_ℓ      = normalize(μ_ℓ^bad − μ_ℓ^good)        shape (L+1, d)
```

Accumulate sums in float64 on CPU batch by batch. Averaging cancels whatever varies independently of the behaviour and keeps the shared offset; PCA would instead find the largest variance, usually topic. Sign does not matter for ablation (vvᵀ is sign-blind).

**Winsorization** (optional; default off, q = 1.0): before averaging, per prompt and per layer, clamp each coordinate to ±(the q-quantile of that vector's absolute values). Use q ≈ 0.95–0.995 when the model has massive activations (a few coordinates orders of magnitude larger than the rest, nearly prompt-independent) that would dominate the means.

## Choosing the direction per layer

- **Per layer:** the writers of layer ℓ use r̂[ℓ+1], the stream right after that layer.
- **Global:** one direction for every layer, read at a real-valued index i.f (sampled in [0.4, 0.9]·(L−1)): `v = normalize(lerp(r̂[i+1], r̂[i+2], f))`. The fraction lets a continuous optimizer move smoothly between layers; neighbouring directions are usually close, so interpolation is meaningful. The band reflects where the distinction is clearest: after the model has understood the request, before it has committed to tokens.

## Projected abliteration (orthogonalization)

Remove from each direction its component along the mean good state:

```
ĝ_ℓ = normalize(μ_ℓ^good)
r′_ℓ = r̂_ℓ − (r̂_ℓ · ĝ_ℓ) ĝ_ℓ ,   v_ℓ = normalize(r′_ℓ)
```

The parallel part says "bad prompts push further along what normal answers already do"; removing it would damage ordinary replies. The default is on. If r′ is (near) zero, the bad condition differs from good only in magnitude along the harmless direction at that layer; `normalize` then returns ~0 and the layer gets no edit, which is the correct outcome, but record it.

## What the direction is and is not

It is a contrast between two datasets at one token, not a concept. It is the best linear separator only when both clouds are round; with stretched, correlated clouds the separator Σ⁻¹Δμ can sit far from it, and with ~800 prompts in thousands of dimensions Σ cannot be inverted reliably. Use the direction as an edit target and as a hypothesis; let the testers judge the edit.

## Instruments for the Cartographer (cheap, from the same capture)

- ‖μ^bad − μ^good‖ per layer, normalized by the mean stream norm: where the difference grows.
- Linear separability per layer: accuracy of a logistic probe on fit, evaluated on probe.
- cos(r̂_ℓ, r̂_ℓ+1): where the direction stabilizes.
- cos(r̂_ℓ, ĝ_ℓ): how much orthogonalization will remove.

## Self-check

1. Swap the good and bad sets: r̂ must flip sign exactly.
2. Synthetic: with a forward hook, add a fixed vector u to the output of layer j at the last token for the "bad" copy of a set of identical prompts; the recovered r̂ at stream index j+1 must have cosine > 0.99 with u. This proves the capture, the index shift and the subtraction together.
3. With orthogonalization on, confirm r′_ℓ · ĝ_ℓ ≈ 0 for every layer.
