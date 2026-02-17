import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { logoutUser } from '../services/firebase';
import { Moon, Sun, Plus, LogOut, Settings as SettingsIcon, User } from 'lucide-react';

const Header = () => {
    const location = useLocation();
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const openModal = useAppStore((state) => state.openModal);
    const user = useAppStore((state) => state.user);
    const cloudProvider = useAppStore((state) => state.cloudProvider);
    const userRole = useAppStore((state) => state.userRole);
    const canAdd = userRole === 'admin' || userRole === 'event_manager';

    const setUser = useAppStore((state) => state.setUser);

    const handleLogout = async () => {
        try {
            if (cloudProvider === 'firestore') {
                await logoutUser();
            }
            setUser(null);
            window.location.reload();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const navItems = [
        { path: '/', label: 'Dashboard' },
        { path: '/events', label: 'Events' },
        { path: '/discovery', label: 'Discovery' },
        { path: '/calendar', label: 'Calendar' },
        { path: '/analytics', label: 'Analytics' }
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 shadow-sm px-safe">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                <span className="text-white font-black text-xs uppercase tracking-tighter">JD</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">
                                    Event <span className="text-indigo-600">Manager</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Team Edition</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {canAdd && (
                            <button
                                onClick={() => openModal('addEvent')}
                                className="btn btn-primary h-10 sm:h-auto px-3 sm:px-5"
                                title="Add Event"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Add Event</span>
                            </button>
                        )}

                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            {cloudProvider === 'firestore' ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Firebase Live</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Local DB Mode</span>
                                </>
                            )}
                        </div>

                        {user && (
                            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                                <button
                                    onClick={handleLogout}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-500 hover:text-rose-600 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut size={18} />
                                </button>
                                <Link
                                    to="/settings"
                                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform overflow-hidden"
                                >
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};


export default Header;
