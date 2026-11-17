# Card — The semantic branch: closed models

**What it buys.** The standard recipe on a model whose weights you cannot touch. The edit becomes a prompt operator; every geometric quantity is measured on embeddings of sampled responses; the run's prompt compiler writes the operators and Alchemist converges them.

## Scope

Behaviour and style traits: slop, sycophancy, verbosity, humor, tone, looping, formatting habits. A result here is "this model **with this operator**", never a change to the model; it costs the operator's tokens on every call, a user's own instructions can override it, and it may not survive a model update.

## Sampling

You reach the model through the sampling command recorded in the brief (a headless agent invocation or an API call). Check the available flags for appending or replacing a system prompt, restricting tools, and returning JSON; record the exact command in the brief. Measure under the same wrapper for every condition, so the wrapper is a constant, not a confound. Sample n = 3 responses per prompt (sampling settings are not exposed here; repetitions estimate the noise). Every sample counts against the brief's sample budget.

## Embeddings

Use the strongest embedding model available locally; choose it yourself, record it, and keep it fixed for the run. Embed full responses (truncate consistently if needed). All distances below are cosine distances on normalized embeddings.

## Conditions and geometry (the map)

On probe prompts, sample three sets: **base** (the prompt as is: the model's default behaviour), **good** (the prompt with the good-condition instruction), **neutral** (the probe-neutral prompts, as is). Compute:

- behaviour axis a = normalize(mean emb(base) − mean emb(good)): the semantic analogue of r̂;
- separability of base vs good (logistic probe on half, accuracy on the other half);
- the noise floor: drift between two independent sample sets of the neutral prompts with no operator.

**Feasibility gate.** If base and good are not separable (accuracy < 0.65), the instruction does not move the behaviour enough to measure: verdict **absent** for prompt-space steering. Otherwise **switchable**.

## Candidate operators

An operator is text placed as a system prompt, a prefix or a suffix (`references/coordination.md`, operator spec). The compiler is `roles/operator-compiler.md`, which sends the run's prompt compiler the design request; operators are never written inline. Candidate zero (the floor) is the good-condition instruction used verbatim.

## Measurements per candidate (bench)

- **Behaviour (ARA analogue):** for dev base-condition prompts answered with the operator, pull = mean kNN_k(emb, E_good) and push = mean kNN_k(emb, E_base), k = 5, computed against the embeddings of the probe good and base sets; plus the LLM behaviour judge's rate.
- **Preservation:** drift on neutral prompts = mean over prompts of (1 − cos(mean emb with operator, mean emb without)), reported as a multiple of the noise floor; plus the preservation judge on paired responses (intent and correctness kept).
- **Behaviour meter file:** write pull, push, k and the keyword rate (when the behaviour has markers) to `behaviour_meter.json`, drift to `preservation_meter.json` (`references/coordination.md`, Bundle).
- **Capability:** a fixed slice of a generative task with checkable answers (default GSM8K, exact match), accuracy with and without the operator.
- **Cost:** operator tokens.

Default preservation tiers: drift ≤ 2.0×, 1.5×, 1.2× the noise floor.

## Self-check

1. Two independent sample sets of the same condition must give separability within 0.5 ± 0.1; if not, the embedder or the sampling is leaking something other than the response.
2. The floor operator (good instruction verbatim) must move dev base-condition responses toward the good set: pull decreases versus no operator. If it does not, re-check the gate.
