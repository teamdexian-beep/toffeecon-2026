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
        const { ticketId, gate = 'Gate 1 (Main Foyer)' } = req.body;
        const guest = rsvps.find(r => 
            (r.id && r.id.toLowerCase() === (ticketId || '').toLowerCase().trim()) ||
            (r.phone && r.phone.replace(/[^0-9]/g, '') === (ticketId || '').replace(/[^0-9]/g, '') && (ticketId || '').length >= 7)
        );

        if (!guest) {
            return res.status(404).json({ error: 'Ticket ID or registered phone not found' });
        }

        const alreadyCheckedIn = !!guest.checkedIn;
        guest.checkedIn = true;
        guest.checkedInAt = guest.checkedInAt || new Date().toISOString();
        guest.gate = gate;
        saveRSVPs(rsvps);

        // Calculate checked in total based on event state baseline plus newly marked RSVPs
        const checkedCount = Math.max(
            eventStore.getState().telemetry.checkedInAttendees || 0,
            rsvps.filter(r => r.checkedIn).length
        ) + (alreadyCheckedIn ? 0 : 1);

        eventStore.update(st => {
            st.telemetry.checkedInAttendees = checkedCount;
        });

        const checkedInTicketData = {
            id: guest.id,
            name: guest.name,
            company: guest.company,
            role: guest.role,
            gate: guest.gate,
            phoneMasked: guest.phone && guest.phone.length > 5 ? guest.phone.slice(0, 3) + '****' + guest.phone.slice(-3) : 'N/A',
            checkedInAt: guest.checkedInAt,
            alreadyCheckedIn
        };

        // Broadcast to Executive Hub ticker and arrival meters
        broadcast('ATTENDEE_CHECKED_IN', {
            ticket: checkedInTicketData,
            telemetry: eventStore.getState().telemetry
        });

        // Broadcast to Chronological Live Audit Stream in Tab 5
        broadcast('AUDIT_EVENT', {
            id: Date.now(),
            type: 'GATE',
            message: `Attendee ${guest.name} (${guest.company || 'VIP'}) checked in at ${guest.gate}`,
            timestamp: new Date().toLocaleTimeString()
        });

        res.json({
            success: true,
            alreadyCheckedIn,
            ticket: checkedInTicketData,
            totalCheckedIn: checkedCount,
            totalRSVP: eventStore.getState().telemetry.totalRSVP || 600,
            telemetry: eventStore.getState().telemetry
        });
    });

    // 5. Gate Search API (Multi-Attribute: Name, Phone, Company, ID)
    router.get('/gate/search', (req, res) => {
        const query = (req.query.q || '').toLowerCase().trim();
        const rawDigits = (req.query.q || '').replace(/[^0-9]/g, '');
        if (!query) return res.json([]);

        const results = rsvps.filter(r => {
            const matchName = r.name && r.name.toLowerCase().includes(query);
            const matchCompany = r.company && r.company.toLowerCase().includes(query);
            const matchId = r.id && r.id.toLowerCase().includes(query);
            const matchPhone = rawDigits.length >= 4 && r.phone && r.phone.replace(/[^0-9]/g, '').includes(rawDigits);
            const matchEmail = r.email && r.email.toLowerCase().includes(query);
            return matchName || matchCompany || matchId || matchPhone || matchEmail;
        }).map(r => ({
            id: r.id,
            name: r.name,
            company: r.company,
            role: r.role,
            phoneMasked: r.phone && r.phone.length > 5 ? r.phone.slice(0, 3) + '****' + r.phone.slice(-3) : 'N/A',
            checkedIn: !!r.checkedIn,
            checkedInAt: r.checkedInAt || null,
            gate: r.gate || null
        }));

        res.json(results.slice(0, 12));
    });

    return router;
};
