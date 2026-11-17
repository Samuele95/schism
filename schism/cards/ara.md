# Card — ARA: Arbitrary-Rank Ablation

**What it buys.** The default modifier: no direction, no rank-1 assumption. Each writer's edit is fitted to what that writer actually emits, so that harmful outputs land among real harmless outputs while harmless outputs stay where they were.

## Capture

For every writer in the layer range, hook it (`cards/stream-and-capture.md`) and record at the last prompt token, for fit-split good and bad prompts: inputs Z_g, Z_b (one row per prompt, d_in wide) and outputs Y_g, Y_b (d wide). Captured once, from the unedited model, kept on CPU.

## Loss, per module

With ΔW = BA and new outputs Ỹ = Z(W + BA)ᵀ (+ bias, added after any rescale):

```
L = w_p · mean[(Ỹ_g − Y_g)²]
  + w_s · ( mean_i kNN_k(ỹ_b,i , Y_g) − ρ · mean_i kNN_k(ỹ_b,i , Y_b) )

kNN_k(x, S) = mean of the k smallest Euclidean distances from x to the rows of S
             (torch.cdist, then topk(k, largest=False))
```

- *preserve*: harmless emissions must not move (elementwise MSE).
- *pull*: each new harmful output toward its k nearest **original** harmless outputs. The target is fixed; measuring against Ỹ_g would let the optimizer drag the harmless cloud toward the harmful one when w_p is small.
- *push*: away from the original harmful outputs, own original included. ρ > 0 overshoots on purpose, the same logic as λ > 1: beat refusal routes a single writer cannot see.

Matching *means* instead of neighbours can park outputs in an empty gap between harmless clusters; neighbours keep each output inside a region harmless outputs really occupy.

## Knobs (search ranges)

| Knob | Range |
|---|---|
| `start_layer_index` | [0, L/2] |
| `end_layer_index` (exclusive) | [L/2 + 1, L] — never empty, always covers the middle |
| `preserve_good_behavior_weight` w_p | [0, 1] |
| `steer_bad_behavior_weight` w_s | [1e-4, 1], log-uniform (squared vs unsquared terms differ by orders of magnitude) |
| `overcorrect_relative_weight` ρ | [0, 1.3] |
| `neighbor_count` k | [1, min(15, N_good, N_bad)] |

Every writer in [start, end) is fitted with the same knobs.

## Optimization, per module

- **Rank 50** (`lora_rank`): singular values of fitted edits fall off after a few dozen. The cap is storage, not a model of the behaviour.
- **Initialization:** A ← Kaiming-uniform (a = √5), drawn from a CPU `torch.Generator` seeded with the run seed and created once per modify call; B ← 0. Then ΔW = 0 (model unchanged) but ∂L/∂B = G·Aᵀ ≠ 0. **A = B = 0 is a saddle**: ∂L/∂B = G·Aᵀ = 0 and ∂L/∂A = Bᵀ·G = 0, nothing ever moves.
- **Low-rank forward:** precompute Z Wᵀ once in float32 from the float32 weight (not from the captured output, which was produced in the model dtype and would change the objective); per evaluation compute (Z Aᵀ) Bᵀ. Never form W + BA for the outputs.
- **Row norms** (`preserve_row_magnitudes`, default true): scale output column j by n_j / ‖(W + BA)_j‖. This does form W + BA, for the norms.
- **L-BFGS:** `lr=1.0, max_iter=20, history_size=10, line_search_fn="strong_wolfe"`, 5 outer `step()` calls. Full batch, deterministic. If the session disables gradients globally, note that `LBFGS.step` wraps the closure in `torch.enable_grad()`; gradients exist only there. Free buffers after each module (`zero_grad(set_to_none=True)`).
- Move each module's captured tensors to the device just for its fit.

## Known flaws, and the opt-in fixes Schism allows

The baseline behaviour is the floor; these are moves the compiler may propose, each recorded in the edit spec.

1. **Row norms only in the objective.** The deployed adapter is raw BA; nothing rescales deployed rows, so the evaluated edit is not the optimized one. *Fix:* after fitting, compute the full rescaled ΔW and compress it with the MPOA SVD step (`cards/directional-ablation.md`) at rank ≤ 50, then report the compression energy.
2. **Unobserved input directions (known issue, open).** A few hundred prompts span far fewer than d_in dimensions; components of ΔW in unused directions are unconstrained, and floating-point noise there can be amplified by the line search and kept in the L-BFGS history. Symptoms: different optima for mathematically equivalent formulations; some trials with high KL. *Fix:* add a ridge term γ‖BA‖²_F (it pins unobserved directions to zero change; it also shrinks useful edits, so γ is a searched knob, start at 1e-4 relative to the preserve term).
3. **Stale inputs.** Every module is fitted against inputs from the unedited model; after upstream writers change, later layers see different inputs. *Fix:* fit layer by layer, re-capturing the inputs of layer ℓ+1 with layers ≤ ℓ already edited. Costs one capture per layer.
4. **Overshoot with ρ > 1.** Sending a harmful output far away grows the push faster than the pull; along unobserved directions the preserve term offers no resistance, so the objective has no lower bound. Row rescaling bounds it in the objective only. Keep ρ ≤ 1 unless fix 1 or fix 2 is on.

## Self-check

1. The low-rank and dense formulations of Ỹ agree to 1e-9 in float64, with and without bias, with and without row rescaling.
2. Starting from A = B = 0, the gradient is exactly zero; starting from the seeded A and B = 0, ‖∂L/∂B‖ > 0 and the model output is unchanged.
3. With w_s = 0, the fitted edit stays tiny: ‖BA‖_F / ‖W‖_F < 1e-3. Preserve alone is nearly satisfied by ΔW = 0; the only residual signal is the dtype gap between the float32 recomputation and the captured outputs, so a large edit here means a bug.
4. Same seed, same captures → byte-identical A and B.
