import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import EventCard from './EventCard';
import { TrendingUp, Calendar, Clock, Trophy, Plus, FileUp, Settings as SettingsIcon } from 'lucide-react';
import { format, isToday, isThisWeek, differenceInDays, startOfDay } from 'date-fns';
import { cn } from '../utils';

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="glass-card p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform"
    >
        <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-125", color)} />
        <div className="flex items-center justify-between mb-4 relative z-10">
            <div className={cn("p-3 rounded-2xl bg-opacity-10 dark:bg-opacity-20", color)}>
                <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
            </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </motion.div>
);

const Dashboard = () => {
    const events = useLiveQuery(() => db.events.toArray(), []);
    const openModal = useAppStore((state) => state.openModal);

    // Calculate statistics
    const stats = useMemo(() => {
        if (!events) return null;
        const now = new Date();
        const upcoming = events.filter(e => {
            const d = new Date(e.startDate);
            return !isNaN(d.getTime()) && d > now;
        });
        const upcomingDeadlines = events.filter(e => {
            const d = new Date(e.registrationDeadline);
            const today = startOfDay(new Date());
            const daysLeft = differenceInDays(startOfDay(d), today);
            return !isNaN(d.getTime()) && daysLeft >= 0 && daysLeft <= 3 && (e.status === 'Open' || e.status === 'Deadline Today');
        });
        const thisWeek = events.filter(e => {
            const d = new Date(e.startDate);
            return !isNaN(d.getTime()) && isThisWeek(d) && d > now;
        });
        const totalPrize = events
            .filter(e => e.status === 'Open' || (e.status || '').includes('Today'))
            .reduce((sum, e) => sum + (parseFloat(e.prizeAmount) || 0), 0);

        return {
            upcoming: upcoming.length,
            upcomingDeadlines: upcomingDeadlines.length,
            thisWeek: thisWeek.length,
            totalPrize
        };
    }, [events]);

    // Get high priority events
    const highPriorityEvents = useMemo(() => {
        if (!events) return [];
        return events
            .filter(e => (parseFloat(e.priorityScore) || 0) >= 60 && (e.status === 'Open' || (e.status || '').includes('Today')))
            .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
            .slice(0, 5);
    }, [events]);

    const criticalDeadlines = useMemo(() => {
        if (!events) return [];
        const today = startOfDay(new Date());
        return events
            .filter(e => {
                const deadline = new Date(e.registrationDeadline);
                if (isNaN(deadline.getTime())) return false;
                const daysLeft = differenceInDays(startOfDay(deadline), today);
                // Show deadlines from today up to 7 days away
                // Only for Open or Deadline Today statuses
                const isOpen = e.status === 'Open' || e.status === 'Deadline Today';
                return daysLeft >= 0 && daysLeft <= 7 && isOpen;
            })
            .sort((a, b) => new Date(a.registrationDeadline) - new Date(b.registrationDeadline));
    }, [events]);

    if (!events) {
        return (
            <div className="space-y-8 py-8 animate-pulse">
                <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="pb-12"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sm:mb-12 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        System <span className="text-indigo-600">Overview</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                        {criticalDeadlines.length > 0
                            ? `Neural Link Active: You have ${criticalDeadlines.length} critical deadlines this week.`
                            : "All systems clear. Your event timeline is currently optimized."}
                    </p>
                </motion.div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => openModal('addEvent')}
                        className="btn btn-primary flex-1 sm:flex-none py-3"
                    >
                        <Plus size={18} />
                        <span className="font-bold">New Event</span>
                    </button>
                    <button
                        onClick={() => openModal('importCSV')}
                        className="btn btn-secondary h-12 w-12 sm:w-auto sm:px-4 p-0"
                        title="Import CSV"
                    >
                        <FileUp size={18} />
                        <span className="hidden sm:inline font-bold">Import</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard
                    title="Upcoming Events"
                    value={stats?.upcoming || 0}
                    icon={Calendar}
                    color="bg-indigo-500"
                    delay={0.1}
                />
                <StatCard
                    title="Upcoming Deadlines"
                    value={stats?.upcomingDeadlines || 0}
                    icon={Clock}
                    color="bg-rose-500"
                    delay={0.2}
                />
                <StatCard
                    title="This Week"
                    value={stats?.thisWeek || 0}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                    delay={0.3}
                />
                <StatCard
                    title="Estimated Prize"
                    value={`₹${((stats?.totalPrize || 0) / 1000).toFixed(0)}K`}
                    icon={Trophy}
                    color="bg-amber-500"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: High Priority */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            High Priority Events
                        </h2>
                    </div>

                    {highPriorityEvents.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {highPriorityEvents.map((event, idx) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                >
                                    <EventCard event={event} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-12 text-center border-dashed border-2">
                            <Calendar className="mx-auto w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                No high priority events found.
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Deadlines & Quick Info */}
                <div className="space-y-8">
                    {/* Deadline Section */}
                    <div className="glass-card overflow-hidden shadow-lg border-rose-500/10 dark:border-rose-500/20">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                                    <Clock size={20} />
                                    Critical
                                </h3>
                                <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black px-2 py-1 rounded-full border border-rose-200 dark:border-rose-800/50">
                                    {criticalDeadlines.length} ACTIVE
                                </span>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 space-y-3">
                            {criticalDeadlines.length > 0 ? (
                                criticalDeadlines.map(event => {
                                    const daysLeft = differenceInDays(startOfDay(new Date(event.registrationDeadline)), startOfDay(new Date()));
                                    return (
                                        <div key={event.id} className="relative flex flex-col gap-1 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 group hover:border-rose-500/30 transition-all shadow-sm">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">{event.eventName}</span>
                                                <span className={cn(
                                                    "text-[9px] px-2 py-1 rounded-lg font-black uppercase whitespace-nowrap",
                                                    daysLeft === 0 ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/20" : "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                                )}>
                                                    {daysLeft === 0 ? 'Today' : `${daysLeft}D Left`}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate opacity-70 italic">{event.collegeName}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                                    No pending deadlines.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats Chart mockup/simple list */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-600" />
                            System Activity
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Database Size</span>
                                <span className="font-bold text-slate-900 dark:text-white">{events.length} Events</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full w-2/3 rounded-full" />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Sync Status</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                    Online-Ready
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Dashboard;

