'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Heart, ChevronRight, AlertCircle, CheckCircle2, Leaf, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const { session, isAuthLoading } = useAuth();
    const router = useRouter();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // Charity Selection
    const [charities, setCharities] = useState([]);
    const [selectedCharity, setSelectedCharity] = useState('');
    const [charityPercentage, setCharityPercentage] = useState(10);

    const [loading, setLoading] = useState(false);
    const [isRouting, setIsRouting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Check Role if Already Logged In
    useEffect(() => {
        const supabase = getSupabaseClient();
        async function checkExistingSession() {
            if (!isAuthLoading && session) {
                setIsRouting(true);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            }
        }
        checkExistingSession();
    }, [session, isAuthLoading, router]);

    // Fetch Charities for the Sign-Up dropdown
    useEffect(() => {
        const supabase = getSupabaseClient();
        async function fetchCharities() {
            const { data } = await supabase.from('charities').select('id, name').eq('is_active', true);
            if (data) {
                setCharities(data);
                if (data.length > 0) setSelectedCharity(data[0].id);
            }
        }
        fetchCharities();
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        
        const supabase = getSupabaseClient();
        try {
            if (isSignUp) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            selected_charity_id: selectedCharity,
                            charity_percentage: parseInt(charityPercentage, 10)
                        },
                    },
                });

                if (error) throw error;
                if (data?.user?.identities?.length === 0) {
                    throw new Error("An account with this email already exists. Please sign in.");
                }

                // If user is created but no session is returned, email confirmation is required
                if (data.user && !data.session) {
                    setMessage({
                        text: 'Success! We just sent a verification link to your email. Please click it to activate your account.',
                        type: 'success'
                    });

                    // Switch back to the sign-in view after a few seconds
                    setTimeout(() => {
                        setIsSignUp(false);
                        setPassword('');
                        setMessage({ text: '', type: '' });
                    }, 5000);
                } else {
                    setMessage({ text: 'Account created! Welcome to the club.', type: 'success' });
                    setTimeout(() => router.push('/dashboard'), 1500);
                }

            } else {
                // --- Smart Routing on Sign In ---
                const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

                if (error) {
                    if (error.message.includes("Email not confirmed")) {
                        throw new Error("Please verify your email address before signing in. We have sent an email to your account, click the link and you're done!");
                    }
                    throw error;
                }

                setIsRouting(true); // Keep the button in loading state

                // Fetch the role of the person who just logged in
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            setLoading(false);
            setIsRouting(false);
        }
    };

    // If checking auth or deciding where to route them, show the blank background
    if (isAuthLoading || isRouting) return <div className="min-h-screen bg-[#F9F8F4]"></div>;

    return (
        <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center p-4 sm:p-6 md:p-12 font-sans pt-28">

            <div className="max-w-6xl w-full bg-white rounded-4xl md:rounded-[3rem] shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row overflow-hidden border border-slate-100">

                <div className="hidden lg:flex lg:w-5/12 bg-[#0A3622] relative flex-col justify-between p-12 overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src="https://images.unsplash.com/photo-1587329310686-91414b8e3cb7?auto=format&fit=crop&w=800&q=80"
                            alt="Golf Course"
                            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-[#0A3622] via-[#0A3622]/80 to-transparent"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFDE59] flex items-center justify-center shadow-lg mb-8">
                            <Leaf className="w-6 h-6 text-[#0A3622]" />
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight mb-4">
                            Your swing.<br />Their future.
                        </h2>
                        <p className="text-emerald-100/80 font-medium text-lg max-w-sm leading-relaxed">
                            Join the exclusive community of golfers turning their weekend Stableford scores into life-changing impact.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Monthly Algorithms</p>
                            <p className="text-emerald-200 text-xs font-medium">Fair, automated, and secure.</p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE --- */}
                <div className="w-full lg:w-7/12 p-6 sm:p-10 md:p-14 lg:p-16 flex flex-col justify-center bg-white relative">

                    <div className="mb-8 md:mb-10 text-center lg:text-left">
                        {/* Mobile Logo (Only shows when left panel is hidden) */}
                        <div className="w-12 h-12 rounded-2xl bg-[#0A3622] flex lg:hidden items-center justify-center shadow-md mx-auto mb-6">
                            <Leaf className="w-6 h-6 text-[#FFDE59]" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </h2>
                        <p className="text-slate-500 mt-2 font-medium text-sm md:text-base">
                            {isSignUp ? 'Set up your profile and select a charity to begin.' : 'Enter your credentials to access your headquarters.'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {message.text && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`mb-8 p-4 rounded-2xl flex items-start gap-3 text-sm ${message.type === 'error' ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}
                            >
                                {message.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                <span>{message.text}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleAuth} className="space-y-5">

                        <AnimatePresence>
                            {isSignUp && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-5 overflow-hidden"
                                >
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                required={isSignUp}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-[#F9F8F4] border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#0A3622]/20 focus:border-[#0A3622] transition-all outline-none"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-5 md:p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl space-y-5">
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-black text-[#0A3622] uppercase tracking-widest mb-3">
                                                <Heart className="w-4 h-4" /> Support a Cause
                                            </label>
                                            <select
                                                required={isSignUp}
                                                value={selectedCharity}
                                                onChange={(e) => setSelectedCharity(e.target.value)}
                                                className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:ring-2 focus:ring-[#0A3622]/20 focus:border-[#0A3622] outline-none cursor-pointer truncate"
                                            >
                                                {charities.map(charity => (
                                                    <option key={charity.id} value={charity.id}>{charity.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contribution</label>
                                                <span className="bg-white border border-emerald-200 text-[#0A3622] font-black px-3 py-1 rounded-lg text-sm shadow-sm">{charityPercentage}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={charityPercentage}
                                                onChange={(e) => setCharityPercentage(e.target.value)}
                                                className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#0A3622] shadow-inner"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                                                <span>10% (Min)</span>
                                                <span>100% (Max)</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#F9F8F4] border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#0A3622]/20 focus:border-[#0A3622] transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#F9F8F4] border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#0A3622]/20 focus:border-[#0A3622] transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || isRouting || (isSignUp && charities.length === 0)}
                            className="w-full bg-[#0A3622] hover:bg-[#062416] text-[#FFDE59] font-black py-4 md:py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 group mt-4 text-lg"
                        >
                            {loading || isRouting ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                            {(!loading && !isRouting) && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center lg:text-left">
                        <p className="text-slate-500 text-sm font-medium">
                            {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setMessage({ text: '', type: '' });
                                }}
                                className="text-[#0A3622] hover:text-emerald-700 font-black transition-colors ml-1 uppercase tracking-wide text-xs"
                            >
                                {isSignUp ? 'Sign in instead' : 'Join the club'}
                            </button>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}