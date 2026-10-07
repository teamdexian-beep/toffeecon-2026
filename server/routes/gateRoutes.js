const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireDirectorAuth, gateRateLimiter } = require('../middleware/security');

module.exports = function(eventStore, broadcast, rsvpsFilePath) {
    function loadRSVPs() {
        try {
            if (fs.existsSync(rsvpsFilePath)) {
                return JSON.parse(fs.readFileSync(rsvpsFilePath, 'utf8'));
            }
        } catch (e) {
            console.error('Error loading rsvps.json:', e);
        }
        return [];
    }

    function saveRSVPs(list) {
        try {
            fs.writeFileSync(rsvpsFilePath, JSON.stringify(list, null, 2), 'utf8');
        } catch (e) {
            console.error('Error saving rsvps.json:', e);
        }
    }

    let rsvps = loadRSVPs();

    // 1. RSVP Registration API
    const rsvpCooldown = new Map();
    router.post('/rsvp', (req, res) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const last = rsvpCooldown.get(ip) || 0;

        if (now - last < 1000) {
            return res.status(429).json({ error: 'Too many registration requests. Please wait a moment.' });
        }
        rsvpCooldown.set(ip, now);

        const { name, email, phone, company, role } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address format' });
        }

        const newTicket = {
            id: 'TCON-' + Math.floor(1000 + Math.random() * 9000),
            name: (name || '').trim().slice(0, 60),
            email: (email || '').trim().toLowerCase().slice(0, 80),
            phone: (phone || 'N/A').trim().slice(0, 20),
            company: (company || 'Independent Partner').trim().slice(0, 60),
            role: (role || 'General Attendee').trim().slice(0, 40),
            registeredAt: new Date().toISOString()
        };

        rsvps.unshift(newTicket);
        saveRSVPs(rsvps);

        eventStore.update(st => {
            st.telemetry.totalRSVP = rsvps.length;
        });

        // Broadcast sanitized arrival notice (Never expose email or phone over WebSocket)
        broadcast('NEW_RSVP', {
            id: newTicket.id,
            name: newTicket.name,
            company: newTicket.company,
            role: newTicket.role,
            registeredAt: newTicket.registeredAt
        });

        res.json({ success: true, ticket: newTicket });
    });

    // 2. Public Safe Attendee Listing
    router.get('/rsvps', (req, res) => {
        const safeList = rsvps.map(r => ({
            id: r.id,
            name: r.name,
            company: r.company,
            role: r.role,
            checkedIn: !!r.checkedIn,
            checkedInAt: r.checkedInAt || null
        }));
        res.json(safeList);
    });

    // 3. Authenticated / Sanitized RSVP Export
    router.get('/rsvps/export', (req, res, next) => {
        if (req.query.format === 'sanitized') {
            const sanitizedList = rsvps.map(r => ({
                id: r.id,
                name: r.name,
                company: r.company,
                role: r.role,
                checkedIn: !!r.checkedIn,
                registeredAt: r.registeredAt
            }));
            res.setHeader('Content-Disposition', 'attachment; filename="toffeecon_sanitized_rsvps.json"');
            res.setHeader('Content-Type', 'application/json');
            return res.send(JSON.stringify(sanitizedList, null, 2));
        }

        // Full export with PII requires director authentication
        requireDirectorAuth(req, res, () => {
            res.setHeader('Content-Disposition', 'attachment; filename="toffeecon_master_rsvps_backup.json"');
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(rsvps, null, 2));
        });
    });

    // 4. Gate Check-In API
    router.post('/gate/checkin', gateRateLimiter, (req, res) => {
        const { ticketId, gate = 'Gate 1' } = req.body;
        const guest = rsvps.find(r => r.id.toLowerCase() === (ticketId || '').toLowerCase());

        if (!guest) {
            return res.status(404).json({ error: 'Ticket ID not found' });
        }

        const alreadyCheckedIn = !!guest.checkedIn;
        guest.checkedIn = true;
        guest.checkedInAt = guest.checkedInAt || new Date().toISOString();
        guest.gate = gate;
        saveRSVPs(rsvps);

        const checkedCount = rsvps.filter(r => r.checkedIn).length;
        eventStore.update(st => {
            st.telemetry.checkedInAttendees = checkedCount;
        });

        broadcast('ATTENDEE_CHECKED_IN', {
            ticket: {
                id: guest.id,
                name: guest.name,
                company: guest.company,
                role: guest.role,
                gate: guest.gate,
                checkedInAt: guest.checkedInAt,
                alreadyCheckedIn
            },
            telemetry: eventStore.getState().telemetry
        });

        res.json({
            success: true,
            alreadyCheckedIn,
            ticket: {
                id: guest.id,
                name: guest.name,
                company: guest.company,
                role: guest.role,
                gate: guest.gate,
                checkedInAt: guest.checkedInAt
            },
            telemetry: eventStore.getState().telemetry
        });
    });

    // 5. Gate Search API (Masked PII)
    router.get('/gate/search', (req, res) => {
        const query = (req.query.q || '').toLowerCase().trim();
        if (!query) return res.json([]);

        const results = rsvps.filter(r =>
            (r.name && r.name.toLowerCase().includes(query)) ||
            (r.company && r.company.toLowerCase().includes(query)) ||
            (r.id && r.id.toLowerCase().includes(query))
        ).map(r => ({
            id: r.id,
            name: r.name,
            company: r.company,
            role: r.role,
            checkedIn: !!r.checkedIn
        }));

        res.json(results.slice(0, 10));
    });

    return router;
};
