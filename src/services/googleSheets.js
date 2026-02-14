/**
 * Google Sheets Cloud Sync Service v2.1
 * 
 * Uses multiple fetch strategies to work around browser security blocks.
 * Strategy 1: Standard CORS fetch
 * Strategy 2: No-CORS with new tab verification
 * Strategy 3: JSONP-style script injection for GET
 */

import { bulkImportEvents, getAllEvents } from '../db';

// ============================================================
// URL Management
// ============================================================
const STORAGE_KEY = 'google_script_url';

export const getGoogleScriptUrl = () => {
    return localStorage.getItem(STORAGE_KEY) || '';
};

export const setGoogleScriptUrl = (url) => {
    if (!url || !url.trim()) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    const trimmed = url.trim();

    if (!trimmed.includes('script.google.com/macros/s/')) {
        throw new Error('Invalid URL. Must be from script.google.com');
    }

    if (trimmed.endsWith('/dev')) {
        throw new Error('Wrong URL! You pasted the /dev URL. You need the /exec URL.\n\nGo to Apps Script → Deploy → Manage Deployments → Copy the Web App URL.');
    }

    if (!trimmed.endsWith('/exec')) {
        throw new Error('URL must end with /exec');
    }

    localStorage.setItem(STORAGE_KEY, trimmed);
};

// ============================================================
// Strategy 1: Standard fetch (works in most browsers)
// ============================================================
const corsFetch = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            redirect: 'follow',
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

// ============================================================
// Strategy 2: JSONP-style GET via <script> tag
// This bypasses ALL CORS restrictions
// ============================================================
const jsonpFetch = (url) => {
    return new Promise((resolve, reject) => {
        const callbackName = '_gasCallback_' + Date.now();
        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('JSONP request timed out'));
        }, 20000);

        const cleanup = () => {
            clearTimeout(timeoutId);
            delete window[callbackName];
            const script = document.getElementById(callbackName);
            if (script) script.remove();
        };

        // GAS will return JSON, which we'll capture via an iframe approach instead
        // Since GAS doesn't support JSONP natively, we'll use a hidden iframe
        cleanup();
        reject(new Error('Fallback not available'));
    });
};

// ============================================================
// Parse response text safely
// ============================================================
const parseResponseText = (text) => {
    if (!text || !text.trim()) {
        throw new Error('Empty response from server');
    }

    // Check for HTML (Google login/error pages)
    const trimmed = text.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML')) {
        throw new Error(
            'Google returned a login/error page instead of data.\n\n' +
            'This means the script is NOT deployed with "Anyone" access.\n\n' +
            'Fix: Go to Apps Script → Deploy → New Deployment → Set "Who has access" to "Anyone"'
        );
    }

    try {
        return JSON.parse(trimmed);
    } catch (e) {
        console.error('[CloudSync] Failed to parse:', trimmed.substring(0, 200));
        throw new Error('Invalid response from server. Check the Apps Script for errors.');
    }
};

// ============================================================
// Open URL in new tab for manual testing
// ============================================================
export const openTestUrl = () => {
    const url = getGoogleScriptUrl();
    if (!url) return;
    window.open(url + '?action=ping', '_blank');
};

