'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Menu, X, Heart, LayoutDashboard, ShieldCheck, LogOut, LogIn, Leaf } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { session, isAdmin } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setMobileMenuOpen(false);
        router.push('/login');
    };

    const isActive = (path) => pathname === path;

    // Reusable Desktop Link Component
    const NavLink = ({ href, icon: Icon, label }) => (
        <Link
            href={href}
            onClick={() => setMobileMenuOpen(false)}
            className="relative group flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all"
        >
            <span className={`relative z-10 flex items-center gap-2 ${isActive(href) ? 'text-white' : 'text-[#0A3622] group-hover:text-white'}`}>
                <Icon className="w-4 h-4" />
                {label}
            </span>
            {/* Background Hover/Active Pill */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive(href) ? 'bg-[#0A3622]' : 'bg-[#0A3622] opacity-0 scale-90 group-hover:scale-100 group-hover:opacity-100'}`}></div>
        </Link>
    );

    return (
        <>
            <header className={`fixed w-full z-50 transition-all duration-500 ease-out flex justify-center ${isScrolled ? 'top-4 px-4' : 'top-0 px-6 py-6'}`}>
                <nav className={`w-full max-w-7xl transition-all duration-500 ease-out flex items-center justify-between ${isScrolled
                        ? 'bg-white/90 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full px-6 py-3'
                        : 'bg-transparent rounded-none px-2 py-2'
                    }`}>

                    {/* --- BRAND LOGO --- */}
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 group">
                        <div className="md:w-10 md:h-10 w-8 h-8 rounded-full bg-[#0A3622] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                            <Leaf className="md:w-5 md:h-5 w-4 h-4 text-[#FFDE59]" />
                        </div>
                        <span className="font-black md:text-2xl text-lg tracking-tight text-[#0A3622]">ImpactLinks</span>
                    </Link>

                    {/* --- DESKTOP NAVIGATION --- */}
                    <div className="hidden md:flex items-center gap-1">
                        <NavLink href="/charities" icon={Heart} label="Causes" />

                        {session ? (
                            <>
                                <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                                {isAdmin && <NavLink href="/admin" icon={ShieldCheck} label="Admin" />}

                                <div className="w-px h-6 bg-[#0A3622]/10 mx-3"></div>

                                <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-[#0A3622] hover:text-red-700 hover:bg-red-50 rounded-full transition-all">
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 ml-4">
                                <Link href="/login" className="text-sm font-bold text-[#0A3622] hover:bg-[#0A3622]/5 px-5 py-2.5 rounded-full transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/login" className="text-sm font-bold bg-[#0A3622] text-[#FFDE59] px-6 py-2.5 rounded-full hover:bg-[#062416] hover:shadow-lg hover:shadow-[#0A3622]/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                                    Join Now <LogIn className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* --- MOBILE MENU TOGGLE --- */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2.5 text-[#0A3622] bg-[#0A3622]/5 hover:bg-[#0A3622]/10 rounded-full transition-colors"
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </nav>
            </header>

            {/* --- MOBILE NAVIGATION PANEL --- */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-4 top-24 z-40 md:hidden"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 flex flex-col gap-2 overflow-hidden">

                            <Link href="/charities" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${isActive('/charities') ? 'bg-[#0A3622] text-white' : 'text-[#0A3622] hover:bg-slate-50'}`}>
                                <Heart className="w-5 h-5" /> Explore Causes
                            </Link>

                            {session ? (
                                <>
                                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${isActive('/dashboard') ? 'bg-[#0A3622] text-white' : 'text-[#0A3622] hover:bg-slate-50'}`}>
                                        <LayoutDashboard className="w-5 h-5" /> Your Dashboard
                                    </Link>

                                    {isAdmin && (
                                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${isActive('/admin') ? 'bg-[#0A3622] text-white' : 'text-[#0A3622] hover:bg-slate-50'}`}>
                                            <ShieldCheck className="w-5 h-5" /> Admin Control Center
                                        </Link>
                                    )}

                                    <div className="h-px bg-slate-100 my-2"></div>

                                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 text-red-700 font-bold rounded-2xl">
                                        <LogOut className="w-5 h-5" /> Sign Out
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col gap-3 mt-2">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center p-4 rounded-2xl font-bold text-[#0A3622] bg-[#0A3622]/5">
                                        Sign In
                                    </Link>
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 p-4 bg-[#0A3622] text-[#FFDE59] font-bold rounded-2xl shadow-lg">
                                        Join Now <LogIn className="w-5 h-5" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background overlay for mobile menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
                    />
                )}
            </AnimatePresence>
        </>
    );
}