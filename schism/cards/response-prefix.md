# Card — Response prefix: putting the decision token where answers diverge

**What it buys.** First-token measurements (KL, direction reads) that mean something on reasoning models and on models whose answers share an opener.

## Why

If every answer starts with `<think>` or a fixed phrase, the first-token distribution is nearly identical for every prompt: KL shows no damage when there is a lot, and a 100-token behaviour budget is spent thinking before the model says yes or no. Append a prefix to every prompt so generation begins where answers differ.

## Procedure (in order)

Known chain-of-thought pairs: `<think>`/`</think>`; `<|channel|>analysis<|message|>` / `<|end|><|start|>assistant<|channel|>final<|message|>`; `<thought>`/`</thought>`; `[THINK]`/`[/THINK]`. Add others you find in the template.

1. Render a dummy chat with the template (`add_generation_prompt=True`). If it already ends with a **closed** block (open tag then close tag), the prefix is empty.
2. If it ends with only the **opening** tag, the prefix is the closing tag; then do the re-check of step 4 (generate once more with it appended, to pick up a newline the model always emits after the block).
3. Otherwise generate answers (greedy, short) to 200 test prompts (100 per condition, from the probe split) and take their **longest common string prefix**, with trailing spaces stripped (spaces only, not newlines; use `rstrip(" ")`) so a lone space token is never kept, while a newline the re-check depends on survives.
4. If that prefix starts with an opening CoT tag, replace it with the closed block (open + close). Then repeat step 3 once with this prefix appended, to pick up a trailing newline the model always emits after the block.
5. Append the final prefix to every prompt for every generation and first-token measurement in the run.

## Traps

- Chat templates may insert today's date (gpt-oss). Pin `strftime_now` to a fixed date (e.g. 2026-01-01) so prompts are identical across days.
- A prefix detected on one system prompt may change under another; detect it with the run's actual system prompts.
- On the semantic branch there is no prefix: you do not control the template. Measure on full responses instead (`cards/semantic-branch.md`).

## Self-check

After appending the prefix, generate one token for 20 neutral and 20 bad-condition probe prompts. The two first-token distributions should differ visibly (total variation distance above ~0.2). If they are near-identical, the prefix is wrong or missing.

## Ledger

The detected prefix (exact string, escaped), which step produced it, the self-check's total variation.
