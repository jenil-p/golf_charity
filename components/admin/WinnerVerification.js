'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import Loading from '../ui/Loading';

export default function WinnerVerification() {
    const [winnings, setWinnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchWinnings = async () => {
        const { data, error } = await supabase
            .from('winnings')
            .select(`*, profiles ( full_name ), draws ( draw_month )`)
            .order('created_at', { ascending: false });

        if (!error && data) setWinnings(data);
        setLoading(false);
    };

    useEffect(() => { fetchWinnings(); }, []);

    const handleUpdateStatus = async (winningId, newStatus) => {
        if (!confirm(`Are you sure you want to mark this as ${newStatus.toUpperCase()}?`)) return;

        setProcessingId(winningId);
        try {
            const res = await fetch('/api/admin/verify-winner', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winningId, newStatus })
            });

            if (!res.ok) throw new Error("Failed to update");
            fetchWinnings();
        } catch (error) {
            alert(error.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <Loading message="Loading submissions..." />

    return (
        <div className="bg-white p-5 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col mb-6 sm:mb-8 border-b border-slate-100 pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Winner Verification & Payouts</h2>
                <p className="text-slate-500 mt-1 font-medium text-xs sm:text-sm">Review score proofs and mark payouts as completed.</p>
            </div>

            {winnings.length === 0 ? (
                <div className="py-12 sm:py-20 text-center bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 px-4">
                    <p className="text-sm sm:text-base text-slate-500 font-medium">No winnings generated yet. Run a draw to populate.</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {winnings.map((win) => (
                        // Changed to stack on mobile (flex-col) and row on lg screens
                        <div key={win.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row gap-5 sm:gap-6 lg:gap-8 justify-between items-start shadow-sm transition-all">

                            {/* Winner Info */}
                            <div className="flex-1 w-full">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">{win.profiles?.full_name || 'Unknown User'}</h3>
                                    <span className="text-[10px] sm:text-xs bg-slate-100 border border-slate-200 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-slate-600 font-bold uppercase tracking-wider">
                                        {win.match_tier}-Match Tier
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-3 sm:mb-4">
                                    Draw Cycle: {new Date(win.draws?.draw_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </p>
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">Prize Amount</p>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                                        ₹{parseFloat(win.prize_amount).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Proof Image Section */}
                            <div className="w-full lg:w-64 shrink-0">
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 sm:mb-2">Score Proof</p>
                                {win.proof_image_url ? (
                                    <a href={win.proof_image_url} target="_blank" rel="noreferrer" className="block group relative rounded-lg sm:rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={win.proof_image_url} alt="Score Proof" className="w-full h-24 sm:h-32 object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                            <span className="text-white text-xs sm:text-sm font-bold">Review Evidence ↗</span>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="h-24 sm:h-32 bg-slate-50 rounded-lg sm:rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-xs sm:text-sm text-slate-400 font-medium">
                                        <span className="text-lg sm:text-xl mb-0.5 sm:mb-1">⏳</span>
                                        Awaiting Upload
                                    </div>
                                )}
                            </div>

                            {/* Action Area */}
                            <div className="w-full lg:w-56 shrink-0 flex flex-col gap-2 sm:gap-3 justify-center h-full min-h-auto lg:min-h-32 border-t lg:border-t-0 border-slate-100 pt-4 lg:pt-0 mt-2 lg:mt-0">
                                {win.payment_status === 'pending_verification' && (
                                    <>
                                        <div className="bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-amber-100 mb-0.5 sm:mb-1">
                                            Action Required
                                        </div>
                                        <button disabled={processingId === win.id || !win.proof_image_url} onClick={() => handleUpdateStatus(win.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm">
                                            Approve Evidence
                                        </button>
                                        <button disabled={processingId === win.id || !win.proof_image_url} onClick={() => handleUpdateStatus(win.id, 'rejected')} className="bg-white hover:bg-red-50 text-red-600 disabled:opacity-50 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all border border-red-100">
                                            Reject Proof
                                        </button>
                                    </>
                                )}

                                {win.payment_status === 'approved' && (
                                    <>
                                        <div className="bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-emerald-100 mb-0.5 sm:mb-1">
                                            Ready for Payout
                                        </div>
                                        <button disabled={processingId === win.id} onClick={() => handleUpdateStatus(win.id, 'paid')} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm">
                                            Confirm Bank Transfer
                                        </button>
                                    </>
                                )}

                                {win.payment_status === 'paid' && (
                                    <div className="bg-slate-50 border border-slate-200 text-slate-500 py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-center flex flex-col items-center justify-center h-full">
                                        <span className="text-emerald-500 text-lg sm:text-xl mb-0.5 sm:mb-1">✓</span>
                                        Payout Completed
                                    </div>
                                )}

                                {win.payment_status === 'rejected' && (
                                    <div className="bg-red-50 border border-red-100 text-red-600 py-3 sm:py-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-center flex flex-col items-center justify-center h-full">
                                        <span className="text-lg sm:text-xl mb-0.5 sm:mb-1">✕</span>
                                        Claim Rejected
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}