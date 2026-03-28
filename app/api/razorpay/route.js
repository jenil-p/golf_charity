import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { planType } = body;

        // Determine which plan ID to use
        const plan_id = planType === 'yearly'
            ? process.env.NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID
            : process.env.NEXT_PUBLIC_RAZORPAY_MONTHLY_PLAN_ID;

        if (!plan_id) {
            return NextResponse.json({ error: "Plan ID not configured" }, { status: 400 });
        }

        // Tell Razorpay to create a new subscription instance
        const subscription = await razorpay.subscriptions.create({
            plan_id: plan_id,
            customer_notify: 1,
            total_count: planType === 'yearly' ? 1 : 12, // number of billing cycles
        });

        // Return the subscription ID to the frontend so it can open the payment popup
        return NextResponse.json({
            subscriptionId: subscription.id
        });

    } catch (error) {
        console.error("Razorpay Error:", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }
}