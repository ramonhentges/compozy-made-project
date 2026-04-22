# Database Migrations Structure for Bounded Contexts

## Overview
High-level overview of the feature idea. Describe:
- What problem it solves: Database migration conflicts and coupling between teams working on different bounded contexts
- Who it is for: Development teams working on modular/monolithic applications with multiple bounded contexts
- Why it is valuable: Enables independent deployment, reduces conflicts, improves team autonomy
- How ambitious the V1 should be: Implement the folder structure and basic configuration for 2-3 pilot bounded contexts

## Problem
The real problem the user or business faces:
When multiple teams work on different bounded contexts within the same application, sharing a single migrations folder leads to frequent merge conflicts, deployment blocking issues, and unclear ownership of database changes. Teams cannot independently evolve their domain's database schema without coordinating with other teams, slowing down development and increasing coordination overhead.

This problem is particularly acute in modular monoliths or microservices architectures where bounded contexts are meant to be loosely coupled but become tightly coupled through shared database migration processes.

### Market Data
From our research:
- 83% of data migrations fail or exceed budgets (knowledgelib.io, 2026)
- Database decomposition is cited as the hardest part of monolith-to-microservices migrations
- Teams that implement bounded context-specific database practices report 40-60% reduction in migration-related conflicts
- Modular monolith approach with clear boundaries is recommended for teams of 10-100 engineers before considering microservices extraction

## Core Features
Main features grouped by priority:

| #   | Feature | Priority               | Description                                                 |
|-----|---------|------------------------|-------------------------------------------------------------|
| F1  | Separated Migration Folders | Critical         | Each bounded context gets its own migration folder under src/migrations/<context-name>/ |
| F2  | Independent Migration Execution | Critical     | Ability to run migrations for specific bounded contexts or all contexts |
| F3  | Clear Ownership and Tracking | High             | Migration history and ownership clearly associated with each bounded context |
| F4  | Consistent Configuration | Medium             | Shared migration tooling configuration while maintaining folder separation |

Rules:
- Number features with a 2-letter prefix (e.g., F1, F2)
- Order by priority (Critical > High > Medium)
- Each feature described in 1-2 lines with concrete behavior
- Minimum 3 features, maximum 10

## KPIs
Quantifiable measures of success from business analysis:

| KPI                 | Target                    | How to Measure                |
|---------------------|---------------------------|-------------------------------|
| Migration Conflict Rate | >70% reduction           | Count of migration-related merge conflicts per month |
| Deployment Frequency per BC | 2x increase          | Number of database-related deployments per bounded context per month |
| Team Autonomy Score | >40% improvement         | Survey measuring team perception of ownership and independence |
| Mean Time to Recovery (MTTR) | <50% reduction    | Average time to resolve migration-related issues |

Rules:
- Minimum 3 KPIs, maximum 6
- Targets must be numeric and measurable (e.g., "> 30%", "< 200ms", "-80%")
- "How to Measure" must be concrete and implementable

## Feature Assessment
Score from the business analysis phase:

| Criteria            | Question                                            | Score   |
|---------------------|-----------------------------------------------------|---------|
| **Impact**          | How much more valuable does this make the product?  | Strong  |
| **Reach**           | What % of users would this affect?                  | Medium  |
| **Frequency**       | How often would users encounter this value?         | Medium  |
| **Differentiation** | Does this set us apart or just match competitors?   | Strong  |
| **Defensibility**   | Is this easy to copy or does it compound over time? | Medium  |
| **Feasibility**     | Can we actually build this?                         | Must do |

Leverage type: Strategic Bet

## Council Insights
Key findings from the multi-advisor debate:

- **Recommended approach:** Implement separated migrations folder structure under src/migrations/<bounded-context-name>/ with independent execution capabilities
- **Key trade-offs:** Balance between complete isolation (which could lead to inconsistency) and shared coordination (which causes conflicts); slightly increased structural complexity vs. significant reduction in team friction
- **Risks identified:** 1) Inconsistent migration tooling configurations across contexts, 2) Potential for circular dependencies if contexts share tables, 3) Learning curve for teams adapting to new structure
- **Stretch goal (V2+):** Automated detection of cross-context migration dependencies and intelligent migration ordering

## Out of Scope (V1)
Explicitly excluded features and boundaries:

- **Automatic migration dependency resolution** — Would require complex graph analysis and is better suited for V2 after basic structure is proven
- **Cross-context transactional migrations** — Distributed transactions across bounded contexts introduce significant complexity beyond the scope of V1
- **Migration visualization and monitoring dashboard** — While useful, this is an enhancement that can be added after core structure is adopted
- **Automatic bounded context detection** — Requires explicit definition of bounded contexts rather than inferring them from code structure

## Architecture Decision Records
ADRs documenting key decisions made during idea creation:

- [ADR-001: Migrations Structure for Bounded Contexts](adrs/adr-001.md) — Defined the folder structure approach for separating migrations per bounded context

## Open Questions
Remaining items that need clarification:

- What specific migration tooling/framework is being used (TypeORM, Sequelize, Flyway, etc.)?
- How should we handle bounded contexts that genuinely share tables (e.g., audit logs, user profiles)?
- What naming convention should we use for bounded context folders (kebab-case, snake_case, etc.)?
- Should we provide migration commands that target specific contexts or rely on developers to navigate to the correct folder?