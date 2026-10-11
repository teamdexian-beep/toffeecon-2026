const fs = require('fs');
const path = require('path');

class CastingStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/casting_state.json');
        this.mediaDir = path.join(__dirname, '../data/media');
        this.saveTimer = null;
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            status: 'active',
            totalAuditions: 3,
            candidates: [
                {
                    id: 'cand-1',
                    characterName: 'বল্টু ভাই (Boltu Bhai)',
                    realName: 'তানভীর আহমেদ',
                    genre: 'thriller',
                    roleTitle: 'Old Dhaka Underground Don',
                    tagline: 'শহরের প্রতিটা গলিতে আমার নিঃশ্বাসের শব্দ বাজে।',
                    summary: 'পুরান ঢাকার বিরিয়ানির কারবারি হলেও রাতের আঁধারে নিয়ন্ত্রণ করে সমগ্র নদীপথের চোরাচালান। ঠান্ডা মাথার কুশলী কিন্তু বন্ধুদের জন্য জানবাজ।',
                    portraitUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
                    ottScore: 94,
                    scoreBreakdown: { screenPresence: 96, dramaticGrit: 94, dialoguePunch: 92, originality: 95 },
                    prompts: {
                        portraitPrompt: 'Ultra-cinematic character portrait of a rugged Bangladeshi don named Boltu Bhai, mid-30s, sharp piercing eyes, dark mustard kurta with gold chain, brooding expression, Dhaka rain backdrop, amber neon lighting, 35mm film grain, 8k --ar 9:16',
                        fullBodyPrompt: 'Full body cinematic action shot of Boltu Bhai standing on a wooden boat in Buriganga river, atmospheric river fog, moody night, streetlights reflecting on water, looking into camera with quiet menace, photorealistic, cinematic grading',
                        veo10sPrompt: 'Cinematic 10-second OTT character reveal. [Camera Move: slow dolly push-in transitioning to high-angle reveal]. Boltu Bhai, dressed in black silk kurta with gold buttons, turns his collar up as heavy monsoon rain pours down. He glares straight into the camera lens with a faint, lethal smirk. Volumetric amber rim lighting cutting through dense blue fog. Atmospheric audio: low bass drone, rain sound effects, 24fps 4K.'
                    },
                    videoUrl: 'https://assets.toffeecon.live/dubs/sample.mp4',
                    isTop10: true,
                    rank: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'cand-2',
                    characterName: 'মায়া সেন (Maya Sen)',
                    realName: 'ইশরাত জাহান',
                    genre: 'action',
                    roleTitle: 'Cyber Crime Spec-Ops Agent',
                    tagline: 'ফায়ারওয়াল ভাঙা সহজ, কিন্তু আমার নজর ফাঁকি দেওয়া অসম্ভব।',
                    summary: 'জাতীয় ডিজিটাল সিকিউরিটি সেলের শীর্ষ গোয়েন্দা কর্মকর্তা। ডার্কওয়েবের সবচেয়ে বিপজ্জনক সিন্ডিকেটকে একাই ধাওয়া করছেন ঢাকার নিয়ন-ভেজা অলিতে গলিতে।',
                    portraitUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                    ottScore: 91,
                    scoreBreakdown: { screenPresence: 92, dramaticGrit: 90, dialoguePunch: 93, originality: 89 },
                    prompts: {
                        portraitPrompt: 'Cinematic portrait of female tactical hacker detective Maya Sen in Dhaka cyber police unit, dark tactical bomber jacket, sleek braided hair, glowing holographic reflections on her face, cool cyan and magenta neon hues, photorealistic 8k',
                        fullBodyPrompt: 'Full body stance of Maya Sen in tactical operations room, surrounded by glowing data monitors, holster on belt, confident authoritative posture, atmospheric dust motes in light beams, 35mm anamorphic cinema lens',
                        veo10sPrompt: 'Cinematic 10-second OTT character reveal. [Camera Move: dynamic 180-degree camera sweep]. Maya Sen holsters a tactical sidearm inside a neon-lit server room, then taps an ear communicator. She turns sharply to look into the lens, eyes narrowing with determination. Flickering blue server lights and lens flare. Audio: electric pulse and radio chirp, 24fps 4K.'
                    },
                    videoUrl: 'https://assets.toffeecon.live/dubs/sample.mp4',
                    isTop10: true,
                    rank: 2,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'cand-3',
                    characterName: 'রকস্টার রনি (Rockstar Rony)',
                    realName: 'রাকিবুল হাসান',
                    genre: 'comedy',
                    roleTitle: 'Chittagong Underground Rapper',
                    tagline: 'গান আমার রক্তে, ডায়লগে ফাটিয়ে দেব পুরো ঢাকা!',
                    summary: 'চট্টগ্রামের লোকাল গলির তুখোড় র‍্যাপার। কথা বলতে গেলে ভুল ইংরেজি কিন্তু স্টেজে উঠলে আগুনের ফুলকি। যার ড্রামা দেখার জন্য সারা মহল্লা পাগল।',
                    portraitUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
                    ottScore: 88,
                    scoreBreakdown: { screenPresence: 89, dramaticGrit: 84, dialoguePunch: 95, originality: 86 },
                    prompts: {
                        portraitPrompt: 'Vibrant expressive portrait of energetic Bengali street rapper Rony, oversized retro vintage shades, quirky smile, colourful street graffiti wall background, golden hour rim light, high fashion editorial style, 8k',
                        fullBodyPrompt: 'Full body high energy pose of street musician Rony holding a vintage microphone on a Dhaka rooftop, sunset skyline behind, vibrant casual streetwear, cinematic depth of field',
                        veo10sPrompt: 'Cinematic 10-second OTT character reveal. [Camera Move: quick snap-zoom into low-angle hero shot]. Rockstar Rony points his retro mic at the camera, spins around with charismatic street energy, and drops his sunglasses to wink into the lens. Golden sunset flare and rooftop breeze blowing. Audio: punchy beat drop and crowd cheer, 24fps 4K.'
                    },
                    videoUrl: 'https://assets.toffeecon.live/dubs/sample.mp4',
                    isTop10: true,
                    rank: 3,
                    createdAt: new Date().toISOString()
                }
            ],
            top10Ids: ['cand-1', 'cand-2', 'cand-3'],
            stagePlayback: {
                status: 'idle',
                activeIndex: 0,
                currentCandidateId: 'cand-1',
                autoPlay: true,
                masterVideoUrl: null
            }
        };
    }

    init() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, 'utf-8');
                const loaded = JSON.parse(raw);
                this.state = Object.assign(this.getInitialState(), loaded);
                console.log('[CastingStore] Hydrated from disk.');
            } else {
                this.state = this.getInitialState();
                this.persist();
                console.log('[CastingStore] Fresh state initialized.');
            }
        } catch (e) {
            console.error('[CastingStore] Init error, using baseline:', e);
            this.state = this.getInitialState();
        }
        return this.state;
    }

    getState() {
        if (!this.state) this.init();
        return this.state;
    }

    persist() {
        try {
            const temp = this.dataPath + '.tmp';
            fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), 'utf-8');
            fs.renameSync(temp, this.dataPath);
        } catch (e) {
            console.error('[CastingStore] Atomic write failure:', e);
        }
    }

    scheduleSave() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.persist(), 250);
    }

    // Save base64 image to disk to avoid memory bloat
    saveImageToDisk(base64Data, filename) {
        if (!base64Data || !base64Data.startsWith('data:image')) return null;
        try {
            const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) return null;
            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            const safeName = `${filename}.${ext}`;
            const diskPath = path.join(this.mediaDir, safeName);
            fs.writeFileSync(diskPath, buffer);
            return `/api/media/${safeName}`;
        } catch (e) {
            console.error('[CastingStore] Image save error:', e);
            return null;
        }
    }

    addCandidate(candidateData) {
        if (!this.state) this.init();
        const candId = 'cand-' + Date.now();

        // Optional disk offloading for captured photo
        let portraitUrl = candidateData.photoBase64;
        if (candidateData.photoBase64 && candidateData.photoBase64.startsWith('data:image')) {
            const savedUrl = this.saveImageToDisk(candidateData.photoBase64, candId);
            if (savedUrl) portraitUrl = savedUrl;
        }

        const candidate = {
            id: candId,
            characterName: candidateData.characterName || 'বল্টু ভাই',
            realName: candidateData.realName || 'অডিশন প্রার্থী',
            genre: candidateData.genre || 'thriller',
            roleTitle: candidateData.roleTitle,
            tagline: candidateData.tagline,
            summary: candidateData.summary,
            portraitUrl: portraitUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
            ottScore: candidateData.ottScore,
            scoreBreakdown: candidateData.scoreBreakdown,
            prompts: candidateData.prompts,
            videoUrl: '',
            isTop10: false,
            rank: null,
            createdAt: new Date().toISOString()
        };

        this.state.candidates.unshift(candidate);
        this.state.totalAuditions = this.state.candidates.length;

        // Auto calculate rank
        const sorted = [...this.state.candidates].sort((a, b) => b.ottScore - a.ottScore);
        candidate.rank = sorted.findIndex(c => c.id === candId) + 1;

        this.scheduleSave();
        return candidate;
    }

    curateTop10(top10Ids) {
        if (!this.state) this.init();
        this.state.top10Ids = top10Ids;
        this.state.candidates.forEach(cand => {
            const idx = top10Ids.indexOf(cand.id);
            cand.isTop10 = idx !== -1;
            cand.rank = idx !== -1 ? idx + 1 : cand.rank;
        });
        this.scheduleSave();
        return this.state.top10Ids;
    }

    uploadClip(candidateId, videoUrl) {
        if (!this.state) this.init();
        const cand = this.state.candidates.find(c => c.id === candidateId);
        if (cand) {
            cand.videoUrl = videoUrl;
            this.scheduleSave();
            return cand;
        }
        return null;
    }

    updateStagePlayback({ action, index, candidateId, autoPlay, masterVideoUrl }) {
        if (!this.state) this.init();
        const sp = this.state.stagePlayback;
        const top10 = this.state.top10Ids;

        if (action === 'LAUNCH') {
            sp.status = 'intro';
            sp.activeIndex = 0;
            sp.currentCandidateId = top10[0] || null;
        } else if (action === 'PLAY') {
            sp.status = 'playing';
        } else if (action === 'PAUSE') {
            sp.status = 'paused';
        } else if (action === 'NEXT') {
            if (sp.activeIndex < top10.length - 1) {
                sp.activeIndex += 1;
                sp.currentCandidateId = top10[sp.activeIndex];
                sp.status = 'playing';
            }
        } else if (action === 'PREV') {
            if (sp.activeIndex > 0) {
                sp.activeIndex -= 1;
                sp.currentCandidateId = top10[sp.activeIndex];
                sp.status = 'playing';
            }
        } else if (action === 'SET_ACTIVE') {
            if (typeof index === 'number' && index >= 0 && index < top10.length) {
                sp.activeIndex = index;
                sp.currentCandidateId = top10[index];
            } else if (candidateId) {
                const foundIdx = top10.indexOf(candidateId);
                if (foundIdx !== -1) {
                    sp.activeIndex = foundIdx;
                    sp.currentCandidateId = candidateId;
                }
            }
        } else if (action === 'WINNER') {
            sp.status = 'winner';
            sp.activeIndex = 0;
            sp.currentCandidateId = top10[0] || null;
        } else if (action === 'RESET') {
            sp.status = 'idle';
            sp.activeIndex = 0;
        }

        if (typeof autoPlay === 'boolean') sp.autoPlay = autoPlay;
        if (masterVideoUrl) sp.masterVideoUrl = masterVideoUrl;

        this.scheduleSave();
        return sp;
    }
}

const castingStore = new CastingStore();
castingStore.init();
module.exports = castingStore;
