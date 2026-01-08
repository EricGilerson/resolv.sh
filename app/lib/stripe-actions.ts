import { stripe } from './stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Charge a user's saved payment method off-session (Auto-Refill).
 */
export async function chargeUserOffSession(userId: string, amountDollars: number) {
    try {
        console.log(`Attempting auto-charge for user ${userId} amount $${amountDollars}`);

        // 1. Get User Profile with Stripe Details
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id, stripe_payment_method_id')
            .eq('id', userId)
            .single();

        if (!profile || !profile.stripe_customer_id || !profile.stripe_payment_method_id) {
            throw new Error('User has no payment method saved.');
        }

        // 2. Create and Confirm Payment Intent immediately
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amountDollars * 100),
            currency: 'usd',
            customer: profile.stripe_customer_id,
            payment_method: profile.stripe_payment_method_id,
            off_session: true,
            confirm: true,
            metadata: {
                userId: userId,
                type: 'auto_refill'
            }
        });

        if (paymentIntent.status === 'succeeded') {
            console.log(`Auto-charge succeeded: ${paymentIntent.id}`);

            // 3. Update Balance (Atomic increment)
            // We assume the webhook might also handle this, but for sync reliability we can do it here too?
            // BETTER: Let the existing webhook handle the balance update to avoid double-counting.
            // However, if we need immediate continuation, we might optimistically update.
            // For now, relies on Webhook or manual update here? 
            // Let's manually insert the transaction record + balance update to be instant.

            const { error: txError } = await supabaseAdmin.from('transactions').insert({
                user_id: userId,
                amount: amountDollars,
                stripe_payment_id: paymentIntent.id,
                status: 'succeeded',
                description: 'Auto-Refill'
            });

            if (!txError) {
                const { error: balanceError } = await supabaseAdmin.rpc('increment_balance', {
                    user_id_arg: userId,
                    amount_arg: amountDollars
                });

                if (balanceError) {
                    // Fallback
                    const { data: current } = await supabaseAdmin.from('profiles').select('balance').eq('id', userId).single();
                    if (current) {
                        await supabaseAdmin.from('profiles').update({ balance: current.balance + amountDollars }).eq('id', userId);
                    }
                }
            }

            return { success: true, paymentIntent };
        } else {
            console.log(`Auto-charge status: ${paymentIntent.status}`);
            return { success: false, error: `Payment status: ${paymentIntent.status}` };
        }

    } catch (error: any) {
        console.error('Auto-charge failed:', error);
        return { success: false, error: error.message };
    }
}
