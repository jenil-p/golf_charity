import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const {
            razorpay_payment_id,
            razorpay_subscription_id,
            razorpay_signature,
            userId,
            planType
        } = body;

        // 1. Verify the signature to ensure it actually came from Razorpay
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // 2. If valid, insert/update the subscription in Supabase
        const { error } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                gateway_subscription_id: razorpay_subscription_id,
                plan_type: planType,
                status: 'active',
                currency: 'INR',
                // Set end date to 1 month or 1 year from now depending on plan
                current_period_end: new Date(Date.now() + (planType === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'user_id' }); // Upsert updates if it exists, inserts if it doesn't

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Verification failed" }, { status: 500 });
    }
}