import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db, EventType, EventStatus, exportEventsToCSV } from '../db';
import { useAppStore } from '../store';
import EventCard from './EventCard';
import { Search, Filter, SortDesc, SlidersHorizontal, ArrowUpDown, Table as TableIcon, LayoutGrid, FileSpreadsheet, ChevronRight, MapPin, Calendar, Clock, Trophy, Zap, ArrowUp } from 'lucide-react';
import { cn } from '../utils';
import { format } from 'date-fns';
import { exportToCSV, downloadCSV } from '../csvUtils';

// Safe Date Formatter
const safeFormat = (date, formatStr) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'TBD';
        return format(d, formatStr);
    } catch (e) {
        return 'TBD';
    }
};

const TableView = React.memo(({ events }) => {
    const setSelectedEvent = useAppStore((state) => state.setSelectedEvent);
    const openModal = useAppStore((state) => state.openModal);

    const handleRowClick = useCallback((id) => {
        setSelectedEvent(id);
        openModal('eventDetails');
    }, [setSelectedEvent, openModal]);

    return (
        <div className="glass-card overflow-hidden overflow-x-auto border-0 ring-1 ring-slate-100 dark:ring-slate-800">
            <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Event Name</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">College</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Type</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Deadline</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-center">Score</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Prize</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr
                            key={event.id}
                            onClick={() => handleRowClick(event.id)}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer group"
                        >
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{event.eventName}</div>
                                <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                    <MapPin size={10} /> {event.location || 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">{event.collegeName}</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    {event.eventType}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {safeFormat(event.registrationDeadline, 'MMM dd, yyyy')}
                                </div>
                                <div className={cn(
                                    "text-[10px] font-bold mt-1",
                                    (event.status || '').toLowerCase().includes('today') ? "text-rose-500 animate-pulse" : "text-slate-400"
                                )}>
                                    {event.status || 'Pending'}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={cn(
                                    "inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-sm",
                                    event.priorityScore >= 70 ? "bg-rose-100 text-rose-600" : event.priorityScore >= 40 ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                )}>
                                    {event.priorityScore}
                                </span>
                            </td>
                            <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">
                                {event.prizeAmount > 0 ? `₹${event.prizeAmount.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-2 text-slate-300 group-hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-xl transition-all">
                                    <ChevronRight size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

const EventList = () => {
    const filters = useAppStore((state) => state.filters);
    const setFilters = useAppStore((state) => state.setFilters);
    const sortBy = useAppStore((state) => state.sortBy);
    const sortOrder = useAppStore((state) => state.sortOrder);
    const setSorting = useAppStore((state) => state.setSorting);
    const viewMode = useAppStore((state) => state.viewMode);
    const setViewMode = useAppStore((state) => state.setViewMode);

    // Scroll to Top state
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const events = useLiveQuery(() => db.events.toArray(), []);

    const handleExcelExport = async () => {
        try {
            const data = await exportEventsToCSV();
            const csv = exportToCSV(data);
            downloadCSV(csv, `event-manager-excel-${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    // Filter and sort events
    const filteredEvents = useMemo(() => {
        try {
            if (!events || !Array.isArray(events)) return [];
            const safeFilters = filters || { status: 'all', eventType: 'all', search: '', dateRange: 'all' };
            let filtered = [...events];

            if (safeFilters.status && safeFilters.status !== 'all') {
                filtered = filtered.filter(e => e.status === safeFilters.status);
            }
            if (safeFilters.eventType && safeFilters.eventType !== 'all') {
                filtered = filtered.filter(e => e.eventType === safeFilters.eventType);
            }
            if (safeFilters.search) {
                const query = safeFilters.search.toLowerCase();
                filtered = filtered.filter(e =>
                    (e.eventName || '').toLowerCase().includes(query) ||
                    (e.collegeName || '').toLowerCase().includes(query) ||
                    (e.location || '').toLowerCase().includes(query)
                );
            }
            if (safeFilters.dateRange && safeFilters.dateRange !== 'all') {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                filtered = filtered.filter(e => {
                    const startDate = new Date(e.startDate);
                    if (isNaN(startDate.getTime())) return filters.dateRange === 'all';
                    const diff = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
                    switch (filters.dateRange) {
                        case 'today': return diff === 0;
                        case 'week': return diff >= 0 && diff <= 7;
                        case 'month': return diff >= 0 && diff <= 30;
                        default: return true;
                    }
                });
            }

            filtered.sort((a, b) => {
                let comparison = 0;
                switch (sortBy) {
                    case 'priorityScore': comparison = b.priorityScore - a.priorityScore; break;
                    case 'deadline': {
                        const da = new Date(a.registrationDeadline).getTime();
                        const dbTicks = new Date(b.registrationDeadline).getTime();
                        comparison = (isNaN(da) ? 0 : da) - (isNaN(dbTicks) ? 0 : dbTicks);
                        break;
                    }
                    case 'startDate': {
                        const sa = new Date(a.startDate).getTime();
                        const sbTicks = new Date(b.startDate).getTime();
                        comparison = (isNaN(sa) ? 0 : sa) - (isNaN(sbTicks) ? 0 : sbTicks);
                        break;
                    }
                    case 'prizeAmount': comparison = (b.prizeAmount || 0) - (a.prizeAmount || 0); break;
                    default: comparison = 0;
                }
                return sortOrder === 'asc' ? -comparison : comparison;
            });

            return filtered;
        } catch (err) {
            console.error("FILTER_ENGINE_FAIL:", err);
            return events || [];
        }
    }, [events, filters, sortBy, sortOrder]);

    if (!events) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-500 font-bold animate-pulse">Accessing Encrypted Event Database...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Event <span className="text-indigo-600">Inventory</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Manage and filter your tracked events efficiently.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExcelExport}
                        className="btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <FileSpreadsheet size={18} />
                        Export Excel
                    </button>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner ring-1 ring-slate-200 dark:ring-slate-700">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'cards' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-400"
                            )}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'table' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-slate-400"
                            )}
                        >
                            <TableIcon size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="glass-card p-6 mb-8 border-0 ring-1 ring-slate-100 dark:ring-slate-800 shadow-xl shadow-indigo-500/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative group lg:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Omnibus search..."
                            value={filters.search}
                            onChange={(e) => setFilters({ search: e.target.value })}
                            className="input pl-11 !py-3 font-semibold"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ status: e.target.value })}
                            className="input appearance-none cursor-pointer !py-3 font-semibold"
                        >
                            <option value="all">Status: All</option>
                            {Object.values(EventStatus).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Filter size={14} />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <select
                            value={filters.eventType}
                            onChange={(e) => setFilters({ eventType: e.target.value })}
                            className="input appearance-none cursor-pointer !py-3 font-semibold"
                        >
                            <option value="all">Category: All</option>
                            {Object.values(EventType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <SlidersHorizontal size={14} />
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="relative">
                        <select
                            value={filters.dateRange}
                            onChange={(e) => setFilters({ dateRange: e.target.value })}
                            className="input appearance-none cursor-pointer !py-3 font-semibold"
                        >
                            <option value="all">Timeline: All</option>
                            <option value="today">Today</option>
                            <option value="week">Coming Week</option>
                            <option value="month">Coming Month</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <Clock size={14} />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort Matrix</span>
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                            {['priorityScore', 'deadline', 'startDate', 'prizeAmount'].map((field) => (
                                <button
                                    key={field}
                                    onClick={() => setSorting(field, sortOrder)}
                                    className={cn(
                                        "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        sortBy === field
                                            ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-md"
                                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    )}
                                >
                                    {field.replace(/([A-Z])/g, ' $1').trim()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                        >
                            <ArrowUpDown size={16} />
                        </button>
                        <button
                            onClick={() => setFilters({ search: '', status: 'all', eventType: 'all', dateRange: 'all' })}
                            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            Reset System
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Display */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 font-black text-[10px]">{filteredEvents.length}</span>
                    Matches Identified
                </div>
            </div>

            <AnimatePresence mode="wait">
                {filteredEvents.length > 0 ? (
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                    >
                        {viewMode === 'table' ? (
                            <TableView events={filteredEvents} />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                                {filteredEvents.map((event, idx) => (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                    >
                                        <EventCard event={event} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card p-20 text-center border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50"
                    >
                        {events.length === 0 ? (
                            <>
                                <Zap size={48} className="mx-auto text-indigo-500 mb-4 animate-bounce" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Database is Empty</h3>
                                <p className="text-slate-500 font-medium">Your event collection is currently void. Start adding events to track them!</p>
                                <button
                                    onClick={() => useAppStore.getState().openModal('addEvent')}
                                    className="mt-8 btn btn-primary mx-auto"
                                >
                                    Add Your First Event
                                </button>
                            </>
                        ) : (
                            <>
                                <SlidersHorizontal size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Zero Results Found</h3>
                                <p className="text-slate-500 font-medium">No records match your current filter parameters.</p>
                                <button
                                    onClick={() => setFilters({ search: '', status: 'all', eventType: 'all', dateRange: 'all' })}
                                    className="mt-8 btn btn-primary mx-auto"
                                >
                                    Reset Data Pipeline
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scroll To Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={scrollToTop}
                        className="fixed bottom-24 md:bottom-8 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-500/30 z-40 hover:bg-indigo-700 transition-all hover:scale-110"
                        title="Scroll to Top"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventList;
