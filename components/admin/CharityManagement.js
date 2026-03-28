'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Image as ImageIcon, Calendar, Check, Upload } from 'lucide-react';

import Loading from '../ui/Loading';

export default function CharityManagement() {
    const [charities, setCharities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', is_active: true });

    // Updated Images State to handle raw Files and local Previews
    const [images, setImages] = useState([{ url: '', file: null, preview: '', is_primary: true }]);
    const [events, setEvents] = useState([]);

    const fetchCharities = async () => {
        const { data, error } = await supabase
            .from('charities')
            .select(`
                *,
                charity_images ( id, image_url, is_primary ),
                charity_events ( id, title, event_date, description )
            `)
            .order('created_at', { ascending: false });

        if (data) setCharities(data);
        if (error) console.error("Fetch Error:", error);
        setLoading(false);
    };

    useEffect(() => { fetchCharities(); }, []);

    // --- Media Handlers ---
    const addImageField = () => setImages([...images, { url: '', file: null, preview: '', is_primary: images.length === 0 }]);

    const removeImageField = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        // Ensure we always have a primary image if images exist
        if (images[index].is_primary && newImages.length > 0) newImages[0].is_primary = true;
        setImages(newImages);
    };

    const setPrimaryImage = (index) => {
        setImages(images.map((img, i) => ({ ...img, is_primary: i === index })));
    };

    const handleFileSelect = (index, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const newImages = [...images];
        newImages[index].file = file;
        newImages[index].preview = URL.createObjectURL(file); // Create local preview instantly
        setImages(newImages);
    };

    // --- Event Handlers ---
    const addEventField = () => setEvents([...events, { title: '', event_date: '', description: '' }]);
    const removeEventField = (index) => setEvents(events.filter((_, i) => i !== index));

    // --- Master Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const processedImages = await Promise.all(images.map(async (img) => {
                if (img.file) {
                    const fileExt = img.file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('charity-images')
                        .upload(fileName, img.file);

                    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

                    const { data: publicUrlData } = supabase.storage
                        .from('charity-images')
                        .getPublicUrl(fileName);

                    return { url: publicUrlData.publicUrl, is_primary: img.is_primary };
                }

                // If it's an existing image (already has a URL from previous saves)
                if (img.url) {
                    return { id: img.id, url: img.url, is_primary: img.is_primary };
                }

                return null;
            }));

            const cleanImages = processedImages.filter(img => img !== null && img.url.trim() !== '');
            const cleanEvents = events.filter(ev => ev.title.trim() !== '' && ev.event_date !== '');

            if (cleanImages.length === 0) throw new Error("At least one valid image is required.");

            // 2. Send the finalized data to your Next.js API
            const method = editingId ? 'PUT' : 'POST';
            const payload = {
                id: editingId,
                name: formData.name,
                description: formData.description,
                is_active: formData.is_active,
                images: cleanImages,
                events: cleanEvents
            };

            const res = await fetch('/api/admin/charities', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save charity");
            }

            resetForm();
            fetchCharities();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEdit = (charity) => {
        setEditingId(charity.id);
        setFormData({ name: charity.name, description: charity.description, is_active: charity.is_active });

        if (charity.charity_images && charity.charity_images.length > 0) {
            setImages(charity.charity_images.map(img => ({
                id: img.id,
                url: img.image_url,
                file: null,
                preview: img.image_url,
                is_primary: img.is_primary
            })));
        } else {
            setImages([{ url: '', file: null, preview: '', is_primary: true }]);
        }

        if (charity.charity_events && charity.charity_events.length > 0) {
            setEvents(charity.charity_events.map(ev => ({
                id: ev.id,
                title: ev.title,
                event_date: ev.event_date,
                description: ev.description || ''
            })));
        } else {
            setEvents([]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', is_active: true });
        setImages([{ url: '', file: null, preview: '', is_primary: true }]);
        setEvents([]);
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to deactivate this charity?")) return;
        setIsProcessing(true);
        try {
            await fetch('/api/admin/charities', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchCharities();
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <Loading message='Loading directory...' />;


    return (
        <div className="space-y-10">
            <div className="bg-white p-5 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                <div className="mb-6 sm:mb-8 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {editingId ? 'Edit Charity Details' : 'Add New Charity'}
                    </h2>
                    {editingId && (
                        <span className="bg-amber-100 text-amber-700 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 animate-pulse"></span> Editing Mode
                        </span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 max-w-4xl">
                    {/* Basic Info */}
                    <div className="space-y-4 sm:space-y-6 bg-slate-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100">
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400">Basic Information</h3>
                        <div>
                            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 mb-1.5 sm:mb-2 uppercase tracking-wide">Charity Name</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="e.g. Green Earth Alliance" />
                        </div>
                        <div>
                            <label className="block text-[10px] sm:text-xs font-bold text-slate-700 mb-1.5 sm:mb-2 uppercase tracking-wide">Mission & Description</label>
                            <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white border border-slate-200 rounded-lg sm:rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all h-24 sm:h-32 resize-none outline-none" placeholder="Describe the impact and mission..." />
                        </div>
                    </div>

                    {/* Image Management */}
                    <div className="space-y-4 sm:space-y-6 bg-emerald-50/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-emerald-100/50">

                        {/* Changed: Stacked on mobile, side-by-side on sm+ screens */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 pb-2 sm:pb-0 border-b sm:border-0 border-emerald-100">
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-800 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Media Gallery
                            </h3>
                            <button type="button" onClick={addImageField} className="w-full sm:w-auto justify-center text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg transition-colors shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Add New Slot
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, index) => (
                                <div key={index} className={`relative flex flex-col items-center justify-center bg-white p-2 rounded-xl sm:rounded-2xl border-2 transition-all overflow-hidden ${img.is_primary ? 'border-emerald-500 shadow-md' : 'border-slate-200 border-dashed hover:border-emerald-300'}`}>

                                    {/* Primary Badge / Action */}
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryImage(index)}
                                        className={`absolute top-2 sm:top-3 left-2 sm:left-3 z-10 flex items-center justify-center px-2 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${img.is_primary ? 'bg-emerald-500 text-white' : 'bg-white/80 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 backdrop-blur-sm'}`}
                                        title="Set as Primary Thumbnail"
                                    >
                                        <Check className="w-3 h-3 mr-1" /> {img.is_primary ? 'Primary' : 'Make Primary'}
                                    </button>

                                    {/* Remove Action */}
                                    {images.length > 1 && (
                                        <button type="button" onClick={() => removeImageField(index)} className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 bg-white/90 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md backdrop-blur-sm transition-colors shadow-sm border border-slate-100">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}

                                    {/* Image Preview / File Input */}
                                    <div className="w-full h-36 sm:h-40 bg-slate-50 rounded-lg sm:rounded-xl relative flex flex-col items-center justify-center group overflow-hidden mt-1">
                                        {img.preview ? (
                                            <>
                                                <img src={img.preview} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                                                <label className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer font-bold text-xs uppercase tracking-widest backdrop-blur-sm">
                                                    <Upload className="w-6 h-6 mb-2" /> Change Image
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(index, e)} />
                                                </label>
                                            </>
                                        ) : (
                                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors">
                                                <Upload className="w-7 h-7 sm:w-8 sm:h-8 mb-2 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors">Upload Image</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(index, e)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Events Management */}
                    <div className="space-y-4 sm:space-y-6 bg-amber-50/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-amber-100/50">

                        {/* Stacked on mobile, side-by-side on sm+ screens */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 pb-2 sm:pb-0 border-b sm:border-0 border-amber-100">
                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Upcoming Initiatives
                            </h3>
                            <button type="button" onClick={addEventField} className="w-full sm:w-auto justify-center text-amber-700 hover:text-amber-800 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-lg transition-colors shadow-sm">
                                <Plus className="w-3.5 h-3.5" /> Add New Event
                            </button>
                        </div>

                        {events.length === 0 && (
                            <div className="bg-white/50 border border-amber-100/50 rounded-xl p-6 text-center">
                                <p className="text-sm text-amber-600/70 font-medium italic">No upcoming events scheduled.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {events.map((ev, index) => (
                                <div key={index} className="flex flex-col gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm relative group">

                                    {/* Action Buttons Header for Mobile */}
                                    <div className="flex justify-between items-center sm:hidden mb-1 border-b border-slate-50 pb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event #{index + 1}</span>
                                        <button type="button" onClick={() => removeEventField(index)} className="text-slate-300 hover:text-red-500 transition-colors bg-slate-50 p-1.5 rounded-md">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Desktop Trash Icon (Hidden on Mobile) */}
                                    <button type="button" onClick={() => removeEventField(index)} className="hidden sm:block absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors bg-white p-1 rounded-md z-10">
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sm:pr-8">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Event Title</label>
                                            <input type="text" required value={ev.title} onChange={e => { const newEvs = [...events]; newEvs[index].title = e.target.value; setEvents(newEvs); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:bg-white focus:border-amber-400 transition-colors" placeholder="e.g. Charity Gala" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Date</label>
                                            <input type="date" required value={ev.event_date} onChange={e => { const newEvs = [...events]; newEvs[index].event_date = e.target.value; setEvents(newEvs); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:bg-white focus:border-amber-400 text-slate-700 transition-colors" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
                                        <input type="text" value={ev.description} onChange={e => { const newEvs = [...events]; newEvs[index].description = e.target.value; setEvents(newEvs); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:bg-white focus:border-amber-400 transition-colors" placeholder="Short detail about the event..." />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-slate-100">
                        <button type="submit" disabled={isProcessing} className="flex-1 bg-[#0A3622] hover:bg-[#062416] text-[#FFDE59] font-black py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-center flex items-center justify-center gap-2 text-sm sm:text-base">
                            {isProcessing ? (
                                <><span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#FFDE59]/30 border-t-[#FFDE59] rounded-full animate-spin"></span> Processing...</>
                            ) : (
                                editingId ? 'Update Charity Record' : 'Publish Charity to Directory'
                            )}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-bold py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl transition-all text-center text-sm sm:text-base">
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* CHARITY LIST */}
            <div>
                <h2 className="text-2xl font-black mb-6 text-slate-900 tracking-tight">Active Directory</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                    {charities.map(charity => {
                        // Find primary image for display
                        const primaryImg = charity.charity_images?.find(i => i.is_primary)?.image_url || charity.charity_images?.[0]?.image_url || 'https://placehold.co/600x400';

                        return (
                            <div key={charity.id} className={`bg-white rounded-3xl overflow-hidden border shadow-sm flex flex-col transition-all ${charity.is_active ? 'border-slate-200 hover:shadow-xl hover:-translate-y-1' : 'border-red-100 opacity-70 grayscale hover:grayscale-0'}`}>
                                <div className="h-48 w-full relative bg-slate-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={primaryImg} alt={charity.name} className="w-full h-full object-cover" />
                                    {!charity.is_active && (
                                        <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                            Inactive / Hidden
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                        {charity.charity_images?.length || 0} Images | {charity.charity_events?.length || 0} Events
                                    </div>
                                </div>
                                <div className="p-6 md:p-8 flex-1 flex flex-col">
                                    <h3 className="font-black text-xl text-slate-900 mb-2 leading-tight">{charity.name}</h3>
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1 leading-relaxed font-medium">{charity.description}</p>

                                    <div className="flex gap-3 mt-auto pt-4 border-t border-slate-100">
                                        <button onClick={() => handleEdit(charity)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-sm transition-colors">
                                            Edit Details
                                        </button>
                                        {charity.is_active && (
                                            <button onClick={() => handleDelete(charity.id)} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3.5 rounded-xl text-sm transition-colors">
                                                Deactivate
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}