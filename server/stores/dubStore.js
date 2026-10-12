const fs = require('fs');
const path = require('path');

class DubStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/dub_state.json');
        this.mediaDir = path.join(__dirname, '../data/media');
        this.saveTimer = null;
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            status: 'active',
            totalDubs: 0,
            takes: [
                {
                    id: 'DUB-1001',
                    guestName: 'আরাফাত চৌধুরী',
                    originalText: 'ছু মন্তর ছু কালিপুত্তের গু! মামা খেলা হবে!',
                    language: 'japanese',
                    targetDialect: 'japanese',
                    languageLabel: 'Japanese Anime (জাপানিজ)',
                    characterRole: 'Tokyo Anime Samurai',
                    characterName: 'রেন কায়াতো (Ren Kayato)',
                    translatedText: 'チュモントル・チュ・カリプッテル・グ！おじさん、勝負だ！',
                    phoneticText: 'Chu montoru chu kariputteru gu! Ojisan, shōbu da!',
                    avatarImage: '/api/media/dub_avatars/japanese.jpg',
                    audioVoiceCode: 'ja-JP',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'DUB-1002',
                    guestName: 'মেহজাবিন আলম',
                    originalText: 'আইন দিয়ে আদালত চলে, আর এই মহল্লা চলে আমার কথায়!',
                    language: 'russian',
                    targetDialect: 'russian',
                    languageLabel: 'Russian Cold War (রাশিয়ান)',
                    characterRole: 'Moscow Underworld Boss',
                    characterName: 'ভিক্টর সোবোলভ (Viktor Sobolev)',
                    translatedText: 'Закон правит судом, а этот район слушает только меня!',
                    phoneticText: 'Zakon pravit sudom, a etot rayon slushayet tolko menya!',
                    avatarImage: '/api/media/dub_avatars/russian.jpg',
                    audioVoiceCode: 'ru-RU',
                    createdAt: new Date().toISOString()
                }
            ]
        };
    }

    init() {
        try {
            if (!fs.existsSync(this.mediaDir)) {
                fs.mkdirSync(this.mediaDir, { recursive: true });
            }
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, 'utf-8');
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.takes)) {
                    this.state = parsed;
                    console.log(`[DubStore] Loaded ${this.state.takes.length} dub sessions from disk.`);
                    return;
                }
            }
        } catch (e) {
            console.error('[DubStore] Error loading dub state:', e.message);
        }
        this.persist();
    }

    getState() {
        return this.state;
    }

    getTake(id) {
        if (!id) return null;
        return this.state.takes.find(t => t.id === id || t.id.toLowerCase() === id.toLowerCase()) || null;
    }

    addTake(takeData) {
        const id = takeData.id || ('DUB-' + Math.floor(1000 + Math.random() * 9000));
        const newTake = {
            id,
            guestName: takeData.guestName || 'VIP Creator',
            originalText: takeData.originalText || '',
            language: takeData.language || 'japanese',
            targetDialect: takeData.language || 'japanese',
            languageLabel: takeData.languageLabel || 'Global Language',
            characterRole: takeData.characterRole || 'OTT Character',
            characterName: takeData.characterName || 'Hero',
            translatedText: takeData.translatedText || '',
            phoneticText: takeData.phoneticText || '',
            avatarImage: takeData.avatarImage || '/api/media/dub_avatars/japanese.jpg',
            audioVoiceCode: takeData.audioVoiceCode || 'ja-JP',
            audioUrl: takeData.audioUrl || null,
            createdAt: new Date().toISOString()
        };

        this.state.takes.unshift(newTake);
        // Keep at most 200 takes in memory
        if (this.state.takes.length > 200) {
            this.state.takes = this.state.takes.slice(0, 200);
        }
        this.state.totalDubs = this.state.takes.length;
        this.scheduleSave();
        return newTake;
    }

    scheduleSave() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.persist(), 400);
    }

    persist() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.state, null, 2), 'utf-8');
        } catch (e) {
            console.error('[DubStore] Failed to persist state:', e.message);
        }
    }
}

const dubStore = new DubStore();
dubStore.init();

module.exports = dubStore;
