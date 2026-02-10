import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { db, updateEvent, EventType } from '../db';
import { X, Save, Sparkles } from 'lucide-react';
import { cn } from '../utils';
import { useLiveQuery } from 'dexie-react-hooks';

const PreviewImage = ({ blob }) => {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!(blob instanceof Blob)) return;
        const newUrl = URL.createObjectURL(blob);
        setUrl(newUrl);
        return () => URL.revokeObjectURL(newUrl);
    }, [blob]);

    if (!url) return null;
    return <img src={url} alt="Preview" className="h-32 w-auto rounded-lg shadow-md" />;
};

const EditEventModal = () => {
    const modals = useAppStore((state) => state.modals);
    const closeModal = useAppStore((state) => state.closeModal);
    const selectedEventId = useAppStore((state) => state.selectedEventId);
    const isOpen = modals.editEvent;

    const event = useLiveQuery(
        () => selectedEventId ? db.events.get(selectedEventId) : null,
        [selectedEventId]
    );

    const [formData, setFormData] = useState({
        collegeName: '',
        eventName: '',
        eventType: EventType.HACKATHON,
        registrationDeadline: '',
        startDate: '',
        endDate: '',
        prizeAmount: '',
        registrationFee: '',
        accommodation: false,
        location: '',
        isOnline: false,
        contactNumbers: '',
        posterUrl: '',
        posterBlob: null,
        website: '',
        description: '',
        teamSize: '1',
        eligibility: '',
        status: '',
        contact1: '',
        contact2: '',
        leader: '',
        members: '',
        noOfTeams: '',
        prizeWon: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (event) {
            setFormData({
                collegeName: event.collegeName || '',
                eventName: event.eventName || '',
                eventType: event.eventType || EventType.HACKATHON,
                registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
                startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
                endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
                prizeAmount: event.prizeAmount || '',
                registrationFee: event.registrationFee || '',
                accommodation: !!event.accommodation,
                location: event.location || '',
                isOnline: !!event.isOnline,
                contactNumbers: Array.isArray(event.contactNumbers) ? event.contactNumbers.join(', ') : '',
                posterUrl: event.posterUrl || '',
                posterBlob: event.posterBlob || null,
                website: event.website || '',
                description: event.description || '',
                teamSize: event.teamSize || '1',
                eligibility: event.eligibility || '',
                status: event.status || '',
                contact1: event.contact1 || '',
                contact2: event.contact2 || '',
                leader: event.leader || '',
                members: event.members || '',
                noOfTeams: event.noOfTeams || '',
                prizeWon: event.prizeWon || ''
            });
        }
    }, [event]);

    // Auto-scroll to top when modal opens
    useEffect(() => {
        if (isOpen) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const updates = {
                ...formData,
                prizeAmount: parseFloat(formData.prizeAmount) || 0,
                registrationFee: parseFloat(formData.registrationFee) || 0,
                teamSize: parseInt(formData.teamSize) || 1,
                contactNumbers: formData.contactNumbers.split(',').map(c => c.trim()).filter(Boolean),
                registrationDeadline: new Date(formData.registrationDeadline),
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate)
            };

            await updateEvent(selectedEventId, updates);
            closeModal('editEvent');
        } catch (error) {
            console.error('ERROR UPDATING EVENT:', error);
            alert(`System Error: ${error.message || 'Unknown database error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={() => closeModal('editEvent')}
                ></div>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-200 dark:border-slate-700">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-indigo-500" size={24} />
                                Edit <span className="text-indigo-600">Event</span>
                            </h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Update details for {event.eventName}</p>
                        </div>
                        <button
                            onClick={() => closeModal('editEvent')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Name *</label>
                                    <input
                                        type="text"
                                        name="eventName"
                                        value={formData.eventName}
                                        onChange={handleChange}
                                        required
                                        className="input-premium"
                                        placeholder="CODE-THON '24"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">College Name *</label>
                                    <input
                                        type="text"
                                        name="collegeName"
                                        value={formData.collegeName}
                                        onChange={handleChange}
                                        required
                                        className="input-premium"
                                        placeholder="ABC Engineering College"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Event Type *</label>
                                    <select
                                        name="eventType"
                                        value={formData.eventType}
                                        onChange={handleChange}
                                        required
                                        className="input-premium"
                                    >
                                        {Object.values(EventType).map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Current Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="input-premium"
                                    >
                                        {['Open', 'Closed', 'Attended', 'Won', 'Blocked'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Deadline *</label>
                                    <input
                                        type="date"
                                        name="registrationDeadline"
                                        value={formData.registrationDeadline}
                                        onChange={handleChange}
                                        required
                                        className="input-premium"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Start Date *</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                        className="input-premium"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">End Date *</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        required
                                        className="input-premium"
                                    />
                                </div>
                            </div>

                            {/* Prize & Fee */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Prize Amount (₹)</label>
                                    <input
                                        type="number"
                                        name="prizeAmount"
                                        value={formData.prizeAmount}
                                        onChange={handleChange}
                                        className="input-premium text-emerald-600 font-bold"
                                        placeholder="50000"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Reg Fee (₹)</label>
                                    <input
                                        type="number"
                                        name="registrationFee"
                                        value={formData.registrationFee}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Location</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="Bangalore"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Team Size</label>
                                    <input
                                        type="number"
                                        name="teamSize"
                                        value={formData.teamSize}
                                        onChange={handleChange}
                                        className="input-premium"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="isOnline"
                                        checked={formData.isOnline}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Online Event</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="accommodation"
                                        checked={formData.accommodation}
                                        onChange={handleChange}
                                        className="w-5 h-5 text-indigo-600 rounded-lg focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">Accommodation</span>
                                </label>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Contact Numbers</label>
                                <input
                                    type="text"
                                    name="contactNumbers"
                                    value={formData.contactNumbers}
                                    onChange={handleChange}
                                    className="input-premium"
                                    placeholder="9876543210, 9876543211"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Website URL</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="input-premium"
                                    placeholder="https://example.com/register"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Current/New Poster (Upload)</label>
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                        {formData.posterBlob || event.posterBlob ? (
                                            <div className="relative inline-block">
                                                <PreviewImage blob={formData.posterBlob || event.posterBlob} />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, posterBlob: null }))}
                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <label className="cursor-pointer text-indigo-600 font-bold hover:text-indigo-500 transition-colors">
                                                    <span>Upload new poster</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(e) => setFormData(prev => ({ ...prev, posterBlob: e.target.files[0] }))}
                                                        accept="image/*"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Poster Image URL (Alternative)</label>
                                    <input
                                        type="url"
                                        name="posterUrl"
                                        value={formData.posterUrl}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="https://example.com/poster.jpg"
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Contact - 1</label>
                                    <input
                                        type="text"
                                        name="contact1"
                                        value={formData.contact1}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Contact - 2</label>
                                    <input
                                        type="text"
                                        name="contact2"
                                        value={formData.contact2}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="9876543211"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Leader Name</label>
                                    <input
                                        type="text"
                                        name="leader"
                                        value={formData.leader}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Members Count/Names</label>
                                    <input
                                        type="text"
                                        name="members"
                                        value={formData.members}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="Alice, Bob, Charlie"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">No. of Teams</label>
                                    <input
                                        type="text"
                                        name="noOfTeams"
                                        value={formData.noOfTeams}
                                        onChange={handleChange}
                                        className="input-premium"
                                        placeholder="3 Teams"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Price/Prize Won</label>
                                    <input
                                        type="text"
                                        name="prizeWon"
                                        value={formData.prizeWon}
                                        onChange={handleChange}
                                        className="input-premium text-emerald-600 font-bold"
                                        placeholder="Winner / Runner"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className="input-premium resize-none"
                                    placeholder="Event details..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Eligibility</label>
                                <input
                                    type="text"
                                    name="eligibility"
                                    value={formData.eligibility}
                                    onChange={handleChange}
                                    className="input-premium"
                                    placeholder="B.Tech students"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => closeModal('editEvent')}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditEventModal;
