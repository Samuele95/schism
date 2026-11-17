# Reading room

Setting: `cards: full`. Pages whose text comes from the package are rendered from the package file at build time (stage 4) and carry `data-source="<path in the package>"`; pages written from the brief carry `data-claim` on each factual element.

## Pages

| Path | Title | What it contains | Where its text comes from |
|---|---|---|---|
| `read/index.html` | Schism | what it is, who it is for, what a run hands back, the family, the five phases in one line each, the two branches in one line each; the contents of the reading room | brief sections 1–4, 6 (with claim ids) |
| `read/skill.html` | The skill | the whole skill: ground rules, doubt, the run, failure modes, report | `schism-package/schism/SKILL.md` |
| `read/run.html` | The run, phase by phase | Frame, Map, Floor, Tournament, Seal, with the run folder | `schism-package/schism/references/run-protocol.md` |
| `read/branches.html` | Two branches | the weights branch and the semantic branch, what an edit is in each, how results are worded | brief section 5 (with claim ids), linking to the semantic-branch card |
| `read/coordination.html` | Coordination | roles, contracts, information flow, failure handling | `schism-package/schism/references/coordination.md` |
| `read/cards/stream-and-capture.html` | The residual stream, its writers, and capture | card | `schism/cards/stream-and-capture.md` |
| `read/cards/response-prefix.html` | Response prefix | card | `schism/cards/response-prefix.md` |
| `read/cards/contrast-design.html` | Contrast design, presets and splits | card | `schism/cards/contrast-design.md` |
| `read/cards/directions.html` | Directions | card | `schism/cards/directions.md` |
| `read/cards/directional-ablation.html` | Directional ablation and MPOA | card | `schism/cards/directional-ablation.md` |
| `read/cards/ara.html` | ARA: Arbitrary-Rank Ablation | card | `schism/cards/ara.md` |
| `read/cards/lora-lifecycle.html` | LoRA lifecycle | card | `schism/cards/lora-lifecycle.md` |
| `read/cards/meters.html` | Standard meters | card | `schism/cards/meters.md` |
| `read/cards/llm-judges.html` | LLM judges and strict testers | card | `schism/cards/llm-judges.md` |
| `read/cards/tpe.html` | Multi-objective TPE | card | `schism/cards/tpe.md` |
| `read/cards/floor-and-front.html` | Floor, tiers, front, vault, head-to-head | card | `schism/cards/floor-and-front.md` |
| `read/cards/reproducibility.html` | Workbench, pins, manifest, calibration | card | `schism/cards/reproducibility.md` |
| `read/cards/feasibility-and-locate.html` | Locating a behaviour, and the feasibility gate | card | `schism/cards/feasibility-and-locate.md` |
| `read/cards/wsp-edit.html` | WSP-style weight edits | card | `schism/cards/wsp-edit.md` |
| `read/cards/semantic-branch.html` | The semantic branch | card | `schism/cards/semantic-branch.md` |
| `read/roles/cartographer.html` | Cartographer | role prompt | `schism/roles/cartographer.md` |
| `read/roles/smith.html` | Smith | role prompt | `schism/roles/smith.md` |
| `read/roles/operator-compiler.html` | Operator compiler | role prompt | `schism/roles/operator-compiler.md` |
| `read/roles/tester-behaviour.html` | Behaviour tester (T1) | role prompt | `schism/roles/tester-behaviour.md` |
| `read/roles/tester-preservation.html` | Preservation tester (T2) | role prompt | `schism/roles/tester-preservation.md` |
| `read/roles/tester-capability.html` | Capability tester (T3) | role prompt | `schism/roles/tester-capability.md` |
| `read/roles/tester-goodhart.html` | Goodhart tester (T4) | role prompt | `schism/roles/tester-goodhart.md` |
| `read/roles/arbiter.html` | Arbiter | role prompt | `schism/roles/arbiter.md` |
| `read/install.html` | Install and run | requirements, install, starting a run, models, rough cost, where results land | `schism-package/USAGE.md` |
| `read/glossary.html` | Glossary | every term the site uses | brief section 12 (with claim ids) |

All `schism/…` paths are inside `schism-package/`.

## Navigation

- A fixed left column (top bar on phones): **Overview** · **The skill** · **The run** · **Two branches** · **Coordination** · **Cards** (15, in the order of the brief's section 9) · **Roles** (8, in the order of section 8) · **Install and run** · **Glossary** · **← The film**.
- Each page ends with previous / next links in that order.
- In rendered package pages, every mention of another package file in code (`cards/ara.md`, `roles/smith.md`, `references/run-protocol.md`, `assets/…`) links to its page when one exists.
- The header of every page is a dim, static still of the film's held cut: the space as a quiet fragment, no motion.
- The film links into the reading room from S13 ("Read the method →"), and every scene's copy block carries a small "read" link (below) that is visible when the copy is.

## Film to page

The film supports `#s1` … `#s13` in its address: on load or hash change it scrolls to that scene's start. Each reading-room page that a scene points to carries a "← back to the film" link to that scene.

| Scene | Page | Back link |
|---|---|---|
| S1 The title | `read/index.html` | `../#s1` |
| S2 The matter | `read/index.html` | `../#s2` |
| S3 The promise | `read/index.html` | `../#s3` |
| S4 What comes back | `read/index.html#what-comes-back` | `../#s4` |
| S5 Two branches | `read/branches.html` | `../#s5` |
| S6 I · Frame | `read/run.html` (Phase 1) and `read/cards/contrast-design.html` | `../#s6` |
| S7 II · Map | `read/cards/feasibility-and-locate.html` | `../#s7` |
| S8 III · Floor | `read/cards/floor-and-front.html` | `../#s8` |
| S9 IV · Tournament | `read/coordination.html` | `../#s9` |
| S10 The collapse | `read/cards/directional-ablation.html` | `../#s10` |
| S11 The gloss | `read/cards/lora-lifecycle.html` | `../#s11` |
| S12 V · Seal | `read/cards/floor-and-front.html` | `../#s12` |
| S13 The ending | `read/index.html` | `../#s13` |

A page reached from several scenes links back to the first of them.
