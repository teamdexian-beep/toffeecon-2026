const fs = require('fs');
const path = require('path');

class ScheduleStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/event_schedule.json');
        this.saveTimer = null;
        this.state = this.getInitialState();
    }

    /**
     * Canonical 12-Beat Run of Show Seed (Verbatim Ingestion)
     */
    getInitialState() {
        return {
            activeDay: 1,
            days: [1],
            date: "2026-10-23",
            lastUpdated: new Date().toISOString(),
            schedule: [
                {
                    id: "beat-01",
                    order: 1,
                    day: 1,
                    time: "6:00 PM",
                    startTime: "18:00",
                    durationMinutes: 30,
                    type: "PROGRAM",
                    title: "Arrival",
                    details: "Entry & buffer",
                    speaker: null,
                    designation: null,
                    stage: "Main Foyer & Gate 01",
                    status: "UPCOMING"
                },
                {
                    id: "beat-02",
                    order: 2,
                    day: 1,
                    time: "6:30 PM",
                    startTime: "18:30",
                    durationMinutes: 30,
                    type: "PROGRAM",
                    title: "Experiential Zones",
                    details: "Guided activities",
                    speaker: null,
                    designation: null,
                    stage: "Experiential Hall & Interactive Booths",
                    status: "UPCOMING"
                },
                {
                    id: "beat-03",
                    order: 3,
                    day: 1,
                    time: "7:00 PM",
                    startTime: "19:00",
                    durationMinutes: 4,
                    type: "PROGRAM",
                    title: "Trailer",
                    details: "Guests seated",
                    speaker: null,
                    designation: null,
                    stage: "Main Arena & 3-Screen LED",
                    status: "UPCOMING"
                },
                {
                    id: "beat-04",
                    order: 4,
                    day: 1,
                    time: "7:04 PM",
                    startTime: "19:04",
                    durationMinutes: 3,
                    type: "KEYNOTE",
                    title: "Keynote 1: Welcome · 7-year journey",
                    details: "Welcome and reflection on 7 years of streaming innovation",
                    speaker: "Taimur Rahman",
                    designation: "CCRO",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-05",
                    order: 5,
                    day: 1,
                    time: "7:07 PM",
                    startTime: "19:07",
                    durationMinutes: 28,
                    type: "PARTNER",
                    title: "Content Partner",
                    details: "Brief on-screen & on stage acknowledgement",
                    speaker: "Content Partner Leads",
                    designation: "Premier Studios & Creator Guilds",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-06",
                    order: 6,
                    day: 1,
                    time: "7:35 PM",
                    startTime: "19:35",
                    durationMinutes: 4,
                    type: "PARTNER",
                    title: "BCB · BFF",
                    details: "Joint partner acknowledgement",
                    speaker: "BCB & BFF Leadership",
                    designation: "Bangladesh Cricket Board & Football Federation",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-07",
                    order: 7,
                    day: 1,
                    time: "7:39 PM",
                    startTime: "19:39",
                    durationMinutes: 28,
                    type: "KEYNOTE",
                    title: "Keynote 2: Platform & tech",
                    details: "Platform scale, concurrency architecture & advertising engine",
                    speaker: "Modasser Ahmed",
                    designation: "Dy. Director",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-08",
                    order: 8,
                    day: 1,
                    time: "8:07 PM",
                    startTime: "20:07",
                    durationMinutes: 4,
                    type: "PARTNER",
                    title: "Martech · Tech Partner",
                    details: "Clevertap/Mixpanel · Skanda",
                    speaker: "Skanda",
                    designation: "CleverTap / Mixpanel",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-09",
                    order: 9,
                    day: 1,
                    time: "8:11 PM",
                    startTime: "20:11",
                    durationMinutes: 30,
                    type: "KEYNOTE",
                    title: "Keynote 3: Future vision · Closing",
                    details: "2033 streaming roadmap, next-gen devices & finale vision",
                    speaker: "Johan Buse",
                    designation: "CEO",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-10",
                    order: 10,
                    day: 1,
                    time: "8:41 PM",
                    startTime: "20:41",
                    durationMinutes: 15,
                    type: "PROGRAM",
                    title: "Interactive Closing",
                    details: "Live set",
                    speaker: "Special Guest Artists",
                    designation: "Live Musical Ensemble",
                    stage: "Main Arena Stage",
                    status: "UPCOMING"
                },
                {
                    id: "beat-11",
                    order: 11,
                    day: 1,
                    time: "8:56 PM",
                    startTime: "20:56",
                    durationMinutes: 15,
                    type: "PROGRAM",
                    title: "Press Time",
                    details: "Media session",
                    speaker: "Executive Panel",
                    designation: "Banglalink & Toffee Leadership",
                    stage: "Press Gallery & Media Center",
                    status: "UPCOMING"
                },
                {
                    id: "beat-12",
                    order: 12,
                    day: 1,
                    time: "9:11 PM",
                    startTime: "21:11",
                    durationMinutes: 45,
                    type: "PROGRAM",
                    title: "Finger Food",
                    details: "Networking break and closing",
                    speaker: null,
                    designation: null,
                    stage: "VIP Lounge & Banquet Foyer",
                    status: "UPCOMING"
                }
            ]
        };
    }

    /**
     * Hydrate and initialize schedule store
     */
    init() {
        try {
            const dataDir = path.dirname(this.dataPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, 'utf-8');
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.schedule) && parsed.schedule.length > 0) {
                    this.state = parsed;
                    console.log(`[ScheduleStore] Loaded ${this.state.schedule.length} schedule beats from disk.`);
                    return;
                }
            }
        } catch (e) {
            console.error('[ScheduleStore] Error loading event schedule:', e.message);
        }

        // Initialize with default canonical 12-beat seed
        this.state = this.getInitialState();
        this.persist();
        console.log(`[ScheduleStore] Initialized seed schedule with ${this.state.schedule.length} beats.`);
    }

    getState() {
        return this.state;
    }

    /**
     * Retrieve schedule filtered by day, status, or type
     */
    getSchedule({ day, status, type } = {}) {
        let list = [...this.state.schedule];

        if (day !== undefined && day !== null && day !== '') {
            const targetDay = parseInt(day, 10);
            if (!isNaN(targetDay)) {
                list = list.filter(b => (b.day || 1) === targetDay);
            }
        }

        if (status) {
            const statusUpper = status.toUpperCase().trim();
            list = list.filter(b => b.status === statusUpper);
        }

        if (type) {
            const typeUpper = type.toUpperCase().trim();
            list = list.filter(b => b.type === typeUpper);
        }

        // Sort by order ascending
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        return list;
    }

    /**
     * Find single beat by ID
     */
    getBeatById(id) {
        if (!id) return null;
        const norm = id.toLowerCase().trim();
        return this.state.schedule.find(b => b.id.toLowerCase() === norm) || null;
    }

    /**
     * Determine currently active beat ID
     */
    getActiveBeatId(day = 1) {
        const beats = this.getSchedule({ day });
        const live = beats.find(b => b.status === 'LIVE');
        if (live) return live.id;
        const upcoming = beats.find(b => b.status === 'UPCOMING');
        return upcoming ? upcoming.id : (beats[0] ? beats[0].id : null);
    }

    /**
     * Get currently LIVE beat (or next UPCOMING beat)
     */
    getCurrentBeat(day = 1) {
        const dayBeats = this.getSchedule({ day });
        const live = dayBeats.find(b => b.status === 'LIVE');
        if (live) return live;
        const upcoming = dayBeats.find(b => b.status === 'UPCOMING');
        return upcoming || dayBeats[0] || null;
    }

    /**
     * Update a single beat's properties
     */
    updateBeat(id, updates = {}) {
        const beat = this.getBeatById(id);
        if (!beat) return null;

        const allowedKeys = [
            'time', 'startTime', 'durationMinutes', 'type', 'title', 
            'details', 'speaker', 'designation', 'stage', 'status', 'day', 'order'
        ];

        for (const k of allowedKeys) {
            if (updates[k] !== undefined) {
                if (k === 'durationMinutes' || k === 'order' || k === 'day') {
                    beat[k] = parseInt(updates[k], 10) || beat[k];
                } else {
                    beat[k] = updates[k];
                }
            }
        }

        // Maintain days set
        if (beat.day && !this.state.days.includes(beat.day)) {
            this.state.days.push(beat.day);
            this.state.days.sort((a, b) => a - b);
        }

        this.state.lastUpdated = new Date().toISOString();
        this.scheduleSave();
        return beat;
    }

    /**
     * Transition a beat's status to LIVE, UPCOMING, or COMPLETED
     */
    setBeatStatus(id, newStatus = 'LIVE') {
        const beat = this.getBeatById(id);
        if (!beat) return null;

        const targetStatus = newStatus.toUpperCase().trim();

        if (targetStatus === 'LIVE') {
            const targetDay = beat.day || 1;
            this.state.schedule.forEach(b => {
                if ((b.day || 1) === targetDay && b.status === 'LIVE' && b.id !== beat.id) {
                    b.status = 'COMPLETED';
                }
            });
        }

        beat.status = targetStatus;
        this.state.lastUpdated = new Date().toISOString();
        this.scheduleSave();
        return beat;
    }

    /**
     * Add a new beat
     */
    addBeat(beatData = {}) {
        const day = parseInt(beatData.day, 10) || 1;
        const existingForDay = this.getSchedule({ day });
        const nextOrder = existingForDay.length + 1;
        const nextNum = (this.state.schedule.length + 1).toString().padStart(2, '0');
        const id = beatData.id || `beat-${nextNum}`;

        const newBeat = {
            id,
            order: parseInt(beatData.order, 10) || nextOrder,
            day,
            time: beatData.time || '10:00 PM',
            startTime: beatData.startTime || '22:00',
            durationMinutes: parseInt(beatData.durationMinutes, 10) || 15,
            type: (beatData.type || 'PROGRAM').toUpperCase(),
            title: beatData.title || 'Special Segment',
            details: beatData.details || '',
            speaker: beatData.speaker || null,
            designation: beatData.designation || null,
            stage: beatData.stage || 'Main Arena Stage',
            status: (beatData.status || 'UPCOMING').toUpperCase()
        };

        this.state.schedule.push(newBeat);

        if (!this.state.days.includes(day)) {
            this.state.days.push(day);
            this.state.days.sort((a, b) => a - b);
        }

        this.state.lastUpdated = new Date().toISOString();
        this.scheduleSave();
        return newBeat;
    }

    /**
     * Replace or batch update schedule for a given day
     */
    replaceDaySchedule(day = 1, newBeats = []) {
        const targetDay = parseInt(day, 10) || 1;
        const otherDays = this.state.schedule.filter(b => (b.day || 1) !== targetDay);
        const validatedBeats = newBeats.map((b, idx) => ({
            id: b.id || `beat-${(idx + 1).toString().padStart(2, '0')}`,
            order: b.order || (idx + 1),
            day: targetDay,
            time: b.time || '6:00 PM',
            startTime: b.startTime || '18:00',
            durationMinutes: parseInt(b.durationMinutes, 10) || 15,
            type: (b.type || 'PROGRAM').toUpperCase(),
            title: b.title || 'Untitled Beat',
            details: b.details || '',
            speaker: b.speaker || null,
            designation: b.designation || null,
            stage: b.stage || 'Main Arena Stage',
            status: (b.status || 'UPCOMING').toUpperCase()
        }));

        this.state.schedule = [...otherDays, ...validatedBeats];
        if (!this.state.days.includes(targetDay)) {
            this.state.days.push(targetDay);
            this.state.days.sort((a, b) => a - b);
        }

        this.state.lastUpdated = new Date().toISOString();
        this.persist();
        return this.getSchedule({ day: targetDay });
    }

    /**
     * Reset back to canonical 12-beat seed
     */
    resetToDefault() {
        this.state = this.getInitialState();
        this.persist();
        return this.state;
    }

    /**
     * Debounced save scheduler
     */
    scheduleSave() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.persist(), 300);
    }

    /**
     * Atomic synchronous disk persistence
     */
    persist() {
        try {
            const dir = path.dirname(this.dataPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const tmpPath = `${this.dataPath}.tmp`;
            fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), 'utf-8');
            fs.renameSync(tmpPath, this.dataPath);
        } catch (e) {
            console.error('[ScheduleStore] Failed to persist schedule:', e.message);
        }
    }
}

const scheduleStore = new ScheduleStore();
scheduleStore.init();

module.exports = scheduleStore;
