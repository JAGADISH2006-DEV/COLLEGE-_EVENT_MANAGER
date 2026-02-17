import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart3, List, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-lg pb-safe overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between min-w-full h-12 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-center gap-2 px-4 h-full transition-all relative ${isActive
                                ? 'text-indigo-600 dark:text-indigo-400 font-black'
                                : 'text-slate-500 dark:text-slate-400 font-bold'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'scale-110' : 'opacity-70'} />
                            <span className="text-[11px] uppercase tracking-wider">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabMobile"
                                    className="absolute bottom-0 left-2 right-2 h-1 bg-indigo-600 rounded-t-full shadow-[0_-4px_10px_rgba(79,70,229,0.4)]"
                                    initial={false}
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
