const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const WebSocket = require('ws');
const { server, startServer, stopServer, broadcast } = require('../server/server');
const eventStore = require('../server/services/eventStore');

describe('WebSocket PubSub Test Suite', () => {
    let didStartServer = false;

    before(async () => {
        if (!server.listening) {
            await startServer(5000);
            didStartServer = true;
        }
    });

    after(async () => {
        if (didStartServer) {
            await stopServer();
        }
    });

    test('Connect to ws://localhost:5000, subscribe to room, cast vote, and verify clean closure', async () => {
        const ws = new WebSocket('ws://localhost:5000');
        const messageQueue = [];
        const listeners = [];

        ws.on('message', (raw) => {
            try {
                const parsed = JSON.parse(raw.toString());
                const matchIndex = listeners.findIndex((l) => l.filter(parsed));
                if (matchIndex !== -1) {
                    const [matched] = listeners.splice(matchIndex, 1);
                    matched.resolve(parsed);
                } else {
                    messageQueue.push(parsed);
                }
            } catch (_) {}
        });

        function waitForMessage(filterFn, timeoutMs = 4000) {
            const queuedIndex = messageQueue.findIndex(filterFn);
            if (queuedIndex !== -1) {
                const [msg] = messageQueue.splice(queuedIndex, 1);
                return Promise.resolve(msg);
            }

            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    const idx = listeners.findIndex((l) => l.resolve === resolve);
                    if (idx !== -1) listeners.splice(idx, 1);
                    reject(new Error(`Timeout waiting for WebSocket message (${timeoutMs}ms)`));
                }, timeoutMs);

                listeners.push({
                    filter: filterFn,
                    resolve: (val) => {
                        clearTimeout(timer);
                        resolve(val);
                    }
                });
            });
        }

        // Wait for connection to establish
        await new Promise((resolve, reject) => {
            ws.once('open', resolve);
            ws.once('error', reject);
        });
        assert.strictEqual(ws.readyState, WebSocket.OPEN, 'WebSocket connection should be open');

        // Receive INIT_STATE snapshot
        const initMsg = await waitForMessage((m) => m.type === 'INIT_STATE');
        assert.strictEqual(initMsg.type, 'INIT_STATE');
        assert.ok(initMsg.data, 'INIT_STATE payload should be present');

        // 1. Send SUBSCRIBE to room "stage" and assert subscription
        const subPromise = waitForMessage((m) => m.type === 'SUBSCRIBED' && m.room === 'stage');
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', room: 'stage' }));
        const subResponse = await subPromise;
        assert.strictEqual(subResponse.type, 'SUBSCRIBED');
        assert.strictEqual(subResponse.room, 'stage');

        // Test room broadcast delivery to "stage"
        const broadcastPromise = waitForMessage((m) => m.type === 'STAGE_CUE');
        broadcast('STAGE_CUE', { action: 'lighting_dim' }, 'stage');
        const broadcastMsg = await broadcastPromise;
        assert.strictEqual(broadcastMsg.type, 'STAGE_CUE');
        assert.strictEqual(broadcastMsg.data.action, 'lighting_dim');

        // 2. Send CAST_VOTE for optionA and assert VOTE_UPDATE delivery
        const initialVotes = eventStore.getState().votingEngine.options.red.votes;
        const votePromise = waitForMessage((m) => m.type === 'VOTE_UPDATE');
        ws.send(JSON.stringify({ type: 'CAST_VOTE', option: 'optionA' }));
        const voteMsg = await votePromise;
        assert.strictEqual(voteMsg.type, 'VOTE_UPDATE');
        assert.strictEqual(voteMsg.data.options.red.votes, initialVotes + 1, 'Vote option count should increment by 1');

        // Restore initial vote count and persist cleanly
        eventStore.update((st) => {
            st.votingEngine.options.red.votes = initialVotes;
        });
        eventStore.persist();

        // 3. Verify clean socket closure without leaking open handles
        const closePromise = new Promise((resolve) => {
            ws.once('close', (code, reason) => {
                resolve({ code, reason });
            });
        });

        ws.close();
        await closePromise;
        assert.strictEqual(ws.readyState, WebSocket.CLOSED, 'WebSocket should be cleanly closed');
    });
});
