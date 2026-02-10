// IndexedDB Database Schema using Dexie.js
import Dexie from 'dexie';

export class EventDatabase extends Dexie {
    constructor() {
        super('CollegeEventManager');

        this.version(1).stores({
            events: '++id, collegeName, eventName, eventType, registrationDeadline, startDate, endDate, status, priorityScore, createdAt, contact1, contact2, leader, prizeWon',
            colleges: '++id, name, location, pastEvents',
            notes: '++id, eventId, content, createdAt',
            settings: 'key, value'
        });
    }
}

export const db = new EventDatabase();

// Event Model
export const EventType = {
    HACKATHON: 'Hackathon',
    PAPER_PRESENTATION: 'Paper Presentation',
    PROJECT_EXPO: 'Project Expo',
    WORKSHOP: 'Workshop',
    CONTEST: 'Contest',
    SEMINAR: 'Seminar',
    CONFERENCE: 'Conference',
    OTHER: 'Other'
};

export const EventStatus = {
    OPEN: 'Open',
    DEADLINE_TODAY: 'Deadline Today',
    CLOSED: 'Closed',
    COMPLETED: 'Completed',
    ATTENDED: 'Attended',
    WON: 'Won',
    BLOCKED: 'Blocked'
};

// Event Interface (TypeScript-style documentation)
export const createEvent = ({
    collegeName,
    eventName,
    eventType,
    registrationDeadline,
    startDate,
    endDate,
    prizeAmount = 0,
    registrationFee = 0,
    accommodation = false,
    location = '',
    isOnline = false,
    contactNumbers = [],
    contact1 = '',
    contact2 = '',
    posterUrl = '',
    posterBlob = null,
    website = '',
    description = '',
    teamSize = 1,
    leader = '',
    members = '',
    noOfTeams = '',
    prizeWon = '',
    eligibility = '',
    status = null,
    priorityScore = null,
    customReminders = [],
    tags = []
}) => {
    const now = new Date();

    return {
        collegeName,
        eventName,
        eventType,
        registrationDeadline: new Date(registrationDeadline),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        prizeAmount,
        registrationFee,
        accommodation,
        location,
        isOnline,
        contactNumbers,
        contact1,
        contact2,
        posterUrl,
        posterBlob,
        website,
        description,
        teamSize,
        leader,
        members,
        noOfTeams,
        prizeWon,
        eligibility,
        status: status || calculateStatus(registrationDeadline, startDate, endDate),
        priorityScore: priorityScore || 0,
        customReminders,
        tags,
        createdAt: now,
        updatedAt: now
    };
};

// Auto Status Calculation Engine
export const calculateStatus = (registrationDeadline, startDate, endDate) => {
    const now = new Date();
    const deadline = new Date(registrationDeadline);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check for invalid dates
    if (isNaN(deadline.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
        return EventStatus.OPEN;
    }

    // Reset time to compare dates only
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (today > endDateOnly) {
        return EventStatus.COMPLETED;
    }

    if (today >= startDateOnly && today <= endDateOnly) {
        return EventStatus.ATTENDED;
    }

    if (today > deadlineDate) {
        return EventStatus.CLOSED;
    }

    if (today.getTime() === deadlineDate.getTime()) {
        return EventStatus.DEADLINE_TODAY;
    }

    return EventStatus.OPEN;
};

// Priority Scoring Engine (0-100)
export const calculatePriorityScore = (event) => {
    let score = 0;
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);

    if (isNaN(deadline.getTime())) return 0;

    // 1. Prize to Fee Ratio (0-30 points)
    const prize = parseFloat(event.prizeAmount) || 0;
    const fee = parseFloat(event.registrationFee) || 0;

    if (fee === 0 && prize > 0) {
        score += 30;
    } else if (fee > 0) {
        const ratio = prize / fee;
        if (ratio >= 10) score += 30;
        else if (ratio >= 5) score += 20;
        else if (ratio >= 2) score += 10;
    }

    // 2. Event Type Priority (0-20 points)
    const typeScores = {
        [EventType.HACKATHON]: 20,
        [EventType.PROJECT_EXPO]: 18,
        [EventType.CONTEST]: 18,
        [EventType.PAPER_PRESENTATION]: 15,
        [EventType.WORKSHOP]: 12,
        [EventType.CONFERENCE]: 10,
        [EventType.SEMINAR]: 8,
        [EventType.OTHER]: 5
    };
    score += typeScores[event.eventType] || 5;

    // 3. Days Remaining (0-25 points)
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 2) score += 25;
    else if (daysRemaining <= 7) score += 20;
    else if (daysRemaining <= 14) score += 15;
    else if (daysRemaining <= 30) score += 10;
    else score += 5;

    // 4. Online vs Offline (0-15 points)
    if (event.isOnline) {
        score += 15; // Online events are easier to attend
    } else if (event.accommodation) {
        score += 10; // Offline with accommodation
    } else {
        score += 5; // Offline without accommodation
    }

    // 5. Prize Amount Bonus (0-10 points)
    if (prize >= 100000) score += 10;
    else if (prize >= 50000) score += 7;
    else if (prize >= 10000) score += 5;
    else if (prize > 0) score += 3;

    return Math.min(100, Math.max(0, score));
};

// Database Operations
export const addEvent = async (eventData) => {
    const event = createEvent(eventData);
    event.priorityScore = calculatePriorityScore(event);
    const id = await db.events.add(event);
    return { ...event, id };
};

