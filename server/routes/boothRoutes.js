const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
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

    // ========================================================
    // 6. Toffee OTT AI Casting Audition & Stage Reel Engine
    // ========================================================
    const castingStore = require('../stores/castingStore');

    // Submit new audition from Touch Kiosk
    router.post('/audition/submit', async (req, res) => {
        try {
            const { characterName, speechTranscript, genre, photoBase64, posterBase64, audioBase64, realName } = req.body;
            
            // Run AI analysis & Veo prompt synthesis
            const aiResult = await aiProvider.analyzeAndGenerateAudition({
                characterName: characterName || 'অপরিচিত নায়ক',
                speechTranscript: speechTranscript || '',
                genre: genre || 'thriller',
                photoBase64,
                realName: realName || 'ToffeeCon Star'
            });

            // Optional Neural AI Cloud Face-Swap via PiAPI (Lowest cost identity preservation)
            let finalPosterBase64 = posterBase64;
            if (aiProvider.config.apiKey && photoBase64) {
                try {
                    console.log(`[BoothRoutes] Invoking PiAPI neural face swap for attendee with genre: ${genre || 'thriller'}...`);
                    const archetypePath = path.join(__dirname, '../data/media/archetypes', `${(genre || 'thriller').toLowerCase()}.jpg`);
                    let targetImage = aiResult.backdropUrl;
                    if (fs.existsSync(archetypePath)) {
                        targetImage = 'data:image/jpeg;base64,' + fs.readFileSync(archetypePath).toString('base64');
                        console.log(`[BoothRoutes] Using bespoke cinematic archetype master: ${(genre || 'thriller').toLowerCase()}.jpg`);
                    }
                    const swapRes = await aiProvider.callPiAPIFaceSwap({
                        swapImageBase64: photoBase64,
                        targetImageUrl: targetImage
                    });
                    if (swapRes.success && swapRes.imageUrl) {
                        try {
                            const imgRes = await fetch(swapRes.imageUrl);
                            if (imgRes.ok) {
                                const buffer = Buffer.from(await imgRes.arrayBuffer());
                                finalPosterBase64 = 'data:image/jpeg;base64,' + buffer.toString('base64');
                                console.log('[BoothRoutes] Neural face swap successfully buffered to disk store');
                            } else {
                                finalPosterBase64 = swapRes.imageUrl;
                            }
                        } catch (dlErr) {
                            console.warn('[BoothRoutes] Direct URL fallback for neural image:', dlErr.message);
                            finalPosterBase64 = swapRes.imageUrl;
                        }
                    }
                } catch (swapErr) {
                    console.warn('[BoothRoutes] PiAPI face swap failed, using composite poster fallback:', swapErr.message);
                }
            }

            const newCandidate = castingStore.addCandidate({
                characterName: characterName || 'বল্টু ভাই',
                realName: realName || 'অডিশন প্রার্থী',
                genre: genre || 'thriller',
                photoBase64,
                posterBase64: finalPosterBase64,
                audioBase64,
                roleTitle: aiResult.roleTitle,
                seriesTitle: aiResult.seriesTitle,
                englishTitle: aiResult.englishTitle,
                tagline: aiResult.tagline,
                summary: aiResult.summary,
                backdropUrl: aiResult.backdropUrl,
                accentColor: aiResult.accentColor,
                colorGrade: aiResult.colorGrade,
                actingCritique: aiResult.actingCritique,
                ottScore: aiResult.ottScore,
                scoreBreakdown: aiResult.scoreBreakdown,
                prompts: aiResult.prompts
            });

            // Keep facade store in sync
            eventStore.update(st => {
                st.ottAudition = castingStore.getState();
            });

            // WebSocket live broadcast to Curator Panel and Displays
            broadcast('AUDITION_SUBMITTED', {
                candidate: newCandidate,
                totalAuditions: castingStore.getState().totalAuditions
            });

            res.json({
                success: true,
                candidate: newCandidate,
                totalAuditions: castingStore.getState().totalAuditions
            });
        } catch (err) {
            console.error('[Audition Submit Error]:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // Get all audition candidates and stage state
    router.get('/audition/candidates', (req, res) => {
        const ott = castingStore.getState();
        res.json({
            success: true,
            totalAuditions: ott.candidates.length,
            candidates: ott.candidates,
            top10Ids: ott.top10Ids,
            stagePlayback: ott.stagePlayback
        });
    });

    // Get single audition candidate for public viral share page
    router.get('/audition/candidate/:id', (req, res) => {
        const ott = castingStore.getState();
        const cand = ott.candidates.find(c => c.id === req.params.id);
        if (!cand) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }
        res.json({ success: true, candidate: cand });
    });

    // Curate / Reorder Top 10 List
    router.post('/audition/curate', (req, res) => {
        const { top10Ids } = req.body;
        if (!Array.isArray(top10Ids)) {
            return res.status(400).json({ success: false, error: 'top10Ids must be an array' });
        }

        const updatedIds = castingStore.curateTop10(top10Ids);
        eventStore.update(st => {
            st.ottAudition = castingStore.getState();
        });

        broadcast('AUDITION_TOP10_UPDATED', {
            top10Ids: updatedIds,
            candidates: castingStore.getState().candidates
        });

        res.json({ success: true, top10Ids: updatedIds });
    });

    // Upload / Associate 10s Veo video clip with a character
    router.post('/audition/upload-clip', (req, res) => {
        const { candidateId, videoUrl } = req.body;
        if (!candidateId || !videoUrl) {
            return res.status(400).json({ success: false, error: 'Missing candidateId or videoUrl' });
        }

        const updatedCandidate = castingStore.uploadClip(candidateId, videoUrl);
        if (!updatedCandidate) {
            return res.status(404).json({ success: false, error: 'Candidate not found' });
        }

        eventStore.update(st => {
            st.ottAudition = castingStore.getState();
        });

        broadcast('AUDITION_CLIP_UPLOADED', {
            candidateId,
            videoUrl,
            candidate: updatedCandidate
        });

        res.json({ success: true, candidate: updatedCandidate });
    });

    // Stage LED Control & MC Remote Trigger
    router.post('/audition/stage-control', (req, res) => {
        const { action, index, candidateId, autoPlay, masterVideoUrl } = req.body;
        const playbackState = castingStore.updateStagePlayback({ action, index, candidateId, autoPlay, masterVideoUrl });

        eventStore.update(st => {
            st.ottAudition = castingStore.getState();
        });

        broadcast('STAGE_AUDITION_COMMAND', {
            action,
            playback: playbackState
        });

        res.json({ success: true, playback: playbackState });
    });

    // Get current audition & stage state
    router.get('/audition/state', (req, res) => {
        res.json({
            success: true,
            ottAudition: castingStore.getState()
        });
    });

    return router;
};

