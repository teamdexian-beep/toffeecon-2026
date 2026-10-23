const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AccreditationStore {
    constructor() {
        this.dataPath = path.join(__dirname, '../data/accreditation_whitelist.json');
        this.saveTimer = null;
        this.guests = [];
    }

    /**
     * Generate deterministic or random hex suffix
     */
    generateToken(counter = null) {
        const id = counter || (1000 + this.guests.length + 1);
        const hex = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `TC26-VIP-${id}-${hex}`;
    }

    /**
     * Default seed dataset of curated enterprise VIP attendees
     */
    getDefaultSeed() {
        const seedList = [
            {
                token: "TC26-VIP-1001-A9F2",
                name: "Sarah Ahmed",
                designation: "Chief Digital Officer",
                organization: "Banglalink / VEON",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1002-3B4C",
                name: "Kaan Terzioğlu",
                designation: "Group Chief Executive Officer",
                organization: "VEON Group",
                tier: "VIP_ALL_ACCESS",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:45:12Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "VIP Premium",
                    deviceFingerprint: "fp_kaan_veon_ios"
                }
            },
            {
                token: "TC26-VIP-1003-8D1E",
                name: "Erik Aas",
                designation: "Chief Executive Officer",
                organization: "Banglalink",
                tier: "VIP_ALL_ACCESS",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:30:00Z",
                checkedInAt: "2026-10-23T09:12:44Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Vegetarian",
                    deviceFingerprint: "fp_erik_aas_pixel"
                }
            },
            {
                token: "TC26-VIP-1004-9A2F",
                name: "Taimur Rahman",
                designation: "Chief Commercial Officer",
                organization: "Banglalink",
                tier: "VIP_ALL_ACCESS",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:35:00Z",
                checkedInAt: "2026-10-23T09:14:02Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: "fp_taimur_bl_mac"
                }
            },
            {
                token: "TC26-VIP-1005-4C7E",
                name: "Cem Velipasaoglu",
                designation: "Chief Financial Officer",
                organization: "Banglalink",
                tier: "VIP_ALL_ACCESS",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:50:20Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: "fp_cem_iphone15"
                }
            },
            {
                token: "TC26-VIP-1006-2F9A",
                name: "Huseyin Turker",
                designation: "Chief Technology Officer",
                organization: "Banglalink",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Halal",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1007-5E1B",
                name: "Monzula Morshed",
                designation: "Chief Human Resources Officer",
                organization: "Banglalink",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1008-7D3C",
                name: "Kamal Quadir",
                designation: "Founder & Chief Executive Officer",
                organization: "bKash Limited",
                tier: "VIP_KEYNOTE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:55:00Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Vegetarian",
                    deviceFingerprint: "fp_kq_bkash_sec"
                }
            },
            {
                token: "TC26-VIP-1009-1A6D",
                name: "Yasir Azman",
                designation: "Chief Executive Officer",
                organization: "Grameenphone Ltd",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1010-6C8E",
                name: "Rajeev Sethi",
                designation: "Managing Director & CEO",
                organization: "Robi Axiata Ltd",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1011-8F4A",
                name: "Shakib Al Hasan",
                designation: "Global Brand Ambassador",
                organization: "Toffee / Banglalink",
                tier: "VIP_MEDIA",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:20:00Z",
                checkedInAt: "2026-10-23T09:05:18Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Athlete High-Protein",
                    deviceFingerprint: "fp_sah_iphone_pro"
                }
            },
            {
                token: "TC26-VIP-1012-3D9B",
                name: "Zunaid Ahmed Palak",
                designation: "Special Guest / ICT Patron",
                organization: "ICT Division Bangladesh",
                tier: "VIP_KEYNOTE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1013-5A2C",
                name: "Major General (Retd.) Md. Emdad Ul Bari",
                designation: "Chairman",
                organization: "BTRC",
                tier: "VIP_KEYNOTE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1014-9E7D",
                name: "Redoan Rony",
                designation: "Chief Operating Officer",
                organization: "Chorki OTT",
                tier: "VIP_MEDIA",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:40:15Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: "fp_rony_chorki_mbp"
                }
            },
            {
                token: "TC26-VIP-1015-1B8F",
                name: "Zaved Akhtar",
                designation: "Chairman & Managing Director",
                organization: "Unilever Bangladesh Ltd",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1016-4F2A",
                name: "Syed Tanvir Husain",
                designation: "Chief Human Resources Officer",
                organization: "Grameenphone Ltd",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1017-7E9D",
                name: "Shihab Ahmad",
                designation: "Chief Commercial Officer",
                organization: "Robi Axiata Ltd",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1018-2C6B",
                name: "Tanvir A. Mishuk",
                designation: "Managing Director",
                organization: "Nagad Ltd",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1019-8A1E",
                name: "Fahim Ahmed",
                designation: "Chief Executive Officer",
                organization: "Pathao",
                tier: "VIP_DELEGATE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:48:30Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: "fp_fahim_pathao_app"
                }
            },
            {
                token: "TC26-VIP-1020-6D4C",
                name: "Syed Nasim Manzur",
                designation: "Managing Director",
                organization: "Apex Footwear Ltd",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1021-3F8E",
                name: "Ayman Sadiq",
                designation: "Founder & CEO",
                organization: "10 Minute School",
                tier: "VIP_MEDIA",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:15:00Z",
                checkedInAt: "2026-10-23T09:02:11Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: "fp_ayman_10ms_dev"
                }
            },
            {
                token: "TC26-VIP-1022-9B5A",
                name: "Mehazabien Chowdhury",
                designation: "Lead OTT Actress & Toffee Creator",
                organization: "Media Production Guild",
                tier: "VIP_MEDIA",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:33:41Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Gluten-Free",
                    deviceFingerprint: "fp_mehz_ipad"
                }
            },
            {
                token: "TC26-VIP-1023-1E7C",
                name: "Mostofa Sarwar Farooki",
                designation: "Acclaimed Film Director",
                organization: "Chabial Productions",
                tier: "VIP_MEDIA",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1024-5D2B",
                name: "Nabila Rahman",
                designation: "Head of Marketing",
                organization: "Nestlé Bangladesh",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Vegetarian",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1025-7A9F",
                name: "Farhan Tanvir",
                designation: "Director of Enterprise Sales",
                organization: "Google Cloud South Asia",
                tier: "VIP_KEYNOTE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1026-4B8D",
                name: "Priyanka Sen",
                designation: "Strategic Partner Manager",
                organization: "Meta Platforms Inc.",
                tier: "VIP_DELEGATE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:52:19Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Vegetarian",
                    deviceFingerprint: "fp_psen_meta_m3"
                }
            },
            {
                token: "TC26-VIP-1027-2E3C",
                name: "Dr. Muhammad Zafar Iqbal",
                designation: "Distinguished Science & Sci-Fi Author",
                organization: "Shahjalal University of Science & Tech",
                tier: "VIP_KEYNOTE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1028-6A7F",
                name: "Russell T. Ahmed",
                designation: "President",
                organization: "BASIS (Bangladesh Association of Software)",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1029-9D1B",
                name: "Shams Mahmud",
                designation: "President",
                organization: "DCCI (Dhaka Chamber of Commerce)",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1030-3C5E",
                name: "Afnan Chowdhury",
                designation: "Managing Director",
                organization: "Adcomm Limited",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1031-8E2A",
                name: "Moutushi Kabir",
                designation: "Senior Director",
                organization: "BRAC Global Communications",
                tier: "VIP_DELEGATE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:44:09Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: "fp_brac_mkabir"
                }
            },
            {
                token: "TC26-VIP-1032-1F4D",
                name: "Asif Saleh",
                designation: "Executive Director",
                organization: "BRAC Bangladesh",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1033-5B7C",
                name: "Tahsina Rahman",
                designation: "Chief Brand Officer",
                organization: "Marico Bangladesh",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Vegetarian",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1034-7D9A",
                name: "Aman Ashraf Kabir",
                designation: "Managing Director",
                organization: "Bengal Meat Processing",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Halal",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1035-2A4F",
                name: "Nusrat Imrose Tisha",
                designation: "National Award-Winning Actress & Producer",
                organization: "Toffee Originals",
                tier: "VIP_MEDIA",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1036-6E1D",
                name: "Tahsan Khan",
                designation: "Singer, Actor & Cultural Ambassador",
                organization: "Independent Artist",
                tier: "VIP_MEDIA",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:22:10Z",
                checkedInAt: "2026-10-23T09:18:30Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: "fp_tahsan_iphone15"
                }
            },
            {
                token: "TC26-VIP-1037-9C3E",
                name: "Shyam Sunder Sikder",
                designation: "Former Chairman",
                organization: "BTRC Advisory Board",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1038-4F8A",
                name: "Habibullah N. Karim",
                designation: "Founder & CEO",
                organization: "Technohaven Company Ltd",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1039-1D7B",
                name: "Rubana Huq",
                designation: "Vice Chancellor & Former BGMEA President",
                organization: "Asian University for Women",
                tier: "VIP_KEYNOTE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Vegetarian",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1040-7E5C",
                name: "Sonia Bashir Kabir",
                designation: "Founder & General Partner",
                organization: "SBK Tech Ventures",
                tier: "VIP_KEYNOTE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:58:12Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: "fp_sbk_venture_ios"
                }
            },
            {
                token: "TC26-VIP-1041-3A9D",
                name: "Syed Almas Kabir",
                designation: "Managing Director",
                organization: "MetroNet Bangladesh Ltd",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1042-8B2F",
                name: "Zaraif Hossain",
                designation: "Head of Digital Strategy",
                organization: "Transcom Group",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1043-5C6E",
                name: "Sabbir Hasan Nasir",
                designation: "Executive Director",
                organization: "ACI Logistics (Shwapno)",
                tier: "VIP_ALL_ACCESS",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1044-2F1A",
                name: "A. K. M. Fahim Mashroor",
                designation: "Founder",
                organization: "Bdjobs.com",
                tier: "VIP_DELEGATE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:41:00Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: "fp_bdjobs_mashroor"
                }
            },
            {
                token: "TC26-VIP-1045-6D8B",
                name: "Ejaj Ahmad",
                designation: "Founder & President",
                organization: "Bangladesh Youth Leadership Center (BYLC)",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Vegetarian",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1046-9E4C",
                name: "Waseem Alim",
                designation: "Founder & CEO",
                organization: "Chaldal Limited",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1047-1A3E",
                name: "Ashiqur Rahman",
                designation: "Film Director & VFX Supervisor",
                organization: "Actionverse Studios",
                tier: "VIP_MEDIA",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1048-7B9D",
                name: "Amitabh Reza Chowdhury",
                designation: "Acclaimed Director & Founder",
                organization: "Half Stop Down",
                tier: "VIP_MEDIA",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:46:12Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: "fp_amitabh_hsd"
                }
            },
            {
                token: "TC26-VIP-1049-4C2F",
                name: "Piash Karim",
                designation: "Head of Marketing",
                organization: "Pran-RFL Group",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Halal",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1050-8D6A",
                name: "Tanvir Hossain",
                designation: "Head of Digital Products",
                organization: "Toffee Con 2026 Executive Team",
                tier: "VIP_ALL_ACCESS",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:10:00Z",
                checkedInAt: "2026-10-23T08:59:45Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: "fp_thossain_toffee_core"
                }
            },
            {
                token: "TC26-VIP-1051-5E8B",
                name: "Sadia Haque",
                designation: "Co-Founder & CEO",
                organization: "ShareTrip",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1052-2A7C",
                name: "Mohammad Ziaul Islam",
                designation: "Director of Enterprise Networks",
                organization: "Huawei Technologies Bangladesh",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1053-6B4D",
                name: "David Kim",
                designation: "VP of Streaming Engineering",
                organization: "AWS Media Solutions Asia",
                tier: "VIP_KEYNOTE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:38:22Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: "fp_aws_dkim_mac"
                }
            },
            {
                token: "TC26-VIP-1054-9C1E",
                name: "Nawshin Tabassum",
                designation: "Creative Producer",
                organization: "Adcomm / Ogilvy Bangladesh",
                tier: "VIP_MEDIA",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1055-3D8F",
                name: "Asif Mahmood",
                designation: "Chief Technical Architect",
                organization: "Banglalink Digital Hub",
                tier: "VIP_ALL_ACCESS",
                status: "CHECKED_IN",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:12:00Z",
                checkedInAt: "2026-10-23T09:00:15Z",
                gateId: "GATE-VIP-TURNOUT-1",
                metadata: {
                    seatZone: "Zone A - Executive Circle",
                    dietary: "Standard",
                    deviceFingerprint: "fp_bl_arch_m3"
                }
            },
            {
                token: "TC26-VIP-1056-7E2A",
                name: "Nazmul Hassan",
                designation: "Executive Director",
                organization: "Beximco Communications (Akash DTH)",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1057-1F9B",
                name: "Fariha Alam",
                designation: "Head of Communications",
                organization: "Standard Chartered Bank",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Vegetarian",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1058-4A3C",
                name: "Zakiul Islam",
                designation: "Senior Director of Technology",
                organization: "Ericsson South Asia",
                tier: "VIP_DELEGATE",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Telecom Leadership",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1059-8B7D",
                name: "Tasnuva Anan",
                designation: "Broadcaster & Human Rights Advocate",
                organization: "Boishakhi TV",
                tier: "VIP_MEDIA",
                status: "INVITED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: null,
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone C - Media & OTT Innovators",
                    dietary: "Standard",
                    deviceFingerprint: null
                }
            },
            {
                token: "TC26-VIP-1060-5C1E",
                name: "Kazi Monirul Kabir",
                designation: "Founder & Country Director",
                organization: "Spider Digital Innovations",
                tier: "VIP_DELEGATE",
                status: "CLAIMED",
                invitedAt: "2026-10-23T08:00:00Z",
                claimedAt: "2026-10-23T08:49:10Z",
                checkedInAt: null,
                gateId: null,
                metadata: {
                    seatZone: "Zone B - Enterprise Partners",
                    dietary: "Standard",
                    deviceFingerprint: "fp_spider_monir"
                }
            }
        ];

        return seedList;
    }

    /**
     * Hydrate and initialize accreditation whitelist
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
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.guests = parsed;
                    console.log(`[AccreditationStore] Loaded ${this.guests.length} VIP accreditation records from disk.`);
                    return;
                }
            }
        } catch (e) {
            console.error('[AccreditationStore] Error hydrating accreditation whitelist:', e.message);
        }

        // Initialize with default curated enterprise seed
        this.guests = this.getDefaultSeed();
        this.persist();
        console.log(`[AccreditationStore] Initialized seed whitelist with ${this.guests.length} VIP records.`);
    }

    /**
     * Retrieve all guests (with optional filters)
     */
    getAll({ status, tier, search } = {}) {
        let list = [...this.guests];

        if (status) {
            const statusUpper = status.toUpperCase().trim();
            list = list.filter(g => g.status === statusUpper);
        }

        if (tier) {
            const tierUpper = tier.toUpperCase().trim();
            list = list.filter(g => g.tier === tierUpper);
        }

        if (search) {
            const q = search.toLowerCase().trim();
            list = list.filter(g => 
                (g.name && g.name.toLowerCase().includes(q)) ||
                (g.organization && g.organization.toLowerCase().includes(q)) ||
                (g.designation && g.designation.toLowerCase().includes(q)) ||
                (g.token && g.token.toLowerCase().includes(q))
            );
        }

        return list;
    }

    /**
     * Find VIP guest by token (case-insensitive)
     */
    getByToken(token) {
        if (!token || typeof token !== 'string') return null;
        const normalized = token.trim().toUpperCase();
        return this.guests.find(g => g.token && g.token.toUpperCase() === normalized) || null;
    }

    /**
     * Claim invitation on attendee device
     */
    claimInvitation(token, deviceFingerprint = null) {
        const guest = this.getByToken(token);
        if (!guest) {
            return {
                success: false,
                error: 'VIP accreditation token not recognized',
                code: 'INVALID_TOKEN'
            };
        }

        if (guest.status === 'CHECKED_IN') {
            return {
                success: false,
                error: 'Guest already checked in at venue',
                code: 'ALREADY_CHECKED_IN',
                guest
            };
        }

        if (guest.status === 'CLAIMED') {
            return {
                success: true,
                alreadyClaimed: true,
                message: 'VIP invitation already claimed on device',
                guest
            };
        }

        guest.status = 'CLAIMED';
        guest.claimedAt = new Date().toISOString();
        if (!guest.metadata) guest.metadata = {};
        guest.metadata.deviceFingerprint = deviceFingerprint || `fp_${crypto.randomBytes(4).toString('hex')}`;

        this.scheduleSave();
        return {
            success: true,
            alreadyClaimed: false,
            guest
        };
    }

    /**
     * Check-in VIP attendee at gate turnstile
     */
    checkIn(token, gateId = 'GATE-VIP-MAIN') {
        const guest = this.getByToken(token);
        if (!guest) {
            return {
                success: false,
                error: 'VIP accreditation token not recognized',
                code: 'INVALID_TOKEN'
            };
        }

        if (guest.status === 'CHECKED_IN') {
            return {
                success: false,
                alreadyCheckedIn: true,
                error: 'VIP attendee already checked in at venue gate',
                code: 'ALREADY_CHECKED_IN',
                guest
            };
        }

        if (!guest.claimedAt) {
            guest.claimedAt = new Date().toISOString();
        }

        guest.status = 'CHECKED_IN';
        guest.checkedInAt = new Date().toISOString();
        guest.gateId = gateId || 'GATE-VIP-MAIN';

        this.scheduleSave();
        return {
            success: true,
            alreadyCheckedIn: false,
            guest
        };
    }

    /**
     * Mint / Issue new VIP accreditation token
     */
    issueToken(data = {}) {
        if (!data.name || !data.organization) {
            return {
                success: false,
                error: 'Attendee name and organization are required'
            };
        }

        const counter = 1000 + this.guests.length + 1;
        const token = this.generateToken(counter);

        const newGuest = {
            token,
            name: (data.name || '').trim(),
            designation: (data.designation || 'Executive VIP').trim(),
            organization: (data.organization || 'VIP Partner').trim(),
            tier: data.tier || 'VIP_ALL_ACCESS',
            status: 'INVITED',
            invitedAt: new Date().toISOString(),
            claimedAt: null,
            checkedInAt: null,
            gateId: null,
            metadata: {
                seatZone: data.seatZone || 'Zone A - Executive Circle',
                dietary: data.dietary || 'Standard',
                deviceFingerprint: null
            }
        };

        this.guests.unshift(newGuest);
        this.persist();
        return {
            success: true,
            guest: newGuest
        };
    }

    /**
     * Telemetry and summary analytics
     */
    getStats() {
        const total = this.guests.length;
        let invited = 0;
        let claimed = 0;
        let checkedIn = 0;
        const byTier = {};
        const byZone = {};

        for (const g of this.guests) {
            if (g.status === 'CHECKED_IN') checkedIn++;
            else if (g.status === 'CLAIMED') claimed++;
            else invited++;

            byTier[g.tier] = (byTier[g.tier] || 0) + 1;
            const zone = g.metadata?.seatZone || 'Zone A - Executive Circle';
            byZone[zone] = (byZone[zone] || 0) + 1;
        }

        return {
            total,
            invited,
            claimed,
            checkedIn,
            checkinRate: total > 0 ? Math.round((checkedIn / total) * 1000) / 10 : 0, // e.g. 11.7%
            byTier,
            byZone
        };
    }

    /**
     * PII and Credential-safe payload sanitization for public attendee endpoints
     */
    sanitizeGuest(guest) {
        if (!guest) return null;
        return {
            token: guest.token,
            name: guest.name,
            designation: guest.designation,
            organization: guest.organization,
            tier: guest.tier,
            status: guest.status,
            invitedAt: guest.invitedAt,
            claimedAt: guest.claimedAt,
            checkedInAt: guest.checkedInAt,
            gateId: guest.gateId,
            metadata: {
                seatZone: guest.metadata?.seatZone || 'Zone A - Executive Circle',
                dietary: guest.metadata?.dietary || 'Standard',
                claimed: !!guest.claimedAt
            }
        };
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
            fs.writeFileSync(tmpPath, JSON.stringify(this.guests, null, 2), 'utf-8');
            fs.renameSync(tmpPath, this.dataPath);
        } catch (e) {
            console.error('[AccreditationStore] Failed to persist whitelist:', e.message);
        }
    }
}

const accreditationStore = new AccreditationStore();
accreditationStore.init();

module.exports = accreditationStore;
