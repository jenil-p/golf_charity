'use client';

import { useState } from 'react';
import { CheckCircle2, Shield, HeartHandshake, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionPaywall({ profile }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'monthly' or 'yearly'

    const handleSubscribe = async () => {
        setIsProcessing(true);
        try {
            // Load Razorpay script
            const scriptLoaded = await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
            if (!scriptLoaded) throw new Error("Payment gateway failed to load");

            // Call your API to create the subscription
            const res = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planType: selectedPlan })
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const textError = await res.text();
                console.error("API returned HTML instead of JSON:", textError);
                throw new Error("API Route Not Found or Server Crashed. Check your server console.");
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to initialize payment");
            }

            // Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                subscription_id: data.subscriptionId,
                name: "ImpactLinks Golf",
                description: `${selectedPlan === 'yearly' ? 'Annual' : 'Monthly'} Membership`,
                handler: async function (response) {
                    await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: profile.id,
                            planType: selectedPlan
                        })
                    });

                    window.location.reload();
                },
                theme: { color: "#0A3622" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();

        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-white rounded-4xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
            <div className="bg-[#0A3622] p-8 md:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFDE59]/10 blur-3xl rounded-full"></div>
                <Shield className="w-12 h-12 text-[#FFDE59] mx-auto mb-6 relative z-10" />
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4 relative z-10">Activate Your Headquarters</h2>
                <p className="text-emerald-100 font-medium text-lg relative z-10 max-w-lg mx-auto">
                    You're one step away from joining the community. Secure your membership to start logging scores and changing lives.
                </p>
            </div>

            <div className="p-8 md:p-12">
                {/* Plan Toggle */}
                <div className="flex justify-center mb-10">
                    <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex relative">
                        <button
                            onClick={() => setSelectedPlan('monthly')}
                            className={`relative z-10 px-8 py-3 rounded-xl font-bold transition-all ${selectedPlan === 'monthly' ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setSelectedPlan('yearly')}
                            className={`relative z-10 px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${selectedPlan === 'yearly' ? 'text-slate-900 shadow-sm bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Yearly <span className="bg-[#FFDE59] text-[#0A3622] text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full">Save 15%</span>
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <h3 className="font-black text-slate-900 text-lg mb-6 border-b border-slate-100 pb-4">Membership Includes:</h3>
                        {['Access to Monthly Draws', 'Automated Charity Routing', 'Secure Score Logging', 'Digital Winnings Vault'].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> {feature}
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#F9F8F4] p-8 rounded-3xl border border-slate-200 text-center flex flex-col justify-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Total Contribution</p>
                        <div className="text-5xl font-black text-[#0A3622] mb-2">
                            {selectedPlan === 'monthly' ? '₹999' : '₹9,999'}
                        </div>
                        <p className="text-slate-500 text-sm font-medium mb-6">
                            {selectedPlan === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                        </p>

                        <button
                            onClick={handleSubscribe}
                            disabled={isProcessing}
                            className="w-full bg-[#0A3622] hover:bg-[#062416] text-[#FFDE59] font-black py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isProcessing ? 'Processing...' : <><Zap className="w-5 h-5" /> Activate Membership</>}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-wider font-bold flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" /> Secure Razorpay Checkout
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}