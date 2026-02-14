// Zustand Store for Global State Management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
    persist(
        (set, get) => ({
            // Theme
            theme: 'light',
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'light' ? 'dark' : 'light'
            })),

            // View Mode
            viewMode: 'cards', // 'cards', 'list', 'calendar'
            setViewMode: (mode) => set({ viewMode: mode }),

            // Filters
            filters: {
                status: 'all',
                eventType: 'all',
                search: '',
                dateRange: 'all' // 'all', 'today', 'week', 'month'
            },
            setFilters: (filters) => set((state) => ({
                filters: { ...state.filters, ...filters }
            })),
            resetFilters: () => set({
                filters: {
                    status: 'all',
                    eventType: 'all',
                    search: '',
                    dateRange: 'all'
                }
            }),

            // Sort
            sortBy: 'priorityScore', // 'priorityScore', 'deadline', 'startDate', 'prizeAmount'
            sortOrder: 'desc',
            setSorting: (sortBy, sortOrder) => set({ sortBy, sortOrder }),

            // Selected Event
            selectedEventId: null,
            setSelectedEvent: (id) => set({ selectedEventId: id }),

            // Notifications
            notifications: [],
            addNotification: (notification) => set((state) => ({
                notifications: [...state.notifications, {
                    id: Date.now(),
                    timestamp: new Date(),
                    ...notification
                }]
            })),
            removeNotification: (id) => set((state) => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),
            clearNotifications: () => set({ notifications: [] }),

            // User Preferences
            preferences: {
                notificationsEnabled: true,
                deadlineReminderDays: [7, 3, 1, 0], // Days before deadline
                eventReminderDays: [1], // Days before event
                autoSync: false,
                compactView: false,
                isDeleteLocked: true // Only user can delete after unlocking
            },
            updatePreferences: (prefs) => set((state) => ({
                preferences: { ...state.preferences, ...prefs }
            })),

            // Sync Status
            lastSyncTime: null,
            isSyncing: false,
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
            setIsSyncing: (syncing) => set({ isSyncing: syncing }),

            // Modal States
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
            closeAllModals: () => set({
                modals: {
                    addEvent: false,
                    editEvent: false,
                    importCSV: false,
                    eventDetails: false,
                    settings: false
                }
            }),

            // Google Sheets Integration
            googleSheetUrl: localStorage.getItem('google_script_url') || '',
            setGoogleSheetUrl: (url) => {
                localStorage.setItem('google_script_url', url);
                set({ googleSheetUrl: url });
            }
        }),
        {
            name: 'event-manager-storage',
            partialize: (state) => ({
                theme: state.theme,
                preferences: state.preferences,
                lastSyncTime: state.lastSyncTime
            })
        }
    )
);
