# Reservation & Movement Reconstruction RFC

## Goal

Replace legacy reservation implementation (`STOCK -> RESERVED` movement) with allocation-based reservation that preserves physical traceability and scales operationally.

## Problem Statement

Legacy behavior conflates reservation with movement:
- reservation reduces `STOCK`
- reservation increases `RESERVED`

This loses physical location traceability and creates bottlenecks for project/BOM reservation logic that assumes `STOCK` as a singleton source.

## Design

### Data model

Add table `reservation_allocations`:
- `reservation_id`
- `item_id`
- `location`
- `quantity`
- `status` (`ACTIVE`, `RELEASED`, `CONSUMED`)
- timestamps and note

### Runtime semantics

- Create reservation:
  - compute net available per location = `inventory_ledger - active allocations`
  - allocate across locations (ordered by STOCK then location name)
  - do not mutate inventory quantities
- Release reservation:
  - transition selected active allocation quantity to `RELEASED`
  - no inventory mutation
- Consume reservation:
  - decrement physical inventory at allocated locations
  - transition selected active allocation quantity to `CONSUMED`

### Availability

Use net available quantity for project/BOM analysis and reservation admission checks.

## API compatibility

Keep existing reservation endpoints and payloads while changing backend semantics.

## Migration

- Schema migration is idempotent via startup `migrate_db`.
- Legacy `RESERVED` inventory rows are tolerated as compatibility data, but new reservations do not write there.

## Risks

- Existing tests or dashboards expecting `RESERVED` rows must be updated.
- Undo semantics for old reserve logs differ from new behavior and require reservation-id resolution by batch metadata.

## Rollout checklist

1. Deploy schema migration.
2. Deploy service logic.
3. Run full backend tests.
4. Validate manual scenarios:
   - reserve/release/consume with single location
   - reserve across multiple locations
   - project/BOM reserve against non-STOCK location inventory
5. Monitor transaction history and inventory consistency.
