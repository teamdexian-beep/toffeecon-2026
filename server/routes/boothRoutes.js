const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { aiRateLimiter } = require('../middleware/security');
const dubStore = require('../stores/dubStore');
const universeStore = require('../stores/universeStore');
const spaceStore = require('../stores/spaceStore');
const proposalStore = require('../stores/proposalStore');

// Sanitize server errors to prevent raw file path or key leakage to public attendees
function sanitizeError(err) {
    if (!err) return 'Internal processing error';
    let msg = typeof err === 'string' ? err : (err.message || 'Internal processing error');
    msg = msg.replace(/[A-Za-z]:\\[^"'\n\r\t]+/g, '[REDACTED_PATH]');
    msg = msg.replace(/\/(?:[a-zA-Z0-9_.-]+\/)+[a-zA-Z0-9_.-]+/g, '[REDACTED_PATH]');
    msg = msg.replace(/(?:GEMINI_API_KEY|PIAPI_KEY|API_KEY|DIRECTOR_AUTH_KEY)[^\s]*/gi, '[REDACTED_KEY]');
    return msg;
}

module.exports = function(eventStore, broadcast, aiProvider) {
    // 1. Mission Control Proposal Generator (MADCON p. 12)
    router.post('/proposal', (req, res) => {
        try {
            const { advertiser, budget, reach, impressions, formats, targeting, effectiveCpm } = req.body;

            const proposal = proposalStore.addProposal({
                advertiser,
                budget,
                reach,
                impressions,
                formats,
                targeting,
                effectiveCpm
            });

            eventStore.update(st => {
                st.telemetry.adProposalsPrinted = proposalStore.getState().totalProposals;
            });

            broadcast('BOOTH_UPDATE', {
                type: 'PROPOSAL_PRINTED',
                telemetry: eventStore.getState().telemetry,
                proposalStore: proposalStore.getState(),
                proposal
            });

            res.json({
                success: true,
                proposal,
                telemetry: eventStore.getState().telemetry,
                storeStats: {
                    totalProposals: proposalStore.getState().totalProposals,
                    totalCommittedSpendBDT: proposalStore.getState().totalCommittedSpendBDT
                }
            });
        } catch (err) {
            console.error('[MissionControl] Proposal creation error:', err);
            res.status(500).json({ success: false, error: sanitizeError(err) });
        }
    });

    // Get all proposals & flight-deck summary
    router.get('/proposals', (req, res) => {
        res.json({
            success: true,
            ...proposalStore.getState(),
            telemetry: eventStore.getState().telemetry
        });
    });

    // Get individual verified proposal by ID or Verification Token
    router.get('/proposal/:id', (req, res) => {
        const proposal = proposalStore.getProposal(req.params.id);
        if (!proposal) {
            return res.status(404).json({ success: false, error: 'Advertiser proposal not found' });
        }
        res.json({ success: true, proposal });
    });

    // 2. The Dub Booth Basic Asset & History
    router.post(['/dub', '/dub/submit'], async (req, res) => {
        try {
            const { guestName, speakerName, sceneId, dialect, targetDialect, text, audioSampleBase64 } = req.body;

            // Generate dub take via aiProvider with sub-10s voice track stitching
            const dubTake = await aiProvider.generateDubTake({
                speakerName: speakerName || guestName || 'VIP Creator',
                text: text || 'ছু মন্তর ছু কালিপুত্তের গু! মামা খেলা হবে!',
                targetDialect: targetDialect || dialect || 'japanese',
                audioSampleBase64,
                sceneId: sceneId || 'world_cup'
            });

            // Persist into dubStore
            const savedTake = dubStore.addTake({
                id: dubTake.dubId,
                guestName: dubTake.speakerName,
                originalText: dubTake.originalText,
                language: dubTake.dialectKey,
                languageLabel: dubTake.dialect,
                characterRole: dubTake.characterRole,
                characterName: dubTake.characterName,
                translatedText: dubTake.translatedText,
                phoneticText: dubTake.phoneticText,
                avatarImage: dubTake.avatarImage,
                audioVoiceCode: dubTake.voiceCode,
                audioUrl: dubTake.audioUrl || '/api/media/dubs/sample.mp4'
            });

            eventStore.update(st => {
                st.telemetry.dubBoothsCompleted += 1;
            });

            const mediaAudio = dubTake.audioUrl || '/api/media/sample_voice.mp3';
            const mediaVideo = dubTake.videoUrl || '/api/media/dubs/sample.mp4';
            const dubAsset = {
                id: dubTake.dubId,
                guestName: dubTake.speakerName,
                sceneId: sceneId || 'world_cup',
                dialect: dubTake.dialect,
                videoUrl: mediaVideo,
                audioUrl: mediaAudio,
                mediaUrl: mediaAudio,
                downloadUrl: mediaAudio,
                shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my AI Voice Dub from ToffeeCon 2026! (${dubTake.dialect}) #ToffeeCon2026`)}`,
                badgeType: 'AI VOICE CLONE ARTIFACT',
                lockerFormatted: {
                    badgeType: 'AI VOICE CLONE ARTIFACT',
                    title: `${dubTake.characterName || 'Bengali Dub'} (${dubTake.dialect})`,
                    sub: 'Recorded at Booth 01 · Zero-Shot Voice Synthesis (00:24)',
                    downloadUrl: mediaAudio,
                    downloadFilename: `ToffeeCon-AI-Dub-${dubTake.dubId}.mp3`,
                    shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my AI Voice Dub from ToffeeCon 2026! #ToffeeCon2026`)}`
                },
                translatedText: dubTake.translatedText,
                phoneticText: dubTake.phoneticText,
                stitchingLatencyMs: dubTake.stitchingLatencyMs || 150,
                timestamp: dubTake.timestamp
            };

            broadcast('BOOTH_UPDATE', {
                type: 'DUB_COMPLETED',
                telemetry: eventStore.getState().telemetry,
                dubAsset
            });

            // Clean saved take for attendee locker compatibility
            const lockerSavedTake = {
                ...savedTake,
                mediaUrl: mediaAudio,
                downloadUrl: mediaAudio,
                shareUrl: dubAsset.shareUrl,
                badgeType: dubAsset.badgeType,
                lockerFormatted: dubAsset.lockerFormatted
            };

            broadcast('DUB_AI_PROCESSED', lockerSavedTake);

            res.json({
                success: true,
                dubAsset,
                dub: lockerSavedTake,
                telemetry: eventStore.getState().telemetry
            });
        } catch (err) {
            console.error('[BoothRoutes:dub] Error:', err);
            res.status(500).json({ success: false, error: sanitizeError(err) });
        }
    });

    // 3. AI Dub Booth Voice & Performance Engine
    router.post('/dub-ai', aiRateLimiter, async (req, res) => {
        try {
            const { speakerName, text, targetDialect, audioSampleBase64, guestName, dialect } = req.body;
            const result = await aiProvider.generateDubTake({
                speakerName: speakerName || guestName || 'VIP Creator',
                text: text || 'ছু মন্তর ছু কালিপুত্তের গু! মামা খেলা হবে!',
                targetDialect: targetDialect || dialect || 'japanese',
                audioSampleBase64
            });

            const mediaAudio = result.audioUrl || '/api/media/sample_voice.mp3';

            // Persist into dubStore
            const savedTake = dubStore.addTake({
                id: result.dubId,
                guestName: result.speakerName || 'VIP Creator',
                originalText: result.originalText,
                language: result.dialectKey,
                languageLabel: result.dialect,
                characterRole: result.characterRole,
                characterName: result.characterName,
                translatedText: result.translatedText,
                phoneticText: result.phoneticText,
                avatarImage: result.avatarImage,
                audioVoiceCode: result.voiceCode,
                audioUrl: mediaAudio
            });

            eventStore.update(st => {
                st.telemetry.dubBoothsCompleted += 1;
            });

            const lockerSavedTake = {
                ...savedTake,
                mediaUrl: mediaAudio,
                downloadUrl: mediaAudio,
                shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my AI Voice Dub from ToffeeCon 2026! (${savedTake.languageLabel}) #ToffeeCon2026`)}`,
                badgeType: 'AI VOICE CLONE ARTIFACT',
                lockerFormatted: {
                    badgeType: 'AI VOICE CLONE ARTIFACT',
                    title: `${savedTake.characterName || 'Bengali Dub'} (${savedTake.languageLabel})`,
                    sub: 'Recorded at Booth 01 · Zero-Shot Voice Synthesis (00:24)',
                    downloadUrl: mediaAudio,
                    downloadFilename: `ToffeeCon-AI-Dub-${savedTake.id}.mp3`,
                    shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my AI Voice Dub from ToffeeCon 2026! #ToffeeCon2026`)}`
                }
            };

            broadcast('DUB_AI_PROCESSED', lockerSavedTake);
            res.json({ success: true, dub: lockerSavedTake });
        } catch(err) {
            console.error('[DubAI] Error:', err);
            res.status(500).json({ success: false, error: sanitizeError(err) });
        }
    });

    // Dub Session Lookup by ID (for QR Code & Mobile Viral Share Page)
    router.get('/dub/candidate/:id', (req, res) => {
        const take = dubStore.getTake(req.params.id);
        if (!take) {
            return res.status(404).json({ success: false, error: 'Dub session not found' });
        }
        res.json({ success: true, dub: take });
    });

    // Dub Booth Catalog of Archetypes & Sessions
    router.get('/dub/state', (req, res) => {
        res.json({
            success: true,
            archetypes: aiProvider.dialectDictionaries,
            recentTakes: dubStore.getState().takes
        });
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
            res.status(500).json({ success: false, error: sanitizeError(err) });
        }
    });

    // 5. In Another Universe (Photobooth) APIs
    router.get('/universe/state', (req, res) => {
        res.json({
            ...eventStore.getState().universeBooth,
            aiStatus: aiProvider.getStatus(),
            universeStore: universeStore.getState()
        });
    });

    router.get('/universe/poster/:id', (req, res) => {
        const poster = universeStore.getPoster(req.params.id);
        if (!poster) {
            return res.status(404).json({ success: false, error: 'Poster not found' });
        }
        res.json({ success: true, poster });
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
                // Save to universeStore for persistent mobile share link
                const savedPoster = universeStore.addPoster({
                    id: result.posterId,
                    guestName: result.guestName,
                    genre: result.genre,
                    genreLabel: result.template.title,
                    tagline: result.template.tag,
                    badgeText: result.template.badgeText,
                    accentColor: result.template.accentColor,
                    posterUrl: result.posterUrl,
                    rawGuestPhoto: result.rawGuestPhoto
                });

                eventStore.update(st => {
                    st.universeBooth.activeUniverse = result.genre;
                    st.universeBooth.totalPortraitsRendered += 1;
                    st.universeBooth.recentPosters.unshift(savedPoster);
                    if (st.universeBooth.recentPosters.length > 20) {
                        st.universeBooth.recentPosters.pop();
                    }
                });

                broadcast('UNIVERSE_POSTER_RENDERED', {
                    poster: savedPoster,
                    booth: eventStore.getState().universeBooth
                });

                return res.json({ success: true, poster: savedPoster });
            } else {
                return res.status(500).json({ error: 'Transformation failed' });
            }
        } catch (err) {
            console.error('Universe transformation error:', err);
            return res.status(500).json({ success: false, error: sanitizeError(err) });
        }
    });

    // 6. Taste Duel TV APIs
    router.get('/duel/state', (req, res) => {
        res.json(eventStore.getState().tasteDuel);
    });

    router.get('/taste-duel/state', (req, res) => {
        res.json(eventStore.getState().tasteDuel);
    });

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
                const profileResult = aiProvider.evaluateTasteProfile({
                    guestAnswers: d.guestAnswers,
                    friendGuesses: d.friendGuesses
                });

                d.duelOutcome = {
                    aiMatchPct: profileResult.aiMatchPct,
                    friendMatchPct: profileResult.friendMatchPct,
                    winner: profileResult.winner,
                    persona: profileResult.persona
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
    router.post(['/audition', '/audition/submit'], async (req, res) => {
        try {
            const { characterName, speechTranscript, genre, photoBase64, posterBase64, audioBase64, realName } = req.body;
            
            // Run AI analysis & Veo prompt synthesis (deterministic fallback under sub-10s constraint)
            const aiResult = await aiProvider.analyzeAndGenerateAudition({
                characterName: characterName || 'অপরিচিত নায়ক',
                speechTranscript: speechTranscript || '',
                genre: genre || 'thriller',
                photoBase64,
                realName: realName || 'ToffeeCon Star'
            });

            // Optional Neural AI Cloud Face-Swap via PiAPI with strict timeout guard
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
                    const swapPromise = aiProvider.callPiAPIFaceSwap({
                        swapImageBase64: photoBase64,
                        targetImageUrl: targetImage
                    });
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Neural face-swap timed out (sub-10s constraint)')), 3500));
                    const swapRes = await Promise.race([swapPromise, timeoutPromise]);

                    if (swapRes && swapRes.success && swapRes.imageUrl) {
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
                    console.warn('[BoothRoutes] PiAPI face swap skipped or timed out, using composite poster fallback:', swapErr.message);
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

            // Enhance candidate with attendee PWA Media Locker formatting
            const cleanPoster = newCandidate.posterUrl || newCandidate.portraitUrl || '/assets/toffeecon-hero-emblem.png';
            const cleanVideo = newCandidate.videoUrl || '/api/media/sample-audition.mp4';
            const candidateResponse = {
                ...newCandidate,
                videoUrl: cleanVideo,
                mediaUrl: cleanVideo,
                badgeUrl: cleanPoster,
                downloadUrl: cleanPoster,
                shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`I just auditioned for Toffee OTT at ToffeeCon 2026! Scored ${newCandidate.ottScore}% 🎭 #ToffeeCon2026`)}`,
                badgeType: 'OTT CASTING AUDITION PASS',
                lockerFormatted: {
                    badgeType: 'OTT CASTING AUDITION PASS',
                    title: newCandidate.roleTitle || `${newCandidate.genre.toUpperCase()} Screen Test`,
                    sub: `Score: ${newCandidate.ottScore}% Match · Genre: ${newCandidate.genre}`,
                    downloadUrl: cleanPoster,
                    downloadFilename: `ToffeeCon-Audition-${newCandidate.id}.png`,
                    shareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(`I just auditioned for Toffee OTT at ToffeeCon 2026! Scored ${newCandidate.ottScore}% 🎭 #ToffeeCon2026`)}`
                }
            };

            res.json({
                success: true,
                candidate: candidateResponse,
                totalAuditions: castingStore.getState().totalAuditions
            });
        } catch (err) {
            console.error('[Audition Submit Error]:', err);
            res.status(500).json({ success: false, error: sanitizeError(err) });
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

    // ========================================================
    // 7. The Space Window & 100+ Channel Catalogue (MADCON p.14)
    // ========================================================

    // Get live satellite downlink state & telemetry
    router.get('/space/state', (req, res) => {
        res.json({
            success: true,
            spaceState: spaceStore.getState()
        });
    });

    // Get channels with optional category filtering
    router.get('/space/channels', (req, res) => {
        const category = req.query.category || 'all';
        const channels = spaceStore.getChannels(category);
        res.json({
            success: true,
            totalChannels: channels.length,
            category,
            channels
        });
    });

    // Get specific channel metadata & advertiser rates
    router.get('/space/channel/:id', (req, res) => {
        const channel = spaceStore.getChannelById(req.params.id);
        if (!channel) {
            return res.status(404).json({ success: false, error: 'Channel not found in catalogue' });
        }
        res.json({ success: true, channel });
    });

    // Trigger laser beam uplink from lit channel wall to overhead ceiling satellite
    router.post('/space/uplink', (req, res) => {
        const { channelId, partnerName } = req.body;
        const uplinkEvent = spaceStore.triggerUplink({ channelId, partnerName });

        // Broadcast to ceiling screens, wall screens, and hub via WebSocket
        broadcast('SPACE_UPLINK', {
            type: 'SATELLITE_UPLINK_TRIGGERED',
            uplink: uplinkEvent,
            telemetry: spaceStore.getState().telemetry,
            satellite: spaceStore.getState().satellite
        });

        res.json({
            success: true,
            uplink: uplinkEvent,
            telemetry: spaceStore.getState().telemetry
        });
    });

    // Submit B2B advertiser / sponsor inquiry
    router.post('/space/sponsor-inquiry', (req, res) => {
        const { channelId, brandName, contactEmail, contactPhone, targetBudget, desiredFormats } = req.body;
        const inquiry = spaceStore.submitSponsorInquiry({
            channelId,
            brandName,
            contactEmail,
            contactPhone,
            targetBudget,
            desiredFormats
        });

        broadcast('SPACE_SPONSOR_INQUIRY', {
            type: 'NEW_ADVERTISER_INQUIRY',
            inquiry,
            telemetry: spaceStore.getState().telemetry
        });

        res.json({
            success: true,
            inquiry,
            telemetry: spaceStore.getState().telemetry
        });
    });

    // Generate B2B Rate Card / Digital Media Kit
    router.get(['/space/media-kit', '/space/media-kit/:id'], (req, res) => {
        const channelId = req.params.id;
        const channel = channelId ? spaceStore.getChannelById(channelId) : null;
        const allChannels = spaceStore.getChannels('all');

        const mediaKit = {
            platform: 'Toffee OTT (Banglalink)',
            totalLiveChannels: allChannels.length,
            activeDownlink: spaceStore.getState().satellite.name,
            totalMonthlyReach: spaceStore.getState().telemetry.totalMonthlyReach,
            adOpportunities: [
                { format: 'L-Band Overlay', cpm: '৳300 - ৳400', clickThroughAvg: '3.4%', placement: 'Live Sports & Breaking News' },
                { format: 'Dynamic Ad Insertion (DAI)', cpm: '৳350 - ৳450', clickThroughAvg: '4.2%', placement: 'Pre-roll & Mid-roll Linear Streams' },
                { format: 'Sponsorship Bug / Anchor Branding', cpm: '৳250 - ৳320', clickThroughAvg: 'N/A (100% SOV)', placement: 'Corner Watermark / Clock bug' },
                { format: '4K HDR Feature Integration', cpm: '৳450 - ৳600', clickThroughAvg: '5.1%', placement: 'Toffee Originals & Mega Drama' }
            ],
            targetChannel: channel || {
                name: 'All 100+ Channels Portfolio Package',
                reach: '95M+ Platform Cumulative',
                cpm: '৳320 Composite CPM'
            },
            generatedAt: new Date().toISOString()
        };

        res.json({ success: true, mediaKit });
    });

    return router;
};

