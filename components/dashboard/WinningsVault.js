'use client';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

export default function WinningsVault({ winnings, handleFileUpload, uploadingId, fadeUp }) {
    if (!winnings || winnings.length === 0) return null;

    return (
        <motion.div variants={fadeUp} className="bg-linear-to-br from-[#0A3622] to-[#145C3A] p-6 md:p-10 rounded-4xl shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-12 h-12 bg-[#FFDE59] rounded-xl flex items-center justify-center text-[#0A3622] shadow-lg transform -rotate-3">
                    <Trophy className="w-6 h-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#FFDE59]">Your Vault</h2>
            </div>
            <div className="space-y-4 relative z-10">
                {winnings.map(win => (
                    <div key={win.id} className="p-6 md:p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex-1 w-full">
                            <p className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-1">
                                Cycle: {new Date(win.draws.draw_month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-6 mt-2">
                                <p className="text-4xl font-black text-white">{win.match_tier}-Match</p>
                                <p className="text-2xl font-black text-[#FFDE59]">₹{parseFloat(win.prize_amount).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="w-full lg:w-auto">
                            {win.payment_status === 'paid' ? (
                                <div className="px-6 py-4 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Paid</div>
                            ) : win.proof_image_url ? (
                                <div className="px-6 py-4 bg-amber-500/20 text-[#FFDE59] border border-[#FFDE59]/30 rounded-xl font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Reviewing</div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <input type="file" accept="image/*" className="hidden" id={`upload-${win.id}`} onChange={(e) => handleFileUpload(e, win.id)} />
                                    <label htmlFor={`upload-${win.id}`} className={`cursor-pointer px-6 py-3 bg-[#FFDE59] text-[#0A3622] rounded-xl font-black text-center flex items-center justify-center gap-2 ${uploadingId === win.id ? 'opacity-50' : ''}`}>
                                        <Upload className="w-4 h-4" /> {uploadingId === win.id ? 'Uploading...' : 'Upload Proof'}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}