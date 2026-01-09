import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Use service role to refresh tokens on behalf of users
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { refresh_token } = await request.json();

        if (!refresh_token) {
            return NextResponse.json(
                { error: 'refresh_token is required' },
                { status: 400 }
            );
        }

        // Use Supabase Admin API to refresh the session
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token
        });

        if (error || !data.session) {
            return NextResponse.json(
                { error: error?.message || 'Failed to refresh session' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
        });
    } catch (e) {
        console.error('Token refresh error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
