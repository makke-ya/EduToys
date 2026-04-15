/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('EduToys main.js', () => {
    beforeEach(() => {
        // Setup simple DOM
        document.body.innerHTML = '<div id="app"></div>';
        
        // Mock external libraries
        window.Vue = {
            createApp: jest.fn(() => ({
                mount: jest.fn()
            }))
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

        window.EduToys.cleanupGame();

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
});
