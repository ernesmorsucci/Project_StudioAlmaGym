# Deploy

## Backend

Suggested platforms: Render, Railway, Fly.io or any Node hosting with MongoDB Atlas.

- Root directory: `BACK`
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/health`
- Node version: `20` or newer

Required environment variables:

- `NODE_ENV=production`
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `EMAIL_USER`
- `EMAIL_PASS`

`FRONTEND_URL` can contain more than one origin separated by commas, for example:

```txt
https://almagym.vercel.app,https://www.almagym.com
```

## Frontend

Suggested platforms: Vercel or Netlify.

- Root directory: `FRONT`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- SPA fallback: already configured with `FRONT/vercel.json` and `FRONT/public/_redirects`

Required environment variables:

- `VITE_API_URL=https://your-backend-domain/api`
- `VITE_BANK_CBU`
- `VITE_BANK_ALIAS`
- `VITE_WHATSAPP_DISPLAY`

## Important

The app uses an HTTP-only cookie for auth. In production the frontend and backend must both use HTTPS, and `VITE_API_URL` must point to the backend URL ending in `/api`.

`npm run lint` currently reports pre-existing frontend lint errors. The production build was verified with `npm run build`, so deploys that run only the build command can still pass.

## Blank Frontend Page

If the deployed frontend shows a blank page, check the browser console and verify:

- `VITE_API_URL` is set in the frontend hosting provider, not only in local `.env`.
- `VITE_API_URL` uses the public HTTPS backend URL and ends with `/api`.
- `FRONTEND_URL` in the backend matches the public frontend URL exactly.
- The backend health URL works, for example `https://your-backend-domain/health`.
