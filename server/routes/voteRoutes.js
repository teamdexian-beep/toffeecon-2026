const express = require('express');
const router = express.Router();
const { voteRateLimiter } = require('../middleware/security');
const marathonStore = require('../stores/marathonStore');

module.exports = function(eventStore, broadcast) {
    const votedClients = new Set();

    // 1. Sonic Battle Vote API
    router.post('/vote', voteRateLimiter, (req, res) => {
        const { option, voterToken, isDirectorOverride } = req.body;
        const clientIdentifier = voterToken || req.ip;
        const isDirector = req.headers['x-director-auth'] === 'toffeecon-2026-secure' || req.query.auth === 'toffeecon-2026-secure';
        const hasOverride = isDirector && !!isDirectorOverride;

        if (votedClients.has(clientIdentifier) && !hasOverride) {
            return res.status(409).json({
                error: 'Vote already recorded from this device',
                alreadyVoted: true,
                voting: eventStore.getState().votingEngine
            });
        }

        const state = eventStore.getState();
        if (state.votingEngine.options[option]) {
            eventStore.update(st => {
                st.votingEngine.options[option].votes += 1;
            });
            if (!isDirectorOverride) {
                votedClients.add(clientIdentifier);
            }
            broadcast('VOTE_UPDATE', eventStore.getState().votingEngine);
            res.json({ success: true, voting: eventStore.getState().votingEngine });
        } else {
            res.status(400).json({ error: 'Invalid option' });
        }
    });

    // 2. Personal Dashboard (This or That) APIs
    router.get('/dashboard/state', (req, res) => {
        const dash = eventStore.getState().personalDashboard;
        const currentRound = dash.rounds[dash.currentRoundIndex];
        const totalVotes = currentRound.optionA.votes + currentRound.optionB.votes;
        const pctA = totalVotes > 0 ? Math.round((currentRound.optionA.votes / totalVotes) * 100) : 50;
        const pctB = 100 - pctA;

        res.json({
            status: dash.status,
            currentRoundIndex: dash.currentRoundIndex,
            totalRounds: dash.rounds.length,
            round: {
                ...currentRound,
                pctA,
                pctB,
                totalVotes,
                winningOption: pctA >= pctB ? 'A' : 'B'
            }
        });
    });

    router.post('/dashboard/vote', voteRateLimiter, (req, res) => {
        const { roundIndex, option } = req.body;
        const dash = eventStore.getState().personalDashboard;

        if (dash.status === 'locked') {
            return res.status(403).json({ error: 'Voting is locked for this round' });
        }

        const rIdx = typeof roundIndex === 'number' ? roundIndex : dash.currentRoundIndex;
        const targetRound = dash.rounds[rIdx];
        if (!targetRound) {
            return res.status(400).json({ error: 'Invalid round index' });
        }

        eventStore.update(st => {
            const r = st.personalDashboard.rounds[rIdx];
            if (option === 'A' || option === r.optionA.id) {
                r.optionA.votes += 1;
            } else if (option === 'B' || option === r.optionB.id) {
                r.optionB.votes += 1;
            }
        });

        const updatedRound = eventStore.getState().personalDashboard.rounds[rIdx];
        const totalVotes = updatedRound.optionA.votes + updatedRound.optionB.votes;
        const pctA = Math.round((updatedRound.optionA.votes / totalVotes) * 100);
        const pctB = 100 - pctA;

        const payload = {
            status: dash.status,
            currentRoundIndex: dash.currentRoundIndex,
            round: {
                ...updatedRound,
                pctA,
                pctB,
                totalVotes,
                winningOption: pctA >= pctB ? 'A' : 'B'
            }
        };

        broadcast('DASHBOARD_UPDATE', payload);
        res.json({ success: true, ...payload });
    });

    router.post('/dashboard/control', (req, res) => {
        const { action, roundIndex } = req.body;

        eventStore.update(st => {
            const dash = st.personalDashboard;
            if (action === 'set_round' && typeof roundIndex === 'number') {
                if (roundIndex >= 0 && roundIndex < dash.rounds.length) {
                    dash.currentRoundIndex = roundIndex;
                    dash.status = 'voting';
                }
            } else if (action === 'next_round') {
                dash.currentRoundIndex = (dash.currentRoundIndex + 1) % dash.rounds.length;
                dash.status = 'voting';
            } else if (action === 'lock') {
                dash.status = 'locked';
            } else if (action === 'showcase') {
                dash.status = 'showcase';
            } else if (action === 'voting') {
                dash.status = 'voting';
            } else if (action === 'reset') {
                dash.status = 'voting';
                dash.rounds[dash.currentRoundIndex].optionA.votes = 100;
                dash.rounds[dash.currentRoundIndex].optionB.votes = 50;
            }
        });

        const dash = eventStore.getState().personalDashboard;
        const currentRound = dash.rounds[dash.currentRoundIndex];
        const totalVotes = currentRound.optionA.votes + currentRound.optionB.votes;
        const pctA = totalVotes > 0 ? Math.round((currentRound.optionA.votes / totalVotes) * 100) : 50;
        const pctB = 100 - pctA;

        const payload = {
            status: dash.status,
            currentRoundIndex: dash.currentRoundIndex,
            round: {
                ...currentRound,
                pctA,
                pctB,
                totalVotes,
                winningOption: pctA >= pctB ? 'A' : 'B'
            }
        };

        broadcast('DASHBOARD_UPDATE', payload);
        res.json({ success: true, ...payload });
    });

    // 3. Memory Marathon Trivia APIs (MADCON Brief, pp. 18, 22)

    // Get live race & question state
    router.get('/marathon/state', (req, res) => {
        const race = marathonStore.getState();
        res.json({
            success: true,
            race
        });
    });

    // Get top 10 leaderboard
    router.get('/marathon/leaderboard', (req, res) => {
        const race = marathonStore.getState();
        res.json({
            success: true,
            leaderboard: race.leaderboard,
            winner: race.winner,
            status: race.status
        });
    });

    // Register / spawn audience racer dot
    router.post('/marathon/register', (req, res) => {
        const { playerId, playerName, avatarColor } = req.body;
        const racer = marathonStore.registerRacer({
            id: playerId,
            name: playerName,
            avatarColor
        });

        const updatedRace = marathonStore.getState();
        eventStore.update(st => {
            st.marathonRace = updatedRace;
        });

        broadcast('MARATHON_UPDATE', updatedRace);
        res.json({ success: true, racer, race: updatedRace });
    });

    // Race director / MC keynote control (start, next, reveal, finish, reset)
    router.post('/marathon/control', (req, res) => {
        const { action, index } = req.body;
        const updatedRace = marathonStore.controlRace(action, { index });

        eventStore.update(st => {
            st.marathonRace = updatedRace;
        });

        broadcast('MARATHON_UPDATE', updatedRace);
        res.json({ success: true, race: updatedRace });
    });

    // Audience rapid-fire answer submission
    router.post('/marathon/answer', voteRateLimiter, (req, res) => {
        const { playerId, playerName, answerIndex } = req.body;
        const race = marathonStore.getState();

        if (race.status !== 'racing') {
            return res.status(400).json({ error: 'Race is not currently active for voting' });
        }

        const answerResult = marathonStore.recordAnswer({
            playerId,
            playerName,
            answerIndex
        });

        const updatedRace = marathonStore.getState();
        eventStore.update(st => {
            st.marathonRace = updatedRace;
        });

        broadcast('MARATHON_UPDATE', updatedRace);
        res.json({
            success: true,
            ...answerResult
        });
    });

    // 4. ToffeeCon Wrapped & Capsule 2033 APIs
    router.get('/capsule/state', (req, res) => {
        res.json(eventStore.getState().capsuleWrapped);
    });

    router.post('/capsule/predict', voteRateLimiter, (req, res) => {
        const { author, company, text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Prediction text is required' });
        }

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newPrediction = {
            id: 'pred_' + Date.now(),
            author: author || 'Summit Attendee',
            company: company || 'VIP Partner',
            text: text.slice(0, 280),
            timestamp: timeStr,
            createdAt: now.toISOString()
        };

        eventStore.update(st => {
            st.capsuleWrapped.predictions.unshift(newPrediction);
            if (st.capsuleWrapped.predictions.length > 50) {
                st.capsuleWrapped.predictions.pop();
            }
        });

        broadcast('CAPSULE_UPDATE', eventStore.getState().capsuleWrapped);
        res.json({ success: true, prediction: newPrediction, capsule: eventStore.getState().capsuleWrapped });
    });

    router.post('/capsule/control', (req, res) => {
        const { action, subOption } = req.body;

        eventStore.update(st => {
            const cap = st.capsuleWrapped;
            if (action === 'set_option' && subOption) {
                cap.activeSubOption = subOption;
            } else if (action === 'play_recap') {
                cap.activeSubOption = 'recap';
                cap.status = 'playing';
            } else if (action === 'insert_vhs') {
                cap.activeSubOption = 'time_capsule';
                cap.status = 'inserting';
            } else if (action === 'seal_capsule') {
                cap.activeSubOption = 'time_capsule';
                cap.status = 'sealed';
                cap.nixieDisplay = '2033';
            } else if (action === 'reset') {
                cap.status = 'standby';
                cap.nixieDisplay = '080';
            }
        });

        const updatedCap = eventStore.getState().capsuleWrapped;
        broadcast('CAPSULE_UPDATE', updatedCap);
        res.json({ success: true, capsule: updatedCap });
    });

    return router;
};
