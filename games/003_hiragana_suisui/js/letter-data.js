(function(factory) {
    const root = typeof window !== 'undefined' ? window : globalThis;
    const letterData = factory(root);

    root.EduToys = root.EduToys || {};
    root.EduToys.hiraganaSuisuiLetters = letterData;

    if (typeof module !== 'undefined') {
        module.exports = letterData;
    }
})(function(root) {
    const DATA_PATH = 'static/characters/animcjk/hiragana.json';
    const SMALL_KANA = new Set(['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'っ', 'ゃ', 'ゅ', 'ょ', 'ゎ', 'ゕ', 'ゖ']);
    let cachedPlayableData = null;
    let loadPromise = null;

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function classifyDifficulty(entry) {
        if (SMALL_KANA.has(entry.char)) {
            return 'small-kana';
        }

        if (entry.strokeCount <= 2) {
            return 'simple';
        }

        if (entry.strokes.some((stroke) => Array.isArray(stroke.segments) && stroke.segments.length > 1)) {
            return 'complex';
        }

        return entry.strokeCount >= 4 ? 'complex' : 'standard';
    }

    function extractPathNumbers(pathData) {
        return (String(pathData || '').match(/-?\d*\.?\d+/g) || []).map(Number);
    }

    function getGuideOverflowScore(pathData, viewBox) {
        const values = extractPathNumbers(pathData);
        const xs = values.filter((_, index) => index % 2 === 0);
        const ys = values.filter((_, index) => index % 2 === 1);
        if (!xs.length || !ys.length) {
            return Number.POSITIVE_INFINITY;
        }

        const [minX, minY, width, height] = String(viewBox || '0 0 1024 1024').split(/\s+/).map(Number);
        const maxX = minX + width;
        const maxY = minY + height;
        let overflow = 0;

        xs.forEach((x) => {
            overflow += Math.max(0, minX - x) + Math.max(0, x - maxX);
        });
        ys.forEach((y) => {
            overflow += Math.max(0, minY - y) + Math.max(0, y - maxY);
        });

        return overflow;
    }

    function pickStrokeGuidePath(viewBox, segments) {
        const candidates = (segments || [])
            .map((segment, index) => ({
                index,
                path: segment.guidePath,
                overflow: getGuideOverflowScore(segment.guidePath, viewBox)
            }))
            .filter((candidate) => candidate.path && Number.isFinite(candidate.overflow));

        if (!candidates.length) {
            return '';
        }

        candidates.sort((left, right) => {
            if (left.overflow !== right.overflow) {
                return left.overflow - right.overflow;
            }

            return left.index - right.index;
        });

        return candidates[0].path;
    }

    function normalizeEntry(entry) {
        const viewBox = entry.viewBox || '0 0 1024 1024';
        return {
            id: `hiragana-${entry.decimal}`,
            label: entry.char,
            decimal: entry.decimal,
            codePoint: entry.codePoint,
            sourceUrl: entry.sourceUrl,
            viewBox,
            strokeCount: entry.strokeCount,
            guideText: `みどりの まるで ${entry.char} を なぞってね！`,
            difficultyGroup: classifyDifficulty(entry),
            strokes: (entry.strokes || []).map((stroke) => {
                const segments = (stroke.segments || []).map((segment) => ({
                    key: segment.key,
                    suffix: segment.suffix || '',
                    outlinePath: segment.outlinePath,
                    guidePath: segment.guidePath,
                    guideDelaySeconds: segment.guideDelaySeconds || 0
                }));

                return {
                    index: stroke.stroke,
                    guidePath: pickStrokeGuidePath(viewBox, segments),
                    renderPath: pickStrokeGuidePath(viewBox, segments),
                    segments
                };
            })
        };
    }

    function normalizeDataset(rawData) {
        const entries = Array.isArray(rawData?.entries) ? rawData.entries : [];
        return entries.map(normalizeEntry);
    }

    function shuffle(items, randomFn) {
        const nextItems = [...items];

        for (let index = nextItems.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(randomFn() * (index + 1));
            [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
        }

        return nextItems;
    }

    function selectPlayLetters(dataset, count = 3, randomFn = Math.random) {
        const source = Array.isArray(dataset) ? dataset.filter(Boolean) : [];
        const targetCount = Math.max(1, Math.min(Math.floor(count), source.length));
        const byGroup = new Map();

        source.forEach((entry) => {
            const group = entry.difficultyGroup || 'standard';
            if (!byGroup.has(group)) {
                byGroup.set(group, []);
            }
            byGroup.get(group).push(entry);
        });

        const shuffledGroups = shuffle(Array.from(byGroup.keys()), randomFn);
        const picked = [];

        shuffledGroups.forEach((group) => {
            if (picked.length >= targetCount) {
                return;
            }

            const candidates = shuffle(byGroup.get(group), randomFn);
            if (candidates.length > 0) {
                picked.push(candidates[0]);
            }
        });

        if (picked.length < targetCount) {
            const usedIds = new Set(picked.map((entry) => entry.id));
            const remaining = shuffle(source.filter((entry) => !usedIds.has(entry.id)), randomFn);
            while (picked.length < targetCount && remaining.length > 0) {
                picked.push(remaining.shift());
            }
        }

        return picked.map((entry) => clone(entry));
    }

    function getLetterVoicePath(letter) {
        return `games/003_hiragana_suisui/voices/${letter.decimal}.mp3`;
    }

    function getClearVoicePath() {
        return 'games/003_hiragana_suisui/voices/clear.mp3';
    }

    function getPlayableHiraganaData() {
        if (cachedPlayableData) {
            return clone(cachedPlayableData);
        }

        if (typeof module !== 'undefined' && module.exports) {
            const fs = require('fs');
            const path = require('path');
            const jsonPath = path.resolve(__dirname, '..', '..', '..', 'static', 'characters', 'animcjk', 'hiragana.json');
            const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            cachedPlayableData = normalizeDataset(rawData);
            return clone(cachedPlayableData);
        }

        throw new Error('Playable hiragana data has not been loaded yet.');
    }

    async function loadPlayableHiraganaData() {
        if (cachedPlayableData) {
            return clone(cachedPlayableData);
        }

        if (loadPromise) {
            const loadedData = await loadPromise;
            return clone(loadedData);
        }

        if (typeof fetch !== 'function') {
            return getPlayableHiraganaData();
        }

        loadPromise = fetch(DATA_PATH)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load hiragana dataset: ${response.status}`);
                }

                return response.json();
            })
            .then((rawData) => {
                cachedPlayableData = normalizeDataset(rawData);
                return cachedPlayableData;
            })
            .finally(() => {
                loadPromise = null;
            });

        const loadedData = await loadPromise;
        return clone(loadedData);
    }

    return {
        DATA_PATH,
        getPlayableHiraganaData,
        loadPlayableHiraganaData,
        selectPlayLetters,
        getLetterVoicePath,
        getClearVoicePath
    };
});
