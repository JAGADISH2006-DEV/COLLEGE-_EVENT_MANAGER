/**
 * Google Sheets Integration Service
 * 
 * This service handles communication between the application and a Google Apps Script
 * that acts as a middleware for the Google Sheet.
 * 
 * Setup Instructions:
 * 1. Create a Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste the GAS Code (provided in GOOGLE_SHEETS_SETUP.md)
 * 4. Deploy as Web App (Anyone can access)
 * 5. Paste the Deployment URL in App Settings
 */

import { bulkImportEvents, getAllEvents } from '../db';

const STORAGE_KEY = 'google_script_url';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxIom3bOpujhk0ITh7Sq2mgN5cpPDlfb4uUmPDWA1hH5zRdU5j-kawlaxpBFzrWNm5ZQw/exec';

export const getGoogleScriptUrl = () => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_SCRIPT_URL;
};

export const setGoogleScriptUrl = (url) => {
    if (!url) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    // Basic validation
    if (!url.includes('script.google.com')) {
        throw new Error('Invalid Google Script URL');
    }
    localStorage.setItem(STORAGE_KEY, url);
};

/**
 * Fetch events from Google Sheet
 * Expects the GAS endpoint to return a JSON list of events
 */
export const syncFromSheet = async () => {
    const url = getGoogleScriptUrl();
    if (!url) {
        throw new Error('Google Script URL not configured');
    }

    try {
        const response = await fetch(`${url}?action=read`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Unknown error from Google Sheet');
        }

        if (!Array.isArray(data.events)) {
            throw new Error('Invalid data format received from Sheet');
        }

        // Import to local DB
        const result = await bulkImportEvents(data.events);
        return {
            success: true,
            imported: result.added,
            updated: result.updated,
            total: data.events.length
        };
    } catch (error) {
        console.error('Sheet Sync Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Push local events to Google Sheet
 * Sends all local events to overwrite/update the Sheet
 */
export const syncToSheet = async () => {
    const url = getGoogleScriptUrl();
    if (!url) {
        throw new Error('Google Script URL not configured');
    }

    try {
        const events = await getAllEvents();

        // Transform events for sheet (flatten dates, etc if needed)
        // The GAS script should handle basic JSON parsing

        // We use POST with no-cors if simple, but GAS usually requires
        // text/plain payload to avoid CORS preflight complex issues or 
        // the user must handle CORS in GAS.
        // Best reliable way for GAS Web App is often POST with text/plain body.

        const payload = JSON.stringify({
            action: 'write',
            events: events
        });

        const response = await fetch(url, {
            method: 'POST',
            body: payload
        });

        // Opaque response in no-cors, but if we do standard cors:
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to save to Sheet');
        }

        return { success: true, count: events.length };
    } catch (error) {
        console.error('Sheet Push Error:', error);
        return { success: false, error: error.message };
    }
};
