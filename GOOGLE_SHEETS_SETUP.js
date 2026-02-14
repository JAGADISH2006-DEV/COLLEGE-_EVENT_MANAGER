/**
 * ============================================================
 * College Event Manager - Google Sheets Backend v3.0
 * ============================================================
 * 
 * SETUP INSTRUCTIONS (Follow EXACTLY):
 * 
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Delete ALL existing code in the editor
 * 3. Paste this ENTIRE script
 * 4. Click the floppy disk icon (Save)
 * 5. Click Deploy → New Deployment
 * 6. Click the gear icon → Select "Web App"
 * 7. Set "Execute as" → "Me"
 * 8. Set "Who has access" → "Anyone"
 *    ⚠️ NOT "Anyone with Google Account" — that will FAIL
 * 9. Click "Deploy" → Authorize when prompted
 * 10. Copy the URL (ends with /exec) → Paste in app Settings
 * 
 * ⚠️ IMPORTANT: The URL must end with /exec NOT /dev
 * ⚠️ After ANY code change, you must create a NEW deployment
 * 
 * FEATURES:
 * - Auto-detects your sheet (uses first sheet if "Events" doesn't exist)
 * - Smart column mapping: handles "Event Name", "eventName", "event_name" etc.
 * - Push creates a clean "Events" sheet with proper headers
 * - Pull reads from whatever sheet has your data
 * ============================================================
 */

// Sheet name for writing. For reading, we auto-detect.
var WRITE_SHEET_NAME = "Events";

var HEADERS = [
    "id", "eventName", "collegeName", "eventType",
    "registrationDeadline", "startDate", "endDate",
    "prizeAmount", "registrationFee", "accommodation",
    "location", "isOnline", "status", "priorityScore",
    "website", "description", "teamSize", "eligibility",
    "leader", "members", "noOfTeams", "prizeWon",
    "contact1", "contact2", "posterUrl", "contactNumbers",
    "updatedAt"
];

// Smart column name mapping: maps various header formats to our standard keys
var COLUMN_ALIASES = {
    "id": ["id", "ID", "Id", "serial", "sno", "s.no", "sr", "#"],
    "eventName": ["eventName", "event_name", "Event Name", "event name", "Event", "event", "name", "Name", "title", "Title", "EVENT NAME", "EVENT"],
    "collegeName": ["collegeName", "college_name", "College Name", "college name", "College", "college", "Institution", "institution", "COLLEGE NAME", "COLLEGE", "University", "university", "Institute", "institute"],
    "eventType": ["eventType", "event_type", "Event Type", "event type", "Type", "type", "category", "Category", "EVENT TYPE", "TYPE"],
    "registrationDeadline": ["registrationDeadline", "registration_deadline", "Registration Deadline", "registration deadline", "Deadline", "deadline", "Reg Deadline", "reg deadline", "DEADLINE", "REGISTRATION DEADLINE", "Last Date", "last date"],
    "startDate": ["startDate", "start_date", "Start Date", "start date", "Event Date", "event date", "Date", "date", "START DATE", "EVENT DATE", "From", "from"],
    "endDate": ["endDate", "end_date", "End Date", "end date", "END DATE", "To", "to", "End", "end"],
    "prizeAmount": ["prizeAmount", "prize_amount", "Prize Amount", "prize amount", "Prize", "prize", "Prize Money", "prize money", "PRIZE", "PRIZE AMOUNT", "Prize Pool", "prize pool", "Worth"],
    "registrationFee": ["registrationFee", "registration_fee", "Registration Fee", "registration fee", "Fee", "fee", "Cost", "cost", "Entry Fee", "entry fee", "FEE", "REGISTRATION FEE"],
    "accommodation": ["accommodation", "Accommodation", "ACCOMMODATION", "Stay", "stay", "Hostel", "hostel"],
    "location": ["location", "Location", "LOCATION", "Venue", "venue", "Place", "place", "City", "city", "Address", "address"],
    "isOnline": ["isOnline", "is_online", "Online", "online", "IS ONLINE", "Mode", "mode", "Virtual", "virtual"],
    "status": ["status", "Status", "STATUS", "State", "state"],
    "priorityScore": ["priorityScore", "priority_score", "Priority Score", "priority score", "Priority", "priority", "Score", "score", "PRIORITY"],
    "website": ["website", "Website", "WEBSITE", "URL", "url", "Link", "link", "Web", "web", "Registration Link", "registration link", "Reg Link"],
    "description": ["description", "Description", "DESCRIPTION", "Details", "details", "About", "about", "Info", "info", "Notes", "notes"],
    "teamSize": ["teamSize", "team_size", "Team Size", "team size", "TEAM SIZE", "Team", "Members Count"],
    "eligibility": ["eligibility", "Eligibility", "ELIGIBILITY", "Eligible", "eligible", "Who Can Apply", "Criteria", "criteria"],
    "leader": ["leader", "Leader", "LEADER", "Team Leader", "team leader", "Lead", "lead", "Captain", "captain"],
    "members": ["members", "Members", "MEMBERS", "Team Members", "team members", "Participants", "participants"],
    "noOfTeams": ["noOfTeams", "no_of_teams", "No of Teams", "no of teams", "Teams", "teams", "Number of Teams", "NO OF TEAMS", "Team Count"],
    "prizeWon": ["prizeWon", "prize_won", "Prize Won", "prize won", "Won", "won", "Result", "result", "PRIZE WON", "Achievement"],
    "contact1": ["contact1", "Contact 1", "contact 1", "CONTACT 1", "Contact1", "Phone", "phone", "Phone 1", "Contact", "contact"],
    "contact2": ["contact2", "Contact 2", "contact 2", "CONTACT 2", "Contact2", "Phone 2", "phone 2"],
    "posterUrl": ["posterUrl", "poster_url", "Poster URL", "poster url", "Poster", "poster", "Image", "image", "POSTER", "POSTER URL", "Image URL"],
    "contactNumbers": ["contactNumbers", "contact_numbers", "Contact Numbers", "contact numbers", "CONTACT NUMBERS", "Contacts", "contacts", "Phone Numbers"],
    "updatedAt": ["updatedAt", "updated_at", "Updated At", "updated at", "UPDATED AT", "Last Updated", "Modified", "modified"]
};

