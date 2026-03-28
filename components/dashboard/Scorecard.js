'use client';
import { Flag, Plus, Target, Edit2 } from 'lucide-react';

export default function Scorecard({
    scores, newScore, setNewScore, handleScoreSubmit, isProcessing,
    editingScoreId, setEditingScoreId, editScoreValue, setEditScoreValue, handleEditScore
}) {
    return (
        <div className="bg-white rounded-4xl border border-slate-200 shadow-sm overflow-hidden flex flex-col lg:flex-row">
            {/* Tee Box */}
            <div className="w-full lg:w-1/3 bg-[#F9F8F4] p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-slate-200">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-6">
                    <Flag className="w-6 h-6 text-[#0A3622]" /> The Tee Box
                </h2>
                <form onSubmit={handleScoreSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="number" min="1" max="45" required
                            value={newScore}
                            onChange={(e) => setNewScore(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-5 pr-16 py-4 text-slate-900 text-2xl font-black focus:outline-none focus:border-[#0A3622]"
                            placeholder="0"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold uppercase text-xs">Pts</span>
                    </div>
                    <button type="submit" disabled={isProcessing} className="w-full bg-[#0A3622] text-[#FFDE59] font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Log Score
                    </button>
                </form>
            </div>

            {/* Ledger */}
            <div className="w-full lg:w-2/3 bg-white p-6 md:p-10">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Official Scorecard</h2>
                <div className="rounded-2xl overflow-hidden bg-slate-50/50">
                    {scores.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <Target className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="text-slate-600 font-bold">Scorecard is empty.</p>
                        </div>
                    ) : (
                        scores.map((score, index) => (
                            <div key={score.id} className="group relative flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 last:border-b-0 bg-white hover:bg-slate-50">
                                <div className="flex items-center gap-4 sm:gap-6 w-full">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-[#F9F8F4] rounded-full border border-slate-200 shrink-0">
                                        <Flag className="w-4 h-4 text-[#0A3622]" />
                                        <span className="text-[9px] font-black text-slate-400">R{index + 1}</span>
                                    </div>
                                    {editingScoreId === score.id ? (
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={editScoreValue} onChange={(e) => setEditScoreValue(e.target.value)} className="w-20 border-2 border-[#0A3622] rounded-xl px-2 py-1 font-black" />
                                            <button onClick={() => handleEditScore(score.id)} className="bg-[#0A3622] text-white px-3 py-1 rounded-lg">Save</button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-1 justify-between items-center">
                                            <p className="text-3xl font-black">{score.score} <span className="text-xs text-slate-400">PTS</span></p>
                                            <button onClick={() => { setEditingScoreId(score.id); setEditScoreValue(score.score); }} className="md:opacity-0 group-hover:opacity-100 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className='mt-10 text-sm text-slate-400'>R1 represents your mose recent score</div>
            </div>
        </div>
    );
}