# Contributing to Schism

Issues and pull requests are welcome. The most useful thing you can send is the report of a real run: the `seal/report.md`, the ledger and the manifest, with the model and the behaviour, whether it worked or not, because the package has not yet been run on a real model and every honest result moves it forward.

## Changing the method

The skill is text for an agent to carry out, so a change to it is checked the way the agent checks itself. A change to a technique card has to keep the card's self-check true, and if it changes what the technique computes, the self-check has to change with it, so that an agent implementing the new card can still tell a correct implementation from a broken one. A change to a role prompt has to respect the coordination contracts in `schism/references/coordination.md`, above all who may see what: the compilers never see verdicts, and the testers see only their own projection. When a change moves a default (a threshold, a budget, a preset), say why in the pull request, and say how you would measure whether it was right.

## Changing the website

The site lives in `site/` and builds into `docs/`. Run `npm ci` once, then `npm run dev` to work on it and `npm run build` before committing, since the build regenerates the reading room from the repository's own files. Every factual sentence on the site carries a `data-claim` id from `site/content/brief.md`, and a new claim goes into that table first, with the package file it comes from. `site/tools/m3check.py` checks the built site for broken links, unknown claims and sources, and console errors, with the preview server running (`npx vite preview --port 4173`).

## Figures

The README's banner and figures are drawn by `assets/src/figures.py` (`python3 -I assets/src/figures.py`, which needs Python Playwright with Chrome). Edit the script rather than the images.
