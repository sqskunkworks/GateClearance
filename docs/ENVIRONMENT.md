# Environment

- **Prereqs**: Node 18+ and npm 10+; access to a Supabase project with Postgres enabled.
- **Env vars (.env.local)**:  
  - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL.  
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon/public key.  
  - Optional/future server routes: `SUPABASE_SERVICE_ROLE_KEY` and any PDF/storage keys (e.g., Google Drive or Supabase Storage) once implemented.
- **Database shape**: Create enums (`gender`, `application_status`, `government_id_type`) and tables `applications` and `documents` to match `db/schema.ts` (Drizzle). Apply via Supabase SQL or Drizzle migrations before enabling writes.
- **Install & run**: `npm install` (include `framer-motion` and `lucide-react` if not already in lockfile), `npm run dev` for local app, `npm run lint` for checks, `npm run build` to validate production output (Turbopack), `npm start` to serve a build.
- **Local auth**: Seed email/password users in Supabase auth; the app’s login/signup pages hit Supabase directly. The `/testSupabase` page can be pointed at a real table to confirm connectivity during setup.
