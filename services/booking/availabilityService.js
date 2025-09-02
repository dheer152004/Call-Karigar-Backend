const TimeSlot = require('../../models/TimeSlot');
const WorkerProfile = require('../../models/WorkerProfile');
const Booking = require('../../models/Booking');

class AvailabilityService {
    /**
     * Get available time slots for a specific date and service
     */
    async getAvailableSlots(date, serviceId, locationId) {
        try {
            // Find workers who provide this service in the location
            const workers = await WorkerProfile.find({
                'services.serviceId': serviceId,
                'serviceAreas': locationId,
                'isAvailable': true
            });

            const workerIds = workers.map(w => w._id);

            // Get all available slots for these workers
            const slots = await TimeSlot.find({
                workerId: { $in: workerIds },
                date: date,
                isAvailable: true,
                isBooked: false
            }).populate('workerId', 'name rating');

            return slots;
        } catch (error) {
            console.error('Error getting available slots:', error);
            throw error;
        }
    }

    /**
     * Check if a specific time slot is available
     */
    async isSlotAvailable(workerId, date, startTime, endTime) {
        try {
            const existingBooking = await Booking.findOne({
                workerId,
                date,
                status: { $nin: ['cancelled', 'completed'] },
                $or: [
                    {
                        startTime: { $lt: endTime },
                        endTime: { $gt: startTime }
                    }
                ]
            });

            return !existingBooking;
        } catch (error) {
            console.error('Error checking slot availability:', error);
            throw error;
        }
    }

    /**
     * Reserve a time slot for a booking
     */
    async reserveSlot(workerId, date, startTime, endTime, bookingId) {
        try {
            // Check if slot is available
            const isAvailable = await this.isSlotAvailable(workerId, date, startTime, endTime);
            if (!isAvailable) {
                throw new Error('Time slot is not available');
            }

            // Create or update the time slot
            const slot = await TimeSlot.findOneAndUpdate(
                {
                    workerId,
                    date,
                    startTime,
                    endTime
                },
                {
                    $set: {
                        isBooked: true,
                        bookingId
                    }
                },
                {
                    new: true,
                    upsert: true
                }
            );

            return slot;
        } catch (error) {
            console.error('Error reserving slot:', error);
            throw error;
        }
    }

    /**
     * Release a reserved time slot
     */
    async releaseSlot(bookingId) {
        try {
            const slot = await TimeSlot.findOneAndUpdate(
                { bookingId },
                {
                    $set: {
                        isBooked: false,
                        bookingId: null
                    }
                },
                { new: true }
            );

            return slot;
        } catch (error) {
            console.error('Error releasing slot:', error);
            throw error;
        }
    }
}

module.exports = new AvailabilityService();
