# Transactional Outbox Domain Events — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 01 | Add Identity outbox migration | completed | medium | — |
| 02 | Add outbox record model and persistence helpers | completed | medium | task_01 |
| 03 | Capture domain events in UserRepository transactions | pending | high | task_02 |
| 04 | Add repository atomicity and event-pull tests | completed | medium | task_03 |
| 05 | Add Kafka and relay configuration | completed | low | task_02 |
| 06 | Add Kafka outbox publisher adapter | completed | medium | task_05 |
| 07 | Add outbox relay claiming, publishing, retry, and status transitions | completed | high | task_02, task_06 |
| 08 | Wire relay lifecycle into Fastify bootstrap | completed | medium | task_07 |
