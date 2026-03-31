import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
    try {
        const supabase = getSupabaseAdmin();
        const { mode = 'simulate', logicType = 'random', dataToPublish = null } = await request.json();
        const currentMonthString = new Date().toISOString().slice(0, 7);

        if (mode === 'publish') {
            if (!dataToPublish) throw new Error("No draw data provided to publish.");

            // Final check for existing published draw this month
            const { data: existingDraw } = await supabase
                .from('draws')
                .select('id')
                .like('draw_month', `${currentMonthString}%`)
                .eq('status', 'published')
                .single();

            if (existingDraw) {
                if(!confirm("You have already published a draw for this month. Are you sure want to publish a new draw again ?")){
                    return;
                }
            }

            // Insert the Main Draw Record
            const { data: drawRecord, error: drawError } = await supabase
                .from('draws')
                .insert([{
                    draw_month: new Date().toISOString().slice(0, 10),
                    winning_numbers: dataToPublish.winningNumbers,
                    total_prize_pool: dataToPublish.totalPrizePool,
                    status: 'published'
                }]).select().single();

            if (drawError) throw drawError;

            // Prepare Winnings for Database
            const winningsToInsert = [];
            [3, 4, 5].forEach(tier => {
                const tierWinners = dataToPublish.winners[tier] || [];
                tierWinners.forEach(userId => {
                    winningsToInsert.push({
                        user_id: userId,
                        draw_id: drawRecord.id,
                        match_tier: tier,
                        prize_amount: dataToPublish.payouts[tier],
                        payment_status: 'pending_verification'
                    });
                });
            });

            if (winningsToInsert.length > 0) {
                await supabase.from('winnings').insert(winningsToInsert);

                // Asynchronous Email Notifications
                if (resend) {
                    winningsToInsert.forEach(async (win) => {
                        try {
                            const { data: userProfile } = await supabase
                                .from('profiles')
                                .select('email, full_name')
                                .eq('id', win.user_id)
                                .single();

                            if (userProfile?.email) {
                                await resend.emails.send({
                                    from: 'ImpactLinks <winners@impactlinks.com>',
                                    to: userProfile.email,
                                    subject: `Congratulations! You Won ₹${win.prize_amount.toLocaleString()}!`,
                                    html: `
                                        <div style="font-family: sans-serif; padding: 20px; color: #0A3622;">
                                            <h2>Congratulations, ${userProfile.full_name}!</h2>
                                            <p>You hit a <strong>${win.match_tier}-Number Match</strong> in this month's draw.</p>
                                            <div style="background-color: #FFDE59; padding: 20px; border-radius: 12px; text-align: center;">
                                                <h1 style="margin: 0;">₹${win.prize_amount.toLocaleString()}</h1>
                                            </div>
                                            <p>Log into your dashboard to verify your scorecard and claim your prize.</p>
                                        </div>`
                                });
                            }
                        } catch (e) { console.error("Email Error:", e); }
                    });
                }
            }
            return NextResponse.json({ success: true, mode: 'published' });
        }

        // --- SIMULATION & GENERATION ---
        const { data: activeSubs, error: subError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('status', 'active');

        if (subError) throw subError;
        const activeUserIds = activeSubs.map(sub => sub.user_id);
        if (activeUserIds.length === 0) return NextResponse.json({ error: "No active subscriptions." }, { status: 400 });

        const { data: allScores, error: scoresError } = await supabase
            .from('golf_scores')
            .select('user_id, score')
            .in('user_id', activeUserIds);

        if (scoresError) throw scoresError;

        const userScoreMap = {};
        const frequencyMap = {};
        for (let i = 1; i <= 45; i++) frequencyMap[i] = 0;

        allScores.forEach(row => {
            if (!userScoreMap[row.user_id]) userScoreMap[row.user_id] = [];
            userScoreMap[row.user_id].push(row.score);
            frequencyMap[row.score] += 1;
        });

        let winningNumbers = [];
        if (logicType === 'random') {
            while (winningNumbers.length < 5) {
                const randomNum = Math.floor(Math.random() * 45) + 1;
                if (!winningNumbers.includes(randomNum)) winningNumbers.push(randomNum);
            }
        } else {
            let weightedPool = [];
            for (let i = 1; i <= 45; i++) {
                const weight = 1 + frequencyMap[i];
                for (let w = 0; w < weight; w++) weightedPool.push(i);
            }
            while (winningNumbers.length < 5) {
                const selectedNum = weightedPool[Math.floor(Math.random() * weightedPool.length)];
                if (!winningNumbers.includes(selectedNum)) winningNumbers.push(selectedNum);
            }
        }
        winningNumbers.sort((a, b) => a - b);

        // Prize Calculations
        const totalMonthlyRevenue = activeUserIds.length * 1000;
        let totalPrizePool = totalMonthlyRevenue * 0.40;
        let rolloverAmount = 0;

        const { data: lastDraw } = await supabase
            .from('draws')
            .select('id, total_prize_pool')
            .eq('status', 'published')
            .order('draw_month', { ascending: false })
            .limit(1)
            .single();

        if (lastDraw) {
            const { count: lastWinners } = await supabase
                .from('winnings')
                .select('*', { count: 'exact', head: true })
                .eq('draw_id', lastDraw.id).eq('match_tier', 5);
            if (lastWinners === 0) {
                rolloverAmount = lastDraw.total_prize_pool * 0.40;
                totalPrizePool += rolloverAmount;
            }
        }

        const winners = { 3: [], 4: [], 5: [] };
        Object.entries(userScoreMap).forEach(([uid, scores]) => {
            if (scores.length === 5) {
                const matches = scores.filter(s => winningNumbers.includes(s)).length;
                if (matches >= 3) winners[matches].push(uid);
            }
        });

        const payouts = {
            5: winners[5].length > 0 ? (totalPrizePool * 0.40) / winners[5].length : 0,
            4: winners[4].length > 0 ? (totalPrizePool * 0.35) / winners[4].length : 0,
            3: winners[3].length > 0 ? (totalPrizePool * 0.25) / winners[3].length : 0,
        };

        return NextResponse.json({
            success: true,
            mode: 'simulation',
            logicType,
            winningNumbers,
            totalPrizePool,
            rolloverAmount,
            winnerCounts: { '5-Matches': winners[5].length, '4-Matches': winners[4].length, '3-Matches': winners[3].length },
            winners, // Stored to send back for official publish
            payouts
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}