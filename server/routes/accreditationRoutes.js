const path = require('path');
const express = require('express');
const router = express.Router();
const accreditationStore = require('../stores/accreditationStore');
const aiProvider = require('../services/aiProvider');
const { generateBatchInvitations } = require('../scripts/generate_invitations_pdf');
const { requireDirectorAuth, gateRateLimiter } = require('../middleware/security');

module.exports = function(eventStore, broadcast) {

    // Static route for exported VIP print cards and master print sheet
    router.use('/invitations', express.static(path.join(__dirname, '../data/invitations')));

    // 1. Verify VIP Accreditation Token (Public / Kiosk / Turnstile QR/NFC Scanner)
    router.get('/verify/:token', gateRateLimiter, (req, res) => {
        const token = req.params.token;
        if (!token) {
            return res.status(400).json({ valid: false, error: 'Token parameter is required' });
        }

        const guest = accreditationStore.getByToken(token);
        if (!guest) {
            return res.status(404).json({
                valid: false,
                error: 'VIP accreditation token not recognized or expired'
            });
        }

        res.json({
            valid: true,
            guest: accreditationStore.sanitizeGuest(guest)
        });
    });

    // 2. Personalized VIP AI Concierge Briefing Engine
    router.post('/briefing', gateRateLimiter, async (req, res) => {
        const { token } = req.body || {};
        if (!token) {
            return res.status(400).json({ success: false, error: 'Accreditation token is required for VIP briefing' });
        }

        const guest = accreditationStore.getByToken(token);
        if (!guest) {
            return res.status(404).json({
                success: false,
                error: 'VIP accreditation token not recognized or expired'
            });
        }

        try {
            const briefing = await aiProvider.generateVIPBriefing(guest);
            res.json({
                success: true,
                briefing
            });
        } catch (err) {
            console.error('[Accreditation] VIP briefing generation error:', err);
            const fallback = aiProvider.getDeterministicVIPBriefing(guest);
            res.json({
                success: true,
                briefing: fallback
            });
        }
    });

    // 3. Claim VIP Token on Attendee Mobile Device (Self-Service Ingress Claim)
    router.post('/claim', gateRateLimiter, async (req, res) => {
        const { token, deviceFingerprint } = req.body || {};
        if (!token) {
            return res.status(400).json({ error: 'Accreditation token is required to claim pass' });
        }

        const result = accreditationStore.claimInvitation(token, deviceFingerprint);
        if (!result.success) {
            const statusCode = result.code === 'INVALID_TOKEN' ? 404 : 400;
            return res.status(statusCode).json({
                error: result.error,
                code: result.code
            });
        }

        // Real-Time Bot Mesh Telemetry Dispatch & Audit Log
        const claimDispatchPayload = {
            channel: 'CONCIERGE_DISPATCH',
            event: 'VIP_CLAIM_DETECTED',
            guest: result.guest.name,
            organization: result.guest.organization,
            tier: result.guest.tier,
            gate: 'MOBILE_PWA_INGRESS',
            timestamp: new Date().toISOString()
        };

        if (eventStore && typeof eventStore.addAuditLog === 'function') {
            eventStore.addAuditLog({
                type: 'VIP_CLAIM_DETECTED',
                channel: 'CONCIERGE_DISPATCH',
                guest: result.guest.name,
                organization: result.guest.organization,
                tier: result.guest.tier,
                gate: 'MOBILE_PWA_INGRESS',
                message: `VIP Claim: ${result.guest.name} (${result.guest.organization}) claimed accreditation pass`
            });
        }

        if (broadcast && typeof broadcast === 'function') {
            broadcast('CONCIERGE_DISPATCH', claimDispatchPayload, 'accreditation_feed');
            broadcast('CONCIERGE_DISPATCH', claimDispatchPayload, 'system');
            broadcast('CONCIERGE_DISPATCH', claimDispatchPayload);

            if (!result.alreadyClaimed) {
                broadcast('VIP_CLAIMED', {
                    token: result.guest.token,
                    name: result.guest.name,
                    organization: result.guest.organization,
                    tier: result.guest.tier,
                    claimedAt: result.guest.claimedAt
                });
            }
        }

        // Attach deterministic briefing to claim payload for instant mobile concierge display
        let instantBriefing = null;
        try {
            instantBriefing = aiProvider.getDeterministicVIPBriefing(result.guest);
        } catch (e) {}

        res.json({
            success: true,
            alreadyClaimed: !!result.alreadyClaimed,
            message: result.message || 'VIP Pass successfully claimed and bound to device',
            guest: accreditationStore.sanitizeGuest(result.guest),
            briefing: instantBriefing
        });
    });

    // 4. Check-In VIP Attendee at Stadium Turnstile / Gate
    router.post('/checkin', gateRateLimiter, (req, res) => {
        const { token, gateId = 'GATE-VIP-MAIN' } = req.body || {};
        if (!token) {
            return res.status(400).json({ error: 'Accreditation token is required for gate check-in' });
        }

        const result = accreditationStore.checkIn(token, gateId);
        if (!result.success) {
            if (result.alreadyCheckedIn) {
                return res.status(409).json({
                    success: false,
                    alreadyCheckedIn: true,
                    error: 'VIP attendee is already checked in at venue',
                    guest: accreditationStore.sanitizeGuest(result.guest)
                });
            }
            return res.status(result.code === 'INVALID_TOKEN' ? 404 : 400).json({
                error: result.error,
                code: result.code
            });
        }

        // Update Central EventStore Telemetry
        if (eventStore && typeof eventStore.update === 'function') {
            eventStore.update(st => {
                if (st.telemetry) {
                    st.telemetry.checkedInAttendees = (st.telemetry.checkedInAttendees || 0) + 1;
                }
            });
        }

        // Real-Time Bot Mesh Telemetry Dispatch & Audit Log
        const ingressDispatchPayload = {
            channel: 'CONCIERGE_DISPATCH',
            event: 'VIP_INGRESS_DETECTED',
            guest: result.guest.name,
            organization: result.guest.organization,
            tier: result.guest.tier,
            gate: result.guest.gateId || gateId || 'GATE-01',
            timestamp: new Date().toISOString()
        };

        if (eventStore && typeof eventStore.addAuditLog === 'function') {
            eventStore.addAuditLog({
                type: 'VIP_INGRESS_DETECTED',
                channel: 'CONCIERGE_DISPATCH',
                guest: result.guest.name,
                organization: result.guest.organization,
                tier: result.guest.tier,
                gate: result.guest.gateId || gateId,
                message: `VIP Ingress: ${result.guest.name} (${result.guest.organization}) checked in at ${result.guest.gateId || gateId}`
            });
        }

        // Broadcast to Stadium LED, Hub Ticker, and Bot Mesh Rooms
        if (broadcast && typeof broadcast === 'function') {
            broadcast('CONCIERGE_DISPATCH', ingressDispatchPayload, 'accreditation_feed');
            broadcast('CONCIERGE_DISPATCH', ingressDispatchPayload, 'system');
            broadcast('CONCIERGE_DISPATCH', ingressDispatchPayload);

            broadcast('VIP_CHECKED_IN', {
                token: result.guest.token,
                name: result.guest.name,
                designation: result.guest.designation,
                organization: result.guest.organization,
                tier: result.guest.tier,
                gateId: result.guest.gateId,
                checkedInAt: result.guest.checkedInAt
            });

            broadcast('AUDIT_EVENT', {
                id: Date.now(),
                type: 'VIP_GATE',
                message: `VIP ${result.guest.name} (${result.guest.organization}) checked in at ${result.guest.gateId}`,
                timestamp: new Date().toLocaleTimeString()
            });
        }

        res.json({
            success: true,
            alreadyCheckedIn: false,
            guest: accreditationStore.sanitizeGuest(result.guest),
            stats: accreditationStore.getStats()
        });
    });

    // 5. Public / Kiosk Summary Telemetry
    router.get('/stats', (req, res) => {
        res.json(accreditationStore.getStats());
    });

    // 6. Director / Gate Controller VIP Registry (Guarded by requireDirectorAuth)
    router.get('/list', requireDirectorAuth, (req, res) => {
        const { status, tier, search, limit, offset } = req.query;
        let guests = accreditationStore.getAll({ status, tier, search });
        const total = guests.length;

        const off = parseInt(offset, 10) || 0;
        const lim = parseInt(limit, 10) || guests.length;
        const paginated = guests.slice(off, off + lim);

        res.json({
            total,
            count: paginated.length,
            stats: accreditationStore.getStats(),
            guests: paginated
        });
    });

    // 7. Issue / Mint New VIP Accreditation Token (Guarded by requireDirectorAuth)
    router.post('/issue', requireDirectorAuth, (req, res) => {
        const { name, designation, organization, tier, seatZone, dietary } = req.body || {};
        if (!name || !organization) {
            return res.status(400).json({
                error: 'Attendee name and organization are required to issue VIP token'
            });
        }

        const result = accreditationStore.issueToken({
            name,
            designation,
            organization,
            tier,
            seatZone,
            dietary
        });

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        if (broadcast && typeof broadcast === 'function') {
            broadcast('AUDIT_EVENT', {
                id: Date.now(),
                type: 'VIP_ISSUED',
                message: `VIP token issued for ${result.guest.name} (${result.guest.organization}) [${result.guest.tier}]`,
                timestamp: new Date().toLocaleTimeString()
            });
        }

        res.status(201).json({
            success: true,
            guest: result.guest
        });
    });

    // 8. Batch Export Printable Invitations & Manifest (Guarded by requireDirectorAuth)
    router.post('/export-invitations', requireDirectorAuth, async (req, res) => {
        const { limit, tier } = req.body || {};
        try {
            const report = await generateBatchInvitations({
                limit: limit ? parseInt(limit, 10) : undefined,
                tier: tier || undefined
            });
            res.json(report);
        } catch (err) {
            console.error('[Accreditation] Batch export error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
