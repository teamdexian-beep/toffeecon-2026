const fs = require('fs');
const path = require('path');

class EventStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/event_state.json');
        this.snapshotDir = path.join(__dirname, '../data/snapshots');
        this.saveTimer = null;
        this.state = null;
    }

    getInitialState() {
        return {
            connectedClients: 0,
            phoneWall: {
                totalPhones: 100,
                activePhones: {},
                cycleDurationSec: 30,
                currentMode: 'multilingual',
                lastSyncTimestamp: Date.now()
            },
            votingEngine: {
                activePoll: 'sonic_dilemma',
                title: 'The Sonic Dilemma: Official Toffee Brand Sound',
                options: {
                    red: { label: 'Sonic Alpha (Retro Dynamic)', votes: 312 },
                    blue: { label: 'Sonic Beta (Futuristic Pulse)', votes: 288 }
                },
                status: 'open'
            },
            telemetry: {
                checkedInAttendees: 548,
                totalRSVP: 600,
                dubBoothsCompleted: 284,
                adProposalsPrinted: 92
            },
            stageScene: 'ambient',
            stageSpeaker: {
                name: 'Taimur Rahman',
                role: 'Chief Commercial Officer · Banglalink',
                topic: 'Screen of Tomorrow: The Next 7 Years of Streaming'
            },
            marathonRace: {
                status: 'waiting',
                currentQuestionIndex: 0,
                questionStartTime: Date.now(),
                timeLimitSec: 10,
                questions: [
                    {
                        q: "In what year did Toffee officially launch in Bangladesh?",
                        options: ["A) 2017", "B) 2019", "C) 2021", "D) 2015"],
                        correct: 1
                    },
                    {
                        q: "How many lifetime users have experienced Toffee streaming?",
                        options: ["A) 25 Million+", "B) 50 Million+", "C) Almost 100 Million+", "D) 200 Million+"],
                        correct: 2
                    },
                    {
                        q: "How many World Cup tournaments were broadcasted on Toffee?",
                        options: ["A) 4 Events", "B) 6 Events", "C) 8 Events", "D) 12 Events"],
                        correct: 2
                    },
                    {
                        q: "What is the new AI feature allowing local dialect voice-overs?",
                        options: ["A) VoiceMorph", "B) The Dub Booth", "C) AudioSync AI", "D) BhashaAI"],
                        correct: 1
                    },
                    {
                        q: "What is the 7-year anniversary summit theme of ToffeeCon 2026?",
                        options: ["A) Screen of Tomorrow", "B) Future of Mobile", "C) Digital Bengal", "D) StreamFest"],
                        correct: 0
                    }
                ],
                racers: [
                    { id: 'p1', name: 'Sarah_K', progress: 0.15, score: 320 },
                    { id: 'p2', name: 'Tanvir_M', progress: 0.22, score: 450 },
                    { id: 'p3', name: 'Fahim_R', progress: 0.08, score: 180 },
                    { id: 'p4', name: 'Nusrat_A', progress: 0.30, score: 610 },
                    { id: 'p5', name: 'Zubair_B', progress: 0.12, score: 250 },
                    { id: 'p6', name: 'Ishrat_H', progress: 0.25, score: 520 },
                    { id: 'p7', name: 'Adnan_S', progress: 0.18, score: 380 },
                    { id: 'p8', name: 'Mehnaz_T', progress: 0.05, score: 110 }
                ],
                winner: null
            },
            personalDashboard: {
                status: 'voting',
                currentRoundIndex: 0,
                rounds: [
                    {
                        id: 'round_1',
                        category: 'Storytelling Heartbeats',
                        optionA: { id: 'drama', label: 'Gripping Drama & Suspense', votes: 240, color: '#A855F7', icon: '🎭' },
                        optionB: { id: 'romance', label: 'Soulful Bengali Romance', votes: 160, color: '#EC4899', icon: '💖' },
                        showcaseUrl: 'https://assets.toffeecon.live/reels/drama_showcase.mp4'
                    },
                    {
                        id: 'round_2',
                        category: 'Pulse of the Nation: Sports Fever',
                        optionA: { id: 'cricket', label: 'Tigers Live Cricket (4K)', votes: 310, color: '#10B981', icon: '🏏' },
                        optionB: { id: 'football', label: 'World Cup Thrills (Full HD)', votes: 290, color: '#00F0FF', icon: '⚽' },
                        showcaseUrl: 'https://assets.toffeecon.live/reels/sports_showcase.mp4'
                    },
                    {
                        id: 'round_3',
                        category: 'Cinematic Roots vs Next-Gen',
                        optionA: { id: 'action', label: 'Original Thrillers & Action', votes: 195, color: '#FF6B00', icon: '🔥' },
                        optionB: { id: 'classics', label: 'Golden Era Digitally Restored', votes: 205, color: '#F59E0B', icon: '📽️' },
                        showcaseUrl: 'https://assets.toffeecon.live/reels/classics_showcase.mp4'
                    }
                ]
            },
            capsuleWrapped: {
                activeSubOption: 'time_capsule',
                status: 'standby',
                nixieDisplay: '080',
                targetYear: 2033,
                currentYear: 2026,
                recapTitle: 'ToffeeCon 2026: 7 Years of Screenovation',
                recapSignoff: 'See you in 7 years.',
                predictions: [
                    { id: 'pred_1', author: 'Erik Aas', company: 'Banglalink CEO', text: '100% of Bangladeshi homes will stream on 6G holographic arrays by 2033.', timestamp: '14:20' },
                    { id: 'pred_2', author: 'Taimur Rahman', company: 'Banglalink CCO', text: 'AI dialect dubbing will become the global standard for South Asian streaming.', timestamp: '14:24' },
                    { id: 'pred_3', author: 'Shakib Al Hasan', company: 'Brand Ambassador', text: 'Live cricket will be watched from a 360-degree pitch camera inside VR glasses.', timestamp: '14:31' }
                ]
            },
            universeBooth: {
                activeUniverse: 'scifi',
                totalPortraitsRendered: 142,
                recentPosters: []
            },
            tasteDuel: {
                currentQuestionIndex: 0,
                questions: [
                    { id: 'q1', text: 'Late night streaming binge snack?', optA: 'Fuchka & Tea', optB: 'Pizza & Cola' },
                    { id: 'q2', text: 'Preferred match watching environment?', optA: 'Stadium crowd roar', optB: 'Living room couch with Toffee' },
                    { id: 'q3', text: 'Weekend movie vibe?', optA: 'Nostalgic 90s Dhallywood', optB: 'High-octane Cyberpunk action' }
                ],
                guestAnswers: [],
                friendGuesses: [],
                duelOutcome: null
            },
            ottAudition: {
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
                    status: 'idle', // 'idle', 'intro', 'playing', 'paused', 'winner'
                    activeIndex: 0,
                    currentCandidateId: 'cand-1',
                    autoPlay: true,
                    masterVideoUrl: null
                }
            }
        };
    }

    init() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, 'utf-8');
                const loaded = JSON.parse(raw);
                this.state = Object.assign(this.getInitialState(), loaded);
                console.log('[EventStore] State successfully loaded and hydrated from disk.');
            } else {
                this.state = this.getInitialState();
                this.persist();
                console.log('[EventStore] Fresh event state initialized and written to disk.');
            }
        } catch (e) {
            console.error('[EventStore] Error loading state from disk, using baseline:', e);
            this.state = this.getInitialState();
        }
        return this.state;
    }

    getState() {
        if (!this.state) {
            this.init();
        }
        return this.state;
    }

    addAuditLog(entry = {}) {
        if (!this.state) this.init();
        if (!this.state.auditLogs || !Array.isArray(this.state.auditLogs)) {
            this.state.auditLogs = [];
        }
        const logEntry = {
            id: entry.id || Date.now(),
            timestamp: entry.timestamp || new Date().toISOString(),
            ...entry
        };
        this.state.auditLogs.unshift(logEntry);
        if (this.state.auditLogs.length > 100) {
            this.state.auditLogs.pop();
        }
        this.scheduleSave();
        return logEntry;
    }

    getAuditLogs(limit = 50) {
        if (!this.state) this.init();
        const logs = this.state.auditLogs || [];
        return logs.slice(0, limit);
    }

    update(mutatorFn) {
        if (!this.state) this.init();
        try {
            mutatorFn(this.state);
        } catch (err) {
            console.error('[EventStore] Mutator error:', err);
        }
        this.scheduleSave();
        return this.state;
    }

    scheduleSave() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.persist();
        }, 300);
    }

    persist() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        try {
            const tempPath = this.dataPath + '.tmp';
            fs.writeFileSync(tempPath, JSON.stringify(this.state, null, 2), 'utf-8');
            fs.renameSync(tempPath, this.dataPath);
        } catch (err) {
            console.error('[EventStore] Atomic write failure:', err);
        }
    }

    snapshot(tag = 'checkpoint') {
        try {
            if (!fs.existsSync(this.snapshotDir)) {
                fs.mkdirSync(this.snapshotDir, { recursive: true });
            }
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const snapPath = path.join(this.snapshotDir, `snapshot_${stamp}_${tag}.json`);
            fs.writeFileSync(snapPath, JSON.stringify(this.state, null, 2), 'utf-8');
            console.log(`[EventStore] Snapshot created: ${snapPath}`);
            return snapPath;
        } catch (err) {
            console.error('[EventStore] Snapshot failure:', err);
            return null;
        }
    }

    resetToBaseline() {
        this.snapshot('pre_reset');
        this.state = this.getInitialState();
        this.persist();
        console.log('[EventStore] State reset to baseline.');
        return this.state;
    }
}

const eventStore = new EventStore();
module.exports = eventStore;
