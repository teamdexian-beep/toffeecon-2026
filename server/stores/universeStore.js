const fs = require('fs');
const path = require('path');

class UniverseStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/universe_state.json');
        this.mediaDir = path.join(__dirname, '../data/media');
        this.saveTimer = null;
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            status: 'active',
            totalTransformations: 4,
            posters: [
                {
                    id: 'UNIV-1001',
                    guestName: 'তানভীর আহমেদ',
                    genre: 'action',
                    genreLabel: 'Action: Cyberpunk Commando',
                    tagline: 'WARFARE IN 2033',
                    badgeText: 'TOFFEECON ORIGINAL · ACTION LEADER',
                    accentColor: '#FF6B00',
                    posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'UNIV-1002',
                    guestName: 'আসিফ জামান',
                    genre: 'sports',
                    genreLabel: 'Sports: Stadium Titan',
                    tagline: 'FIFA WORLD STAGE',
                    badgeText: 'TOFFEECON SPORTS · LIVE 60FPS',
                    accentColor: '#00F0FF',
                    posterUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'UNIV-1003',
                    guestName: 'মেহজাবিন চৌধুরী',
                    genre: 'adventure',
                    genreLabel: 'Adventure: Peak Conqueror',
                    tagline: 'SUMMIT EXPEDITION',
                    badgeText: 'TOFFEECON WILD · 4K EXPEDITIONS',
                    accentColor: '#10B981',
                    posterUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 'UNIV-1004',
                    guestName: 'সাকিবা হক',
                    genre: 'drama',
                    genreLabel: 'Drama: Cinematic Noir',
                    tagline: 'PSYCHOLOGICAL THRILLER',
                    badgeText: 'TOFFEECON DRAMA · CRITIC ACCLAIM',
                    accentColor: '#A855F7',
                    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
                    timestamp: new Date().toISOString()
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
                if (parsed && Array.isArray(parsed.posters)) {
                    this.state = parsed;
                    console.log(`[UniverseStore] Loaded ${this.state.posters.length} universe posters from disk.`);
                    return;
                }
            }
        } catch (e) {
            console.error('[UniverseStore] Error loading state:', e.message);
        }
        this.persist();
    }

    getState() {
        return this.state;
    }

    getPoster(id) {
        if (!id) return null;
        return this.state.posters.find(p => p.id === id || p.id.toLowerCase() === id.toLowerCase()) || null;
    }

    addPoster(data) {
        const id = data.id || ('UNIV-' + Math.floor(1000 + Math.random() * 9000));
        const newPoster = {
            id,
            guestName: data.guestName || 'VIP Guest',
            genre: data.genre || 'action',
            genreLabel: data.genreLabel || data.template?.title || 'Retro-Futuristic Hero',
            tagline: data.tagline || data.template?.tag || 'ENTERTAINMENT 2033',
            badgeText: data.badgeText || data.template?.badgeText || 'TOFFEECON 2026',
            accentColor: data.accentColor || data.template?.accentColor || '#FF10F0',
            posterUrl: data.posterUrl || data.template?.backdropUrl,
            rawGuestPhoto: data.rawGuestPhoto || null,
            timestamp: new Date().toISOString()
        };

        this.state.posters.unshift(newPoster);
        if (this.state.posters.length > 200) {
            this.state.posters = this.state.posters.slice(0, 200);
        }
        this.state.totalTransformations = this.state.posters.length;
        this.scheduleSave();
        return newPoster;
    }

    scheduleSave() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.persist(), 400);
    }

    persist() {
        try {
            fs.writeFileSync(this.dataPath, JSON.stringify(this.state, null, 2), 'utf-8');
        } catch (e) {
            console.error('[UniverseStore] Failed to persist state:', e.message);
        }
    }
}

const universeStore = new UniverseStore();
universeStore.init();

module.exports = universeStore;
