# PRIORITY 3 — Report Sharing Implementation

## Problem
The `flag_shared` column existed in the `reports` table but there was zero implementation for sharing reports — no API, no UI, no database table for delivery tracking.

## Solution
Implemented a complete "Share Report" workflow with delivery simulation.

### 1. Database Migration
**New file:** `supabase/migrations/005_email_delivery_logs.sql`

New table `public.email_delivery_logs`:
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID PK | Primary key |
| `user_id` | UUID FK → users(id) | Sharing user |
| `report_id` | UUID FK → reports(id) | Shared report |
| `recipient_email` | TEXT | Target email |
| `status` | TEXT | `queued` / `sent` / `failed` (default: `queued`) |
| `sent_at` | TIMESTAMPTZ | Null until sent |
| `created_at` | TIMESTAMPTZ | When queued |

RLS Policies:
- Users can SELECT/INSERT own delivery logs
- Admins can view all delivery logs

### 2. Share API
**New file:** `app/api/reports/share/route.ts`

`POST /api/reports/share`
- Authenticates via Supabase session cookie
- Validates `report_id` and `recipient_email` in request body
- Basic email format validation
- Resolves `user_id` from `auth_id` via `users` table
- Verifies report exists
- Inserts into `email_delivery_logs` with `status: 'queued'`
- Updates `reports.flag_shared = true`
- Returns `{ success: true, message: "Report delivery queued successfully.", delivery: { id, created_at } }`

### 3. Share Report Modal
**New file:** `components/ShareReportModal.tsx`

React component with:
- Email input field (required)
- Send button with loading state
- Success state ("Report delivery queued successfully.") with Done button
- Error state with message display
- Dark theme matching existing design system
- Click-outside-to-close behavior

### 4. UI Integration
**Modified:** `app/page.tsx`

- Added `showShareModal` state
- Imported `ShareReportModal`
- "Share Report" button rendered after the "Export Report" button, **only when viewing a saved report** (`engine.activeSavedReportId` is set)
- Modal rendered at the bottom of the component tree when `showShareModal` is true

## Verification Flow
1. Open a saved report from library
2. "Share Report" button appears below Export
3. Click → Modal opens with email field
4. Enter email → Click "Send Report"
5. API validates, inserts delivery log with status 'queued'
6. Success message shown: "Report delivery queued successfully."
7. Click Done → modal closes
8. Report's `flag_shared` updated to true in DB

## Files Created
| File | Purpose |
|------|---------|
| `supabase/migrations/005_email_delivery_logs.sql` | New table + RLS policies |
| `app/api/reports/share/route.ts` | Share API endpoint |
| `components/ShareReportModal.tsx` | Share modal component |

## Files Modified
| File | Change |
|------|--------|
| `app/page.tsx` | Added share button + modal integration |

## Database Tables
| Table | Purpose |
|-------|---------|
| `public.email_delivery_logs` | Delivery tracking (queued/sent/failed) |
| `public.reports.flag_shared` | Marked true when report is shared |
