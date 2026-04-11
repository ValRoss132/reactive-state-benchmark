# Reactive State Benchmark

Практическое решение для темы ВКР:
**"Исследование парадигмы реактивного программирования для управления состоянием в веб-приложениях"**.

Проект представляет собой интерактивный веб-стенд для бенчмарка подходов к управлению состоянием:

- Redux Toolkit
- Zustand
- MobX
- Recoil

Результат оформлен в виде:

- веб-приложения для запуска и фиксации измерений,
- Docker-образа и `docker-compose` для воспроизводимого развёртывания,
- CI/CD-конвейера в GitHub Actions,
- инструкции для проверки и включения в итоговый отчёт по практике.

## Связка с этапами практики

1. Проектирование развёртывания:
   - выбран сценарий веб-стенда на React + TypeScript;
   - развёртывание через Docker и Nginx.
2. Процесс тестирования / бенчмаркинга:
   - в UI задаётся количество итераций;
   - выполняется серия одинаковых операций обновления состояния;
   - выводится время выполнения и `ops/s` для каждого менеджера.
3. Оформление результата в виде образов:
   - `Dockerfile` для production-сборки и запуска.
4. Поставка в CI/CD:
   - workflow `.github/workflows/ci.yml` запускает `lint`, `typecheck`, `build`.

## Быстрый старт (локально)

Требования:

- Node.js 22+
- pnpm 10+

Команды:

```bash
pnpm install
pnpm dev
```

Приложение откроется по адресу `http://localhost:5173`.

## Запуск бенчмарка

1. Открой интерфейс стенда.
2. Укажи `Iterations per manager`.
3. Нажми `Run benchmark`.
4. Зафиксируй таблицу результатов (elapsed, ops/s) для отчёта.

Рекомендация для отчёта:

- сделать 3-5 прогонов на одинаковом числе итераций;
- взять среднее значение по каждому менеджеру.

## Docker-развёртывание

### Вариант 1: Docker Compose

```bash
docker compose up --build
```

Стенд будет доступен: `http://localhost:8080`.

### Вариант 2: Docker CLI

```bash
docker build -t reactive-state-benchmark:latest .
docker run --rm -p 8080:80 reactive-state-benchmark:latest
```

## CI/CD

Workflow: `.github/workflows/ci.yml`

Что выполняется на `push` и `pull_request`:

1. Установка зависимостей `pnpm install --frozen-lockfile`
2. Проверка качества `pnpm run ci`, где:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`

## Команды проекта

```bash
pnpm dev         # запуск в dev-режиме
pnpm lint        # ESLint
pnpm typecheck   # проверка TypeScript
pnpm build       # production-сборка
pnpm run ci      # полный пайплайн локально (как в CI)
pnpm preview     # предпросмотр production-сборки
```

## Что приложить в итоговый отчёт

1. Скриншот работающего стенда с адресом (`localhost:5173` или публичный URL).
2. Скриншоты таблицы бенчмарка минимум для 3 прогонов.
3. Скриншот успешного GitHub Actions workflow.
4. Скриншот запуска контейнера (`docker compose up --build`).
5. Краткое обоснование выбранного подхода CI/CD и контейнеризации.
