import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const supabase = createServerSupabaseClient();
        
        const serviceClient = createServiceRoleClient();

        // Ensure requester is an admin
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: callerProfile } = await serviceClient
            .from('users')
            .select('role')
            .eq('auth_id', authUser.id)
            .single();

        if (callerProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Target check
        const { data: targetProfile, error: targetError } = await serviceClient
            .from('users')
            .select('id, auth_id, role')
            .eq('id', userId)
            .single();

        if (targetError || !targetProfile) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // Admin deletion restriction removed

        // 1. Delete credits
        await serviceClient.from('credits').delete().eq('user_id', targetProfile.id);

        // 2. Delete user profile
        await serviceClient.from('users').delete().eq('id', targetProfile.id);

        // 3. Delete from Supabase Auth
        if (targetProfile.auth_id) {
            const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(targetProfile.auth_id);
            if (deleteAuthError) {
                console.error('[ORACLE] Failed to delete auth user:', deleteAuthError);
                // Return 500 but we already deleted internal records. This is fine.
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[ORACLE] User deletion error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
