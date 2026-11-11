# Первые 90

Помогает удержать новичков в первые 90 дней. Новичок раз в неделю отвечает на 4 вопроса по личной ссылке без логина. Руководитель и HR видят, кому плохо и почему, и что сделать прямо сейчас. Приём и увольнение подхватываются из задач Битрикс24 (в демо имитированы).

**Демо: [tgt-test-task.vercel.app](https://tgt-test-task.vercel.app)**

- Спецификация: [docs/SPEC.md](docs/SPEC.md)
- План реализации: [docs/PLAN.md](docs/PLAN.md)
- Отчёт: [docs/REPORT.md](docs/REPORT.md)

## Демо-сценарий (2 минуты)

1. **HR → Задачи Б24** — завести «Мария Попова» (выход сегодня), открыть страницу новичка.
2. На странице новичка пройти чек-ин: самочувствие «Плохо», «Хочу поговорить с HR».
3. **HR → Радар** — Мария наверху с высоким риском и причинами текстом.
4. **Руководитель** (Марина Котова) — видит «Есть сигнал для HR», но не флаг и не комментарий.
5. В карточке HR — «Отметить: HR связался», риск снижается. **Метрики** — доля ранних уходов и разрезы.
6. Внизу любой страницы — «Сбросить демо-данные».

## Локальный запуск

Нужны Node.js 23.6+ (запускает `.ts` без сборки), pnpm 12 и Postgres 16.

```bash
pnpm install
cp .env.example .env          # DATABASE_URL=postgres://localhost:5432/pervye90
createdb pervye90
pnpm db:push                  # схема Drizzle
pnpm db:seed                  # демо-данные (146 новичков, детерминированно)
pnpm dev                      # web: http://localhost:5173, api: http://localhost:3001
```

## Проверки

```bash
pnpm typecheck && pnpm lint
pnpm test                     # Vitest: правила риска, этапы, встречи (41 тест)
pnpm test:e2e                 # Playwright: демо-сценарий на десктопе и 360×740
E2E_BASE_URL=https://tgt-test-task.vercel.app pnpm test:e2e   # тот же прогон на проде
```

## Деплой (Vercel + Neon)

1. Создать базу в [Neon](https://neon.tech), взять connection string (`?sslmode=require`).
2. Локально: `DATABASE_URL=<neon-url> pnpm db:push && DATABASE_URL=<neon-url> pnpm db:seed`.
3. Импортировать репозиторий в Vercel. Переменные окружения: `DATABASE_URL=<neon-url>`, `ENABLE_EXPERIMENTAL_COREPACK=1` (для pnpm 12).
4. Настройки сборки берутся из `vercel.json`: `pnpm build:vercel` собирает SPA и одну Node-функцию `/api/*` через Build Output API.

## Стек

React 19, TypeScript, Vite, React Router, TanStack Query, SCSS Modules · Hono, Drizzle ORM, Postgres, zod · Vitest, Playwright.