// ============================================================
// GET Handler — Reads data & handles ping
// ============================================================
function doGet(e) {
    try {
        var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "read";

        // Health check ping
        if (action === "ping") {
            var ss = SpreadsheetApp.getActiveSpreadsheet();
            var sheets = ss.getSheets().map(function (s) { return s.getName(); });
            return sendJSON({
                success: true,
                action: "pong",
                message: "Connection OK",
                version: "3.0",
                sheets: sheets,
                timestamp: new Date().toISOString()
            });
        }

        // Read all events - try "Events" sheet first, fall back to first sheet
        var sheet = findReadableSheet();
        if (!sheet) {
            return sendJSON({ success: true, events: [], count: 0, message: "No sheets found" });
        }

        var events = readAllEvents(sheet);

        return sendJSON({
            success: true,
            count: events.length,
            sheetName: sheet.getName(),
            events: events
        });

    } catch (err) {
        return sendJSON({
            success: false,
            error: "GET Error: " + err.toString()
        });
    }
}

// ============================================================
// POST Handler — Writes data to sheet
// ============================================================
function doPost(e) {
    var lock = LockService.getScriptLock();

    try {
        if (!lock.tryLock(30000)) {
            return sendJSON({ success: false, error: "Server busy, try again." });
        }

        var raw = e.postData.contents;
        var payload;

        try {
            payload = JSON.parse(raw);
        } catch (parseErr) {
            return sendJSON({ success: false, error: "Invalid JSON: " + parseErr.toString() });
        }

        var action = payload.action || "write";
        var events = payload.events;

        if (!events || !Array.isArray(events)) {
            return sendJSON({ success: false, error: "No events array in request." });
        }

        if (action === "write") {
            var sheet = getOrCreateWriteSheet();
            var count = writeAllEvents(sheet, events);

            return sendJSON({
                success: true,
                action: "written",
                count: count,
                timestamp: new Date().toISOString()
            });
        }

        return sendJSON({ success: false, error: "Unknown action: " + action });

    } catch (err) {
        return sendJSON({ success: false, error: "POST Error: " + err.toString() });
    } finally {
        lock.releaseLock();
    }
}

// ============================================================
// Helper: Send JSON response
// ============================================================
function sendJSON(data) {
    return ContentService
        .createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// Find the best sheet to read from
// Priority: "Events" sheet > first sheet with data
// ============================================================
function findReadableSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Try "Events" sheet first
    var eventsSheet = ss.getSheetByName(WRITE_SHEET_NAME);
    if (eventsSheet && eventsSheet.getLastRow() > 1) {
        return eventsSheet;
    }

    // Fall back to first sheet that has data
    var allSheets = ss.getSheets();
    for (var i = 0; i < allSheets.length; i++) {
        if (allSheets[i].getLastRow() > 1) {
            return allSheets[i];
        }
    }

    // Return Events sheet even if empty, or first sheet
    return eventsSheet || (allSheets.length > 0 ? allSheets[0] : null);
}

