import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
    try {
        const { amount, charityId, userId } = await request.json();

        // Ensure amount is parsed as an integer to prevent mathematical string errors
        const parsedAmount = parseInt(amount, 10);

        const options = {
            amount: parsedAmount * 100,
            currency: "INR",
            // Razorpay receipt max length is 40. Keep it short!
            receipt: `rcpt_${Date.now().toString().slice(-10)}`
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            orderId: order.id,
            amount: options.amount
        });

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        // This will return the actual Razorpay error description if it fails again
        return NextResponse.json({ error: error?.error?.description || "Failed to create donation order" }, { status: 500 });
    }
}