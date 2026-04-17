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
});
