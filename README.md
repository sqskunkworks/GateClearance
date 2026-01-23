## Overview
Gate Clearance is a multi-step application system built with Next.js, Supabase, and Vercel.
It handles draft persistence, sensitive data submission, and PDF generation for clearance review.

## Tech Stack
- Next.js (App Router)
- Supabase (Auth + Postgres)
- Zod (validation)
- Vercel (deployment)
- Google Drive API (PDF storage)

## Local Development
1. Clone repo
2. Create `.env.local` with required variables
3. `npm install`
4. `npm run dev`

## Deployment
- Hosted on Vercel
- Connected to sqskunkworks GitHub org
- Environment variables managed in Vercel dashboard

## Security Notes
- Sensitive fields (SSN, ID number, signature) are NOT stored in the web app
- Drafts use placeholders to satisfy NOT NULL constraints
- Final submission writes sensitive data and generates PDFs
