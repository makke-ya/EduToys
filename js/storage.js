(function() {
    const STORAGE_KEY = 'edutoys-sticker-book';
    const STORAGE_VERSION = 1;

    function createDefaultState() {
        return {
            version: STORAGE_VERSION,
            earnedStickers: [],
            pages: [{ stickers: [] }]
        };
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function normalizeStickerId(stickerId) {
        if (typeof stickerId !== 'string' || !stickerId.trim()) {
            throw new Error('stickerId must be a non-empty string.');
        }

        return stickerId.trim();
    }

    function normalizeNumber(value, name) {
        const normalized = Number(value);
        if (!Number.isFinite(normalized)) {
            throw new Error(`${name} must be a finite number.`);
        }

        return normalized;
    }

    function normalizePlacement(placement) {
        if (!placement || typeof placement !== 'object') {
            return null;
        }

        try {
            return {
                id: normalizeStickerId(placement.id),
                x: normalizeNumber(placement.x, 'x'),
                y: normalizeNumber(placement.y, 'y'),
                rotation: Number.isFinite(Number(placement.rotation)) ? Number(placement.rotation) : 0
            };
        } catch (error) {
            return null;
        }
    }

    function normalizeState(rawState) {
        if (!rawState || typeof rawState !== 'object') {
            return createDefaultState();
        }

        const earnedStickers = Array.isArray(rawState.earnedStickers)
            ? rawState.earnedStickers.filter((stickerId) => typeof stickerId === 'string' && stickerId.trim()).map((stickerId) => stickerId.trim())
            : [];

        const pages = Array.isArray(rawState.pages)
            ? rawState.pages.map((page) => ({
                stickers: Array.isArray(page?.stickers)
                    ? page.stickers.map(normalizePlacement).filter(Boolean)
                    : []
            }))
            : [];

        return {
            version: STORAGE_VERSION,
            earnedStickers,
            pages: pages.length > 0 ? pages : [{ stickers: [] }]
        };
    }

    function getStorageTarget() {
        if (typeof window === 'undefined' || !window.localStorage) {
            throw new Error('localStorage is not available.');
        }

        return window.localStorage;
    }

    const root = typeof window !== 'undefined' ? window : globalThis;
    root.EduToys = root.EduToys || {};

    let state = createDefaultState();

    const storage = {
        load() {
            const storageTarget = getStorageTarget();
            const rawValue = storageTarget.getItem(STORAGE_KEY);

            if (!rawValue) {
                state = createDefaultState();
                return clone(state);
            }

            try {
                state = normalizeState(JSON.parse(rawValue));
            } catch (error) {
                state = createDefaultState();
            }

            return clone(state);
        },

        save(nextState = state) {
            state = normalizeState(nextState);
            getStorageTarget().setItem(STORAGE_KEY, JSON.stringify(state));
            return clone(state);
        },

        awardSticker(stickerId) {
            const normalizedStickerId = normalizeStickerId(stickerId);
            const nextState = this.load();
            nextState.earnedStickers.push(normalizedStickerId);
            this.save(nextState);
            return normalizedStickerId;
        },

        getStickers() {
            const currentState = this.load();

            return currentState.pages.flatMap((page, pageIndex) =>
                page.stickers.map((sticker) => ({
                    ...sticker,
                    pageIndex
                }))
            );
        },

        getAvailableStickers() {
            const currentState = this.load();
            const usedCounts = new Map();

            currentState.pages.forEach((page) => {
                page.stickers.forEach((sticker) => {
                    usedCounts.set(sticker.id, (usedCounts.get(sticker.id) || 0) + 1);
                });
            });

            const available = [];
            currentState.earnedStickers.forEach((stickerId) => {
                const used = usedCounts.get(stickerId) || 0;
                if (used > 0) {
                    usedCounts.set(stickerId, used - 1);
                    return;
                }

                available.push(stickerId);
            });

            return available;
        },

        addSticker(stickerId, pageIndex, x, y, rotation = 0) {
            const normalizedStickerId = normalizeStickerId(stickerId);
            const normalizedPageIndex = Math.max(0, Math.floor(normalizeNumber(pageIndex, 'pageIndex')));
            const normalizedX = normalizeNumber(x, 'x');
            const normalizedY = normalizeNumber(y, 'y');
            const normalizedRotation = normalizeNumber(rotation, 'rotation');

            if (!this.getAvailableStickers().includes(normalizedStickerId)) {
                throw new Error(`Sticker "${normalizedStickerId}" is not available.`);
            }

            const nextState = this.load();
            while (nextState.pages.length <= normalizedPageIndex) {
                nextState.pages.push({ stickers: [] });
            }

            const sticker = {
                id: normalizedStickerId,
                x: normalizedX,
                y: normalizedY,
                rotation: normalizedRotation
            };

            nextState.pages[normalizedPageIndex].stickers.push(sticker);
            this.save(nextState);

            return {
                ...sticker,
                pageIndex: normalizedPageIndex
            };
        },

        updateStickerPlacement(pageIndex, stickerIndex, x, y, rotation) {
            const normalizedPageIndex = Math.max(0, Math.floor(normalizeNumber(pageIndex, 'pageIndex')));
            const normalizedStickerIndex = Math.max(0, Math.floor(normalizeNumber(stickerIndex, 'stickerIndex')));
            const normalizedX = normalizeNumber(x, 'x');
            const normalizedY = normalizeNumber(y, 'y');
            const nextState = this.load();
            const page = nextState.pages[normalizedPageIndex];

            if (!page || !Array.isArray(page.stickers) || !page.stickers[normalizedStickerIndex]) {
                throw new Error(`Sticker at page ${normalizedPageIndex}, index ${normalizedStickerIndex} does not exist.`);
            }

            const currentSticker = page.stickers[normalizedStickerIndex];
            const nextRotation = rotation === undefined
                ? currentSticker.rotation
                : normalizeNumber(rotation, 'rotation');

            page.stickers[normalizedStickerIndex] = {
                ...currentSticker,
                x: normalizedX,
                y: normalizedY,
                rotation: nextRotation
            };

            this.save(nextState);

            return {
                ...page.stickers[normalizedStickerIndex],
                pageIndex: normalizedPageIndex
            };
        },

        clearAll() {
            state = createDefaultState();
            getStorageTarget().removeItem(STORAGE_KEY);
            return clone(state);
        }
    };

    root.EduToys.storage = storage;

    if (typeof module !== 'undefined') {
        module.exports = storage;
    }
})();
