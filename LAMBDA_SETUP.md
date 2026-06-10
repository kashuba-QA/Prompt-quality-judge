# Lambda Proxy — Инструкция по настройке

## Шаг 1 — Создать Lambda функцию

1. Открой [AWS Console → Lambda](https://us-east-1.console.aws.amazon.com/lambda)
2. Нажми **Create function**
3. Выбери **Author from scratch**
4. Заполни:
   - **Function name:** `prompt-judge-proxy`
   - **Runtime:** `Node.js 24.x`
   - **Architecture:** `x86_64`
5. Раздел **Permissions** — оставь по умолчанию
6. Нажми **Create function**

---

## Шаг 2 — Вставить код

1. Открой вкладку **Code**
2. В редакторе открой файл `index.mjs` (или `index.js`)
3. Удали весь существующий код
4. Вставь содержимое файла `lambda_proxy.js`
5. Нажми **Deploy** (оранжевая кнопка)
6. Дождись сообщения `Successfully updated the function`

---

## Шаг 3 — Environment Variables

1. Перейди в **Configuration → Environment variables**
2. Нажми **Edit**
3. Нажми **Add environment variable** и добавь по одному:

| Key | Value |
|-----|-------|
| `ADMIN_EMAIL` | `tutboss@net.com` |
| `ADMIN_PASSWORD` | `твой_пароль_от_tutboss` |
| `API_BASE` | `https://api.get-harder.today` |
| `ALLOWED_ORIGIN` | `https://judge.get-honey.today` |

4. Нажми **Save**

---

## Шаг 4 — Увеличить таймаут

По умолчанию Lambda таймаут 3 секунды — этого мало для цепочки запросов.

1. **Configuration → General configuration → Edit**
2. **Timeout:** поставь `30 sec`
3. Нажми **Save**

---

## Шаг 5 — Function URL

1. Перейди в **Configuration → Function URL**
2. Нажми **Create function URL**
3. Настройки:
   - **Auth type:** `NONE`
   - **Configure cross-origin resource sharing (CORS):** включить
   - **Allow origins:** `https://judge.get-honey.today`
   - **Allow headers:** `Content-Type, Authorization`
   - **Allow methods:** `GET, POST, OPTIONS`
4. Нажми **Save**
5. Скопируй **Function URL** — выглядит так:
   ```
   https://xxxxxxxxxxxxxxxx.lambda-url.us-east-1.on.aws
   ```

---

## Шаг 6 — Проверить что работает

1. Открой **Test** вкладку
2. Создай тестовое событие с таким содержимым:
```json
{
  "requestContext": {
    "http": {
      "method": "GET"
    }
  },
  "rawPath": "/api/Admin/admin-get-prompt-to-chat-with-model",
  "rawQueryString": "userId=019ea705-f436-7060-bec1-d157b27a764a"
}
```
3. Нажми **Test**
4. В результате должен быть `statusCode: 200` и тело с `promptOverride`

---

## Шаг 7 — Передать Function URL

Скинь Function URL — обновлю `index.html` чтобы все Admin вызовы
шли через Lambda. Займёт 5 минут.

**Что изменится в тулзе:**
- `POST /api/Admin/admin-set-prompt-to-chat-with-model` → через Lambda
- `GET /api/Admin/admin-get-prompt-to-chat-with-model` → через Lambda
- `GET /api/Chats/admin-get-messages/{chatId}` → через Lambda

**Что останется прямым:**
- `POST /api/Authenticate/login` для тестового юзера (judgetest) — у него нет Admin прав, не чувствительно
- SignalR соединение — токен тестового юзера, не Admin

---

## Итог

После настройки в DevTools браузера виден только Lambda URL.
Admin креды хранятся только в Lambda Environment Variables на стороне AWS.
