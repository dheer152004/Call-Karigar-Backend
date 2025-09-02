const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false // Disable the `X-RateLimit-*` headers
    };

    return rateLimit({
        ...defaultOptions,
        ...options
    });
};

// Different rate limiters for different routes
const limiters = {
    // Auth routes - stricter limits
    auth: createRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // 5 requests per hour
        message: 'Too many authentication attempts, please try again later'
    }),

    // API routes - normal limits
    api: createRateLimiter(),

    // Worker search - higher limits
    search: createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 300 // 300 requests per 15 minutes
    }),

    // Booking creation - moderate limits
    booking: createRateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50 // 50 bookings per hour
    })
};

module.exports = limiters;
