import React from 'react';
import { useAppStore } from '../store';
import { db, exportEventsToCSV } from '../db';
import { exportToCSV, downloadCSV } from '../csvUtils';
import { getGoogleScriptUrl, setGoogleScriptUrl, syncFromSheet, syncToSheet, pingCloud, openTestUrl } from '../services/googleSheets';
import { requestNotificationPermission } from '../notifications';
import { Bell, Download, Trash2, Moon, Sun, Shield, Database, Smartphone, Activity, AlertCircle, CheckCircle2, Cloud, Loader2, Wifi, WifiOff, ArrowDownToLine, ArrowUpFromLine, Info, ExternalLink } from 'lucide-react';
import { cn } from '../utils';

const Settings = () => {
    const theme = useAppStore((state) => state.theme);
    const toggleTheme = useAppStore((state) => state.toggleTheme);
    const preferences = useAppStore((state) => state.preferences);
    const updatePreferences = useAppStore((state) => state.updatePreferences);
    const setGoogleSheetUrlStore = useAppStore((state) => state.setGoogleSheetUrl);

    const [scriptUrl, setScriptUrlState] = React.useState(getGoogleScriptUrl());
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [syncAction, setSyncAction] = React.useState(''); // 'pull' or 'push'
    const [connectionStatus, setConnectionStatus] = React.useState('idle'); // idle, testing, success, error
    const [statusMessage, setStatusMessage] = React.useState('');
    const [urlError, setUrlError] = React.useState('');

    // Validate URL as user types
    const handleUrlChange = (value) => {
        setScriptUrlState(value);
        setUrlError('');
        setConnectionStatus('idle');

        if (value && value.trim()) {
            if (!value.includes('script.google.com')) {
                setUrlError('URL must be from script.google.com');
            } else if (value.trim().endsWith('/dev')) {
                setUrlError('⚠️ Wrong URL! This is a /dev URL. You need the /exec URL from Deploy → Manage Deployments.');
            } else if (!value.trim().endsWith('/exec')) {
                setUrlError('URL should end with /exec');
            }
        }
    };

    const handleSaveScriptUrl = async () => {
        try {
            setGoogleScriptUrl(scriptUrl);
            setGoogleSheetUrlStore(scriptUrl);
            setUrlError('');
            // Immediately test the connection
            await handleTestConnection();
        } catch (e) {
            setUrlError(e.message);
            setConnectionStatus('error');
            setStatusMessage(e.message);
        }
    };

    const handleTestConnection = async () => {
        setConnectionStatus('testing');
        setStatusMessage('Connecting to Google Cloud...');

        try {
            const result = await pingCloud();
            if (result.success) {
                setConnectionStatus('success');
                setStatusMessage(result.message || 'Connected successfully!');
            } else {
                setConnectionStatus('error');
                setStatusMessage(result.error || 'Connection failed.');
                console.error('[Settings] Connection test failed:', result);
            }
        } catch (e) {
            setConnectionStatus('error');
            setStatusMessage('Connection error: ' + e.message);
        }
    };

    const handleSyncFromCloud = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        setSyncAction('pull');

        try {
            const result = await syncFromSheet();
            if (result.success) {
                if (result.imported === 0 && result.updated === 0 && result.message) {
                    alert(`⚠️ Pull Complete but no events imported.\n\n${result.message}`);
                } else {
                    alert(`✅ Pull Complete!\n\nNew Events Added: ${result.imported}\nExisting Updated: ${result.updated}\nTotal from Cloud: ${result.total}`);
                }
                if (result.imported > 0 || result.updated > 0) {
                    window.location.reload();
                }
            } else {
                alert('❌ Pull Failed:\n\n' + result.error);
                // Auto-diagnose
                handleTestConnection();
            }
        } catch (e) {
            alert('❌ Pull Error:\n\n' + e.message);
        } finally {
            setIsSyncing(false);
            setSyncAction('');
        }
    };

    const handleSyncToCloud = async () => {
        if (isSyncing) return;
        if (!confirm('This will REPLACE all data in the Google Sheet with your local data.\n\nContinue?')) return;

        setIsSyncing(true);
        setSyncAction('push');

        try {
            const result = await syncToSheet();
            if (result.success) {
                alert(`✅ Push Complete!\n\n${result.count} events uploaded to Google Sheet.`);
            } else {
                alert('❌ Push Failed:\n\n' + result.error);
                handleTestConnection();
            }
        } catch (e) {
            alert('❌ Push Error:\n\n' + e.message);
        } finally {
            setIsSyncing(false);
            setSyncAction('');
        }
    };

    const handleExport = async () => {
        try {
            const events = await exportEventsToCSV();
            const csv = exportToCSV(events);
            downloadCSV(csv, `events-export-${new Date().toISOString().split('T')[0]}.csv`);
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed: ' + error.message);
        }
    };

    const handleClearAll = async () => {
        if (confirm('⚠️ DELETE ALL LOCAL EVENTS?\n\nThis cannot be undone! Make sure you have a backup.\n\nType YES to confirm.')) {
            try {
                await db.events.clear();
                alert('All local events deleted.');
                window.location.reload();
            } catch (error) {
                console.error('Clear error:', error);
                alert('Failed to clear: ' + error.message);
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

    const StatusIcon = () => {
        if (connectionStatus === 'testing') return <Loader2 size={18} className="animate-spin text-indigo-500" />;
        if (connectionStatus === 'success') return <Wifi size={18} className="text-emerald-500" />;
        if (connectionStatus === 'error') return <WifiOff size={18} className="text-rose-500" />;
        return null;
    };

    return (
        <div className="pb-20 max-w-4xl mx-auto">
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    System <span className="text-indigo-600">Settings</span>
                </h1>
                <p className="text-slate-500 font-medium">Configure your workspace and cloud synchronization.</p>
            </div>

            {/* ====== CLOUD SYNC SECTION ====== */}
            <SettingSection
                title="Google Cloud Sync"
                description="Connect your Google Sheet for team collaboration"
                icon={Cloud}
            >
                <div className="space-y-6">
                    {/* URL Input */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block mb-3">
                            Apps Script URL
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="url"
                                value={scriptUrl}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                className={cn(
                                    "input flex-1 font-mono text-xs py-3",
                                    urlError && "border-rose-400 dark:border-rose-500 focus:ring-rose-500/50"
                                )}
                                placeholder="https://script.google.com/macros/s/.../exec"
                            />
                            <button
                                onClick={handleSaveScriptUrl}
                                disabled={!!urlError || !scriptUrl.trim()}
                                className={cn(
                                    "btn px-8 font-black",
                                    urlError || !scriptUrl.trim()
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                        : "btn-primary"
                                )}
                            >
                                Save & Test
                            </button>
                        </div>

                        {/* URL validation error */}
                        {urlError && (
                            <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2">
                                <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-pre-line">{urlError}</p>
                            </div>
                        )}

                        {/* Connection status */}
                        {connectionStatus !== 'idle' && !urlError && (
                            <div className={cn(
                                "mt-4 p-4 rounded-xl border flex items-start gap-3",
                                connectionStatus === 'testing' && "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/20",
                                connectionStatus === 'success' && "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20",
                                connectionStatus === 'error' && "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20"
                            )}>
                                <StatusIcon />
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-wider mb-1",
                                        connectionStatus === 'testing' && "text-indigo-400",
                                        connectionStatus === 'success' && "text-emerald-500",
                                        connectionStatus === 'error' && "text-rose-400"
                                    )}>
                                        {connectionStatus === 'testing' ? 'Testing...' : connectionStatus === 'success' ? 'Connected' : 'Connection Failed'}
                                    </p>
                                    <p className={cn(
                                        "text-xs font-bold whitespace-pre-line",
                                        connectionStatus === 'testing' && "text-indigo-600 dark:text-indigo-400",
                                        connectionStatus === 'success' && "text-emerald-700 dark:text-emerald-400",
                                        connectionStatus === 'error' && "text-rose-700 dark:text-rose-400"
                                    )}>
                                        {statusMessage}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Test in Browser button - shown when network is blocked */}
                        {connectionStatus === 'error' && scriptUrl.trim() && (
                            <div className="mt-3 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={openTestUrl}
                                    className="btn bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-6 py-2.5 text-xs font-black gap-2 flex-1 transition-all"
                                >
                                    <ExternalLink size={16} />
                                    Test URL in Browser
                                </button>
                                <button
                                    onClick={handleTestConnection}
                                    className="btn bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-6 py-2.5 text-xs font-black gap-2 flex-1 transition-all"
                                >
                                    <Activity size={16} />
                                    Retry Connection
                                </button>
                            </div>
                        )}

                        {connectionStatus === 'error' && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
                                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-2">💡 Troubleshooting</p>
                                <ul className="text-[11px] text-amber-700 dark:text-amber-400 font-medium space-y-1 list-disc list-inside">
                                    <li>Click "Test URL in Browser" — if you see JSON data, your script works fine</li>
                                    <li><strong>Edge users</strong>: Go to Settings → Privacy → Tracking Prevention → set to <strong>"Basic"</strong></li>
                                    <li><strong>Brave users</strong>: Click the lion icon → turn Shields OFF for this site</li>
                                    <li>Disable any AdBlock extensions for localhost</li>
                                    <li>Make sure script is deployed with "Who has access" = <strong>"Anyone"</strong></li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Sync Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleSyncFromCloud}
                            disabled={isSyncing || !scriptUrl.trim() || !!urlError}
                            className={cn(
                                "btn h-14 font-black text-sm gap-3 transition-all",
                                isSyncing || !scriptUrl.trim() || urlError
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-sm active:scale-95"
                            )}
                        >
                            {isSyncing && syncAction === 'pull' ? (
                                <Loader2 size={20} className="animate-spin text-indigo-500" />
                            ) : (
                                <ArrowDownToLine size={20} className="text-indigo-600" />
                            )}
                            {isSyncing && syncAction === 'pull' ? 'Pulling...' : 'Pull from Cloud'}
                        </button>

                        <button
                            onClick={handleSyncToCloud}
                            disabled={isSyncing || !scriptUrl.trim() || !!urlError}
                            className={cn(
                                "btn h-14 font-black text-sm gap-3 transition-all",
                                isSyncing || !scriptUrl.trim() || urlError
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 active:scale-95"
                            )}
                        >
                            {isSyncing && syncAction === 'push' ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <ArrowUpFromLine size={20} />
                            )}
                            {isSyncing && syncAction === 'push' ? 'Pushing...' : 'Push to Cloud'}
                        </button>
                    </div>

                    {/* Setup Guide */}
                    <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Info size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Quick Setup Guide</span>
                        </div>
                        <ol className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium space-y-1.5 list-decimal list-inside">
                            <li>Open a Google Sheet → Extensions → Apps Script</li>
                            <li>Paste the code from <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-indigo-600 font-bold">GOOGLE_SHEETS_SETUP.js</code></li>
                            <li>Click Deploy → New Deployment → Web App</li>
                            <li>Set "Execute as" → <strong>Me</strong></li>
                            <li>Set "Who has access" → <strong className="text-rose-600">Anyone</strong> (NOT "Anyone with Google Account")</li>
                            <li>Copy the URL (must end with <code className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-emerald-600 font-bold">/exec</code>)</li>
                            <li>Paste it above and click Save & Test</li>
                        </ol>
                    </div>
                </div>
            </SettingSection>

            {/* ====== APPEARANCE ====== */}
            <SettingSection
                title="Visual Interface"
                description="Theme and display preferences"
                icon={Smartphone}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white">Color Mode</p>
                        <p className="text-sm text-slate-500">Switch between light and dark themes</p>
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

            {/* ====== NOTIFICATIONS ====== */}
            <SettingSection
                title="Alert System"
                description="Deadline reminders and notifications"
                icon={Bell}
            >
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">Push Notifications</p>
                            <p className="text-sm text-slate-500">Get alerts for upcoming deadlines</p>
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
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Deadline Reminder Days</label>
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
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Event Lead Time (Days)</label>
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

            {/* ====== DATA MANAGEMENT ====== */}
            <SettingSection
                title="Data Management"
                description="Export, import, and maintenance tools"
                icon={Database}
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm">
                                <Download size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">Export CSV</p>
                                <p className="text-xs text-slate-500">Download all events as a spreadsheet</p>
                            </div>
                        </div>
                        <button onClick={handleExport} className="btn btn-secondary px-6">
                            Export
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-600 shadow-sm">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-rose-600">Delete All Data</p>
                                <p className="text-xs text-slate-500">Permanently remove all local events</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearAll}
                            className="bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            Delete All
                        </button>
                    </div>
                </div>
            </SettingSection>

            {/* ====== PRIVACY ====== */}
            <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent shadow-none">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <Shield size={32} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Privacy First</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed font-medium">
                        All data is stored locally using <strong>IndexedDB</strong>.
                        Cloud sync only happens when you explicitly click Pull or Push.
                        No tracking, no analytics, no third-party services.
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60">
                        <span>Version 2.0</span>
                        <span>Engine: Dexie.js</span>
                        <span>Sync: Google Apps Script</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
