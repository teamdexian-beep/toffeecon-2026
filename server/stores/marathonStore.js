const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/marathon_state.json');

const DEFAULT_QUESTIONS = [
    {
        id: 'q1',
        keynoteChapter: 'CHAPTER 1: THE INCEPTION',
        keynoteSlide: 'Slide 06 · The Birth of Native Streaming',
        speakerPrompt: 'Taimur Rahman: "Who remembers the humble beginnings in 2019 when we first took Bangladesh by storm?"',
        q: 'In what year did Toffee officially launch in Bangladesh?',
        options: [
            'A) 2017 (Beta Trial)',
            'B) 2019 (Commercial Launch)',
            'C) 2021 (Post-Pandemic)',
            'D) 2015 (Pre-Banglalink 4G)'
        ],
        correct: 1,
        explanation: 'Toffee launched commercially in November 2019, quickly becoming Bangladesh\'s highest-rated entertainment app.'
    },
    {
        id: 'q2',
        keynoteChapter: 'CHAPTER 2: REACH & AUDIENCE SURGE',
        keynoteSlide: 'Slide 12 · Democratizing Entertainment',
        speakerPrompt: 'Taimur Rahman: "We set out to reach every household. Look at the numbers today on this 40ft LED!"',
        q: 'How many lifetime users have experienced Toffee streaming to date?',
        options: [
            'A) 25 Million+ Registered',
            'B) 50 Million+ Active',
            'C) Almost 100 Million+ Lifetime',
            'D) 200 Million+ Global'
        ],
        correct: 2,
        explanation: 'Over 95M–100M unique viewers have streamed content on Toffee across mobile and connected TV.'
    },
    {
        id: 'q3',
        keynoteChapter: 'CHAPTER 3: THE SPORTS ARENA',
        keynoteSlide: 'Slide 18 · Unrivaled Sports Broadcasting',
        speakerPrompt: 'Taimur Rahman: "From the historic FIFA World Cup 2022 to the Asia Cup and EPL live at 60 FPS!"',
        q: 'How many global sporting tournaments & World Cups were broadcast on Toffee?',
        options: [
            'A) 4 Tournaments',
            'B) 6 Tournaments',
            'C) 8 Mega Tournaments',
            'D) 14 Tournaments'
        ],
        correct: 2,
        explanation: 'Toffee has streamed 8 mega tournaments including FIFA World Cup Qatar 2022, Asia Cup, and ICC World Cups.'
    },
    {
        id: 'q4',
        keynoteChapter: 'CHAPTER 4: THE GENERATIVE AI FRONTIER',
        keynoteSlide: 'Slide 24 · Creator Voice Morphing & AI',
        speakerPrompt: 'Taimur Rahman: "You all experienced it outside in the foyer just an hour ago — our revolutionary AI activation!"',
        q: 'What new AI feature introduces local dialect voice-morphing for creators?',
        options: [
            'A) VoiceMorph Studio',
            'B) The Dub Booth',
            'C) AudioSync Neural',
            'D) BhashaAI Engine'
        ],
        correct: 1,
        explanation: 'The Dub Booth allows creators to voice-dub iconic cinema scenes into regional Bangla dialects (Noakhali, Chittagong, Sylheti) and global languages.'
    },
    {
        id: 'q5',
        keynoteChapter: 'CHAPTER 5: VISION 2033 & THE FUTURE',
        keynoteSlide: 'Slide 30 · The Next 7 Years of Streaming',
        speakerPrompt: 'Taimur Rahman: "Our theme for tonight represents not just today, but our contract with the future!"',
        q: 'What is the official 7-year anniversary summit theme of ToffeeCon 2026?',
        options: [
            'A) Screen of Tomorrow',
            'B) Future of Mobile',
            'C) Digital Bengal 2030',
            'D) Next-Gen OTT Network'
        ],
        correct: 0,
        explanation: '"Screen of Tomorrow" is the defining keynote theme for Toffee\'s next 7 years of interactive entertainment.'
    }
];

const SEED_RACERS = [
    { id: 'r-01', name: 'Sarah_K', score: 3240, progress: 0.85, streak: 3, avatarColor: '#EC4899' },
    { id: 'r-02', name: 'Tanvir_M', score: 2980, progress: 0.78, streak: 2, avatarColor: '#00F0FF' },
    { id: 'r-03', name: 'Nusrat_A', score: 2750, progress: 0.72, streak: 3, avatarColor: '#FFB800' },
    { id: 'r-04', name: 'Zubair_B', score: 2410, progress: 0.65, streak: 1, avatarColor: '#A855F7' },
    { id: 'r-05', name: 'Ishrat_H', score: 2190, progress: 0.58, streak: 2, avatarColor: '#00FF88' },
    { id: 'r-06', name: 'Adnan_S', score: 1840, progress: 0.49, streak: 1, avatarColor: '#FF6B00' },
    { id: 'r-07', name: 'Fahim_R', score: 1620, progress: 0.42, streak: 1, avatarColor: '#38BDF8' },
    { id: 'r-08', name: 'Mehnaz_T', score: 1250, progress: 0.35, streak: 0, avatarColor: '#F43F5E' }
];

