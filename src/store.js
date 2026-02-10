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
            googleSheetUrl: '',
            setGoogleSheetUrl: (url) => set({ googleSheetUrl: url }),
            syncFromGoogleSheet: async () => {
                const url = get().googleSheetUrl;
                if (!url) return;

                set({ isSyncing: true });
                try {
                    const sheetIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
                    if (!sheetIdMatch) throw new Error('Invalid Google Sheet URL');

                    const sheetId = sheetIdMatch[1];
                    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

                    const response = await fetch(csvUrl);
                    const csvText = await response.text();

                    const { parseCSVFile, autoDetectMapping, transformRow } = await import('./csvUtils');

                    // Parse with PapaParse via the utility
                    const blob = new Blob([csvText], { type: 'text/csv' });
                    const results = await parseCSVFile(blob);

                    if (!results.data || results.data.length === 0) {
                        throw new Error('No data found in Google Sheet');
                    }

                    const headers = Object.keys(results.data[0]);
                    const columnMapping = autoDetectMapping(headers);
                    const newEvents = results.data.map(row => transformRow(row, columnMapping));

                    const { bulkImportEvents } = await import('./db');
                    const results_import = await bulkImportEvents(newEvents);

                    set({ lastSyncTime: new Date(), isSyncing: false });

                    get().addNotification({
                        title: 'Sync Successful',
                        message: `Added ${results_import.added} new and updated ${results_import.updated} events from Google Sheets.`,
                        type: 'success'
                    });

                    return results_import;
                } catch (err) {
                    console.error('Google Sheet Sync Error:', err);
                    set({ isSyncing: false });
                    throw err;
                }
            }
        }),
        {
            name: 'event-manager-storage',
            partialize: (state) => ({
                theme: state.theme,
                preferences: state.preferences,
                lastSyncTime: state.lastSyncTime,
                googleSheetUrl: state.googleSheetUrl
            })
        }
    )
);
