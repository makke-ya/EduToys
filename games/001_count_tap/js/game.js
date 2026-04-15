// games/001_count_tap/js/game.js

(function() {
    const container = document.getElementById('game-canvas-container');
    if (!container || !window.PIXI) return;

    // ゲーム状態
    const state = {
        totalCount: 0,
        currentCount: 0,
        objects: [],
        backgroundLayer: null,
        backgroundTexture: 'games/001_count_tap/images/background_meadow.svg',
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

    if (app.renderer && typeof app.renderer.on === 'function') {
        app.renderer.on('resize', () => {
            drawBackground();
        });
    }

    // 音声リソースの準備 (今回はプレースホルダーまたは既存のものを使用)
    // 実際には VOICEOX で生成した "いち", "に" などの音声を読み込む
    const voices = [];
    for(let i=1; i<=10; i++) {
        voices[i] = new Howl({ src: [`games/001_count_tap/voices/${i}.mp3`] }); // エラーにならないよう事前準備
    }
    const bgmGame = new Howl({
        src: ['static/sounds/bgm/Pops_01.mp3'],
        loop: true,
        volume: 0.22
    });
    const voiceClear = new Howl({ src: ['games/001_count_tap/voices/clear.mp3'] });
    const sePop = new Howl({ src: ['static/sounds/staging/短い音-ポヨン.mp3'], volume: 0.8 }); // 既存の音を流用
    const seClear = new Howl({ src: ['static/sounds/staging/ジャジャーン1.mp3'], volume: 0.6 }); // 既存の音を流用
    const seReward = new Howl({ src: ['static/sounds/system/完了3.mp3'], volume: 0.78 });

    const rewardState = {
        selectedStickerId: null
    };

    function drawCloud(layer, x, y, scale) {
        const cloud = new window.PIXI.Graphics();
        cloud.beginFill(0xffffff, 0.88);
        cloud.drawEllipse(x, y, 42 * scale, 22 * scale);
        cloud.drawCircle(x - (24 * scale), y, 18 * scale);
        cloud.drawCircle(x, y - (12 * scale), 22 * scale);
        cloud.drawCircle(x + (26 * scale), y - (2 * scale), 17 * scale);
        cloud.endFill();
        layer.addChild(cloud);
    }

    function drawBackground() {
        const width = app.screen.width;
        const height = app.screen.height;

        if (state.backgroundLayer) {
            app.stage.removeChild(state.backgroundLayer);
            state.backgroundLayer.destroy({ children: true });
        }

        const layer = new window.PIXI.Container();

        const backgroundSprite = new window.PIXI.Sprite(window.PIXI.Texture.from(state.backgroundTexture));
        backgroundSprite.width = width;
        backgroundSprite.height = height;
        layer.addChild(backgroundSprite);

        const skyGlow = new window.PIXI.Graphics();
        skyGlow.beginFill(0xfff6de, 0.2);
        skyGlow.drawCircle(width * 0.82, height * 0.2, Math.min(width, height) * 0.18);
        skyGlow.endFill();
        layer.addChild(skyGlow);

        const pinkGlow = new window.PIXI.Graphics();
        pinkGlow.beginFill(0xf8bfd1, 0.22);
        pinkGlow.drawCircle(width * 0.15, height * 0.18, Math.min(width, height) * 0.16);
        pinkGlow.endFill();
        layer.addChild(pinkGlow);

        drawCloud(layer, width * 0.22, height * 0.2, 1);
        drawCloud(layer, width * 0.72, height * 0.28, 0.92);
        drawCloud(layer, width * 0.52, height * 0.14, 0.75);

        const hillBack = new window.PIXI.Graphics();
        hillBack.beginFill(0xd7efc7);
        hillBack.drawEllipse(width * 0.2, height * 1.02, width * 0.34, height * 0.2);
        hillBack.drawEllipse(width * 0.78, height * 1.01, width * 0.3, height * 0.19);
        hillBack.endFill();
        layer.addChild(hillBack);

        const hillFront = new window.PIXI.Graphics();
        hillFront.beginFill(0xbfe5a8);
        hillFront.drawEllipse(width * 0.5, height * 1.03, width * 0.48, height * 0.22);
        hillFront.endFill();
        layer.addChild(hillFront);

        const flowerColors = [0xffb74d, 0xf48fb1, 0x81c784, 0x64b5f6];
        flowerColors.forEach((color, index) => {
            const flower = new window.PIXI.Graphics();
            const x = width * (0.14 + (index * 0.22));
            const y = height * 0.86 + ((index % 2) * 12);
            flower.lineStyle(4, 0x6fb06a, 1);
            flower.moveTo(x, y);
            flower.lineTo(x, y + 44);
            flower.beginFill(color, 0.95);
            flower.drawCircle(x, y, 10);
            flower.drawCircle(x - 12, y + 6, 10);
            flower.drawCircle(x + 12, y + 6, 10);
            flower.drawCircle(x - 6, y - 10, 10);
            flower.drawCircle(x + 6, y - 10, 10);
            flower.endFill();
            flower.beginFill(0xfff9c4, 1);
            flower.drawCircle(x, y, 7);
            flower.endFill();
            layer.addChild(flower);
        });

        app.stage.addChildAt(layer, 0);
        state.backgroundLayer = layer;
    }

    function resetRewardOverlay() {
        rewardState.selectedStickerId = null;

        const optionsContainer = document.getElementById('reward-sticker-options');
        const rewardMessage = document.getElementById('reward-message');
        const actionRow = document.getElementById('reward-action-row');

        if (optionsContainer) {
            optionsContainer.innerHTML = '';
        }
        if (rewardMessage) {
            rewardMessage.textContent = 'ごほうび シールを えらんでね！';
        }
        if (actionRow) {
            actionRow.classList.add('hidden');
        }
    }

    function hideOverlay() {
        const overlay = document.getElementById('clear-overlay');
        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');

        setTimeout(() => {
            overlay.classList.remove('flex');
            overlay.classList.add('hidden');
            resetRewardOverlay();
        }, 500);
    }

    function handleRewardSelected(sticker, selectedButton) {
        if (rewardState.selectedStickerId) {
            return;
        }

        rewardState.selectedStickerId = sticker.id;
        const rewardMessage = document.getElementById('reward-message');
        const actionRow = document.getElementById('reward-action-row');
        const optionButtons = document.querySelectorAll('.reward-sticker-option');

        try {
            if (window.EduToys && window.EduToys.storage) {
                window.EduToys.storage.awardSticker(sticker.id);
            } else {
                throw new Error('EduToys storage is not available.');
            }

            seReward.play();
            optionButtons.forEach((button) => button.classList.remove('reward-sticker-option--selected'));
            selectedButton.classList.add('reward-sticker-option--selected');
            rewardMessage.textContent = `${sticker.name} を げっと！`;
        } catch (error) {
            console.error('Failed to award sticker:', error);
            rewardMessage.textContent = 'シールを ほぞん できなかったよ';
        }

        actionRow.classList.remove('hidden');
    }

    async function populateRewardOptions() {
        const optionsContainer = document.getElementById('reward-sticker-options');
        const rewardMessage = document.getElementById('reward-message');
        const actionRow = document.getElementById('reward-action-row');

        resetRewardOverlay();

        if (!window.EduToys || !window.EduToys.stickerBook) {
            rewardMessage.textContent = 'シールを よみこめなかったよ';
            actionRow.classList.remove('hidden');
            return;
        }

        try {
            const options = await window.EduToys.stickerBook.getRewardOptions('001_count_tap', 3);

            if (!options.length) {
                rewardMessage.textContent = 'シールを よみこめなかったよ';
                actionRow.classList.remove('hidden');
                return;
            }

            options.forEach((sticker) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'reward-sticker-option edu-btn';
                button.innerHTML = `
                    <img src="${sticker.path}" alt="${sticker.name}">
                    <span class="text-lg font-bold">${sticker.name}</span>
                `;
                button.addEventListener('click', () => handleRewardSelected(sticker, button));
                optionsContainer.appendChild(button);
            });
        } catch (error) {
            console.error('Failed to prepare reward stickers:', error);
            rewardMessage.textContent = 'シールを よみこめなかったよ';
            actionRow.classList.remove('hidden');
        }
    }

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

        populateRewardOptions();
    }

    // イベントリスナーの登録
    document.getElementById('btn-replay').addEventListener('click', () => {
        hideOverlay();

        // ステージをクリアして再初期化
        app.stage.removeChildren();
        state.objects = [];
        state.backgroundLayer = null;
        drawBackground();
        initGame();
    });

    document.getElementById('btn-open-sticker-book').addEventListener('click', () => {
        if (window.EduToys && typeof window.EduToys.showStickerBook === 'function') {
            window.EduToys.showStickerBook();
        }
    });

    // 画像を読み込んでから初期化する
    async function start() {
        try {
            // PixiJS 7.x では Assets.init() は関数（非同期）
            if (window.PIXI.Assets.init) {
                await window.PIXI.Assets.init();
            }
            await window.PIXI.Assets.load([...state.textures, state.backgroundTexture]);
            if (!bgmGame.playing()) {
                bgmGame.play();
            }
            drawBackground();
            initGame();
        } catch (e) {
            console.error("Failed to load assets:", e);
        }
    }

    start();

})();
