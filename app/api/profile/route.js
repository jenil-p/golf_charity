import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.js';
import { getSupabaseServer } from '@/lib/supabaseServer.js';

export async function PUT(request) {
    try {
        const { charityId, percentage } = await request.json();
        
        const supabaseServer = getSupabaseServer();

        const { data: { user } } = await supabaseServer.auth.getUser();

        // min contri is to be 10 percentage... and maximum obviously is 100
        if (percentage !== undefined && (percentage < 10 || percentage > 100)) {
            return NextResponse.json({ error: "Percentage must be between 10 and 100" }, { status: 400 });
        }

        const updateData = {};
        if (charityId !== undefined) updateData.selected_charity_id = charityId;
        if (percentage !== undefined) updateData.charity_percentage = parseInt(percentage);

        const { error } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}