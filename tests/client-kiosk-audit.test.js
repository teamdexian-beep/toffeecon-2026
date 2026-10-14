const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Experiential Kiosk & Dynamic Binding Audit Test Suite', () => {
    const publicDir = path.join(__dirname, '../client/public');
    const htmlFiles = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

    test('All 34 experiential HTML views must be present in client/public', () => {
        assert.strictEqual(htmlFiles.length, 34, `Expected exactly 34 HTML views, found ${htmlFiles.length}`);
    });

    test('Zero-Blocking Modal Policy: No alert(), confirm(), or prompt() in any client view', () => {
        const violations = [];
        const blockingRegex = /\b(alert|confirm|prompt)\s*\(/g;

        htmlFiles.forEach(file => {
            const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
            const matches = content.match(blockingRegex);
            if (matches) {
                violations.push({ file, matches });
            }
        });

        assert.strictEqual(violations.length, 0, `Found blocking dialogs in files: ${JSON.stringify(violations)}`);
    });

    test('Zero hardcoded port 3000 or ws://localhost:3000 references', () => {
        const violations = [];
        const hardcodedRegex = /(:3000|localhost:3000|ws:\/\/localhost|http:\/\/localhost)/g;

        htmlFiles.forEach(file => {
            const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
            if (hardcodedRegex.test(content)) {
                violations.push(file);
            }
        });

        assert.strictEqual(violations.length, 0, `Found hardcoded URLs in: ${violations.join(', ')}`);
    });

    test('Dynamic WebSocket binding and SUBSCRIBE room presence across all 33 views', () => {
        const missingBinding = [];
        const missingSubscription = [];

        htmlFiles.forEach(file => {
            const content = fs.readFileSync(path.join(publicDir, file), 'utf8');
            if (!content.includes('WebSocket')) {
                missingBinding.push(file);
            }
            if (!content.includes('SUBSCRIBE')) {
                missingSubscription.push(file);
            }
        });

        assert.strictEqual(missingBinding.length, 0, `Missing WebSocket binding in: ${missingBinding.join(', ')}`);
        assert.strictEqual(missingSubscription.length, 0, `Missing SUBSCRIBE call in: ${missingSubscription.join(', ')}`);
    });

    test('Core Experience check: stage.html handles STAGE_SCENE_CHANGE and STAGE_CUE', () => {
        const stageContent = fs.readFileSync(path.join(publicDir, 'stage.html'), 'utf8');
        assert.ok(stageContent.includes('STAGE_SCENE_CHANGE'), 'stage.html must handle STAGE_SCENE_CHANGE');
        assert.ok(stageContent.includes('STAGE_CUE'), 'stage.html must handle STAGE_CUE');
    });

    test('Core Experience check: vote.html and portal.html support optimistic voting and CAST_VOTE', () => {
        const voteContent = fs.readFileSync(path.join(publicDir, 'vote.html'), 'utf8');
        const portalContent = fs.readFileSync(path.join(publicDir, 'portal.html'), 'utf8');

        assert.ok(voteContent.includes('CAST_VOTE'), 'vote.html must emit CAST_VOTE');
        assert.ok(portalContent.includes('CAST_VOTE'), 'portal.html must emit CAST_VOTE');
    });
});
