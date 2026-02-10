import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateEvent, deleteEvent } from '../db';
import { useAppStore } from '../store';
import { X, Calendar, MapPin, Trophy, Users, ExternalLink, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

// Safe Formatter
const safeFormat = (date, formatStr) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Not Specified';
        return format(d, formatStr);
    } catch (e) {
        return 'Not Specified';
    }
};

const EventDetailsModal = () => {
    const modals = useAppStore((state) => state.modals);
    const closeModal = useAppStore((state) => state.closeModal);
    const selectedEventId = useAppStore((state) => state.selectedEventId);
    const isOpen = modals.eventDetails;

    const event = useLiveQuery(
        () => selectedEventId ? db.events.get(selectedEventId) : null,
        [selectedEventId]
    );

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(selectedEventId);
            closeModal('eventDetails');
        }
    };

    const handleStatusChange = async (newStatus) => {
        await updateEvent(selectedEventId, { status: newStatus });
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={() => closeModal('eventDetails')}
                ></div>

                {/* Modal */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Event Details
                        </h3>
                        <button
                            onClick={() => closeModal('eventDetails')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                        {/* Poster */}
                        {(event.posterUrl || event.posterBlob) && (
                            <div className="mb-6">
                                <img
                                    src={event.posterBlob instanceof Blob ? URL.createObjectURL(event.posterBlob) : (typeof event.posterBlob === 'string' ? event.posterBlob : (event.posterUrl || ''))}
                                    alt={event.eventName}
                                    className="w-full max-h-96 object-contain rounded-lg shadow-lg border border-slate-100 dark:border-slate-800"
                                />
                            </div>
                        )}

                        {/* Title & College */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {event.eventName}
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400">
                                {event.collegeName}
                            </p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="badge bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                                {event.eventType}
                            </span>
                            <span className={`badge badge-${(event.status || 'open').toLowerCase().replace(' ', '-')}`}>
                                {event.status || 'Open'}
                            </span>
                            <span className="badge bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                Priority: {event.priorityScore}
                            </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Calendar className="text-primary-500 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Registration Deadline</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {safeFormat(event.registrationDeadline, 'MMMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="text-primary-500 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Event Dates</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {safeFormat(event.startDate, 'MMM dd')} - {safeFormat(event.endDate, 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="text-primary-500 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {event.isOnline ? 'Online' : event.location || 'TBD'}
                                    </p>
                                </div>
                            </div>

                            {event.prizeAmount > 0 && (
                                <div className="flex items-start gap-3">
                                    <Trophy className="text-primary-500 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Prize Money</p>
                                        <p className="font-medium text-green-600 dark:text-green-400">
                                            ₹{event.prizeAmount.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {event.registrationFee > 0 && (
                                <div className="flex items-start gap-3">
                                    <Trophy className="text-primary-500 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Registration Fee</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            ₹{event.registrationFee.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <Users className="text-primary-500 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Team Size</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {event.teamSize || 1} {(event.teamSize || 1) === 1 ? 'member' : 'members'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                                <p className="text-gray-600 dark:text-gray-400">{event.description}</p>
                            </div>
                        )}

                        {/* Eligibility */}
                        {event.eligibility && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Eligibility</h4>
                                <p className="text-gray-600 dark:text-gray-400">{event.eligibility}</p>
                            </div>
                        )}

                        {/* Contact */}
                        {event.contactNumbers && event.contactNumbers.length > 0 && (
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact</h4>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(event.contactNumbers) ? event.contactNumbers.map((contact, idx) => (
                                        <a
                                            key={idx}
                                            href={`tel:${contact}`}
                                            className="text-primary-600 dark:text-primary-400 hover:underline"
                                        >
                                            {contact}
                                        </a>
                                    )) : null}
                                </div>
                            </div>
                        )}

                        {/* Website */}
                        {event.website && (
                            <div className="mb-6">
                                <a
                                    href={event.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                    <ExternalLink size={18} />
                                    Visit Event Website
                                </a>
                            </div>
                        )}

                        {/* Status Update */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Update Status</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Open', 'Closed', 'Attended', 'Won'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={`btn ${event.status === status ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleDelete}
                            className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                        >
                            <Trash2 size={18} />
                            Delete Event
                        </button>
                        <button
                            onClick={() => closeModal('eventDetails')}
                            className="btn btn-primary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
