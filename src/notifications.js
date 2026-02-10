// Notification System with Web Notifications API
import { useAppStore } from './store';

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
};

// Show notification
export const showNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200],
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        return notification;
    }
};

// Schedule reminder for an event
export const scheduleEventReminder = (event, daysBeforeDeadline) => {
    const deadline = new Date(event.registrationDeadline);
    const reminderDate = new Date(deadline);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeDeadline);

    const now = new Date();
    const timeUntilReminder = reminderDate - now;

    if (timeUntilReminder > 0) {
        setTimeout(() => {
            showNotification(
                `Deadline Reminder: ${event.eventName}`,
                {
                    body: `Registration deadline in ${daysBeforeDeadline} day(s) - ${event.collegeName}`,
                    tag: `deadline-${event.id}-${daysBeforeDeadline}`,
                    requireInteraction: true
                }
            );
        }, timeUntilReminder);
    }
};

// Check and send due notifications
export const checkDueNotifications = async (events) => {
    const { preferences } = useAppStore.getState();

    if (!preferences.notificationsEnabled) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Load shown notifications from localStorage to prevent duplicates
    const shownNotifications = JSON.parse(localStorage.getItem('shown_notifications') || '{}');
    const todayKey = today.toISOString().split('T')[0];

    // Cleanup old entries (older than today)
    if (shownNotifications.date !== todayKey) {
        shownNotifications.date = todayKey;
        shownNotifications.tags = [];
    }

    events.forEach(event => {
        const deadline = new Date(event.registrationDeadline);
        const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
        const startDate = new Date(event.startDate);
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

        const daysUntilDeadline = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
        const daysUntilEvent = Math.ceil((startDateOnly - today) / (1000 * 60 * 60 * 24));

        // Deadline reminders
        if (preferences.deadlineReminderDays.includes(daysUntilDeadline)) {
            const tag = `deadline-${event.id}-${daysUntilDeadline}`;
            if (!shownNotifications.tags.includes(tag)) {
                showNotification(
                    `Deadline ${daysUntilDeadline === 0 ? 'Today' : `in ${daysUntilDeadline} day(s)`}`,
                    {
                        body: `${event.eventName} - ${event.collegeName}`,
                        tag: tag,
                        data: { eventId: event.id, type: 'deadline' }
                    }
                );
                shownNotifications.tags.push(tag);
            }
        }

        // Event start reminders
        if (preferences.eventReminderDays.includes(daysUntilEvent)) {
            const tag = `event-${event.id}-${daysUntilEvent}`;
            if (!shownNotifications.tags.includes(tag)) {
                showNotification(
                    `Event ${daysUntilEvent === 0 ? 'Today' : `in ${daysUntilEvent} day(s)`}`,
                    {
                        body: `${event.eventName} starts ${daysUntilEvent === 0 ? 'today' : `in ${daysUntilEvent} day(s)`}`,
                        tag: tag,
                        data: { eventId: event.id, type: 'event' }
                    }
                );
                shownNotifications.tags.push(tag);
            }
        }
    });

    localStorage.setItem('shown_notifications', JSON.stringify(shownNotifications));
};

// Initialize notification system
export const initNotificationSystem = async () => {
    const hasPermission = await requestNotificationPermission();

    if (hasPermission) {
        // Check notifications every hour
        setInterval(() => {
            import('./db').then(({ getAllEvents }) => {
                getAllEvents().then(events => {
                    checkDueNotifications(events);
                });
            });
        }, 60 * 60 * 1000); // 1 hour

        // Check immediately
        import('./db').then(({ getAllEvents }) => {
            getAllEvents().then(events => {
                checkDueNotifications(events);
            });
        });
    }

    return hasPermission;
};
