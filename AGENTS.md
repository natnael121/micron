# Telegram Serverless Bot + Mini App — Agent Orientation

This project uses **Telegram Serverless (tgcloud)** to host both the bot backend and the Mini App frontend directly on Telegram's infrastructure.

## Project Structure

```
micron/
├── tgcloud/              # ← Everything Telegram runs
│   ├── handlers/         # Bot update handlers (one per Telegram update type)
│   │   ├── message.js        # /start, /menu, /help commands
│   │   └── callback_query.js # Inline button presses (approve/reject orders)
│   ├── endpoints/        # Functions the Mini App calls via Serverless.call()
│   │   ├── placeOrder.js     # Sends new order notifications to staff
│   │   ├── notifyWaiter.js   # Sends waiter call notifications
│   │   └── confirmPayment.js # Sends payment confirmation to admin
│   ├── lib/              # Shared code (imported by handlers & endpoints)
│   │   ├── firestore.js      # Firebase Firestore REST API bridge
│   │   └── notify.js         # Telegram notification helpers
│   └── schema.js         # tgcloud SQLite database tables
├── src/                  # React Mini App (Vite + TypeScript)
│   ├── pages/
│   │   ├── MenuPage.tsx      # Main customer menu (shown inside Telegram)
│   │   └── ScanGateway.tsx   # QR scan gateway (detects Telegram vs web)
│   └── ...
├── tgcloud.jsonc         # tgcloud project config (points dist/ to Telegram hosting)
└── dist/                 # Built React app — deployed to tgcloud Mini App hosting
```

## SDK conventions (IMPORTANT — tgcloud V8 sandbox)

- Import `api` and `db` from `'sdk'` — never install npm packages for bot logic
- Import db helpers (`eq`, `sql`, `and`, etc.) from `'sdk/db'`
- Use relative imports with `.js` extension: `import { notify } from '../lib/notify.js'`
- No `node_modules` at runtime — no `require()`, no CommonJS
- All `db` calls are **async** — always `await` them
- No foreign keys in schema
- `fetch()` is available for outbound HTTP (used in `lib/firestore.js`)
- `crypto.subtle` is available (WebCrypto API)
- `btoa` / `atob` are available

## Data architecture

| Data | Where stored |
|---|---|
| Menu items, orders, bills | Firebase Firestore (accessed via REST API in `lib/firestore.js`) |
| Bot session state (who scanned which table) | tgcloud SQLite (`schema.js`) |
| Waiter call acknowledgments | tgcloud SQLite (`schema.js`) |

## Deploy workflow

```bash
# 1. Build the React Mini App
npm run build

# 2. Deploy bot code + Mini App frontend to Telegram
npx tgcloud push

# 3. Apply any database schema changes
npx tgcloud migrate

# Or do all three at once:
npm run tgcloud:deploy
```

## Environment secrets (set once via CLI)

```bash
npx tgcloud secret set ADMIN_CHAT_ID -1002701066037
npx tgcloud secret set KITCHEN_CHAT_ID -1002660493020
npx tgcloud secret set BAR_CHAT_ID -1002859150516
npx tgcloud secret set FIREBASE_PROJECT_ID menu-ordering-app-fe429
npx tgcloud secret set FIREBASE_SERVICE_ACCOUNT_JSON '{"type":"service_account",...}'
npx tgcloud secret set APP_URL https://app<id>.tgcloud.ai
```

## Adding a new bot command

1. Edit `tgcloud/handlers/message.js` — add a `case` in the switch block
2. Run `npx tgcloud push` to deploy

## Adding a new Mini App endpoint

1. Create `tgcloud/endpoints/<name>.js` with `export default async function(payload, context) { ... }`
2. Call it from React: `await Telegram.WebApp.Serverless.call('<name>', payload)`
3. Run `npx tgcloud push`

## Testing without deploying

```bash
npx tgcloud run handlers/message '{ chat: { id: 123 }, from: { id: 456, first_name: "Test" }, text: "/start cafeId_1" }'
npx tgcloud run handlers/callback_query '{ data: "approve_order_abc123", message: { chat: { id: 123 } }, from: { id: 456, first_name: "Staff" } }'
```