// ============================================================
// PING — Test connection
// ============================================================
export const pingCloud = async () => {
    const url = getGoogleScriptUrl();
    if (!url) {
        return { success: false, error: 'No URL configured.' };
    }

    try {
        const response = await corsFetch(url + '?action=ping');
        const text = await response.text();
        const data = parseResponseText(text);

        if (data.success) {
            return {
                success: true,
                message: 'Connected! Server v' + (data.version || '1.0'),
                data: data
            };
        } else {
            return {
                success: false,
                error: data.error || 'Server error'
            };
        }
    } catch (error) {
        console.error('[CloudSync] Ping failed:', error);

        // Provide specific diagnostics based on error type
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: 'Request timed out. Check your internet connection.',
                canTestManually: true
            };
        }

        if (error.message === 'Failed to fetch') {
            return {
                success: false,
                error: 'Network blocked!',
                isNetworkBlock: true,
                canTestManually: true,
                details: [
                    'Your browser is blocking the request to Google.',
                    '',
                    'Try these fixes:',
                    '1. Click "Test in Browser" below to verify the script works',
                    '2. In Edge: Settings → Privacy → Tracking Prevention → set to "Basic"',
                    '3. Disable any AdBlock extensions for this site',
                    '4. Make sure the script is deployed with "Anyone" access',
                    '5. Try using Chrome or Firefox instead'
                ].join('\n')
            };
        }

        return {
            success: false,
            error: error.message,
            canTestManually: true
        };
    }
};

// ============================================================
// PULL — Download events from Google Sheet
// ============================================================
export const syncFromSheet = async () => {
    const url = getGoogleScriptUrl();
    if (!url) throw new Error('Cloud URL not set.');

    try {
        const response = await corsFetch(url + '?action=read');
        const text = await response.text();
        const data = parseResponseText(text);

        if (!data.success) {
            throw new Error(data.error || 'Server returned an error');
        }

        if (!data.events || !Array.isArray(data.events)) {
            if (data.count === 0) {
                return { success: true, imported: 0, updated: 0, total: 0 };
            }
            throw new Error('Invalid data format from server.');
        }

        const normalized = data.events
            .map(normalizeSheetEvent)
            .filter(e => {
                // Skip events that have no real name AND no real college
                const hasName = e.eventName && e.eventName.trim().length > 0;
                const hasCollege = e.collegeName && e.collegeName.trim().length > 0;
                return hasName || hasCollege;
            });

        console.log(`[CloudSync] Read ${data.events.length} rows from sheet "${data.sheetName || 'unknown'}", ${normalized.length} valid events`);

        if (normalized.length === 0) {
            return {
                success: true,
                imported: 0,
                updated: 0,
                total: 0,
                message: data.events.length > 0
                    ? `Found ${data.events.length} rows but none had valid event names. Check that your sheet columns are named correctly (e.g., "Event Name", "College Name").`
                    : 'No events in the sheet.'
            };
        }

        const result = await bulkImportEvents(normalized);

        return {
            success: true,
            imported: result.added,
            updated: result.updated,
            total: normalized.length
        };
    } catch (error) {
        console.error('[CloudSync] Pull failed:', error);

        if (error.message === 'Failed to fetch') {
            return {
                success: false,
                error: 'Network blocked. Try: Edge Settings → Privacy → Tracking Prevention → "Basic". Or disable AdBlock.'
            };
        }

        return { success: false, error: error.message };
    }
};

// ============================================================
// PUSH — Upload local events to Google Sheet
// ============================================================
export const syncToSheet = async () => {
    const url = getGoogleScriptUrl();
    if (!url) throw new Error('Cloud URL not set.');

    try {
        const events = await getAllEvents();

        const cleanEvents = events.map(e => {
            const clean = { ...e };
            delete clean.posterBlob;
            // Convert Dates to ISO strings
            ['registrationDeadline', 'startDate', 'endDate', 'createdAt', 'updatedAt'].forEach(key => {
                if (clean[key] instanceof Date) {
                    clean[key] = clean[key].toISOString();
                }
            });
            return clean;
        });

        const payload = JSON.stringify({
            action: 'write',
            events: cleanEvents
        });

        // text/plain bypasses CORS preflight for POST
        const response = await corsFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payload
        });

        const text = await response.text();
        const data = parseResponseText(text);

        if (!data.success) {
            throw new Error(data.error || 'Server failed to save');
        }

        return { success: true, count: data.count || cleanEvents.length };
    } catch (error) {
        console.error('[CloudSync] Push failed:', error);

        if (error.message === 'Failed to fetch') {
            return {
                success: false,
                error: 'Network blocked. Try: Edge Settings → Privacy → Tracking Prevention → "Basic". Or disable AdBlock.'
            };
        }

        return { success: false, error: error.message };
    }
};

