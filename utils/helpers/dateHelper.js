/**
 * Helper functions for date and time operations
 */

const moment = require('moment');

/**
 * Convert time string to minutes (e.g., "14:30" to 870)
 */
const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Convert minutes to time string (e.g., 870 to "14:30")
 */
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Generate time slots for a given duration and interval
 */
const generateTimeSlots = (startTime, endTime, duration, interval) => {
    const slots = [];
    let current = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    while (current + duration <= end) {
        slots.push({
            start: minutesToTime(current),
            end: minutesToTime(current + duration)
        });
        current += interval;
    }

    return slots;
};

/**
 * Check if a time is between two times
 */
const isTimeBetween = (time, start, end) => {
    const t = timeToMinutes(time);
    const s = timeToMinutes(start);
    const e = timeToMinutes(end);
    return t >= s && t <= e;
};

/**
 * Get dates for next n days
 */
const getNextNDays = (n, excludeToday = false) => {
    const dates = [];
    let startDate = excludeToday ? moment().add(1, 'day') : moment();

    for (let i = 0; i < n; i++) {
        dates.push(startDate.clone().add(i, 'days').format('YYYY-MM-DD'));
    }

    return dates;
};

/**
 * Check if two time slots overlap
 */
const doSlotsOverlap = (slot1Start, slot1End, slot2Start, slot2End) => {
    const start1 = timeToMinutes(slot1Start);
    const end1 = timeToMinutes(slot1End);
    const start2 = timeToMinutes(slot2Start);
    const end2 = timeToMinutes(slot2End);

    return (start1 < end2) && (end1 > start2);
};

/**
 * Format duration in minutes to human readable string
 */
const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
};

module.exports = {
    timeToMinutes,
    minutesToTime,
    generateTimeSlots,
    isTimeBetween,
    getNextNDays,
    doSlotsOverlap,
    formatDuration
};
