# Changelog

All notable changes to PostmanChat are documented here.

This project follows semantic versioning for shipped releases captured in the repo.

## [2.3.0] - 2026-04-23

### Added

- Phase 1.5 bridge-release feature set under the "Connected, Secure & Alive" version
- Custom user status with emoji + text across profile surfaces
- Mutual-friends lookup and profile display
- Voice-message recording and playback
- Message forwarding with forwarded banner metadata
- User reporting flow and backend report queue
- Activity signals such as active badges, streak indicators, and away banners

### Changed

- Security posture improved with sign-out-all session control, safer external-link handling, and tighter request rate limiting
- Release capture is now explicit in repo metadata, README, roadmap docs, and this changelog
- Phase 1.5 roadmap docs now point to the shipped `v2.3.0` bridge release rather than a purely future plan

### Fixed

- Mobile chat room switcher behavior on narrow screens so DM/Group tabs remain reachable
- Emoji reactions so one user can only keep one active reaction per message at a time

## [2.2.0] - 2026-04-22

### Added

- Reactions, mentions, pinned messages, room mute, draft persistence, and in-room message search

### Fixed

- Major bug-fix wave including workspace render stability, Flyway migration issues, notifications, pagination, and mobile accessibility

## [2.1.0] - 2026-04-21

### Added

- Two-tab DM/group chat layout
- DM settings menu, read receipts, block/unblock flow, peer profile modal, and navbar search

## [2.0.0] - 2026-04-20

### Changed

- UI refresh across auth and branded product surfaces
- Repo version metadata made visible in package manifests and docs
