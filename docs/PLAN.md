# План реализации: «Первые 90»

Основание: `docs/SPEC.md` v1.0.

## 1. Архитектура

```
Браузер (React SPA, Vite)
   │  fetch /api/*
   ▼
Vercel Function /api/* (Hono, TypeScript)
   │  Drizzle ORM
   ▼
Neon Postgres
```

- Общий код (типы, модель риска, расчёт этапов и встреч) лежит в `shared/` и используется и клиентом, и API.
- «Сегодня» берётся из сервера; seed строит даты относительно текущей даты, поэтому демо не «стареет».
- Риск вычисляется на сервере при выдаче данных (`shared/risk.ts`), в БД не хранится.
- Скрытие HR-флага от руководителя делается на сервере по заголовкам роли (`x-viewer-role`, `x-manager-id`), а не только в UI.

## 2. Структура репозитория

```
/server
  app.ts                      Hono-приложение, basePath /api, обработка ошибок
  dev.ts                      локальный сервер (порт 3001)
  vercel.ts                   точка входа Vercel Function
  routes/                     meta, newcomers (+ checkpoints), newcomerPage (/n/:token), b24, metrics, demo
  services/                   загрузка агрегатов, маппинг в DTO с учётом роли, метрики
  db/                         schema.ts (Drizzle), client.ts (postgres.js)
  seed/                       справочники, сценарии риска, история для метрик
  lib/                        http-ошибки, валидация zod, роль зрителя, детерминированный random
/shared
  api.ts                      DTO и контракты API
  domain.ts, dates.ts, text.ts
  risk.ts                     модель риска (чистая функция)
  timeline.ts                 день X, этап, статусы встреч
  checklistTemplates.ts       шаблоны по подразделениям
  faq.ts                      FAQ по подразделениям
/src
  main.tsx, router.tsx
  api/                        fetch-клиент и хуки TanStack Query
  app/                        layout, навигация, выбор руководителя, сброс демо
  components/                 UI-примитивы (Button, Badge, Card, RiskBadge, ConfirmDialog, StatCard, BarList…)
  features/
    home/                     главная с демо-сценарием
    newcomer/                 страница новичка, чек-ин
    newcomers/                карточка новичка (общая для HR и руководителя)
    manager/                  список новичков руководителя
    hr/                       радар, Б24, метрики
  styles/                     _mixins.scss, global.scss
/scripts
  seed.ts                     загрузка демо-данных
  build-vercel.mjs            сборка Vercel Build Output API
/tests
  unit/                       Vitest: risk, timeline
  e2e/                        Playwright: демо-сценарий, десктоп и 360×740
```

## 3. Схема БД

- `departments` (id, code: warehouse|store|sales|office, name)
- `locations` (id, name, departmentId)
- `employees` (id, fullName, position, role: manager|hr|staff, departmentId, locationId?, phone)
- `newcomers` (id, token, fullName, position, phone, departmentId, locationId, managerId, mentorId?, startDate, status: active|left, hrContactedAt?)
- `checklist_items` (id, newcomerId, title, stage, dueDay, doneAt?)
- `checkpoints` (id, newcomerId, day: 1|7|30|60|90, dueDate, doneAt?, note?)
- `checkins` (id, newcomerId, createdAt, mood 1–5, clarity yes|partly|no, support yes|partly|no, comment?, wantsHr bool)
- `b24_tasks` (id, externalId, type: hire|dismiss, payload jsonb, createdAt, processedAt?, newcomerId?)
- `offboardings` (id, newcomerId, leaveDate, reason, daysWorked)

Для метрик история наймов и уходов хранится в тех же `newcomers` и `offboardings`: прошедшие 90 дней — `active` с датой выхода в прошлом, ушедшие — `left`.

## 4. Экраны

| Маршрут                  | Роль         | Содержание                                       |
| ------------------------ | ------------ | ------------------------------------------------ |
| `/`                      | —            | выбор роли + короткое описание продукта          |
| `/n/:token`              | новичок      | день X, этап, чек-лист, контакты, FAQ, чек-ин    |
| `/manager`               | руководитель | список своих новичков по риску                   |
| `/manager/newcomers/:id` | руководитель | карточка (без HR-флага)                          |
| `/hr`                    | HR           | радар с фильтрами                                |
| `/hr/newcomers/:id`      | HR           | полная карточка + «HR связался» + ссылка новичка |
| `/hr/b24`                | HR           | входящие задачи Б24, принять, сымитировать       |
| `/hr/metrics`            | HR           | метрики ранних уходов                            |

В шапке: переключатель роли, выбор руководителя, кнопка «Сбросить демо-данные». На мобильных навигация сворачивается.

## 5. Этапы

1. **Каркас.** Vite + React + TS + SCSS Modules, ESLint/Prettier, роутинг, layout, RoleContext, UI-примитивы.
2. **Домен.** `shared/` (типы, timeline, risk, шаблоны, FAQ) + unit-тесты.
3. **БД.** Drizzle-схема, миграции, seed со сценариями риска, подключение Neon.
4. **API.** Эндпоинты из раздела 2, валидация входных данных (zod).
5. **Страница новичка** (mobile-first) + чек-ин.
6. **Кабинет руководителя:** список, карточка, встречи, наставник.
7. **HR:** радар, карточка, Б24, метрики, сброс демо.
8. **Качество:** доступность (клавиатура, aria, контраст), проверка на 360px, e2e-сценарий.
9. **Деплой на Vercel, README, отчёт (≤ 15 строк), запись экрана по необходимости.**

## 6. Тестирование

- Unit (Vitest): каждое правило риска по отдельности, пороги уровней, скрытие HR-причины для руководителя, расчёт дня, этапа и статусов встреч (граничные дни 0/1/7/90).
- E2E (Playwright): критерии приёмки 1–4 из SPEC §10, прогон на десктопе и на viewport 360×740.
- Вручную: Lighthouse Accessibility, навигация с клавиатуры, реальный телефон.

## 7. Что фиксируем в отчёте как непроверенное

- Работу с реальным Битрикс24 (только мок формата задач).
- Поведение реальных новичков (будут ли проходить чек-ины).
- Нагрузку и конкурентные правки нескольких проверяющих одновременно.
