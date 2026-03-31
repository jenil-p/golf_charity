import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(request) {
    try {
        const supabase = getSupabaseAdmin();
        const { winningId, newStatus } = await request.json();

        // Validate the status against our database constraints
        if (!['pending_verification', 'approved', 'paid', 'rejected'].includes(newStatus)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        const { error } = await supabase
            .from('winnings')
            .update({ payment_status: newStatus })
            .eq('id', winningId);

        if (error) throw error;

        return NextResponse.json({ success: true, status: newStatus });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}