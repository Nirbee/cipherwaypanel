# Разработка интеграции Hysteria 2 с Remnawave (старт)

## Ваш репозиторий (push сюда)

- **Remote:** [https://github.com/Nirbee/cipherwaypanel.git](https://github.com/Nirbee/cipherwaypanel.git) (`origin`)
- **Ветка:** `main`
- В подпапках удалены вложенные `.git` (клоны upstream), чтобы всё было **одним монорепозиторием**.
- Для подтягивания обновлений с оригинала можно добавить:  
  `git remote add upstream https://github.com/remnawave/backend.git` (и аналогично для других репо при необходимости merge).

## Что уже скачано в эту папку

| Каталог | Репозиторий | Назначение |
|---------|-------------|------------|
| `remnawave-backend` | [remnawave/backend](https://github.com/remnawave/backend) | API NestJS, Prisma, бизнес-логика, пользователи, профили (`ConfigProfiles` и т.д.) |
| `remnawave-node` | [remnawave/node](https://github.com/remnawave/node) | Нода: Xray через supervisord, `XrayService`, плагины nftables |
| `remnawave-frontend` | [remnawave/frontend](https://github.com/remnawave/frontend) | Веб-интерфейс панели |
| `remnawave-panel` | [remnawave/panel](https://github.com/remnawave/panel) | **Документация** (Docusaurus), не UI админки |

Для полного цикла разработки нужны **backend + node + frontend**. При необходимости отдельно: [subscription-page](https://github.com/remnawave/subscription-page), [templates](https://github.com/remnawave/templates).

## Лицензия

Исходники Remnawave под **AGPL-3.0**. Форк и распространение с изменениями требуют соблюдения AGPL (в т.ч. публикация при доставке пользователям по сети).

## Окружение

- **Сборка `remnawave-node` на Windows не проходит** из‑за нативного модуля `nftables-napi` (Linux). Используйте **WSL2** или **Linux VM**, либо **Docker** с dev-образом по документации проекта.
- **Backend** и **frontend** обычно собираются на Windows; см. `DEVELOPMENT.md` в backend.

## Куда смотреть в коде (этап 1)

1. **Нода — запуск ядра:** `remnawave-node/src/modules/xray-core/xray.service.ts` (supervisord, процесс `xray`). Для Hy2 понадобится аналог: отдельный бинарь `hysteria` + конфиг или отдельный `sing-box` inbound.
2. **БД — профили:** `remnawave-backend/prisma/schema.prisma` — модели `ConfigProfiles`, `ConfigProfileInbounds` (поле `config` / `rawInbound` Json). Расширение схемы или новый тип профиля — отдельная миграция Prisma.
3. **Фронт:** формы профилей и хостов — в `remnawave-frontend` (поиск по `xray`, `ConfigProfile`).

## Рекомендуемый порядок работ

1. Создать **форк** на GitHub для `backend`, `node`, `frontend` (или монорепо-обёртку с submodules).
2. Поднять **локальную БД** по `remnawave-backend/DEVELOPMENT.md`.
3. В **WSL/Linux** собрать ноду и проверить `npm run build`.
4. Спроектировать **контракт**: как панель передаёт на ноду конфиг Hy2 (новый endpoint рядом с `startXray` или расширение payload).
5. Реализовать **MVP**: один UDP-порт, статический конфиг Hy2 без полной связки с пользователями Remnawave — затем связать с БД и UI.

## С сервера продакшена

С сервера **не нужно** копировать образы Docker как исходники. Полезно сохранить **без секретов**: версии образов, `docker-compose.yml`, шаблон env, экспорт JSON профилей для тестов совместимости.
