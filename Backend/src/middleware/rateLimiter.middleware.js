
// Limits number of requests from a single IP
// Prevents brute force attacks and API abuse
// Configurable rate limits for different routes

const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/apiError');

// REMOVED custom keyGenerator
const isDev = process.env.NODE_ENV !== 'production';

// Rate Limiter (Skipped in development to allow smooth pair programming & rapid navigation)
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 50000 : 1000,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return isDev || req.path === '/health';
    },
    handler: (req, res) => {
        throw ApiError.tooManyRequests('Too many requests. Please try again later.');
    },
});

// REMOVED custom keyGenerator
const strictRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 20,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
    handler: (req, res) => {
        throw ApiError.tooManyRequests('Too many attempts. Please try again later.');
    },
});

// REMOVED custom keyGenerator
const otpRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: isDev ? 500 : 5,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 5 minutes.',
        retryAfter: '5 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isDev,
    handler: (req, res) => {
        throw ApiError.tooManyRequests('Too many OTP requests. Please try again later.');
    },
});

module.exports = {
    rateLimiter,
    strictRateLimiter,
    otpRateLimiter,
};