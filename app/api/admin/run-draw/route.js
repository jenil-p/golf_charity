import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);


const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
    try {
        const { mode = 'simulate', logicType = 'random' } = await request.json();
        const currentMonthString = new Date().toISOString().slice(0, 7);

        if (mode === 'publish') {
            const { data: existingDraw } = await supabase
                .from('draws')
                .select('id')
                .like('draw_month', `${currentMonthString}%`)
                .eq('status', 'published')
                .single();

            if (existingDraw) {
                return NextResponse.json(
                    { isWarning: true, message: "A draw has already been published for this month. Are you absolutely sure you want to run another official draw?" },
                    { status: 409 }
                );
            }
        }

        
        const { data: activeSubs, error: subError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('status', 'active');

        if (subError) throw subError;
        const activeUserIds = activeSubs.map(sub => sub.user_id);

        // If there are no active users, we cannot run a draw.
        if (activeUserIds.length === 0) {
            return NextResponse.json({ error: "No active subscriptions found. Cannot run draw." }, { status: 400 });
        }

        // Fetch scores ONLY for those active users
        const { data: allScores, error: scoresError } = await supabase
            .from('golf_scores')
            .select('user_id, score')
            .in('user_id', activeUserIds);

        if (scoresError) throw scoresError;

        // Group scores by user and track frequency
        const userScoreMap = {};
        const frequencyMap = {};
        for (let i = 1; i <= 45; i++) frequencyMap[i] = 0;

        allScores.forEach(row => {
            if (!userScoreMap[row.user_id]) userScoreMap[row.user_id] = [];
            userScoreMap[row.user_id].push(row.score);
            frequencyMap[row.score] += 1;
        });

        const winningNumbers = [];

        if (logicType === 'random') {
            while (winningNumbers.length < 5) {
                const randomNum = Math.floor(Math.random() * 45) + 1;
                if (!winningNumbers.includes(randomNum)) winningNumbers.push(randomNum);
            }
        } else if (logicType === 'algorithmic') {
            // Weighted by most frequent scores ... can be later given option to admin if he wants to do it for lowest entered scores...
            let weightedPool = [];
            for (let i = 1; i <= 45; i++) {
                const weight = 1 + frequencyMap[i];
                for (let w = 0; w < weight; w++) weightedPool.push(i);
            }

            while (winningNumbers.length < 5) {
                const randomIndex = Math.floor(Math.random() * weightedPool.length);
                const selectedNum = weightedPool[randomIndex];
                if (!winningNumbers.includes(selectedNum)) winningNumbers.push(selectedNum);
            }
        }
        winningNumbers.sort((a, b) => a - b);

        const MONTHLY_SUB_PRICE = 1000;
        const PRIZE_POOL_PERCENTAGE = 0.40;

        const totalMonthlyRevenue = activeUserIds.length * MONTHLY_SUB_PRICE;
        let totalPrizePool = totalMonthlyRevenue * PRIZE_POOL_PERCENTAGE;
        let rolloverAmount = 0;

        // Check for Rollover from the previous published draw
        const { data: lastDraw } = await supabase
            .from('draws')
            .select('id, total_prize_pool')
            .eq('status', 'published')
            .order('draw_month', { ascending: false })
            .limit(1)
            .single();

        if (lastDraw) {
            // Did anyone hit the 5-match jackpot last time?
            const { count: lastJackpotWinners } = await supabase
                .from('winnings')
                .select('*', { count: 'exact', head: true })
                .eq('draw_id', lastDraw.id)
                .eq('match_tier', 5);

            if (lastJackpotWinners === 0) {
                // No jackpot winner = roll over 40% of LAST month's total pool
                rolloverAmount = lastDraw.total_prize_pool * 0.40;
                totalPrizePool += rolloverAmount;
            }
        }

        const winners = { 3: [], 4: [], 5: [] };

        for (const [userId, scores] of Object.entries(userScoreMap)) {
            // Only users with exactly 5 logged scores qualify for the draw
            if (scores.length === 5) {
                const matchCount = scores.filter(score => winningNumbers.includes(score)).length;
                if (matchCount >= 3 && matchCount <= 5) winners[matchCount].push(userId);
            }
        }

        // 5-Match (40%), 4-Match (35%), 3-Match (25%)
        const payouts = {
            5: winners[5].length > 0 ? (totalPrizePool * 0.40) / winners[5].length : 0,
            4: winners[4].length > 0 ? (totalPrizePool * 0.35) / winners[4].length : 0,
            3: winners[3].length > 0 ? (totalPrizePool * 0.25) / winners[3].length : 0,
        };

        const responsePayload = {
            success: true,
            logicType,
            winningNumbers,
            totalPrizePool,
            rolloverAmount,
            winnerCounts: { '5-Matches': winners[5].length, '4-Matches': winners[4].length, '3-Matches': winners[3].length },
            payouts
        };

        // If just running a simulation, stop here.
        if (mode === 'simulate') {
            return NextResponse.json({ ...responsePayload, mode: 'simulation' });
        }

        const currentMonthDate = new Date().toISOString().slice(0, 10);

        const { data: drawRecord, error: drawError } = await supabase
            .from('draws')
            .insert([{
                draw_month: currentMonthDate,
                winning_numbers: winningNumbers,
                total_prize_pool: totalPrizePool,
                status: 'published'
            }]).select().single();

        if (drawError) throw drawError;

        const winningsToInsert = [];
        [3, 4, 5].forEach(tier => {
            winners[tier].forEach(userId => {
                winningsToInsert.push({
                    user_id: userId,
                    draw_id: drawRecord.id,
                    match_tier: tier,
                    prize_amount: payouts[tier],
                    payment_status: 'pending_verification'
                });
            });
        });

        if (winningsToInsert.length > 0) {
            await supabase.from('winnings').insert(winningsToInsert);

            // EMAIL NOTIFICATION SYSTEM
            // Fire emails asynchronously in the background so it doesn't block the API response
            if (resend) {
                winningsToInsert.forEach(async (win) => {
                    try {
                        const { data: userProfile } = await supabase.from('profiles').select('email:id, full_name').eq('id', win.user_id).single();

                        if (userProfile) {
                            await resend.emails.send({
                                from: 'ImpactLinks <winners@impactlinks.com>',
                                to: userProfile.email,
                                subject: `Congratulations! You Won ₹${win.prize_amount.toLocaleString()} in the ImpactLinks Draw!`,
                                html: `
                                    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; color: #0A3622;">
                                        <h2>Congratulations, ${userProfile.full_name}!</h2>
                                        <p>Your weekend Stableford scores successfully hit a <strong>${win.match_tier}-Number Match</strong> in this month's algorithmic draw.</p>
                                        <div style="background-color: #FFDE59; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                                            <h1 style="margin: 0; color: #0A3622;">₹${win.prize_amount.toLocaleString()}</h1>
                                            <p style="margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase;">Prize Allocation</p>
                                        </div>
                                        <p><strong>Next Steps:</strong> Log into your dashboard to upload a screenshot of your official golf club scorecard. Once verified by our team, your payout will be initiated.</p>
                                    </div>
                                `,
                            });
                        }
                    } catch (emailErr) {
                        console.error("Failed to send winner email:", emailErr);
                    }
                });
            }
        }

        return NextResponse.json({ ...responsePayload, mode: 'published' });

    } catch (error) {
        console.error("Draw Engine Error:", error);
        return NextResponse.json({ error: error.message || "Failed to run draw" }, { status: 500 });
    }
}