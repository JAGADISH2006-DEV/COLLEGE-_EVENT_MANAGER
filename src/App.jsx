import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { db, updateAllEventStatuses } from './db';
import { useAppStore } from './store';
import { initNotificationSystem } from './notifications';

// Eagerly loaded components (needed immediately)
import Header from './components/Header';
import BottomNav from './components/BottomNav';

// Lazy loaded components (code splitting for better performance)
const Dashboard = lazy(() => import('./components/Dashboard'));
const EventList = lazy(() => import('./components/EventList'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const Analytics = lazy(() => import('./components/Analytics'));
const Discovery = lazy(() => import('./components/Discovery'));
const Settings = lazy(() => import('./components/Settings'));
const AddEventModal = lazy(() => import('./components/AddEventModal'));
const ImportCSVModal = lazy(() => import('./components/ImportCSVModal'));
const EventDetailsModal = lazy(() => import('./components/EventDetailsModal'));
const EditEventModal = lazy(() => import('./components/EditEventModal'));

// Loading fallback component
const LoadingFallback = () => (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 font-medium animate-pulse">Loading...</p>
        </div>
    </div>
);

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
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full"
    >
        {children}
    </motion.div>
);

function AnimatedRoutes() {
    const location = useLocation();

    // Optimized: Only refresh on mount, not on every navigation
    // This prevents unnecessary database queries on every page change

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense></PageWrapper>} />
                <Route path="/events" element={<PageWrapper><Suspense fallback={<LoadingFallback />}><EventList /></Suspense></PageWrapper>} />
                <Route path="/calendar" element={<PageWrapper><Suspense fallback={<LoadingFallback />}><CalendarView /></Suspense></PageWrapper>} />
                <Route path="/analytics" element={<PageWrapper><Suspense fallback={<LoadingFallback />}><Analytics /></Suspense></PageWrapper>} />
                <Route path="/api-search" element={<PageWrapper><Suspense fallback={<LoadingFallback />}><Discovery /></Suspense></PageWrapper>} />
                <Route path="/settings" element={<PageWrapper><Suspense fallback={<LoadingFallback />}><Settings /></Suspense></PageWrapper>} />
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

        // Update statuses every 6 hours instead of daily for better accuracy
        const statusUpdate = setInterval(() => {
            updateAllEventStatuses();
        }, 6 * 60 * 60 * 1000);

        return () => clearInterval(statusUpdate);
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

                    {/* Modals with Suspense */}
                    <Suspense fallback={null}>
                        <AddEventModal />
                        <ImportCSVModal />
                        <EventDetailsModal />
                        <EditEventModal />
                    </Suspense>
                </div>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
