'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Target,
  Heart,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Globe2,
  Users,
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { session, isAuthLoading } = useAuth();
  const [featuredCharities, setFeaturedCharities] = useState([]);

  useEffect(() => {
    async function fetchFeaturedCharities() {
      // Fetch the 3 most recently added active charities
      const { data } = await supabase
        .from('charities')
        .select(`
          id, 
          name, 
          description,
          charity_images ( image_url, is_primary )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setFeaturedCharities(data);
    }
    fetchFeaturedCharities();
  }, []);

  // Animation Variants
  const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } };
  const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };

  // Visual Configurations to keep the asymmetric "Paper Note" aesthetic
  const noteStyles = [
    {
      bg: "bg-[#FFFCE8]", border: "border-amber-100",
      tapeRotate: "rotate-2", tapeLeft: "left-1/2",
      initRot: -5, finalRot: -2,
      tagColor: "bg-rose-500", tagText: "Trending",
      spacing: ""
    },
    {
      bg: "bg-[#FDFBF7]", border: "border-slate-200",
      tapeRotate: "-rotate-3", tapeLeft: "left-1/2",
      initRot: 5, finalRot: 1,
      tagColor: "bg-blue-500", tagText: "Popular",
      spacing: "mt-4 md:mt-12"
    },
    {
      bg: "bg-[#F0FDF4]", border: "border-emerald-100",
      tapeRotate: "rotate-6", tapeLeft: "left-[40%]",
      initRot: -4, finalRot: -1.5,
      tagColor: "bg-emerald-500", tagText: "New",
      spacing: "md:-mt-6"
    }
  ];

  if (isAuthLoading) return <div className="min-h-screen bg-[#F9F8F4]"></div>;

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-slate-900 font-sans selection:bg-[#FFD166]/40 overflow-hidden">

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-40 px-6 bg-[#FFDE59] overflow-hidden rounded-b-[3rem] md:rounded-b-[5rem] z-10 shadow-sm">
        {/* Subtle Impact Background Image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1600&q=80"
            alt="Philanthropy"
            className="w-full h-full object-cover opacity-15 mix-blend-multiply"
          />
        </div>
        <motion.div className="max-w-5xl mx-auto text-center relative z-10" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0A3622] text-white text-xs font-bold uppercase tracking-widest mb-8">
            We've got you covered.
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-[#0A3622] leading-[1.05]">
            Play your game.<br />Help the world succeed.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg md:text-2xl text-[#0A3622]/80 mb-12 max-w-3xl mx-auto font-medium">
            From environmental cleanups to medical emergencies. Turn your weekend Stableford scores into life-changing charity donations and monthly rewards.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => router.push(session ? '/dashboard' : '/login')} className="w-full sm:w-auto px-8 py-4 bg-[#0A3622] hover:bg-[#062416] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg">
              {session ? 'Go to Dashboard' : 'Start an Impact Fund'}
            </button>
            {!session && (
              <button onClick={() => { document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' }); }} className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-[#0A3622] text-[#0A3622] hover:bg-[#0A3622]/10 font-bold rounded-2xl transition-all flex items-center justify-center text-lg">
                Learn how it works
              </button>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* --- how this platform WORKS --- */}
      <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <motion.div className="flex-1 w-full" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="bg-[#E6F3E6] rounded-[3rem] p-8 md:p-12 relative overflow-hidden aspect-square flex flex-col justify-center border border-emerald-100">
              <div className="bg-white rounded-3xl p-6 shadow-xl relative z-10 border border-slate-100 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center"><Heart className="w-6 h-6 text-emerald-600" /></div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Current Goal</p>
                    <p className="text-xl font-black text-slate-900">₹25,000 Raised</p>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                  <motion.div className="bg-emerald-500 h-3 rounded-full" initial={{ width: 0 }} whileInView={{ width: "75%" }} transition={{ duration: 1.5, delay: 0.5 }}></motion.div>
                </div>
                <p className="text-sm font-bold text-emerald-600 text-right">75% to target</p>
              </div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-200/50 rounded-full blur-2xl"></div>
              <div className="absolute bottom-10 left-10 w-40 h-40 bg-teal-200/50 rounded-full blur-2xl"></div>
            </div>
          </motion.div>

          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-10 leading-tight">
              Giving back is easy,<br />powerful, and rewarding
            </h2>
            <div className="space-y-10">
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 shrink-0 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-xl font-black text-slate-900 relative z-10">1</div>
                <div className="absolute left-6 top-12 -bottom-10 w-px bg-slate-200"></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Log your progress</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Enter your Stableford scores after your weekend game. We track your last 5 rounds automatically.</p>
                </div>
              </div>
              <div className="flex gap-6 relative">
                <div className="w-12 h-12 shrink-0 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-xl font-black text-slate-900 relative z-10">2</div>
                <div className="absolute left-6 top-12 -bottom-10 w-px bg-slate-200"></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Enter the monthly draw</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Match your scores in our algorithmic draw. Win a share of the rolling community jackpot if 3 or more numbers match.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-full border-2 border-[#0A3622] bg-[#0A3622] flex items-center justify-center text-xl font-black text-white relative z-10">3</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Securely fund charities</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Choose a verified cause. Your subscription directly transfers funds to them, making every game count.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DYNAMIC NOTICE BOARD --- */}
      <section className="py-24 bg-[#EBE9E1] border-y-8 border-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">The Impact Board</h2>
            <p className="text-slate-600 font-medium text-lg">Recently added causes looking for your support today.</p>
          </div>

          {featuredCharities.length === 0 ? (
            <div className="text-center text-slate-500 font-medium py-12">Loading latest causes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12 pb-12">
              {featuredCharities.map((charity, index) => {
                // If we somehow have more than 3 charities, we loop the styles
                const style = noteStyles[index % noteStyles.length];

                return (
                  <motion.div
                    key={charity.id}
                    initial={{ opacity: 0, y: 50, rotate: style.initRot }}
                    whileInView={{ opacity: 1, y: 0, rotate: style.finalRot }}
                    whileHover={{ rotate: 0, scale: 1.02 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className={`${style.bg} p-5 pb-8 rounded-sm shadow-[4px_8px_24px_rgba(0,0,0,0.12)] border ${style.border} relative flex flex-col ${style.spacing}`}
                  >
                    {/* Tape */}
                    <div className={`absolute -top-3 ${style.tapeLeft} -translate-x-1/2 w-20 h-8 bg-white/60 backdrop-blur-md shadow-sm ${style.tapeRotate} border border-white/50 z-20`}></div>

                    {/* Polaroid Image */}
                    <div className="bg-white p-3 shadow-sm border border-slate-100 mb-5 relative">
                      <div className={`absolute top-2 right-2 ${style.tagColor} text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider z-10`}>
                        {style.tagText}
                      </div>
                      {(() => {
                        const primaryImg = charity.charity_images?.find(i => i.is_primary)?.image_url ||
                          charity.charity_images?.[0]?.image_url ||
                          'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=600&auto=format&fit=crop';
                        return (
                          <img src={primaryImg} alt={charity.name} className="w-full h-40 object-cover" />
                        );
                      })()}
                    </div>

                    <h3 className="font-black text-xl text-slate-900 mb-2 line-clamp-1">{charity.name}</h3>
                    <p className="font-serif text-slate-600 text-lg leading-relaxed flex-1 line-clamp-3" style={{ fontStyle: 'italic' }}>
                      "{charity.description}"
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-200/50 pt-4">
                      <span className="flex items-center gap-1 text-sm font-bold text-slate-500"><MapPin className="w-4 h-4" /> Global</span>
                      <button onClick={() => router.push('/charities')} className="bg-[#0A3622] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors shadow-md">Support</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* --- TRUSTED LEADER SECTION --- */}
      <section className="py-24 bg-[#0A3622] text-white px-6 rounded-t-[3rem] md:rounded-t-[5rem] -mt-10 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#145C3A] text-emerald-300 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4" /> Trust & Safety
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              A trusted leader in transparent philanthropy.
            </h2>
            <p className="text-emerald-100/80 text-xl font-medium leading-relaxed">
              With simple pricing and a direct pipeline to vetted 501(c)(3) charities, you can raise money and play your game with total peace of mind.
            </p>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#145C3A]">
              <div>
                <p className="text-4xl font-black text-[#FFDE59] mb-2">12+</p>
                <p className="text-sm font-bold text-emerald-200 uppercase tracking-wider">Vetted Partners</p>
              </div>
              <div>
                <p className="text-4xl font-black text-white mb-2">100%</p>
                <p className="text-sm font-bold text-emerald-200 uppercase tracking-wider">Secure Payments</p>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="absolute -inset-4 bg-[#FFDE59] rounded-[3rem] transform rotate-3 opacity-20 hidden md:block"></div>
            <img
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80"
              alt="Community Impact"
              className="w-full h-auto aspect-square md:aspect-4/3 object-cover rounded-4xl shadow-2xl relative z-10"
            />
          </div>
        </div>
      </section>

      {/* --- footer --- */}
      <footer className="py-24 text-center px-6 bg-[#0A3622] text-white">
        <motion.div className="max-w-3xl mx-auto" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight mb-8">
            Ready to fund the future?
          </motion.h2>
          <motion.div variants={fadeUp}>
            <button onClick={() => router.push(session ? '/dashboard' : '/login')} className="md:px-10 px-5 py-2 md:py-5 bg-[#FFDE59] hover:bg-[#F2D049] text-[#0A3622] font-black rounded-2xl transition-all text-xl shadow-xl transform hover:-translate-y-1">
              {session ? 'Return to Dashboard' : 'Join the Club Today'}
            </button>
          </motion.div>
        </motion.div>
      </footer>

    </div>
  );
}