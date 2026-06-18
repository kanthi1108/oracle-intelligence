// lib/supabase/client.ts
// Browser-side Supabase client — PRD §2.2
// Used in Client Components for real-time subscriptions and auth state

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
