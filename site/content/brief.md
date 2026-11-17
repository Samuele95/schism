# Brief — what the Schism site may say

Source: the repository (README.md, USAGE.md, CHANGELOG.md, CITATION.cff, schism/, delivery/). Every statement in sections 1–12 cites claim ids from section 13. Terms are defined in section 12 the first time they matter; the site uses the package's own words for them.

## 1. In one sentence

Schism injects, tunes or ablates one behaviour of a language model, by intervening in its weight space and on its internal representations or, on closed models, through a prompt operator, while leaving the rest of it as it was; and it proves both halves of that claim. [C-01, C-02, C-05, C-16, C-75]

## 2. In one paragraph

Schism is an agent skill, a method written as technique cards and role prompts that a capable LLM agent carries out itself: the package contains no code, so the agent implements each technique from its card, self-checks it and keeps it for later runs. [C-06, C-11] It works on one behaviour at a time, such as slop, sycophancy, verbosity, humor, tone or looping, and it can do three things with it. Ablating and injecting read the same contrast pair in opposite directions, removing a behaviour the model shows or making the default one it shows only when asked, and tuning sets the strength of either. [C-01, C-75, C-76] On an open model the edit is a change to the weights, computed from the model's internal representations; on a closed one it is a prompt operator measured in embedding space. [C-02, C-15, C-16] The search runs as an Alchemist tournament, every prompt comes from a prompt compiler, and the results are judged once on a sealed vault against a baseline floor. [C-03, C-74] It serves LLM ablation, customisation without a fine-tuning dataset, and locating a behaviour ("where does X live in this model"), while gradient fine-tuning on a corpus and the editing of facts or knowledge are outside it. [C-04, C-77]

## 3. What a run hands back

- **The report** (`seal/report.md`) opens with one sentence that names the chosen candidate, gives its vault behaviour and preservation scores and compares it with the floor. The front and the head-to-head against the floor follow, and the report closes with what needs the user's attention: deviations, inconclusive gates, exhausted budgets, anything that leaked. [C-65, C-66]
- **The export** (`exports/<candidate-id>/`): the chosen candidate, as merged weights or an adapter, always in a new folder, never the model's own. [C-31, C-54] On the semantic branch the deliverable is an operator: "this model with this operator". [C-17]
- **The ledger** (`ledger.md`): the append-only record of the whole run: phases, hypotheses, budgets, deviations, decisions. [C-12, C-65]
- **The manifest** (`seal/manifest.json`): what is needed to replay the run: brief, workbench file hashes, every front candidate's spec, vault scores, environment, file hashes. [C-55]
- When the feasibility gate closes, the run hands back a report of what was measured and why the gate closed: "a result, not a failure". [C-25]

## 4. The run

Five phases. [C-20]

| Phase | Purpose | In | Out | Over when |
|---|---|---|---|---|
| 1 Frame | Turn the behaviour into a run brief. [C-21] | the behaviour, the model | brief.yaml: branch, model, contrast pair, four splits, meters, budgets, preservation tiers; behaviour and preservation rubrics from the prompt compiler; confound audit [C-21, C-22, C-51] | the brief is complete, the vault is sealed and hashed, the ledger holds the Frame entry; on present deployment the user confirms the brief [C-21] |
| 2 Map | Find where the behaviour lives, and whether there is anything to switch off. [C-24] | fit and probe splits; a mapping budget [C-42] | `map/report.md`: hypotheses with evidence, and a feasibility verdict [C-24, C-25] | a verdict: switchable or diffuse → Phase 3; absent → the run stops with a report; inconclusive → Phase 3 as diffuse [C-25] |
| 3 Floor | Run the baseline pipeline. [C-26] | the dev split, the standard meters | Pareto trials; candidate zero; reference rates [C-26] | candidate zero is chosen and the behaviour target is fixed from it [C-30] |
| 4 Tournament | Search for a better candidate, tier by tier. [C-28] | candidate zero; the role prompts | converged candidates (the front), or a proven barrier [C-28] | every tier converged, or a barrier stopped the ratchet [C-28] |
| 5 Seal | Score once on the vault and decide. [C-31] | the front; the sealed vault | vault scores, head-to-head, report, manifest, export [C-31] | report, manifest and export exist and the ledger points to them [C-31] |

