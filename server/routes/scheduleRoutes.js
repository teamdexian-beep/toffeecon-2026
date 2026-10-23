const express = require('express');
const router = express.Router();
const scheduleStore = require('../stores/scheduleStore');
const { requireDirectorAuth } = require('../middleware/security');

module.exports = function(eventStore, broadcast) {

    // 1. Public Query Endpoint: GET /api/schedule (Cached/Fast Read)
    router.get('/', (req, res) => {
        const dayParam = req.query.day ? parseInt(req.query.day, 10) : (scheduleStore.getState().activeDay || 1);
        const day = isNaN(dayParam) ? 1 : dayParam;
        const status = req.query.status;
        const type = req.query.type;

        const beats = scheduleStore.getSchedule({ day, status, type });
        const activeBeatId = scheduleStore.getActiveBeatId(day);
        const storeState = scheduleStore.getState();

        res.json({
            success: true,
            day,
            date: storeState.date || "2026-10-23",
            totalBeats: beats.length,
            schedule: beats,
            activeBeatId,
            lastUpdated: storeState.lastUpdated || new Date().toISOString()
        });
    });

    // 2. Public Query Endpoint: GET /api/schedule/current
    router.get('/current', (req, res) => {
        const dayParam = req.query.day ? parseInt(req.query.day, 10) : 1;
        const currentBeat = scheduleStore.getCurrentBeat(dayParam);
        res.json({
            success: true,
            currentBeat,
            activeBeatId: currentBeat ? currentBeat.id : null
        });
    });

    // 3. Public Query Endpoint: GET /api/schedule/:id
    router.get('/:id', (req, res) => {
        const beat = scheduleStore.getBeatById(req.params.id);
        if (!beat) {
            return res.status(404).json({ success: false, error: 'Schedule beat not found' });
        }
        res.json({ success: true, beat });
    });

    // 4. Director-Guarded Update RPC: PUT /api/schedule
    router.put('/', requireDirectorAuth, (req, res) => {
        const body = req.body || {};
        const timestamp = new Date().toISOString();
        let targetDay = 1;
        let updatedSchedule = [];

        // Case A: Full or partial schedule replacement by day: { day: 1, schedule: [...] }
        if (Array.isArray(body.schedule)) {
            targetDay = parseInt(body.day, 10) || 1;
            updatedSchedule = scheduleStore.replaceDaySchedule(targetDay, body.schedule);

            // Audit log
            if (eventStore && typeof eventStore.addAuditLog === 'function') {
                eventStore.addAuditLog({
                    channel: 'DIRECTOR_ACTION',
                    action: 'SCHEDULE_REPLACED',
                    message: `Director replaced entire Day ${targetDay} schedule (${body.schedule.length} beats)`,
                    timestamp
                });
            }
        }
        // Case B: Partial single beat update with beatId or id: { beatId: "beat-04", updates: { ... } } or { id: "beat-04", ...updates }
        else if (body.beatId || body.id) {
            const beatId = body.beatId || body.id;
            const updates = body.updates || body;
            const updatedBeat = scheduleStore.updateBeat(beatId, updates);

            if (!updatedBeat) {
                return res.status(404).json({ success: false, error: `Beat "${beatId}" not found in schedule` });
            }

            targetDay = updatedBeat.day || 1;
            updatedSchedule = scheduleStore.getSchedule({ day: targetDay });

            // Audit log
            if (eventStore && typeof eventStore.addAuditLog === 'function') {
                eventStore.addAuditLog({
                    channel: 'DIRECTOR_ACTION',
                    action: 'BEAT_UPDATED',
                    message: `Director updated beat ${updatedBeat.id} ("${updatedBeat.title}") to ${updatedBeat.time} [${updatedBeat.status}]`,
                    timestamp
                });
            }
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid update payload. Provide either { schedule: [...] } or { beatId, updates }.'
            });
        }

        // Multicast real-time WebSocket event
        if (broadcast && typeof broadcast === 'function') {
            broadcast('SCHEDULE_UPDATED', {
                day: targetDay,
                schedule: updatedSchedule,
                timestamp
            });

            broadcast('AUDIT_EVENT', {
                id: Date.now(),
                type: 'SCHEDULE',
                message: `Schedule updated for Day ${targetDay} (${updatedSchedule.length} beats active)`,
                timestamp: new Date().toLocaleTimeString()
            });
        }

        res.json({
            success: true,
            day: targetDay,
            totalBeats: updatedSchedule.length,
            schedule: updatedSchedule,
            timestamp
        });
    });

    // 5. Director-Guarded Single Beat Update: PUT /api/schedule/:id
    router.put('/:id', requireDirectorAuth, (req, res) => {
        const beatId = req.params.id;
        const updates = req.body || {};
        const timestamp = new Date().toISOString();

        const updatedBeat = scheduleStore.updateBeat(beatId, updates);
        if (!updatedBeat) {
            return res.status(404).json({ success: false, error: `Beat "${beatId}" not found in schedule` });
        }

        const targetDay = updatedBeat.day || 1;
        const updatedSchedule = scheduleStore.getSchedule({ day: targetDay });

        if (eventStore && typeof eventStore.addAuditLog === 'function') {
            eventStore.addAuditLog({
                channel: 'DIRECTOR_ACTION',
                action: 'BEAT_UPDATED',
                message: `Director modified beat ${updatedBeat.id} ("${updatedBeat.title}")`,
                timestamp
            });
        }

        if (broadcast && typeof broadcast === 'function') {
            broadcast('SCHEDULE_UPDATED', {
                day: targetDay,
                schedule: updatedSchedule,
                timestamp
            });
        }

        res.json({
            success: true,
            beat: updatedBeat,
            schedule: updatedSchedule
        });
    });

    // 6. Director-Guarded Add Beat: POST /api/schedule/beat
    router.post('/beat', requireDirectorAuth, (req, res) => {
        const newBeat = scheduleStore.addBeat(req.body);
        const timestamp = new Date().toISOString();
        const targetDay = newBeat.day || 1;
        const updatedSchedule = scheduleStore.getSchedule({ day: targetDay });

        if (eventStore && typeof eventStore.addAuditLog === 'function') {
            eventStore.addAuditLog({
                channel: 'DIRECTOR_ACTION',
                action: 'BEAT_ADDED',
                message: `Director added new beat ${newBeat.id} ("${newBeat.title}") at ${newBeat.time}`,
                timestamp
            });
        }

        if (broadcast && typeof broadcast === 'function') {
            broadcast('SCHEDULE_UPDATED', {
                day: targetDay,
                schedule: updatedSchedule,
                timestamp
            });
        }

        res.status(201).json({
            success: true,
            beat: newBeat,
            schedule: updatedSchedule
        });
    });

    // 7. Director-Guarded Reset to Default 12 Beats: POST /api/schedule/reset
    router.post('/reset', requireDirectorAuth, (req, res) => {
        const state = scheduleStore.resetToDefault();
        const timestamp = new Date().toISOString();

        if (eventStore && typeof eventStore.addAuditLog === 'function') {
            eventStore.addAuditLog({
                channel: 'DIRECTOR_ACTION',
                action: 'SCHEDULE_RESET',
                message: 'Director reset event schedule to canonical 12-beat seed',
                timestamp
            });
        }

        if (broadcast && typeof broadcast === 'function') {
            broadcast('SCHEDULE_UPDATED', {
                day: 1,
                schedule: state.schedule,
                timestamp
            });
        }

        res.json({
            success: true,
            message: 'Schedule successfully reset to canonical 12-beat seed',
            schedule: state.schedule
        });
    });

    return router;
};
