/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('EduToys main.js', () => {
    let capturedAppOptions;

    beforeEach(() => {
        // Setup simple DOM
        document.body.innerHTML = '<div id="app"></div>';
        global.fetch = jest.fn();
        capturedAppOptions = null;
        
        // Mock external libraries
        window.Vue = {
            createApp: jest.fn((options) => {
                capturedAppOptions = options;
                return {
                    mount: jest.fn()
                };
            })
        };
        
        window.PIXI = {
            Application: jest.fn(() => ({
                destroy: jest.fn()
            }))
        };
        
        window.Howler = {
            unload: jest.fn()
        };

        window.Howl = jest.fn(() => ({
            play: jest.fn(),
            stop: jest.fn(),
            playing: jest.fn(() => false)
        }));
        
        window.gsap = {
            killTweensOf: jest.fn()
        };

        // Load main.js
        jest.isolateModules(() => {
            require('../js/storage.js');
            require('../js/sticker-book.js');
            require('../js/main.js');
        });
    });

    it('should initialize EduToys namespace', () => {
        expect(window.EduToys).toBeDefined();
        expect(typeof window.EduToys.init).toBe('function');
        expect(typeof window.EduToys.loadGame).toBe('function');
        expect(typeof window.EduToys.cleanupGame).toBe('function');
    });

    it('should mount Vue app on initialization', () => {
        window.EduToys.init();
        expect(window.Vue.createApp).toHaveBeenCalled();
    });

    it('should reset audio state on cleanup', () => {
        window.EduToys.audio.init();

        expect(window.EduToys.audio.initialized).toBe(true);
        expect(window.EduToys.audio.bgm).toBeDefined();

        const pixiApp = {
            destroy: jest.fn()
        };
        window.EduToys.pixiApp = pixiApp;
        window.EduToys.cleanupGame();

        expect(pixiApp.destroy).toHaveBeenCalledWith(true, { children: true });
        expect(window.Howler.unload).toHaveBeenCalled();
        expect(window.EduToys.audio.initialized).toBe(false);
        expect(window.EduToys.audio.bgm).toBeNull();
        expect(window.EduToys.audio.seTap).toBeNull();
        expect(window.EduToys.audio.seTransition).toBeNull();
    });

    it('should recreate audio objects after cleanup when playing BGM again', () => {
        window.EduToys.audio.init();
        const firstBgm = window.EduToys.audio.bgm;

        window.EduToys.cleanupGame();
        window.EduToys.audio.playBGM();

        expect(window.EduToys.audio.initialized).toBe(true);
        expect(window.EduToys.audio.bgm).not.toBe(firstBgm);
        expect(window.EduToys.audio.bgm.play).toHaveBeenCalled();
    });

    it('should delegate sticker book navigation through the mounted Vue app', () => {
        const showStickerBook = jest.fn();
        window.EduToys.vueApp = { showStickerBook };

        window.EduToys.showStickerBook();

        expect(showStickerBook).toHaveBeenCalled();
    });

    it('should normalize touch events into drag coordinates', () => {
        expect(window.EduToys.stickerBook.getClientPoint({
            touches: [{ clientX: 120, clientY: 240 }]
        })).toEqual({ clientX: 120, clientY: 240 });

        expect(window.EduToys.stickerBook.getClientPoint({
            changedTouches: [{ clientX: 180, clientY: 320 }]
        })).toEqual({ clientX: 180, clientY: 320 });
    });

    it('should cleanup the previous game before loading a new one', () => {
        window.EduToys.init();

        const cleanupGame = jest.spyOn(window.EduToys, 'cleanupGame').mockImplementation(() => {});
        const loadGame = jest.spyOn(window.EduToys, 'loadGame').mockImplementation(() => {});
        const stopBGM = jest.spyOn(window.EduToys.audio, 'stopBGM').mockImplementation(() => {});

        const vm = {
            ...capturedAppOptions.data(),
            cancelStickerDrag: jest.fn(),
            playTap: jest.fn(),
            $nextTick: (callback) => callback()
        };

        capturedAppOptions.methods.loadGame.call(vm, '001_count_tap');

        expect(cleanupGame).toHaveBeenCalled();
        expect(stopBGM).toHaveBeenCalled();
        expect(loadGame).toHaveBeenCalledWith('001_count_tap');
        expect(vm.currentView).toBe('game');
        expect(vm.currentGameId).toBe('001_count_tap');
    });

    it('should expose the shape fit game in the home game list', () => {
        window.EduToys.init();

        const vm = {
            ...capturedAppOptions.data()
        };

        expect(vm.games).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: '002_shape_fit',
                name: 'かたちぴったん',
                category: 'かず',
                thumbnail: 'static/thumbnails/002_shape_fit.jpg'
            })
        ]));
    });

    it('should expose the hiragana tracing game in the home game list', () => {
        window.EduToys.init();

        const vm = {
            ...capturedAppOptions.data()
        };

        expect(vm.games).toEqual(expect.arrayContaining([
            expect.objectContaining({
                id: '003_hiragana_suisui',
                name: 'ひらがなすいすい',
                category: 'もじ',
                thumbnail: 'static/thumbnails/003_hiragana_suisui.jpg'
            })
        ]));
    });

    it('should hide the sticker book hint when stickers are already placed and no drag is active', () => {
        window.EduToys.init();

        expect(capturedAppOptions.computed.showStickerBookHint.call({
            placedStickers: [{ id: 'nature_star' }],
            draggingSticker: null
        })).toBe(false);

        expect(capturedAppOptions.computed.showStickerBookHint.call({
            placedStickers: [],
            draggingSticker: null
        })).toBe(true);

        expect(capturedAppOptions.computed.showStickerBookHint.call({
            placedStickers: [{ id: 'nature_star' }],
            draggingSticker: { id: 'nature_star' }
        })).toBe(true);
    });

    it('should use だいし wording in the sticker book drag hint', () => {
        const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

        expect(indexHtml).toContain("だいしに はなして はろう！");
        expect(indexHtml).not.toContain("たいしに はなして はろう！");
    });

    it('should reposition a placed sticker when dropped back onto the board', async () => {
        window.EduToys.init();

        jest.spyOn(window.EduToys.stickerBook, 'getClientPoint').mockReturnValue({ clientX: 260, clientY: 170 });
        jest.spyOn(window.EduToys.stickerBook, 'pointToPercent').mockReturnValue({ x: 60, y: 44 });
        jest.spyOn(window.EduToys.stickerBook, 'isPointInsideElement').mockReturnValue(true);

        const updateStickerPlacement = jest.spyOn(window.EduToys.storage, 'updateStickerPlacement').mockReturnValue({
            id: 'nature_star',
            pageIndex: 0,
            x: 60,
            y: 44,
            rotation: 8
        });
        const addSticker = jest.spyOn(window.EduToys.storage, 'addSticker').mockImplementation(() => {
            throw new Error('should not add a new sticker while repositioning');
        });

        const vm = {
            currentView: 'sticker_book',
            draggingSticker: {
                id: 'nature_star',
                name: 'ほし',
                path: 'static/stickers/nature/star.png',
                pageIndex: 0,
                stickerIndex: 1,
                rotation: 8,
                dragSource: 'placed'
            },
            dragPointerId: null,
            currentStickerPage: 0,
            $refs: {
                stickerBoard: {}
            },
            cancelStickerDrag: jest.fn(function cancelStickerDrag() {
                this.draggingSticker = null;
            }),
            syncStickerBookState: jest.fn().mockResolvedValue(undefined)
        };

        await capturedAppOptions.methods.onStickerBookPointerUp.call(vm, { clientX: 260, clientY: 170 });

        expect(updateStickerPlacement).toHaveBeenCalledWith(0, 1, 60, 44, 8);
        expect(addSticker).not.toHaveBeenCalled();
        expect(vm.cancelStickerDrag).toHaveBeenCalled();
        expect(vm.syncStickerBookState).toHaveBeenCalled();
    });
});