## 5. Two branches

The **weights branch** is for open-weight models loaded locally or on a remote GPU. There the edit is a change to the matrices that write into the residual stream, stored as a LoRA adapter on a scratch copy and never written over the original, and preservation is measured as first-token KL on neutral prompts. [C-15, C-07, C-48]

The **semantic branch** is for closed models, which have no weights to touch. The edit becomes a prompt operator, every geometric quantity is measured on embeddings of sampled responses, and preservation is drift expressed as a multiple of the sampling noise floor. Because nothing in the model changes, results are worded "with this operator" and never as a change to the model. [C-16, C-17, C-58]

On both branches the same three operations apply: ablating a behaviour, injecting one the model shows only when asked, or tuning the strength of the edit. [C-75, C-76]

## 6. The family

| Skill | Owns |
|---|---|
| Schism | the method: technique cards, contrast design, the map, the feasibility gate, the floor, the vault, the front, the ledger, export [C-13] |
| Alchemist (required) | the search: compiler → isolated testers → judge with history, to convergence or a proven barrier [C-13] |
| Prompt compiler (required; Prometheus recommended) | every prompt: rubrics, role prompts, operator candidates. Any map from a prompt to a prompt: Prometheus, a plain LLM call, or anything else [C-13, C-14, C-74] |
| WSP — Weight Space Programming (optional) | general weight reading and writing, when installed [C-13] |

## 7. Ground rules

- **Never overwrite weights**, because the original is the reference every number is measured against. [C-07]
- **Four disjoint prompt splits, fixed at the start** (fit, probe, dev, vault), because every number used to choose a candidate is optimistic about that candidate; only a split no decision touched tells the truth. [C-08, C-09]
- **Budgets are part of the experiment**, because a result without its budget is not interpretable. [C-10]
- **Implement, then self-check, then trust**: a failed self-check stops that technique. [C-11]
- **The ledger is the run's memory**: reread at every phase and after any context compaction. [C-12]
- **Every prompt comes from the prompt compiler**, whatever implements it; a prompt written inline inside a run is a defect. [C-14, C-74]

## 8. Roles

| Role | Job | Sees | Writes |
|---|---|---|---|
| Cartographer | maps where the behaviour lives; gives the feasibility verdict; read-only on the model [C-24, C-39] | the brief's behaviour, branch, model, contrast blocks; fit and probe splits; never judges, rubrics, dev or vault [C-39] | `map/report.md` |
| Smith | the compiler on the weights branch: one candidate weight edit per call [C-36] | the target, the map, the cards, the probe split, the judge's fixes; never verdicts, dev or vault [C-36] | an edit spec |
| Operator compiler | the compiler on the semantic branch: one candidate operator per call, produced by the run's prompt compiler [C-14, C-36, C-74] | the target, the map, the probe split, the judge's fixes [C-36] | an operator spec |
| Behaviour tester (T1) | checks that the rate of BAD responses is at or below the target [C-79] | its projection: dev bad-condition responses, rubric, target [C-37] | a verdict |
| Preservation tester (T2) | checks that no neutral response changed beyond the tier's threshold [C-79] | neutral response pairs, the preservation meter, the tier's threshold [C-37] | a verdict |
| Capability tester (T3) | checks that accuracy on the capability task has not dropped by more than allowed [C-79] | the capability task's items and outputs [C-37] | a verdict |
| Goodhart tester (T4) | checks the behaviour was removed, not gamed [C-50] | the whole bundle and the edit [C-37, C-50] | a verdict |
| Arbiter | the judge: diagnoses failures across all four constraints and proposes one fix [C-38, C-71] | verdicts, full history, the candidate's recipe; never bundles or raw responses [C-38] | diagnosis and one fix |

## 9. Technique cards

