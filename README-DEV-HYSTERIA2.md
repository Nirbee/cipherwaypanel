# Разработка интеграции Hysteria 2 с Remnawave (старт)

## Подписки Hysteria 2 для NL (без нового кода панели)

В upstream Remnawave **уже есть** поддержка Hysteria 2 в подписках и Xray-профилях. Пошаговая инструкция и пример inbound: **[HYSTERIA2_SUBSCRIPTION_RU.md](HYSTERIA2_SUBSCRIPTION_RU.md)**.

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

## Сделано в коде (первая итерация)

- В **`remnawave-node`** добавлены модуль **`Hysteria2Module`** / **`Hysteria2Service`** (`src/modules/hysteria2/`) — пока **заглушка** (лог при `HYSTERIA2_ENABLED=true`, процесс Hysteria не запускается).
- В **`config.schema.ts`** добавлена переменная **`HYSTERIA2_ENABLED`** (по умолчанию `false`).
- В **`.env.sample`** добавлена строка `HYSTERIA2_ENABLED=false`.

Дальше: запуск бинаря через supervisord, контракт с панелью, Prisma/UI — по этапам.

## Рекомендуемый порядок работ

1. Создать **форк** на GitHub для `backend`, `node`, `frontend` (или монорепо-обёртку с submodules).
2. Поднять **локальную БД** по `remnawave-backend/DEVELOPMENT.md`.
3. В **WSL/Linux** собрать ноду и проверить `npm run build`.
4. Спроектировать **контракт**: как панель передаёт на ноду конфиг Hy2 (новый endpoint рядом с `startXray` или расширение payload).
5. Реализовать **MVP**: один UDP-порт, статический конфиг Hy2 без полной связки с пользователями Remnawave — затем связать с БД и UI.

## С сервера продакшена

С сервера **не нужно** копировать образы Docker как исходники. Полезно сохранить **без секретов**: версии образов, `docker-compose.yml`, шаблон env, экспорт JSON профилей для тестов совместимости.

---

## Как тестировать изменения ноды

Панель Remnawave в проде почти всегда крутится в **Docker**: вы меняете не «файлы на диске», а **образ контейнера** `remnanode`.

### Вариант A: сборка образа локально (Linux / WSL2 / CI)

Из каталога `remnawave-node`:

```bash
docker build -t cipherway-node:local .
```

Запуск с вашим `.env` (скопируйте из рабочего сервера только **не секретные** имена переменных и подставьте тестовый `SECRET_KEY` от панели в dev):

```bash
docker run --rm -it --network host \
  -e NODE_PORT=2222 \
  -e SECRET_KEY='...payload от панели...' \
  -e HYSTERIA2_ENABLED=true \
  cipherway-node:local
```

В логах контейнера должны быть строки:

- `[Features] HYSTERIA2_ENABLED=true (stub in Node — hysteria2 binary not managed yet)` (из `docker-entrypoint.sh`);
- `HYSTERIA2_ENABLED is true — integration stub loaded` (из Nest `Hysteria2Service`).

При **`HYSTERIA2_ENABLED=false`** (или без переменной) этих сообщений не будет — поведение как у стоковой ноды.

### Вариант B: только проверка TypeScript (Linux / WSL)

```bash
cd remnawave-node
npm ci
npm run build
```

На чистом Windows `npm ci` может падать на `nftables-napi` — используйте WSL2.

### Вариант C: `docker-compose-local.yml`

В `remnawave-node` подготовьте `.env` по образцу `.env.sample` и дополните переменными, которые ожидает ваша установка (см. документацию Remnawave). Затем:

```bash
docker compose -f docker-compose-local.yml build
docker compose -f docker-compose-local.yml up
```

---

## Как выкатить новую ноду на сервер с панелью

**Не** копируйте папку `remnawave-node` поверх установленной панели вручную. Нода — отдельный контейнер; обновление = **новый образ** + **перезапуск** `remnanode`.

### 1. Собрать образ с вашим кодом

На машине с Docker (можно тот же сервер):

```bash
git clone https://github.com/Nirbee/cipherwaypanel.git
cd cipherwaypanel/remnawave-node
docker build -t ghcr.io/nirbee/cipherway-node:latest .
```

(Имя тега замените на свой реестр: GitHub Container Registry, Docker Hub и т.д.)

### 2. Загрузить образ на сервер

- **Через registry:** `docker push ...`, на сервере в `docker-compose` указать этот образ и сделать `docker compose pull && docker compose up -d`.
- **Через сохранение файла:** `docker save ghcr.io/nirbee/cipherway-node:latest | ssh user@server docker load`.

### 3. Правка `docker-compose` на сервере

Найдите сервис **`remnanode`** (или как он назван у вас) и:

1. Замените строку **`image:`** на ваш образ, например `ghcr.io/nirbee/cipherway-node:latest`.
2. В **`environment:`** добавьте (опционально):

   ```yaml
   - HYSTERIA2_ENABLED=false
   ```

   Пока функция — только заглушка; **`false`** оставляет поведение как раньше.

3. Сохраните **тот же** `SECRET_KEY` / `NODE_PORT` и остальные переменные, что были — иначе нода отвалится от панели.

### 4. Перезапуск

```bash
cd /путь/к/compose
docker compose pull   # если образ из registry
docker compose up -d
docker logs -f remnanode
```

### 5. Панель и backend

Текущие изменения затрагивают **только ноду**. Образы **`remnawave/backend`** и **`remnawave/frontend`** менять **не нужно**, новых кнопок в UI пока нет. Когда появятся API и экраны — тогда соберёте и выкатите свои образы backend/frontend по той же схеме.

### Откат

Верните в compose официальный образ `remnawave/node:<версия>` и выполните `docker compose up -d` — как до эксперимента.
