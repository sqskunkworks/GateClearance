# Deployment (Vercel)

- **Pre-flight**: Ensure Supabase schema/enums from `db/schema.ts` exist and env vars are ready. Run `npm run build` locally to catch issues before shipping.
- **Vercel settings**: Connect the repo, set Install=`npm install`, Build=`npm run build` (Turbopack), Output=`.next`, Runtime=Node 18+. No custom headers needed for App Router defaults.
- **Secrets**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Project Settings → Environment Variables. Add `SUPABASE_SERVICE_ROLE_KEY` plus PDF/storage keys (e.g., Google Drive or Supabase Storage) when the server routes for submission/PDF upload are wired up.
- **Deploy flow**: Push to the tracked branch → Vercel auto-builds. Verify `/personal` → `/contact` → `/rules` → `/experience` → `/security` navigation, and run auth flows against Supabase. Point `/testSupabase` at a real table for a quick connectivity smoke test.
- **Post-deploy**: Enable a custom domain, restrict Supabase CORS to the Vercel origin, and confirm logs do not emit PII (SSN/government ID) once server routes are added.