| File | Name | What it buys |
|---|---|---|
| `cards/stream-and-capture.md` | The residual stream, its writers, and capture | the physical picture every weights-branch technique rests on [C-59] |
| `cards/response-prefix.md` | Response prefix | first-token measurements that mean something on reasoning models [C-53] |
| `cards/contrast-design.md` | Contrast design, presets and splits | the definition of the behaviour [C-51, C-52] |
| `cards/directions.md` | Directions: difference of means, winsorization, projection | one direction per layer: the input to directional ablation and a localisation instrument [C-46] |
| `cards/directional-ablation.md` | Directional ablation as a LoRA edit, and MPOA | stop the writers adding a direction to the stream, optionally keeping row lengths [C-45] |
| `cards/ara.md` | ARA: Arbitrary-Rank Ablation | the default modifier: no direction, no rank-1 assumption [C-44] |
| `cards/lora-lifecycle.md` | LoRA lifecycle: attach, reset, export | every edit reversible; the original never changes [C-54] |
| `cards/meters.md` | Standard meters | cheap numbers on the real edited model, the floor's objectives [C-48] |
| `cards/llm-judges.md` | LLM judges and strict testers | behaviour judged by reading responses, not by matching words [C-49] |
| `cards/tpe.md` | Multi-objective TPE | the search engine for the floor and for numeric knobs [C-57] |
| `cards/floor-and-front.md` | Floor, tiers, front, vault, head-to-head | "better than the baseline" as a measured claim [C-27, C-33, C-34] |
| `cards/reproducibility.md` | Workbench, pins, manifest, calibration | a run someone else can replay [C-55] |
| `cards/feasibility-and-locate.md` | Locating a behaviour, and the feasibility gate | an evidenced hypothesis about where; an early stop when there is nothing to switch off [C-25, C-72] |
| `cards/wsp-edit.md` | WSP-style weight edits | edits narrower than a layer band [C-56] |
| `cards/semantic-branch.md` | The semantic branch: closed models | the standard recipe on a model whose weights you cannot touch [C-58] |

## 10. Failure modes the package names

- **Fitting to the judge**: a compiler that learns what the tester rewards swaps words instead of removing behaviour; the compiler sees fixes, never verdicts, and the Goodhart tester exists for this. [C-43, C-36]
- **Reading the vault early** turns it into another dev split. [C-43]
- **Trusting a technique you did not check**: the subtle details are where confident wrong results come from. [C-43]
- **Calling a prompt operator a model edit.** [C-43, C-17]

## 11. Install and run

- **Requirements** [C-60]: skills `schism`, `alchemist`; a prompt compiler (`prometheus` recommended, or a plain LLM call); WSP optional. Weights branch: a machine that loads the model in bf16 or 4-bit, Python ≥ 3.10, torch, transformers, peft, accelerate, optuna, scikit-learn, datasets; optional bitsandbytes, lm-eval. Semantic branch: a headless LLM agent invocation, a local embedding model the agent chooses, sentence-transformers, scikit-learn.
- **Install**: place `schism/` next to `alchemist/` (and `prometheus/`, if it is the compiler) in the agent's skills folder. [C-60]
- **Start a run** [C-61]: interactive ("Use Schism to reduce slop in Qwen3-4B-Instruct. I'm here, ask me if something is ambiguous."); unattended overnight (write the brief, set `deployment: unattended` and `approved: true`); closed model ("Use Schism on the semantic branch to make this model less sycophantic.").
- **First run**: a calibration run on a small open model (about 1–2B parameters) with the slop preset. [C-62]
- **Models**: the strongest available model, with extended thinking, for the orchestrator, Cartographer, Smith, Arbiter and Goodhart tester; the other testers may run locally at temperature 0 after calibration. [C-63]
- **Cost**: rough, not measured. [C-64]
- **Models and libraries the package names** (the only ones the site may name): Qwen3-4B-Instruct, Qwen3.5-0.8B, Gemma 3 270M, gpt-oss, DeepSeek V4, GLM 5.3, LFM (architecture examples); PyTorch, transformers, PEFT, accelerate, Optuna, scikit-learn, datasets, bitsandbytes, lm-evaluation-harness, sentence-transformers; Hugging Face datasets of the presets; the classifiers `VINAY-UMRETHE/Refusal-Classifier` and `j-hartmann/emotion-english-distilroberta-base`; benchmarks GSM8K, PIQA, MATH-500. [C-60, C-47, C-52, C-59, C-48]

