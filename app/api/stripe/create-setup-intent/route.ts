import { createClient } from '@/app/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/app/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get or Create Customer ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;

            // Save customer ID immediately
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        let setupIntent;
        try {
            setupIntent = await stripe.setupIntents.create({
                customer: customerId,
                payment_method_types: ['card'],
                metadata: {
                    userId: user.id,
                },
            });
        } catch (e: any) {
            // Check if error is due to missing customer (e.g. deleted in Stripe dashboard)
            if (e.code === 'resource_missing' && e.param === 'customer') {
                console.log('Stripe customer missing, recreating...');

                // Recreate customer
                const newCustomer = await stripe.customers.create({
                    email: user.email,
                    metadata: { userId: user.id },
                });
                customerId = newCustomer.id;

                // Update DB with new ID
                const supabaseAdmin = createAdminClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.SUPABASE_SERVICE_ROLE_KEY!
                );

                await supabaseAdmin
                    .from('profiles')
                    .update({ stripe_customer_id: customerId })
                    .eq('id', user.id);

                // Retry SetupIntent creation
                setupIntent = await stripe.setupIntents.create({
                    customer: customerId,
                    payment_method_types: ['card'],
                    metadata: {
                        userId: user.id,
                    },
                });
            } else {
                throw e; // Rethrow other errors
            }
        }

        return NextResponse.json({
            clientSecret: setupIntent.client_secret,
        });
    } catch (error: any) {
        console.error('Error creating setup intent:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
