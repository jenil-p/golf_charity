'use client';

import { useState } from 'react';
import { Calendar, CheckCircle2, HeartHandshake, ChevronRight, ChevronLeft } from 'lucide-react';
import { FaChevronRight } from "react-icons/fa6";


export default function CharityCard({
    charity,
    isSelected,
    isUpdating,
    onSelect
}) {
    const [isDonating, setIsDonating] = useState(false);
    const [donationAmount, setDonationAmount] = useState(500);
    const [showDonationUI, setShowDonationUI] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const rawImages = charity.charity_images || [];
    const sortedImages = [...rawImages].sort((a, b) => (b.is_primary === true ? 1 : -1));
    const images = sortedImages.length > 0
        ? sortedImages.map(img => img.image_url)
        : ['https://placehold.co/600x400/0A3622/FFDE59?text=Charity'];

    const nextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };


    // events on the charity...
    const events = charity.charity_events || [];
    const sortedEvents = [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));

    const handleIndependentDonation = async () => {

        setIsDonating(true);
        try {
            const scriptLoaded = await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
            if (!scriptLoaded) throw new Error("Razorpay SDK failed to load");

            const { supabase } = await import('../../lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/razorpay/donation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: donationAmount, charityId: charity.id, userId: session.user.id })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: "INR",
                name: "ImpactLinks",
                description: `Donation to ${charity.name}`,
                order_id: data.orderId,
                handler: function () {
                    alert(`Thank you! Your donation of ₹${donationAmount} was successful.`);
                    setShowDonationUI(false);
                },
                theme: { color: "#0A3622" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsDonating(false);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-white rounded-4xl overflow-hidden transition-all duration-500 ${isSelected ? 'border-2 border-[#0A3622] shadow-xl shadow-[#0A3622]/10 transform md:-translate-y-1' : 'border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 md:hover:-translate-y-1'}`}>

            {/* Elevated Image Area with Hover Crossfade */}
            <div className="h-48 md:h-56 w-full bg-slate-100 relative overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={images[currentImageIndex]}
                    alt={charity.name}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out"
                />

                <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 via-transparent to-transparent opacity-60 pointer-events-none"></div>

                {isSelected && (
                    <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-[#FFDE59] text-[#0A3622] text-[10px] md:text-xs font-black px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg tracking-wider uppercase flex items-center gap-1 z-10">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> Your Choice
                    </div>
                )}

                {/* Carousel Controls (Only show if multiple images) */}
                {images.length > 1 && (
                    <>
                        {/* Prev/Next Buttons */}
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                        </button>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-3 md:bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                            {images.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${currentImageIndex === idx ? 'w-4 bg-[#FFDE59]' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 md:p-8 flex flex-col flex-1 relative">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2 md:mb-3 tracking-tight leading-tight">{charity.name}</h3>
                <p className="text-slate-500 text-sm md:text-base mb-6 leading-relaxed flex-1 font-medium">
                    {charity.description}
                </p>

                {/* Elevated Events UI */}
                {sortedEvents.length > 0 && (
                    <div className="mb-6 md:mb-8 bg-[#F9F8F4] rounded-2xl p-4 md:p-5 border border-slate-100">
                        <p className="text-[10px] md:text-xs font-black text-[#0A3622] uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4" /> Upcoming Initiatives
                        </p>
                        <ul className="space-y-3.5 list-none">
                            {sortedEvents.map((event, i) => {
                                const eventDate = new Date(event.event_date);
                                const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                return (
                                    <li key={i} className="flex flex-col gap-0.5">
                                        <div className="flex items-start gap-2 font-bold text-slate-800 text-sm">
                                            <span className="text-[#FFDE59] mt-0.5">•</span> {event.title}
                                        </div>
                                        <div className="pl-4 text-xs font-medium text-slate-500">
                                            {formattedDate}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Actions Area */}
                <div className="space-y-3 mt-auto pt-2">
                    <button
                        onClick={() => onSelect(charity.id)}
                        disabled={isSelected || isUpdating}
                        className={`w-full py-3.5 md:py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2 text-sm md:text-base ${isSelected
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-[#0A3622] hover:bg-[#062416] text-white shadow-md hover:shadow-lg'
                            }`}
                    >
                        {isSelected ? '✓ Currently Supporting' : 'Support via Subscription'}
                    </button>

                    {showDonationUI ? (
                        <div className="pt-4 animate-in fade-in slide-in-from-top-2">
                            <label className="block text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">One-off Donation (₹)</label>

                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="number"
                                    min="100"
                                    value={donationAmount}
                                    onChange={(e) => setDonationAmount(e.target.value)}
                                    className="w-full sm:w-28 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A3622]/20 focus:bg-white text-center sm:text-left"
                                />
                                <button
                                    onClick={handleIndependentDonation}
                                    disabled={isDonating}
                                    className="w-full sm:flex-1 bg-[#FFDE59] hover:bg-[#F2D049] text-[#0A3622] py-3 rounded-xl font-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {isDonating ? 'Processing...' : <><HeartHandshake className="w-4 h-4" /> Donate</>}
                                </button>
                            </div>
                            <button onClick={() => setShowDonationUI(false)} className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-900 mt-4 transition-colors uppercase tracking-wider py-2">Cancel</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowDonationUI(true)}
                            className="w-full py-3 rounded-xl font-bold text-sm text-[#0A3622] hover:bg-[#0A3622]/5 transition-colors"
                        >
                            Make an Independent Donation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}