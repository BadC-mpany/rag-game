# Newsletter Setup Guide

## Overview

The newsletter signup feature allows users to subscribe to updates from both the Badcompany website and the Hack the AI game. The system ensures email deduplication across both platforms.

## Database Schema

### email_subscribers Table

The `email_subscribers` table stores unique email addresses with timestamps:

```sql
- id: UUID (Primary Key, auto-generated)
- email: VARCHAR(255) (Unique, stored in lowercase)
- created_at: TIMESTAMP (When first subscribed)
- updated_at: TIMESTAMP (Last activity, auto-updated on changes)
```

### Deduplication Strategy

**Key Features:**

1. **Email Uniqueness**: The `email` column has a `UNIQUE` constraint, ensuring each email appears only once across both websites.

2. **Case-Insensitive Handling**: All emails are converted to lowercase before storage and checking, so `User@Example.com` and `user@example.com` are treated as the same subscriber.

3. **Automatic Timestamp Update**: A database trigger automatically updates `updated_at` whenever a record is modified.

4. **Idempotent Subscription**: If a user tries to subscribe with an already-subscribed email, the system:
   - Returns a success message with "Already subscribed. Subscription refreshed."
   - Updates the `updated_at` timestamp to track re-engagement

## Setup Instructions

### 1. Create the Table in Supabase

1. Go to your Supabase project
2. Open the SQL Editor
3. Copy the entire contents of `email_subscribers_setup.sql`
4. Execute the SQL script

This will create:
- The `email_subscribers` table
- An index on the `email` column for performance
- A trigger for automatic timestamp updates
- Row-level security policies

### 2. Environment Variables

Ensure your `.env.local` contains the Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. API Endpoint

The newsletter subscription API is available at:

```
POST /api/newsletter/subscribe
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Responses:**

Success (201):
```json
{
  "message": "Successfully subscribed to newsletter"
}
```

Already Subscribed (200):
```json
{
  "message": "Already subscribed. Subscription refreshed."
}
```

Error (400, 500):
```json
{
  "error": "Error message describing what went wrong"
}
```

## Implementation Details

### Frontend Component: NewsletterSignup

Located at `components/NewsletterSignup.tsx`

- Displays an email input form
- Handles form submission with client-side error handling
- Shows success/error messages to the user
- Disables form during submission
- Clears email input on successful subscription

### Backend Endpoint: /api/newsletter/subscribe

Located at `pages/api/newsletter/subscribe.ts`

**Logic:**

1. Validates HTTP method (POST only)
2. Validates email format (basic regex)
3. Converts email to lowercase
4. Checks if email already exists in database
5. If exists: Updates `updated_at` timestamp
6. If new: Creates new subscriber record
7. Returns appropriate response

## Usage Across Multiple Sites

Since both `https://www.badcompany.xyz/` and the Hack the AI game can use this endpoint:

1. **Same Database**: Both sites connect to the same Supabase project
2. **Unique Constraint**: The `UNIQUE` constraint on the email column ensures no duplicates
3. **Smart Handling**: The API intelligently detects existing subscriptions and updates them
4. **No Manual Merging**: The database automatically handles deduplication

## Querying Subscribers

To view all subscribers in Supabase:

```sql
SELECT * FROM email_subscribers ORDER BY created_at DESC;
```

To check subscription status for a specific email:

```sql
SELECT * FROM email_subscribers WHERE email = 'user@example.com';
```

To see recently re-engaged subscribers:

```sql
SELECT * FROM email_subscribers 
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

## Security Considerations

1. **Email Validation**: Basic regex pattern validation on the backend
2. **Rate Limiting**: Consider adding rate limiting to prevent spam
3. **Data Privacy**: Store emails securely and comply with GDPR/privacy regulations
4. **Service Role Key**: The API uses `getSupabaseServiceClient()` for server-side operations

## Future Enhancements

1. **Email Verification**: Send confirmation emails before full subscription
2. **Unsubscribe Link**: Add unsubscribe mechanism for compliance
3. **Subscriber Segmentation**: Track which site users subscribed from
4. **Newsletter Templates**: Create and manage newsletter templates
5. **Scheduled Sends**: Implement scheduled newsletter delivery

