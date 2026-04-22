# Transactional Outbox for Domain Events

## Overview

Add a minimal transactional outbox for domain events so application workflows can trust that committed aggregate changes produce durable events. The first release targets product/application teams that depend on downstream workflows staying consistent after domain changes.

V1 should stay small: atomically persist aggregate changes and domain events, then publish those events asynchronously with explicit at-least-once delivery semantics. The feature is a compounding backend capability because each additional workflow can reuse the same reliability path instead of inventing custom retry or dispatch logic.

## Problem

The project already has domain events collected by aggregate roots, but there is no event bus, dispatcher, outbox, or transaction boundary. Today, a use case can persist an aggregate and then fail before publishing its domain events. That creates a dual-write failure: the source of truth changes, but downstream workflows never learn about it.

This matters most for workflows such as onboarding, notifications, audit trails, entitlement updates, and future identity-driven automation. A `UserRegistered` event that disappears after the user row commits can leave downstream teams debugging inconsistent business behavior with no durable event record to inspect.

A transactional outbox solves this by saving event records in the same transaction as the aggregate write, then publishing them later through a relay. V1 must be minimal in machinery, but explicit in semantics: at-least-once delivery, stable event identity, retry state, idempotency expectations, scoped ordering, and safe payload handling.

### Market Data

Transactional outbox is a standard distributed systems pattern for avoiding dual-write failures without two-phase commit. Microservices.io, AWS Prescriptive Guidance, and Microsoft Azure Architecture Center all describe the same core shape: persist the business change and event in one transaction, then use a separate relay to publish pending events.

The pattern also introduces known responsibilities: consumers must tolerate duplicates, ordering must be scoped deliberately, and operational visibility is required to diagnose stuck or failed events. Current event-driven architecture guidance continues to highlight visibility, schema drift, hidden dependencies, and tracing as recurring risks.

Sources:
- https://microservices.io/patterns/data/transactional-outbox
- https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
- https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-out-box-cosmos

## Summary / Differentiator

The differentiator is not inventing a novel event platform. It is making the existing Clean Architecture and DDD foundation operationally trustworthy: domain events remain pure, application use cases define the transaction boundary, and infrastructure owns durable dispatch.

## Integration with Existing Features

| Integration Point | How |
| --- | --- |
| `AggregateRoot` domain events | Continue collecting events in memory and pulling them after successful domain operations. |
| Identity `User` aggregate | Use `UserRegistered` and `PasswordChanged` as the first adoption candidates. |
| pg-promise repositories | Add a transaction-capable persistence path for aggregate write plus outbox insert. |
| `node-pg-migrate` identity migrations | Add an `outbox_events` table in the Identity context. |
| Manual composition root | Wire outbox persistence and relay dependencies explicitly. |

## Core Features

| # | Feature | Priority | Description |
| --- | --- | --- | --- |
| F1 | Atomic Event Capture | Critical | Persist aggregate changes and corresponding domain events in one database transaction. |
| F2 | Stable Event Envelope | Critical | Store event ID, event name, version, aggregate ID, occurred timestamp, payload, and metadata needed for idempotency and ordering. |
| F3 | Outbox Relay | Critical | Publish pending events asynchronously and mark them as published only after successful broker acceptance. |
| F4 | Retry and Terminal Failure State | High | Track attempts, next retry time, last error, and failed/quarantined status for poison events. |
| F5 | Consumer Semantics Contract | High | Document at-least-once delivery, duplicate handling, idempotency keys, and scoped ordering expectations. |
| F6 | Payload Safety Boundaries | High | Use an event allowlist, minimize sensitive fields, and define retention/redaction expectations. |
| F7 | Basic Operational Visibility | Medium | Provide queryable status fields and metrics/logs for pending, published, failed, and retried events. |

## KPIs

| KPI | Target | How to Measure |
| --- | --- | --- |
| Workflow adoption | `>= 2` workflows use outbox-backed events in the first release cycle | Count workflows emitting or consuming outbox-backed domain events. |
| Lost committed events | `0` known lost events after aggregate persistence commits | Compare committed aggregate changes with corresponding outbox records and incident reports. |
| Retry recovery | `>= 95%` transient publish failures recover without manual intervention | Track failed publish attempts that later reach published state. |
| Event state diagnosis time | `< 15 minutes` median time to identify pending/failed event state | Measure support/debug sessions from issue report to event status identification. |
| Consumer idempotency coverage | `100%` of V1 consumers document duplicate handling | Review consumer contracts before enabling event consumption. |

## Feature Assessment

| Criteria | Question | Score |
| --- | --- | --- |
| **Impact** | How much more valuable does this make the product? | Must do |
| **Reach** | What % of users would this affect? | Strong |
| **Frequency** | How often would users encounter this value? | Strong |
| **Differentiation** | Does this set us apart or just match competitors? | Maybe |
| **Defensibility** | Is this easy to copy or does it compound over time? | Strong |
| **Feasibility** | Can we actually build this? | Strong |

Leverage type: Compounding Feature

## Council Insights

- **Recommended approach:** Build a minimal transactional outbox with explicit delivery semantics. Keep the domain pure, place transaction coordination in the application layer, and keep persistence/relay/broker concerns in infrastructure.
- **Key trade-offs:** V1 should avoid becoming a full eventing platform, but it must not leave delivery semantics vague. Minimal means small surface area, not weak guarantees.
- **Risks identified:** Duplicate delivery, poison events, leaked sensitive payloads, unclear ordering, and fragmented workflow-specific dispatch paths.
- **Stretch goal (V2+):** Add event cataloging, replay tooling, richer observability, schema governance, and broader bounded-context adoption after V1 proves workflow adoption.

## Out of Scope (V1)

- **General event platform** — Too broad before adoption is proven.
- **Advanced replay UI** — Useful later, but V1 only needs durable records and basic status inspection.
- **Global ordering guarantees** — Expensive and unnecessary; V1 should scope ordering by aggregate or workflow stream.
- **Exactly-once delivery** — The pattern provides at-least-once delivery; consumers must be idempotent.
- **Multi-broker abstraction** — Adds indirection before there is evidence that multiple brokers are needed.
- **Workflow orchestration** — Outbox reliability should not become a business process engine in V1.

## Architecture Decision Records

- [ADR-001: Minimal Transactional Outbox Scope](adrs/adr-001.md) — Defines V1 as minimal outbox machinery with explicit delivery, safety, and boundary semantics.

## Open Questions

- Which two workflows should be used to validate V1 adoption?
- What broker or dispatch target should the first relay publish to?
- What retention period is acceptable for outbox payloads containing user-related data?
- Which event payload fields are safe for durable storage and downstream publication?
