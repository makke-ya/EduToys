// EduToys main.js

window.EduToys = {
    vueApp: null,
    pixiApp: null,

    init() {
        if (!window.Vue) {
            console.error('Vue.js is not loaded.');
            return;
        }

        const App = {
            data() {
                return {
                    currentView: 'home', // 'home', 'sticker_book', 'game'
                    currentGameId: null,
                    games: [
                        { id: '001_hiragana', name: 'ひらがなきそ', category: 'もじ', thumbnail: 'static/thumbnails/001_hiragana.jpg' },
                        { id: '002_count', name: 'かぞえてタップ', category: 'かず', thumbnail: 'static/thumbnails/002_count.jpg' },
                        // ダミーデータ。実際にはサーバーから取得するなどの拡張が可能
                    ]
                };
            },
            methods: {
                showHome() {
                    window.EduToys.cleanupGame();
                    this.currentView = 'home';
                    this.currentGameId = null;
                },
                showStickerBook() {
                    window.EduToys.cleanupGame();
                    this.currentView = 'sticker_book';
                    this.currentGameId = null;
                },
                loadGame(gameId) {
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