## 12. Glossary

| Term | Definition |
|---|---|
| behaviour | one observable trait of a model's responses, defined by a pair of sentences: bad, the side the edit moves away from, and good, the side it moves toward (the behaviour's absence when ablating, the instructed behaviour when injecting) [C-22, C-75] |
| contrast pair | the two prompt sets that define the behaviour; "choosing the prompt sets is defining the behaviour" [C-51] |
| residual stream | the running vector each layer reads and adds to; components never talk directly, everything passes through it [C-59] |
| writer | a matrix that puts something into the residual stream (attention output, MLP down-projection) [C-59] |
| decision token | the last prompt token, where the model's state is about to become the first response token [C-59] |
| direction | a unit vector summarising how the stream differs between bad and good prompts at the decision token; a contrast, not a concept [C-46] |
| directional ablation | stopping the writers from adding a direction to the stream [C-45] |
| MPOA | Magnitude-Preserving Orthogonal Ablation: directional ablation that keeps each writer row at its trained length [C-45] |
| ARA | Arbitrary-Rank Ablation: each writer's edit fitted so bad outputs land among real good outputs while good outputs stay put [C-44] |
| LoRA adapter | a small low-rank addition to a matrix; reversible, stored apart from the original [C-54] |
| prompt operator | text placed as a system prompt, prefix or suffix: the edit on the semantic branch [C-16, C-58] |
| fit / probe / dev / vault | the four disjoint prompt splits: fitting; budgeted exploration; testing; the sealed final score [C-08] |
| neutral prompts | prompts unrelated to the behaviour: the preservation material [C-51] |
| floor | the baseline result, done from the cards; candidate zero is its best trial [C-26] |
| candidate | one proposed edit or operator, as a reproducible recipe [C-41] |
| bench | the orchestrator's mechanical step that turns a candidate into a measurement bundle; it decides nothing [C-41] |
| tier | a preservation threshold; the tournament runs once per tier, loosest first [C-28, C-29] |
| ratchet | moving to the next, tighter tier after convergence [C-28, C-30] |
| barrier | a proven failure of two constraints to hold together; it ends the ratchet [C-28] |
| front | the non-dominated candidates on behaviour and preservation [C-31] |
| tournament | the Alchemist loop: compiler → isolated testers → judge with history [C-13] |
| feasibility gate | the Map's verdict on whether there is anything to switch off [C-25] |
| first-token KL | how much the edit moves the model's first answer token on neutral prompts [C-48] |
| drift / noise floor | on the semantic branch, how far neutral responses move, against how far two unedited samples differ [C-58] |
| Goodhart | satisfying the measurement instead of the target [C-50] |
| winner's curse | the bias that makes the chosen candidate's own score look better than it is [C-34] |
| ledger | the run's append-only memory [C-12] |
| workbench | the agent's checked implementations, kept across runs [C-11, C-55] |

## 13. Claims

