# Transactional Outbox for Domain Events PRD

## Overview

Committed domain changes can currently produce in-memory domain events that are never delivered if the workflow fails after persistence. This creates inconsistent downstream behavior for product and application teams that depend on identity changes.

This feature adds a lean reliability path for existing Identity domain events. V1 prevents lost committed events, publishes them asynchronously with explicit at-least-once delivery expectations, and gives teams enough status and log visibility to understand event state.

## Goals

- Prevent known lost domain events after committed Identity changes.
- Cover all existing Identity domain events in V1.
- Recover from transient publish failures without manual intervention.
- Keep MVP scope small enough to implement quickly.
- Make duplicate-delivery expectations explicit for downstream consumers.

## User Stories

- As an application team member, I want committed Identity changes to produce durable events so downstream workflows do not silently miss business changes.
- As a product team member, I want registration and password-change workflows to stay consistent so customer-facing behavior does not depend on fragile follow-up work.
- As an operator, I want event status and logs so I can tell whether an event is pending, delivered, retried, or failed.
- As a downstream workflow owner, I want clear at-least-once semantics so I can avoid duplicate side effects.

## Core Features

- Atomic event capture: committed Identity changes and their domain events are recorded together from the user's perspective.
- Existing Identity event coverage: V1 supports every Identity domain event already raised by the application.
- Asynchronous delivery: events are delivered after the user-facing workflow completes, without blocking on downstream processing.
- Retry recovery: transient delivery failures are retried until they recover or reach an explicit failure state.
- Basic event state visibility: teams can inspect status fields and logs for pending, delivered, retried, and failed events.
- Consumer delivery contract: consumers are told to expect at-least-once delivery and handle duplicates safely.
- Payload safety boundary: persisted event data is limited to fields needed by downstream workflows.

## User Experience

Application teams continue using the Identity workflows normally. When a user registers or changes a password, the business action completes and the related domain event becomes durable for downstream delivery.

Operators diagnose delivery state through structured status and logs. They do not need a dashboard, report, replay tool, or admin UI in V1.

Downstream workflow owners receive a clear delivery contract before consuming events: events can arrive more than once, events may arrive after the originating workflow completes, and consumers must avoid duplicate side effects.

## High-Level Technical Constraints

- Must align with the existing Clean Architecture and DDD boundaries.
- Must preserve pure domain events and avoid making domain behavior depend on infrastructure concerns.
- Must support at-least-once delivery, not exactly-once delivery.
- Must avoid storing unnecessary sensitive user data in event payloads.
- Must keep V1 limited to the Identity context unless expansion criteria are met.

## Non-Goals

- General eventing platform.
- Exactly-once delivery guarantees.
- Advanced replay tooling.
- Metrics dashboards or inspection reports.
- Global event ordering guarantees.
- Multi-context rollout beyond Identity.
- Workflow orchestration.
- Broad downstream adoption program.

## Phased Rollout Plan

### MVP: Lean Reliability

- Capture all existing Identity domain events durably.
- Deliver events asynchronously.
- Retry transient failures.
- Expose status fields and logs.
- Document at-least-once delivery expectations.

Exit criteria: transient publish failures recover without manual intervention during the release window.

### Phase 2: Operational Confidence

- Add basic metrics.
- Add an inspection command or report.
- Define retention and failure-review routines.
- Expand consumer guidance.

Exit criteria: teams can diagnose most failed or delayed events without developer investigation.

### Phase 3: Broader Adoption

- Evaluate additional bounded contexts.
- Add replay or redrive workflows if operational evidence supports them.
- Improve event cataloging and governance.

Exit criteria: multiple workflows safely depend on outbox-backed events.

## Success Metrics

- Transient publish recovery: at least 95% of transient delivery failures recover without manual intervention.
- Lost committed events: zero known lost Identity events after committed business changes.
- Event state visibility: support can determine event status from fields and logs during investigation.
- Duplicate handling readiness: every V1 consumer acknowledges at-least-once delivery expectations.
- Scope control: V1 ships without dashboards, replay tooling, or cross-context expansion.

## Risks and Mitigations

- Risk: V1 visibility may be too limited for support needs.
  Mitigation: Make event state and structured logs required MVP acceptance criteria.

- Risk: Consumers may assume exactly-once delivery.
  Mitigation: Document duplicate handling as part of the consumer contract.

- Risk: Payloads may expose more user data than needed.
  Mitigation: Require payload minimization and review event fields before enabling delivery.

- Risk: Teams may expect a full event platform.
  Mitigation: State non-goals clearly and use Phase 2 and Phase 3 for expansion.

## Architecture Decision Records

- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Defines V1 as minimal outbox machinery with explicit delivery, safety, and boundary semantics.
- [ADR-002: Lean Reliability MVP Product Approach](adrs/adr-002.md) — Selects the smallest reliability-focused MVP and defers richer visibility and adoption tooling.

## Open Questions

- Which downstream destination should receive V1 events first.
- What retention period is acceptable for stored Identity event payloads.
- Which Identity event payload fields are safe and necessary for downstream consumers.
- What manual action should operators take for terminal failed events.

## Research References

- Microservices.io: https://microservices.io/patterns/data/transactional-outbox.html
- AWS Prescriptive Guidance: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
- Microsoft Azure Architecture Center: https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos
