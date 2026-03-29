import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.js';
import { getSupabaseServer } from '@/lib/supabaseServer.js';


// to add the scores...
export async function POST(request) {
    try {
        const { score, userId } = await request.json();

        // score must be b/w 1-45
        if (score < 1 || score > 45) {
            return NextResponse.json({ error: "Score must be between 1 and 45" }, { status: 400 });
        }

        // user's curretn 5 golf scores in assending order of time
        const { data: currentScores, error: fetchError } = await supabaseAdmin
            .from('golf_scores')
            .select('id, played_date')
            .eq('user_id', userId)
            .order('played_date', { ascending: true });

        if (fetchError) throw fetchError;


        if (currentScores && currentScores.length >= 5) {
            const oldestScoreId = currentScores[0].id;

            const { error: deleteError } = await supabaseAdmin
                .from('golf_scores')
                .delete()
                .eq('id', oldestScoreId);

            if (deleteError) throw deleteError;
        }

        const { error: insertError } = await supabaseAdmin
            .from('golf_scores')
            .insert([
                {
                    user_id: userId,
                    score: parseInt(score),
                    played_date: new Date().toISOString()
                }
            ]);

        if (insertError) throw insertError;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Score entry error:", error);
        return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { scoreId, newScore } = await request.json();

        const supabaseServer = getSupabaseServer();

        const { data: { user } } = await supabaseServer.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (newScore < 1 || newScore > 45) {
            return NextResponse.json({ error: "Score must be between 1 and 45" }, { status: 400 });
        }

        // Verify the score belongs to the user before updating
        const { error } = await supabaseAdmin
            .from('golf_scores')
            .update({ score: parseInt(newScore) })
            .eq('id', scoreId)
            .eq('user_id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
    }
}