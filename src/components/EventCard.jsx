import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { Calendar, MapPin, Trophy, Clock, ExternalLink, ChevronRight, Share2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn, resolveImageUrl } from '../utils';

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

const PosterImage = ({ event }) => {
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

    if (!imgSrc) {
        return (
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-inner group-hover/img:scale-105 transition-transform duration-500">
                <div className="flex flex-col items-center gap-2 opacity-40">
                    <Calendar size={40} className="text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">No Poster</span>
                </div>
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={event.eventName}
            className="w-full h-full object-cover rounded-2xl shadow-md group-hover/img:scale-105 transition-transform duration-500"
            onError={(e) => {
                console.warn(`[Poster Error] Failed to load image: ${imgSrc}`);
                setImgSrc(null);
            }}
        />
    );
};

const EventCard = React.memo(({ event }) => {
    const setSelectedEvent = useAppStore((state) => state.setSelectedEvent);
    const openModal = useAppStore((state) => state.openModal);

    const handleClick = (e) => {
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
            'Won': 'badge-won',
            'Blocked': 'badge-blocked'
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
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className="group relative glass-card p-4 sm:p-5 cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
        >
            {/* Priority Indicator Line */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all group-hover:w-1.5",
                event.priorityScore >= 70 ? "bg-rose-500" : event.priorityScore >= 40 ? "bg-amber-500" : "bg-indigo-500"
            )} />

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Poster Thumbnail */}
                <div className="flex-shrink-0 w-full sm:w-28 h-40 sm:h-36 relative group/img">
                    <PosterImage event={event} />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10" />

                    {/* Mobile Priority Score Overlay */}
                    <div className={cn(
                        "absolute top-2 right-2 sm:hidden flex items-center justify-center w-10 h-10 rounded-xl shadow-lg border border-white/20 backdrop-blur-md",
                        getPriorityStyles(event.priorityScore)
                    )}>
                        <span className="text-sm font-black text-white">{event.priorityScore}</span>
                    </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">
                                {event.eventName}
                            </h3>
                            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                <MapPin size={12} className="text-indigo-500 opacity-70" />
                                {event.collegeName}
                            </p>
                        </div>

                        {/* Desktop Priority Score */}
                        <div className={cn(
                            "hidden sm:flex flex-col items-center justify-center w-12 h-12 rounded-2xl shadow-lg border border-white/20",
                            getPriorityStyles(event.priorityScore)
                        )}>
                            <span className="text-[10px] font-black opacity-60 leading-none">SCORE</span>
                            <span className="text-lg font-black leading-none">{event.priorityScore}</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100 dark:border-indigo-500/20">
                            {event.eventType}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border", getStatusStyles(event.status))}>
                            {event.status}
                        </span>
                        {event.isOnline && (
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-emerald-100 dark:border-emerald-500/20">
                                REMOTE
                            </span>
                        )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[11px] sm:text-sm">
                        <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                            <Clock size={14} className="text-rose-500" />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="opacity-70 sm:opacity-100">Deadline:</span>
                                <span>{safeFormat(event.registrationDeadline, 'MMM dd')}</span>
                                {daysUntilDeadline >= 0 && daysUntilDeadline <= 7 && (
                                    <span className={cn(
                                        "text-[9px] font-black px-1.5 py-0.5 rounded-md self-start sm:self-auto",
                                        daysUntilDeadline <= 1 ? "bg-rose-600 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    )}>
                                        {daysUntilDeadline}D
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                            <Calendar size={14} className="text-indigo-500" />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                                <span className="opacity-70 sm:opacity-100">Starts:</span>
                                <span>{safeFormat(event.startDate, 'MMM dd')}</span>
                            </div>
                        </div>

                        {event.prizeAmount > 0 && (
                            <div className="col-span-2 sm:col-span-1 pt-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                    <Trophy size={14} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase opacity-60 leading-none mb-0.5">Grand Prize</span>
                                    <span className="text-sm font-black tracking-tight">₹{event.prizeAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tablet/Desktop Arrow */}
                <div className="hidden sm:flex items-center justify-center shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 group-hover:translate-x-1 transition-all">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});


export default EventCard;
