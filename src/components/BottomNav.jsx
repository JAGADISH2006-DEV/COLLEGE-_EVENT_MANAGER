import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart3, List, Zap } from 'lucide-react';

const BottomNav = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/events', icon: List, label: 'Events' },
        { path: '/api-search', icon: Zap, label: 'Find' },
        { path: '/calendar', icon: Calendar, label: 'Calendar' },
        { path: '/analytics', icon: BarChart3, label: 'Stats' }
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            <Icon size={24} />
                            <span className="text-xs mt-1">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
