/**
 * @jest-environment jsdom
 */

describe('EduToys storage', () => {
    beforeEach(() => {
        localStorage.clear();
        delete window.EduToys;

        jest.resetModules();
        jest.isolateModules(() => {
            require('../js/storage.js');
        });
    });

    it('should expose storage helpers and return the default state', () => {
        expect(window.EduToys.storage).toBeDefined();
        expect(typeof window.EduToys.storage.load).toBe('function');
        expect(typeof window.EduToys.storage.save).toBe('function');
        expect(typeof window.EduToys.storage.addSticker).toBe('function');
        expect(typeof window.EduToys.storage.updateStickerPlacement).toBe('function');
        expect(typeof window.EduToys.storage.getStickers).toBe('function');
        expect(typeof window.EduToys.storage.getAvailableStickers).toBe('function');
        expect(typeof window.EduToys.storage.awardSticker).toBe('function');
        expect(typeof window.EduToys.storage.clearAll).toBe('function');

        expect(window.EduToys.storage.load()).toEqual({
            version: 1,
            earnedStickers: [],
            pages: [{ stickers: [] }]
        });
        expect(window.EduToys.storage.getStickers()).toEqual([]);
        expect(window.EduToys.storage.getAvailableStickers()).toEqual([]);
    });

    it('should persist earned stickers', () => {
        window.EduToys.storage.awardSticker('food_apple');
        window.EduToys.storage.awardSticker('food_apple');
        window.EduToys.storage.awardSticker('animals_cat');

        expect(window.EduToys.storage.getAvailableStickers()).toEqual([
            'food_apple',
            'food_apple',
            'animals_cat'
        ]);

        const stored = JSON.parse(localStorage.getItem('edutoys-sticker-book'));
        expect(stored.earnedStickers).toEqual([
            'food_apple',
            'food_apple',
            'animals_cat'
        ]);
    });

    it('should place one earned sticker on the requested page', () => {
        window.EduToys.storage.awardSticker('nature_star');
        window.EduToys.storage.awardSticker('nature_star');

        const added = window.EduToys.storage.addSticker('nature_star', 1, 42, 55, 8);

        expect(added).toEqual({
            id: 'nature_star',
            pageIndex: 1,
            x: 42,
            y: 55,
            rotation: 8
        });
        expect(window.EduToys.storage.getStickers()).toEqual([
            {
                id: 'nature_star',
                pageIndex: 1,
                x: 42,
                y: 55,
                rotation: 8
            }
        ]);
        expect(window.EduToys.storage.getAvailableStickers()).toEqual(['nature_star']);
        expect(window.EduToys.storage.load().pages).toEqual([
            { stickers: [] },
            {
                stickers: [
                    {
                        id: 'nature_star',
                        x: 42,
                        y: 55,
                        rotation: 8
                    }
                ]
            }
        ]);
    });

    it('should update the placement of an existing sticker without returning it to the tray', () => {
        window.EduToys.storage.awardSticker('nature_star');
        window.EduToys.storage.addSticker('nature_star', 0, 42, 55, 8);

        const moved = window.EduToys.storage.updateStickerPlacement(0, 0, 70, 18, -4);

        expect(moved).toEqual({
            id: 'nature_star',
            pageIndex: 0,
            x: 70,
            y: 18,
            rotation: -4
        });
        expect(window.EduToys.storage.getStickers()).toEqual([
            {
                id: 'nature_star',
                pageIndex: 0,
                x: 70,
                y: 18,
                rotation: -4
            }
        ]);
        expect(window.EduToys.storage.getAvailableStickers()).toEqual([]);
    });

    it('should recover from invalid saved data', () => {
        localStorage.setItem('edutoys-sticker-book', '{broken-json');

        expect(window.EduToys.storage.load()).toEqual({
            version: 1,
            earnedStickers: [],
            pages: [{ stickers: [] }]
        });
    });
});
