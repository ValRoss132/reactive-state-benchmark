# Reactive Bench

Browser-based benchmarking tool for comparing React state management libraries: **Zustand**, **Redux Toolkit**, **MobX**, and **Jotai**.

## Overview

Reactive Bench measures and compares the performance characteristics of different state management approaches under realistic scenarios. It combines static code validation with runtime profiling to capture both scripting time and UI rendering costs.

### Tested Adapters

- **Zustand** — lightweight, minimal overhead
- **Redux Toolkit** — structured, action-based approach
- **MobX** — reactive, fine-grained updates
- **Jotai** — atom-based primitives

### Benchmark Scenarios

- **Wide Update** — mass updates across many state slices
- **CRUD** — localized create/read/update/delete operations
- **Async** — state updates triggered by async operations

### Metrics

- `state-core` — overhead of state update mechanism
- `ui-coupled` — cost of propagating changes to UI
- `p95/p99` — percentile latencies for detecting outliers
- `CV` — coefficient of variation for stability assessment

## Quick Start

### Local Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Opens development server with HMR.

### Production Build & Preview

```bash
pnpm build
pnpm preview
```

Builds production-optimized static bundle. React profiling is enabled by default for production builds; set `REACT_PROFILING=false` only for a non-profiling control build. Preview runs on `http://localhost:4173` by default.

### Benchmark Commands

```bash
pnpm benchmark:profile
pnpm benchmark:prod
pnpm benchmark:all
pnpm test
```

`benchmark:profile` builds with the React profiling renderer and starts Vite preview. `benchmark:prod` intentionally disables profiling. `benchmark:all` verifies the profiling production build. `test` runs lightweight reproducibility checks for seed generation, progress, statistics, profiling config, and Jotai inclusion.

### Thesis Build

```bash
pnpm docs:build
pnpm docs:check
```

The Markdown source is preserved at `docs/vkr.md`. The Typst entrypoint is `docs/thesis.typ`; metadata and the GOST-oriented wrapper live in `docs/metadata.typ` and `docs/template.typ`.

### Docker

#### Direct Docker

```bash
docker build -t reactive-bench:local .
docker run --rm -p 8080:80 reactive-bench:local
```

#### Docker Compose (Recommended)

```bash
docker compose up --build
```

Launches container with React profiling pre-enabled for accurate UI metrics. Open `http://localhost:8080`.

## CI/CD

GitHub Actions workflows automate testing and deployment:

- **CI** — linting and build verification on all commits and PRs
- **Docker** — builds image and pushes to GHCR (`ghcr.io/<owner>/<repo>:latest`)
- **Pages** — deploys static build to GitHub Pages with proper base path

## Requirements

### Local Development

- Node.js (v20+)
- Corepack enabled for automatic pnpm management

### Docker

- Docker Engine (or compatible runtime)
- Docker Compose (optional but recommended)
- Available TCP port 8080

## Project Structure

```
src/
├── core/          # Benchmark engine and types
├── adapters/      # State management implementations
├── scenarios/     # Benchmark test scenarios
├── components/    # React UI components
├── utils/         # Helper functions (CSV export, etc.)
└── hooks/         # Custom React hooks
```

## Important Notes

- **Profiling builds**: React profiling is enabled by default for `vite build`; the app warns when profiling is disabled and UI metrics are not reliable.
- **Reproducibility**: Results depend on hardware and browser. Use consistent test environment for meaningful comparisons.
- **Browser**: Chromium-family browsers recommended for stable `performance.now()` timing.
- **Complexity model**: See [docs/adapter-complexity.md](docs/adapter-complexity.md) for the adapter method complexity table.

## Documentation

See [docs/report.md](docs/report.md) for detailed technical documentation, methodology, and implementation details.
