'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';


import SubscriptionPaywall from '@/components/dashboard/SubscriptionPaywall.js';
import StatsGrid from '@/components/dashboard/StatsGrid.js';
import Scorecard from '@/components/dashboard/Scorecard.js';
import WinningsVault from '@/components/dashboard/WinningsVault';

import Loading from '@/components/ui/Loading';

export default function Dashboard() {
    const { session, isAuthLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [hasAccess, setHasAccess] = useState(false); // this will serve as gate keeper ;)
    const [scores, setScores] = useState([]);
    const [winnings, setWinnings] = useState([]);
    const [newScore, setNewScore] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [scoreMessage, setScoreMessage] = useState({ text: '', type: '' });
    const [editingScoreId, setEditingScoreId] = useState(null);
    const [editScoreValue, setEditScoreValue] = useState('');
    const [participation, setParticipation] = useState({ drawsEntered: 0, nextDraw: '' });
    const [uploadingId, setUploadingId] = useState(null);
    const router = useRouter();

    const fetchDashboardData = async () => {
        if (isAuthLoading) return;

        if (!session) {
            router.push('/login');
            setLoading(false);
            return;
        }

        try {
            const { data: profileData } = await supabase
                .from('profiles').select('*').eq('id', session.user.id).single();
            setProfile(profileData);

            const { count: drawsCount } = await supabase
                .from('draws').select('*', { count: 'exact', head: true }).eq('status', 'published');
            const today = new Date();
            const nextDrawDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
                .toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
            setParticipation({ drawsEntered: drawsCount || 0, nextDraw: nextDrawDate });

            const [subRes, scoresRes, winRes] = await Promise.all([
                supabase.from('subscriptions').select('*').eq('user_id', session.user.id).single(),
                supabase.from('golf_scores').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5),
                supabase.from('winnings').select('*, draws(draw_month)').eq('user_id', session.user.id).order('created_at', { ascending: false })
            ]);

            setSubscription(subRes.data);
            setScores(scoresRes.data || []);
            setWinnings(winRes.data || []);

            let access = false;
            if (subRes.data?.status === 'active') {
                const expiryDate = new Date(subRes.data.current_period_end);
                if (new Date() < expiryDate) {
                    access = true;
                } else {
                    supabase.from('subscriptions').update({ status: 'expired' }).eq('id', subRes.data.id).then();
                }
            }
            setHasAccess(access);

        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, [router, session, isAuthLoading]);

    const handleScoreSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            await fetch('/api/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: parseInt(newScore), userId: profile.id }) });
            setNewScore('');
            fetchDashboardData();
            setScoreMessage({ text: 'Score Logged!', type: 'success' });
        } catch (e) { setScoreMessage({ text: 'Error', type: 'error' }); }
        finally { setIsProcessing(false); }
    };

    const handleEditScore = async (scoreId) => {
        await fetch('/api/scores', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scoreId, newScore: parseInt(editScoreValue), userId: profile.id }) });
        setEditingScoreId(null);
        fetchDashboardData();
    };

    const handleFileUpload = async (e, winningId) => {
        const file = e.target.files[0];
        setUploadingId(winningId);
        const filePath = `${profile.id}-${winningId}-${Math.random()}`;
        await supabase.storage.from('winner-proofs').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('winner-proofs').getPublicUrl(filePath);
        await supabase.from('winnings').update({ proof_image_url: publicUrl }).eq('id', winningId);
        fetchDashboardData();
        setUploadingId(null);
    };

    if (isAuthLoading || loading) return <Loading message="Authenticating Headquarters..." />;

    const isActive = subscription?.status === 'active';
    const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="min-h-screen bg-[#F9F8F4] pt-28 md:pt-36 pb-24 px-4 sm:px-6 font-sans">
            <motion.div className="max-w-6xl mx-auto space-y-10" initial="hidden" animate="visible" transition={{ staggerChildren: 0.1 }}>

                <motion.div variants={fadeUp} className="bg-white p-6 md:p-10 rounded-4xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-3xl md:text-5xl font-black text-slate-900">Welcome, {profile?.full_name}</h1>
                </motion.div>

                {hasAccess ? (
                    <>
                        <StatsGrid isActive={true} charityPercentage={profile?.charity_percentage} drawsEntered={participation.drawsEntered} nextDraw={participation.nextDraw} fadeUp={fadeUp} />
                        <WinningsVault winnings={winnings} handleFileUpload={handleFileUpload} uploadingId={uploadingId} fadeUp={fadeUp} />
                        <motion.div variants={fadeUp}>
                            <Scorecard
                                scores={scores} newScore={newScore} setNewScore={setNewScore} handleScoreSubmit={handleScoreSubmit} isProcessing={isProcessing}
                                editingScoreId={editingScoreId} setEditingScoreId={setEditingScoreId} editScoreValue={editScoreValue} setEditScoreValue={setEditScoreValue}
                                handleEditScore={handleEditScore} scoreMessage={scoreMessage}
                            />
                        </motion.div>
                    </>
                ) : (
                    <motion.div variants={fadeUp}>
                        <SubscriptionPaywall profile={profile} />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}