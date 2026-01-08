import { createClient } from '@supabase/supabase-js';

// Singleton admin client for backend operations
// Used for billing, database updates, and verifying tokens
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
