/**
 * College Event Manager - Google Sheets Backend
 * ---------------------------------------------
 * INSTRUCTIONS:
 * 1. Copy ALL the code below.
 * 2. Go to your Google Sheet > Extensions > Apps Script.
 * 3. Paste the code, replacing any existing code.
 * 4. Click 'Deploy' > 'New Deployment'.
 * 5. Select 'Web App'.
 * 6. Description: 'Event Sync'.
 * 7. Execute as: 'Me'.
 * 8. Who has access: 'Anyone'.
 * 9. Click 'Deploy', Authorize, and Copy the URL.
 */

var SHEET_NAME = "Events";

function doGet(e) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet if not exists and add headers
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        var headers = [
            "id", "eventName", "collegeName", "eventType",
            "registrationDeadline", "startDate", "endDate",
            "prizeAmount", "registrationFee", "accommodation",
            "location", "isOnline", "status", "priorityScore",
            "website", "description", "teamSize", "eligibility",
            "leader", "members", "noOfTeams", "prizeWon",
            "contact1", "contact2", "posterUrl", "contactNumbers",
            "updatedAt"
        ];
        sheet.appendRow(headers);
    }

    var data = getEventsFromSheet(sheet);

    return ContentService.createTextOutput(JSON.stringify({
        success: true,
        events: data
    })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000); // Prevent concurrent writes

    try {
        var payload = JSON.parse(e.postData.contents);
        var action = payload.action;
        var events = payload.events || [];

        if (action === "write") {
            var count = saveEventsToSheet(events);
            return ContentService.createTextOutput(JSON.stringify({
                success: true,
                count: count
            })).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: "Invalid action"
        })).setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({
            success: false,
            error: err.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

function getEventsFromSheet(sheet) {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];

    // Get all data including headers
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1);
    var events = [];

    rows.forEach(function (row) {
        var event = {};
        var isEmpty = true;

        headers.forEach(function (header, index) {
            if (header) {
                event[header] = row[index];
                if (row[index] !== "") isEmpty = false;
            }
        });

        if (isEmpty) return; // Skip empty rows

        // Type conversions for consistency
        if (event.accommodation === "TRUE" || event.accommodation === true) event.accommodation = true;
        else event.accommodation = false;

        if (event.isOnline === "TRUE" || event.isOnline === true) event.isOnline = true;
        else event.isOnline = false;

        // Contact numbers split if string
        if (typeof event.contactNumbers === 'string' && event.contactNumbers) {
            event.contactNumbers = event.contactNumbers.split(',');
        }

        events.push(event);
    });

    return events;
}

function saveEventsToSheet(events) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
        var headers = [
            "id", "eventName", "collegeName", "eventType",
            "registrationDeadline", "startDate", "endDate",
            "prizeAmount", "registrationFee", "accommodation",
            "location", "isOnline", "status", "priorityScore",
            "website", "description", "teamSize", "eligibility",
            "leader", "members", "noOfTeams", "prizeWon",
            "contact1", "contact2", "posterUrl", "contactNumbers",
            "updatedAt"
        ];
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(headers);
    }

    // HEADERS CONSTANT
    var headers = [
        "id", "eventName", "collegeName", "eventType",
        "registrationDeadline", "startDate", "endDate",
        "prizeAmount", "registrationFee", "accommodation",
        "location", "isOnline", "status", "priorityScore",
        "website", "description", "teamSize", "eligibility",
        "leader", "members", "noOfTeams", "prizeWon",
        "contact1", "contact2", "posterUrl", "contactNumbers",
        "updatedAt"
    ];

    // Clear old data
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
    }

    if (!events || events.length === 0) return 0;

    // Prepare rows
    var rows = events.map(function (e) {
        return headers.map(function (header) {
            var val = e[header];

            // Basic formatting
            if (val === null || val === undefined) return "";

            // Dates: keep as simplified ISO strings or whatever format the DB supplies
            // If passing from JS, they are usually ISO strings already.

            // Array handling
            if (Array.isArray(val)) return val.join(',');

            return val;
        });
    });

    // Write new data
    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }

    return rows.length;
}
