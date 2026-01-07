import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
        return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check for the session
    const { data, error } = await supabase
        .from('editor_sessions')
        .select('tokens')
        .eq('session_id', session_id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error fetching session:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ pending: true });
    }

    // If found, delete the session (one-time use) and return tokens
    await supabase
        .from('editor_sessions')
        .delete()
        .eq('session_id', session_id);

    return NextResponse.json(data.tokens);
}
