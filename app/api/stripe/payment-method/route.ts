import { createClient } from '@/app/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/app/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_payment_method_id, allow_overdraft, auto_topup')
            .eq('id', user.id)
            .single();

        let paymentMethod = null;

        if (profile?.stripe_payment_method_id) {
            try {
                paymentMethod = await stripe.paymentMethods.retrieve(profile.stripe_payment_method_id);
            } catch (e) {
                console.error("Stripe payment method not found or invalid", e);
                // If stripe says invalid, we should treat as null
            }
        }

        // Safety Check: If no valid payment method, ensure flags are FALSE
        if (!paymentMethod) {
            if (profile?.allow_overdraft || profile?.auto_topup) {
                await supabaseAdmin
                    .from('profiles')
                    .update({
                        allow_overdraft: false,
                        auto_topup: false,
                        stripe_payment_method_id: null // clear invalid ID if any
                    })
                    .eq('id', user.id);
            }
        }

        if (!paymentMethod) {
            return NextResponse.json({ paymentMethod: null });
        }

        return NextResponse.json({
            paymentMethod: {
                id: paymentMethod.id,
                brand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                exp_month: paymentMethod.card?.exp_month,
                exp_year: paymentMethod.card?.exp_year,
            }
        });
    } catch (error: any) {
        console.error('Error fetching payment method:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { paymentMethodId } = await req.json();

        if (!paymentMethodId) {
            return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 });
        }

        // Attach to customer if not already (should be done by setup intent but verifying is good)
        // Actually setup intent already attached it to customer. We just need to save to DB.

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabaseAdmin
            .from('profiles')
            .update({ stripe_payment_method_id: paymentMethodId })
            .eq('id', user.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error saving payment method:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_payment_method_id')
            .eq('id', user.id)
            .single();

        if (profile?.stripe_payment_method_id) {
            // Detach from Stripe Customer
            await stripe.paymentMethods.detach(profile.stripe_payment_method_id);
        }

        // Remove from DB and Disable Auto-Topup
        // Use Admin Client to bypass RLS
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabaseAdmin
            .from('profiles')
            .update({
                stripe_payment_method_id: null,
                auto_topup: false,
                allow_overdraft: false
            })
            .eq('id', user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting payment method:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
