import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { Calendar, MapPin, Trophy, Clock, ExternalLink, ChevronRight, Share2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../utils';

// Safe Utilities
const safeFormat = (date, formatStr) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'TBD';
        return format(d, formatStr);
    } catch (e) {
        return 'TBD';
    }
};

const safeDiff = (date) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return -1;
        return differenceInDays(d, new Date());
    } catch (e) {
        return -1;
    }
};

const EventCard = ({ event }) => {
    const setSelectedEvent = useAppStore((state) => state.setSelectedEvent);
    const openModal = useAppStore((state) => state.openModal);

    const handleClick = (e) => {
        // Prevent click if clicking a link or button inside
        if (e.target.closest('a') || e.target.closest('button')) return;
        setSelectedEvent(event.id);
        openModal('eventDetails');
    };

    const getStatusStyles = (status) => {
        const styles = {
            'Open': 'badge-open',
            'Deadline Today': 'badge-deadline-today',
            'Closed': 'badge-closed',
            'Completed': 'badge-completed',
            'Attended': 'badge-attended',
            'Won': 'badge-won'
        };
        return styles[status] || 'badge-closed';
    };

    const getPriorityStyles = (score) => {
        if (score >= 70) return 'priority-high';
        if (score >= 40) return 'priority-medium';
        return 'priority-low';
    };

    const daysUntilDeadline = safeDiff(event.registrationDeadline);

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleClick}
            className="group relative glass-card p-5 cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
        >
            {/* Priority Indicator Line */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5",
                event.priorityScore >= 70 ? "bg-rose-500" : event.priorityScore >= 40 ? "bg-amber-500" : "bg-indigo-500"
            )} />

            <div className="flex flex-col sm:flex-row gap-6">
                {/* Poster Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-28 h-48 sm:h-36 relative group/img">
                    {(event.posterUrl || event.posterBlob) ? (
                        <img
                            src={event.posterBlob instanceof Blob ? URL.createObjectURL(event.posterBlob) : (typeof event.posterBlob === 'string' ? event.posterBlob : event.posterUrl)}
                            alt={event.eventName}
                            className="w-full h-full object-cover rounded-2xl shadow-md group-hover/img:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-inner">
                            <Calendar size={40} className="text-white/40" />
                        </div>
                    )}
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                                {event.eventName}
                            </h3>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                <MapPin size={12} className="text-indigo-500" />
                                {event.collegeName}
                            </p>
                        </div>

                        {/* Priority Score Bubble */}
                        <div className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-2xl shadow-lg border border-white/20",
                            getPriorityStyles(event.priorityScore)
                        )}>
                            <span className="text-[10px] font-black opacity-60 leading-none">SCORE</span>
                            <span className="text-lg font-black leading-none">{event.priorityScore}</span>
                        </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                            {event.eventType}
                        </span>
                        <span className={cn("badge", getStatusStyles(event.status))}>
                            {event.status}
                        </span>
                        {event.isOnline && (
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                REMOTE
                            </span>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                        <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                            <Clock size={14} className="text-rose-500" />
                            <span className="flex items-center gap-2">
                                Deadline: {safeFormat(event.registrationDeadline, 'MMM dd')}
                                {daysUntilDeadline >= 0 && (
                                    <span className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm",
                                        daysUntilDeadline <= 1 ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-slate-800"
                                    )}>
                                        {daysUntilDeadline}D LEFT
                                    </span>
                                )}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
                            <Calendar size={14} className="text-indigo-500" />
                            <span>{safeFormat(event.startDate, 'MMM dd')} - {safeFormat(event.endDate, 'MMM dd')}</span>
                        </div>

                        {event.prizeAmount > 0 && (
                            <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400">
                                <Trophy size={14} />
                                <span>₹{event.prizeAmount.toLocaleString()}</span>
                                <span className="opacity-40 font-bold ml-1 text-[10px]">PRIZE</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Action/Arrow */}
                <div className="hidden lg:flex flex-col justify-between items-end py-1 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                    >
                        <Share2 size={18} />
                    </button>
                    <div className="p-2 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                        <ChevronRight size={24} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default EventCard;