| Id | Claim | Source | Qualifier |
|---|---|---|---|
| C-01 | Schism injects, tunes or ablates (and inspects) one behaviour of a language model, such as slop, sycophancy, verbosity, humor, tone, looping, or a register or style it should keep. | schism/SKILL.md › description | examples, not a closed list |
| C-02 | It works through contrast pairs, activation geometry and weight edits (directional ablation, MPOA, ARA, WSP-style sparse surgery), or, on closed models, through prompt operators measured in embedding space. | schism/SKILL.md › description | |
| C-03 | The search runs as an Alchemist tournament, every prompt comes from a prompt compiler (any map from a prompt to a prompt; Prometheus by default), and results are judged once on a sealed vault against a baseline floor. | schism/SKILL.md › description | |
| C-04 | Use it to abliterate, reduce or remove a behaviour, to make one the default, to find where a behaviour lives, or to steer a closed model's style: LLM ablation and customisation without a fine-tuning dataset. It is not for gradient fine-tuning on a corpus, nor for editing facts or knowledge. | schism/SKILL.md › description | |
| C-05 | The agent changes one behaviour (removing it, setting its strength, or making it the default) while leaving the rest of the model as it was, and can prove both halves of that claim. | schism/SKILL.md › intro | |
| C-06 | No toolkit is installed: the technique cards describe every method precisely enough that the agent implements it itself; the package contains no code. | schism/SKILL.md › intro; USAGE.md › What you have | |
| C-07 | Weights are never overwritten: edits live in adapters on a scratch copy and exports go to a new folder, because the original is the reference every number is measured against. | schism/SKILL.md › Ground rules | weights branch |
| C-08 | Four disjoint prompt splits are fixed at the start: fit, probe, dev and vault. | schism/SKILL.md › Ground rules | |
| C-09 | The vault is sealed, and scored once, at the end, because every number used to choose a candidate is optimistic about that candidate. | schism/SKILL.md › Ground rules; cards/floor-and-front.md | |
| C-10 | Budgets (forward passes, tournament iterations, closed-model samples) are counted in the ledger, because a result without its budget is not interpretable. | schism/SKILL.md › Ground rules | |
| C-11 | Every technique the agent implements passes its card's self-check before its output is used, then lives in the workbench; a failed self-check is a stop. | schism/SKILL.md › Ground rules | |
| C-12 | The append-only ledger is the run's memory, reread at the start of every phase and after any context compaction. | schism/SKILL.md › Ground rules | |
| C-13 | Schism owns the method, Alchemist (required) owns the search, a prompt compiler (required; Prometheus recommended) owns every prompt; WSP is optional. | schism/SKILL.md › family table; README.md | |
| C-14 | A prompt written inline inside a run, outside a recorded compiler call, is a defect: specs go to the prompt compiler. Measurement stimuli and the floor operator are the exceptions. | schism/SKILL.md › intro | |
| C-15 | On the weights branch (open-weight models, local or remote GPU) the edit is a change to the matrices that write into the residual stream, stored as a LoRA adapter. | schism/SKILL.md › Two branches | weights branch |
| C-16 | On the semantic branch (closed models) the edit is a prompt operator and every geometric quantity is measured on embeddings of sampled responses. | schism/SKILL.md › Two branches | semantic branch |
| C-17 | A semantic-branch result is "this model with this operator", never a change to the model; it costs the operator's tokens on every call and may not survive a model update. | cards/semantic-branch.md › Scope | semantic branch |
| C-18 | With a user present, Schism asks at three fixed points (the brief, borderline rubric anchors, the choice from the front); unattended, it never asks. | schism/SKILL.md › Doubt | |
| C-19 | If the data cannot support a conclusion, the run says so instead of producing a number that looks like one. | schism/SKILL.md › Doubt | |
| C-20 | A run has five phases: Frame, Map, Floor, Tournament, Seal. | schism/SKILL.md › The run | |
| C-21 | Frame turns the behaviour into a run brief, has the prompt compiler design the behaviour and preservation rubrics, audits the design for confounds and Goodhart risk, and seals the vault. | schism/SKILL.md › The run; references/run-protocol.md › Phase 1 | |
| C-22 | The behaviour is restated as two observable conditions, one sentence each: what responses look like with it and without it. | references/run-protocol.md › Phase 1 | |
| C-23 | Default split sizes: fit 400 + 400; probe 100 per condition plus 50 neutral; dev and vault 100 per condition plus 100 neutral each. | references/run-protocol.md › Phase 1 | defaults |
| C-24 | Map: the Cartographer captures activations, reads weights and attention, and writes a localisation hypothesis with evidence. | schism/SKILL.md › The run | weights branch; embedding geometry on the semantic branch |
| C-25 | The feasibility gate gives switchable, diffuse, absent or inconclusive; absent ends the run with a report, "a result, not a failure", because editing removes an obstacle and cannot add a missing ability. | schism/SKILL.md › The run; references/run-protocol.md › Phase 2 | |
| C-26 | Floor: the baseline pipeline (ARA by default, or abliteration) searched with multi-objective TPE over the standard meters; its best Pareto trial is candidate zero. On the semantic branch the floor is the good-condition instruction itself. | schism/SKILL.md › The run; references/run-protocol.md › Phase 3 | default 100 trials |
| C-27 | The tournament starts from the floor's result, so it can only match or improve it; in the worst case Schism returns the baseline answer with better measurement. | cards/floor-and-front.md › Floor | |
| C-28 | For each preservation tier, loosest to tightest, an Alchemist tournament runs; converged candidates join the front; a proven barrier ends the ratchet and is reported as the tightest feasible tier. | schism/SKILL.md › The run | |
| C-29 | Default tiers: first-token KL 0.40, 0.20, 0.10; on the semantic branch drift within 2.0×, 1.5×, 1.2× the noise floor. | references/run-protocol.md › Phase 1 | defaults |
| C-30 | The behaviour target is fixed from the floor, so the ratchet buys preservation at equal removal. | cards/floor-and-front.md › Tiers; references/run-protocol.md | default |
| C-31 | Seal: every front candidate is scored once on the vault, the best is set head-to-head against the floor, and the report, manifest and export are written. | schism/SKILL.md › The run; references/run-protocol.md › Phase 5 | |
| C-32 | The vault's hash is checked before it is opened; on a mismatch no vault score from the run is valid. | references/run-protocol.md › Phase 5 | |
| C-33 | A difference is called real only if it exceeds the vault's sampling noise (Wilson intervals for rates, bootstrap for KL or drift); a Schism result that matches the floor at higher cost is a valid, reportable outcome. | cards/floor-and-front.md › Head-to-head | |
| C-34 | Among many candidates of similar quality, the one that did best on the scoring prompts gets picked, so its own score flatters it; the vault removes this. | cards/floor-and-front.md › Vault and the winner's curse | |
| C-35 | Unattended, a live tournament needs the brief's `approved: true`; without it Schism builds the harness and stops after the floor. | schism/SKILL.md › Running Alchemist unattended; USAGE.md | |
| C-36 | The compiler never sees test results, only the corrections the judge distilled from them, because a compiler that sees which test failed learns to satisfy that test. | roles/smith.md; references/coordination.md | |
| C-37 | Each tester sees only its own projection of the bundle; only the Goodhart tester sees all of it. | references/coordination.md › Projections | |
| C-38 | The Arbiter sees every verdict and the full history, never the bundles or raw responses. | roles/arbiter.md; references/coordination.md | |
| C-39 | The Cartographer is read-only and never sees judges, rubrics, dev or vault, because the map feeds the compilers. | roles/cartographer.md; references/coordination.md | |
| C-40 | Where two models are available, testers run on a different model from the compiler. | references/coordination.md › Judge independence | |
| C-41 | Bench is the orchestrator's mechanical step: apply the candidate, run the dev split, write the bundle, reset. It decides nothing and filters nothing. | references/coordination.md › Bench | |
| C-42 | Default budgets: 6 tournament iterations per tier, 10 probe calls per iteration, 150 in total, 30 for mapping. | references/run-protocol.md; assets/run-brief.yaml | defaults |
| C-43 | The failure modes named: fitting to the judge, reading the vault early, trusting an unchecked technique, calling a prompt operator a model edit. | schism/SKILL.md › Failure modes | |
| C-44 | ARA, the default modifier, assumes no direction and no rank 1: each writer's edit is fitted so bad outputs land among its real good outputs while good outputs stay where they were. | cards/ara.md | weights branch |
| C-45 | Directional ablation stops writers adding a direction to the stream, with a per-layer strength; MPOA keeps each writer row at its trained length. | cards/directional-ablation.md | weights branch |
| C-46 | A direction is the difference of the mean stream between bad and good prompts at the decision token: a contrast between two datasets at one token, not a concept. | cards/directions.md | weights branch |
| C-47 | The Weight Space Programming paper (Takehi et al., 2026) reports early results on one model family, including a looping fix on Qwen3.5-0.8B touching 0.016% of weights, and two limits Schism keeps as rules: weights alone did not reveal sycophancy without attention patterns, and editing removed an obstacle but could not add a missing ability. | cards/feasibility-and-locate.md › What WSP showed | a cited paper's results, not Schism's; "early results, one model family"; "whether a frontier LLM can do the same is a hypothesis this run tests" |
| C-48 | The standard meters are keyword rate, first-token KL, classifier, benchmark and response length; an empty response counts as the behaviour, so silence cannot win. | cards/meters.md | |
| C-49 | Rubrics are written by the prompt compiler; testers give pass/fail only, write a reason before every label, and must label all 10 calibration anchors correctly. | cards/llm-judges.md | |
| C-50 | The Goodhart tester assumes gaming until the evidence says otherwise, and checks for synonym swaps, silence, moved behaviour, canned replies, topic damage and operator leakage. | roles/tester-goodhart.md | |
| C-51 | Choosing the prompt sets is defining the behaviour; the same-prompts, opposite-instructions pattern cancels topic exactly; a five-question confound audit is run at Frame. | cards/contrast-design.md | |
| C-52 | Presets exist for refusals, slop, sycophancy, humor, verbosity and emotions, built on public Hugging Face datasets. | cards/contrast-design.md › Presets | |
| C-53 | A response prefix puts the decision token where answers diverge, so first-token measurements mean something on reasoning models. | cards/response-prefix.md | weights branch |
| C-54 | Every weight edit is reversible: adapters are reset by zeroing; exports go to a new folder, merged or as an adapter. | cards/lora-lifecycle.md | weights branch |
| C-55 | A run can be replayed from its manifest and stored specs; agent decisions are not replayable, the ledger and the specs are. | cards/reproducibility.md | |
| C-56 | WSP-style edits act on a confirmed set of neuron columns or attention heads, narrower than a layer band, improved keep-if-better under a probe budget. | cards/wsp-edit.md | weights branch; side path experimental |
| C-57 | TPE samples 30 trials at random, then proposes where good trials are dense and the rest are sparse. | cards/tpe.md | defaults |
| C-58 | On the semantic branch the behaviour axis is measured on response embeddings; if base and good responses are not separable the gate verdict is absent; preservation is drift against a sampling noise floor. | cards/semantic-branch.md | semantic branch |
| C-59 | The residual stream is a bus: layers read it and add to it, only writers put anything into it, and the model's next answer is read at the last prompt token. | cards/stream-and-capture.md | weights branch |
| C-60 | Requirements and install as listed in the usage notes. | USAGE.md › Requirements, Install | |
| C-61 | A run starts interactive, unattended overnight, or on a closed model, with the example requests the usage notes give. | USAGE.md › Run | |
| C-62 | The first run should be a calibration run on a small open model (about 1–2B parameters) with the slop preset. | USAGE.md › Run | |
| C-63 | The orchestrator, Cartographer, Smith, Arbiter and Goodhart tester need the strongest available model with extended thinking; the other testers may run locally after calibration. | USAGE.md › Models and reasoning effort | |
| C-64 | The cost figures in the usage notes are rough, not measured. | USAGE.md › Rough cost | applies to every figure in that table |
| C-65 | Results land in the report, the export folder and the ledger. | USAGE.md › Where results land | |
| C-66 | The report leads with one sentence: the chosen candidate, its vault scores, and how it compares with the floor. | schism/SKILL.md › Report; assets/report-template.md | |
| C-67 | The workbench lives outside the run folder, so a technique checked once serves every later run on the same machine. | references/run-protocol.md › Run folder | |
| C-68 | The package ships its own verifiers and an empirical test plan; nothing in that plan was run during design. | README.md; delivery/EMPIRICAL-TEST.md | |
| C-69 | The test plan asks for a head-to-head against the baseline pipeline on two behaviours and two model sizes before drawing a general conclusion: "one run is an anecdote". | delivery/EMPIRICAL-TEST.md › B | |
| C-70 | The package was designed with Prometheus. | delivery/AUDIT.md | |
| C-71 | When behaviour and preservation keep trading places, the Arbiter changes where or how the edit acts, not how much. | roles/arbiter.md › Patterns | |
| C-72 | Mapping is where Schism extends the baseline: the baseline never asks where a behaviour lives; it edits a band and lets the search sort it out. | cards/feasibility-and-locate.md | |
| C-73 | Schism is published at github.com/Samuele95/schism under the MIT licence; its author is Samuele Stronati. | the author, 17 Nov 2026 (not in the package) | |
| C-74 | The prompt compiler is any map from a prompt (or a request for one) to a prompt: a meta-prompting skill such as Prometheus, a plain LLM call asking for that kind of prompt, or anything else. The brief names it, every call is stored, and on the semantic branch each operator is the compiler applied to the last one and the judge's fixes. | schism/SKILL.md › family; roles/operator-compiler.md | |
| C-75 | One contrast pair, symmetric: ablate when GOOD is the behaviour's absence, inject when GOOD is a behaviour the model shows only when instructed, tune by the strength of the edit (λ, ARA's weights, the operator's wording), with the preservation tiers bounding it. | schism/SKILL.md › Three operations; cards/contrast-design.md | |
| C-76 | Injection makes the model do by default what it already does on request; it cannot give it a behaviour it never produces. ARA and the semantic branch inject directly, pulling the default toward the instructed answers; directional ablation injects the same way it ablates, removing the default side's component (BAD = default, λ ≥ 1). | schism/SKILL.md › Three operations; cards/directional-ablation.md | |
| C-77 | No fine-tuning dataset is needed: on open weights the edit comes from two sets of prompts and the model's own activations, its targets being the model's own outputs on the GOOD prompts; on closed models it is an operator measured on sampled answers. There is no training corpus, though ARA still fits its adapter by optimisation. Facts and knowledge are out of scope. | schism/SKILL.md › Three operations | |
| C-78 | The first release is 0.1.0, dated 17 Nov 2026. | CHANGELOG.md; CITATION.cff | |
| C-79 | The behaviour tester passes a candidate iff the rate of responses judged BAD is at or below the target; the preservation tester iff no neutral response changed beyond the tier's threshold; the capability tester iff accuracy has not dropped by more than the allowed amount. | cards/llm-judges.md › Who writes the rubric; roles/tester-capability.md | |

