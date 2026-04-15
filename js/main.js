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
        reset() {
            this.bgm = null;
            this.seTap = null;
            this.seTransition = null;
            this.initialized = false;
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

    async loadGame(gameId) {
        console.log(`[DEBUG] loadGame started for: ${gameId}`);
        const uiContainer = document.getElementById('game-ui-container');
        const canvasContainer = document.getElementById('game-canvas-container');
        
        if (!uiContainer || !canvasContainer) {
            console.error('[DEBUG] Game containers not found');
            return;
        }

        try {
            console.log(`[DEBUG] Fetching: games/${gameId}/start.html`);
            const response = await fetch(`games/${gameId}/start.html`);
            console.log(`[DEBUG] Fetch response status: ${response.status}`);
            if (!response.ok) throw new Error(`Failed to load game HTML: ${response.status}`);
            
            const html = await response.text();
            console.log(`[DEBUG] HTML length: ${html.length}`);
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            uiContainer.innerHTML = '';
            let nodeCount = 0;
            Array.from(doc.body.childNodes).forEach(node => {
                if (node.tagName !== 'SCRIPT') {
                    uiContainer.appendChild(node.cloneNode(true));
                    nodeCount++;
                }
            });
            console.log(`[DEBUG] Injected ${nodeCount} nodes into uiContainer`);

            const scripts = doc.querySelectorAll('script');
            console.log(`[DEBUG] Found ${scripts.length} scripts`);
            for (const script of scripts) {
                const newScript = document.createElement('script');
                if (script.src) {
                    console.log(`[DEBUG] Executing external script: ${script.src}`);
                    // キャッシュ回避のためにタイムスタンプを付与
                    const url = new URL(script.src, window.location.href);
                    url.searchParams.set('t', Date.now());
                    newScript.src = url.toString();
                } else {
                    console.log(`[DEBUG] Executing inline script`);
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
                newScript.dataset.gameScript = gameId;
            }
            console.log(`[DEBUG] loadGame completed successfully`);

        } catch (error) {
            console.error('[DEBUG] Error loading game:', error);
            alert('ゲームの読み込みに失敗しました。');
            if (this.vueApp) this.vueApp.showHome();
        }
    },

    cleanupGame() {
        console.log('Cleaning up game...');
        
        // PixiJSのクリーンアップ
        if (this.pixiApp) {
            try {
                this.pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
            } catch (e) {
                console.warn('PixiJS destroy error:', e);
            }
            this.pixiApp = null;
        }

        // Howlerのクリーンアップ
        if (window.Howler) {
            window.Howler.unload();
        }
        this.audio.reset();

        // GSAPのクリーンアップ
        if (window.gsap) {
            window.gsap.killTweensOf("*");
        }

        // 動的に追加したスクリプトの削除
        const scripts = document.querySelectorAll('script[data-game-script]');
        scripts.forEach(s => s.remove());

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