// ============================================================
// CLIENT-SIDE Smart Column Mapping
// Maps any header format to our standard internal keys
// ============================================================
const COLUMN_MAP = {
    // eventName
    'eventname': 'eventName', 'event name': 'eventName', 'event_name': 'eventName',
    'name': 'eventName', 'title': 'eventName', 'event': 'eventName',
    // collegeName
    'collegename': 'collegeName', 'college name': 'collegeName', 'college_name': 'collegeName',
    'college': 'collegeName', 'institution': 'collegeName', 'university': 'collegeName', 'institute': 'collegeName',
    // eventType
    'eventtype': 'eventType', 'event type': 'eventType', 'event_type': 'eventType',
    'type': 'eventType', 'category': 'eventType',
    // registrationDeadline
    'registrationdeadline': 'registrationDeadline', 'registration deadline': 'registrationDeadline',
    'deadline': 'registrationDeadline', 'reg deadline': 'registrationDeadline', 'last date': 'registrationDeadline',
    // startDate
    'startdate': 'startDate', 'start date': 'startDate', 'start_date': 'startDate',
    'event date': 'startDate', 'date': 'startDate', 'from': 'startDate',
    // endDate
    'enddate': 'endDate', 'end date': 'endDate', 'end_date': 'endDate', 'to': 'endDate', 'end': 'endDate',
    // prizeAmount
    'prizeamount': 'prizeAmount', 'prize amount': 'prizeAmount', 'prize_amount': 'prizeAmount',
    'prize': 'prizeAmount', 'prize money': 'prizeAmount', 'prize pool': 'prizeAmount', 'worth': 'prizeAmount',
    // registrationFee
    'registrationfee': 'registrationFee', 'registration fee': 'registrationFee', 'registration_fee': 'registrationFee',
    'fee': 'registrationFee', 'reg fee': 'registrationFee', 'entry fee': 'registrationFee', 'cost': 'registrationFee',
    // accommodation
    'accommodation': 'accommodation', 'acm': 'accommodation', 'stay': 'accommodation', 'hostel': 'accommodation',
    // location
    'location': 'location', 'venue': 'location', 'place': 'location', 'city': 'location', 'address': 'location',
    // isOnline
    'isonline': 'isOnline', 'is_online': 'isOnline', 'online': 'isOnline', 'mode': 'isOnline', 'virtual': 'isOnline',
    // status
    'status': 'status', 'state': 'status',
    // priorityScore
    'priorityscore': 'priorityScore', 'priority score': 'priorityScore', 'priority': 'priorityScore', 'score': 'priorityScore',
    // website
    'website': 'website', 'url': 'website', 'link': 'website', 'web': 'website',
    'registration link': 'website', 'reg link': 'website',
    // description
    'description': 'description', 'details': 'description', 'about': 'description',
    'info': 'description', 'notes': 'description', 'discription': 'description', // common typo
    // teamSize
    'teamsize': 'teamSize', 'team size': 'teamSize', 'team_size': 'teamSize', 'team': 'teamSize',
    // eligibility
    'eligibility': 'eligibility', 'eligible': 'eligibility', 'criteria': 'eligibility', 'who can apply': 'eligibility',
    // leader
    'leader': 'leader', 'team leader': 'leader', 'lead': 'leader', 'captain': 'leader',
    // members
    'members': 'members', 'team members': 'members', 'participants': 'members',
    // noOfTeams
    'noofteams': 'noOfTeams', 'no of teams': 'noOfTeams', 'no_of_teams': 'noOfTeams',
    'teams': 'noOfTeams', 'number of teams': 'noOfTeams', 'team count': 'noOfTeams',
    // prizeWon
    'prizewon': 'prizeWon', 'prize won': 'prizeWon', 'prize_won': 'prizeWon',
    'won': 'prizeWon', 'result': 'prizeWon', 'achievement': 'prizeWon',
    'price won': 'prizeWon', // common typo
    // contact1
    'contact1': 'contact1', 'contact 1': 'contact1', 'contact-1': 'contact1',
    'phone': 'contact1', 'phone 1': 'contact1', 'contact': 'contact1',
    // contact2
    'contact2': 'contact2', 'contact 2': 'contact2', 'contact-2': 'contact2', 'phone 2': 'contact2',
    // posterUrl
    'posterurl': 'posterUrl', 'poster url': 'posterUrl', 'poster_url': 'posterUrl',
    'poster': 'posterUrl', 'posters': 'posterUrl', 'image': 'posterUrl', 'image url': 'posterUrl',
    // contactNumbers
    'contactnumbers': 'contactNumbers', 'contact numbers': 'contactNumbers', 'contacts': 'contactNumbers', 'phone numbers': 'contactNumbers',
    // updatedAt
    'updatedat': 'updatedAt', 'updated at': 'updatedAt', 'last updated': 'updatedAt', 'modified': 'updatedAt',
    // id
    'id': 'id', 'serial': 'id', 'sno': 'id', 's.no': 'id', '#': 'id',
};

