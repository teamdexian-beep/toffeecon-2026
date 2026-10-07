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

    // Diagnostics & Health Endpoint
    router.get('/diagnostics', (req, res) => {
        const state = eventStore.getState();
        res.json({
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage(),
            connectedClients: wss.clients ? wss.clients.size : 0,
            autoLoopActive: !!wallAutoLoopTimer,
            eventState: state
        });
    });

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

    // Update AI Provider configuration
    router.post('/ai/config', (req, res) => {
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
