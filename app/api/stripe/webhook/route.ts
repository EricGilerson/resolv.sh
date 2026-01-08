import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Init Admin Client for Webhook (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            const piUserId = paymentIntent.metadata.userId; // Renamed to avoid scoping conflict
            const amountReceived = paymentIntent.amount_received; // In cents
            const amountDollars = amountReceived / 100;

            if (piUserId) {
                console.log(`Payment succeeded for user ${piUserId}: $${amountDollars}`);

                // 1. Log Transaction
                await supabaseAdmin.from('transactions').insert({
                    user_id: piUserId,
                    amount: amountDollars,
                    stripe_payment_id: paymentIntent.id,
                    status: 'succeeded',
                    description: 'Deposit via Stripe',
                });

                // 2. Update Balance & Payment Method (if setup_future_usage was set)
                // Note: If setup_future_usage is used, payment_method is attached.
                // We should ensure we save it if present.
                const updates: any = {
                    // Increment balance logic below...
                };

                if (paymentIntent.payment_method) {
                    updates.stripe_payment_method_id = paymentIntent.payment_method;
                    updates.stripe_customer_id = paymentIntent.customer;
                }

                // Get current balance first
                const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', piUserId).single();
                const currentBalance = Number(profile?.balance || 0);
                const newBalance = currentBalance + amountDollars;

                updates.balance = newBalance;

                const { error } = await supabaseAdmin
                    .from('profiles')
                    .update(updates)
                    .eq('id', piUserId);

                if (error) {
                    console.error('Error updating balance:', error);
                    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
                }
            }
            break;

        case 'setup_intent.succeeded':
            const setupIntent = event.data.object;
            const siUserId = setupIntent.metadata.userId;

            if (siUserId && setupIntent.payment_method) {
                console.log(`Setup Intent succeeded for user ${siUserId}. Saving PM: ${setupIntent.payment_method}`);

                await supabaseAdmin.from('profiles').update({
                    stripe_payment_method_id: setupIntent.payment_method,
                    stripe_customer_id: setupIntent.customer, // Should be attached
                }).eq('id', siUserId);
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
