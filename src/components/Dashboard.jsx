import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import EventCard from './EventCard';
import { TrendingUp, Calendar, Clock, Trophy, Plus, FileUp, Settings as SettingsIcon } from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';
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
        const deadlineToday = events.filter(e => {
            const d = new Date(e.registrationDeadline);
            return !isNaN(d.getTime()) && isToday(d) && e.status === 'Open';
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
            deadlineToday: deadlineToday.length,
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

    const deadlineTodayEvents = useMemo(() => {
        if (!events) return [];
        return events.filter(e => e.status === 'Deadline Today');
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                        Dashboard <span className="text-indigo-600">Overview</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {deadlineTodayEvents.length > 0
                            ? `Attention: You have ${deadlineTodayEvents.length} deadlines today!`
                            : "Manage your deadlines and events efficiently."}
                    </p>
                </motion.div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openModal('importCSV')}
                        className="btn btn-secondary px-4 py-2 text-sm font-bold"
                    >
                        <FileUp size={18} />
                        Import CSV
                    </button>
                    <button
                        onClick={() => openModal('addEvent')}
                        className="btn btn-primary px-4 py-2 text-sm font-bold"
                    >
                        <Plus size={18} />
                        Add Event
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
                    title="Deadlines Today"
                    value={stats?.deadlineToday || 0}
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
                    <div className="glass-card overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/20">
                            <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                                <Clock size={20} />
                                Critical Deadlines
                            </h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {deadlineTodayEvents.length > 0 ? (
                                deadlineTodayEvents.map(event => (
                                    <div key={event.id} className="flex flex-col gap-1 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-rose-100 dark:border-rose-950">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{event.eventName}</span>
                                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{event.collegeName}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                                    No deadlines for today. Relax! 🧘‍♂️
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

