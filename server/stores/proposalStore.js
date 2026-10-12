const fs = require('fs');
const path = require('path');

class ProposalStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/proposals_state.json');
        this.saveTimer = null;
        this.state = this.getInitialState();
        this.load();
    }

    getInitialState() {
        return {
            status: 'active',
            totalProposals: 92,
            totalCommittedSpendBDT: 148500000,
            totalGuaranteedImpressions: '928.1M',
            proposals: [
                {
                    id: 'PROP-2026-9481',
                    advertiser: 'Mindshare / Unilever Bangladesh',
                    budget: 2500000,
                    reach: '17.8M',
                    impressions: '15.6M',
                    effectiveCpm: 160,
                    viewabilityGuarantee: '99.4%',
                    formats: [
                        { name: 'Homepage Masthead Takeover (100% SOV)', budget: 1125000, cpm: 180, impressions: '6.25M' },
                        { name: 'Live Sports L-Band Overlay (Non-Intrusive)', budget: 875000, cpm: 150, impressions: '5.83M' },
                        { name: 'Contextual In-Stream Mid-Roll (70+ Channels)', budget: 500000, cpm: 140, impressions: '3.57M' }
                    ],
                    targeting: {
                        geo: 'Dhaka & Chittagong Metro (Priority Tier-1)',
                        demographics: '18-34 Urban Mobile Video Consumers',
                        affinity: 'Sports, FMCG & Daily Entertainment'
                    },
                    verificationToken: 'TFC-VERIFIED-MS-UNI-9481',
                    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
                },
                {
                    id: 'PROP-2026-8812',
                    advertiser: 'Wavemaker / bKash Fintech',
                    budget: 1800000,
                    reach: '12.4M',
                    impressions: '11.2M',
                    effectiveCpm: 160,
                    viewabilityGuarantee: '99.2%',
                    formats: [
                        { name: 'Live Sports L-Band Overlay (Non-Intrusive)', budget: 1080000, cpm: 150, impressions: '7.20M' },
                        { name: 'Contextual In-Stream Mid-Roll (70+ Channels)', budget: 720000, cpm: 140, impressions: '5.14M' }
                    ],
                    targeting: {
                        geo: 'Nationwide All-Bangladesh 64 Districts',
                        demographics: '21-45 Digital Payment Active Users',
                        affinity: 'Cricket, News & Live Streaming'
                    },
                    verificationToken: 'TFC-VERIFIED-WM-BK-8812',
                    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString()
                },
                {
                    id: 'PROP-2026-7340',
                    advertiser: 'Starcom / Marico Parachute',
                    budget: 1200000,
                    reach: '8.5M',
                    impressions: '7.5M',
                    effectiveCpm: 160,
                    viewabilityGuarantee: '99.1%',
                    formats: [
                        { name: 'Homepage Masthead Takeover (100% SOV)', budget: 720000, cpm: 180, impressions: '4.00M' },
                        { name: 'Contextual In-Stream Mid-Roll (70+ Channels)', budget: 480000, cpm: 140, impressions: '3.42M' }
                    ],
                    targeting: {
                        geo: 'Dhaka, Sylhet, Chittagong & Rajshahi',
                        demographics: 'Female & Co-Viewing Households (18-40)',
                        affinity: 'Mega Drama Series & Lifestyle Channels'
                    },
                    verificationToken: 'TFC-VERIFIED-ST-MC-7340',
                    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
                }
            ]
        };
    }

    load() {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.proposals)) {
                    this.state = {
                        ...this.state,
                        ...parsed
                    };
                }
            }
        } catch (e) {
            console.warn('[ProposalStore] Failed to load data file, using defaults:', e.message);
        }
    }

    save() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            try {
                const dir = path.dirname(this.dataPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                fs.writeFileSync(this.dataPath, JSON.stringify(this.state, null, 2), 'utf8');
            } catch (e) {
                console.error('[ProposalStore] Save error:', e.message);
            }
        }, 300);
    }

    addProposal(data) {
        const id = 'PROP-2026-' + Math.floor(1000 + Math.random() * 9000);
        const budget = parseInt(data.budget, 10) || 1000000;
        const advertiser = (data.advertiser || 'Media Partner / Brand').trim();
        const effectiveCpm = parseInt(data.effectiveCpm, 10) || 160;
        const totalImpVal = Math.round((budget / effectiveCpm) * 1000);
        const totalImpStr = (totalImpVal / 1000000).toFixed(2) + 'M';
        const reachStr = ((totalImpVal * 0.82) / 1000000).toFixed(2) + 'M';

        let formats = [];
        if (Array.isArray(data.formats) && data.formats.length > 0) {
            formats = data.formats;
        } else {
            formats = [
                { name: 'Homepage Masthead Takeover (100% SOV)', budget: Math.round(budget * 0.5), cpm: 180, impressions: ((budget * 0.5 / 180 * 1000) / 1000000).toFixed(2) + 'M' },
                { name: 'Live Sports L-Band Overlay (Non-Intrusive)', budget: Math.round(budget * 0.35), cpm: 150, impressions: ((budget * 0.35 / 150 * 1000) / 1000000).toFixed(2) + 'M' },
                { name: 'Contextual In-Stream Mid-Roll (70+ Channels)', budget: Math.round(budget * 0.15), cpm: 140, impressions: ((budget * 0.15 / 140 * 1000) / 1000000).toFixed(2) + 'M' }
            ];
        }

        const proposal = {
            id,
            advertiser,
            budget,
            reach: data.reach || reachStr,
            impressions: data.impressions || totalImpStr,
            effectiveCpm,
            viewabilityGuarantee: '99.2%',
            formats,
            targeting: data.targeting || {
                geo: 'Nationwide (Tier-1 Metro Weighted)',
                demographics: '18-35 Digital Video Audience',
                affinity: 'Live Cricket, Premium Drama & FAST Channels'
            },
            verificationToken: 'TFC-VERIFIED-' + id,
            timestamp: new Date().toISOString()
        };

        this.state.proposals.unshift(proposal);
        if (this.state.proposals.length > 50) {
            this.state.proposals = this.state.proposals.slice(0, 50);
        }

        this.state.totalProposals += 1;
        this.state.totalCommittedSpendBDT += budget;
        this.save();

        return proposal;
    }

    getProposal(id) {
        return this.state.proposals.find(p => p.id === id || p.verificationToken === id);
    }

    getRecentProposals(limit = 10) {
        return this.state.proposals.slice(0, limit);
    }

    getState() {
        return {
            status: this.state.status,
            totalProposals: this.state.totalProposals,
            totalCommittedSpendBDT: this.state.totalCommittedSpendBDT,
            totalGuaranteedImpressions: this.state.totalGuaranteedImpressions,
            proposals: this.state.proposals
        };
    }
}

module.exports = new ProposalStore();