// ============================================================
// Get or create the "Events" sheet for writing
// ============================================================
function getOrCreateWriteSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(WRITE_SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(WRITE_SHEET_NAME);
        sheet.appendRow(HEADERS);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, HEADERS.length)
            .setFontWeight("bold")
            .setBackground("#e8eaf6");
    }

    return sheet;
}

// ============================================================
// Build smart column mapping from sheet headers
// ============================================================
function buildColumnMap(sheetHeaders) {
    var map = {}; // columnIndex -> standardKey

    for (var col = 0; col < sheetHeaders.length; col++) {
        var header = String(sheetHeaders[col]).trim();
        if (!header) continue;

        // Check each standard field's aliases
        for (var stdKey in COLUMN_ALIASES) {
            var aliases = COLUMN_ALIASES[stdKey];
            for (var a = 0; a < aliases.length; a++) {
                if (header === aliases[a] || header.toLowerCase() === aliases[a].toLowerCase()) {
                    map[col] = stdKey;
                    break;
                }
            }
            if (map[col]) break; // Found a match for this column
        }
    }

    return map;
}

// ============================================================
// Read all events from sheet using smart column mapping
// ============================================================
function readAllEvents(sheet) {
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return [];

    var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    var allData = dataRange.getValues();
    var sheetHeaders = allData[0];

    // Build smart mapping
    var columnMap = buildColumnMap(sheetHeaders);

    var events = [];

    for (var r = 1; r < allData.length; r++) {
        var row = allData[r];
        var event = {};
        var hasRealData = false;

        for (var col in columnMap) {
            var key = columnMap[col];
            var val = row[parseInt(col)];

            // Convert Date objects to ISO strings
            if (val instanceof Date) {
                val = val.toISOString();
            }

            event[key] = (val === null || val === undefined) ? "" : val;

            // Check if this is meaningful data (not just whitespace or empty)
            if (val !== "" && val !== null && val !== undefined) {
                var strVal = String(val).trim();
                if (strVal.length > 0 && key !== "id" && key !== "updatedAt") {
                    hasRealData = true;
                }
            }
        }

        // Skip completely empty rows
        if (!hasRealData) continue;

        // Must have at least an event name OR college name to be valid
        var hasName = event.eventName && String(event.eventName).trim().length > 0;
        var hasCollege = event.collegeName && String(event.collegeName).trim().length > 0;

        if (!hasName && !hasCollege) continue;

        // Fix booleans
        event.accommodation = toBool(event.accommodation);
        event.isOnline = toBool(event.isOnline);

        // Fix numbers
        event.prizeAmount = toNum(event.prizeAmount);
        event.registrationFee = toNum(event.registrationFee);
        event.teamSize = toNum(event.teamSize) || 1;
        event.priorityScore = toNum(event.priorityScore);

        // Fix contact numbers
        if (typeof event.contactNumbers === "string" && event.contactNumbers.length > 0) {
            event.contactNumbers = event.contactNumbers.split(",").map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
        } else {
            event.contactNumbers = [];
        }

        events.push(event);
    }

    return events;
}

// ============================================================
// Write events to the "Events" sheet
// ============================================================
function writeAllEvents(sheet, events) {
    if (!events || events.length === 0) {
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) {
            sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
        }
        return 0;
    }

    var rows = [];
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        var row = [];

        for (var h = 0; h < HEADERS.length; h++) {
            var key = HEADERS[h];
            var val = e[key];

            if (val === null || val === undefined) {
                row.push("");
            } else if (Array.isArray(val)) {
                row.push(val.join(", "));
            } else if (typeof val === "boolean") {
                row.push(val ? "TRUE" : "FALSE");
            } else {
                row.push(val);
            }
        }

        rows.push(row);
    }

    // Ensure header row exists
    var headerRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
    var hasHeaders = headerRow[0] && String(headerRow[0]).trim().length > 0;
    if (!hasHeaders) {
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
        sheet.setFrozenRows(1);
        sheet.getRange(1, 1, 1, HEADERS.length)
            .setFontWeight("bold")
            .setBackground("#e8eaf6");
    }

    // Clear old data
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, HEADERS.length).clearContent();
    }

    // Write new data
    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    }

    return rows.length;
}

// ============================================================
// Utility: Convert to boolean
// ============================================================
function toBool(val) {
    if (typeof val === "boolean") return val;
    var s = String(val).toUpperCase().trim();
    return s === "TRUE" || s === "YES" || s === "1";
}

// ============================================================
// Utility: Convert to number
// ============================================================
function toNum(val) {
    if (typeof val === "number") return val;
    var n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
    return isNaN(n) ? 0 : n;
}
