const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

// Services & Security
const eventStore = require('./services/eventStore');
const aiProvider = require('./services/aiProvider');
const { sanitizeBody, setupProcessProtection } = require('./middleware/security');

// Process Uncaught Exception Guard
setupProcessProtection();

// Hydrate / Initialize Event State Persistence
eventStore.init();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Universal XSS Sanitizer Middleware on all request bodies
app.use(sanitizeBody);

// Serve static assets from client/public (with strict no-cache for HTML files to prevent stale browser caching)
app.use(express.static(path.join(__dirname, '../client/public'), {
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
    }
}));

// Serve local media uploads (posters & video clips)
app.use('/api/media', express.static(path.join(__dirname, 'data/media')));

// WebSocket Channel & Room Broadcast Helper
function broadcast(type, data, room = null) {
    const payload = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            // If room targeted, send to matching room or wildcard subscribers
            if (!room || !client.room || client.room === room || client.room === 'all') {
                client.send(payload);
            }
        }
    });
}

// ==========================================
// Modular API Route Mounting
// ==========================================
const rsvpsFilePath = path.join(__dirname, 'rsvps.json');

const stageRoutes = require('./routes/stageRoutes')(eventStore, broadcast);
const voteRoutes = require('./routes/voteRoutes')(eventStore, broadcast);
const gateRoutes = require('./routes/gateRoutes')(eventStore, broadcast, rsvpsFilePath);
const boothRoutes = require('./routes/boothRoutes')(eventStore, broadcast, aiProvider);
const systemRoutes = require('./routes/systemRoutes')(eventStore, broadcast, aiProvider, wss);

app.use('/api/stage', stageRoutes);
app.use('/api', voteRoutes);
app.use('/api', gateRoutes);
app.use('/api/booth', boothRoutes);
app.use('/api', systemRoutes);

// ==========================================
// Page Routing (Single Clean Mappings)
// ==========================================
const clientPublic = path.join(__dirname, '../client/public');

// Core Summit Surfaces
app.get('/', (req, res) => res.sendFile(path.join(clientPublic, 'landing.html')));
app.get('/hub', (req, res) => res.sendFile(path.join(clientPublic, 'hub.html')));
app.get('/stage', (req, res) => res.sendFile(path.join(clientPublic, 'stage.html')));
app.get('/portal', (req, res) => res.sendFile(path.join(clientPublic, 'portal.html')));
app.get('/gate', (req, res) => res.sendFile(path.join(clientPublic, 'gate.html')));
app.get('/invite', (req, res) => res.sendFile(path.join(clientPublic, 'greetings.html')));
app.get('/greetings', (req, res) => res.sendFile(path.join(clientPublic, 'greetings.html')));

