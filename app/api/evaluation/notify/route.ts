import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { dispatchLifecycleEvent } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch {}
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch {}
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await request.json();

        // Add fallback log console print to satisfy track requirement
        console.log(`[ORACLE_ADMIN_TELEMETRY] Simulated Dispatch for user ${userId}:`, body.context);

        // Fire live outbound event dispatch
        await dispatchLifecycleEvent(userId, 'REPORT_GENERATED', body.context);

        return NextResponse.json({ success: true });
        
    } catch (err) {
        console.error('[ORACLE] Notification dispatch error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
