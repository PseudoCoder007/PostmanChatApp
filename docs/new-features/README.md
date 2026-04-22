# New Features Roadmap

This folder is the canonical roadmap for future PostmanChat product work.

Current shipped bridge release: `v2.3.0` (`Connected, Secure & Alive`), defined from the Phase 1.5 planning docs in this folder.

Read this after `docs/project-docs/` when you are planning product additions, feature prioritization, or roadmap sequencing.

## Roadmap Philosophy

The roadmap is intentionally balanced:

- early phases close important chat-product gaps
- middle phases improve engagement and operational quality
- later phases focus on features that make PostmanChat feel distinct from Discord, WhatsApp, and generic chat apps

## Phase Meanings

- `PHASE_1_LOW_COMPLEXITY.md`
  - low-risk, high-value features that fit the current architecture with minimal schema and workflow disruption
- `PHASE_1_5_CONNECTIVITY_ENGAGEMENT_SECURITY.md`
  - bridge-phase strategy doc that led into the shipped `v2.3.0` release; also contains suggested enhancements to Phase 2 and Phase 3
- `PHASE_2_MEDIUM_COMPLEXITY.md`
  - features that require broader coordination across frontend, backend, and data flow
- `PHASE_3_HIGH_IMPACT_DIFFERENTIATORS.md`
  - distinctive PostmanChat features built around Igris, quests, social motivation, and retention loops

## Read Order

1. `docs/new-features/FEATURE_GAP_AUDIT.md`
2. `docs/new-features/PHASE_1_LOW_COMPLEXITY.md`
3. `docs/new-features/PHASE_1_5_CONNECTIVITY_ENGAGEMENT_SECURITY.md`
4. `docs/new-features/PHASE_2_MEDIUM_COMPLEXITY.md`
5. `docs/new-features/PHASE_3_HIGH_IMPACT_DIFFERENTIATORS.md`

## What Lives Here

- `FEATURE_GAP_AUDIT.md`
  - current-state audit of what already exists, what is partial, what is missing, and where the unique product opportunities are
- `PHASE_1_LOW_COMPLEXITY.md`
  - quick wins and essential missing features
- `PHASE_1_5_CONNECTIVITY_ENGAGEMENT_SECURITY.md`
  - bridge phase between Phase 1 and Phase 2; connectivity, engagement, security hardening, plus recommended changes to Phase 2 and Phase 3
- `PHASE_1_5_PLAN_v2_3.md`
  - shipped implementation plan for `v2.3.0` "Connected, Secure & Alive" - detailed per-feature build specs, file touchpoints, migrations V17-V19, and verification checklist
- `PHASE_2_MEDIUM_COMPLEXITY.md`
  - product-quality and engagement features with moderate implementation scope
- `PHASE_3_HIGH_IMPACT_DIFFERENTIATORS.md`
  - high-impact features that can define the product

## Usage Notes

- `docs/project-docs/` explains how the current system works
- `docs/new-features/` explains what should be built next
- implementation notes here are directional, not full build specs
- once a roadmap phase ships, keep the plan doc as release history and move future work into the next phase docs

## Maintenance Rule

Update this folder when you:

- add or remove roadmap features
- move a feature to a different phase
- discover that a feature is already implemented or partially implemented
- change product strategy around Igris, quests, social mechanics, or retention loops
