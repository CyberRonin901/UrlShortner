## Frontend (React + Vite)

Single-page UI for calling the URL Shortner backend.

### Configure backend base URL

Copy `.env.example` to `.env` and set:

- `VITE_BACKEND_BASE_URL` (example: `http://localhost:5000`)

This frontend reads the value from `VITE_BACKEND_BASE_URL`.

### Run locally

From `frontend/`:

```bash
npm install
npm run dev
```

The dev server also proxies:

- `/api` to the backend (to reduce CORS issues)
- redirect/delete routes `/{id}` and `/{id}/{alias}` (also proxied)

### Build

```bash
npm run build
```

