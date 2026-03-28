'use client';

import { useState } from 'react';

export default function DrawEngine() {
    const [drawResult, setDrawResult] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [logicType, setLogicType] = useState('random');

    const handleDraw = async (mode) => {
        if (mode === 'publish' && !confirm("WARNING: Publishing is final. Proceed?")) return;

        setIsRunning(true);
        setDrawResult(null);

        try {
            const res = await fetch('/api/admin/run-draw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, logicType })
            });

            const data = await res.json();

            if (res.status === 409 && data.isWarning) {
                setIsRunning(false);
                if (confirm(`WARNING: ${data.message}`)) {
                    return handleDraw(mode, true);
                }
                return;
            }

            if (data.error) throw new Error(data.error);

            setDrawResult(data);
            if (mode === 'publish') alert("Draw officially published!");

        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-900 border-b border-slate-100 pb-3 sm:pb-4">Draw Management Engine</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                {/* Controls */}
                <div className="space-y-6 sm:space-y-8">
                    <div>
                        <label className="block text-[10px] sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">1. Select Draw Logic</label>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <label className={`flex-1 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${logicType === 'random' ? 'border-emerald-500 bg-emerald-50 shadow-emerald-500/10 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}>
                                <input type="radio" name="logic" value="random" checked={logicType === 'random'} onChange={(e) => setLogicType(e.target.value)} className="hidden" />
                                <span className="block font-bold text-slate-900 text-sm sm:text-base">Random</span>
                                <span className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 block">Standard lottery style</span>
                            </label>
                            <label className={`flex-1 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${logicType === 'algorithmic' ? 'border-emerald-500 bg-emerald-50 shadow-emerald-500/10 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}>
                                <input type="radio" name="logic" value="algorithmic" checked={logicType === 'algorithmic'} onChange={(e) => setLogicType(e.target.value)} className="hidden" />
                                <span className="block font-bold text-slate-900 text-sm sm:text-base">Algorithmic</span>
                                <span className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 block">Weighted by user freq.</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3 uppercase tracking-wide">2. Execution Phase</label>
                        <div className="space-y-3">
                            <button onClick={() => handleDraw('simulate')} disabled={isRunning} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-colors">
                                Run Simulation / Pre-Analysis
                            </button>
                            <button onClick={() => handleDraw('publish')} disabled={isRunning} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg shadow-emerald-600/20">
                                Publish Official Draw
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Output */}
                <div className="bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 md:p-8 min-h-62.5 sm:min-h-75 flex flex-col justify-center">
                    {!drawResult ? (
                        <div className="text-center text-slate-400 font-medium text-sm sm:text-base">
                            {isRunning ? 'Crunching algorithms...' : 'Run a simulation to view potential results.'}
                        </div>
                    ) : (
                        <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                                <h3 className="font-bold text-lg sm:text-xl text-slate-900">
                                    {drawResult.mode === 'simulation' ? <span className="text-amber-600"> Simulation Results</span> : <span className="text-emerald-600">✅ Official Results</span>}
                                </h3>
                                <span className="text-[10px] sm:text-xs bg-white border border-slate-200 px-2 sm:px-3 py-1 rounded-full text-slate-500 uppercase tracking-wider font-bold shadow-sm self-start sm:self-auto">{drawResult.logicType}</span>
                            </div>

                            <div>
                                <p className="text-xs sm:text-sm text-slate-500 mb-2 sm:mb-3 font-medium">Generated Numbers</p>
                                <div className="flex flex-wrap gap-2 sm:gap-3">
                                    {drawResult.winningNumbers.map((num, i) => (
                                        <span key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-base sm:text-lg shadow-sm">{num}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 border-y border-slate-200 py-4 sm:py-5">
                                <div>
                                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5 sm:mb-1">Prize Pool</p>
                                    <p className="text-xl sm:text-2xl font-black text-slate-900">₹{drawResult.totalPrizePool.toLocaleString()}</p>
                                </div>
                                {drawResult.rolloverAmount > 0 && (
                                    <div>
                                        <p className="text-[10px] sm:text-xs text-amber-600 uppercase font-bold tracking-wider mb-0.5 sm:mb-1 truncate">Rollover Added</p>
                                        <p className="text-xl sm:text-2xl font-black text-amber-600">+₹{drawResult.rolloverAmount.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                                <p className="text-xs sm:text-sm text-slate-500 font-medium mb-2 sm:mb-3">Match Distribution & Payouts</p>
                                {[5, 4, 3].map(tier => (
                                    <div key={tier} className="flex justify-between items-center text-xs sm:text-sm p-2.5 sm:p-3 bg-white rounded-lg sm:rounded-xl border border-slate-100 shadow-sm">
                                        <span className="font-bold text-slate-700">{tier}-Match <span className="text-slate-400 font-normal">({drawResult.winnerCounts[`${tier}-Matches`]})</span></span>
                                        <span className="font-mono font-bold text-emerald-600">₹{drawResult.payouts[tier].toLocaleString()} <span className="text-slate-400 font-sans font-normal hidden sm:inline">ea</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}