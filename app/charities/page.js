'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import CharityCard from '../../components/charities/CharityCard';
import { useAuth } from '../../contexts/AuthContext';

import Loading from '@/components/ui/Loading';

import { motion } from 'framer-motion';
import { Search, HeartHandshake, ArrowLeft } from 'lucide-react';

export default function CharitiesDirectory() {
    const { session, isAuthLoading } = useAuth();
    const [charities, setCharities] = useState([]);
    const [profile, setProfile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function loadData() {
            if (isAuthLoading) return;

            if (!session) {
                router.push('/login');
                setLoading(false);
                return;
            }

            try {
                const [profileRes, charitiesRes] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                    supabase.from('charities').select(`
                    *,
                    charity_images ( image_url, is_primary ),
                    charity_events ( title, event_date, description )
                `).eq('is_active', true).order('name')
                ]);

                if (profileRes.data) setProfile(profileRes.data);
                if (charitiesRes.data) setCharities(charitiesRes.data);

            } catch (err) {
                console.error('Charities fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [router, session, isAuthLoading]);

    const handleSelectCharity = async (charityId) => {
        setIsUpdating(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile.id, charityId })
            });
            if (res.ok) setProfile({ ...profile, selected_charity_id: charityId });
        } finally {
            setIsUpdating(false);
        }
    };

    const handlePercentageChange = async (e) => {
        const newPercentage = e.target.value;
        setProfile({ ...profile, charity_percentage: newPercentage });
        await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.id, percentage: newPercentage })
        });
    };

    const filteredCharities = charities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Animations
    const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    if (isAuthLoading || loading) {
        return (
            <Loading message="Loading helpable hands that we know..." />
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F8F4] text-slate-900 pt-28 md:pt-36 pb-16 md:pb-24 px-4 sm:px-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    <div className="w-full md:w-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest mb-3 md:mb-4">
                            <HeartHandshake className="w-4 h-4" /> Global Causes
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0A3622]">Find your impact</h1>
                        <p className="text-slate-500 mt-2 md:mt-3 text-base md:text-xl font-medium max-w-2xl leading-relaxed">
                            Discover and support vetted organizations changing the world. Select where your monthly subscription flows.
                        </p>
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="hidden md:flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl transition-all shadow-sm border border-slate-200 shrink-0">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </button>
                </div>

                <div className="bg-white p-6 md:p-12 rounded-4xl md:rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFDE59]/20 blur-3xl rounded-full -z-10"></div>

                    <h2 className="text-xl md:text-2xl font-black text-[#0A3622] mb-6 md:mb-8 text-center md:text-left">Contribution Level</h2>

                    <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10">
                        <div className="order-1 sm:order-2 text-2xl md:text-5xl font-black text-[#0A3622] bg-[#FFDE59] px-10 py-2 rounded-4xl shadow-md border border-[#F2D049] w-full max-w-55 sm:w-auto text-center transform sm:rotate-1 transition-all mx-auto sm:mx-0">
                            {profile?.charity_percentage || 10}%
                        </div>

                        <div className="flex-1 w-full order-2 sm:order-1">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={profile?.charity_percentage || 10}
                                onChange={handlePercentageChange}
                                className="w-full h-3 md:h-4 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#0A3622] shadow-inner"
                            />
                            <div className="flex justify-between text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
                                <span>10% (Min)</span>
                                <span>100% (Max Impact)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto md:mx-0">
                    <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search causes, keywords, or regions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl pl-12 md:pl-16 pr-5 md:pr-6 py-4 md:py-5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A3622]/20 focus:border-[#0A3622] transition-all text-base md:text-lg placeholder:font-medium placeholder:text-slate-400"
                    />
                </div>

                {/* Charity Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                >
                    {filteredCharities.map((charity) => (
                        <motion.div key={charity.id} variants={fadeUp} className="h-full">
                            <CharityCard
                                charity={charity}
                                isSelected={profile?.selected_charity_id === charity.id}
                                isUpdating={isUpdating}
                                onSelect={handleSelectCharity}
                            />
                        </motion.div>
                    ))}

                    {filteredCharities.length === 0 && (
                        <div className="col-span-full py-16 text-center">
                            <p className="text-lg md:text-xl text-slate-500 font-medium">No causes found matching your search.</p>
                        </div>
                    )}
                </motion.div>

                {/* Mobile Floating Back Button */}
                <div className="md:hidden fixed bottom-6 left-0 right-0 px-4 z-40">
                    <button onClick={() => router.push('/dashboard')} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#0A3622] text-white font-bold rounded-2xl shadow-xl shadow-[#0A3622]/20 border border-[#062416]">
                        <ArrowLeft className="w-5 h-5" /> Return to Dashboard
                    </button>
                </div>
                {/* Spacer for the mobile floating button */}
                <div className="h-20 md:hidden"></div>

            </div>
        </div>
    );
}