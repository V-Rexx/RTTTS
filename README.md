# CityTrack

Real-time city bus tracking: passengers track live buses and routes on a map,
drivers broadcast their GPS position from a phone, and admins manage cities,
routes, stops, buses, and driver accounts.

**Stack:** Node/Express 5 + MongoDB (Mongoose) + Socket.io backend · React 18 +
Vite + Tailwind + Leaflet frontend.

## Project layout

```
backend/    Express API + Socket.io (passenger and driver namespaces)
frontend/   React SPA — passenger map, driver console, admin dashboard
render.yaml         Render blueprint for the backend
frontend/vercel.json  Vercel config for the frontend
```

## Local setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values below
npm run seed            # creates the first admin account + nothing else
npm run dev              # http://localhost:5001
```

`.env` values:

| Variable | Notes |
|---|---|
| `PORT` | `5001` locally. Render sets this itself in production — don't override it there. |
| `NODE_ENV` | `development` locally, `production` when deployed. Controls cookie `secure`/`sameSite` behavior — see below. |
| `MONGO_URI` | Local: `mongodb://127.0.0.1:27017/citytrack`, or an Atlas connection string. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Any long random strings. Must differ from each other. |
| `CLIENT_URLS` | Comma-separated list of allowed frontend origins, e.g. `http://localhost:5173,https://citytrack.vercel.app`. Empty locally allows any origin; **must** be set in production (credentialed CORS can't use `*`). |
| `GEMINI_API_KEY` | From [Google AI Studio](https://aistudio.google.com/apikey). The chatbot needs a Cloud project with **billing enabled** — the Gemini free tier still requires a linked billing account, or the API returns a `limit: 0` quota error. |

`npm run seed` creates one admin account: `admin@citytrack.com` / `admin123`.
Change this password after first login — the seed script only runs this once
(it skips silently if an admin already exists).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5001
npm run dev              # http://localhost:5173
```

### 3. Testing the driver flow on a real phone

The Geolocation API requires a secure context (HTTPS, or `localhost`
specifically) — opening the dev server via your machine's local network IP
(`http://192.168.x.x:5173`) on a phone gets silently blocked by the browser.
To test with real GPS on a phone before deploying, tunnel the dev server
through something HTTPS (e.g. `ngrok http 5173`) rather than using the raw
LAN IP.

## Roles

- **Passengers** — no login. Search a city, see live buses/routes, ask the
  chatbot, use "Find my bus."
- **Drivers** — created by an admin (`/admin/drivers`), log in at `/login`,
  land on `/driver`. Start/end shift, report breakdowns, broadcast GPS.
- **Admins** — first one seeded (see above); can create more via
  `/admin/drivers`. Manage cities, routes, stops, buses; view the live fleet
  across every city at `/admin/fleet`.

## Known limitations

- **No account deletion** — the backend has no endpoint to delete a user, so
  test driver/admin accounts accumulate. Remove them directly in MongoDB if
  needed.
- **Gemini free tier** — a `429`/`limit: 0` error from `/api/chat` almost
  always means the linked Cloud project doesn't have billing enabled, not a
  transient rate limit.
- **Route road-following** uses OSRM's free public demo server
  (`router.project-osrm.org`) — fine for development, but it's meant for
  light usage, not production traffic. Self-hosting OSRM (or swapping in
  another routing provider) is a drop-in replacement if you outgrow it.
- **Nominatim** (used for "Discoverable" city search) has the same
  free-tier-demo caveat and a ~1 req/sec usage policy — the search box's
  debounce keeps normal usage under that.
- **GPS accuracy** depends entirely on the driver's device. Phones with real
  GPS hardware typically report 5–20m; laptops/desktops fall back to
  WiFi or IP-based positioning, which can be off by hundreds to thousands of
  meters. The driver console surfaces the live accuracy reading so this is
  visible rather than silently wrong.

## Deployment

### MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Network Access** → allow access from anywhere (`0.0.0.0/0`) — Render's
   outbound IPs aren't static on the free plan, so a fixed allowlist isn't
   an option there without a paid Atlas network-peering add-on.
3. **Database Access** → create a user with a strong password.
4. Get the connection string (Drivers → Connect → Connect your application),
   fill in the user/password, and use it as `MONGO_URI`.

### Backend → Render

1. Push this repo to GitHub/GitLab.
2. In Render: New → Blueprint → point at the repo. It picks up `render.yaml`
   at the root automatically.
3. Fill in the `sync: false` env vars Render will prompt for:
   `MONGO_URI`, `CLIENT_URLS` (the Vercel URL from the next step — you can
   circle back and set this after deploying the frontend), `GEMINI_API_KEY`.
   `JWT_SECRET`/`JWT_REFRESH_SECRET` are auto-generated by the blueprint.
4. Deploy. Render assigns the service a URL like
   `https://citytrack-backend.onrender.com` — that's your `VITE_API_URL`.

Note: Render's free tier spins the service down after ~15 minutes of
inactivity; the first request after idling takes a few extra seconds to
wake it back up. That's a plan limitation, not a bug.

### Frontend → Vercel

1. Import the repo in Vercel, set **Root Directory** to `frontend`.
2. Vercel auto-detects the Vite framework preset; `frontend/vercel.json`
   handles the SPA rewrite so client-side routes (`/city/:slug`,
   `/admin/*`, etc.) don't 404 on a hard refresh.
3. Set the environment variable `VITE_API_URL` to your Render backend URL.
4. Deploy. Take the resulting `https://<project>.vercel.app` URL back to
   Render's `CLIENT_URLS` env var (comma-separate it with `localhost:5173`
   if you want local dev to keep working against the same deployed backend).

### Cross-site cookies

The refresh-token cookie is `httpOnly` and, in production
(`NODE_ENV=production`), set with `sameSite=none; secure=true` — required
because the frontend (Vercel) and backend (Render) are different domains, and
browsers only honor cross-site cookies over HTTPS. Both Render and Vercel
serve over HTTPS by default, so no extra TLS setup is needed. Locally, both
run on `http://localhost` so the cookie stays `sameSite=strict` and
non-secure, which works fine over plain HTTP.
