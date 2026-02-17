/**
 * 🚀 MAIN APPLICATION ENTRY POINT
 * 
 * This file orchestrates the entire application:
 * 1. Routing (Pages)
 * 2. Theme Management (Light/Dark)
 * 3. Firebase Initialization & Real-time Sync
 * 4. Background Maintenance (Notifications & Status checks)
 */

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { db, updateAllEventStatuses } from './db';
import { useAppStore } from './store';
import { initNotificationSystem } from './notifications';
import { initFirebase, subscribeToEvents } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- EAGERLY LOADED COMPONENTS (Essential for fast first paint) ---
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import SplashScreen from './components/SplashScreen'; // Added Splash Screen

// --- LAZY LOADED COMPONENTS (Loaded only when needed to save bandwidth) ---
const Dashboard = lazy(() => import('./components/Dashboard'));
const EventList = lazy(() => import('./components/EventList'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const Analytics = lazy(() => import('./components/Analytics'));
const Settings = lazy(() => import('./components/Settings'));
const Discovery = lazy(() => import('./components/Discovery'));
const AddEventModal = lazy(() => import('./components/AddEventModal'));
const ImportCSVModal = lazy(() => import('./components/ImportCSVModal'));
const EventDetailsModal = lazy(() => import('./components/EventDetailsModal'));
const EditEventModal = lazy(() => import('./components/EditEventModal'));

/**
 * 🔄 Animated Routes Container
 * Handles page transitions with Framer Motion.
 */
function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Suspense fallback={null}><Dashboard /></Suspense>} />
                <Route path="/events" element={<Suspense fallback={null}><EventList /></Suspense>} />
                <Route path="/calendar" element={<Suspense fallback={null}><CalendarView /></Suspense>} />
                <Route path="/analytics" element={<Suspense fallback={null}><Analytics /></Suspense>} />
                <Route path="/settings" element={<Suspense fallback={null}><Settings /></Suspense>} />
                <Route path="/discovery" element={<Suspense fallback={null}><Discovery /></Suspense>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    // Hooks to access the Store (Global State)
    const theme = useAppStore((state) => state.theme);
    const user = useAppStore((state) => state.user);
    const setUser = useAppStore((state) => state.setUser);
    const firebaseConfig = useAppStore((state) => state.firebaseConfig);
    const cloudProvider = useAppStore((state) => state.cloudProvider);

    // Local loading states
    const [isLoading, setIsLoading] = useState(true);
    const [showSplash, setShowSplash] = useState(true); // Control Splash Visibility

    /**
     * EFFECT: Apply Theme
     * Runs whenever the user toggles Light/Dark mode.
     */
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    /**
     * EFFECT: Initialize Firebase & Real-time Sync
     * This is the "Engine Room" of the application connectivity.
     */
    useEffect(() => {
        // Step 1: Initialize Firebase with the saved config
        const firebaseData = initFirebase(firebaseConfig);

        // Step 2: Listen for User Login / Logout changes
        const unsubscribeAuth = firebaseData ? onAuthStateChanged(firebaseData.auth, (firebaseUser) => {
            setUser(firebaseUser); // Sync user status to the store
            setIsLoading(false);
        }) : (() => {
            setIsLoading(false);
            return () => { };
        })();

        // Step 3: Start Real-time Sync if user is logged in
        let unsubscribeSync = null;
        if (cloudProvider === 'firestore' && firebaseData) {
            // Subscribe to cloud changes
            unsubscribeSync = subscribeToEvents(async (remoteEvents) => {
                const { bulkImportEvents } = await import('./db');
                // When cloud data changes, update our local browser database
                // We use overwrite: true to ensure orphaned Google Sheets data is removed
                await bulkImportEvents(remoteEvents, true);
            });
        }

        // Cleanup function (runs when app unmounts)
        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeSync) unsubscribeSync();
        };
    }, [firebaseConfig, cloudProvider, setUser]);

    /**
     * EFFECT: System Maintenance
     * Runs periodic tasks like status updates and notification checks.
     */
    useEffect(() => {
        updateAllEventStatuses(); // Initial calculation
        initNotificationSystem(); // Setup reminders

        // Every 6 hours, update statuses again (in case user left the app open)
        const interval = setInterval(updateAllEventStatuses, 6 * 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Splash Screen Overlay (High Z-Index) */}
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

            {/* Main Application (Rendered beneath splash if ready, or hidden) */}
            {!isLoading && user ? (
                <Router>
                    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-500 pb-20 md:pb-0">
                        {/* Fixed Header */}
                        <div className="sticky top-0 z-[60]">
                            <Header />
                        </div>

                        {/* Mobile Bottom Navigation */}
                        <BottomNav />

                        {/* Shared Modals (Universal accessible from state) */}
                        <Suspense fallback={null}>
                            <AddEventModal />
                            <ImportCSVModal />
                            <EventDetailsModal />
                            <EditEventModal />
                        </Suspense>

                        {/* Main Content Area */}
                        <main className="container mx-auto px-4 py-6 max-w-7xl">
                            <AnimatedRoutes />
                        </main>
                    </div>
                </Router>
            ) : (
                // Show Login if not loading and no user
                !isLoading && !user ? <Login /> : null
            )}
        </>
    );
}

export default App;
