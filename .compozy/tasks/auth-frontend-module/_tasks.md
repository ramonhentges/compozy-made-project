# Auth Frontend Module — Task List

## Tasks

| # | Title | Status | Complexity | Dependencies |
|---|-------|--------|------------|--------------|
| 13 | Add name field to user registration | pending | medium | — |
| 14 | Add name column to users table | pending | low | — |
| 01 | Scaffold TanStack Start frontend | pending | high | task_13, task_14 |
| 02 | Configure Vite proxy and environment | completed | medium | task_01 |
| 03 | Install dependencies (shadcn, Zustand, React Hook Form, Zod) | completed | medium | task_01 |
| 04 | Create auth store with Zustand | completed | medium | task_03 |
| 05 | Create auth Zod schemas | completed | low | task_03 |
| 06 | Implement root loader for session restoration | completed | high | task_02, task_04 |
| 07 | Create auth server functions (register, login, logout, refresh) | completed | high | task_02, task_05 |
| 08 | Create registration form page | completed | medium | task_07 |
| 09 | Create login form page | completed | medium | task_07 |
| 10 | Create protected home page with route guard | completed | medium | task_06, task_07 |
| 11 | Add logout functionality | completed | low | task_07 |
| 12 | Write unit and integration tests | completed | high | task_04, task_05, task_07, task_08, task_09, task_10, task_11 |