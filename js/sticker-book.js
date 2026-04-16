(function() {
    const CATALOG_PATH = 'static/stickers/stickers.json';

    function normalizeCatalog(catalog) {
        return {
            stickers: Array.isArray(catalog?.stickers) ? catalog.stickers : [],
            gameStickerPools: catalog?.gameStickerPools && typeof catalog.gameStickerPools === 'object'
                ? catalog.gameStickerPools
                : {}
        };
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function pointInRect(clientX, clientY, rect) {
        if (!rect) {
            return false;
        }

        return clientX >= rect.left
            && clientX <= rect.right
            && clientY >= rect.top
            && clientY <= rect.bottom;
    }

    function shuffle(items) {
        const nextItems = [...items];

        for (let index = nextItems.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
        }

        return nextItems;
    }

    function getTouchPoint(event) {
        const touch = event?.touches?.[0] || event?.changedTouches?.[0];
        if (!touch) {
            return null;
        }

        return {
            clientX: touch.clientX,
            clientY: touch.clientY
        };
    }

    const root = typeof window !== 'undefined' ? window : globalThis;
    root.EduToys = root.EduToys || {};

    const stickerBook = {
        catalog: null,
        catalogPromise: null,

        async loadCatalog() {
            if (this.catalog) {
                return this.catalog;
            }

            if (this.catalogPromise) {
                return this.catalogPromise;
            }

            if (typeof fetch !== 'function') {
                this.catalog = normalizeCatalog({});
                return this.catalog;
            }

            this.catalogPromise = fetch(CATALOG_PATH)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Failed to load sticker catalog: ${response.status}`);
                    }

                    return response.json();
                })
                .then((catalog) => {
                    this.catalog = normalizeCatalog(catalog);
                    return this.catalog;
                })
                .catch((error) => {
                    console.error(error);
                    this.catalog = normalizeCatalog({});
                    return this.catalog;
                })
                .finally(() => {
                    this.catalogPromise = null;
                });

            return this.catalogPromise;
        },

        async getRewardOptions(gameId, count = 3) {
            const catalog = await this.loadCatalog();
            const pool = Array.isArray(catalog.gameStickerPools[gameId]) ? catalog.gameStickerPools[gameId] : [];
            const stickerMap = new Map(catalog.stickers.map((sticker) => [sticker.id, sticker]));
            const uniquePool = Array.from(new Set(pool))
                .map((stickerId) => stickerMap.get(stickerId))
                .filter(Boolean);

            return shuffle(uniquePool).slice(0, Math.max(0, count));
        },

        async getStickerDefinition(stickerId) {
            const catalog = await this.loadCatalog();
            return catalog.stickers.find((sticker) => sticker.id === stickerId) || null;
        },

        getClientPoint(event) {
            if (!event) {
                return null;
            }

            if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
                return {
                    clientX: event.clientX,
                    clientY: event.clientY
                };
            }

            return getTouchPoint(event);
        },

        pointToPercent(clientX, clientY, element) {
            const rect = element.getBoundingClientRect();
            const x = rect.width === 0 ? 0 : ((clientX - rect.left) / rect.width) * 100;
            const y = rect.height === 0 ? 0 : ((clientY - rect.top) / rect.height) * 100;

            return {
                x: Math.round(clamp(x, 0, 100)),
                y: Math.round(clamp(y, 0, 100))
            };
        },

        isPointInsideElement(clientX, clientY, element) {
            if (!element || typeof element.getBoundingClientRect !== 'function') {
                return false;
            }

            return pointInRect(clientX, clientY, element.getBoundingClientRect());
        },

        randomRotation() {
            return Math.round((Math.random() * 14) - 7);
        },

        clampPageIndex(pageIndex, pageCount) {
            return clamp(pageIndex, 0, Math.max(0, pageCount - 1));
        }
    };

    root.EduToys.stickerBook = stickerBook;

    if (typeof module !== 'undefined') {
        module.exports = stickerBook;
    }
})();
