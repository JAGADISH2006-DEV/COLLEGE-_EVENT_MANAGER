import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';
import { useAppStore } from '../store';
import EventCard from './EventCard';
import { TrendingUp, Calendar, Clock, Trophy, Plus, FileUp, Zap, Sparkles, Shield, Bell, Target, ArrowRight } from 'lucide-react';
import { format, isToday, isThisWeek, differenceInDays, startOfDay } from 'date-fns';
import { cn } from '../utils';

const StatCard = ({ title, value, icon: Icon, color, delay, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', damping: 20 }}
        className="relative group h-full"
    >
        <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:shadow-[0_24px_50px_-12px_rgba(79,70,229,0.15)] transition-all duration-500" />
        <div className="relative p-4 sm:p-6 h-full flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-[2rem]">
            <div className={cn("absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-all duration-700 group-hover:scale-150 group-hover:opacity-20", color)} />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color.replace('bg-', 'bg-').replace('500', '50').replace('text-', 'text-'))}>
                    <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <TrendingUp size={10} />
                        {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">{title}</h3>
                <p className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
            </div>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const events = useLiveQuery(() => db.events.toArray(), []);
    const openModal = useAppStore((state) => state.openModal);
    const user = useAppStore((state) => state.user);
    const userRole = useAppStore((state) => state.userRole);
    const canManage = userRole === 'admin' || userRole === 'event_manager';

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
        const totalPrize = upcoming
            .reduce((sum, e) => sum + (parseFloat(e.prizeAmount) || 0), 0);

        return {
            upcoming: upcoming.length,
            upcomingDeadlines: upcomingDeadlines.length,
            thisWeek: thisWeek.length,
            totalPrize
        };
    }, [events]);

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
                const isOpen = e.status === 'Open' || e.status === 'Deadline Today';
                return daysLeft >= 0 && daysLeft <= 7 && isOpen;
            })
            .sort((a, b) => new Date(a.registrationDeadline) - new Date(b.registrationDeadline));
    }, [events]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    if (!events) return (
        <div className="py-12 px-4 max-w-7xl mx-auto space-y-12 animate-pulse">
            <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] w-full mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />)}
            </div>
        </div>
    );

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="pb-28 pt-4 sm:pt-8"
        >
            {/* Command Central Header */}
            <div className="relative mb-8 sm:mb-16 overflow-hidden bg-slate-900 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 md:p-12 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.5)] group">
                {/* Background FX */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full -translate-x-1/4 translate-y-1/4" />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-10">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-3 sm:mb-6"
                        >
                            <Target size={12} className="text-indigo-400" />
                            Command Center
                        </motion.div>
                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tighter leading-none">
                            Hello, <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{(user?.displayName || 'Operator').split(' ')[0]}</span>
                        </h1>
                        <p className="text-sm sm:text-lg text-slate-400 font-medium max-w-xl leading-relaxed">
                            {criticalDeadlines.length > 0
                                ? `You have ${criticalDeadlines.length} events with deadlines approaching this week.`
                                : "Your event tracker is up to date. No urgent deadlines at the moment."}
                        </p>
                    </div>



                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {canManage && (
                            <>
                                <button
                                    onClick={() => openModal('addEvent')}
                                    className="px-5 sm:px-8 h-12 sm:h-16 bg-white text-slate-900 rounded-2xl sm:rounded-[1.5rem] font-black text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 sm:gap-3 group/btn overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                                    <Plus size={20} strokeWidth={3} />
                                    <span className="hidden sm:inline">Add New</span> Event
                                </button>
                                <button
                                    onClick={() => openModal('importCSV')}
                                    className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md text-white rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center hover:bg-white/20 transition-all border border-white/20 shadow-xl group/import"
                                    title="Inject Data Packet (CSV)"
                                >
                                    <FileUp className="group-hover/import:-translate-y-1 transition-transform" size={22} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="mt-6 sm:mt-12 pt-4 sm:pt-8 border-t border-white/10 flex flex-wrap items-center gap-4 sm:gap-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                        <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-wider sm:tracking-widest">Sync: Live</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Zap size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sync Latency: 4ms</span>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Time: {format(new Date(), 'HH:mm:ss')}</span>
                    </div>
                </div>
            </div>

            {/* Matrix Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 mb-10 sm:mb-20">
                <StatCard title="Upcoming Events" value={stats?.upcoming || 0} icon={Calendar} color="bg-indigo-500" delay={0.3} trend="+4%" />
                <StatCard title="Deadlines Today" value={stats?.upcomingDeadlines || 0} icon={Bell} color="bg-rose-500" delay={0.4} />
                <StatCard title="Events This Week" value={stats?.thisWeek || 0} icon={Target} color="bg-emerald-500" delay={0.5} trend="New" />
                <StatCard title="Total Prize Pool" value={`₹${((stats?.totalPrize || 0) / 1000).toFixed(0)}K`} icon={Trophy} color="bg-amber-500" delay={0.6} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12">
                {/* Left: Tactical Queue */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Priority <span className="text-indigo-600">Events</span></h2>
                        </div>
                        <button className="text-xs font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center gap-2 group">
                            View All Events
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {highPriorityEvents.length > 0 ? (
                            highPriorityEvents.map((event, idx) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                >
                                    <EventCard event={event} />
                                </motion.div>
                            ))
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 sm:p-20 text-center">
                                <Shield size={48} className="mx-auto text-slate-200 mb-6" />
                                <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest leading-none mb-2">No Priority Events</h3>
                                <p className="text-slate-400 text-xs font-bold">Scanning for new opportunities...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Intelligence Briefing */}
                <div className="lg:col-span-4 space-y-10">
                    {/* Critical Alert Module */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-rose-500 rounded-[2.5rem] blur-[30px] opacity-10 group-hover:opacity-20 transition-opacity" />
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] border border-rose-500/20 overflow-hidden shadow-2xl">
                            <div className="p-5 sm:p-8 pb-4">
                                <div className="flex items-center justify-between mb-4 sm:mb-8">
                                    <h3 className="text-xl font-black text-rose-600 flex items-center gap-3">
                                        <Clock size={24} strokeWidth={3} className="animate-pulse" />
                                        CRITICAL
                                    </h3>
                                    <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-200">
                                        {criticalDeadlines.length} ALERT(S)
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {criticalDeadlines.slice(0, 4).map((event, idx) => {
                                            const days = differenceInDays(startOfDay(new Date(event.registrationDeadline)), startOfDay(new Date()));
                                            return (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.8 + idx * 0.1 }}
                                                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:scale-[1.02] transition-transform cursor-pointer"
                                                >
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm border shadow-sm",
                                                        days === 0 ? "bg-rose-600 text-white border-rose-600" : "bg-white dark:bg-slate-900 text-rose-500 border-rose-100"
                                                    )}>
                                                        {days === 0 ? '!' : days}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-wider">{event.eventName}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 truncate uppercase mt-0.5">{event.collegeName}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="p-5 sm:p-8 pt-4 sm:pt-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all">
                                    Analyze Risk Profiles
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Integrity Module */}
                    <div className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                            <Shield size={120} />
                        </div>
                        <h3 className="text-xl font-black mb-8 relative z-10 flex items-center gap-3">
                            <Sparkles size={20} className="text-indigo-400" />
                            Grid Integrity
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Core Synchronization</span>
                                    <span className="text-indigo-400">98.4%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '98.4%' }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Active Nodes</span>
                                    <span className="text-xl font-black">{events.length}</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">XP Gathered</span>
                                    <span className="text-xl font-black text-amber-500">12.4K</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Stats Grid End */}
            </div>
        </motion.div>
    );
};

export default Dashboard;
