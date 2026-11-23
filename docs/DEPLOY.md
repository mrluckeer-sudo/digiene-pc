# Деплой на Yandex Object Storage

Сайт: https://digiene-pc.website.yandexcloud.net/  
Бакет: `digiene-pc` (имя зашито в workflow, не берётся из секрета).

Автодеплой: пуш в `main` → GitHub Actions → бакет. Телефонный прототип и его бакет `phone-game-prototype` этот workflow не трогает.

Workflow: [`.github/workflows/deploy-yandex.yml`](../.github/workflows/deploy-yandex.yml)

## Бакет

В каталоге Yandex Cloud, отдельно от телефонного прототипа:

1. Создать бакет с именем `digiene-pc`.
2. Включить хостинг статического сайта, главная страница `index.html`.
3. Доступ на чтение объектов для сайта — публичный. Ключ сервисного аккаунта в бакет не класть.

Если `yc` уже авторизован:

```bash
yc storage bucket create --name digiene-pc
yc storage bucket update --name digiene-pc --public-read --website-settings-from-file website.json
```

`website.json`:

```json
{ "index": "index.html", "error": "index.html" }
```

## Секреты репозитория

Те же два статических ключа, что уже стоят у `phone-game-digital-twin` (сервисный аккаунт с ролью `storage.editor` на этот бакет). Значения в чат не присылать.

| Имя секрета | Что положить |
|---|---|
| `YC_ACCESS_KEY_ID` | Static access key id |
| `YC_SECRET_ACCESS_KEY` | Static secret |

GitHub: Settings → Secrets and variables → Actions → New repository secret.

Ключ API языковой модели в этот репозиторий и на сайт не класть. Он живёт только в окружении Cloud Function `proxy/`. Функцию не открывать для неаутентифицированного вызова: снаружи её зовёт API Gateway от сервисного аккаунта.

Когда шлюз уже создан, в секреты этого репозитория добавить `YC_AI_PROXY_URL` (адрес вида `https://<шлюз>.apigw.yandexcloud.net/chat`). При деплое он попадает в `dist/config.js`. В git остаётся выключенная заготовка. Без секрета личные ответы остаются заготовленными. Школьный прокси телефона сюда не подставлять: у него другие персонажи.
