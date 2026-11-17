# Card — The residual stream, its writers, and capture

**What it buys.** The physical picture every weights-branch technique rests on: where "what the model is about to say" lives, which matrices can change it, and how to read it.

## The model as a bus

In a pre-norm decoder, each layer ℓ reads a normalized copy of the running vector and adds its result back:

```
h_ℓ   = x_ℓ + W_O^(ℓ) · attn(Norm x_ℓ)
x_ℓ+1 = h_ℓ + W_down^(ℓ) · mlp(Norm h_ℓ)
x_L   = x_0 + Σ_ℓ ( W_O^(ℓ) a_ℓ + W_down^(ℓ) m_ℓ )
```

Components never talk directly; everything passes through the stream, and only the **writers** put anything into it. Editing writers controls everything downstream without touching attention patterns or non-linearities.

**Writers, by role** (collect them per layer; names vary by architecture):
- `attn.o_proj` role: `self_attn.o_proj`; `linear_attn.out_proj` (Qwen3.5 GatedDeltaNet); `o_b_proj` (DeepSeek V4); convolution `out_proj` (LFM).
- `mlp.down_proj` role: `mlp.down_proj`; every MoE expert's `down_proj` / `w2` / `output_linear`; shared experts.

To discover them on an unknown architecture: list every `nn.Linear` (or quantized linear) whose `out_features == hidden_size` inside each decoder layer, then confirm by checking that its output is added to the residual in the layer's `forward`. Read the forward source rather than guessing from names.

PyTorch stores `Linear.weight` as `(out, in)`. For a writer, rows index the stream: a stream direction v acts on rows, so v-related edits are `v @ W` (that is vᵀW) and outer products `v ⊗ (vᵀW)`.

## The decision token

Read the stream at the **last prompt token**, after the chat template and any response prefix (`cards/response-prefix.md`): in a causal model it is the only position that has attended to the whole prompt, and its state is about to become the first response token.

- **Pad left.** Set `tokenizer.padding_side = "left"` before batching, so index −1 is a real token for every prompt. Right padding silently reads pad positions.
- **Index shift.** With `output_hidden_states=True`, Hugging Face returns L+1 tensors: index 0 is the embedding output, index i is the stream *after layer i−1*. The direction for the writers of layer ℓ is computed from index ℓ+1.
- **Generate one token** (`max_new_tokens=1`, `return_dict_in_generate=True`, `output_hidden_states=True`), and keep `hidden_states[0]` (the prompt pass); take `[:, -1, :]` per layer, cast to float32. A plain forward pass is equivalent only if you build `position_ids` from the attention mask for left-padded batches; without that its numbers differ.
- **Several residual streams** (Hyper-Connections, e.g. DeepSeek V4, GLM 5.3): average the streams into one before analysis. A pragmatic reduction, not exact; record that it was applied.

## Capturing writer inputs and outputs (for ARA and WSP)

Register a forward hook on each writer module; in the hook keep `inputs[0][:, -1, :]` and `output[:, -1, :]` for the current batch, detached and moved to CPU. One generated token per prompt is enough. For MoE experts, an expert only sees the tokens routed to it, so its capture is sparse: record which prompts reached it, and expect fewer rows than prompts.

Accumulate means batch by batch in float64 on CPU when you only need means; keep full per-prompt tensors only when the technique needs them (ARA, kNN, geometry).

## Self-check

1. Pad a batch of two prompts of different lengths; confirm the token at position −1 of each row is the real last prompt token, not a pad id.
2. For one prompt and a middle layer ℓ, confirm `hidden_states[ℓ+1] − hidden_states[ℓ]` equals the sum of the two writer outputs you hooked at layer ℓ (up to dtype tolerance, ~1e-2 relative in bf16). This proves you found the right writers and the right index. Two known exceptions: the last entry of `hidden_states` already has the final norm applied (skip the last layer), and architectures with a norm *after* the writer (Gemma's post-attention and post-feedforward norms) add the normed writer output, so compare against the hooked norm outputs instead and note that any writer edit is rescaled by that norm.
3. Confirm the number of collected writers per layer matches the architecture (2 for dense layers; 1 + n_experts (+ shared) for MoE MLPs).

## Ledger

Writers found per layer, padding side, dtype, whether stream averaging was applied, self-check results.
