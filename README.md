# Premium Wedding Invitation & Save the Date Platform

A production-ready, mobile-first wedding invitation website for personalized guest links, RSVP collection, admin editing, and professionally designed PDF exports.

Visual direction is inspired by Indo-western floral ceremony decor (ivory, champagne, sunflower, dusty rose, burgundy, bronze).

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Lucide icons
- Local JSON persistence (`data/wedding.json`) out of the box
- Optional Supabase persistence (`supabase/schema.sql`)
- Playwright Chromium for server-side PDF generation

## Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Open:

- Invitation: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)  
  Default password: `wedding-admin`

## What you can do

1. Edit couple names, date, venue, announcement and theme colours in **Admin → Wedding Details / Design**
2. Upload/replace hero and gallery photographs in **Admin → Gallery / Design**
3. Add, reorder and delete ceremony events in **Admin → Events**
4. Add guests, copy personalized `/invite/[token]` links, revoke or regenerate tokens
5. Collect RSVPs (persisted) and export CSV from **Admin → RSVP Responses**
6. Preview/download Digital, Print-ready (5×7 / A4 / A5), Save the Date and Ceremony PDFs

## Environment variables

See `.env.example`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL for invite links, OG tags and PDF rendering |
| `ADMIN_PASSWORD` | Admin dashboard password (plain text or bcrypt hash) |
| `ADMIN_SESSION_SECRET` | HMAC secret for admin session cookies |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional service role (server only — never expose to the client) |

Without Supabase credentials the app uses `data/wedding.json` and still fully supports RSVPs, guests, uploads and PDFs.

## Supabase setup

1. Create a Supabase project
2. Run `supabase/schema.sql` in the SQL editor
3. Set the three Supabase env vars
4. Restart the app — settings sync through the service role from API routes

## Important paths

```
src/app/page.tsx                 Public invitation
src/app/invite/[token]/page.tsx Personalized invitation
src/app/rsvp/[token]/page.tsx   Personalized RSVP
src/app/admin/page.tsx           Admin dashboard
src/app/api/rsvp/route.ts        RSVP persistence API
src/app/api/pdf/route.ts         PDF generation API
src/app/pdf/render/page.tsx      Print stylesheet document
src/lib/store.ts                 Central data layer
src/lib/defaults.ts              Editable default wedding content
public/images/hero-decor.jpg     Reference decor hero image
data/wedding.json                Local persistent store (auto-created)
```

## Deploy

1. Set `NEXT_PUBLIC_APP_URL` to your production domain
2. Set a strong `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`
3. Optionally configure Supabase for multi-instance persistence
4. Ensure Playwright Chromium is available on the host (or use a Playwright-capable runtime)
5. `npm run build && npm start`

For Vercel-like serverless hosts, prefer a Node server or container where Playwright can run, or generate PDFs via a dedicated worker.

## Notes

- Guest lists are never exposed on public APIs — only personalized pages resolve a token server-side
- Re-submitting an RSVP for the same invitation updates the existing response (no duplicate rows)
- Attendee counts are validated against each invitation’s maximum allocation
