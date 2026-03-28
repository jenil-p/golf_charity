import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
    try {
        const { name, description, images = [], events = [] } = await request.json();

        // insert the main Charity record first to get its ID
        const { data: charity, error: charityError } = await supabase
            .from('charities')
            .insert([{ name, description }])
            .select()
            .single();

        if (charityError) throw charityError;
        const charityId = charity.id;

        // Insert Images
        if (images.length > 0) {
            const imagePayload = images.map(img => ({
                charity_id: charityId,
                image_url: img.url,
                is_primary: img.is_primary || false
            }));
            const { error: imageError } = await supabase.from('charity_images').insert(imagePayload);
            if (imageError) console.error("Failed to insert images:", imageError);
        }

        // Insert Events
        if (events.length > 0) {
            const eventPayload = events.map(ev => ({
                charity_id: charityId,
                title: ev.title,
                event_date: ev.event_date,
                description: ev.description || null
            }));
            const { error: eventError } = await supabase.from('charity_events').insert(eventPayload);
            if (eventError) console.error("Failed to insert events:", eventError);
        }

        return NextResponse.json({ success: true, data: charity });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function PUT(request) {
    try {
        const { id, name, description, is_active, images, events } = await request.json();

        // Update the main Charity details
        const { data: charity, error: charityError } = await supabase
            .from('charities')
            .update({ name, description, is_active })
            .eq('id', id)
            .select()
            .single();

        if (charityError) throw charityError;

        // Images sync with updated once
        if (Array.isArray(images)) {
            const incomingImageIds = images.filter(img => img.id).map(img => img.id);

            // Delete removed images
            if (incomingImageIds.length > 0) {
                await supabase.from('charity_images')
                    .delete()
                    .eq('charity_id', id)
                    .not('id', 'in', `(${incomingImageIds.join(',')})`);
            } else {
                await supabase.from('charity_images').delete().eq('charity_id', id);
            }

            const existingImages = images.filter(img => img.id).map(img => ({
                id: img.id,
                charity_id: id,
                image_url: img.url,
                is_primary: img.is_primary || false
            }));

            const newImages = images.filter(img => !img.id).map(img => ({
                charity_id: id,
                image_url: img.url,
                is_primary: img.is_primary || false
            }));

            if (existingImages.length > 0) {
                const { error: err1 } = await supabase.from('charity_images').upsert(existingImages, { onConflict: 'id' });
                if (err1) throw err1;
            }
            if (newImages.length > 0) {
                const { error: err2 } = await supabase.from('charity_images').insert(newImages);
                if (err2) throw err2;
            }
        }

        // events sync with updated oness...
        if (Array.isArray(events)) {
            const incomingEventIds = events.filter(ev => ev.id).map(ev => ev.id);

            // Delete removed events
            if (incomingEventIds.length > 0) {
                await supabase.from('charity_events')
                    .delete()
                    .eq('charity_id', id)
                    .not('id', 'in', `(${incomingEventIds.join(',')})`);
            } else {
                await supabase.from('charity_events').delete().eq('charity_id', id);
            }

            // Separate into Updates and Inserts
            const existingEvents = events.filter(ev => ev.id).map(ev => ({
                id: ev.id,
                charity_id: id,
                title: ev.title,
                event_date: ev.event_date,
                description: ev.description || null
            }));

            const newEvents = events.filter(ev => !ev.id).map(ev => ({
                charity_id: id,
                title: ev.title,
                event_date: ev.event_date,
                description: ev.description || null
            }));

            // execute the changes ...
            if (existingEvents.length > 0) {
                const { error: err1 } = await supabase.from('charity_events').upsert(existingEvents, { onConflict: 'id' });
                if (err1) throw err1;
            }
            if (newEvents.length > 0) {
                const { error: err2 } = await supabase.from('charity_events').insert(newEvents);
                if (err2) throw err2;
            }
        }

        return NextResponse.json({ success: true, data: charity });
    } catch (error) {
        console.error("API PUT Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function DELETE(request) {
    try {
        const { id } = await request.json();

        // Soft delete
        const { error } = await supabase
            .from('charities')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}