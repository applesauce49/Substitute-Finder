# Contributor Guide

This document is engineering-facing and complements the product-facing [README.md](README.md).

For architecture diagrams and codebase exploration, see Deep Wiki: [deepwiki.com/applesauce49/Substitute-Finder](https://deepwiki.com/applesauce49/Substitute-Finder).

## Repository Layout

```text
client/   React app (routing, UI, Apollo client)
server/   Node/Express app (GraphQL API, auth, matching, integrations)
```

## Runtime Architecture

### Client

- Entry and provider composition: `client/src/root.js`
- App shell and routes: `client/src/App.js`
- GraphQL client behavior:
  - auth header injection
  - GraphQL/network error handling
  - token refresh attempts
  - HTTP and WebSocket split for subscriptions

### Server

- Entry point: `server/server.js`
- GraphQL server construction: `server/graphql/server.js`
- Schema composition: `server/schemas/index.js`
- Resolver composition: `server/schemas/resolvers/index.js`

Current server startup sequence:

1. Load environment configuration
2. Connect MongoDB and sync key indexes
3. Bootstrap admin user when DB is empty
4. Initialize system settings defaults
5. Start Express middleware stack and auth routes
6. Attach GraphQL HTTP endpoint and WS subscriptions

## Core Domains

### Authentication

- OAuth routes: `server/routes/authRoutes.js`
- Passport setup: `server/auth/`
- JWT validation in both HTTP and WS GraphQL contexts

### Jobs and Reporting

- Job queries/mutations/subscriptions in resolver layer
- Reporting UI centered on reusable table components
- Main report page: `client/src/pages/JobReport.js`

### Matching Engine

- Main orchestration: `server/matchEngine/matchEngine.js`
- Supporting modules:
  - constraints and system attributes
  - scoring logic
  - data loaders
- Supports dry-run previews and live assignment workflows

### Admin Workspace

- Layout shell: `client/src/pages/admin/AdminLayout.js`
- Section router/panel: `client/src/pages/admin/SettingsPanel.js`
- Sidebar navigation: `client/src/pages/admin/Sidebar.js`
- Metrics dashboard: `client/src/pages/admin/settings/MetricsPage.js`

## Environment Variables

The following variables are referenced in current code.

### Server

- `MONGODB_URI`
- `SESSION_SECRET`
- `JWT_SECRET`
- `PORT`
- `NODE_ENV`
- `USE_HTTPS`
- `BACKEND_URL`
- `FRONTEND_URL`
- `PUBLIC_BASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_WEBHOOK_URL`
- `SCHEDULER_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_PHONE`
- `HTTPS_PROXY` (optional)

### Client

- `REACT_APP_API_URL`
- `REACT_APP_MAINTENANCE_MODE`

## Setup and Run

### Install

From repository root:

```bash
npm run install
```

### Develop

Run client and server together:

```bash
npm run develop
```

### Build

Build frontend bundle:

```bash
npm run build
```

### Other Root Scripts

- `npm start` runs server
- `npm run seed` runs server seed task

## Branching and Change Scope

- Keep product/UX copy in [README.md](README.md)
- Keep technical details in [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Prefer small, focused PRs by domain (auth, jobs, admin UI, match engine)

## Operational Notes

- CORS allowlist is in `server/config/corsOptions.js`
- Netlify frontend build settings are in `netlify.toml`
- Local HTTPS mode uses certs under `server/certs` with `USE_HTTPS=true`
- Managed scheduler endpoint is `POST /api/scheduler/run-match-engine` with header `x-scheduler-key: <SCHEDULER_API_KEY>`
- Scheduler precheck endpoint is `GET /api/scheduler/eligible-jobs` with the same `x-scheduler-key` header

## Useful Companion Docs

- Metrics implementation notes: [METRICS_DASHBOARD.md](METRICS_DASHBOARD.md)
- Deep architecture explorer: [deepwiki.com/applesauce49/Substitute-Finder](https://deepwiki.com/applesauce49/Substitute-Finder)
