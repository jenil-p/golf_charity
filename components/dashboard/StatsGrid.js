'use client';
import { motion } from 'framer-motion';
import { Activity, Heart, Target, CalendarCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StatsGrid({ isActive, charityPercentage, drawsEntered, nextDraw, fadeUp }) {
    const router = useRouter();

    return (
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Membership */}
            <div className={`p-6 rounded-4xl border shadow-sm flex flex-col justify-between h-40 transition-colors ${isActive ? 'bg-[#0A3622] border-[#062416]' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start">
                    <h2 className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>Membership</h2>
                    <Activity className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`} />
                </div>
                {isActive ? (
                    <div className="flex items-center gap-3 text-white">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <p className="font-black text-2xl">Active</p>
                    </div>
                ) : <p className="text-slate-500 font-black text-2xl">Inactive</p>}
            </div>

            {/* Impact */}
            <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex justify-between items-start text-slate-400">
                    <h2 className="text-xs font-bold uppercase tracking-wider">Your Impact</h2>
                    <Heart className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                    <p className="text-3xl font-black text-slate-900">{charityPercentage}%</p>
                    <button onClick={() => router.push('/charities')} className="text-xs font-bold text-[#0A3622] mt-1 uppercase">Manage ↗</button>
                </div>
            </div>

            {/* Draws */}
            <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm flex flex-col justify-between h-40">
                <div className="flex justify-between items-start text-slate-400">
                    <h2 className="text-xs font-bold uppercase tracking-wider">Draws Entered</h2>
                    <Target className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-4xl font-black text-slate-900">{drawsEntered}</p>
            </div>

            {/* Next Draw */}
            <div className="bg-[#FFDE59] p-6 rounded-4xl border border-[#F2D049] shadow-sm flex flex-col justify-between h-40 relative overflow-hidden">
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
                <div className="flex justify-between items-start relative z-10 text-[#0A3622]/70">
                    <h2 className="text-xs font-black uppercase tracking-wider">Next Draw</h2>
                    <CalendarCheck className="w-5 h-5" />
                </div>
                <p className="text-2xl font-black text-[#0A3622] relative z-10 leading-tight">{nextDraw}</p>
            </div>
        </motion.div>
    );
}