class MarathonStore {
    constructor() {
        this.state = {
            status: 'waiting', // 'waiting' | 'racing' | 'revealed' | 'finished'
            currentQuestionIndex: 0,
            questionStartTime: Date.now(),
            timeLimitSec: 10,
            questions: DEFAULT_QUESTIONS,
            racers: SEED_RACERS,
            winner: null,
            telemetry: {
                totalAnswersSubmitted: 842,
                totalActiveRacers: SEED_RACERS.length,
                averageAnswerSpeedMs: 1420
            }
        };

        this.init();
    }

    init() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                const raw = fs.readFileSync(STATE_FILE, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && parsed.questions && parsed.racers) {
                    this.state = parsed;
                    console.log(`[MarathonStore] Loaded race state with ${this.state.racers.length} racers.`);
                    return;
                }
            }
        } catch (e) {
            console.warn('[MarathonStore] Failed to load disk state, resetting defaults:', e.message);
        }
        this.save();
    }

    save() {
        try {
            const dir = path.dirname(STATE_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
        } catch (e) {
            console.error('[MarathonStore] Save failed:', e.message);
        }
    }

    getState() {
        // Return sorted leaderboard within state
        const sorted = [...this.state.racers].sort((a, b) => b.score - a.score);
        return {
            ...this.state,
            leaderboard: sorted.slice(0, 10)
        };
    }

    registerRacer({ id, name, avatarColor }) {
        let racer = this.state.racers.find(r => r.id === id || r.name === name);
        if (!racer) {
            const colors = ['#00F0FF', '#EC4899', '#FFB800', '#A855F7', '#00FF88', '#FF6B00'];
            racer = {
                id: id || `racer_${Date.now()}`,
                name: (name || `ToffeeRacer_${Math.floor(10 + Math.random() * 90)}`).trim(),
                score: 0,
                progress: 0,
                streak: 0,
                avatarColor: avatarColor || colors[Math.floor(Math.random() * colors.length)],
                answers: []
            };
            this.state.racers.push(racer);
            this.state.telemetry.totalActiveRacers = this.state.racers.length;
            this.save();
        }
        return racer;
    }

    recordAnswer({ playerId, playerName, answerIndex }) {
        let racer = this.registerRacer({ id: playerId, name: playerName });

        const currentQ = this.state.questions[this.state.currentQuestionIndex];
        const isCorrect = Number(answerIndex) === currentQ.correct;
        const elapsedMs = Math.max(100, Date.now() - this.state.questionStartTime);

        // Speed scoring: Max 1000 points, decays down to 250 min based on elapsed time within 10s
        let speedPoints = 0;
        if (isCorrect) {
            const fractionOfTimeLeft = Math.max(0, (10000 - elapsedMs) / 10000);
            speedPoints = Math.round(350 + (fractionOfTimeLeft * 650));
            racer.score += speedPoints;
            racer.streak = (racer.streak || 0) + 1;
            // Progress jump: 18% base + extra speed surge up to 25% per question
            const surge = 0.16 + (speedPoints / 7000);
            racer.progress = Math.min(1.0, racer.progress + surge);
        } else {
            racer.streak = 0;
        }

        // Record history
        racer.answers = racer.answers || [];
        racer.answers[this.state.currentQuestionIndex] = {
            answerIndex,
            isCorrect,
            speedPoints,
            elapsedMs
        };

        this.state.telemetry.totalAnswersSubmitted += 1;

        // Check if finished
        if (racer.progress >= 0.98 && !this.state.winner) {
            this.state.winner = racer;
        }

        this.save();

        return {
            isCorrect,
            speedPoints,
            totalScore: racer.score,
            progress: racer.progress,
            streak: racer.streak,
            racer,
            correctAnswerIndex: currentQ.correct,
            explanation: currentQ.explanation
        };
    }

    controlRace(action, extraPayload = {}) {
        if (action === 'start') {
            this.state.status = 'racing';
            this.state.currentQuestionIndex = 0;
            this.state.questionStartTime = Date.now();
            this.state.winner = null;
            this.state.racers.forEach(r => {
                r.progress = 0;
                r.score = 0;
                r.streak = 0;
                r.answers = [];
            });
        } else if (action === 'reveal') {
            this.state.status = 'revealed';
        } else if (action === 'next') {
            if (this.state.currentQuestionIndex < this.state.questions.length - 1) {
                this.state.currentQuestionIndex += 1;
                this.state.status = 'racing';
                this.state.questionStartTime = Date.now();
            } else {
                this.state.status = 'finished';
                const sorted = [...this.state.racers].sort((a, b) => b.score - a.score);
                this.state.winner = sorted[0] || null;
            }
        } else if (action === 'set_question') {
            const idx = Number(extraPayload.index);
            if (idx >= 0 && idx < this.state.questions.length) {
                this.state.currentQuestionIndex = idx;
                this.state.status = 'racing';
                this.state.questionStartTime = Date.now();
            }
        } else if (action === 'finish') {
            this.state.status = 'finished';
            const sorted = [...this.state.racers].sort((a, b) => b.score - a.score);
            this.state.winner = sorted[0] || null;
        } else if (action === 'reset') {
            this.state.status = 'waiting';
            this.state.currentQuestionIndex = 0;
            this.state.winner = null;
            this.state.racers.forEach(r => {
                r.progress = 0;
                r.score = 0;
                r.streak = 0;
                r.answers = [];
            });
        }

        this.save();
        return this.getState();
    }
}

module.exports = new MarathonStore();
