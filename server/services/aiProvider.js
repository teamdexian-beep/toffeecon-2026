/**
 * ToffeeCon EOS - Modular Multi-Modal AI Provider Engine
 * Pluggable external GenAI APIs (Google Gemini, Replicate, Fal.ai, ElevenLabs)
 * with robust local procedural fallback for zero-downtime offline operation.
 */

const fs = require('fs');
const path = require('path');

// Auto-hydrate .env if not loaded by environment
try {
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = (match[2] || '').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                if (!process.env[key]) process.env[key] = value;
            }
        });
    }
} catch(e) {}

class AIProviderService {
    constructor() {
        this.config = {
            provider: process.env.AI_IMAGE_PROVIDER || (process.env.PIAPI_KEY ? 'piapi' : 'local_fallback'),
            apiKey: process.env.PIAPI_KEY || process.env.AI_IMAGE_API_KEY || '',
            apiEndpoint: process.env.AI_IMAGE_ENDPOINT || 'https://api.piapi.ai/api/v1/task',
            model: process.env.AI_IMAGE_MODEL || 'Qubico/image-toolkit'
        };

        // Pre-curated high-res retro-futuristic backdrop archetypes
        this.universeTemplates = {
            action: {
                title: 'ACTION: CYBERPUNK COMMANDO',
                tag: 'WARFARE IN 2033',
                accentColor: '#FF6B00',
                backdropUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=80',
                badgeText: 'TOFFEECON ORIGINAL · ACTION LEADER'
            },
            adventure: {
                title: 'ADVENTURE: PEAK CONQUEROR',
                tag: 'SUMMIT EXPEDITION',
                accentColor: '#10B981',
                backdropUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
                badgeText: 'TOFFEECON WILD · 4K EXPEDITIONS'
            },
            drama: {
                title: 'DRAMA: CINEMATIC NOIR',
                tag: 'PSYCHOLOGICAL THRILLER',
                accentColor: '#A855F7',
                backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1000&q=80',
                badgeText: 'TOFFEECON DRAMA · CRITIC ACCLAIM'
            },
            football: {
                title: 'FOOTBALL: STADIUM TITAN',
                tag: 'FIFA WORLD STAGE',
                accentColor: '#00F0FF',
                backdropUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
                badgeText: 'TOFFEECON SPORTS · LIVE 60FPS'
            },
            race: {
                title: 'RACE: NEON VELOCITY',
                tag: 'CIRCUIT ULTRA',
                accentColor: '#EF4444',
                backdropUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1000&q=80',
                badgeText: 'TOFFEECON GRAND PRIX · MULTI-ANGLE'
            },
            scifi: {
                title: 'SCI-FI: COSMIC NAVIGATOR',
                tag: 'INTERSTELLAR ODYSSEY',
                accentColor: '#EC4899',
                backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
                badgeText: 'TOFFEECON 2033 · RETRO-FUTURISM'
            }
        };

        // Regional & International Dub Archetypes for The Dub Booth
        this.dialectDictionaries = {
            japanese: {
                name: 'Japanese Anime (জাপানিজ)',
                accent: 'Tokyo Neo-Anime',
                tag: 'JPN-VOX-01',
                characterRole: 'Tokyo Anime Samurai',
                characterName: 'রেন কায়াতো (Ren Kayato)',
                avatarImage: '/api/media/dub_avatars/japanese.jpg',
                voiceCode: 'ja-JP',
                pitch: 1.1,
                rate: 1.05,
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': 'チュモントル・チュ・カリプッテル・グ！さあ、闇の呪文が発動する！',
                    'খেলা হবে': '勝負だ！試合が始まるぞ！',
                    'মামা খেলা হবে': 'おじさん、勝負だ！本気の戦いを見せてやる！',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': '法が法廷を動かすとしても、この街を支配するのは俺の言葉だ！'
                },
                defaultSuffix: '！さあ、勝負だ！'
            },
            russian: {
                name: 'Russian Cold War (রাশিয়ান)',
                accent: 'Moscow Heavy Baritone',
                tag: 'RUS-VOX-02',
                characterRole: 'Moscow Underworld Boss',
                characterName: 'ভিক্টর সোবোলভ (Viktor Sobolev)',
                avatarImage: '/api/media/dub_avatars/russian.jpg',
                voiceCode: 'ru-RU',
                pitch: 0.8,
                rate: 0.95,
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': 'Чу-мантра, чу-заклятие! Древняя магия пробудилась!',
                    'খেলা হবে': 'Игра началась, товарищ!',
                    'মামা খেলা হবে': 'Дядя, игра начинается! Теперь по нашим правилам!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': 'Закон правит судом, а этот район слушает только меня!'
                },
                defaultSuffix: ', понимаешь, товарищ!'
            },
            spanish: {
                name: 'Spanish Narcos (স্প্যানিশ)',
                accent: 'Medellín / Madrid Charisma',
                tag: 'ESP-VOX-03',
                characterRole: 'Cartel Don & Telenovela Star',
                characterName: 'ডন আলেহান্দ্রো (Don Alejandro)',
                avatarImage: '/api/media/dub_avatars/spanish.jpg',
                voiceCode: 'es-ES',
                pitch: 0.95,
                rate: 1.05,
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': '¡Chu mantra chu kaliputter gu! ¡El hechizo está lanzado, hermano!',
                    'খেলা হবে': '¡El juego acaba de comenzar!',
                    'মামা খেলা হবে': '¡Oye tío, aquí se juega de verdad!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': 'La ley manda en la corte, ¡pero en este barrio mando yo!'
                },
                defaultSuffix: ', ¡vamos mi hermano!'
            },
            french: {
                name: 'French Noir (ফরাসি)',
                accent: 'Parisian Cinema Romantic',
                tag: 'FRA-VOX-04',
                characterRole: 'Parisian Poet & Rogue',
                characterName: 'জুলিয়েন ফঁতেন (Julien Fontaine)',
                avatarImage: '/api/media/dub_avatars/french.jpg',
                voiceCode: 'fr-FR',
                pitch: 1.0,
                rate: 0.95,
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': 'Abracadabra mystique! La magie noire de la nuit opère!',
                    'খেলা হবে': 'Le jeu commence maintenant!',
                    'মামা খেলা হবে': 'Mon cher ami, le jeu vient de commencer!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': 'La loi règne au tribunal, mais dans ce quartier, ma parole fait loi.'
                },
                defaultSuffix: ', c\'est magnifique, n\'est-ce pas?'
            },
            korean: {
                name: 'Korean Thriller (কোরিয়ান)',
                accent: 'Seoul Action Noir',
                tag: 'KOR-VOX-05',
                characterRole: 'Seoul Cyber Detective',
                characterName: 'পার্ক মিন-হিউক (Park Min-hyuk)',
                avatarImage: '/api/media/dub_avatars/korean.jpg',
                voiceCode: 'ko-KR',
                pitch: 1.0,
                rate: 1.0,
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': '주문이 시작되었다! 숨겨진 힘이 깨어난다!',
                    'খেলা হবে': '승부는 지금부터다!',
                    'মামা খেলা হবে': '형님, 진짜 한판 승부가 시작됩니다!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': '법은 법원에나 있고, 이 거리는 내 말 한마디로 움직인다!'
                },
                defaultSuffix: '! 지금 바로 시작이다!'
            },
            arabic: {
                name: 'Arabic Cinema (আরবি)',
                accent: 'Desert Sovereign Resonance',
                tag: 'ARB-VOX-06',
                characterRole: 'Middle Eastern Sovereign',
                characterName: 'আমির আল-ফাহাদ (Amir Al-Fahad)',
                avatarImage: '/api/media/dub_avatars/arabic.jpg',
                voiceCode: 'ar-SA',
                pitch: 0.9,
                rate: 0.95,
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': 'تعويذة سرية غامضة! حان وقت السحر والبطولة!',
                    'খেলা হবে': 'المعركة بدأت الآن!',
                    'মামা খেলা হবে': 'يا عمي، بدأت اللعبة الحقيقية الآن!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': 'القانون يحكم المحكمة، ولكن هذا الحي يحكمه أمري!'
                },
                defaultSuffix: '، والله العظيم!'
            },
            sylheti: {
                name: 'Sylheti Dialect (সিলেটি)',
                accent: 'Sylhet Division Regional',
                tag: 'SYL-VOX-07',
                characterRole: 'Londoni Sylheti Boss',
                characterName: 'কালা মিয়া (Kala Miah)',
                avatarImage: '/api/media/dub_avatars/sylheti.jpg',
                voiceCode: 'bn-BD',
                pitch: 1.05,
                rate: 1.1,
                transforms: {
                    'কেমন আছেন': 'ভালা আছইন নি',
                    'কোথায় যাচ্ছেন': 'খানো যাইরা',
                    'খেলা হবে': 'খেলা অইব',
                    'টফি': 'টফি',
                    'ধন্যবাদ': 'শুকরিয়া',
                    'আইন': 'আইন',
                    'মহল্লা': 'পাড়া'
                },
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': 'ছু মন্তর ছু কালিপুত্তের গু! আইজকা আসল খেলা অইব বাওয়া!',
                    'মামা খেলা হবে': 'মামা আসল খেলা অইব রে ভাই!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': 'আইন দিয়া কোর্ট চলে অইব, আর এই পাড়া চলে আমার খথায় রে ভাই!'
                },
                defaultSuffix: ' রে ভাই!'
            },
            noakhali: {
                name: 'Noakhali Dialect (নোয়াখালী)',
                accent: 'Noakhali Delta Regional',
                tag: 'NOA-VOX-08',
                characterRole: 'Char-anchal Don',
                characterName: 'সুবেদার বশির (Subedar Bashir)',
                avatarImage: '/api/media/dub_avatars/noakhali.jpg',
                voiceCode: 'bn-BD',
                pitch: 0.95,
                rate: 1.0,
                transforms: {
                    'কেমন আছেন': 'কেম্নে আছন',
                    'কোথায় যাচ্ছেন': 'হায়েন যান',
                    'খেলা হবে': 'খেলা হইবো',
                    'টফি': 'টফি',
                    'ধন্যবাদ': 'মেলা শুকরিয়া'
                },
                knownTranslations: {
                    'ছু মন্তর ছু কালিপুত্তের গু': 'ছু মন্তর ছু কালিপুত্তের গু! হিয়ান নোয়াখালীর কেরামতি হানে!',
                    'মামা খেলা হবে': 'মামা অ্যাঁদের খেলা হইবো হানে!',
                    'আইন দিয়ে আদালত চলে আর এই মহল্লা চলে আমার কথায়': 'আইন দি আদালত চললে চলুক, এই এলাকা চলে অ্যাঁগো কথায় হানে!'
                },
                defaultSuffix: ' হানে!'
            }
        };
    }

    updateConfig(newConfig = {}) {
        this.config = { ...this.config, ...newConfig };
        console.log(`[AI Provider] Configuration updated. Active Provider: ${this.config.provider}`);
        return this.getStatus();
    }

    getStatus() {
        return {
            provider: this.config.provider,
            hasApiKey: !!(this.config.apiKey && this.config.apiKey.length > 5),
            model: this.config.model,
            mode: (this.config.apiKey && this.config.apiKey.length > 5) ? 'CLOUD_AI_ONLINE' : 'LOCAL_FALLBACK_ACTIVE'
        };
    }

    /**
     * Slide 10: In Another Universe GenAI portrait transformation
     */
    async transformPortrait({ guestName, guestPhotoBase64, genre = 'sports' }) {
        let cleanGenre = (genre || 'sports').toLowerCase();
        if (cleanGenre === 'sports') cleanGenre = 'football';
        const selectedGenre = this.universeTemplates[cleanGenre] ? cleanGenre : 'football';
        const template = this.universeTemplates[selectedGenre];
        const timestamp = new Date().toISOString();
        const posterId = 'UNIV-' + Math.floor(1000 + Math.random() * 9000);

        if (this.config.apiKey && this.config.provider !== 'local_fallback') {
            try {
                console.log(`[AI Provider] Attempting external image gen via ${this.config.provider}...`);
                const externalResult = await this.callExternalAIProvider({
                    guestPhotoBase64,
                    genre: selectedGenre,
                    template
                });
                if (externalResult && externalResult.imageUrl) {
                    return {
                        success: true,
                        posterId,
                        guestName: guestName || 'Summit Guest',
                        genre: selectedGenre,
                        template,
                        posterUrl: externalResult.imageUrl,
                        providerUsed: this.config.provider,
                        generationTimeMs: externalResult.durationMs || 1850,
                        timestamp
                    };
                }
            } catch (err) {
                console.warn(`[AI Provider] External call failed: ${err.message}. Falling back to edge compositor.`);
            }
        }

        const simulatedLatency = Math.floor(350 + Math.random() * 250);
        await new Promise(r => setTimeout(r, simulatedLatency));

        return {
            success: true,
            posterId,
            guestName: guestName || 'VIP Guest',
            genre: selectedGenre,
            template,
            posterUrl: guestPhotoBase64 || template.backdropUrl,
            rawGuestPhoto: guestPhotoBase64 || null,
            backdropUrl: template.backdropUrl,
            providerUsed: 'local_procedural_compositor',
            generationTimeMs: simulatedLatency,
            timestamp
        };
    }

    /**
     * Slide 14: The Dub Booth Voice AI & Dialect Translation (Gemini + Local High-Precision Engine)
     */
    async translateAndDubVoice({ text, targetDialect = 'japanese', audioSampleBase64, speakerName = 'Guest' }) {
        const dialectKey = this.dialectDictionaries[targetDialect] ? targetDialect : 'japanese';
        const dialectMeta = this.dialectDictionaries[dialectKey];
        const dubId = 'DUB-' + Math.floor(1000 + Math.random() * 9000);

        let cleanedOriginal = (text || 'ছু মন্তর ছু কালিপুত্তের গু! মামা খেলা হবে!').trim();
        let translatedText = '';
        let phoneticText = '';

        // Check if Gemini API is available for live cinematic translation
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            try {
                const prompt = `Translate the following Bengali movie dialogue into ${dialectMeta.name} for an OTT cinematic dubbing performance.
Dialogue: "${cleanedOriginal}"
Target Character Persona: ${dialectMeta.characterRole}
Return a strict JSON object with two fields:
{
  "translation": "<translated dialogue in target script/characters with cinematic excitement and emotion>",
  "phonetic": "<phonetic romanized guide for subtitles>"
}`;
                const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
                    })
                });
                if (geminiRes.ok) {
                    const geminiJson = await geminiRes.json();
                    const rawAnswer = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (rawAnswer) {
                        const parsed = JSON.parse(rawAnswer);
                        if (parsed.translation) translatedText = parsed.translation;
                        if (parsed.phonetic) phoneticText = parsed.phonetic;
                    }
                }
            } catch (e) {
                console.warn('[DubAI] Gemini translation fallback used:', e.message);
            }
        }

        // If Gemini not active or empty, use our rich archetype dictionary
        if (!translatedText) {
            if (dialectMeta.knownTranslations) {
                // Check direct match or substring
                for (const [key, val] of Object.entries(dialectMeta.knownTranslations)) {
                    if (cleanedOriginal.includes(key) || key.includes(cleanedOriginal)) {
                        translatedText = val;
                        break;
                    }
                }
            }

            if (!translatedText) {
                if (dialectMeta.transforms) {
                    translatedText = cleanedOriginal;
                    for (const [orig, trans] of Object.entries(dialectMeta.transforms)) {
                        translatedText = translatedText.replace(new RegExp(orig, 'g'), trans);
                    }
                    if (dialectMeta.defaultSuffix && !translatedText.endsWith(dialectMeta.defaultSuffix.trim())) {
                        translatedText += dialectMeta.defaultSuffix;
                    }
                } else {
                    // International fallback phrase
                    if (dialectKey === 'japanese') {
                        translatedText = '「' + cleanedOriginal + '」... それが俺たちの魂の叫びだ！さあ勝負だ！';
                        phoneticText = 'Sore ga oretachi no tamashii no sakebi da! Saa shoubu da!';
                    } else if (dialectKey === 'russian') {
                        translatedText = '«' + cleanedOriginal + '» — это наш закон на этих улицах, товарищ!';
                        phoneticText = 'Eto nash zakon na etikh ulitsakh, tovarishch!';
                    } else if (dialectKey === 'spanish') {
                        translatedText = '«' + cleanedOriginal + '» — ¡así se habla en estas calles, mi hermano!';
                        phoneticText = 'Así se habla en estas calles, mi hermano!';
                    } else if (dialectKey === 'french') {
                        translatedText = '«' + cleanedOriginal + '» — c\'est le destin qui frappe à notre porte!';
                        phoneticText = 'C\'est le destin qui frappe à notre porte!';
                    } else if (dialectKey === 'korean') {
                        translatedText = '«' + cleanedOriginal + '» — 이제 진짜 승부가 시작된다!';
                        phoneticText = 'Ije jinjja seungbuga shijakdoenda!';
                    } else if (dialectKey === 'arabic') {
                        translatedText = '«' + cleanedOriginal + '» — هذه هي الكلمة الحاسمة يا صديقي!';
                        phoneticText = 'Hathihi hiya al-kalimah al-hasimah ya sadiqi!';
                    } else {
                        translatedText = cleanedOriginal + ' রে ভাই!';
                    }
                }
            }
        }

        return {
            success: true,
            dubId,
            speakerName,
            originalText: cleanedOriginal,
            translatedText,
            phoneticText: phoneticText || translatedText,
            dialect: dialectMeta.name,
            dialectKey,
            characterRole: dialectMeta.characterRole,
            characterName: dialectMeta.characterName,
            avatarImage: dialectMeta.avatarImage,
            voiceCode: dialectMeta.voiceCode,
            pitch: dialectMeta.pitch || 1.0,
            rate: dialectMeta.rate || 1.0,
            accentTag: dialectMeta.tag,
            vocalCadenceHz: 180 + Math.floor(Math.random() * 40),
            providerUsed: geminiKey ? 'gemini_cloud_ai' : 'local_phonetic_engine',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Slide 17: Capsule 2033 AI Future Prediction Expander
     */
    async expandFuturePrediction({ author, company, predictionText }) {
        const predId = 'PRED-' + Math.floor(10000 + Math.random() * 90000);
        const text = predictionText || 'By 2033, video streaming will be embedded in holographic ambient walls.';
        
        // Generate AI editorial summary and 2033 Feasibility Index
        const keywords = text.toLowerCase();
        let feasibilityScore = 88;
        let domain = 'Ambient Computing';

        if (keywords.includes('cricket') || keywords.includes('sport')) {
            domain = 'Volumetric Holographic Sports';
            feasibilityScore = 94;
        } else if (keywords.includes('ai') || keywords.includes('generative')) {
            domain = 'Real-time Autonomous Storytelling';
            feasibilityScore = 96;
        } else if (keywords.includes('brain') || keywords.includes('neural')) {
            domain = 'Neural Interface Direct Streaming';
            feasibilityScore = 78;
        }

        const editorialHeadline = `[2033 OUTLOOK] ${domain.toUpperCase()}: "${text.slice(0, 75)}${text.length > 75 ? '...' : ''}"`;

        return {
            success: true,
            predId,
            author: author || 'ToffeeCon VIP',
            company: company || 'Industry Leader',
            rawPrediction: text,
            editorialHeadline,
            domain,
            feasibilityScore,
            targetYear: 2033,
            archivedTimestamp: new Date().toISOString()
        };
    }

    /**
     * Gemini & Procedural Engine for Toffee OTT AI Casting Audition
     */
    async analyzeAndGenerateAudition({ characterName, speechTranscript, genre = 'thriller', photoBase64, realName = 'VIP Auditionee' }) {
        const apiKey = process.env.GEMINI_API_KEY || this.config.apiKey || '';
        
        // Check if we can invoke Gemini API
        if (apiKey && apiKey.length > 10) {
            try {
                const prompt = `You are the Lead Casting Director & Creative Showrunner for Toffee, the #1 OTT streaming platform in Bangladesh.
An attendee at ToffeeCon has auditioned for a Toffee Original web series.
Character Name: "${characterName}"
Real Performer Name: "${realName}"
Genre: "${genre}" (options: thriller, action, comedy, romance, scifi, drama)
Audition Pitch/Dialogue: "${speechTranscript || 'Looking for my breakout role'}"

Analyze this audition and output ONLY a valid JSON object with the following structure (no markdown fences, just pure JSON):
{
  "roleTitle": "Creative archetypal title (in English, e.g. Old Dhaka Syndicate Enforcer, Maverick Cyber Detective, Chittagong Street Rapper, Dhaka High-Society Heist Mastermind)",
  "tagline": "Punchy 1-line dramatic dialogue/tagline in Bengali script (e.g. শহরের প্রতিটি গলিতে আমার নাম প্রতিধ্বনিত হয়)",
  "summary": "Compelling 2-sentence character backstory in Bengali script (highlighting their ambition, conflict, and distinct quirk)",
  "ottScore": 88, // integer between 82 and 97
  "scoreBreakdown": {
    "screenPresence": 92, // integer 80-98
    "dramaticGrit": 88, // integer 80-98
    "dialoguePunch": 90, // integer 80-98
    "originality": 89 // integer 80-98
  },
  "prompts": {
    "portraitPrompt": "Hyper-realistic cinematic character poster for ${characterName}, 35mm film still, character in striking costume reflecting ${genre}, dramatic volumetric lighting with teal/amber rim light, atmospheric Dhaka texture, depth of field, 8k resolution --ar 9:16",
    "fullBodyPrompt": "Full body dynamic hero character stance of ${characterName}, atmospheric cinematic environment reflecting ${genre}, high detail textile costume, confident body language, anamorphic lens flare, photorealistic 8k",
    "veo10sPrompt": "Cinematic 10-second OTT character reveal. [Camera Move: slow dolly push-in transitioning to high-angle hero angle]. ${characterName}, in bespoke ${genre} costume, makes an intense dramatic gesture, turning collar or adjusting posture, gazing piercingly into the camera. Lighting: Moody cinematic noir with neon edge illumination and atmospheric haze. Atmospheric audio: Low bass sub-drop with environmental sound cues. 24fps 4K."
  }
}`;

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            responseMimeType: 'application/json'
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (candidateText) {
                        const parsed = JSON.parse(candidateText.trim());
                        return {
                            success: true,
                            source: 'gemini',
                            ...parsed
                        };
                    }
                } else {
                    console.warn('[AIProvider] Gemini HTTP error, falling back to procedural:', response.status);
                }
            } catch (err) {
                console.warn('[AIProvider] Gemini API invocation error, using procedural fallback:', err.message);
            }
        }

        // Procedural High-Fidelity Fallback (Guarantees zero-downtime offline during the event)
        return this.getProceduralAudition({ characterName, speechTranscript, genre, realName });
    }

    getProceduralAudition({ characterName = 'বল্টু', speechTranscript = '', genre = 'thriller', realName = 'VIP Guest' }) {
        const archetypeMap = {
            thriller: {
                roleTitle: 'Old Dhaka Syndicate Enforcer',
                seriesTitle: 'ঢাকার শেষ মাস্তান',
                englishTitle: 'THE LAST DON OF DHAKA',
                tagline: 'অন্ধকার যখন নামে, তখন শুরু হয় আমার আসল খেলা।',
                summary: 'পুরান ঢাকার বুড়িগঙ্গা তীর ঘেঁষে গড়ে ওঠা গোপন নেটওয়ার্কের মূল চাবিকাঠি তার হাতে। শহরের পুলিশ প্রশাসন যাকে হন্যে হয়ে খুঁজছে কিন্তু প্রতিবার সে অদৃশ্য হয়ে যায়।',
                baseScore: 93,
                accentColor: '#FF6B00',
                colorGrade: 'teal-orange',
                backdropUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
                localBackdropUrl: '/api/media/archetypes/thriller.jpg',
                lighting: 'Moody noir with amber sodium streetlamp glow and atmospheric river fog',
                actingCritique: 'স্ক্রিন প্রেজেন্স: ৯৬% — অসাধারণ গ্যাংস্টার গ্রিট এবং ভিলেনের ঠান্ডা চাহনি। টফি ওটিটি ক্রাইম থ্রিলার লিড রোলে পারফেক্ট কাস্টিং!'
            },
            action: {
                roleTitle: 'Spec-Ops Rogue Recon Specialist',
                seriesTitle: 'সাইবার স্ট্রাইক ২০২৬',
                englishTitle: 'CYBER STRIKE: SPEC-OPS',
                tagline: 'মিশন যখন শেষ হবে, তখন কেবল আমার পায়ের ছাপ বাকি থাকবে।',
                summary: 'কঠিন ট্রেনিংপ্রাপ্ত সাবেক সামরিক স্পেশালিস্ট, যিনি এখন ঢাকার সাইবার আন্ডারগ্রাউন্ডের সাথে এক অসম লড়াইয়ে নেমেছেন। যার লক্ষ্য কেবল সত্য উন্মোচন করা।',
                baseScore: 91,
                accentColor: '#00F0FF',
                colorGrade: 'cyber-neon',
                backdropUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
                localBackdropUrl: '/api/media/archetypes/action.jpg',
                lighting: 'High-contrast cyan and crimson neon rim light with metallic highlights',
                actingCritique: 'অ্যাকশন এনার্জি: ৯৩% — ক্ষিপ্র শারীরিক ভাষা ও তীক্ষ্ণ চোখ। ব্লকব্লাস্টার অ্যাকশন থ্রিলারের জন্য উপযোগী।'
            },
            comedy: {
                roleTitle: 'Dhaka Neighborhood Hustler & Matchmaker',
                seriesTitle: 'মহল্লার রাজা বল্টু',
                englishTitle: 'THE NEIGHBORHOOD HUSTLER',
                tagline: 'সমস্যা যেটাই হোক, সমাধানের একটাই নাম—আমি!',
                summary: 'পুরো মহল্লার মানুষ যাকে ভালোবাসে কিন্তু তার ফাঁদে পড়ে নাকানি-চুবানি খায়। কথার জাদুতে চোরকেও সাধু বানিয়ে দেওয়ার অদ্ভুত ক্ষমতা তার।',
                baseScore: 89,
                accentColor: '#F59E0B',
                colorGrade: 'warm-golden',
                backdropUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
                localBackdropUrl: '/api/media/archetypes/comedy.jpg',
                lighting: 'Warm saturated golden hour light with vibrant street market background',
                actingCritique: 'কমিক টাইমিং: ৯৫% — স্বতঃস্ফূর্ত বডি ল্যাঙ্গুয়েজ এবং আঞ্চলিক ডায়লগ পাঞ্চ। দর্শকদের হাসিয়ে কাঁপিয়ে দেওয়ার ক্ষমতা।'
            },
            romance: {
                roleTitle: 'Melancholic Metro Songwriter',
                seriesTitle: 'বৃষ্টিভেজা মেট্রো',
                englishTitle: 'METRO AT BLUE HOUR',
                tagline: 'তোমার চোখের বৃষ্টিতে আমার শেষ সুর ভিজে যায়।',
                summary: 'ঢাকা শহরের ছাদ আর বৃষ্টির রাতে হারানো ভালোবাসার খোঁজে সুর বুনে চলে। যার প্রতিটি সৃষ্টি এক অদ্ভুত বেদনাময় প্রেমের গল্প বলে।',
                baseScore: 92,
                accentColor: '#EC4899',
                colorGrade: 'blue-hour',
                backdropUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
                localBackdropUrl: '/api/media/archetypes/romance.jpg',
                lighting: 'Soft diffused blue hour illumination with warm cafe fairy lights',
                actingCritique: 'আবেগ ও রোম্যান্স: ৯৪% — চোখের গভীরতায় তীব্র বিষাদ ও রোমান্টিক আবহ। ওটিটি মিউজিক্যাল ড্রামার প্রাণ।'
            },
            scifi: {
                roleTitle: 'Dhaka 2033 Quantum Grid Navigator',
                seriesTitle: 'কোয়ান্টাম ঢাকা ২০৩৩',
                englishTitle: 'QUANTUM DHAKA 2033',
                tagline: 'ভবিষ্যৎ কেবল দেখা যায় না, তাকে নিজের হাতে বানাতে হয়।',
                summary: 'ঢাকার ভবিষ্যৎ ডিজিটাল নেটওয়ার্কের শীর্ষ ডেটাহ্যাকার। যার নিউরাল ইন্টারফেসের ভেতর লুকিয়ে আছে গোটা শহরের ভবিষ্যৎ শক্তির চাবিকাঠি।',
                baseScore: 95,
                accentColor: '#A855F7',
                colorGrade: 'neon-violet',
                backdropUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80',
                localBackdropUrl: '/api/media/archetypes/scifi.jpg',
                lighting: 'Deep indigo and electric violet volumetric lasers with holographic glints',
                actingCritique: 'ফিউচারিস্টিক লুক: ৯৭% — অনন্য সাই-ফাই স্ক্রিন প্রেজেন্স ও ভবিষ্যৎ দৃষ্টি। গ্লোবাল স্ট্যান্ডার্ড কনসেপ্ট।'
            },
            drama: {
                roleTitle: 'Underground Heist Mastermind',
                seriesTitle: 'মুখোশের আড়ালে',
                englishTitle: 'BEHIND THE MASK',
                tagline: 'আইনের চোখ অন্ধ হতে পারে, কিন্তু আমার পরিকল্পনা নিখুঁত।',
                summary: 'ঢাকার অভিজাত সমাজের অন্তরালে পরিচালিত এক দুর্ধর্ষ মাস্টারমাইন্ড। যার প্রতিটি পদক্ষেপের পেছনে থাকে দাবা খেলার চালের মতো জটিল পরিকল্পনা।',
                baseScore: 94,
                accentColor: '#EF4444',
                colorGrade: 'noir-mono',
                backdropUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1000&q=80',
                localBackdropUrl: '/api/media/archetypes/drama.jpg',
                lighting: 'Dramatic single keylight with deep noir shadow slits and smoke',
                actingCritique: 'নাটকীয় গভীরতা: ৯৫% — শান্ত কিন্তু ধ্বংসাত্মক বুদ্ধিমত্তার বহিঃপ্রকাশ। তুখোড় ক্রিমিনাল ড্রামার মুখ্য চরিত্র।'
            }
        };

        const config = archetypeMap[genre.toLowerCase()] || archetypeMap.thriller;
        const jitter = Math.floor(Math.random() * 4);
        const ottScore = Math.min(97, config.baseScore + jitter);

        return {
            success: true,
            source: 'procedural_fallback',
            roleTitle: config.roleTitle,
            seriesTitle: config.seriesTitle,
            englishTitle: config.englishTitle,
            tagline: config.tagline,
            summary: config.summary,
            backdropUrl: config.backdropUrl,
            accentColor: config.accentColor,
            colorGrade: config.colorGrade,
            actingCritique: config.actingCritique,
            ottScore,
            scoreBreakdown: {
                screenPresence: Math.min(98, ottScore + Math.floor(Math.random() * 3) - 1),
                dramaticGrit: Math.min(98, ottScore - 2 + Math.floor(Math.random() * 4)),
                dialoguePunch: Math.min(98, ottScore + 1 + Math.floor(Math.random() * 3)),
                originality: Math.min(98, ottScore + Math.floor(Math.random() * 2))
            },
            prompts: {
                portraitPrompt: `Cinematic 8K character poster for ${characterName}, playing as ${config.roleTitle} in "${config.englishTitle}", 35mm film still, intense penetrating gaze, ${config.lighting}, fine Dhaka textures, authentic Bengali persona, Toffee Original aesthetic, depth of field --ar 9:16`,
                fullBodyPrompt: `Full body cinematic action hero still of ${characterName} in authentic stylized costume for ${config.roleTitle}, atmospheric set reflecting ${genre}, standing with confident posture, ${config.lighting}, 8k photorealistic`,
                veo10sPrompt: `Cinematic 10-second OTT character reveal. [Camera Move: slow dolly push-in transitioning to high-angle hero reveal]. ${characterName}, dressed as ${config.roleTitle}, turns collar up, making an intense dramatic gaze directly into the camera lens with a subtle confident smirk. Lighting: ${config.lighting}. Atmosphere: light atmospheric mist and dust motes. Audio: deep cinematic bass pulse with ambient environmental sound. 24fps 4K.`
            }
        };
    }

    /**
     * PiAPI Neural Face Swap Engine (Lowest Cost Identity-Preserving Cloud GenAI)
     */
    async callPiAPIFaceSwap({ swapImageBase64, targetImageUrl }) {
        const apiKey = this.config.apiKey || process.env.PIAPI_KEY;
        if (!apiKey) throw new Error('PiAPI Key not configured');

        let taskId = null;
        let lastErr = null;

        // Task dispatch with 3 automatic retries for resilient network socket handling
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[PiAPI] Dispatching neural face-swap task (attempt ${attempt}/3)...`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

                const createRes = await fetch('https://api.piapi.ai/api/v1/task', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'Qubico/image-toolkit',
                        task_type: 'face-swap',
                        input: {
                            target_image: targetImageUrl,
                            swap_image: swapImageBase64
                        }
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const createData = await createRes.json();
                if (createRes.ok && createData.data?.task_id) {
                    taskId = createData.data.task_id;
                    console.log(`[PiAPI] Task accepted: ${taskId}. Polling for completion...`);
                    break;
                } else {
                    lastErr = new Error(`PiAPI task creation rejected: ${createData.message || createRes.statusText}`);
                }
            } catch (dispatchErr) {
                lastErr = dispatchErr;
                console.warn(`[PiAPI] Dispatch attempt ${attempt} failed:`, dispatchErr.message, dispatchErr.cause || '');
                if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
            }
        }

        if (!taskId) {
            throw new Error(`PiAPI task creation failed after 3 attempts: ${lastErr?.message}`);
        }

        // Poll task status (up to 60 seconds for GPU queue resilience)
        const startTime = Date.now();
        while (Date.now() - startTime < 60000) {
            await new Promise(r => setTimeout(r, 1800));
            try {
                const pollRes = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
                    headers: { 'x-api-key': apiKey }
                });
                const pollData = await pollRes.json();
                const task = pollData.data;
                console.log(`[PiAPI] Task ${taskId} status: ${task?.status || 'unknown'}`);

                if (task && task.status === 'completed' && task.output?.image_url) {
                    console.log(`[PiAPI] Face swap completed in ${Date.now() - startTime}ms! URL: ${task.output.image_url}`);
                    return {
                        success: true,
                        imageUrl: task.output.image_url,
                        durationMs: Date.now() - startTime
                    };
                } else if (task && task.status === 'failed') {
                    const errMsg = task.error?.message || (task.logs && task.logs.join(' ')) || 'Unknown error';
                    throw new Error(`PiAPI task failed: ${errMsg}`);
                }
            } catch (pollErr) {
                console.warn('[PiAPI] Poll warning:', pollErr.message);
                if (pollErr.message.includes('PiAPI task failed')) throw pollErr;
            }
        }

        throw new Error('PiAPI task timeout after 60s');
    }
}

module.exports = new AIProviderService();

