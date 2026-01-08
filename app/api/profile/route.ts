import { createClient } from '@/app/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // 1. Verify User Session (Security)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { auto_topup, allow_overdraft } = body;

        const updates: any = {};
        if (typeof auto_topup === 'boolean') updates.auto_topup = auto_topup;
        if (typeof allow_overdraft === 'boolean') updates.allow_overdraft = allow_overdraft;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ success: true }); // No changes
        }

        // 2. Use Admin Client to Bypass RLS (for Update)
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
