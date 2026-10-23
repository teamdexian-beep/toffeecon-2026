const express = require('express');
const router = express.Router();
const os = require('os');
const { requireDirectorAuth } = require('../middleware/security');

module.exports = function(eventStore, broadcast, aiProvider, wss) {
    let wallAutoLoopTimer = null;

    function executeWallSync() {
        const targetSyncTimestamp = Date.now() + 500;
        eventStore.update(st => {
            st.phoneWall.currentMode = 'synced_logo';
            st.phoneWall.lastSyncTimestamp = targetSyncTimestamp;
        });

        broadcast('WALL_SYNC_TRIGGER', {
            mode: 'synced_logo',
            syncAt: targetSyncTimestamp,
            durationMs: 5000
        });

        setTimeout(() => {
            eventStore.update(st => {
                st.phoneWall.currentMode = 'multilingual';
            });
            broadcast('WALL_SYNC_TRIGGER', {
                mode: 'multilingual',
                syncAt: Date.now()
            });
        }, 5500);
    }

    // Diagnostics & Health Endpoints
    const handleDiagnostics = (req, res) => {
        const state = eventStore.getState();
        res.json({
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            connectedClients: wss.clients ? wss.clients.size : 0,
            autoLoopActive: !!wallAutoLoopTimer,
            eventState: state,
            auditLogs: auditLogs.slice(0, 20)
        });
    };

    router.get('/diagnostics', handleDiagnostics);
    router.get('/system/diagnostics', handleDiagnostics);

    // Local IP Discovery
    router.get('/network-ip', (req, res) => {
        const interfaces = os.networkInterfaces();
        let localIp = '127.0.0.1';
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    localIp = iface.address;
                    break;
                }
            }
        }
        res.json({ ip: localIp });
    });

    // Get AI Provider configuration (Guarded strictly for Directors)
    router.get('/ai/config', requireDirectorAuth, (req, res) => {
        res.json({ success: true, aiConfig: aiProvider.getStatus() });
    });

    // Update AI Provider configuration
    router.post('/ai/config', requireDirectorAuth, (req, res) => {
        const { provider, apiKey, model } = req.body;
        const updated = aiProvider.updateConfig({
            ...(provider && { provider }),
            ...(apiKey !== undefined && { apiKey }),
            ...(model && { model })
        });
        broadcast('AI_CONFIG_UPDATE', updated);
        res.json({ success: true, aiConfig: updated });
    });

    // 100-Phone Wall Sync APIs
    router.get('/wall/time', (req, res) => {
        res.json({ serverTime: Date.now() });
    });

    router.post('/wall/trigger', (req, res) => {
        executeWallSync();
        res.json({ success: true, mode: 'synced_logo', targetSyncTimestamp: Date.now() + 500 });
    });

    router.post('/phone-wall/sync', (req, res) => {
        executeWallSync();
        res.json({ success: true, mode: 'synced_logo' });
    });

    router.post('/wall/autoloop', (req, res) => {
        const { enable } = req.body;
        if (enable) {
            if (!wallAutoLoopTimer) {
                wallAutoLoopTimer = setInterval(() => {
                    executeWallSync();
                }, 60000);
            }
        } else {
            if (wallAutoLoopTimer) {
                clearInterval(wallAutoLoopTimer);
                wallAutoLoopTimer = null;
            }
        }
        res.json({ success: true, autoLoop: !!wallAutoLoopTimer });
    });

    // Set 100-Phone Wall display mode
    router.post('/wall/mode', (req, res) => {
        const { mode } = req.body;
        const validModes = ['synced_logo', 'multilingual', 'video_mosaic', 'ambient'];
        const chosenMode = validModes.includes(mode) ? mode : 'multilingual';

        eventStore.update(st => {
            st.phoneWall.currentMode = chosenMode;
        });

        broadcast('WALL_MODE_CHANGE', {
            mode: chosenMode,
            timestamp: Date.now()
        });

        res.json({ success: true, mode: chosenMode });
    });

    // Real-Time System Audit Log Feed
    const auditLogs = [
        { id: 1, type: 'GATE', message: 'Attendee T. Rahman (CCO Banglalink) checked in', timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString() },
        { id: 2, type: 'STAGE', message: 'Stage Scene switched to Scene 1: Ambient Walk-In', timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString() },
        { id: 3, type: 'WALL', message: '100-Phone Wall synchronized to Multilingual Bangla wave', timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString() },
        { id: 4, type: 'BOOTH', message: 'Ad proposal PROP-2026-9481 generated for Mindshare / Unilever', timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString() },
        { id: 5, type: 'BOOTH', message: 'AI Dub take completed (Noakhali dialect) at The Dub Booth', timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString() },
        { id: 6, type: 'BATTLE', message: 'Sonic Battle voting opened for crowd participation', timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString() }
    ];

    router.get('/system/audit-log', requireDirectorAuth, (req, res) => {
        res.json({ success: true, logs: auditLogs });
    });

    router.post('/system/audit', requireDirectorAuth, (req, res) => {
        const { type, message } = req.body;
        const entry = {
            id: Date.now(),
            type: type || 'SYSTEM',
            message: message || 'Director action logged',
            timestamp: new Date().toLocaleTimeString()
        };
        auditLogs.unshift(entry);
        if (auditLogs.length > 80) auditLogs.pop();
        broadcast('AUDIT_EVENT', entry);
        res.json({ success: true, entry });
    });

    // Master Showcaller System Reset (Protected by Auth)
    router.post('/system/reset', requireDirectorAuth, (req, res) => {
        const resetState = eventStore.resetToBaseline();
        broadcast('STAGE_SCENE_CHANGE', {
            scene: resetState.stageScene,
            speaker: resetState.stageSpeaker
        });
        broadcast('STAGE_CONTROL', {
            action: 'reset',
            voting: resetState.votingEngine
        });
        res.json({ success: true, message: 'All event states successfully reset to baseline defaults.', state: resetState });
    });

    return router;
};