export const updateEvent = async (id, updates) => {
    const updated = {
        ...updates,
        updatedAt: new Date()
    };

    if (updates.registrationDeadline || updates.startDate || updates.endDate || updates.status ||
        updates.prizeAmount || updates.registrationFee || updates.isOnline || updates.accommodation) {
        const event = await db.events.get(id);
        const mergedEvent = { ...event, ...updates };

        // Only auto-calculate status if it's not being manually set to a terminal status
        const isTerminalStatus = (s) => s === EventStatus.WON || s === EventStatus.BLOCKED;

        if (updates.status) {
            updated.status = updates.status;
        } else if (!isTerminalStatus(event.status)) {
            updated.status = calculateStatus(
                mergedEvent.registrationDeadline,
                mergedEvent.startDate,
                mergedEvent.endDate
            );
        }

        updated.priorityScore = calculatePriorityScore(mergedEvent);
    }

    await db.events.update(id, updated);
    return db.events.get(id);
};

export const deleteEvent = async (id) => {
    await db.events.delete(id);
};

export const getAllEvents = async () => {
    return db.events.toArray();
};

export const getEventsByStatus = async (status) => {
    return db.events.where('status').equals(status).toArray();
};

export const getUpcomingEvents = async () => {
    const now = new Date();
    return db.events
        .where('startDate')
        .above(now)
        .sortBy('priorityScore')
        .then(events => events.reverse());
};

export const searchEvents = async (query) => {
    const lowerQuery = query.toLowerCase();
    const allEvents = await db.events.toArray();

    return allEvents.filter(event =>
        event.eventName.toLowerCase().includes(lowerQuery) ||
        event.collegeName.toLowerCase().includes(lowerQuery) ||
        event.eventType.toLowerCase().includes(lowerQuery) ||
        event.location.toLowerCase().includes(lowerQuery)
    );
};

/**
 * Intelligent Bulk Import
 * Prevents duplication by checking for existing events with same name and college
 */
export const bulkImportEvents = async (eventsArray) => {
    return await db.transaction('rw', db.events, async () => {
        const existingEvents = await db.events.toArray();
        const existingMap = new Map();

        // Create a lookup key to identify unique events
        const getEventKey = (e) => `${e.eventName.toLowerCase().trim()}_${e.collegeName.toLowerCase().trim()}`;

        existingEvents.forEach(e => {
            existingMap.set(getEventKey(e), e.id);
        });

        let addedCount = 0;
        let updatedCount = 0;

        for (const eventData of eventsArray) {
            const key = getEventKey(eventData);
            const processedEvent = createEvent(eventData);
            processedEvent.priorityScore = calculatePriorityScore(processedEvent);

            if (existingMap.has(key)) {
                // Update existing event
                const id = existingMap.get(key);
                await db.events.update(id, {
                    ...processedEvent,
                    updatedAt: new Date()
                });
                updatedCount++;
            } else {
                // Add as new event
                await db.events.add(processedEvent);
                addedCount++;
            }
        }

        return { added: addedCount, updated: updatedCount };
    });
};

// Export to CSV
export const exportEventsToCSV = async () => {
    const events = await db.events.toArray();
    return events.map(event => ({
        'College Name': event.collegeName,
        'Event Name': event.eventName,
        'Event Type': event.eventType,
        'Registration Deadline': event.registrationDeadline.toISOString().split('T')[0],
        'Start Date': event.startDate.toISOString().split('T')[0],
        'End Date': event.endDate.toISOString().split('T')[0],
        'Prize Amount': event.prizeAmount,
        'Registration Fee': event.registrationFee,
        'Accommodation': event.accommodation ? 'Yes' : 'No',
        'Location': event.location,
        'Online': event.isOnline ? 'Yes' : 'No',
        'Status': event.status,
        'Priority Score': event.priorityScore,
        'Website': event.website,
        'Description': event.description || '',
        'Team Size': event.teamSize || 1,
        'Eligibility': event.eligibility || '',
        'Leader': event.leader || '',
        'Members': event.members || '',
        'No of Teams': event.noOfTeams || '',
        'Prize Won': event.prizeWon || '',
        'Contact 1': event.contact1 || '',
        'Contact 2': event.contact2 || '',
        'Poster URL': event.posterUrl || '',
        'Contact Numbers': (event.contactNumbers || []).join(', ')
    }));
};

// Update all event statuses (run daily) - Optimized version
export const updateAllEventStatuses = async () => {
    const events = await db.events.toArray();
    const updates = [];

    for (const event of events) {
        // Skip auto-updates for terminal statuses
        if (event.status === EventStatus.WON || event.status === EventStatus.BLOCKED) {
            continue;
        }

        const newStatus = calculateStatus(
            event.registrationDeadline,
            event.startDate,
            event.endDate
        );

        const newPriorityScore = calculatePriorityScore(event);

        if (newStatus !== event.status || newPriorityScore !== event.priorityScore) {
            updates.push({
                id: event.id,
                changes: {
                    status: newStatus,
                    priorityScore: newPriorityScore,
                    updatedAt: new Date()
                }
            });
        }
    }

    if (updates.length > 0) {
        await db.transaction('rw', db.events, async () => {
            const promises = updates.map(u => db.events.update(u.id, u.changes));
            await Promise.all(promises);
        });
    }
    return updates.length;
};
