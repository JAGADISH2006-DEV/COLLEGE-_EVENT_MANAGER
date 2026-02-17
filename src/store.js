/**
 * 🏪 ZUSTAND GLOBAL STORE
 * 
 * Think of this as the "Brain" of the application.
 * It manages the app state (theme, user identity, configurations) and 
 * ensures that when one part of the app changes, the rest stays in sync.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
    persist( // This middleware automatically saves our store to LocalStorage!
        (set, get) => ({
            // --- UI & APPEARANCE ---
            theme: 'light',
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),

            viewMode: 'cards', // Choices: 'cards', 'list', 'calendar'
            setViewMode: (mode) => set({ viewMode: mode }),

            // --- FILTERING LOGIC ---
            filters: {
                status: 'all',
                eventType: 'all',
                search: '',
                dateRange: 'all',
                prizeRange: 'all',
                showShortlisted: false,
                dateFrom: '',
                dateTo: ''
            },
            setFilters: (filters) => set((state) => ({
                filters: { ...state.filters, ...filters }
            })),
            resetFilters: () => set({
                filters: {
                    status: 'all',
                    eventType: 'all',
                    search: '',
                    dateRange: 'all',
                    prizeRange: 'all',
                    showShortlisted: false,
                    dateFrom: '',
                    dateTo: ''
                }
            }),

            // --- SORTING & SELECTION ---
            sortBy: 'priorityScore', // Choices: 'priorityScore', 'deadline', 'startDate', 'prizeAmount'
            sortOrder: 'desc',      // Choices: 'asc', 'desc'
            setSorting: (field, order) => set({ sortBy: field, sortOrder: order }),

            selectedEvent: null,    // Stores the ID of the event currently being viewed/edited
            setSelectedEvent: (id) => set({ selectedEvent: id }),

            // --- AUTH & TEAM IDENTITY ---
            // Stores the current Firebase User object
            user: JSON.parse(localStorage.getItem('reddot_user') || 'null'),
            userRole: localStorage.getItem('reddot_user_role') || null, // 'admin', 'event_manager', 'member'

            setUser: (user) => {
                if (user) {
                    localStorage.setItem('reddot_user', JSON.stringify(user));
                } else {
                    localStorage.removeItem('reddot_user');
                    localStorage.removeItem('reddot_user_role'); // Clear role on logout
                }
                set({ user, userRole: user ? get().userRole : null });
            },

            setUserRole: (role) => {
                if (role) {
                    localStorage.setItem('reddot_user_role', role);
                } else {
                    localStorage.removeItem('reddot_user_role');
                }
                set({ userRole: role });
            },

            // --- FIREBASE INFRASTRUCTURE ---
            // This is the project ID and API key the user provides in Settings
            firebaseConfig: JSON.parse(localStorage.getItem('firebase_config') || `{
                "apiKey": "AIzaSyB0aNosXLTCmX3s4M-0Doh4lRPPMX2TRmU",
                "authDomain": "eventmasterapp-2693e.firebaseapp.com",
                "projectId": "eventmasterapp-2693e",
                "storageBucket": "eventmasterapp-2693e.firebasestorage.app",
                "messagingSenderId": "854191003395",
                "appId": "1:854191003395:web:a878d82ba5c3b369437b36"
            }`),
            setFirebaseConfig: (config) => {
                localStorage.setItem('firebase_config', JSON.stringify(config));
                set({ firebaseConfig: config });
            },

            // Keeps track of whether we are syncing with Firebase or just working locally
            cloudProvider: localStorage.getItem('cloud_provider') || 'firestore',
            setCloudProvider: (provider) => {
                localStorage.setItem('cloud_provider', provider);
                set({ cloudProvider: provider });
            },

            // --- MODAL CONTROLLERS ---
            modals: {
                addEvent: false,
                editEvent: false,
                importCSV: false,
                eventDetails: false,
                settings: false
            },
            openModal: (modalName) => set((state) => ({
                modals: { ...state.modals, [modalName]: true }
            })),
            closeModal: (modalName) => set((state) => ({
                modals: { ...state.modals, [modalName]: false }
            })),

            // --- PREFERENCES ---
            preferences: {
                notificationsEnabled: true,
                autoSync: true,
                compactView: false,
                isDeleteLocked: false,
                pinnedEvents: [],
                expandedCards: true
            },
            updatePreferences: (prefs) => set((state) => ({
                preferences: { ...state.preferences, ...prefs }
            })),

            togglePinnedEvent: (id) => set((state) => {
                const pinned = state.preferences.pinnedEvents || [];
                const newPinned = pinned.includes(id)
                    ? pinned.filter(p => p !== id)
                    : [...pinned, id];
                return { preferences: { ...state.preferences, pinnedEvents: newPinned } };
            }),
        }),
        {
            // The unique name of our storage in the browser's local memory
            name: 'colleage-event-manager-storage',
            // We only persist these specific fields (we don't want to persist everything)
            partialize: (state) => ({
                theme: state.theme,
                preferences: state.preferences,
                firebaseConfig: state.firebaseConfig,
                cloudProvider: state.cloudProvider,
                sortBy: state.sortBy,
                sortOrder: state.sortOrder,
                filters: state.filters,
                viewMode: state.viewMode,
            })
        }
    )
);
