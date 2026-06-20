import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value; },
                    set(name: string, value: string, options: CookieOptions) {
                        try { cookieStore.set({ name, value, ...options }); } catch {}
                    },
                    remove(name: string, options: CookieOptions) {
                        try { cookieStore.set({ name, value: '', ...options }); } catch {}
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { report_id, recipient_email } = body;

        if (!report_id || !recipient_email) {
            return NextResponse.json({ error: 'report_id and recipient_email required' }, { status: 400 });
        }

        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        const serviceSupabase = createServiceRoleClient();

        // Resolve user
        const { data: userRow } = await serviceSupabase
            .from('users')
            .select('id')
            .eq('auth_id', session.user.id)
            .single();

        if (!userRow) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
        }

        // Verify report exists and belongs to user (or user is admin)
        const { data: report } = await serviceSupabase
            .from('reports')
            .select('id')
            .eq('id', report_id)
            .single();

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Insert delivery log
        const { data: delivery, error: insertError } = await serviceSupabase
            .from('email_delivery_logs')
            .insert([{
                user_id: userRow.id,
                report_id: report_id,
                recipient_email: recipient_email,
                status: 'queued',
            }])
            .select('id, created_at')
            .single();

        if (insertError) {
            console.error('[ORACLE] Failed to log email delivery:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Mark report as shared
        await serviceSupabase
            .from('reports')
            .update({ flag_shared: true })
            .eq('id', report_id);

        return NextResponse.json({
            success: true,
            message: 'Report delivery queued successfully.',
            delivery: delivery,
        });
    } catch (err) {
        console.error('[ORACLE] Share error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
