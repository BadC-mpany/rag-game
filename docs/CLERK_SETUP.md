# Clerk Authentication Setup Guide

This guide explains how the application uses [Clerk](https://clerk.com/) for authentication and connects it to Supabase for data storage.

## Overview

The application uses:
- **Clerk** for user authentication and session management
- **Supabase** for data storage (leaderboard, user profiles, email subscribers)

The `clerk_id` from Clerk is used as the unique identifier in Supabase, allowing seamless integration between auth and data layers.

## Environment Variables

Make sure you have the following in your `.env.local`:

```bash
# Clerk keys (get from Clerk Dashboard: https://dashboard.clerk.com/last-active?path=api-keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY

# Supabase connection (optional if already set up)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema

### user_profiles Table

Stores Clerk user information in Supabase:

```sql
- id: UUID (Primary Key)
- clerk_id: VARCHAR(255) (Unique, references Clerk user ID)
- email: VARCHAR(255)
- display_name: VARCHAR(255)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP (auto-updated)
```

### leaderboard Table (Updated)

Now uses `clerk_id` instead of `user_id`:

```sql
- id: UUID
- clerk_id: VARCHAR(255) (References Clerk user ID)
- level_id: VARCHAR(255)
- score: INTEGER
- timestamp: TIMESTAMP
- Unique constraint: (clerk_id, level_id)
```

## Setup Steps

### 1. Create Clerk Account

1. Go to [Clerk.com](https://clerk.com/)
2. Sign up and create a new application
3. Choose your authentication methods (email/password, social, etc.)
4. Get your API keys from [API Keys page](https://dashboard.clerk.com/last-active?path=api-keys)

### 2. Set Environment Variables

Add your Clerk keys to `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
```

### 3. Database Migration

Run the `user_profiles_setup.sql` script in Supabase SQL editor to:
- Create the `user_profiles` table
- Update the `leaderboard` table to use `clerk_id`
- Set up indexes and triggers

### 4. Application Already Configured

The app is pre-configured with:
- ✅ `middleware.ts` - Protects routes with Clerk
- ✅ `ClerkProvider` in `_app.tsx`
- ✅ Clerk hooks in components (Sidebar, Auth components)
- ✅ API endpoints updated for Clerk

## Architecture

### Client-Side Auth Flow

```
User → Clerk UI (sign up/sign in) → Clerk Session → useAuth() hook → Components
```

### Server-Side Auth Flow

```
API Request → middleware.ts (auth().protect()) → auth() from Clerk → clerk_id
                                   ↓
                        Get user data from Clerk
                                   ↓
                        Query Supabase with clerk_id
```

### Key Components

#### 1. `middleware.ts`

Protects routes using Clerk:

```typescript
const isProtectedRoute = createRouteMatcher([
  "/play(.*)",
  "/dashboard(.*)",
  "/diffs(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect(); // Redirects to sign-in if not authenticated
  }
});
```

#### 2. `pages/_app.tsx`

Wraps app with ClerkProvider:

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Head>...</Head>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
```

#### 3. Components Using Clerk Auth

Example from `components/Sidebar.tsx`:

```typescript
import { useAuth, useClerk } from '@clerk/nextjs';

export default function Sidebar() {
  const { user, isSignedIn } = useAuth();
  const { signOut } = useClerk();

  // user: Current Clerk user object
  // isSignedIn: Boolean indicating if user is signed in
  // signOut(): Function to sign out user
}
```

#### 4. Server-Side API Endpoints

Example from `pages/api/user/stats-clerk.ts`:

```typescript
import { auth } from '@clerk/nextjs/server';
import { getSupabaseServiceClient } from '../../../lib/supabase';

export default async function handler(req, res) {
  const { userId } = auth(); // Get Clerk user ID

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseServiceClient();

  // Query Supabase using clerk_id
  const { data } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('clerk_id', userId);
}
```

## Helper Functions

### `lib/clerk-supabase.ts`

Provides utilities for syncing Clerk users with Supabase:

```typescript
// Sync Clerk user to Supabase
await syncClerkUserToSupabase(clerkUser);

// Get user profile by Clerk ID
const profile = await getOrCreateClerkUserProfile(clerkUserId);

// Get Clerk ID by email
const clerkId = await getClerkIdByEmail('user@example.com');
```

## Migrating from Supabase Auth to Clerk

If you had users in Supabase Auth previously:

1. **Export existing users** from Supabase Auth
2. **Create corresponding Clerk users** (manually or via Clerk API)
3. **Update leaderboard records** to use new `clerk_id` values:

```sql
UPDATE leaderboard
SET clerk_id = (SELECT clerk_id FROM user_profiles WHERE old_user_id = leaderboard.user_id)
WHERE clerk_id IS NULL;
```

4. **Test thoroughly** before removing old `user_id` column

## User Sign-Up Flow

When a user signs up via Clerk:

1. Clerk creates the user account
2. Clerk session is established
3. On first API request, the user is synced to Supabase via `syncClerkUserToSupabase()`
4. User profile is created in `user_profiles` table
5. User can start playing levels

## Using Clerk Components

Clerk provides pre-built UI components:

```typescript
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function Header() {
  return (
    <header>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </header>
  );
}
```

## Debugging

### Check Clerk Session

In browser console:

```javascript
// Get current session info
window.__clerk?.getAuth();
```

### View Logs

- Clerk Dashboard: https://dashboard.clerk.com/last-active?path=logs
- Application console for errors

### Common Issues

**"Unauthorized" error on API calls:**
- Check if route is protected by middleware
- Verify Clerk session is active
- Ensure API endpoint is using `auth()` correctly

**User profile not in Supabase:**
- Manually call `syncClerkUserToSupabase()` after sign-up
- Check `user_profiles` table for errors

**LeaderboardSubmit failing:**
- Verify `leaderboard` table has `clerk_id` column
- Check unique constraint on `(clerk_id, level_id)`

## Next Steps

1. ✅ Install @clerk/nextjs
2. ✅ Add environment variables
3. ✅ Run database migrations
4. ✅ Test authentication flow
5. Update any remaining API endpoints to use Clerk
6. Remove old Supabase Auth components (if any remain)

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js SDK](https://clerk.com/docs/sdk/nextjs)
- [Clerk API Reference](https://clerk.com/docs/reference/backend-api)
- [Supabase Documentation](https://supabase.com/docs)

