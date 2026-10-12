const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/space_state.json');

// Curated 104 realistic linear channels matching Bangladesh broadcast ecosystem & Toffee OTT dominance
const DEFAULT_CHANNELS = [
    // 1. SPORTS (18 Premium Channels)
    { id: 'ch-sp-01', name: 'T Sports HD', category: 'sports', icon: '⚽', number: 101, bitrate: '8.0 Mbps 1080p60', reach: '4.8M', peakViewers: '2.4M', adFormats: ['L-Band Overlay', 'Mid-Roll', 'Scoreboard Bug'], cpm: '৳350', status: 'live' },
    { id: 'ch-sp-02', name: 'Sony Sports Ten 1 HD', category: 'sports', icon: '🏏', number: 102, bitrate: '7.5 Mbps 1080p50', reach: '3.6M', peakViewers: '1.8M', adFormats: ['L-Band Overlay', 'Pre-Roll'], cpm: '৳320', status: 'live' },
    { id: 'ch-sp-03', name: 'Sony Sports Ten 2 HD', category: 'sports', icon: '🎾', number: 103, bitrate: '7.5 Mbps 1080p50', reach: '2.9M', peakViewers: '1.2M', adFormats: ['L-Band Overlay', 'Mid-Roll'], cpm: '৳300', status: 'live' },
    { id: 'ch-sp-04', name: 'Sony Sports Ten 3 HD', category: 'sports', icon: '🥊', number: 104, bitrate: '7.5 Mbps 1080p50', reach: '2.2M', peakViewers: '950K', adFormats: ['Mid-Roll', 'Sponsor Bug'], cpm: '৳280', status: 'live' },
    { id: 'ch-sp-05', name: 'Sony Sports Ten 5 HD', category: 'sports', icon: '🥋', number: 105, bitrate: '7.0 Mbps 1080p50', reach: '1.8M', peakViewers: '820K', adFormats: ['Mid-Roll', 'L-Band'], cpm: '৳260', status: 'live' },
    { id: 'ch-sp-06', name: 'Star Sports 1 HD', category: 'sports', icon: '🏆', number: 106, bitrate: '8.5 Mbps 1080p60', reach: '4.2M', peakViewers: '2.1M', adFormats: ['L-Band Overlay', 'Pre-Roll', 'Anchor Bug'], cpm: '৳360', status: 'live' },
    { id: 'ch-sp-07', name: 'Star Sports 2 HD', category: 'sports', icon: '🏎️', number: 107, bitrate: '7.5 Mbps 1080p50', reach: '2.5M', peakViewers: '1.1M', adFormats: ['L-Band Overlay', 'Mid-Roll'], cpm: '৳290', status: 'live' },
    { id: 'ch-sp-08', name: 'Star Sports Select 1', category: 'sports', icon: '⛳', number: 108, bitrate: '7.0 Mbps 1080p50', reach: '1.9M', peakViewers: '750K', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳270', status: 'live' },
    { id: 'ch-sp-09', name: 'Star Sports Select 2', category: 'sports', icon: '🏸', number: 109, bitrate: '7.0 Mbps 1080p50', reach: '1.5M', peakViewers: '600K', adFormats: ['Mid-Roll'], cpm: '৳250', status: 'live' },
    { id: 'ch-sp-10', name: 'Gazi TV (GTV)', category: 'sports', icon: '🏏', number: 110, bitrate: '6.5 Mbps 1080p50', reach: '3.9M', peakViewers: '1.9M', adFormats: ['L-Band Overlay', 'Mid-Roll', 'Sponsor Pop'], cpm: '৳310', status: 'live' },
    { id: 'ch-sp-11', name: 'Eurosport HD', category: 'sports', icon: '🚴', number: 111, bitrate: '7.0 Mbps 1080p50', reach: '1.4M', peakViewers: '550K', adFormats: ['Mid-Roll', 'Bumper'], cpm: '৳240', status: 'live' },
    { id: 'ch-sp-12', name: 'Willow Cricket HD', category: 'sports', icon: '🏏', number: 112, bitrate: '6.5 Mbps 1080p50', reach: '2.1M', peakViewers: '980K', adFormats: ['L-Band', 'Pre-Roll'], cpm: '৳280', status: 'live' },
    { id: 'ch-sp-13', name: 'Fight Sports', category: 'sports', icon: '🥊', number: 113, bitrate: '6.0 Mbps 720p60', reach: '1.1M', peakViewers: '420K', adFormats: ['Mid-Roll'], cpm: '৳210', status: 'live' },
    { id: 'ch-sp-14', name: 'Motorvision TV', category: 'sports', icon: '🏍️', number: 114, bitrate: '6.0 Mbps 720p60', reach: '890K', peakViewers: '310K', adFormats: ['Mid-Roll'], cpm: '৳190', status: 'live' },
    { id: 'ch-sp-15', name: 'Toffee Sports Live 1', category: 'sports', icon: '⚡', number: 115, bitrate: '8.5 Mbps 1080p60', reach: '5.2M', peakViewers: '3.1M', adFormats: ['Dynamic Ad Insertion', 'Interactive Overlay'], cpm: '৳400', status: 'live' },
    { id: 'ch-sp-16', name: 'Toffee Sports Live 2', category: 'sports', icon: '⚡', number: 116, bitrate: '8.0 Mbps 1080p60', reach: '3.4M', peakViewers: '1.6M', adFormats: ['Dynamic Ad Insertion', 'L-Band'], cpm: '৳340', status: 'live' },
    { id: 'ch-sp-17', name: 'Extreme Sports Channel', category: 'sports', icon: '🏂', number: 117, bitrate: '6.0 Mbps 720p60', reach: '780K', peakViewers: '290K', adFormats: ['Mid-Roll'], cpm: '৳180', status: 'live' },
    { id: 'ch-sp-18', name: 'Nautical Channel', category: 'sports', icon: '⛵', number: 118, bitrate: '5.5 Mbps 720p50', reach: '520K', peakViewers: '190K', adFormats: ['Mid-Roll'], cpm: '৳160', status: 'live' },

    // 2. LIVE NEWS (20 24/7 Channels)
    { id: 'ch-nw-01', name: 'Somoy TV', category: 'news', icon: '📰', number: 201, bitrate: '6.5 Mbps 1080p50', reach: '5.8M', peakViewers: '2.8M', adFormats: ['Ticker Sponsor', 'L-Band', 'Pre-Roll'], cpm: '৳290', status: 'live' },
    { id: 'ch-nw-02', name: 'Jamuna TV', category: 'news', icon: '📺', number: 202, bitrate: '6.5 Mbps 1080p50', reach: '5.2M', peakViewers: '2.4M', adFormats: ['Ticker Sponsor', 'L-Band', 'Pre-Roll'], cpm: '৳280', status: 'live' },
    { id: 'ch-nw-03', name: 'Ekattor TV', category: 'news', icon: '🎙️', number: 203, bitrate: '6.5 Mbps 1080p50', reach: '4.6M', peakViewers: '2.1M', adFormats: ['Studio Backdrop', 'L-Band'], cpm: '৳270', status: 'live' },
    { id: 'ch-nw-04', name: 'Channel 24', category: 'news', icon: '📡', number: 204, bitrate: '6.0 Mbps 1080p50', reach: '4.1M', peakViewers: '1.9M', adFormats: ['Ticker Sponsor', 'Mid-Roll'], cpm: '৳260', status: 'live' },
    { id: 'ch-nw-05', name: 'Independent TV', category: 'news', icon: '🌐', number: 205, bitrate: '6.0 Mbps 1080p50', reach: '3.8M', peakViewers: '1.7M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳250', status: 'live' },
    { id: 'ch-nw-06', name: 'DBC News', category: 'news', icon: '🔴', number: 206, bitrate: '6.0 Mbps 1080p50', reach: '3.2M', peakViewers: '1.4M', adFormats: ['Ticker Sponsor', 'Mid-Roll'], cpm: '৳240', status: 'live' },
    { id: 'ch-nw-07', name: 'News24', category: 'news', icon: '⏱️', number: 207, bitrate: '6.0 Mbps 1080p50', reach: '3.0M', peakViewers: '1.3M', adFormats: ['L-Band', 'Pre-Roll'], cpm: '৳230', status: 'live' },
    { id: 'ch-nw-08', name: 'ATN News', category: 'news', icon: '📰', number: 208, bitrate: '5.5 Mbps 720p50', reach: '2.6M', peakViewers: '1.1M', adFormats: ['Mid-Roll', 'Sponsor Bug'], cpm: '৳220', status: 'live' },
    { id: 'ch-nw-09', name: 'BTV World News', category: 'news', icon: '🏛️', number: 209, bitrate: '5.5 Mbps 720p50', reach: '2.8M', peakViewers: '1.0M', adFormats: ['Public Notice', 'Bumper'], cpm: '৳200', status: 'live' },
    { id: 'ch-nw-10', name: 'BBC World News HD', category: 'news', icon: '🌍', number: 210, bitrate: '7.0 Mbps 1080p50', reach: '2.4M', peakViewers: '950K', adFormats: ['Pre-Roll', 'Mid-Roll'], cpm: '৳320', status: 'live' },
    { id: 'ch-nw-11', name: 'CNN International HD', category: 'news', icon: '📡', number: 211, bitrate: '7.0 Mbps 1080p50', reach: '2.1M', peakViewers: '890K', adFormats: ['Pre-Roll', 'L-Band'], cpm: '৳310', status: 'live' },
    { id: 'ch-nw-12', name: 'Al Jazeera English', category: 'news', icon: '🌐', number: 212, bitrate: '6.5 Mbps 1080p50', reach: '1.9M', peakViewers: '780K', adFormats: ['Pre-Roll', 'Mid-Roll'], cpm: '৳270', status: 'live' },
    { id: 'ch-nw-13', name: 'DW English', category: 'news', icon: '🇩🇪', number: 213, bitrate: '6.0 Mbps 1080p50', reach: '1.2M', peakViewers: '450K', adFormats: ['Mid-Roll'], cpm: '৳210', status: 'live' },
    { id: 'ch-nw-14', name: 'France 24 English', category: 'news', icon: '🇫🇷', number: 214, bitrate: '6.0 Mbps 1080p50', reach: '1.1M', peakViewers: '410K', adFormats: ['Mid-Roll'], cpm: '৳200', status: 'live' },
    { id: 'ch-nw-15', name: 'NHK World Japan', category: 'news', icon: '🇯🇵', number: 215, bitrate: '6.5 Mbps 1080p50', reach: '1.3M', peakViewers: '510K', adFormats: ['Sponsorship Bug'], cpm: '৳220', status: 'live' },
    { id: 'ch-nw-16', name: 'NDTV 24x7', category: 'news', icon: '🇮🇳', number: 216, bitrate: '6.0 Mbps 1080p50', reach: '1.5M', peakViewers: '620K', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳230', status: 'live' },
    { id: 'ch-nw-17', name: 'CNBC Prime', category: 'news', icon: '📈', number: 217, bitrate: '6.0 Mbps 1080p50', reach: '1.4M', peakViewers: '580K', adFormats: ['Financial Banner', 'Pre-Roll'], cpm: '৳290', status: 'live' },
    { id: 'ch-nw-18', name: 'Bloomberg TV', category: 'news', icon: '💹', number: 218, bitrate: '6.5 Mbps 1080p50', reach: '1.1M', peakViewers: '490K', adFormats: ['B2B Target Ad', 'L-Band'], cpm: '৳330', status: 'live' },
    { id: 'ch-nw-19', name: 'Sky News HD', category: 'news', icon: '🇬🇧', number: 219, bitrate: '6.5 Mbps 1080p50', reach: '1.2M', peakViewers: '480K', adFormats: ['Mid-Roll'], cpm: '৳250', status: 'live' },
    { id: 'ch-nw-20', name: 'Euronews HD', category: 'news', icon: '🇪🇺', number: 220, bitrate: '6.0 Mbps 1080p50', reach: '980K', peakViewers: '370K', adFormats: ['Mid-Roll'], cpm: '৳200', status: 'live' },

    // 3. MOVIES & MEGA DRAMA (24 Channels)
    { id: 'ch-mv-01', name: 'Toffee Originals 4K', category: 'movies', icon: '👑', number: 301, bitrate: '12.0 Mbps 4K HDR', reach: '6.4M', peakViewers: '3.6M', adFormats: ['Brand Integration', 'Title Sponsor', 'Pre-Roll'], cpm: '৳450', status: 'live' },
    { id: 'ch-mv-02', name: 'Zee Bangla Cinema', category: 'movies', icon: '🎬', number: 302, bitrate: '6.5 Mbps 1080p50', reach: '4.8M', peakViewers: '2.3M', adFormats: ['L-Band', 'Mid-Roll', 'Frame Ad'], cpm: '৳320', status: 'live' },
    { id: 'ch-mv-03', name: 'Star Jalsha HD', category: 'movies', icon: '🎭', number: 303, bitrate: '7.0 Mbps 1080p50', reach: '5.1M', peakViewers: '2.5M', adFormats: ['L-Band', 'Mid-Roll', 'Sponsor Bug'], cpm: '৳340', status: 'live' },
    { id: 'ch-mv-04', name: 'Colors Bangla HD', category: 'movies', icon: '✨', number: 304, bitrate: '6.5 Mbps 1080p50', reach: '4.2M', peakViewers: '1.9M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳300', status: 'live' },
    { id: 'ch-mv-05', name: 'Sony Aath', category: 'movies', icon: '📽️', number: 305, bitrate: '6.0 Mbps 1080p50', reach: '3.9M', peakViewers: '1.7M', adFormats: ['Mid-Roll', 'L-Band'], cpm: '৳280', status: 'live' },
    { id: 'ch-mv-06', name: 'Zee Cinema HD', category: 'movies', icon: '🍿', number: 306, bitrate: '7.0 Mbps 1080p50', reach: '3.6M', peakViewers: '1.6M', adFormats: ['Pre-Roll', 'Mid-Roll'], cpm: '৳290', status: 'live' },
    { id: 'ch-mv-07', name: 'Star Gold HD', category: 'movies', icon: '⭐', number: 307, bitrate: '7.0 Mbps 1080p50', reach: '3.5M', peakViewers: '1.5M', adFormats: ['Pre-Roll', 'Mid-Roll'], cpm: '৳280', status: 'live' },
    { id: 'ch-mv-08', name: 'Sony Max HD', category: 'movies', icon: '🔥', number: 308, bitrate: '7.0 Mbps 1080p50', reach: '3.7M', peakViewers: '1.7M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳300', status: 'live' },
    { id: 'ch-mv-09', name: 'NTV HD', category: 'movies', icon: '🎥', number: 309, bitrate: '6.5 Mbps 1080p50', reach: '4.4M', peakViewers: '2.0M', adFormats: ['L-Band', 'Mid-Roll', 'Sponsor Bug'], cpm: '৳310', status: 'live' },
    { id: 'ch-mv-10', name: 'Channel i HD', category: 'movies', icon: '🌟', number: 310, bitrate: '6.5 Mbps 1080p50', reach: '4.3M', peakViewers: '1.9M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳300', status: 'live' },
    { id: 'ch-mv-11', name: 'RTV HD', category: 'movies', icon: '🎬', number: 311, bitrate: '6.0 Mbps 1080p50', reach: '3.8M', peakViewers: '1.6M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳270', status: 'live' },
    { id: 'ch-mv-12', name: 'Banglavision', category: 'movies', icon: '👁️', number: 312, bitrate: '6.0 Mbps 1080p50', reach: '3.6M', peakViewers: '1.5M', adFormats: ['Mid-Roll', 'L-Band'], cpm: '৳260', status: 'live' },
    { id: 'ch-mv-13', name: 'Maasranga TV', category: 'movies', icon: '🦜', number: 313, bitrate: '6.0 Mbps 1080p50', reach: '3.5M', peakViewers: '1.4M', adFormats: ['Mid-Roll'], cpm: '৳250', status: 'live' },
    { id: 'ch-mv-14', name: 'Boishakhi TV', category: 'movies', icon: '🌺', number: 314, bitrate: '5.5 Mbps 720p50', reach: '2.9M', peakViewers: '1.1M', adFormats: ['Mid-Roll'], cpm: '৳220', status: 'live' },
    { id: 'ch-mv-15', name: 'Deepto TV', category: 'movies', icon: '💡', number: 315, bitrate: '6.0 Mbps 1080p50', reach: '3.7M', peakViewers: '1.6M', adFormats: ['L-Band', 'Dubbed Show Sponsor'], cpm: '৳280', status: 'live' },
    { id: 'ch-mv-16', name: 'BTV National', category: 'movies', icon: '🏛️', number: 316, bitrate: '5.5 Mbps 720p50', reach: '4.9M', peakViewers: '2.1M', adFormats: ['Govt & Brand Announcements'], cpm: '৳240', status: 'live' },
    { id: 'ch-mv-17', name: 'Desh TV', category: 'movies', icon: '🇧🇩', number: 317, bitrate: '5.5 Mbps 720p50', reach: '2.4M', peakViewers: '920K', adFormats: ['Mid-Roll'], cpm: '৳210', status: 'live' },
    { id: 'ch-mv-18', name: 'Nagorik TV', category: 'movies', icon: '🏙️', number: 318, bitrate: '6.0 Mbps 1080p50', reach: '2.8M', peakViewers: '1.2M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳240', status: 'live' },
    { id: 'ch-mv-19', name: 'ATN Bangla', category: 'movies', icon: '🎥', number: 319, bitrate: '5.5 Mbps 720p50', reach: '3.1M', peakViewers: '1.3M', adFormats: ['Mid-Roll'], cpm: '৳230', status: 'live' },
    { id: 'ch-mv-20', name: 'Asian TV', category: 'movies', icon: '📺', number: 320, bitrate: '5.5 Mbps 720p50', reach: '2.2M', peakViewers: '850K', adFormats: ['Mid-Roll'], cpm: '৳200', status: 'live' },
    { id: 'ch-mv-21', name: 'Colors Cineplex HD', category: 'movies', icon: '🍿', number: 321, bitrate: '7.0 Mbps 1080p50', reach: '2.9M', peakViewers: '1.3M', adFormats: ['Mid-Roll', 'L-Band'], cpm: '৳260', status: 'live' },
    { id: 'ch-mv-22', name: '&pictures HD', category: 'movies', icon: '🎞️', number: 322, bitrate: '6.5 Mbps 1080p50', reach: '2.4M', peakViewers: '1.0M', adFormats: ['Mid-Roll'], cpm: '৳240', status: 'live' },
    { id: 'ch-mv-23', name: 'Star Movies HD', category: 'movies', icon: '🌠', number: 323, bitrate: '7.5 Mbps 1080p50', reach: '2.8M', peakViewers: '1.2M', adFormats: ['Pre-Roll', 'L-Band'], cpm: '৳300', status: 'live' },
    { id: 'ch-mv-24', name: 'Sony Pix HD', category: 'movies', icon: '🎬', number: 324, bitrate: '7.0 Mbps 1080p50', reach: '2.6M', peakViewers: '1.1M', adFormats: ['Pre-Roll', 'Mid-Roll'], cpm: '৳280', status: 'live' },

    // 4. MUSIC & YOUTH (14 Channels)
    { id: 'ch-mu-01', name: 'MTV Live HD', category: 'music', icon: '🎵', number: 401, bitrate: '7.5 Mbps 1080p60', reach: '2.5M', peakViewers: '980K', adFormats: ['Concert Bug', 'Pre-Roll', 'Bumper'], cpm: '৳280', status: 'live' },
    { id: 'ch-mu-02', name: 'Gaan Bangla HD', category: 'music', icon: '🎸', number: 402, bitrate: '7.0 Mbps 1080p50', reach: '3.8M', peakViewers: '1.7M', adFormats: ['Music Video Sponsor', 'L-Band'], cpm: '৳310', status: 'live' },
    { id: 'ch-mu-03', name: 'Sangeet Bangla', category: 'music', icon: '🎶', number: 403, bitrate: '6.0 Mbps 720p50', reach: '3.2M', peakViewers: '1.3M', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳260', status: 'live' },
    { id: 'ch-mu-04', name: 'VH1 India HD', category: 'music', icon: '🎙️', number: 404, bitrate: '6.5 Mbps 1080p50', reach: '1.8M', peakViewers: '680K', adFormats: ['Pre-Roll', 'Youth Target'], cpm: '৳270', status: 'live' },
    { id: 'ch-mu-05', name: '9XM HD', category: 'music', icon: '🎧', number: 405, bitrate: '6.5 Mbps 1080p50', reach: '2.9M', peakViewers: '1.2M', adFormats: ['Animated Bug', 'Mid-Roll'], cpm: '৳250', status: 'live' },
    { id: 'ch-mu-06', name: '9X Jalwa', category: 'music', icon: '🕺', number: 406, bitrate: '6.0 Mbps 720p50', reach: '2.2M', peakViewers: '890K', adFormats: ['Mid-Roll'], cpm: '৳220', status: 'live' },
    { id: 'ch-mu-07', name: 'Zoom HD', category: 'music', icon: '🎤', number: 407, bitrate: '6.0 Mbps 1080p50', reach: '2.0M', peakViewers: '790K', adFormats: ['Bollywood Gossip Bug'], cpm: '৳230', status: 'live' },
    { id: 'ch-mu-08', name: 'B4U Music', category: 'music', icon: '📻', number: 408, bitrate: '5.5 Mbps 720p50', reach: '1.9M', peakViewers: '740K', adFormats: ['Mid-Roll'], cpm: '৳200', status: 'live' },
    { id: 'ch-mu-09', name: 'Club MTV', category: 'music', icon: '🪩', number: 409, bitrate: '6.5 Mbps 1080p50', reach: '1.4M', peakViewers: '510K', adFormats: ['Pre-Roll', 'EDM Sponsor'], cpm: '৳240', status: 'live' },
    { id: 'ch-mu-10', name: 'MTV Beats HD', category: 'music', icon: '🥁', number: 410, bitrate: '6.5 Mbps 1080p50', reach: '2.4M', peakViewers: '960K', adFormats: ['L-Band', 'Mid-Roll'], cpm: '৳250', status: 'live' },
    { id: 'ch-mu-11', name: 'Dhoom Music', category: 'music', icon: '🎺', number: 411, bitrate: '5.5 Mbps 720p50', reach: '1.7M', peakViewers: '620K', adFormats: ['Mid-Roll'], cpm: '৳190', status: 'live' },
    { id: 'ch-mu-12', name: 'Tara Music', category: 'music', icon: '🎻', number: 412, bitrate: '5.5 Mbps 720p50', reach: '1.5M', peakViewers: '550K', adFormats: ['Mid-Roll'], cpm: '৳180', status: 'live' },
    { id: 'ch-mu-13', name: 'Music India', category: 'music', icon: '🪕', number: 413, bitrate: '5.5 Mbps 720p50', reach: '1.3M', peakViewers: '480K', adFormats: ['Mid-Roll'], cpm: '৳170', status: 'live' },
    { id: 'ch-mu-14', name: 'Toffee Indie Beats', category: 'music', icon: '🎧', number: 414, bitrate: '8.0 Mbps 1080p60', reach: '2.8M', peakViewers: '1.1M', adFormats: ['Native Audio Inset', 'DAI'], cpm: '৳320', status: 'live' },

    // 5. KIDS & EDUTAINMENT (14 Channels)
    { id: 'ch-kd-01', name: 'Cartoon Network HD', category: 'kids', icon: '🧸', number: 501, bitrate: '7.0 Mbps 1080p50', reach: '4.6M', peakViewers: '2.2M', adFormats: ['Kids Safe Ad', 'Game Sponsor'], cpm: '৳330', status: 'live' },
    { id: 'ch-kd-02', name: 'Nickelodeon HD', category: 'kids', icon: '🚀', number: 502, bitrate: '7.0 Mbps 1080p50', reach: '4.3M', peakViewers: '2.0M', adFormats: ['Pre-Roll', 'Toy Brand Bug'], cpm: '৳320', status: 'live' },
    { id: 'ch-kd-03', name: 'Discovery Kids', category: 'kids', icon: '🦁', number: 503, bitrate: '6.5 Mbps 1080p50', reach: '3.7M', peakViewers: '1.6M', adFormats: ['Edu-Tech Sponsor', 'Mid-Roll'], cpm: '৳290', status: 'live' },
    { id: 'ch-kd-04', name: 'Sonic Nickelodeon', category: 'kids', icon: '🦔', number: 504, bitrate: '6.0 Mbps 720p50', reach: '3.2M', peakViewers: '1.4M', adFormats: ['Mid-Roll', 'L-Band'], cpm: '৳260', status: 'live' },
    { id: 'ch-kd-05', name: 'Nick Jr HD', category: 'kids', icon: '🐣', number: 505, bitrate: '6.5 Mbps 1080p50', reach: '2.9M', peakViewers: '1.3M', adFormats: ['Pre-School Brand', 'Pre-Roll'], cpm: '৳300', status: 'live' },
    { id: 'ch-kd-06', name: 'Pogo TV', category: 'kids', icon: '🎨', number: 506, bitrate: '6.0 Mbps 720p50', reach: '3.5M', peakViewers: '1.5M', adFormats: ['Animation Sponsor', 'Mid-Roll'], cpm: '৳270', status: 'live' },
    { id: 'ch-kd-07', name: 'Sony YAY! HD', category: 'kids', icon: '🎈', number: 507, bitrate: '6.5 Mbps 1080p50', reach: '3.1M', peakViewers: '1.3M', adFormats: ['Mid-Roll', 'L-Band'], cpm: '৳250', status: 'live' },
    { id: 'ch-kd-08', name: 'Hungama TV', category: 'kids', icon: '🎪', number: 508, bitrate: '6.0 Mbps 720p50', reach: '3.0M', peakViewers: '1.2M', adFormats: ['Mid-Roll'], cpm: '৳240', status: 'live' },
    { id: 'ch-kd-09', name: 'Disney Channel HD', category: 'kids', icon: '🏰', number: 509, bitrate: '7.0 Mbps 1080p50', reach: '3.9M', peakViewers: '1.7M', adFormats: ['Family Brand Bug', 'Pre-Roll'], cpm: '৳340', status: 'live' },
    { id: 'ch-kd-10', name: 'Disney Junior', category: 'kids', icon: '🧸', number: 510, bitrate: '6.0 Mbps 720p50', reach: '2.6M', peakViewers: '1.1M', adFormats: ['Mom & Baby Brand'], cpm: '৳280', status: 'live' },
    { id: 'ch-kd-11', name: 'CBeebies HD', category: 'kids', icon: '🌈', number: 511, bitrate: '6.5 Mbps 1080p50', reach: '1.9M', peakViewers: '820K', adFormats: ['Educational Sponsor'], cpm: '৳260', status: 'live' },
    { id: 'ch-kd-12', name: 'Animax Asia HD', category: 'kids', icon: '⚔️', number: 512, bitrate: '7.0 Mbps 1080p50', reach: '2.4M', peakViewers: '1.1M', adFormats: ['Gaming & Tech Brand'], cpm: '৳310', status: 'live' },
    { id: 'ch-kd-13', name: 'BabyTV', category: 'kids', icon: '🍼', number: 513, bitrate: '5.5 Mbps 720p50', reach: '1.6M', peakViewers: '680K', adFormats: ['Diaper & Infant Nutrition'], cpm: '৳250', status: 'live' },
    { id: 'ch-kd-14', name: 'Toffee Kids Adventure', category: 'kids', icon: '🎠', number: 514, bitrate: '7.5 Mbps 1080p60', reach: '3.4M', peakViewers: '1.5M', adFormats: ['Interactive Quiz Pop', 'DAI'], cpm: '৳350', status: 'live' },

    // 6. INFOTAINMENT & DOCUMENTARY (14 Channels)
    { id: 'ch-in-01', name: 'National Geographic HD', category: 'infotainment', icon: '🌋', number: 601, bitrate: '7.5 Mbps 1080p50', reach: '3.8M', peakViewers: '1.8M', adFormats: ['Eco-Brand Sponsor', 'Pre-Roll', 'L-Band'], cpm: '৳360', status: 'live' },
    { id: 'ch-in-02', name: 'Nat Geo Wild HD', category: 'infotainment', icon: '🐅', number: 602, bitrate: '7.5 Mbps 1080p50', reach: '3.2M', peakViewers: '1.4M', adFormats: ['Wildlife Feature Sponsor'], cpm: '৳340', status: 'live' },
    { id: 'ch-in-03', name: 'Discovery Channel HD', category: 'infotainment', icon: '🔭', number: 603, bitrate: '7.5 Mbps 1080p50', reach: '4.1M', peakViewers: '1.9M', adFormats: ['Auto & Tech Sponsor', 'Mid-Roll'], cpm: '৳350', status: 'live' },
    { id: 'ch-in-04', name: 'Animal Planet HD', category: 'infotainment', icon: '🐾', number: 604, bitrate: '7.0 Mbps 1080p50', reach: '3.0M', peakViewers: '1.3M', adFormats: ['Pet Care Brand', 'Mid-Roll'], cpm: '৳300', status: 'live' },
    { id: 'ch-in-05', name: 'History TV18 HD', category: 'infotainment', icon: '⚔️', number: 605, bitrate: '7.0 Mbps 1080p50', reach: '3.3M', peakViewers: '1.5M', adFormats: ['Documentary Title Bug', 'L-Band'], cpm: '৳320', status: 'live' },
    { id: 'ch-in-06', name: 'Discovery Science HD', category: 'infotainment', icon: '🧪', number: 606, bitrate: '7.0 Mbps 1080p50', reach: '2.6M', peakViewers: '1.1M', adFormats: ['STEM & Education Sponsor'], cpm: '৳290', status: 'live' },
    { id: 'ch-in-07', name: 'Discovery Turbo HD', category: 'infotainment', icon: '🏎️', number: 607, bitrate: '7.0 Mbps 1080p50', reach: '2.4M', peakViewers: '1.0M', adFormats: ['Automotive & Lubricant Brand'], cpm: '৳310', status: 'live' },
    { id: 'ch-in-08', name: 'TLC HD', category: 'infotainment', icon: '🧁', number: 608, bitrate: '6.5 Mbps 1080p50', reach: '2.8M', peakViewers: '1.2M', adFormats: ['Food & Lifestyle Sponsor'], cpm: '৳280', status: 'live' },
    { id: 'ch-in-09', name: 'Food Food HD', category: 'infotainment', icon: '🍲', number: 609, bitrate: '6.5 Mbps 1080p50', reach: '2.7M', peakViewers: '1.1M', adFormats: ['FMCG Spice/Cookware'], cpm: '৳270', status: 'live' },
    { id: 'ch-in-10', name: 'Fox Life HD', category: 'infotainment', icon: '✈️', number: 610, bitrate: '6.5 Mbps 1080p50', reach: '2.5M', peakViewers: '1.0M', adFormats: ['Travel & Airline Brand'], cpm: '৳290', status: 'live' },
    { id: 'ch-in-11', name: 'Travelxp 4K HDR', category: 'infotainment', icon: '🏖️', number: 611, bitrate: '12.0 Mbps 4K HDR', reach: '2.2M', peakViewers: '920K', adFormats: ['Luxury Hospitality', '4K Showcase'], cpm: '৳420', status: 'live' },
    { id: 'ch-in-12', name: 'CGTN Documentary', category: 'infotainment', icon: '📜', number: 612, bitrate: '6.0 Mbps 1080p50', reach: '1.5M', peakViewers: '580K', adFormats: ['Global Culture Feature'], cpm: '৳210', status: 'live' },
    { id: 'ch-in-13', name: 'NHK World Doc', category: 'infotainment', icon: '🗾', number: 613, bitrate: '6.5 Mbps 1080p50', reach: '1.7M', peakViewers: '640K', adFormats: ['Heritage & Innovation'], cpm: '৳240', status: 'live' },
    { id: 'ch-in-14', name: 'Toffee Nature Odyssey', category: 'infotainment', icon: '🌿', number: 614, bitrate: '8.5 Mbps 1080p60', reach: '3.1M', peakViewers: '1.3M', adFormats: ['Bangladeshi Eco Heritage', 'DAI'], cpm: '৳340', status: 'live' }
];

class SpaceStore {
    constructor() {
        this.state = {
            satellite: {
                name: 'Bangabandhu Satellite-1 (BS-1) & Toffee Relay-7',
                noradId: '43470',
                orbitType: 'Geostationary Earth Orbit (GEO)',
                orbitalPosition: '119.1° East',
                altitudeKm: 35786,
                transponderCount: 40,
                downlinkBand: 'Ku-Band (11.7 - 12.2 GHz)',
                uplinkBand: 'C-Band / Ku-Band (14.0 - 14.5 GHz)',
                signalToNoiseRatio: '16.8 dB (99.8% SNR)',
                edgeLatencyMs: 24,
                activeThroughputGbps: 18.4,
                operationalStatus: 'NOMINAL / HIGH_EFFICIENCY'
            },
            channels: DEFAULT_CHANNELS,
            uplinks: [
                {
                    id: 'UPLINK-901',
                    channelId: 'ch-sp-01',
                    channelName: 'T Sports HD',
                    category: 'sports',
                    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
                    partner: 'Summit Telecom Media Buyer'
                },
                {
                    id: 'UPLINK-902',
                    channelId: 'ch-mv-01',
                    channelName: 'Toffee Originals 4K',
                    category: 'movies',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                    partner: 'Unilever Bangladesh CMO'
                }
            ],
            sponsorInquiries: [],
            telemetry: {
                totalUplinksTriggered: 142,
                totalAdvertisersSampled: 48,
                totalLinearChannels: DEFAULT_CHANNELS.length,
                totalMonthlyReach: '95M+ Platform Cumulative'
            }
        };

        this.init();
    }

    init() {
        try {
            if (fs.existsSync(STATE_FILE)) {
                const raw = fs.readFileSync(STATE_FILE, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && parsed.satellite && parsed.channels) {
                    this.state = parsed;
                    console.log(`[SpaceStore] Loaded ${this.state.channels.length} channels from disk.`);
                    return;
                }
            }
        } catch (e) {
            console.warn('[SpaceStore] Read error, resetting to default state:', e.message);
        }
        this.save();
    }

    save() {
        try {
            const dir = path.dirname(STATE_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2), 'utf8');
        } catch (e) {
            console.error('[SpaceStore] Save error:', e.message);
        }
    }

    getState() {
        return this.state;
    }

    getChannels(category = 'all') {
        if (!category || category === 'all') return this.state.channels;
        return this.state.channels.filter(c => c.category === category.toLowerCase());
    }

    getChannelById(id) {
        return this.state.channels.find(c => c.id === id);
    }

    triggerUplink({ channelId, partnerName }) {
        const channel = this.getChannelById(channelId) || this.state.channels[0];
        const uplinkId = 'UPLINK-' + Math.floor(1000 + Math.random() * 9000);

        const uplinkEvent = {
            id: uplinkId,
            channelId: channel.id,
            channelName: channel.name,
            category: channel.category,
            icon: channel.icon,
            number: channel.number,
            bitrate: channel.bitrate,
            reach: channel.reach,
            peakViewers: channel.peakViewers,
            adFormats: channel.adFormats,
            cpm: channel.cpm,
            timestamp: new Date().toISOString(),
            partner: partnerName || 'VIP Business Partner'
        };

        this.state.uplinks.unshift(uplinkEvent);
        if (this.state.uplinks.length > 50) this.state.uplinks.pop();

        this.state.telemetry.totalUplinksTriggered += 1;
        this.save();

        return uplinkEvent;
    }

    submitSponsorInquiry({ channelId, brandName, contactEmail, contactPhone, targetBudget, desiredFormats }) {
        const channel = this.getChannelById(channelId) || null;
        const inquiryId = 'SPONSOR-' + Math.floor(1000 + Math.random() * 9000);

        const inquiry = {
            id: inquiryId,
            channelId: channel ? channel.id : 'multi-channel',
            channelName: channel ? channel.name : 'Full 100+ Catalogue',
            brandName: brandName || 'Unnamed Brand Partner',
            contactEmail: contactEmail || 'partner@brand.com',
            contactPhone: contactPhone || '+880 1700 000000',
            targetBudget: targetBudget || '৳500,000+',
            desiredFormats: desiredFormats || ['L-Band Overlay', 'Dynamic Ad Insertion'],
            timestamp: new Date().toISOString(),
            status: 'RECEIVED'
        };

        this.state.sponsorInquiries.unshift(inquiry);
        this.state.telemetry.totalAdvertisersSampled += 1;
        this.save();

        return inquiry;
    }
}

module.exports = new SpaceStore();
