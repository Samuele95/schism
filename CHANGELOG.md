# Changelog

All notable changes to Schism are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-11-17

The first public release. The method is complete and has passed its design audit, but it has not yet been run on a real model: it is ready for a first calibration run, and the empirical test plan in `delivery/EMPIRICAL-TEST.md` says how to find out whether it works.

### Added

- **The skill** (`schism/`): the run protocol in five phases (Frame, Map, Floor, Tournament, Seal), fifteen technique cards, eight role prompts for the Alchemist tournament, and the run templates.
- **Three operations on one contrast pair.** Schism ablates a behaviour, tunes the strength of an edit, or injects a behaviour the model shows only when instructed, by intervening in the weight space and on the internal representations of an open model, or through a prompt operator measured in embedding space on a closed one.
- **The prompt compiler** as an open dependency: any map from a prompt to a prompt, with Prometheus recommended and a plain LLM call accepted, named in the brief and recorded call by call.
- **The website** (`site/`, served from `docs/`): a scroll-driven three.js film, with a still sequence for reduced motion or no WebGL, and a reading room rendered from the package's own files, every factual line traced to a claim id.
- **README figures** drawn by `assets/src/figures.py`.
- **Credit** to Philipp Emanuel Weidmann's Heretic for Arbitrary-Rank Ablation and the floor pipeline.

[0.1.0]: https://github.com/Samuele95/schism/releases/tag/v0.1.0
