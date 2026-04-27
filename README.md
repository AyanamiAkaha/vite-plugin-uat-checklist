# vite-plugin-uat-checklist

A Vite plugin that overlays a UAT (User Acceptance Testing) checklist panel on your dev server. Define your checklist as YAML, JSON, or Markdown — the plugin injects a sidebar panel so you can click through features and check items off without leaving your app.

- **Dev-only** — never included in production builds (`apply: 'serve'`)
- **Shadow DOM** — styles are fully isolated from your app
- **HMR** — edit the checklist file and the panel updates instantly
- **Persistent state** — checked items survive page reloads (localStorage, keyed by release version)
- **Zero app code changes** — just add the plugin to `vite.config.ts`

## Install

```bash
# From your private Gitea registry
npm install @yourscope/vite-plugin-uat-checklist --save-dev

# Or directly from git
npm install git+https://your-gitea.example.com/youruser/vite-plugin-uat-checklist.git --save-dev
```

## Setup

### 1. Add to your Vite config

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { uatChecklist } from '@yourscope/vite-plugin-uat-checklist'

export default defineConfig({
  plugins: [
    vue(),
    uatChecklist({
      // All options are optional — defaults shown below
      checklist: './uat-checklist.yaml', // auto-detected if omitted
      position: 'right',                // 'left' | 'right'
      width: 360,                       // panel width in px
      collapsed: false,                 // start collapsed
    }),
  ],
})
```

### 2. Create a checklist file in your project root

The plugin auto-detects files in this order:
1. `uat-checklist.yaml`
2. `uat-checklist.yml`
3. `uat-checklist.json`
4. `uat-checklist.md`

Or specify an explicit path with the `checklist` option.

## Checklist formats

### YAML (recommended)

```yaml
release: "2.4.0"
title: "My App UAT"

sections:
  - name: Authentication
    items:
      - text: Login with valid credentials
        route: /login
      - text: Password reset flow completes
        route: /reset-password
        notes: Check that email arrives within 30s
  - name: Dashboard
    items:
      - text: Charts load without console errors
        route: /dashboard
```

### JSON

```json
{
  "release": "2.4.0",
  "title": "My App UAT",
  "sections": [
    {
      "name": "Authentication",
      "items": [
        { "text": "Login with valid credentials", "route": "/login" },
        { "text": "Password reset flow", "route": "/reset-password" }
      ]
    }
  ]
}
```

### Markdown

```markdown
# My App UAT

## Authentication

- [ ] Login with valid credentials (route: /login)
- [ ] Password reset flow (route: /reset-password)

## Dashboard

- [ ] Charts load without console errors (route: /dashboard)
```

The `(route: /path)` syntax in markdown items is optional and parsed into navigable links.

## Item fields

| Field   | Required | Description                        |
|---------|----------|------------------------------------|
| `text`  | yes      | What to test                       |
| `route` | no       | App route — rendered as a link     |
| `notes` | no       | Extra context shown below the item |

## How it works

- The plugin registers a middleware at `/__uat-checklist/data` that serves the parsed checklist as JSON
- `transformIndexHtml` injects a `<script type="module">` that renders the panel inside a Shadow DOM
- `fs.watchFile` monitors the checklist file and pushes updates via Vite's HMR WebSocket (`uat-checklist:update` event)
- Checked state is stored in `localStorage` under `uat-checklist:{title}:{release}` — bump the `release` field to start fresh

## Gitea npm registry setup

In your consuming projects, add an `.npmrc`:

```ini
@yourscope:registry=https://your-gitea.example.com/api/packages/youruser/npm/
//your-gitea.example.com/api/packages/youruser/npm/:_authToken=${GITEA_TOKEN}
```

Then `npm install @yourscope/vite-plugin-uat-checklist --save-dev`.

## Development

```bash
git clone https://your-gitea.example.com/youruser/vite-plugin-uat-checklist.git
cd vite-plugin-uat-checklist
npm install
npm run dev   # watch mode with tsup
```

## License

MIT
