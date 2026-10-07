const express = require('express');
const router = express.Router();

module.exports = function(eventStore, broadcast) {
    // Stage Keynote & Multi-Screen Scene Control API
    router.post('/control', (req, res) => {
        const { action, scene, speakerName, speakerRole, speakerTopic } = req.body;
        const state = eventStore.getState();

        eventStore.update(st => {
            // Scene Switching: 'ambient' | 'opening_film' | 'speaker_portal' | 'sonic_battle' | 'marathon_race' | 'personal_dashboard' | 'wrapped_capsule'
            if (scene) {
                st.stageScene = scene;
                st.stageSpeaker = {
                    name: speakerName || st.stageSpeaker?.name || 'Taimur Rahman',
                    role: speakerRole || st.stageSpeaker?.role || 'Chief Commercial Officer · Banglalink',
                    topic: speakerTopic || st.stageSpeaker?.topic || 'The Future of OTT in Bangladesh'
                };
            }

            if (action === 'reset') {
                st.votingEngine.options.red.votes = 300;
                st.votingEngine.options.blue.votes = 300;
                st.votingEngine.status = 'open';
            } else if (action === 'lock') {
                st.votingEngine.status = 'locked';
            } else if (action === 'reveal') {
                st.votingEngine.status = 'revealed';
            } else if (action === 'open') {
                st.votingEngine.status = 'open';
            } else if (action === 'panic_blackout') {
                st.stageScene = 'ambient';
            }
        });

        const updated = eventStore.getState();

        if (scene) {
            broadcast('STAGE_SCENE_CHANGE', {
                scene: updated.stageScene,
                speaker: updated.stageSpeaker
            });
        }

        if (action) {
            broadcast('STAGE_CONTROL', {
                action,
                voting: updated.votingEngine
            });
        }

        res.json({ success: true, scene: updated.stageScene, voting: updated.votingEngine });
    });

    return router;
};
