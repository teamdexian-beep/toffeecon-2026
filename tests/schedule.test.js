const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { app } = require('../server/server');
const scheduleStore = require('../server/stores/scheduleStore');
const eventStore = require('../server/services/eventStore');

describe('Dynamic 12-Beat Event Schedule Engine & API Test Suite', () => {
    let testServer;
    let baseUrl;
    const DIRECTOR_AUTH = 'toffeecon-2026-secure';

    before(async () => {
        // Ensure clean canonical state
        scheduleStore.resetToDefault();
        await new Promise((resolve) => {
            testServer = app.listen(0, () => {
                const port = testServer.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        // Restore default seed upon suite completion
        scheduleStore.resetToDefault();
        if (testServer) {
            await new Promise((resolve) => testServer.close(resolve));
        }
    });

    // 1. Data Store & Verbatim Ingestion Tests
    describe('Schedule Store Ingestion & Schema Integrity', () => {
        test('Store holds exactly 12 canonical beats for Day 1', () => {
            const beats = scheduleStore.getSchedule({ day: 1 });
            assert.strictEqual(beats.length, 12, 'Expected exactly 12 canonical beats');
        });

        test('All 12 beats strictly adhere to required schema', () => {
            const beats = scheduleStore.getSchedule({ day: 1 });
            beats.forEach((b, idx) => {
                assert.ok(b.id, `Beat #${idx + 1} must have an id`);
                assert.strictEqual(b.order, idx + 1, `Beat #${idx + 1} must have order ${idx + 1}`);
                assert.ok(b.time, `Beat #${idx + 1} must have time string`);
                assert.ok(b.startTime, `Beat #${idx + 1} must have startTime`);
                assert.strictEqual(typeof b.durationMinutes, 'number', `Beat #${idx + 1} duration must be number`);
                assert.ok(['PROGRAM', 'KEYNOTE', 'PARTNER'].includes(b.type), `Beat #${idx + 1} type invalid: ${b.type}`);
                assert.ok(b.title, `Beat #${idx + 1} must have title`);
                assert.ok(b.details !== undefined, `Beat #${idx + 1} must have details`);
                assert.ok(b.stage, `Beat #${idx + 1} must have stage`);
                assert.ok(['UPCOMING', 'LIVE', 'COMPLETED'].includes(b.status), `Beat #${idx + 1} status invalid: ${b.status}`);
            });
        });

        test('Verbatim key checkpoints match official evening run of show', () => {
            const beats = scheduleStore.getSchedule({ day: 1 });

            // Beat 1: Arrival
            assert.strictEqual(beats[0].id, 'beat-01');
            assert.strictEqual(beats[0].time, '6:00 PM');
            assert.strictEqual(beats[0].title, 'Arrival');
            assert.strictEqual(beats[0].details, 'Entry & buffer');

            // Beat 4: Keynote 1 (Taimur Rahman)
            assert.strictEqual(beats[3].id, 'beat-04');
            assert.strictEqual(beats[3].time, '7:04 PM');
            assert.strictEqual(beats[3].type, 'KEYNOTE');
            assert.strictEqual(beats[3].speaker, 'Taimur Rahman');
            assert.strictEqual(beats[3].designation, 'CCRO');

            // Beat 5: Content Partner
            assert.strictEqual(beats[4].id, 'beat-05');
            assert.strictEqual(beats[4].time, '7:07 PM');
            assert.strictEqual(beats[4].type, 'PARTNER');

            // Beat 6: BCB · BFF
            assert.strictEqual(beats[5].id, 'beat-06');
            assert.strictEqual(beats[5].time, '7:35 PM');
            assert.strictEqual(beats[5].type, 'PARTNER');

            // Beat 7: Keynote 2 (Modasser Ahmed)
            assert.strictEqual(beats[6].id, 'beat-07');
            assert.strictEqual(beats[6].time, '7:39 PM');
            assert.strictEqual(beats[6].type, 'KEYNOTE');
            assert.strictEqual(beats[6].speaker, 'Modasser Ahmed');
            assert.strictEqual(beats[6].designation, 'Dy. Director');

            // Beat 8: Martech (CleverTap/Mixpanel)
            assert.strictEqual(beats[7].id, 'beat-08');
            assert.strictEqual(beats[7].time, '8:07 PM');
            assert.strictEqual(beats[7].type, 'PARTNER');

            // Beat 9: Keynote 3 (Johan Buse)
            assert.strictEqual(beats[8].id, 'beat-09');
            assert.strictEqual(beats[8].time, '8:11 PM');
            assert.strictEqual(beats[8].type, 'KEYNOTE');
            assert.strictEqual(beats[8].speaker, 'Johan Buse');
            assert.strictEqual(beats[8].designation, 'CEO');

            // Beat 12: Finger Food
            assert.strictEqual(beats[11].id, 'beat-12');
            assert.strictEqual(beats[11].time, '9:11 PM');
            assert.strictEqual(beats[11].title, 'Finger Food');
        });
    });

    // 2. Public Query Endpoints
    describe('Public Schedule Query Endpoints', () => {
        test('GET /api/schedule returns HTTP 200 with 12 beats and metadata', async () => {
            const res = await fetch(`${baseUrl}/api/schedule`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.day, 1);
            assert.strictEqual(data.totalBeats, 12);
            assert.strictEqual(data.schedule.length, 12);
            assert.ok(data.activeBeatId);
            assert.ok(data.date);
            assert.ok(data.lastUpdated);
        });

        test('GET /api/schedule?type=KEYNOTE filters only keynote beats', async () => {
            const res = await fetch(`${baseUrl}/api/schedule?type=KEYNOTE`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.totalBeats, 3);
            data.schedule.forEach(b => {
                assert.strictEqual(b.type, 'KEYNOTE');
            });
        });

        test('GET /api/schedule/current returns active beat', async () => {
            const res = await fetch(`${baseUrl}/api/schedule/current`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.currentBeat);
            assert.ok(data.activeBeatId);
        });

        test('GET /api/schedule/:id returns single beat', async () => {
            const res = await fetch(`${baseUrl}/api/schedule/beat-04`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.beat.id, 'beat-04');
            assert.strictEqual(data.beat.speaker, 'Taimur Rahman');
        });

        test('GET /api/schedule/:id with unknown id returns 404', async () => {
            const res = await fetch(`${baseUrl}/api/schedule/beat-unknown-999`);
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });
    });

    // 3. Director Guarded Update RPC Endpoints
    describe('Director Guarded Schedule Update RPC Endpoints', () => {
        test('PUT /api/schedule without director auth returns 401 Unauthorized', async () => {
            const res = await fetch(`${baseUrl}/api/schedule`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    beatId: 'beat-04',
                    updates: { time: '7:15 PM' }
                })
            });
            assert.strictEqual(res.status, 401);
        });

        test('PUT /api/schedule with director auth updates beat and creates audit log', async () => {
            const res = await fetch(`${baseUrl}/api/schedule`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-director-auth': DIRECTOR_AUTH
                },
                body: JSON.stringify({
                    beatId: 'beat-04',
                    updates: {
                        time: '7:08 PM',
                        status: 'LIVE'
                    }
                })
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);

            // Verify store updated
            const beat4 = scheduleStore.getBeatById('beat-04');
            assert.strictEqual(beat4.time, '7:08 PM');
            assert.strictEqual(beat4.status, 'LIVE');

            // Verify eventStore audit log entry was added
            const logs = eventStore.getAuditLogs ? eventStore.getAuditLogs(10) : [];
            const auditEntry = logs.find(l => l.channel === 'DIRECTOR_ACTION');
            assert.ok(auditEntry, 'Expected DIRECTOR_ACTION audit entry in eventStore');
        });

        test('PUT /api/schedule/:id updates specific beat directly', async () => {
            const res = await fetch(`${baseUrl}/api/schedule/beat-09`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-director-auth': DIRECTOR_AUTH
                },
                body: JSON.stringify({
                    time: '8:15 PM',
                    details: 'Adjusted closing keynote buffer'
                })
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.beat.time, '8:15 PM');
            assert.strictEqual(data.beat.details, 'Adjusted closing keynote buffer');
        });

        test('POST /api/schedule/reset restores canonical 12-beat seed', async () => {
            const res = await fetch(`${baseUrl}/api/schedule/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-director-auth': DIRECTOR_AUTH
                }
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);

            // Verify restored
            const beat4 = scheduleStore.getBeatById('beat-04');
            assert.strictEqual(beat4.time, '7:04 PM');
            assert.strictEqual(beat4.status, 'UPCOMING');
        });
    });
});
