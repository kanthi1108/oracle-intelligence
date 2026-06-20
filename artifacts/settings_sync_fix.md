# PRIORITY 2 — Settings Profile Sync Fix

## Problem
The settings page (`app/settings/page.tsx`) called `supabase.auth.updateUser()` to update display name in Supabase Auth `user_metadata`. But the application reads profile data from `public.users.full_name` via `GET /api/auth/profile`. Since `public.users` was never updated, profile changes never appeared in the application.

## Solution
Two changes to sync profile updates to both stores:

### 1. New PATCH handler on Profile API
**File:** `app/api/auth/profile/route.ts`

Added `PATCH` handler that:
- Authenticates via Supabase session cookie
- Accepts `{ full_name, company_name }` in request body
- Uses `createServiceRoleClient()` to update `public.users` table:
  - `full_name` column updated from `body.full_name`
- Returns `{ success: true }`

### 2. Settings page sync on save
**File:** `app/settings/page.tsx:51-66`

After `supabase.auth.updateUser()` succeeds, added a second API call:
- `PATCH /api/auth/profile` with `{ full_name: displayName, company_name: companyName }`
- If the PATCH fails, it logs to console but does not block the success message (auth metadata was already updated)
- This ensures both `auth.users.user_metadata` AND `public.users.full_name` are updated

### 3. GET handler also returns full_name
**File:** `app/api/auth/profile/route.ts` (GET)

Updated the `.select()` query to include `full_name`:
```
.select('id, role, subscription_tier, full_name')
```

### 4. Settings initial load from profile API
**File:** `app/settings/page.tsx:20-32`

Added a fallback `fetch('/api/auth/profile')` call in the initial load to get `full_name` from `public.users`, ensuring the form displays the persisted value even after refresh.

## Verification Flow
1. Open Settings → Display Name shows current value from auth metadata
2. Change Display Name to new value → Save
3. `supabase.auth.updateUser()` updates auth metadata
4. `PATCH /api/auth/profile` updates `public.users.full_name`
5. Refresh page → Display Name still shows updated value (from profile API)
6. Logout → Login → Settings → Display Name still shows updated value

## Files Modified
| File | Change |
|------|--------|
| `app/settings/page.tsx` | Added PATCH call to profile API after auth update; added profile API fallback for initial load |
| `app/api/auth/profile/route.ts` | Added PATCH handler for public.users update; added full_name to GET select |

## Database Tables
| Table | Column | Usage |
|-------|--------|-------|
| `public.users` | `full_name` | Now updated when user changes display name in settings |
