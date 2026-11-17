# Card — Floor, tiers, front, vault, head-to-head

**What it buys.** The two guarantees that make "better than the baseline" a measured claim: the tournament starts from the baseline's result, and every claim is scored once on prompts no decision ever touched.

## Floor (Phase 3)

Candidate zero is the baseline run done by you from the cards: the brief's modifier (ARA by default), the standard search ranges, multi-objective TPE with the standard settings, the standard meters, on the dev split. The tournament can therefore only match or improve it; in the worst case Schism returns the baseline answer with better measurement. On the semantic branch the floor is the good-condition instruction used verbatim as the operator: the honest baseline for "can an optimized operator beat just asking?".

## Tiers and the ratchet (Phase 4)

A tier is a preservation threshold (default first-token KL ≤ 0.40, 0.20, 0.10). Each tier is one Alchemist run with `halt: all_pass`, seeded with the best candidate so far. Converged → the candidate joins the front and seeds the next, tighter tier. A proven barrier → stop: the previous tier is the tightest this model, behaviour and budget support. The behaviour target stays fixed (candidate zero's dev rate unless the brief is stricter), so the ratchet buys preservation at equal removal, the axis where the baseline front is usually weakest.

## Front

The front is the union of the floor's Pareto trials and the tournament's converged candidates, reduced to the non-dominated set on (behaviour, preservation) after the vault pass. Report capability and weights changed alongside each point; let them break ties.

## Vault and the winner's curse

Every score used to pick a candidate is biased in that candidate's favour: among many candidates of similar true quality, the one that did best on these particular prompts gets picked. With 100 trials and 100 prompts the picked trial's reported rate can be several points per hundred better than its true rate, and the gap grows with the number of candidates and shrinks with the number of prompts. The vault removes this: sealed in Phase 1, opened once in Phase 5, every front member scored in one pass, nothing changed afterwards. If any vault content or score leaked earlier, report all scores as dev scores.

## Head-to-head (Phase 5)

Compare the best floor trial and the best tournament candidate at each tier, on vault scores:

| | Floor (baseline) | Schism, tier k |
|---|---|---|
| behaviour (keyword meter) | | |
| behaviour (LLM judge) | | |
| preservation (KL / drift) | | |
| capability (benchmark slice, full task) | | |
| weights changed / operator tokens | | |
| cost: GPU hours, model tokens, probe calls | | |

Call a difference real only if it exceeds the vault's sampling noise: for a rate p on n prompts, report a 95% Wilson interval; for mean KL or drift, a 95% bootstrap interval over prompts (2 000 resamples, seeded); say "no measurable difference" when intervals overlap. A Schism result that matches the floor at higher cost is a valid, reportable outcome.

## Self-check

1. Wilson interval for 5 of 100 at 95%: [0.0215, 0.1118] (to 4 decimals).
2. Pareto reduction on the toy set {(0.1, 0.5), (0.2, 0.2), (0.3, 0.1), (0.25, 0.3), (0.1, 0.6)} (both minimized) returns exactly {(0.1, 0.5), (0.2, 0.2), (0.3, 0.1)}.
3. The bootstrap interval of a constant sample has zero width; the same seed gives the same interval twice.
