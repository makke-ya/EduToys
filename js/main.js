// EduToys main.js

window.EduToys = {
    vueApp: null,
    pixiApp: null,

    audio: {
        bgm: null,
        seTap: null,
        seTransition: null,
        initialized: false,
        init() {
            if (this.initialized || typeof window.Howl === 'undefined') return;
            // 既存のアセットを利用
            this.bgm = new window.Howl({ src: ['static/sounds/bgm/ゆったりお散歩.mp3'], loop: true, volume: 0.2 });
            this.seTap = new window.Howl({ src: ['static/sounds/system/決定1.mp3'], volume: 0.8 });
            this.seTransition = new window.Howl({ src: ['static/sounds/staging/短い音-フワ.mp3'], volume: 0.8 });
            this.initialized = true;
        },
        playBGM() {
            if (!this.initialized) this.init();
            if (this.bgm && !this.bgm.playing()) this.bgm.play();
        },
        stopBGM() {
            if (this.bgm) this.bgm.stop();
        },
        playSE(type) {
            if (!this.initialized) this.init();
            if (type === 'tap' && this.seTap) this.seTap.play();
            if (type === 'transition' && this.seTransition) this.seTransition.play();
        }
    },

    init() {
        if (!window.Vue) {
            console.error('Vue.js is not loaded.');
            return;
        }

        const App = {
            data() {
                return {
                    isStarted: false,
                    currentView: 'home', // 'home', 'sticker_book', 'game'
                    currentGameId: null,
                    games: [
                        { id: '001_count_tap', name: 'かぞえてタップ', category: 'かず', thumbnail: 'static/thumbnails/001_count_tap.jpg' },
                        // ダミーデータ。実際にはサーバーから取得するなどの拡張が可能
                    ]
                };
            },
            methods: {
                startGame() {
                    this.isStarted = true;
                    window.EduToys.audio.playBGM();
                    window.EduToys.audio.playSE('transition');
                },
                playTap() {
                    window.EduToys.audio.playSE('tap');
                },
                playTransition() {
                    window.EduToys.audio.playSE('transition');
                },
                showHome() {
                    this.playTransition();
                    window.EduToys.cleanupGame();
                    window.EduToys.audio.playBGM(); // ホームに戻ったらBGM再開
                    this.currentView = 'home';
                    this.currentGameId = null;
                },
                showStickerBook() {
                    this.playTransition();
                    window.EduToys.cleanupGame();
                    this.currentView = 'sticker_book';
                    this.currentGameId = null;
                },
                loadGame(gameId) {
                    this.playTap();
                    window.EduToys.audio.stopBGM(); // ゲーム中はゲーム専用BGMに切り替える想定
                    this.currentView = 'game';
                    this.currentGameId = gameId;
                    
                    // DOMの更新を待ってからゲームをロード
                    this.$nextTick(() => {
                        window.EduToys.loadGame(gameId);
                    });
                }
            }
        };

        this.vueApp = window.Vue.createApp(App).mount('#app');
    },

    loadGame(gameId) {
        console.log(`Loading game: ${gameId}`);
        // 1. game.jsonをfetch (モック実装)
        // 2. start.htmlをfetchして #game-ui-container に挿入
        // 3. PixiJS の初期化など

        const container = document.getElementById('game-canvas-container');
        if (container && window.PIXI) {
             // PixiJSのモック初期化（実際のゲーム側で初期化される想定だがプレースホルダーとして）
             /*
             this.pixiApp = new window.PIXI.Application({
                 resizeTo: container,
                 backgroundColor: 0xffffff,
                 resolution: window.devicePixelRatio || 1,
                 autoDensity: true,
             });
             container.appendChild(this.pixiApp.view);
             */
        }
    },

    cleanupGame() {
        console.log('Cleaning up game...');
        
        // PixiJSのクリーンアップ
        if (this.pixiApp) {
            this.pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
            this.pixiApp = null;
        }

        // Howlerのクリーンアップ
        if (window.Howler) {
            window.Howler.unload();
        }

        // GSAPのクリーンアップ
        if (window.gsap) {
            window.gsap.killTweensOf("*");
        }

        // UIコンテナのクリア
        const uiContainer = document.getElementById('game-ui-container');
        if (uiContainer) {
            uiContainer.innerHTML = '';
        }
        
        const canvasContainer = document.getElementById('game-canvas-container');
        if (canvasContainer) {
            canvasContainer.innerHTML = '';
        }
    }
};

// DOM読み込み完了時に初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.EduToys.init();
    });
}
