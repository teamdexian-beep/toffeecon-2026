// ========================================================
// Security Middleware & Zero-Trust Protection Layer
// ToffeeCon 2026 Summit Event Operating System (EOS)
// ========================================================

const DIRECTOR_AUTH_KEY = process.env.DIRECTOR_AUTH_KEY || 'toffeecon-2026-secure';

function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeValue(val) {
    if (typeof val === 'string') {
        return escapeHtml(val.trim());
    } else if (Array.isArray(val)) {
        return val.map(sanitizeValue);
    } else if (val !== null && typeof val === 'object') {
        const cleaned = {};
        for (const k of Object.keys(val)) {
            cleaned[k] = sanitizeValue(val[k]);
        }
        return cleaned;
    }
    return val;
}

// Middleware: Universal Request Body Sanitizer (Prevents Stored & Reflected XSS)
function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    next();
}

// Middleware: Admin / Showcaller Authentication Guard
function requireDirectorAuth(req, res, next) {
    const authHeader = req.headers['x-director-auth'];
    const queryAuth = req.query.auth;

    if (authHeader === DIRECTOR_AUTH_KEY || queryAuth === DIRECTOR_AUTH_KEY) {
        return next();
    }

    return res.status(401).json({
        error: 'Unauthorized access. Director authentication credential required.',
        code: 'UNAUTHORIZED_DIRECTOR_ACCESS'
    });
}

// In-Memory Sliding Window Rate Limiter Factory
function createRateLimiter({ windowMs = 60000, maxRequests = 30, message = 'Too many requests' } = {}) {
    const requests = new Map();

    return function rateLimiter(req, res, next) {
        const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
        const now = Date.now();
        const clientLogs = requests.get(ip) || [];

        // Prune older than window
        const validLogs = clientLogs.filter(time => now - time < windowMs);

        if (validLogs.length >= maxRequests) {
            return res.status(429).json({
                error: message,
                retryAfterSec: Math.ceil((windowMs - (now - validLogs[0])) / 1000)
            });
        }

        validLogs.push(now);
        requests.set(ip, validLogs);
        next();
    };
}

// Tiered Limiters
const aiRateLimiter = createRateLimiter({
    windowMs: 60000,
    maxRequests: 6,
    message: 'AI Generation request rate limit exceeded. Please wait a moment.'
});

const voteRateLimiter = createRateLimiter({
    windowMs: 60000,
    maxRequests: 25,
    message: 'Voting throughput limit reached. Please wait.'
});

const gateRateLimiter = createRateLimiter({
    windowMs: 60000,
    maxRequests: 60,
    message: 'Gate terminal throughput limit reached.'
});

// Process Crash Protection Safeguards
function setupProcessProtection() {
    process.on('uncaughtException', (err) => {
        console.error('[CRITICAL PROTECTED] Uncaught Exception caught by EOS Security Guard:', err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('[CRITICAL PROTECTED] Unhandled Promise Rejection caught by EOS Security Guard:', reason);
    });
}

module.exports = {
    DIRECTOR_AUTH_KEY,
    escapeHtml,
    sanitizeBody,
    requireDirectorAuth,
    aiRateLimiter,
    voteRateLimiter,
    gateRateLimiter,
    setupProcessProtection
};
