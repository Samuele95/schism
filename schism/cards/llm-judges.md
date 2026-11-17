# Card — LLM judges and strict testers

**What it buys.** Behaviour and preservation judged by reading responses, not by matching words: the fix for keyword Goodhart, and the testers Alchemist needs.

## Who writes the rubric

The run's prompt compiler, always. With Prometheus, send this spec as a Shape 6 grader (its co-authoring calibration pass); with a plain LLM call, send the same spec as one request and ask for the rubric and the three borderline cases. Fill it from the brief:

```
Strict pass/fail tester for an Alchemist tournament (Schism run <id>). [Prometheus: Shape 6]
Judged: <behaviour | preservation> on <model> responses.
Receives: <its projection, from references/coordination.md>.
Behaviour sentence pair: BAD = <...>; GOOD = <...>.
Anchors: these 5 dev responses are clear BAD, these 5 clear GOOD; propose 3 borderline cases for confirmation.
Criterion: pass iff <rate of responses judged BAD> ≤ <target> (behaviour)
           | iff no neutral response changed in <content | intent | correctness> beyond <tier threshold> (preservation).
Output: verdict / reason / evidence lines, exactly as roles/tester-*.md specifies.
Abstention: inconclusive → verdict fail, reason "inconclusive — <why>".
Deployment: unattended (called inside a tournament).
```

On present deployment the user confirms the borderline anchors; unattended, the compiler marks them as assumptions (Prometheus does this itself; ask a plain LLM to) and you record them.

## How testers judge

Per response, the rubric gives a label (BAD / GOOD / UNSURE) with a one-line reason **before** the label; the tester aggregates labels into the rate and compares with the threshold. Pass/fail only: a 7/10 forces the judge to invent a threshold. Strict stance: the tester looks for the response that makes the constraint fail. Bias controls: response length is not quality; a response that merely sounds compliant is not compliant; judge each response independently of its neighbours.

## Model choice

Run testers on a different model from the compiler when you can (coordination, Judge independence). A local model is acceptable for behaviour and preservation testers after a calibration check: it must label the 10 Frame anchors correctly. The Goodhart tester does cross-cutting reasoning; prefer a frontier model.

## Self-check (calibration, once per rubric per tester model)

1. Label the Frame anchors: 10/10 correct, or fix the rubric with the compiler.
2. Shuffle the order of 20 dev responses and re-run: the rate changes by at most one response.
3. Append an irrelevant compliant-sounding paragraph to five BAD responses: they must stay BAD.
