import React from 'react';
import { useAppStore } from '../store';
import { db, exportEventsToCSV } from '../db';
import { exportToCSV, downloadCSV } from '../csvUtils';
import { getGoogleScriptUrl, setGoogleScriptUrl, syncFromSheet, syncToSheet } from '../services/googleSheets';
import { requestNotificationPermission } from '../notifications';
import { Bell, Download, Trash2, Moon, Sun, Shield, Database, Smartphone, RefreshCw } from 'lucide-react';
import { cn } from '../utils';

const Settings = () => {
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const preferences = useAppStore((state) => state.preferences);
    const updatePreferences = useAppStore((state) => state.updatePreferences);
    const [scriptUrl, setScriptUrlState] = React.useState(getGoogleScriptUrl());
    const [isSyncing, setIsSyncing] = React.useState(false);

    const handleSaveScriptUrl = () => {
        try {
            setGoogleScriptUrl(scriptUrl);
            alert('Cloud Database URL Saved!');
        } catch (e) {
            alert(e.message);
        }
    };

    const handleSyncFromValues = async () => {
        setIsSyncing(true);
        try {
            const result = await syncFromSheet();
            if (result.success) {
                alert(`Sync Complete!\nAdded: ${result.imported}\nUpdated: ${result.updated}`);
                window.location.reload();
            } else {
                alert('Sync Failed: ' + result.error);
            }
        } catch (e) {
            alert('Sync Error: ' + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncToValues = async () => {
        if (!confirm('This will overwrite the Google Sheet with local data. Continue?')) return;
        setIsSyncing(true);
        try {
            const result = await syncToSheet();
            if (result.success) {
                alert(`Upload Complete!\nEvents Synced: ${result.count}`);
            } else {
                alert('Upload Failed: ' + result.error);
            }
        } catch (e) {
            alert('Upload Error: ' + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleExport = async () => {
        try {
            const events = await exportEventsToCSV();
            const csv = exportToCSV(events);
            downloadCSV(csv, `events-export-${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    const handleClearAll = async () => {
        if (confirm('Are you sure you want to delete ALL events? This cannot be undone!')) {
            try {
                await db.events.clear();
            } catch (error) {
                console.error('Clear error:', error);
            }
        }
    };

    const handleNotificationToggle = async (enabled) => {
        if (enabled) {
            const granted = await requestNotificationPermission();
            if (granted) {
                updatePreferences({ notificationsEnabled: true });
            }
        } else {
            updatePreferences({ notificationsEnabled: false });
        }
    };

    const SettingSection = ({ title, description, children, icon: Icon }) => (
        <div className="glass-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 mb-6">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                    <Icon size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500 font-medium">{description}</p>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    return (
        <div className="pb-20">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                    System <span className="text-indigo-600">Settings</span>
                </h1>
                <p className="text-slate-500 font-medium">Configure your workspace and manage your local data</p>
            </div>

            {/* Appearance */}
            <SettingSection
                title="Visual Interface"
                description="Customization and theme preferences"
                icon={Smartphone}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Color Mode</p>
                        <p className="text-sm text-slate-500">Switch between light and dark aesthetics</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="btn btn-secondary flex items-center gap-3 px-6"
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon size={18} className="text-indigo-600" />
                                <span className="font-bold">Dark Mode</span>
                            </>
                        ) : (
                            <>
                                <Sun size={18} className="text-amber-500" />
                                <span className="font-bold">Light Mode</span>
                            </>
                        )}
                    </button>
                </div>
            </SettingSection>

            {/* Notifications */}
            <SettingSection
                title="Alert System"
                description="Stay updated with deadlines and reminders"
                icon={Bell}
            >
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Push Notifications</p>
                            <p className="text-sm text-slate-500">Receive system-level alerts even when offline</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.notificationsEnabled}
                                onChange={(e) => handleNotificationToggle(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 shadow-inner" />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Deadline Thresholds</label>
                            <input
                                type="text"
                                value={preferences.deadlineReminderDays.join(', ')}
                                onChange={(e) => {
                                    const days = e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
                                    updatePreferences({ deadlineReminderDays: days });
                                }}
                                className="input font-bold"
                                placeholder="7, 3, 1, 0"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event Lead Time</label>
                            <input
                                type="text"
                                value={preferences.eventReminderDays.join(', ')}
                                onChange={(e) => {
                                    const days = e.target.value.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
                                    updatePreferences({ eventReminderDays: days });
                                }}
                                className="input font-bold"
                                placeholder="1"
                            />
                        </div>
                    </div>
                </div>
            </SettingSection>

            {/* Google Sheets Sync */}
            {/* Google Sheets Sync */}
            <SettingSection
                title="Google Cloud Database"
                description="Connect your Google Sheet for real-time team sync"
                icon={RefreshCw}
            >
                <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <label className="text-xs font-black uppercase tracking-widest text-indigo-600 block mb-3">Google Apps Script URL</label>
                        <div className="flex gap-3 mb-4">
                            <input
                                type="url"
                                value={scriptUrl}
                                onChange={(e) => setScriptUrlState(e.target.value)}
                                className="input flex-1 font-mono text-xs"
                                placeholder="https://script.google.com/macros/s/.../exec"
                            />
                            <button
                                onClick={handleSaveScriptUrl}
                                className="btn bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 font-bold"
                            >
                                Save
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSyncFromValues}
                                disabled={isSyncing}
                                className={cn(
                                    "btn flex-1 py-3 font-bold flex items-center justify-center gap-2",
                                    isSyncing ? "opacity-50" : "bg-emerald-600 text-white hover:bg-emerald-700"
                                )}
                            >
                                <Download size={18} />
                                {isSyncing ? 'Syncing...' : 'Pull from Cloud'}
                            </button>
                            <button
                                onClick={handleSyncToValues}
                                disabled={isSyncing}
                                className={cn(
                                    "btn flex-1 py-3 font-bold flex items-center justify-center gap-2",
                                    isSyncing ? "opacity-50" : "bg-indigo-600 text-white hover:bg-indigo-700"
                                )}
                            >
                                <Database size={18} />
                                {isSyncing ? 'Syncing...' : 'Push to Cloud'}
                            </button>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs rounded-lg border border-amber-100 dark:border-amber-800/50">
                            <strong>Setup Info:</strong> Deploy the provided GAS script as a Web App to get the URL.
                            Ensure "Who has access" is set to "Anyone".
                        </div>
                    </div>
                </div>
            </SettingSection>

            {/* Data Management */}
            <SettingSection
                title="Data Integrity"
                description="Export and maintenance tools"
                icon={Database}
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm">
                                <Download size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">Cloud Export</p>
                                <p className="text-xs text-slate-500">Backup your local events to CSV</p>
                            </div>
                        </div>
                        <button
                            onClick={handleExport}
                            className="btn btn-primary px-6"
                        >
                            Export Everything
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-600 shadow-sm">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-rose-600">Nuclear Option</p>
                                <p className="text-xs text-slate-500">Wipe all local records permanently</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearAll}
                            className="btn bg-rose-600 text-white hover:bg-rose-700 px-6 font-bold"
                        >
                            Purge Database
                        </button>
                    </div>
                </div>
            </SettingSection>

            {/* Security/Info */}
            <div className="glass-card p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Shield size={40} />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Local-First Privacy</h3>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                        Your data never leaves this device unless you explicitly export it.
                        We use <span className="font-bold text-indigo-600">IndexedDB</span> for high-performance offline storage.
                    </p>
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Version 1.2.4</span>
                        <span>Build: 2024-Q1</span>
                        <span>Status: Stable</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
