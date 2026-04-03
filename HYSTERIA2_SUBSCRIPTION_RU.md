# Hysteria 2 (NL) и подписки в Remnawave — как это устроено

## Важно: отдельный код «под Hysteria» в панели часто не нужен

В **backend** Remnawave уже есть:

- протокол **`hysteria`** в Xray-профиле и валидации конфига;
- выдача подписок с Hysteria **version 2** (в т.ч. [Xray-JSON](remnawave-backend/src/modules/subscription-template/generators/xray-json.generator.service.ts));
- синхронизация пользователей на ноду: для Hy2 в качестве **пароля/ auth** используется **`vlessUuid`** пользователя ([см. `add-user-to-node.handler`](remnawave-backend/src/modules/nodes/events/add-user-to-node/add-user-to-node.handler.ts)).

То есть «возможность выдавать подписки на Hysteria 2» в типичной сборке **включается в основном конфигурацией** (профиль, хост, шаблон подписки), а не новой кнопкой в форке — если у вас **актуальная** версия панели/backend, совместимая с документацией Xray по Hysteria.

## Ограничения клиентов

- **Clash / Mihomo** в генераторе подписок помечают **hysteria** как неподдерживаемый для части форматов — ориентируйтесь на **Xray-JSON** (или клиенты, которые его едят) и проверьте выбранный **шаблон подписки** в панели.
- **Sing-box** шаблон в backend для протокола **`hysteria` в outbound не заполняется** (`applyProtocolFields` не знает hysteria — узел не попадёт в sing-box подписку). Для Hy2 используйте шаблон **Xray-JSON** (или другой тип, который у вас реально генерирует hysteria outbound).

## Что сделать на NL (нода Xray)

1. **Hysteria 2 в Xray** — это **QUIC (UDP)**. Нужен **отдельный UDP-порт** (например `443/udp` или `8443/udp`), открытый в firewall. Не путать с вашим текущим **TCP 443** (VLESS/Reality).
2. В **профиле** (`Конфиг. Xray`) добавьте inbound с **`protocol": "hysteria"`**, **`settings.version": 2`**, массив **`clients`** оставьте пустым — панель **сама подставит** пользователей с полями `auth` = UUID пользователя (как в коде панели).
3. В **`streamSettings`** для Hysteria в Xray используется **`network": "hysteria"`** и **`hysteriaSettings`** (см. [документацию Xray — транспорт Hysteria](https://xtls.github.io/config/transports/hysteria.html)), плюс **`security": "tls"`** и сертификаты (для продакшена — нормальный TLS-сертификат на домен NL).

Ниже — **минимальный ориентир** структуры (порт, пути к сертификатам и домен замените на свои):

```json
{
  "tag": "HY2_NL",
  "listen": "0.0.0.0",
  "port": 8443,
  "protocol": "hysteria",
  "settings": {
    "version": 2,
    "clients": []
  },
  "streamSettings": {
    "network": "hysteria",
    "security": "tls",
    "tlsSettings": {
      "certificates": [
        {
          "certificateFile": "/path/to/fullchain.pem",
          "keyFile": "/path/to/privkey.pem"
        }
      ],
      "alpn": ["h3"]
    },
    "hysteriaSettings": {
      "version": 2
    }
  },
  "sniffing": {
    "enabled": true,
    "destOverride": ["http", "tls", "quic"]
  }
}
```

Точные поля должны соответствовать **версии Xray-core** на ноде (см. [доку inbound hysteria](https://xtls.github.io/config/inbounds/hysteria.html)). Если после сохранения профиль не проходит проверку в панели — смотрите текст ошибки в логах backend и `xray.err.log` на ноде.

## Что сделать в панели

1. **Профиль** — добавить inbound с тегом (например `HY2_NL`), согласовать с JSON выше.
2. **Нода NL** — привязать этот профиль и **включить** нужный inbound тег для ноды.
3. **Хост** — создать хост с адресом/доменом NL и портом Hy2, привязать к inbound `HY2_NL`.
4. **Сквад** — выдать пользователям доступ к этому хосту (как к остальным).
5. **Подписка / шаблоны** — выбрать формат, который выдаёт **Xray-JSON** (или поддерживаемый вами клиент с Hy2), и проверить ссылку подписки в тестовом клиенте.

## Связь с вашим форком `cipherwaypanel`

Отдельный модуль **`Hysteria2Service`** в ноде — это **заглушка** под возможный будущий отдельный процесс; **выдача подписок на Hysteria 2 через Xray** описана **в этом файле** и в upstream Remnawave **без** этой заглушки.

Если после настройки по инструкции подписка не содержит Hy2 — проверьте версию **Panel + Backend** и соответствие шаблона подписки; при необходимости обновите панель до версии, где в changelog явно указаны правки генерации Hysteria2.
