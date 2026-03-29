import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabaseServer.js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function PUT(request) {
    try {
        const { action, payload } = await request.json();

        const supabaseServer = getSupabaseServer();

        const { data: { user } } = await supabaseServer.auth.getUser();

        if (action === 'update_profile') {
            await supabase.from('profiles').update({ full_name: payload.full_name }).eq('id', user.id);
        } else if (action === 'update_subscription') {
            await supabase.from('subscriptions').update({ status: payload.status }).eq('user_id', user.id);
        } else if (action === 'update_score') {
            await supabase.from('golf_scores').update({ score: payload.score }).eq('id', payload.scoreId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Fetch a specific user's detailed scores for the admin modal
export async function POST(request) {
    try {
        const { userId } = await request.json();
        const { data } = await supabase.from('golf_scores').select('*').eq('user_id', userId).order('played_date', { ascending: false });
        return NextResponse.json({ scores: data || [] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}