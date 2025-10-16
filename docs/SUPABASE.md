Supabase setup for leaderboard

1) Create a Supabase project at https://app.supabase.com

2) Create a table named `leaderboard` with columns:
   - id uuid (primary key, default: gen_random_uuid())
   - name text
   - level_id text
   - score integer
   - timestamp timestamptz

   Example SQL:
   ```sql
   create extension if not exists pgcrypto;
   create table leaderboard (
     id uuid primary key default gen_random_uuid(),
     name text,
     level_id text,
     score integer,
     timestamp timestamptz
   );
   ```

3) In your Vercel project, set the following environment variables (you said you already added these):
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY

4) No additional server-side secret is required for basic public inserts, but consider using RLS or a service_role key for stricter control.

If you'd like, I can generate the SQL directly and help confirm the table exists if you share that you created it.
