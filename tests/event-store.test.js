const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const eventStore = require('../server/services/eventStore');

describe('EventStore Engine Test Suite', () => {
    test('Validate eventStore.init() and eventStore.getState()', () => {
        const initializedState = eventStore.init();
        assert.ok(initializedState !== null && typeof initializedState === 'object', 'init() should return state object');

        const state = eventStore.getState();
        assert.strictEqual(state, initializedState, 'getState() should return the hydrated state instance');

        // Verify foundational state domains
        assert.ok(state.votingEngine, 'State should have votingEngine');
        assert.ok(state.phoneWall, 'State should have phoneWall');
        assert.ok(state.telemetry, 'State should have telemetry');
        assert.ok(state.stageScene, 'State should have stageScene');
        assert.ok(state.marathonRace, 'State should have marathonRace');
        assert.ok(state.personalDashboard, 'State should have personalDashboard');
        assert.ok(state.ottAudition, 'State should have ottAudition');
    });

    test('Atomic mutation via eventStore.update(...) and reliable disk persistence', async () => {
        const testMutationKey = '_qa_audit_timestamp';
        const testValue = Date.now();
        const initialRedVotes = eventStore.getState().votingEngine.options.red.votes;

        // Perform mutation
        const updatedState = eventStore.update((st) => {
            st[testMutationKey] = testValue;
            st.votingEngine.options.red.votes = initialRedVotes + 5;
        });

        // In-memory assertion
        assert.strictEqual(updatedState[testMutationKey], testValue, 'Mutated key must reflect in returned state');
        assert.strictEqual(eventStore.getState()[testMutationKey], testValue, 'getState() must reflect mutation');
        assert.strictEqual(eventStore.getState().votingEngine.options.red.votes, initialRedVotes + 5);

        // Synchronous persistence to verify disk write reliability
        eventStore.persist();

        // Read raw file directly from disk
        assert.ok(fs.existsSync(eventStore.dataPath), 'State file should exist on disk');
        const diskRaw = fs.readFileSync(eventStore.dataPath, 'utf-8');
        const persistedData = JSON.parse(diskRaw);

        assert.strictEqual(
            persistedData[testMutationKey],
            testValue,
            'Persisted JSON on disk must match mutated in-memory value'
        );
        assert.strictEqual(
            persistedData.votingEngine.options.red.votes,
            initialRedVotes + 5,
            'Persisted vote count must match mutation'
        );

        // Clean up test mutation to prevent state pollution
        eventStore.update((st) => {
            delete st[testMutationKey];
            st.votingEngine.options.red.votes = initialRedVotes;
        });
        eventStore.persist();

        const cleanRaw = fs.readFileSync(eventStore.dataPath, 'utf-8');
        const cleanData = JSON.parse(cleanRaw);
        assert.strictEqual(cleanData[testMutationKey], undefined, 'Test key should be cleaned from disk');
        assert.strictEqual(cleanData.votingEngine.options.red.votes, initialRedVotes);
    });
});
