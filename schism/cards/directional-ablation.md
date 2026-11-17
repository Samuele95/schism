# Card — Directional ablation as a LoRA edit, and MPOA

**What it buys.** The classic modifier: stop the writers from adding a direction v to the stream, with a per-layer strength schedule, optionally keeping each writer row at its trained length (Magnitude-Preserving Orthogonal Ablation, MPOA).

## The edit

Removing v from what a writer emits, for every input z, moves the projector inside the matrix:

```
W′ = W − λ · v (vᵀW)              vᵀW′z = (1 − λ) · vᵀWz
```

λ = 0: nothing. 0 < λ < 1: the component is weakened, not removed (tuning). λ < 0: the writer writes more along v, which is how this edit injects a behaviour when v points from the default toward it (`SKILL.md`, Three operations). λ = 1: the writer can no longer write along v. λ > 1: it writes *against* v, pushing back the v that the embedding and earlier, unedited writers already put on the stream, which an edit at this layer cannot erase. Too far, and the stream ends negative along v, a state the model never saw in training; the preservation meter catches that.

Stored as a rank-1 LoRA (`cards/lora-lifecycle.md`, lora_alpha = r so the scale is 1):

```
B = −λ · v          (d × 1)
A = vᵀW             (1 × d_in)        in code: A = v @ W
```

Under 4-bit quantization compute A from the dequantized weight (float32). A merged full-precision export then carries a small quantization-error term along v; record that quantization was on.

## Strength per layer: the weight kernel

One kernel per component role (attn.o_proj, mlp.down_proj), four knobs each. With δ = |ℓ − max_weight_position|:

```
λ(ℓ) = max_weight + (δ / min_weight_distance)·(min_weight − max_weight)   if δ ≤ min_weight_distance
λ(ℓ) = 0 (layer skipped)                                                  otherwise
```

Search ranges (`cards/tpe.md` explains why they are shaped this way):

| Knob | Range |
|---|---|
| `direction_scope` | global, per layer |
| `direction_index` | [0.4, 0.9]·(L−1), sampled even when per layer |
| `max_weight` | attn [0.8, 1.5]; mlp [−0.25, 1.5] then clamped at 0 (0.25/1.75 ≈ 14% of prior mass = MLP edit off; MLP edits often cost more capability than attention edits) |
| `max_weight_position` | [0.6, 1.0]·(L−1) |
| `min_weight` | [0, 1] as a fraction of max_weight |
| `min_weight_distance` | [1, max(0.6·(L−1), 1)] |

The kernel peaks later than the band where the global direction is read: the direction is clearest mid-stack, the edit is centred on the later layers that act on it.

## Row normalization (MPOA)

A writer's row i drives stream coordinate i; its norm nᵢ is that coordinate's trained scale. Write Ŵ = diag(n)⁻¹ W.

- **none** — the rank-1 edit above.
- **pre** — compute on unit rows, scale back: A = vᵀŴ, B = −λ · (n ⊙ v). Still rank 1; long rows no longer dominate A.
- **full** (default) — edit the normalized matrix, renormalize every row to unit length, restore original norms, subtract:

```
Ŵ′ = Ŵ − λ v vᵀŴ
W_new = diag(n) · diag(1/‖Ŵ′ᵢ‖) · Ŵ′
ΔW = W_new − W
```
  The per-row rescale makes ΔW non-linear in λ and generally not rank 1. Compress it: `U, S, V = torch.svd_lowrank(ΔW, q=2r+4, niter=6)`, keep the top r = 3, split √S evenly: B = U[:, :r]·diag(√s), A = diag(√s)·V[:, :r]ᵀ. **Reseed the RNG immediately before every svd_lowrank call**, so re-applying a candidate gives the same adapter regardless of what ran before. Three directions suffice because every rescale factor is close to 1 when v is spread over thousands of coordinates: ΔW is the rank-1 projection plus a small row reweighting.

MPOA trades exact removal for preserved magnitudes: unequal row factors leak a little of v back at λ = 1. Whether that trade is right is unsettled; the default keeps it on. Orthogonalized direction + full normalization = MPOA.

## Self-check

1. **none, λ = 1:** for random z, vᵀ(W + BA)z ≈ 0 (relative to vᵀWz, < 1e-5 in float32).
2. **none, any λ:** vᵀ(W + BA)z = (1−λ)vᵀWz; and for u ⟂ v, uᵀ(W + BA)z = uᵀWz.
3. **full:** every row norm of W + BA (with the full ΔW, before compression) equals the original within 1e-5; after rank-3 compression, report the energy captured (Σ top-3 σ² / Σ σ²; expect > 0.99) and the residual row-norm error.
4. Determinism: applying the same candidate twice gives byte-identical A and B.