// Mobile Audience Keynote Interaction Surfaces
app.get('/vote', (req, res) => res.sendFile(path.join(clientPublic, 'vote.html')));
app.get('/marathon', (req, res) => res.sendFile(path.join(clientPublic, 'marathon.html')));
app.get('/race', (req, res) => res.sendFile(path.join(clientPublic, 'marathon.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(clientPublic, 'dashboard.html')));
app.get('/thisorthat', (req, res) => res.sendFile(path.join(clientPublic, 'dashboard.html')));
app.get('/capsule', (req, res) => res.sendFile(path.join(clientPublic, 'capsule.html')));
app.get('/wrapped', (req, res) => res.sendFile(path.join(clientPublic, 'capsule.html')));

// 100-Phone Wall Surfaces
app.get('/wall', (req, res) => res.sendFile(path.join(clientPublic, 'wall.html')));
app.get('/wall/phone', (req, res) => res.sendFile(path.join(clientPublic, 'phone.html')));
app.get('/phone', (req, res) => res.sendFile(path.join(clientPublic, 'phone.html')));

// Experiential Venue Booth Activations (9 Activations)
app.get('/booth/mission-control', (req, res) => res.sendFile(path.join(clientPublic, 'mission-control.html')));
app.get('/mission-control', (req, res) => res.sendFile(path.join(clientPublic, 'mission-control.html')));
app.get('/booth/dub', (req, res) => res.sendFile(path.join(clientPublic, 'dub-booth.html')));
app.get('/booth/screen-relay', (req, res) => res.sendFile(path.join(clientPublic, 'screen-relay.html')));
app.get('/booth/space-window', (req, res) => res.sendFile(path.join(clientPublic, 'space-window.html')));
app.get('/booth/capsule-booth', (req, res) => res.sendFile(path.join(clientPublic, 'capsule-booth.html')));
app.get('/booth/fringe', (req, res) => res.sendFile(path.join(clientPublic, 'fringe-hub.html')));
app.get('/booth/universe', (req, res) => res.sendFile(path.join(clientPublic, 'universe-kiosk.html')));
app.get('/booth/universe-wall', (req, res) => res.sendFile(path.join(clientPublic, 'universe-wall.html')));
app.get('/booth/taste-duel', (req, res) => res.sendFile(path.join(clientPublic, 'taste-duel.html')));

// Toffee OTT AI Casting Audition Activations
app.get('/booth/audition', (req, res) => res.sendFile(path.join(clientPublic, 'audition-booth.html')));
app.get('/audition', (req, res) => res.sendFile(path.join(clientPublic, 'audition-booth.html')));
app.get('/casting', (req, res) => res.sendFile(path.join(clientPublic, 'casting-curator.html')));
app.get('/curator', (req, res) => res.sendFile(path.join(clientPublic, 'casting-curator.html')));
app.get('/presenter', (req, res) => res.sendFile(path.join(clientPublic, 'presenter-remote.html')));
app.get('/mc', (req, res) => res.sendFile(path.join(clientPublic, 'presenter-remote.html')));

// Role-Based Architecture Aliases (EOS 2.0)
app.get('/attendee/audition', (req, res) => res.sendFile(path.join(clientPublic, 'audition-booth.html')));
app.get('/crew/curator', (req, res) => res.sendFile(path.join(clientPublic, 'casting-curator.html')));
app.get('/crew/mc', (req, res) => res.sendFile(path.join(clientPublic, 'presenter-remote.html')));
app.get('/stage/led', (req, res) => res.sendFile(path.join(clientPublic, 'stage.html')));

// ==========================================
// WebSocket Connection Lifecycle Handling
// ==========================================
wss.on('connection', (ws) => {
    ws.room = 'all'; // Default room
    const currentState = eventStore.getState();

    // Send complete hydrated state snapshot immediately on connection
    ws.send(JSON.stringify({
        type: 'INIT_STATE',
        data: {
            voting: currentState.votingEngine,
            phoneWall: {
                currentMode: currentState.phoneWall.currentMode,
                serverTime: Date.now()
            },
            telemetry: currentState.telemetry,
            stageScene: currentState.stageScene,
            stageSpeaker: currentState.stageSpeaker,
            marathonRace: currentState.marathonRace,
            personalDashboard: {
                status: currentState.personalDashboard.status,
                currentRoundIndex: currentState.personalDashboard.currentRoundIndex,
                round: {
                    ...currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex],
                    pctA: Math.round((currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex].optionA.votes / (currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex].optionA.votes + currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex].optionB.votes)) * 100),
                    pctB: 100 - Math.round((currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex].optionA.votes / (currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex].optionA.votes + currentState.personalDashboard.rounds[currentState.personalDashboard.currentRoundIndex].optionB.votes)) * 100)
                }
            },
            capsuleWrapped: currentState.capsuleWrapped,
            ottAudition: currentState.ottAudition
        }
    }));

    ws.on('message', (raw) => {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'SUBSCRIBE') {
                ws.room = parsed.room || 'all';
            } else if (parsed.type === 'REGISTER_PHONE') {
                eventStore.update(st => {
                    st.phoneWall.activePhones[parsed.phoneId] = Date.now();
                });
                broadcast('PHONE_REGISTRATION', {
                    phoneId: parsed.phoneId,
                    totalActive: Object.keys(eventStore.getState().phoneWall.activePhones).length
                });
            } else if (parsed.type === 'CAST_VOTE') {
                const opt = parsed.option;
                if (eventStore.getState().votingEngine.options[opt]) {
                    eventStore.update(st => {
                        st.votingEngine.options[opt].votes += 1;
                    });
                    broadcast('VOTE_UPDATE', eventStore.getState().votingEngine);
                }
            }
        } catch (err) {
            console.error('[WS] Message parse error:', err);
        }
    });

    ws.on('close', () => {
        // Closed socket automatically handled by wss.clients
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[ToffeeCon EOS Core] Live on http://localhost:${PORT}`);
    console.log(`  - Apex Mission Control: http://localhost:${PORT}/hub`);
    console.log(`  - 3-Screen Mainstage LED: http://localhost:${PORT}/stage`);
    console.log(`  - Portal to a New Era: http://localhost:${PORT}/portal`);
    console.log(`  - Crash-Proof State Engine: ACTIVE (server/data/event_state.json)`);
});
