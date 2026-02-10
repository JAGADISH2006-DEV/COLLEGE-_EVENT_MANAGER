import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../db';
import {
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    startOfWeek,
    endOfWeek,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Trophy } from 'lucide-react';
import { cn } from '../utils';

const CalendarView = () => {
    const events = useLiveQuery(() => db.events.toArray(), []);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [direction, setDirection] = useState(0);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentDate]);

    const getEventsForDay = (day) => {
        if (!events) return [];
        return events.filter(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            const deadline = new Date(event.registrationDeadline);

            const hasStart = !isNaN(startDate.getTime());
            const hasEnd = !isNaN(endDate.getTime());
            const hasDeadline = !isNaN(deadline.getTime());

            return (
                (hasStart && isSameDay(day, startDate)) ||
                (hasEnd && isSameDay(day, endDate)) ||
                (hasDeadline && isSameDay(day, deadline)) ||
                (hasStart && hasEnd && day >= startDate && day <= endDate)
            );
        });
    };

    const previousMonth = () => {
        setDirection(-1);
        setCurrentDate(subMonths(currentDate, 1));
    };

    const nextMonth = () => {
        setDirection(1);
        setCurrentDate(addMonths(currentDate, 1));
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0
        })
    };

    return (
        <div className="pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Event <span className="text-indigo-600">Timeline</span>
                </h1>

                {/* Month Navigation */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="glass-card overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-4 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="relative overflow-hidden min-h-[600px]">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentDate.toString()}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="grid grid-cols-7"
                        >
                            {calendarDays.map((day, idx) => {
                                const dayEvents = getEventsForDay(day);
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                const today = isToday(day);

                                return (
                                    <div
                                        key={day.toString()}
                                        className={cn(
                                            "min-h-[120px] p-2 border-r border-b border-slate-100 dark:border-slate-800 transition-colors group",
                                            !isCurrentMonth && "bg-slate-50/50 dark:bg-slate-950/20",
                                            today && "bg-indigo-50/30 dark:bg-indigo-900/10"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn(
                                                "flex items-center justify-center w-7 h-7 text-xs font-bold rounded-lg transition-all",
                                                today
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                                    : isCurrentMonth
                                                        ? "text-slate-700 dark:text-slate-300 group-hover:bg-slate-100 dark:group-hover:bg-slate-800"
                                                        : "text-slate-300 dark:text-slate-700"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            {dayEvents.length > 0 && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {dayEvents.slice(0, 3).map(event => {
                                                const isDeadline = isSameDay(day, new Date(event.registrationDeadline));
                                                return (
                                                    <div
                                                        key={event.id}
                                                        className={cn(
                                                            "text-[10px] px-1.5 py-1 rounded-md font-bold truncate transition-all cursor-pointer hover:brightness-110",
                                                            isDeadline
                                                                ? "bg-rose-100/80 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                                                                : "bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30"
                                                        )}
                                                        title={`${isDeadline ? 'Deadline: ' : ''}${event.eventName}`}
                                                    >
                                                        {isDeadline && "⚠️ "}{event.eventName}
                                                    </div>
                                                );
                                            })}
                                            {dayEvents.length > 3 && (
                                                <div className="text-[10px] text-slate-400 font-bold pl-1">
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-6 px-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Period</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Deadline</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-lg bg-indigo-600" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;

