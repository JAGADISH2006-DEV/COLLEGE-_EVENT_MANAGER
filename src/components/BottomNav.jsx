import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart3, List, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/events', icon: List, label: 'Events' },
        { path: '/discovery', icon: Zap, label: 'Find' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/analytics', icon: BarChart3, label: 'Stats' }
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        >
            <div className="flex items-stretch justify-around w-full h-16 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 relative transition-colors",
                                isActive
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-400 dark:text-slate-500 active:text-slate-600'
                            )}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform", isActive && "scale-110")} />
                            <span className={cn(
                                "text-[10px] tracking-wide leading-none mt-0.5",
                                isActive ? "font-black" : "font-bold"
                            )}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabMobile"
                                    className="absolute -top-0.5 left-3 right-3 h-[3px] bg-indigo-600 rounded-full shadow-[0_2px_8px_rgba(79,70,229,0.5)]"
                                    initial={false}
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
