import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client for backend operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
import { chargeUserOffSession } from './stripe-actions';

/**
 * Pricing Logic
 * Open Source Models: +20% markup
 * Premier Models: +10% markup
 */
export const PRICING_TIERS = {
    OPEN_SOURCE: { markup: 0.20 },
    PREMIER: { markup: 0.10 },
};

export const MODEL_CONFIG: Record<string, 'OPEN_SOURCE' | 'PREMIER'> = {
    // Config map to determine model type. Update this as we add models.
    'meta-llama/llama-3.1-70b-instruct': 'OPEN_SOURCE',
    'meta-llama/llama-3.1-405b-instruct': 'OPEN_SOURCE',
    'google/gemini-2.0-flash-exp:free': 'OPEN_SOURCE', // Assuming free models might still have a "base cost" of 0?
    'anthropic/claude-3.5-sonnet': 'PREMIER',
    'openai/gpt-4o': 'PREMIER',
    'openai/o1-preview': 'PREMIER',
};

/**
 * Calculate final cost based on model type and base cost.
 */
export function calculateCost(model: string, baseCost: number): { finalCost: number; markupOrFee: number } {
    const type = MODEL_CONFIG[model] || 'OPEN_SOURCE'; // Default to highest markup if unknown? Or open source?
    const tier = PRICING_TIERS[type];

    const markupAmount = baseCost * tier.markup;
    const finalCost = baseCost + markupAmount;

    return {
        finalCost: parseFloat(finalCost.toFixed(4)), // Ensure precision
        markupOrFee: parseFloat(markupAmount.toFixed(4))
    };
}

/**
 * Check if user has sufficient funds (or is admin).
 * Returns true if they can proceed.
 */
export async function hasSufficientBalance(userId: string): Promise<boolean> {
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('balance, is_admin, allow_overdraft, auto_topup')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error('Error fetching profile balance:', error);
        return false;
    }

    if (profile.is_admin) return true;

    // Logic:
    // 1. If Balance > 0: Allow.
    // 2. If Balance <= 0:
    //    - If (allow_overdraft OR auto_topup) AND Balance > -10: Allow.
    //    - Else: Block.

    if (profile.balance > 0) return true;

    if (profile.allow_overdraft || profile.auto_topup) {
        if (profile.balance > -10.00) return true; // Can go down to -10 (exclusive of exactly -10 if we want to stop AT -10)
        // If balance is -10.00 or less, STOP.
    }

    return false;
}

/**
 * Record a chat usage transaction.
 * Deducts from balance and logs to chats table.
 * Supports consolidated billing:
 * - isTurnStart=true: Creates NEW record (Turn N+1)
 * - isTurnStart=false: Updates LATEST record (Turn N)
 */
export async function recordChatUsage(userId: string, model: string, baseCost: number, sessionId?: string, isTurnStart?: boolean) {
    const { finalCost, markupOrFee } = calculateCost(model, baseCost);

    // 1. Get Profile to check Admin status
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('balance, is_admin, auto_topup')
        .eq('id', userId)
        .single();

    if (!profile) throw new Error('User not found');

    // 2. If Admin, we still record usage but cost is effectively 0 for them (no deduction)
    let chargeAmount = finalCost;
    if (profile.is_admin) {
        chargeAmount = 0;
    }

    // 3. Update Balance (Atomic decrement)
    if (chargeAmount > 0) {
        const { error: updateError } = await supabaseAdmin.rpc('decrement_balance', {
            user_id_arg: userId,
            amount_arg: chargeAmount
        });

        if (updateError) {
            // Fallback
            console.error("RPC failed, trying direct update");
            const newBalance = profile.balance - chargeAmount;
            await supabaseAdmin.from('profiles').update({ balance: newBalance }).eq('id', userId);
        }

        // 4. Check for Auto-Refill
        const currentBalance = profile.balance - chargeAmount;
        if (profile.auto_topup && currentBalance <= -10.00) {
            await chargeUserOffSession(userId, 10);
        }
    }

    // 5. Log to Chats table (Smart Turn Logic)
    if (sessionId) {
        // Fetch the LATEST record for this session
        const { data: latestChat } = await supabaseAdmin
            .from('chats')
            .select('id, base_cost, final_cost, title')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // LOGIC: Update Existing OR Create New
        // If it's NOT a turn start and we have a record -> UPDATE IT
        if (latestChat && !isTurnStart) {
            const { error: updateError } = await supabaseAdmin
                .from('chats')
                .update({
                    base_cost: latestChat.base_cost + baseCost,
                    final_cost: latestChat.final_cost + finalCost,
                    model: model
                })
                .eq('id', latestChat.id);

            if (updateError) console.error('Error updating chat turn:', updateError);
            return;
        }

        // Otherwise (Turn Start OR No Record) -> INSERT NEW
        // Calculate next turn number from previous title "Turn X"
        let nextTurnIndex = 1;
        if (latestChat && latestChat.title && latestChat.title.startsWith('Turn ')) {
            const lastIndex = parseInt(latestChat.title.replace('Turn ', ''), 10);
            if (!isNaN(lastIndex)) nextTurnIndex = lastIndex + 1;
        }

        const { error: chatError } = await supabaseAdmin.from('chats').insert({
            user_id: userId,
            model,
            base_cost: baseCost,
            final_cost: finalCost,
            markup_percentage: profile.is_admin ? 0 : (MODEL_CONFIG[model] === 'PREMIER' ? 10 : 20),
            session_id: sessionId,
            title: `Turn ${nextTurnIndex}`
        });

        if (chatError) console.error('Error logging new chat turn:', chatError);
        return;
    }

    // Fallback: Legacy / No-Session Request
    const { error: chatError } = await supabaseAdmin.from('chats').insert({
        user_id: userId,
        model,
        base_cost: baseCost,
        final_cost: finalCost,
        markup_percentage: profile.is_admin ? 0 : (MODEL_CONFIG[model] === 'PREMIER' ? 10 : 20)
    });

    if (chatError) console.error('Error logging chat:', chatError);
}

/**
 * Calculate cost from token counts and model pricing.
 * Returns the base cost (before markup or fees) in dollars.
 */
import { getModelById } from '@/app/data/models';

export function calculateBaseCostFromTokens(
    modelId: string,
    promptTokens: number,
    completionTokens: number
): number {
    const model = getModelById(modelId);
    if (!model || !model.pricing) {
        // Fallback or free if no pricing info
        return 0;
    }

    // Pricing is usually per 1M tokens
    const inputCost = (promptTokens / 1_000_000) * model.pricing.input;
    const outputCost = (completionTokens / 1_000_000) * model.pricing.output;

    return inputCost + outputCost;
}

/**
 * Async wrapper for recording chat - fire and forget.
 * This is used to allow the API to return quickly while DB updates happen in background.
 */
export function recordChatUsageAsync(userId: string, modelId: string, baseCost: number, sessionId?: string, isTurnStart?: boolean) {
    recordChatUsage(userId, modelId, baseCost, sessionId, isTurnStart).catch(err => {
        console.error('FAILED to record async chat usage:', err);
    });
}
