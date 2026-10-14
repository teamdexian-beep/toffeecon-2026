const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { app } = require('../server/server');
const aiProvider = require('../server/services/aiProvider');

describe('AI Media Pipeline & Generative Dubbing Test Suite', () => {
    let testServer;
    let baseUrl;
    let originalGeminiKey;

    before(async () => {
        originalGeminiKey = process.env.GEMINI_API_KEY;
        await new Promise((resolve) => {
            testServer = app.listen(0, () => {
                const port = testServer.address().port;
                baseUrl = `http://127.0.0.1:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        process.env.GEMINI_API_KEY = originalGeminiKey;
        if (testServer) {
            await new Promise((resolve) => testServer.close(resolve));
        }
    });

    // 1. Resilience & Fallback Tests for aiProvider methods
    describe('Gemini AI Provider Resilience & Deterministic Fallbacks', () => {
        test('Gracefully detects missing or invalid GEMINI_API_KEY and returns local status', () => {
            delete process.env.GEMINI_API_KEY;
            assert.strictEqual(aiProvider.isGeminiAvailable(), false, 'Expected isGeminiAvailable to be false when unset');

            process.env.GEMINI_API_KEY = 'invalid_dummy_placeholder_key';
            assert.strictEqual(aiProvider.isGeminiAvailable(), false, 'Expected isGeminiAvailable to be false for placeholder key');

            process.env.GEMINI_API_KEY = 'short';
            assert.strictEqual(aiProvider.isGeminiAvailable(), false, 'Expected isGeminiAvailable to be false for short string');

            delete process.env.GEMINI_API_KEY;
        });

        test('generatePoster returns deterministic high-quality fallback payload when key is unset', async () => {
            delete process.env.GEMINI_API_KEY;
            const result = await aiProvider.generatePoster({
                guestName: 'Summit VIP Attendee',
                genre: 'football'
            });

            assert.strictEqual(result.success, true);
            assert.ok(result.posterId.startsWith('UNIV-'));
            assert.strictEqual(result.genre, 'football');
            assert.ok(result.template && result.template.title);
            assert.ok(result.posterUrl);
            assert.strictEqual(result.providerUsed, 'local_procedural_compositor');
            assert.ok(result.generationTimeMs < 5000, 'Poster generation must be fast');
        });

        test('generateDubTake returns deterministic dialect translation and voice track metadata', async () => {
            delete process.env.GEMINI_API_KEY;
            const startTime = Date.now();
            const result = await aiProvider.generateDubTake({
                speakerName: 'Anik Rahman',
                text: 'ছু মন্তর ছু কালিপুত্তের গু! মামা খেলা হবে!',
                targetDialect: 'japanese'
            });
            const durationMs = Date.now() - startTime;

            assert.strictEqual(result.success, true);
            assert.ok(result.dubId.startsWith('DUB-'));
            assert.strictEqual(result.dialectKey, 'japanese');
            assert.strictEqual(result.speakerName, 'Anik Rahman');
            assert.ok(result.translatedText.length > 0);
            assert.ok(result.phoneticText.length > 0);
            assert.strictEqual(result.providerUsed, 'local_phonetic_engine');
            assert.ok(result.audioUrl.includes('/api/media/'));
            assert.ok(result.stitchingLatencyMs < 10000, 'Stitching latency must be under 10 seconds');
            assert.ok(durationMs < 10000, 'Total pipeline execution must be under 10 seconds');
        });

        test('generateProposalCopy returns structured B2B advertising pitch in fallback mode', async () => {
            delete process.env.GEMINI_API_KEY;
            const result = await aiProvider.generateProposalCopy({
                advertiser: 'Grameenphone Limited',
                budget: 3500000,
                reach: '22M'
            });

            assert.strictEqual(result.success, true);
            assert.strictEqual(result.advertiser, 'Grameenphone Limited');
            assert.ok(result.headline.includes('GRAMEENPHONE LIMITED'));
            assert.ok(result.executiveSummary.length > 20);
            assert.ok(result.campaignTheme.length > 10);
            assert.ok(result.rationale.length > 20);
            assert.ok(result.projectedRoi);
            assert.strictEqual(result.providerUsed, 'local_copy_engine');
        });

        test('generateCritique returns high-fidelity audition critique and scoring without crashing', async () => {
            delete process.env.GEMINI_API_KEY;
            const result = await aiProvider.generateCritique({
                characterName: 'রকিবুল ইসলাম',
                genre: 'thriller',
                realName: 'Audition Candidate #404'
            });

            assert.strictEqual(result.success, true);
            assert.ok(result.ottScore >= 80 && result.ottScore <= 99);
            assert.ok(result.actingCritique.length > 10);
            assert.ok(result.roleTitle.length > 0);
            assert.strictEqual(result.providerUsed, 'procedural_fallback');
            assert.ok('screenPresence' in result.scoreBreakdown);
            assert.ok('prompts' in result);
        });
    });

    // 2. Media Storage & Offline Staging Tests
    describe('Media Storage & Offline Staging', () => {
        test('verifyMediaStorage confirms server/data/media exists and is writable', () => {
            const mediaStatus = aiProvider.verifyMediaStorage();
            assert.strictEqual(mediaStatus.exists, true, 'server/data/media must exist');
            assert.strictEqual(mediaStatus.writable, true, 'server/data/media must be writable');
        });

        test('Sample video clips resolve with HTTP 200 via GET /api/media/*', async () => {
            const testFiles = [
                '/api/media/sample-dub.mp4',
                '/api/media/sample-audition.mp4',
                '/api/media/dubs/sample.mp4',
                '/api/media/clip1.mp4',
                '/api/media/archetypes/thriller.jpg',
                '/api/media/dub_avatars/japanese.jpg'
            ];

            for (const fileUrl of testFiles) {
                const response = await fetch(`${baseUrl}${fileUrl}`);
                assert.strictEqual(
                    response.status,
                    200,
                    `Expected HTTP 200 for ${fileUrl}, received ${response.status}`
                );
                const contentType = response.headers.get('content-type') || '';
                assert.ok(
                    contentType.includes('video') || contentType.includes('image'),
                    `Expected video or image content type for ${fileUrl}, got ${contentType}`
                );
            }
        });
    });

    // 3. Sub-10s Submission Endpoints Audit
    describe('Sub-10s Pipeline Latency & Booth Submission Endpoints', () => {
        test('POST /api/booth/dub generates dub take in < 10 seconds', async () => {
            const start = Date.now();
            const response = await fetch(`${baseUrl}/api/booth/dub`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestName: 'Tanvir Hossain',
                    sceneId: 'world_cup_final',
                    dialect: 'russian',
                    text: 'খেলা হবে মামা!'
                })
            });

            const latencyMs = Date.now() - start;
            assert.strictEqual(response.status, 200);

            const data = await response.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.dubAsset || data.dub);
            const take = data.dubAsset || data.dub;
            assert.ok(take.videoUrl || take.audioUrl);

            // Sub-10s SLA assertion
            assert.ok(latencyMs < 10000, `Dub submission latency ${latencyMs}ms exceeded 10-second SLA limit`);
        });

        test('POST /api/booth/audition submits candidate and generates critique in < 10 seconds', async () => {
            const start = Date.now();
            const response = await fetch(`${baseUrl}/api/booth/audition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterName: 'সৈকত আহমেদ',
                    realName: 'Saikat VIP Performer',
                    genre: 'action',
                    speechTranscript: 'আমি এই শহরের নতুন রক্ষাকর্তা।'
                })
            });

            const latencyMs = Date.now() - start;
            assert.strictEqual(response.status, 200);

            const data = await response.json();
            assert.strictEqual(data.success, true);
            assert.ok(data.candidate);
            assert.ok(data.candidate.ottScore > 0);
            assert.ok(data.candidate.roleTitle);

            // Sub-10s SLA assertion
            assert.ok(latencyMs < 10000, `Audition submission latency ${latencyMs}ms exceeded 10-second SLA limit`);
        });
    });
});