## 14. Not claimable

- "Schism outperforms ARA / abliteration / the baseline." The package specifies a head-to-head per run; it reports no outcome of one, and its test plan says nothing was run during design. [C-68]
- Any removal rate, preservation score, speed, or cost as a measured fact. The package reports no run; its cost table is rough and not measured. [C-64, C-68]
- The WSP numbers (Qwen3.5-0.8B, MATH-500 7.9 → 48.1, 0.016% of weights) as Schism's results. They are a cited paper's early results on one model family. [C-47]
- "Works on any model" or "any behaviour". The gate can close; editing cannot add a missing ability; the semantic branch covers behaviour and style traits. [C-25, C-17]
- "Changes the model" for a semantic-branch result. [C-17]
- "Guaranteed", "provably safe", "lossless". Preservation is measured against tier thresholds, with intervals. [C-29, C-33]
- "Uncensored", "jailbreak", or any framing of the method around defeating safety behaviour. The package's own examples are style and quality behaviours. [C-01]
- Any version number or release date other than the first release, 0.1.0 of 17 Nov 2026 [C-78]. (Address, licence and author: C-73.)

## 15. Open questions

1. ~~**Where the package can be obtained, under what licence, and who the author is.**~~ Settled by the author on 17 Nov 2026: github.com/Samuele95/schism, MIT licence, Samuele Stronati [C-73].
2. **Refusals.** The contrast card ships a refusals preset and the meters card a default refusal marker list, but SKILL.md's examples do not include refusals. Should the film name refusals at all? Proposed reading: no; the film uses the SKILL.md examples, and the reading room shows the cards as written.
3. **Alchemist's invariants I1–I5** are referenced but defined in the Alchemist skill, not in this package. The site can state I1's content (the compiler sees fixes, never verdicts) and nothing more about the others.
4. **The WSP paper** is cited as "Takehi et al., 2026" with no title or address. The site can name it only as the package does.
5. ~~**A version or name for this edition.**~~ Settled by the author on 17 Nov 2026: the first release is 0.1.0 [C-78].
