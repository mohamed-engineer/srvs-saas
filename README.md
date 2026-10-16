# SRVS Accounting

SaaS for accounting and shop operations, built with Next.js, Supabase Auth/Postgres and Kashier hosted payment sessions. Arabic RTL interface, using SRVS colors and typography.

## Local setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Copy `.env.example` to `.env.local`, then add the Supabase Project URL and publishable key. Add the server-only Supabase Secret Key (`sb_secret_...`); the legacy service-role key is also accepted for older projects.
3. Add the test Merchant ID, Payment API Key and Secret Key from the Kashier test dashboard. Keep all three in test mode together.
4. Set the agreed plan prices in EGP in `.env.local`. Checkout stays disabled until all three plan prices and payment credentials are configured.
5. Set `APP_URL` to the site's public HTTPS URL. For local Kashier testing, use an HTTPS tunnel to port 3000 and use that tunnel URL for `APP_URL` and `KASHIER_WEBHOOK_URL`. Kashier cannot send webhooks to localhost.
6. In Supabase Auth URL Configuration, add `${APP_URL}/auth/callback` to the allowed redirect URLs.
7. Restart Next.js after changing environment variables, then use the test environment before changing `KASHIER_MODE` to `live`.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

## Routes

- `/`: SRVS Accounting landing page and plans.
- `/create`: business setup, account registration/login and checkout.
- `/login`: email/password sign-in and sign-up.
- `/payment/return`: waits for Kashier's server-confirmed result; it does not trust the browser redirect by itself.
- `/workspace/[slug]`: private, owner-checked active workspace.
- `/profile`: profile contact information and workspace branding settings.
- `/app`: redirects a signed-in owner to their active workspace, or to setup.
- `/demo`: the original local-only dashboard demo; it is not connected to tenant database records.

## Payment and provisioning notes

Plan prices are server-configured, not taken from browser input. A pending workspace and payment order are created on the server. Kashier's HMAC-signed webhook is checked against the Payment API Key, merchant ID, unique order ID, amount, and currency. Only a verified successful payment activates the workspace and subscription; the webhook uses a database function so duplicate notifications do not create duplicate subscriptions. In local test mode, if no public HTTPS webhook URL is configured, the authenticated return page verifies the session with Kashier's session API before activation.

Current monthly and annual checkout is a one-time payment for the configured period. Automatic recurring card charges are not enabled. Kashier's recurring flow requires card-token consent, secure token storage, and a scheduled server-side billing job; enable it only as a separate, explicit billing feature.

The schema covers account profiles, tenant workspaces, subscriptions, payment orders, products, customers, suppliers, invoices, invoice payments, inventory movements, and financial transactions, with workspace-scoped foreign keys and RLS. The older ERP demo modules still use browser-local sample data and are not wired to these tables yet. Double-entry journal posting and the tenant-scoped accounting APIs remain to be implemented before using this as a live accounting system. Do not use the demo dashboard or browser-local data as accounting records.
