import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { session_id, access_token, refresh_token } = await request.json();

    if (!session_id || !access_token || !refresh_token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Store tokens in the editor_sessions table
    const { error } = await supabase
        .from('editor_sessions')
        .insert({
            session_id,
            tokens: { access_token, refresh_token },
        });

    if (error) {
        console.error('Error storing tokens:', error);
        return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
