import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { Moon, Sun, Plus, Upload, Settings as SettingsIcon } from 'lucide-react';

const Header = () => {
    const location = useLocation();
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const openModal = useAppStore((state) => state.openModal);

    const navItems = [
        { path: '/', label: 'Dashboard' },
        { path: '/events', label: 'Events' },
        { path: '/api-search', label: 'Discovery' },
        { path: '/calendar', label: 'Calendar' },
        { path: '/analytics', label: 'Analytics' }
    ];

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">CE</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                                Event Manager
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${location.pathname === item.path
                                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => openModal('addEvent')}
                            className="btn btn-primary flex items-center space-x-2"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Event</span>
                        </button>

                        <button
                            onClick={() => openModal('importCSV')}
                            className="btn btn-outline flex items-center space-x-2"
                        >
                            <Upload size={18} />
                            <span className="hidden sm:inline">Import</span>
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <Link
                            to="/settings"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Settings"
                        >
                            <SettingsIcon size={20} />
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
