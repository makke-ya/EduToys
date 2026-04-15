/**
 * @jest-environment jsdom
 */

describe('EduToys stickerBook helpers', () => {
    beforeEach(() => {
        delete window.EduToys;
        jest.resetModules();
    });

    it('should load and cache the sticker catalog', async () => {
        const sampleCatalog = {
            stickers: [{ id: 'nature_star', name: 'ほし', path: 'static/stickers/nature/star.png' }],
            gameStickerPools: { '001_count_tap': ['nature_star'] }
        };

        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve(sampleCatalog)
        }));

        jest.isolateModules(() => {
            require('../js/sticker-book.js');
        });

        const first = await window.EduToys.stickerBook.loadCatalog();
        const second = await window.EduToys.stickerBook.loadCatalog();

        expect(first).toEqual(sampleCatalog);
        expect(second).toEqual(sampleCatalog);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return unique reward options for a game', async () => {
        global.fetch = jest.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                stickers: [
                    { id: 'nature_star', name: 'ほし', path: 'a.png' },
                    { id: 'nature_sun', name: 'おひさま', path: 'b.png' },
                    { id: 'food_apple', name: 'りんご', path: 'c.png' },
                    { id: 'animals_cat', name: 'ねこ', path: 'd.png' }
                ],
                gameStickerPools: {
                    '001_count_tap': ['nature_star', 'nature_sun', 'food_apple', 'animals_cat']
                }
            })
        }));

        jest.isolateModules(() => {
            require('../js/sticker-book.js');
        });

        const rewardOptions = await window.EduToys.stickerBook.getRewardOptions('001_count_tap', 3);

        expect(rewardOptions).toHaveLength(3);
        expect(new Set(rewardOptions.map((item) => item.id)).size).toBe(3);
    });

    it('should convert pointer coordinates into clamped percentages', () => {
        jest.isolateModules(() => {
            require('../js/sticker-book.js');
        });

        const board = {
            getBoundingClientRect: () => ({
                left: 100,
                top: 50,
                width: 400,
                height: 200
            })
        };

        expect(window.EduToys.stickerBook.pointToPercent(300, 150, board)).toEqual({ x: 50, y: 50 });
        expect(window.EduToys.stickerBook.pointToPercent(40, 400, board)).toEqual({ x: 0, y: 100 });
    });

    it('should detect whether a pointer is inside the board', () => {
        jest.isolateModules(() => {
            require('../js/sticker-book.js');
        });

        const board = {
            getBoundingClientRect: () => ({
                left: 100,
                top: 50,
                right: 500,
                bottom: 250,
                width: 400,
                height: 200
            })
        };

        expect(window.EduToys.stickerBook.isPointInsideElement(120, 90, board)).toBe(true);
        expect(window.EduToys.stickerBook.isPointInsideElement(40, 90, board)).toBe(false);
        expect(window.EduToys.stickerBook.isPointInsideElement(120, 290, board)).toBe(false);
    });
});
