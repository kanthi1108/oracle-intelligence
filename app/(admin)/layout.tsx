// app/(admin)/layout.tsx
// Admin Layout — PRD §6.2 Role-Gated Access
// Server-side JWT inspection: rejects non-admin users with redirect to /

import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

interface AdminUser {
    id: string;
    auth_id: string;
    role: string;
    full_name: string;
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createServerSupabaseClient();

    // Step 1: Verify authenticated session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // Step 2: Verify admin role from users table
    const serviceSupabase = createServiceRoleClient();
    const { data: profile } = await serviceSupabase
        .from('users')
        .select('id, auth_id, role, full_name')
        .eq('auth_id', user.id)
        .single() as { data: AdminUser | null };

    if (!profile || profile.role !== 'admin') {
        redirect('/');
    }

    return (
        <div className="min-h-screen bg-oracle-bg text-oracle-textPrimary">
            {/* Admin Top Bar */}
            <header className="h-12 border-b border-oracle-border bg-oracle-rig flex items-center justify-between px-6 select-none">
                <div className="flex items-center gap-4">
                    <span className="font-mono text-xs tracking-wider text-oracle-accent font-bold">
                        ORACLE // ADMIN
                    </span>
                    <span className="text-[10px] font-mono text-oracle-textSecondary tracking-wider uppercase">
                        Control Panel
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-oracle-textSecondary">
                        {profile.full_name}
                    </span>
                    <span className="text-[10px] font-mono text-oracle-accent font-bold px-2 py-0.5 border border-oracle-accent">
                        ADMIN
                    </span>
                </div>
            </header>

            {/* Admin Content */}
            {children}
        </div>
    );
}
