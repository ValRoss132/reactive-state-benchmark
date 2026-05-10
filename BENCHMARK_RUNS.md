# Recommended Benchmark Runs

Use a production profiling build:

```bash
pnpm benchmark:profile
```

For thesis data, keep browser, OS, power mode, display refresh rate, and background workload fixed. Close devtools during final measurement runs.

## Baseline Matrix

Run all adapters on all scenarios with:

| Parameter | Value |
|---|---:|
| Iterations | 10000 |
| Warmup | 1000 |
| Runs | 15 |
| Initial size | 1000 |
| Subscribers | 1000 |
| CRUD mix | 70 / 15 / 15 |
| Seeds | 101, 202, 303 |

Use three seeds as repeated independent experiment configurations. Report mean, median, p95, p99, standard deviation, and CV.

## Scalability Matrix

Keep `iterations = 10000`, `warmup = 1000`, `runs = 15`, `CRUD mix = 70 / 15 / 15`.

| Initial size | Subscribers | Purpose |
|---:|---:|---|
| 100 | 100 | Small state / low UI graph |
| 1000 | 1000 | Main baseline |
| 10000 | 1000 | Large state, bounded UI subscribers |
| 10000 | 10000 | Large state, large UI graph |

## UI Coupling Matrix

Keep `initialSize = 10000`, `iterations = 10000`, `warmup = 1000`, `runs = 15`.

| Subscribers | Purpose |
|---:|---|
| 0 | State-core emphasis without subscribed item components |
| 100 | Sparse subscriptions |
| 1000 | Medium subscriptions |
| 10000 | Full subscriptions |

## CRUD Mix Matrix

Use `initialSize = 1000`, `subscribers = 1000`, `iterations = 10000`, `warmup = 1000`, `runs = 15`.

| Update | Add | Remove | Purpose |
|---:|---:|---:|---|
| 90 | 5 | 5 | Mostly stable state |
| 70 | 15 | 15 | Balanced default |
| 50 | 25 | 25 | Structural changes under pressure |

The generator never emits a remove operation when the live CRUD set is empty. If the selected mix asks for removal at size zero, the generator emits an add operation instead.

## Suggested Thesis Tables

- Baseline adapter ranking by scenario.
- Scalability by `initialSize`.
- UI sensitivity by `subscriberCount`.
- CRUD structural-operation sensitivity by `operationMix`.
- Environment snapshot table from exported JSON.
