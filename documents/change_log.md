# Change Log

This file tracks meaningful changes to code, behavior, and documentation.

Format style: Keep a simple date-based log while repository versioning policy is being finalized.

## 2026-03-01

### Added

- `documents/team_onboarding.md` with step-by-step setup for team members:
  - local clone
  - `uv` backend environment setup
  - `npm` frontend install
  - init/run/verify/test workflow
- Root `README.md` with project overview, setup, run, testing, and documentation pointers.
- `documents/technical_documentation.md` with:
  - software architecture overview
  - inventory/undo sequence diagram
  - ER diagram
  - maintenance guidance
- `AGENTS.md` application update workflow section (implementation -> tests -> docs).
- API capability endpoint:
  - `GET /api/auth/capabilities`
  - reports auth mode and planned RBAC roles metadata.
- New docs in `documents/`:
  - `team_onboarding.md`
  - `source_current_state.md`
  - `change_log.md` (this file)

### Changed

- Requirements/specification updates (`specification.md`):
  - local-first PoC with forward compatibility to multi-user
  - auth stance: PoC no auth, RBAC planned (`admin`, `operator`, `viewer`)
  - timezone fixed to JST
  - scale targets set to items=10,000 / orders=5,000 / transactions~100,000
  - requirement precedence defined:
    1. specification
    2. technical documentation
    3. code behavior
  - reservation policy updated to allow partial release/consume
  - assembly policy clarified as advisory now, enforceable checks in future mode
  - QA gate and release/compliance posture sections added
  - file management section cleaned to canonical directory tree
- Technical documentation (`documents/technical_documentation.md`) aligned to the same baseline and QA policy.

- Backend reservation behavior:
  - partial release/consume implemented in service layer
  - API release/consume endpoints accept optional quantity and note payload
  - CLI `release-reservation` and `consume-reservation` now support `--quantity` and `--note`
- Frontend reservation UI:
  - release/consume actions now support partial quantity input.

### Fixed

- Reservation full-release/full-consume implementation adjusted to respect DB constraint `reservations.quantity > 0` by preserving original quantity on terminal status rows.

### Tests

- Backend test suite executed: `33 passed`.
- Frontend production build executed successfully.
- Added test coverage for:
  - auth capability endpoint
  - partial reservation release/consume behavior (API + service)
  - invalid partial quantity handling

## Notes

- Formal semantic versioning and release tags can be adopted once GitHub release workflow is started.
- Recommended next step: map this log format to `vX.Y.Z` releases and attach migration notes per release.
