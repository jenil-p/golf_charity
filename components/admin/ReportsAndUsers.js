'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

import Loading from '../ui/Loading';

export default function ReportsAndUsers() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalUsers: 0, totalPrizePool: 0, charityTotal: 0, drawCount: 0 });
    const [users, setUsers] = useState([]);

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [userScores, setUserScores] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchData = async () => {
        const { data: profilesData } = await supabase.from('profiles').select(`id, full_name, email:id, charity_percentage, subscriptions ( status, plan_type ), charities ( name )`).order('created_at', { ascending: false });
        if (profilesData) {
            setUsers(profilesData);
            setStats(prev => ({ ...prev, totalUsers: profilesData.length }));
            let totalCharity = 0;
            profilesData.forEach(user => {
                if (user.subscriptions?.status === 'active') {
                    totalCharity += (user.subscriptions.plan_type === 'yearly' ? 10000 : 1000) * (user.charity_percentage / 100);
                }
            });
            setStats(prev => ({ ...prev, charityTotal: totalCharity }));
        }

        const { data: drawsData } = await supabase.from('draws').select('total_prize_pool');
        if (drawsData) {
            setStats(prev => ({
                ...prev,
                totalPrizePool: drawsData.reduce((sum, draw) => sum + Number(draw.total_prize_pool), 0),
                drawCount: drawsData.length
            }));
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const openManageModal = async (user) => {
        setSelectedUser(user);
        const res = await fetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ userId: user.id }) });
        const data = await res.json();
        setUserScores(data.scores || []);
    };

    const handleUpdate = async (action, payload) => {
        setIsUpdating(true);
        try {
            await fetch('/api/admin/users', { method: 'PUT', body: JSON.stringify({ userId: selectedUser.id, action, payload }) });
            alert("Updated successfully");
            if (action !== 'update_score') fetchData();
            if (action === 'update_profile') setSelectedUser({ ...selectedUser, full_name: payload.full_name });
            if (action === 'update_subscription') setSelectedUser({ ...selectedUser, subscriptions: { ...selectedUser.subscriptions, status: payload.status } });
        } catch (e) {
            alert("Error updating");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) return <Loading message='Crunching numbers...'/>

    return (
        <div className="space-y-8 md:space-y-10">

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2">Total Users</p>
                    <p className="text-2xl sm:text-4xl font-black text-slate-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-emerald-50 rounded-bl-full z-0" />
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 sm:mb-2 relative z-10 truncate">All-Time Pool</p>
                    <p className="text-2xl sm:text-4xl font-black text-slate-900 relative z-10">₹{stats.totalPrizePool.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-600 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-emerald-500 shadow-md text-white flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1 sm:mb-2 truncate">Charity Generated</p>
                    <p className="text-2xl sm:text-4xl font-black text-white">₹{stats.charityTotal.toLocaleString()}</p>
                </div>
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-2 truncate">Total Draws</p>
                    <p className="text-2xl sm:text-4xl font-black text-slate-900">{stats.drawCount}</p>
                </div>
            </div>

            {/* USER DIRECTORY TABLE */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 md:p-8 border-b border-slate-100">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">User Directory</h2>
                </div>

                <div className="overflow-x-auto hide-scrollbar">
                    <table className="w-full text-left border-collapse min-w-150">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="py-4 px-5 sm:px-6 md:px-8 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="py-4 px-5 sm:px-6 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="py-4 px-5 sm:px-6 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Charity Impact</th>
                                <th className="py-4 px-5 sm:px-6 md:px-8 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 sm:py-5 px-5 sm:px-6 md:px-8">
                                        <p className="text-sm sm:text-base font-bold text-slate-900">{user.full_name}</p>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate max-w-37.5 sm:max-w-xs">{user.email}</p>
                                    </td>
                                    <td className="py-4 sm:py-5 px-5 sm:px-6">
                                        {user.subscriptions?.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold border border-emerald-100">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold border border-slate-200">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 sm:py-5 px-5 sm:px-6">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs">{user.charity_percentage}%</span>
                                            <span className="text-[10px] sm:text-sm text-slate-500 truncate max-w-25 sm:max-w-37.5">{user.charities?.name || 'None'}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 sm:py-5 px-5 sm:px-6 md:px-8 text-right">
                                        <button onClick={() => openManageModal(user)} className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all shadow-sm">
                                            Manage User
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MANAGE USER MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-100 rounded-3xl sm:rounded-4xl p-5 sm:p-8 md:p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6 sm:mb-8 border-b border-slate-100 pb-4 sm:pb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedUser.full_name}</h2>
                                <p className="text-slate-500 text-[10px] sm:text-sm mt-1 font-medium">User ID: {selectedUser.id}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors">✕</button>
                        </div>

                        <div className="space-y-6 sm:space-y-8">
                            {/* Profile Edit */}
                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <input type="text" defaultValue={selectedUser.full_name} id="editName" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                                    <button onClick={() => handleUpdate('update_profile', { full_name: document.getElementById('editName').value })} disabled={isUpdating} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm transition-colors">Save</button>
                                </div>
                            </div>

                            {/* Sub Edit */}
                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subscription Status</label>
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                    <select id="editSub" defaultValue={selectedUser.subscriptions?.status || 'inactive'} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 cursor-pointer outline-none">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <button onClick={() => handleUpdate('update_subscription', { status: document.getElementById('editSub').value })} disabled={isUpdating} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm transition-colors">Update</button>
                                </div>
                            </div>

                            {/* Scores Edit */}
                            <div>
                                <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Recent Golf Scores</label>
                                <div className="bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 p-3 sm:p-4">
                                    {userScores.length === 0 ? <p className="text-xs sm:text-sm text-slate-500 text-center py-4">No scores logged yet.</p> : (
                                        <div className="space-y-2 sm:space-y-3">
                                            {userScores.map((score, idx) => (
                                                <div key={score.id} className="flex flex-wrap gap-2 sm:gap-3 items-center bg-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100 shadow-sm justify-between sm:justify-start">
                                                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] sm:text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                                                        <span className="text-[10px] sm:text-sm text-slate-500 w-16 sm:w-24 font-medium">{new Date(score.played_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" defaultValue={score.score} id={`score-${score.id}`} className="w-14 sm:w-20 bg-slate-50 border border-slate-200 rounded-md sm:rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base text-slate-900 font-bold focus:bg-white outline-none" />
                                                        <button onClick={() => handleUpdate('update_score', { scoreId: score.id, score: document.getElementById(`score-${score.id}`).value })} className="text-[10px] sm:text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg transition-colors whitespace-nowrap">Save</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}