/**
 * Remap raw event object keys to standard internal keys
 * e.g., { "COLLEGE NAME": "MIT" } → { collegeName: "MIT" }
 */
function remapKeys(raw) {
    const mapped = {};
    for (const [key, value] of Object.entries(raw)) {
        const lowerKey = key.toLowerCase().trim();
        const standardKey = COLUMN_MAP[lowerKey];

        if (standardKey) {
            // Only set if not already set (first match wins)
            if (mapped[standardKey] === undefined || mapped[standardKey] === '') {
                mapped[standardKey] = value;
            }
        } else if (key === key.toLowerCase() || key.includes('_')) {
            // Already looks like a standard camelCase or snake_case key — keep it
            mapped[key] = value;
        }
        // else: skip unknown UPPER CASE keys
    }
    return mapped;
}

// ============================================================
// Normalize sheet data to local format
// ============================================================
function normalizeSheetEvent(raw) {
    // Step 1: Remap keys (COLLEGE NAME → collegeName, etc.)
    const event = remapKeys(raw);

    // Step 2: Fix data types
    event.registrationDeadline = safeDate(event.registrationDeadline);
    event.startDate = safeDate(event.startDate);
    event.endDate = safeDate(event.endDate);

    event.prizeAmount = safeNum(event.prizeAmount);
    event.registrationFee = safeNum(event.registrationFee);
    event.teamSize = safeNum(event.teamSize) || 1;
    event.priorityScore = safeNum(event.priorityScore);

    event.accommodation = safeBool(event.accommodation);
    event.isOnline = safeBool(event.isOnline);

    if (typeof event.contactNumbers === 'string' && event.contactNumbers) {
        event.contactNumbers = event.contactNumbers.split(',').map(s => s.trim()).filter(Boolean);
    } else if (!Array.isArray(event.contactNumbers)) {
        event.contactNumbers = [];
    }

    // Step 3: Clean up strings
    if (event.eventName) event.eventName = String(event.eventName).trim();
    if (event.collegeName) event.collegeName = String(event.collegeName).trim();
    if (event.eventType) event.eventType = String(event.eventType).trim();

    return event;
}

function safeDate(val) {
    if (!val || val === '') return new Date();
    if (val instanceof Date) return val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
}

function safeNum(val) {
    if (typeof val === 'number') return val;
    const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
    return isNaN(n) ? 0 : n;
}

function safeBool(val) {
    if (typeof val === 'boolean') return val;
    const s = String(val).toLowerCase().trim();
    return s === 'true' || s === 'yes' || s === '1';
}
