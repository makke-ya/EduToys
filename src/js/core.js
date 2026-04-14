/**
 * Core Application Manager
 */
class EduToysApp {
    constructor() {
        this.pixi = null;
        this.currentScene = null;
        this.scenes = {};
        
        // 基準解像度 (4:3)
        this.designWidth = 1024;
        this.designHeight = 768;
        
        console.log("EduToysApp: Constructor initialized");
    }

    async init() {
        try {
            console.log("EduToysApp: Starting initialization...");
            
            // PixiJS Applicationの初期化
            this.pixi = new PIXI.Application({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0xfdfaf0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                forceCanvas: true // WebGLが使えない環境（ヘッドレス等）のためにCanvas2Dレンダラを強制
            });
            
            const container = document.getElementById('app-container');
            if (!container) throw new Error("app-container not found");
            container.appendChild(this.pixi.view);
            console.log("EduToysApp: Canvas appended to DOM");

            // リサイズ対応
            window.addEventListener('resize', () => this.onResize());

            // アセットロード
            console.log("EduToysApp: Loading assets...");
            await this.loadAssets();
            console.log("EduToysApp: Assets loaded successfully");

            // 初期シーンのセットアップ
            this.initScenes();
            console.log("EduToysApp: Scenes initialized");
            
            // ローダーを非表示にしてメニューへ
            this.hideLoader();
            this.switchScene('menu');
            console.log("EduToysApp: Switched to menu scene");

        } catch (error) {
            console.error("EduToysApp: Initialization failed:", error);
            // エラー時、ユーザーにメッセージを表示
            document.body.innerHTML += `<div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);color:white;padding:20px;z-index:9999;">
                <h2>エラーが発生しました</h2>
                <p>${error.message}</p>
            </div>`;
        }
    }

    async loadAssets() {
        const loaderBar = document.getElementById('loader-bar');
        
        const manifest = [
            { name: 'star', url: 'static/images/common/stickers/star.png' },
            { name: 'apple', url: 'static/images/common/stickers/apple.png' },
            { name: 'car', url: 'static/images/common/stickers/car.png' },
            { name: 'hanamaru', url: 'static/images/games/001_animal_hide_and_seek/hanamaru.png' },
            { name: 'bg_landscape', url: 'static/images/games/001_animal_hide_and_seek/bg.png' },
            { name: 'dog', url: 'static/images/games/001_animal_hide_and_seek/dog.png' },
            { name: 'cat', url: 'static/images/games/001_animal_hide_and_seek/cat.png' },
            { name: 'rabbit', url: 'static/images/games/001_animal_hide_and_seek/rabbit.png' },
            { name: 'bush', url: 'static/images/games/001_animal_hide_and_seek/bush.png' }
        ];

        return new Promise((resolve, reject) => {
            const loader = new PIXI.Loader(); // sharedを使わずインスタンスを作る
            
            manifest.forEach(res => {
                loader.add(res.name, res.url);
            });

            loader.onProgress.add((l) => {
                if (loaderBar) loaderBar.style.width = `${l.progress}%`;
            });

            loader.onError.add((err) => {
                console.warn("Asset load error:", err);
            });

            loader.load((l, resources) => {
                this.assets = resources;
                console.log("EduToysApp: Assets loaded", resources);
                resolve();
            });
        });
    }

    initScenes() {
        this.scenes = {
            menu: new MenuScene(this),
            bubble: new GameBubbleScene(this),
            zukan: new ZukanScene(this)
        };
    }

    switchScene(name) {
        if (!this.scenes[name]) {
            console.error(`Scene not found: ${name}`);
            return;
        }

        const nextScene = this.scenes[name];
        
        if (this.currentScene) {
            gsap.to(this.currentScene, { alpha: 0, duration: 0.3, onComplete: () => {
                this.pixi.stage.removeChild(this.currentScene);
                this.addNextScene(nextScene);
            }});
        } else {
            this.addNextScene(nextScene);
        }
    }

    addNextScene(scene) {
        scene.alpha = 0;
        this.pixi.stage.addChild(scene);
        this.currentScene = scene;
        if (scene.onShow) scene.onShow();
        gsap.to(scene, { alpha: 1, duration: 0.3 });
    }

    onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.pixi.renderer.resize(w, h);

        // スケールの計算 (Letterbox方式: コンテンツが完全に見えるようにスケーリング)
        // 縦画面の場合は高さに、横画面の場合は幅に合わせつつ、両方が画面内に収まるようにする
        const scaleX = w / this.designWidth;
        const scaleY = h / this.designHeight;
        this.globalScale = Math.min(scaleX, scaleY);

        // 少し小さめにスケーリングして安全余白を確保 (スマホ対応)
        const safeScale = this.globalScale * 0.95;

        if (this.pixi.stage) {
            this.pixi.stage.scale.set(safeScale);
            // 完全に中央寄せ
            this.pixi.stage.x = (w - this.designWidth * safeScale) / 2;
            this.pixi.stage.y = (h - this.designHeight * safeScale) / 2;
        }

        if (this.currentScene && this.currentScene.onResize) {
            this.currentScene.onResize();
        }
    }

    hideLoader() {
        const loader = document.getElementById('loader-screen');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        }
    }
}
