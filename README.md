# Insurance Issue Tracker

Production-oriented internal ticket tracker for insurance policy operations. Built with Next.js App Router, TypeScript, MongoDB/Mongoose, GridFS, NextAuth Google SSO, Tailwind CSS, Zod, React Hook Form, Zustand, dnd-kit, Recharts, Sharp, and a lightweight authenticated SSE realtime channel.

## Setup

1. Use Node.js 20.19+.
2. Copy `.env.example` to `.env.local`.
3. Create Google OAuth credentials and set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, and `AUTH_URL`.
4. Create a MongoDB Atlas database and set `MONGODB_URI`.
5. Install and run:

```bash
npm install
npm run dev
```

6. Optional seed data:

```bash
MONGODB_URI="your-uri" npm run seed
```

## Features

- Google SSO with authenticated protected routes.
- Jira-inspired Kanban board with Pending, In Progress, and Resolved columns.
- Drag-and-drop ticket status changes persisted to MongoDB.
- Ticket creation with Zod validation, Indian mobile validation, drag-and-drop image upload, and preview.
- Policy and general issue types with dynamic form validation.
- Human-readable ticket numbers such as `INS-1001` and `GEN-1002`.
- Assignment and reassignment by authenticated user email.
- My Tickets dashboard for assigned work.
- Analytics dashboard with status, priority, partner, and daily created charts.
- Ticket detail page with full metadata, image preview, status controls, copy ticket number, assignment, and chat.
- Realtime ticket/message updates through authenticated `/api/realtime` Server-Sent Events.
- Text, image, and mixed chat messages with preview/expand behavior.
- Images are compressed to WebP and stored in MongoDB GridFS with thumbnail variants.
- Debounced global search over ticket number, mobile, description, partner, assignee, and raised-by.
- Partner, priority, assignee filters, per-column counts, loading skeletons, empty states, and dark/light mode.

## Architecture

- `app/api/*`: Route handlers for tickets, status, messages, uploads, auth, and realtime.
- `app/api/images/*`: GridFS image upload and cached retrieval endpoints.
- `app/(protected)/*`: Authenticated App Router pages.
- `components/tickets/*`: Kanban, ticket cards, form, details, chat, and Zustand store.
- `components/analytics/*`: Recharts analytics dashboard.
- `lib/models/*`: Mongoose schemas with indexes for ticket number, assignee, status, priority, partner, created date, and chat lookup.
- `lib/validations/*`: Zod request schemas shared by UI and API.
- `lib/realtime/broker.ts`: Small in-process SSE broker.
- `lib/images.ts`: Sharp compression, WebP conversion, thumbnail generation, and GridFS helpers.

## Production Notes

- Images are stored in MongoDB GridFS. Monitor Atlas storage growth and consider lifecycle policies for old attachments if your retention policy allows it.
- The bundled SSE broker is intentionally lightweight and works well for local and single-instance deployments. For multi-region or high fan-out production realtime, swap `lib/realtime/broker.ts` for Pusher, Ably, Liveblocks, or a Redis pub/sub backed SSE service.
- Keep MongoDB Atlas indexes in sync with the Mongoose definitions.
- Run seed only in non-production environments.
- Add Google OAuth redirect URI: `https://your-domain.com/api/auth/callback/google`.
- Set all env vars in Vercel Project Settings.

## Deploy To Vercel + Atlas

1. Push the repo to GitHub.
2. Import it in Vercel.
3. Add environment variables from `.env.example`.
4. In MongoDB Atlas, allow Vercel egress or use the recommended Atlas network access configuration for your plan.
5. Deploy.
6. Create the Google production OAuth redirect URI:

```text
https://your-domain.com/api/auth/callback/google
```

7. Verify GridFS image retrieval through `/api/images/:id` after the first ticket/chat image upload.
