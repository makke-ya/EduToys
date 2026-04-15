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
            stickers: [{ id: 'nature_star', name: 'ほし', path: 'static/stickers/nature/star.svg' }],
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
                    { id: 'nature_star', name: 'ほし', path: 'a.svg' },
                    { id: 'nature_sun', name: 'おひさま', path: 'b.svg' },
                    { id: 'food_apple', name: 'りんご', path: 'c.svg' },
                    { id: 'animals_cat', name: 'ねこ', path: 'd.svg' }
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
});
