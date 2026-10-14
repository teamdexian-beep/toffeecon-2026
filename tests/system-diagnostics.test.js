const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { app } = require('../server/server');

describe('System Diagnostics API Test Suite', () => {
    let testServer;
    let baseUrl;

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

    test('GET /api/system/diagnostics responds with HTTP 200 and required diagnostic keys', async () => {
        const response = await fetch(`${baseUrl}/api/system/diagnostics`);
        assert.strictEqual(response.status, 200, 'Expected HTTP 200 OK');

        const data = await response.json();

        // Assert keys exist
        assert.ok('uptimeSeconds' in data, 'Missing key: uptimeSeconds');
        assert.ok('memoryUsage' in data, 'Missing key: memoryUsage');
        assert.ok('connectedClients' in data, 'Missing key: connectedClients');
        assert.ok('eventState' in data, 'Missing key: eventState');

        // Assert types and structure
        assert.strictEqual(typeof data.uptimeSeconds, 'number', 'uptimeSeconds must be a number');
        assert.strictEqual(typeof data.memoryUsage, 'object', 'memoryUsage must be an object');
        assert.ok(data.memoryUsage !== null, 'memoryUsage must not be null');
        assert.strictEqual(typeof data.connectedClients, 'number', 'connectedClients must be a number');
        assert.strictEqual(typeof data.eventState, 'object', 'eventState must be an object');
        assert.ok(data.eventState !== null, 'eventState must not be null');
    });

    test('GET /api/diagnostics provides backward compatibility with identical structure', async () => {
        const response = await fetch(`${baseUrl}/api/diagnostics`);
        assert.strictEqual(response.status, 200, 'Expected HTTP 200 OK for backward-compatible endpoint');

        const data = await response.json();

        assert.ok('uptimeSeconds' in data, 'Missing key: uptimeSeconds');
        assert.ok('memoryUsage' in data, 'Missing key: memoryUsage');
        assert.ok('connectedClients' in data, 'Missing key: connectedClients');
        assert.ok('eventState' in data, 'Missing key: eventState');
        assert.strictEqual(typeof data.uptimeSeconds, 'number');
        assert.strictEqual(typeof data.memoryUsage, 'object');
        assert.strictEqual(typeof data.connectedClients, 'number');
        assert.strictEqual(typeof data.eventState, 'object');
    });
});
