const express = require('express');
const router = express.Router();
const { aiRateLimiter } = require('../middleware/security');

module.exports = function(eventStore, broadcast, aiProvider) {
    // 1. Mission Control Proposal Generator
    router.post('/proposal', (req, res) => {
        const { advertiser, budget, reach, impressions, formats } = req.body;

        eventStore.update(st => {
            st.telemetry.adProposalsPrinted += 1;
        });

        const proposal = {
            id: 'PROP-' + Math.floor(1000 + Math.random() * 9000),
            advertiser: advertiser || 'Media Partner',
            budget: budget || 500000,
            reach: reach || '3.5M',
            impressions: impressions || '4.2M',
            formats: formats || ['Sports L-Band Overlay'],
            timestamp: new Date().toISOString()
        };

        broadcast('BOOTH_UPDATE', {
            type: 'PROPOSAL_PRINTED',
            telemetry: eventStore.getState().telemetry,
            proposal
        });

        res.json({ success: true, proposal, telemetry: eventStore.getState().telemetry });
    });

    // 2. The Dub Booth Basic Asset
    router.post('/dub', (req, res) => {
        const { guestName, sceneId, dialect } = req.body;

        eventStore.update(st => {
            st.telemetry.dubBoothsCompleted += 1;
        });

        const dubAsset = {
            id: 'DUB-' + Math.floor(1000 + Math.random() * 9000),
            guestName: guestName || 'VIP Creator',
            sceneId: sceneId || 'world_cup',
            dialect: dialect || 'Standard Bangla',
            videoUrl: 'https://assets.toffeecon.live/dubs/sample.mp4',
            timestamp: new Date().toISOString()
        };

        broadcast('BOOTH_UPDATE', {
            type: 'DUB_COMPLETED',
            telemetry: eventStore.getState().telemetry,
            dubAsset
        });

        res.json({ success: true, dubAsset, telemetry: eventStore.getState().telemetry });
    });

    // 3. AI Dub Booth Voice Engine
    router.post('/dub-ai', aiRateLimiter, async (req, res) => {
        try {
            const { speakerName, text, targetDialect } = req.body;
            const result = await aiProvider.translateAndDubVoice({ speakerName, text, targetDialect });

            eventStore.update(st => {
                st.telemetry.dubBoothsCompleted += 1;
            });

            broadcast('DUB_AI_PROCESSED', result);
            res.json({ success: true, dub: result });
        } catch(err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 4. AI Capsule Prediction Expander
    router.post('/capsule-ai', aiRateLimiter, async (req, res) => {
        try {
            const { author, company, predictionText } = req.body;
            const result = await aiProvider.expandFuturePrediction({ author, company, predictionText });

            const newPred = {
                id: result.predId,
                author: result.author,
                company: result.company,
                text: result.editorialHeadline || result.rawPrediction,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            eventStore.update(st => {
                st.capsuleWrapped.predictions.unshift(newPred);
            });

            broadcast('CAPSULE_UPDATE', eventStore.getState().capsuleWrapped);
            res.json({ success: true, prediction: result });
        } catch(err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 5. In Another Universe (Photobooth) APIs
    router.get('/universe/state', (req, res) => {
        res.json({
            ...eventStore.getState().universeBooth,
            aiStatus: aiProvider.getStatus()
        });
    });

    router.post('/universe/transform', aiRateLimiter, async (req, res) => {
        try {
            const { guestName, guestPhotoBase64, genre } = req.body;
            const result = await aiProvider.transformPortrait({
                guestName,
                guestPhotoBase64,
                genre
            });

            if (result.success) {
                eventStore.update(st => {
                    st.universeBooth.activeUniverse = result.genre;
                    st.universeBooth.totalPortraitsRendered += 1;
                    st.universeBooth.recentPosters.unshift(result);
                    if (st.universeBooth.recentPosters.length > 20) {
                        st.universeBooth.recentPosters.pop();
                    }
                });

                broadcast('UNIVERSE_POSTER_RENDERED', {
                    poster: result,
                    booth: eventStore.getState().universeBooth
                });

                return res.json({ success: true, poster: result });
            } else {
                return res.status(500).json({ error: 'Transformation failed' });
            }
        } catch (err) {
            console.error('Universe transformation error:', err);
            return res.status(500).json({ error: err.message });
        }
    });

    // 6. Taste Duel TV APIs
    router.post('/duel/answer', (req, res) => {
        const { isGuest, questionIndex, answer } = req.body;
        const state = eventStore.getState();
        const duel = state.tasteDuel;

        eventStore.update(st => {
            const d = st.tasteDuel;
            if (isGuest) {
                d.guestAnswers[questionIndex] = answer;
            } else {
                d.friendGuesses[questionIndex] = answer;
            }

            const qCount = d.questions.length;
            if (d.guestAnswers.length >= qCount && d.friendGuesses.length >= qCount) {
                let aiMatches = 0;
                let friendMatches = 0;

                for (let i = 0; i < qCount; i++) {
                    const guestAns = d.guestAnswers[i];
                    const friendGuess = d.friendGuesses[i];
                    if (guestAns === 'A' || Math.random() > 0.25) aiMatches += 1;
                    if (friendGuess === guestAns) friendMatches += 1;
                }

                const aiMatchPct = Math.round((aiMatches / qCount) * 100);
                const friendMatchPct = Math.round((friendMatches / qCount) * 100);

                d.duelOutcome = {
                    aiMatchPct: Math.max(75, aiMatchPct),
                    friendMatchPct,
                    winner: aiMatchPct >= friendMatchPct ? 'TOFFEE ALGORITHM' : 'FRIEND'
                };
            }
        });

        broadcast('DUEL_UPDATE', eventStore.getState().tasteDuel);
        res.json({ success: true, duel: eventStore.getState().tasteDuel });
    });

    router.post('/duel/reset', (req, res) => {
        eventStore.update(st => {
            st.tasteDuel.guestAnswers = [];
            st.tasteDuel.friendGuesses = [];
            st.tasteDuel.duelOutcome = null;
        });

        broadcast('DUEL_UPDATE', eventStore.getState().tasteDuel);
        res.json({ success: true, duel: eventStore.getState().tasteDuel });
    });

    return router;
};
