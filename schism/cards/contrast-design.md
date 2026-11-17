# Card — Contrast design, presets and splits

**What it buys.** The definition of the behaviour. Every direction, kNN target and judge in the run is only as specific as the contrast it was built from: choosing the prompt sets *is* defining the behaviour.

## Two ways to build a pair

- **Different datasets** (the default, sycophancy, humor, emotions presets): good prompts from one source, bad from another. Easy, but whatever else separates the sources (topic, length, phrasing) leaks into the contrast. Harmful requests are about weapons and drugs; harmless ones about recipes and poems; the mean difference carries both refusal and topic.
- **Same prompts, opposite instructions** (the slop and verbosity presets): identical prompts on both sides, with opposite system prompts or prefixes ("avoid clichés" vs "make extensive use of clichés"). Topic cancels exactly; only what the instruction induced remains. Prefer this whenever the behaviour can be induced by instruction.

With the instruction pattern, the edit learns to map "instructed bad" onto "instructed good". Whether that removes the behaviour the model shows **uninstructed** is a separate question, answered by scoring on neutral-prefix prompts (the slop preset does exactly this). Which condition a scorer's prompts carry decides which question the run answers: the sycophancy preset scores *with* the flattering system prompt on, so it measures resistance to being told to flatter, not default habits. Write down which question your run answers.

## Presets (datasets on Hugging Face)

| Behaviour | Good prompts | Bad prompts | Behaviour meter (prompts) | Preservation meter |
|---|---|---|---|---|
| Refusals | `mlabonne/harmless_alpaca` train[:400] | `mlabonne/harmful_behaviors` train[:400] | 33 refusal markers, harmful_behaviors test[:100], 100 tokens | first-token KL, harmless_alpaca test[:100] |
| Slop | `llm-aes/writing-prompts` train[:500] + "Avoid literary cliches, purple prose, and flowery language." | same prompts + "Make extensive use of literary cliches, purple prose, and flowery language." | slop markers, writing-prompts train[1000:1100], neutral prefix, 300 tokens | KL on the same held-out prompts with the "avoid" prefix |
| Sycophancy | harmless_alpaca train[:400] | `UnstableLlama/praise` train[:210] + "extraordinarily warm and admiring" system prompt | sycophancy markers, praise train[210:288] with that system prompt | KL, harmless_alpaca test[:100] |
| Humor | harmless_alpaca train[:400] | `UnstableLlama/jokes` train[:200] | humor markers, jokes train[200:250], 300 tokens | KL, harmless_alpaca test[:100] |
| Verbosity | harmless_alpaca train[:400] + hyper-terse system prompt | same + loquacious system prompt | response length (minimize) | PIQA acc_norm (maximize), no KL |
| Emotions | `VINAY-UMRETHE/Positive-Prompts` train[:200] | `VINAY-UMRETHE/Negative-Prompts` train[:200] | emotion classifier: negative ↓, positive ↑ | KL — three objectives |

## The four splits

Draw them disjoint, per condition: **fit** (directions, ARA fit), **probe** (Cartographer and compiler, budgeted), **dev** (testers, floor search, anchors), **vault** (Phase 5 only, sealed). Include a **neutral** set in probe (50, for probe-side KL and drift), dev and vault (100 each): prompts unrelated to the behaviour, the preservation material. When a source has a train/test split, fit from train and dev/vault from test. Record dataset commits (`cards/reproducibility.md`).

## Confound audit (run in Phase 1, record each answer)

1. **Topic.** Embed the good and bad prompts (not responses); train a linear probe to separate them. Accuracy far above chance on prompts alone means the pair separates on content before the model does anything; prefer the instruction pattern or match topics.
2. **Length and format.** Compare prompt length distributions; a large gap leaks into directions.
3. **Which question.** State whether dev and vault score the instructed or the uninstructed behaviour, and why.
4. **Lexical Goodhart.** If any meter is a keyword list, list three ways a model could avoid every marker and still show the behaviour (synonyms, caveats moved elsewhere, refusing by changing the subject). The Goodhart tester gets this list.
5. **Silence.** Confirm an empty or near-empty answer cannot score well on the behaviour meter (`cards/meters.md`, the empty-answer rule).

## Self-check

The good and bad conditions must differ in the model's *responses*, not just in your intent: sample 20 probe prompts per condition from the unedited model, have the behaviour rubric score them, and confirm the bad condition's BAD-rate is higher with non-overlapping 95% Wilson intervals. If not, the pair does not elicit the behaviour on this model.
