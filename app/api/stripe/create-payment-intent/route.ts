import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { createClient } from '@/app/utils/supabase/server'; // Assuming this exists based on dir structure

export async function POST(req: NextRequest) {
    try {
        const { amount } = await req.json();

        // Enforce $10 minimum (1000 cents)
        if (!amount || amount < 10) {
            return NextResponse.json(
                { error: 'Minimum deposit is $10.' },
                { status: 400 }
            );
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            setup_future_usage: 'off_session', // Save card for future auto-refills
            payment_method_types: ['card'],
            metadata: {
                userId: user.id, // Important: Attach user ID to metadata for webhook
            },
            // You might want to get/create a Customer ID here to attach, for future recurring billing
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error: any) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
