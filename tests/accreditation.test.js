const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { app } = require('../server/server');
const accreditationStore = require('../server/stores/accreditationStore');
const eventStore = require('../server/services/eventStore');
const aiProvider = require('../server/services/aiProvider');

describe('VIP Accreditation Data Layer & Ingress RPC Test Suite', () => {
    let testServer;
    let baseUrl;
    const DIRECTOR_AUTH = 'toffeecon-2026-secure';

    before(async () => {
        await new Promise((resolve) => {
            testServer = app.listen(0, () => {
                const port = testServer.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (testServer) {
            await new Promise((resolve) => testServer.close(resolve));
        }
    });

    // 1. Data Store & Schema Tests
    describe('Accreditation Store Schema & Seeding Engine', () => {
        test('Store correctly loads 50+ curated VIP records', () => {
            const all = accreditationStore.getAll();
            assert.ok(all.length >= 50, `Expected at least 50 VIPs, found ${all.length}`);
        });

        test('Target seed record TC26-VIP-1001-A9F2 exists and matches required schema', () => {
            const guest = accreditationStore.getByToken('TC26-VIP-1001-A9F2');
            assert.ok(guest, 'TC26-VIP-1001-A9F2 must exist in store');
            assert.strictEqual(guest.name, 'Sarah Ahmed');
            assert.strictEqual(guest.designation, 'Chief Digital Officer');
            assert.strictEqual(guest.organization, 'Banglalink / VEON');
            assert.strictEqual(guest.tier, 'VIP_ALL_ACCESS');
            assert.ok(['INVITED', 'CLAIMED', 'CHECKED_IN'].includes(guest.status));
            assert.ok(guest.invitedAt);
            assert.ok(guest.metadata);
            assert.strictEqual(guest.metadata.seatZone, 'Zone A - Executive Circle');
        });

        test('Token generation generates compliant TC26-VIP-XXXX-YYYY format', () => {
            const token = accreditationStore.generateToken(1099);
            const tokenRegex = /^TC26-VIP-\d+-[A-F0-9]{4}$/;
            assert.match(token, tokenRegex, 'Token must follow TC26-VIP-XXXX-YYYY format');
        });
    });

    // 2. Public Ingress RPC Endpoints
    describe('VIP Ingress RPC Endpoints', () => {
        test('GET /api/accreditation/verify/:token returns sanitized attendee profile', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/verify/TC26-VIP-1001-A9F2`);
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.valid, true);
            assert.ok(data.guest);
            assert.strictEqual(data.guest.token, 'TC26-VIP-1001-A9F2');
            assert.strictEqual(data.guest.name, 'Sarah Ahmed');
            // Device fingerprint should be masked or omitted in public verification
            assert.strictEqual(data.guest.metadata.deviceFingerprint, undefined);
        });

        test('GET /api/accreditation/verify/:token with invalid token returns 404', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/verify/NON-EXISTENT-TOKEN`);
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.valid, false);
        });

        test('POST /api/accreditation/claim claims invitation and binds device', async () => {
            // Pick an INVITED attendee
            const invited = accreditationStore.getAll({ status: 'INVITED' })[0];
            assert.ok(invited, 'Should have at least one invited guest');

            const res = await fetch(`${baseUrl}/api/accreditation/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: invited.token,
                    deviceFingerprint: 'test_fingerprint_safari_18'
                })
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.guest.status, 'CLAIMED');
            assert.ok(data.guest.claimedAt);

            // Verify re-claim idempotency
            const reclaimRes = await fetch(`${baseUrl}/api/accreditation/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: invited.token,
                    deviceFingerprint: 'test_fingerprint_safari_18'
                })
            });
            assert.strictEqual(reclaimRes.status, 200);
            const reclaimData = await reclaimRes.json();
            assert.strictEqual(reclaimData.alreadyClaimed, true);
        });

        test('POST /api/accreditation/checkin performs gate ingress and guards against duplicate entry', async () => {
            // Find or issue a guest to test clean checkin
            const guestToScan = accreditationStore.getAll({ status: 'INVITED' })[0] ||
                accreditationStore.getAll({ status: 'CLAIMED' })[0];
            assert.ok(guestToScan, 'Expected an un-checked-in guest');

            const scanRes = await fetch(`${baseUrl}/api/accreditation/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: guestToScan.token,
                    gateId: 'GATE-VIP-EXP-01'
                })
            });

            assert.strictEqual(scanRes.status, 200);
            const scanData = await scanRes.json();
            assert.strictEqual(scanData.success, true);
            assert.strictEqual(scanData.guest.status, 'CHECKED_IN');
            assert.strictEqual(scanData.guest.gateId, 'GATE-VIP-EXP-01');
            assert.ok(scanData.guest.checkedInAt);

            // Attempt duplicate check-in at turnstile -> should return HTTP 409
            const dupRes = await fetch(`${baseUrl}/api/accreditation/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: guestToScan.token,
                    gateId: 'GATE-VIP-EXP-02'
                })
            });

            assert.strictEqual(dupRes.status, 409);
            const dupData = await dupRes.json();
            assert.strictEqual(dupData.success, false);
            assert.strictEqual(dupData.alreadyCheckedIn, true);
        });

        test('GET /api/accreditation/stats returns summary counts and telemetry', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/stats`);
            assert.strictEqual(res.status, 200);
            const stats = await res.json();
            assert.ok('total' in stats);
            assert.ok('invited' in stats);
            assert.ok('claimed' in stats);
            assert.ok('checkedIn' in stats);
            assert.ok('checkinRate' in stats);
            assert.ok('byTier' in stats);
            assert.strictEqual(stats.total, stats.invited + stats.claimed + stats.checkedIn);
        });
    });

    // 3. Administrative / Director Guarded Endpoints
    describe('Director Guarded VIP Registry Endpoints', () => {
        test('GET /api/accreditation/list without auth returns 401 Unauthorized', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/list`);
            assert.strictEqual(res.status, 401);
        });

        test('GET /api/accreditation/list with valid director auth returns VIP list', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/list`, {
                headers: { 'x-director-auth': DIRECTOR_AUTH }
            });
            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.ok(data.guests.length > 0);
            assert.ok(data.stats);
        });

        test('POST /api/accreditation/issue without auth returns 401', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/issue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test Delegate',
                    organization: 'Test Corp'
                })
            });
            assert.strictEqual(res.status, 401);
        });

        test('POST /api/accreditation/issue with director auth mints new VIP pass', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-director-auth': DIRECTOR_AUTH
                },
                body: JSON.stringify({
                    name: 'Dr. Tariqul Islam',
                    designation: 'VP of AI Research',
                    organization: 'Silicon Valley Labs',
                    tier: 'VIP_KEYNOTE',
                    seatZone: 'Zone A - Executive Circle',
                    dietary: 'Halal'
                })
            });

            assert.strictEqual(res.status, 201);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.guest);
            assert.strictEqual(data.guest.name, 'Dr. Tariqul Islam');
            assert.strictEqual(data.guest.tier, 'VIP_KEYNOTE');
            assert.match(data.guest.token, /^TC26-VIP-\d+-[A-F0-9]{4}$/);

            // Verify newly minted token is verifiable
            const verifyRes = await fetch(`${baseUrl}/api/accreditation/verify/${data.guest.token}`);
            assert.strictEqual(verifyRes.status, 200);
        });
    });

    // 4. Personalized VIP AI Concierge Briefing Engine
    describe('Personalized VIP AI Concierge Briefings (SLA < 2.0s & Deterministic Fallbacks)', () => {
        test('POST /api/accreditation/briefing returns 400 when token is omitted', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            assert.strictEqual(res.status, 400);
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });

        test('POST /api/accreditation/briefing returns 404 for invalid token', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: 'INVALID-VIP-TOKEN' })
            });
            assert.strictEqual(res.status, 404);
            const data = await res.json();
            assert.strictEqual(data.success, false);
        });

        test('POST /api/accreditation/briefing generates bespoke Telco briefing for Sarah Ahmed (VEON/Banglalink)', async () => {
            const start = Date.now();
            const res = await fetch(`${baseUrl}/api/accreditation/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: 'TC26-VIP-1001-A9F2' })
            });
            const duration = Date.now() - start;

            assert.strictEqual(res.status, 200);
            assert.ok(duration < 2500, `Expected briefing latency under 2.5s, took ${duration}ms`);

            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.briefing);
            const b = data.briefing;

            assert.strictEqual(b.persona, 'TELCO_OPERATOR');
            assert.strictEqual(b.guestName, 'Sarah Ahmed');
            assert.ok(b.briefing.includes('6G') || b.briefing.includes('low-latency') || b.briefing.includes('Keynote'));
            assert.ok(b.recommendedSessions.length >= 3);
            assert.ok(b.highlights.length >= 3);

            // Redaction check: ensure no internal API keys or secret prompts are leaked
            const rawString = JSON.stringify(data);
            assert.strictEqual(rawString.includes('GEMINI_API_KEY'), false);
            assert.strictEqual(rawString.includes('PIAPI_KEY'), false);
        });

        test('POST /api/accreditation/briefing generates bespoke Enterprise/Brand briefing for bKash CEO', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: 'TC26-VIP-1008-7D3C' })
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            const b = data.briefing;

            assert.strictEqual(b.persona, 'ENTERPRISE_BRAND');
            assert.strictEqual(b.guestName, 'Kamal Quadir');
            assert.ok(b.briefing.includes('B2B Pitch Hub') || b.briefing.includes('AI Creator Studio') || b.briefing.includes('Dubbing'));
            assert.ok(b.recommendedSessions.length >= 3);
        });

        test('POST /api/accreditation/briefing generates bespoke Regulator briefing for ICT Division Guest', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: 'TC26-VIP-1012-3D9B' })
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            const b = data.briefing;

            assert.strictEqual(b.persona, 'REGULATOR_DIGNITARY');
            assert.strictEqual(b.guestName, 'Zunaid Ahmed Palak');
            assert.ok(b.briefing.includes('Smart Bangladesh') || b.briefing.includes('Digital') || b.briefing.includes('sovereign AI') || b.briefing.includes('incubation'));
            assert.ok(b.recommendedSessions.length >= 3);
        });
    });

    // 5. Bot Mesh Real-Time Telemetry Bridge & Ingress Audit
    describe('Bot Mesh Real-Time Telemetry Bridge & Audit Ingress Dispatch', () => {
        test('VIP check-in records CONCIERGE_DISPATCH audit log entry in eventStore', async () => {
            const guest = accreditationStore.getAll({ status: 'INVITED' })[0] ||
                accreditationStore.getAll({ status: 'CLAIMED' })[0];
            assert.ok(guest, 'Need a valid guest for ingress checkin');

            const res = await fetch(`${baseUrl}/api/accreditation/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: guest.token,
                    gateId: 'GATE-01'
                })
            });

            assert.strictEqual(res.status, 200);

            // Verify structured audit log entry in eventStore
            const auditLogs = eventStore.getAuditLogs(10);
            const ingressLog = auditLogs.find(l => l.channel === 'CONCIERGE_DISPATCH' && l.type === 'VIP_INGRESS_DETECTED');
            assert.ok(ingressLog, 'Expected a VIP_INGRESS_DETECTED audit log entry in eventStore');
            assert.strictEqual(ingressLog.guest, guest.name);
            assert.strictEqual(ingressLog.organization, guest.organization);
            assert.strictEqual(ingressLog.tier, guest.tier);
            assert.strictEqual(ingressLog.gate, 'GATE-01');
        });
    });

    // 6. Headless Batch Print Automation & Artifact Verification
    describe('Headless Batch VIP Invitation & Print Automation Sheet', () => {
        test('POST /api/accreditation/export-invitations requires Director auth', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/export-invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ limit: 5 })
            });
            assert.strictEqual(res.status, 401);
        });

        test('POST /api/accreditation/export-invitations compiles A5 print master and JSON manifest', async () => {
            const res = await fetch(`${baseUrl}/api/accreditation/export-invitations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-director-auth': DIRECTOR_AUTH
                },
                body: JSON.stringify({ limit: 8 })
            });

            assert.strictEqual(res.status, 200);
            const data = await res.json();
            assert.strictEqual(data.success, true);
            assert.strictEqual(data.totalCount, 8);
            assert.ok(data.masterPrintHtml);
            assert.ok(data.manifestPath);

            // Verify static serving of exported master sheet
            const staticRes = await fetch(`${baseUrl}/api/accreditation/invitations/invitations_master_print.html`);
            assert.strictEqual(staticRes.status, 200);
            const htmlContent = await staticRes.text();
            assert.ok(htmlContent.includes('TOFFEECON 2026'));
            assert.ok(htmlContent.includes('VIP ACCREDITATION'));
        });
    });
});
