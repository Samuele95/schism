# Card — LoRA lifecycle: attach, reset, export

**What it buys.** Every weight edit is reversible in microseconds, the original never changes, and the result ships as merged weights or a small adapter.

## Attach (once per session)

Wrap every writer (`cards/stream-and-capture.md`) with a PEFT LoRA adapter: `target_modules` = the writer module names, `r` = the largest rank any candidate will need (50 for ARA, 3 for MPOA, 1 for plain directional; sparse edits may need more, or a separate delta, see `cards/wsp-edit.md`), `lora_alpha = r` so the adapter adds exactly BA, `lora_dropout = 0`. Zero both A and B after creation: PEFT initializes A randomly, and a nonzero A left over is a hidden starting point.

When candidates need different ranks, attach at the maximum and fill the unused rank slots with zeros.

## Reset between candidates

**Fast path:** zero every A and B. Zeroing A as well as B means a module the next candidate does not touch carries nothing from the previous one. **Slow path:** reload from disk only after `merge_and_unload` has folded an adapter into the base, or when switching models.

## Snapshot and revert (WSP-style keep-if-better)

Before applying a candidate, keep a CPU copy of the adapter tensors it will change; revert by copying back. The bench step always ends with a reset; the compiler's own probe experiments end with a revert.

## Export

- **Merged weights:** `merge_and_unload()`, then `save_pretrained` to `exports/<candidate-id>/` with the tokenizer. If the session model is 4-bit, reload the base in full precision first, attach and copy the adapter, then merge: merging into quantized weights requantizes them and loses precision, and the quantization-error caveat applies either way (`cards/directional-ablation.md`).
- **Adapter only:** save the adapter; record the base model id and revision it applies to.
- **Non-LoRA deltas** (side paths, `cards/wsp-edit.md`): export merged only. Load the base in full precision, apply the stored delta with `copy_`, merge any LoRA part, save. An adapter-only export cannot carry them; refuse it and say why.
- Never the model's own folder; never overwrite an existing export folder. Write a short model card: base model, technique, behaviour, vault scores, the manifest's hash.

## Self-check

1. After attach and zeroing, model outputs on 5 probe prompts are bit-identical to the unwrapped model's (greedy).
2. Apply a candidate, reset, re-run: bit-identical to step 1.
3. Merged export reloaded from disk reproduces the adapter model's greedy outputs on 5 probe prompts.
