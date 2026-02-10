import React, { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateEvent, deleteEvent } from '../db';
import { useAppStore } from '../store';
import { X, Calendar, MapPin, Trophy, Users, ExternalLink, Trash2, Edit, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn, resolveImageUrl } from '../utils';

// Safe Formatter
const safeFormat = (date, formatStr) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Not Specified';
        return format(d, formatStr);
    } catch (e) {
        return 'Not Specified';
    }
};

const DetailPosterImage = ({ event }) => {
    const [imgSrc, setImgSrc] = React.useState(null);

    React.useEffect(() => {
        let objectUrl = null;

        if (event.posterBlob instanceof Blob) {
            objectUrl = URL.createObjectURL(event.posterBlob);
            setImgSrc(objectUrl);
        } else if (typeof event.posterBlob === 'string' && event.posterBlob) {
            setImgSrc(resolveImageUrl(event.posterBlob));
        } else if (event.posterUrl) {
            setImgSrc(resolveImageUrl(event.posterUrl));
        } else {
            setImgSrc(null);
        }

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [event.posterBlob, event.posterUrl]);

    if (!imgSrc) return null;

    return (
        <div className="mb-8 group relative">
            <img
                src={imgSrc}
                alt={event.eventName}
                className="w-full max-h-[400px] object-contain rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 group-hover:scale-[1.01] transition-transform duration-500"
                onError={() => setImgSrc(null)}
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
        </div>
    );
};

const EventDetailsModal = () => {
    const modals = useAppStore((state) => state.modals);
    const closeModal = useAppStore((state) => state.closeModal);
    const selectedEventId = useAppStore((state) => state.selectedEventId);
    const isOpen = modals.eventDetails;

    const event = useLiveQuery(
        () => selectedEventId ? db.events.get(selectedEventId) : null,
        [selectedEventId]
    );

    const openModal = useAppStore((state) => state.openModal);
    const preferences = useAppStore((state) => state.preferences);

    const modalContentRef = useRef(null);

    // Auto-scroll to top when modal opens
    React.useEffect(() => {
        if (isOpen) {
            // Instant scroll to top of page to prevent locking issues
            window.scrollTo(0, 0);

            // Also scroll the modal content to top
            if (modalContentRef.current) {
                modalContentRef.current.scrollTop = 0;
            }

            // Also prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            // Re-enable body scroll when modal closes
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleDelete = async () => {
        if (preferences.isDeleteLocked) {
            const pin = prompt('Enter Security PIN to delete this event:');
            if (pin !== '2026') {
                alert('Incorrect PIN. Delete failed.');
                return;
            }
        }

        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            await deleteEvent(selectedEventId);
            closeModal('eventDetails');
        }
    };

    const handleEdit = () => {
        closeModal('eventDetails');
        openModal('editEvent');
    };

    const handleStatusChange = async (newStatus) => {
        await updateEvent(selectedEventId, { status: newStatus });
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={() => closeModal('eventDetails')}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-slate-200 dark:border-slate-700">
                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                                <Trophy size={24} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                Event <span className="text-indigo-600">Intelligence</span>
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-xl font-bold transition-all text-sm"
                            >
                                <Edit size={16} />
                                Edit Details
                            </button>
                            <button
                                onClick={() => closeModal('eventDetails')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div ref={modalContentRef} className="px-8 py-8 max-h-[70vh] overflow-y-auto">
                        {/* Poster */}
                        <DetailPosterImage event={event} />


                        {/* Title & College */}
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
                                    {event.eventType}
                                </span>
                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg badge-${(event.status || 'open').toLowerCase().replace(' ', '-')}`}>
                                    {event.status || 'Open'}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                {event.eventName}
                            </h2>
                            <p className="text-lg font-semibold text-slate-500 flex items-center gap-2">
                                <MapPin size={18} className="text-rose-500" />
                                {event.collegeName}
                            </p>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            {[
                                { label: 'Deadline', value: safeFormat(event.registrationDeadline, 'MMM dd'), icon: Calendar, color: 'text-rose-500' },
                                { label: 'Event Date', value: safeFormat(event.startDate, 'MMM dd'), icon: Clock, color: 'text-indigo-500' },
                                { label: 'Prize', value: `₹${(event.prizeAmount || 0).toLocaleString()}`, icon: Trophy, color: 'text-emerald-500' },
                                { label: 'JD Status', value: event.prizeWon || 'Enrolled', icon: Sparkles, color: 'text-amber-500' }
                            ].map((stat, i) => (
                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon size={14} className={stat.color} />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{stat.label}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Description Section */}
                        <div className="space-y-8">
                            {event.description && (
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                        Event Intelligence
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                        {event.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {event.eligibility && (
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                                            Eligibility Criteria
                                        </h4>
                                        <p className="text-slate-600 dark:text-slate-300 font-bold">{event.eligibility}</p>
                                    </div>
                                )}

                                {(event.contact1 || event.contact2 || (event.contactNumbers && event.contactNumbers.length > 0)) && (
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
                                            Direct Contacts
                                        </h4>
                                        <div className="flex flex-col gap-2">
                                            {event.contact1 && (
                                                <a href={`tel:${event.contact1}`} className="text-slate-700 dark:text-slate-300 font-bold hover:text-rose-600 transition-colors flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-[10px]">1</div>
                                                    {event.contact1}
                                                </a>
                                            )}
                                            {event.contact2 && (
                                                <a href={`tel:${event.contact2}`} className="text-slate-700 dark:text-slate-300 font-bold hover:text-rose-600 transition-colors flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-[10px]">2</div>
                                                    {event.contact2}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Team Details Section */}
                            {(event.leader || event.members || event.noOfTeams) && (
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                                        JD Team Intelligence
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {event.leader && (
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Squad Leader</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{event.leader}</span>
                                            </div>
                                        )}
                                        {event.members && (
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Squad Members</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{event.members}</span>
                                            </div>
                                        )}
                                        {event.noOfTeams && (
                                            <div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Active Teams</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{event.noOfTeams}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {event.website && (
                                <a
                                    href={event.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:brightness-110 active:scale-95 transition-all"
                                >
                                    <ExternalLink size={20} />
                                    SYNC WITH OFFICIAL WEBSITE
                                </a>
                            )}
                        </div>

                        {/* Status Management */}
                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 justify-center">
                                Override Event Status
                            </h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                {['Open', 'Closed', 'Attended', 'Won', 'Blocked'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={cn(
                                            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border-2",
                                            event.status === status
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 scale-105"
                                                : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-indigo-300"
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-rose-600 border border-rose-100 dark:border-rose-900/50 rounded-xl font-bold hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                            <Trash2 size={20} />
                            Expunge Event
                        </button>
                        <button
                            onClick={() => closeModal('eventDetails')}
                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg"
                        >
                            Secure & Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
