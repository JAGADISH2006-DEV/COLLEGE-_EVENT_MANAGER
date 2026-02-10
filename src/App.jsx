import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { db, updateAllEventStatuses } from './db';
import { useAppStore } from './store';
import { initNotificationSystem } from './notifications';

// Components
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EventList from './components/EventList';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import Discovery from './components/Discovery';
import Settings from './components/Settings';
import AddEventModal from './components/AddEventModal';
import ImportCSVModal from './components/ImportCSVModal';
import EventDetailsModal from './components/EventDetailsModal';
import BottomNav from './components/BottomNav';

// System Recovery & Error Boundary
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("CRITICAL_SYSTEM_ERROR:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md glass-card p-10 border-rose-100 border-2">
                        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🚨</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">System Interrupted</h1>
                        <p className="text-slate-500 font-medium mb-8">
                            A neural link error occurred. The application state might be out of sync.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full btn btn-primary py-3"
                            >
                                Reboot System
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.href = '/';
                                }}
                                className="w-full px-4 py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            >
                                Force Reset All Data
                            </button>
                        </div>
                        <pre className="mt-8 p-4 bg-slate-900 text-rose-400 text-[10px] text-left rounded-lg overflow-auto max-h-32">
                            {this.state.error?.toString()}
                        </pre>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const PageWrapper = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full"
    >
        {children}
    </motion.div>
);

function AnimatedRoutes() {
    const location = useLocation();

    // Auto-refresh data on navigation
    useEffect(() => {
        updateAllEventStatuses().catch(err => console.error('Auto-refresh error:', err));
    }, [location.pathname]);

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/events" element={<PageWrapper><EventList /></PageWrapper>} />
                <Route path="/calendar" element={<PageWrapper><CalendarView /></PageWrapper>} />
                <Route path="/analytics" element={<PageWrapper><Analytics /></PageWrapper>} />
                <Route path="/api-search" element={<PageWrapper><Discovery /></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    const theme = useAppStore((state) => state.theme);
    const [isLoading, setIsLoading] = useState(true);

    // Apply theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Initialize app
    useEffect(() => {
        const init = async () => {
            try {
                // Update event statuses
                await updateAllEventStatuses();
                // Initialize notifications
                await initNotificationSystem();
                setIsLoading(false);
            } catch (error) {
                console.error('App initialization error:', error);
                setIsLoading(false);
            }
        };

        init();

        // Update statuses daily
        const dailyUpdate = setInterval(() => {
            updateAllEventStatuses();
        }, 24 * 60 * 60 * 1000);

        return () => clearInterval(dailyUpdate);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4 shadow-lg shadow-indigo-500/20"
                    />
                    <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Initializing Event Manager...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Router>
                <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-500 pb-20 md:pb-0">
                    <Header />

                    <main className="container mx-auto px-4 py-6 max-w-7xl">
                        <AnimatedRoutes />
                    </main>

                    <BottomNav />

                    {/* RedDot Watermark */}
                    <div className="reddot-watermark">
                        <div className="reddot-dot" />
                        REDDOT
                    </div>

                    {/* Modals */}
                    <AddEventModal />
                    <ImportCSVModal />
                    <EventDetailsModal />
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
