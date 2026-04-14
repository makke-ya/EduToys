// games/001_count_tap/js/game.js

(function() {
    const container = document.getElementById('game-canvas-container');
    if (!container || !window.PIXI) return;

    // ゲーム状態
    const state = {
        totalCount: 0,
        currentCount: 0,
        objects: [],
        textures: ['games/001_count_tap/images/apple.svg', 'games/001_count_tap/images/car.svg', 'games/001_count_tap/images/star.svg']
    };

    // PixiJS アプリケーションの作成
    const app = new window.PIXI.Application({
        resizeTo: container,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0, // 背景はCSSに任せる
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });
    container.appendChild(app.view);
    
    // EduToysのグローバルにPixiAppを保存（クリーンアップ用）
    if (window.EduToys) {
        window.EduToys.pixiApp = app;
    }

    // 音声リソースの準備 (今回はプレースホルダーまたは既存のものを使用)
    // 実際には VOICEOX で生成した "いち", "に" などの音声を読み込む
    const voices = [];
    for(let i=1; i<=10; i++) {
        voices[i] = new Howl({ src: [`games/001_count_tap/voices/${i}.mp3`] }); // エラーにならないよう事前準備
    }
    const voiceClear = new Howl({ src: ['games/001_count_tap/voices/clear.mp3'] });
    const sePop = new Howl({ src: ['static/sounds/staging/短い音-ポヨン.mp3'], volume: 0.8 }); // 既存の音を流用
    const seClear = new Howl({ src: ['static/sounds/staging/ジャジャーン1.mp3'], volume: 0.6 }); // 既存の音を流用

    // ゲームの初期化
    function initGame() {
        // オブジェクトの数をランダムに決定 (3〜10)
        state.totalCount = Math.floor(Math.random() * 8) + 3;
        state.currentCount = 0;

        // UI更新
        document.getElementById('ui-total-count').textContent = state.totalCount;
        document.getElementById('ui-current-count').textContent = state.currentCount;

        // テーマ画像をランダムに選定
        const themeTextureUrl = state.textures[Math.floor(Math.random() * state.textures.length)];
        const texture = window.PIXI.Texture.from(themeTextureUrl);

        // オブジェクトを配置
        const padding = 100;
        const width = app.screen.width;
        const height = app.screen.height;

        for (let i = 0; i < state.totalCount; i++) {
            const sprite = new window.PIXI.Sprite(texture);
            sprite.anchor.set(0.5);
            
            // ランダムな位置 (なるべく重ならないようにする簡単なロジック)
            sprite.x = padding + Math.random() * (width - padding * 2);
            sprite.y = padding + Math.random() * (height - padding * 2);
            
            // ランダムな角度とスケール
            sprite.rotation = (Math.random() - 0.5) * 0.5; // -約14度〜+約14度
            const baseScale = 0.8 + Math.random() * 0.4; // 0.8〜1.2
            sprite.scale.set(baseScale);
            sprite.baseScale = baseScale;

            // タップイベントの設定
            sprite.eventMode = 'static';
            sprite.cursor = 'pointer';
            sprite.on('pointerdown', () => onObjectTapped(sprite));

            // 初期の出現アニメーション用
            sprite.scale.set(0);
            
            app.stage.addChild(sprite);
            state.objects.push(sprite);

            // GSAPによる出現アニメーション
            gsap.to(sprite.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.5,
                delay: i * 0.1, // 順番に出現
                ease: "back.out(1.7)"
            });
        }
    }

    // オブジェクトがタップされた時の処理
    function onObjectTapped(sprite) {
        if (sprite.isTapped) return; // 既にタップ済みなら無視
        sprite.isTapped = true;

        state.currentCount++;
        
        // UI更新
        document.getElementById('ui-current-count').textContent = state.currentCount;

        // 音声再生
        sePop.play();
        if (voices[state.currentCount]) {
            voices[state.currentCount].play();
        }

        // GSAPアニメーション: 弾けて消える
        gsap.to(sprite.scale, {
            x: sprite.baseScale * 1.5,
            y: sprite.baseScale * 1.5,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
                gsap.to(sprite.scale, {
                    x: 0,
                    y: 0,
                    duration: 0.2,
                    ease: "back.in(2)",
                    onComplete: () => {
                        app.stage.removeChild(sprite);
                    }
                });
            }
        });
        
        gsap.to(sprite, {
            alpha: 0,
            duration: 0.3,
            delay: 0.1
        });

        // クリア判定
        if (state.currentCount >= state.totalCount) {
            setTimeout(showClear, 800);
        }
    }

    // クリア時の処理
    function showClear() {
        seClear.play();
        voiceClear.play();

        // はなまるの描画
        const hanamaru = window.PIXI.Sprite.from('static/images/hanamaru.svg');
        hanamaru.anchor.set(0.5);
        hanamaru.x = app.screen.width / 2;
        hanamaru.y = app.screen.height / 2;
        hanamaru.scale.set(0);
        app.stage.addChild(hanamaru);

        gsap.to(hanamaru.scale, {
            x: 2,
            y: 2,
            duration: 0.8,
            ease: "elastic.out(1, 0.5)"
        });

        // DOMのオーバーレイを表示
        const overlay = document.getElementById('clear-overlay');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        
        // 少し遅れてフェードイン
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            overlay.classList.add('opacity-100');
        }, 100);
    }

    // イベントリスナーの登録
    document.getElementById('btn-replay').addEventListener('click', () => {
        // オーバーレイを隠す
        const overlay = document.getElementById('clear-overlay');
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.remove('flex');
            overlay.classList.add('hidden');
        }, 500);

        // ステージをクリアして再初期化
        app.stage.removeChildren();
        state.objects = [];
        initGame();
    });

    document.getElementById('btn-to-home').addEventListener('click', () => {
        if (window.EduToys && window.EduToys.vueApp) {
            // Vueコンポーネントのメソッドを呼び出してホームに戻る
            // ※実際には $root などを経由して showHome を呼ぶ
            const el = document.getElementById('app');
            if (el && el.__vue_app__) {
                // Vue 3 のコンポーネントインスタンスにアクセスするハック的アプローチ
                // main.js側で expose などの対処が必要になる場合あり
                if (window.EduToys.vueApp._instance.ctx.showHome) {
                    window.EduToys.vueApp._instance.ctx.showHome();
                }
            } else {
                // フォールバック
                 window.EduToys.cleanupGame();
                 window.location.reload();
            }
        }
    });

    // Fetch APIで非同期に画像を読み込んでから初期化する
    // (SVGの遅延読み込みによるPixiJSのエラーを防ぐため)
    app.loader = new window.PIXI.Assets.init();
    window.PIXI.Assets.load(state.textures).then(() => {
         initGame();
    });

})();
