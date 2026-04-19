(function() {
    const container = document.getElementById('game-canvas-container');
    if (!container || !window.PIXI) {
        return;
    }

    const GAME_ID = '002_shape_fit';
    const ASSET_BASE = 'games/002_shape_fit/images';
    const BACKGROUND_TEXTURE = `${ASSET_BASE}/background_shapes.png`;
    const SHAPES = {
        circle: {
            label: 'まる',
            piecePath: `${ASSET_BASE}/pieces/circle.png`,
            slotPath: `${ASSET_BASE}/slots/circle_slot.png`,
            voicePath: 'games/002_shape_fit/voices/correct_circle.mp3'
        },
        triangle: {
            label: 'さんかく',
            piecePath: `${ASSET_BASE}/pieces/triangle.png`,
            slotPath: `${ASSET_BASE}/slots/triangle_slot.png`,
            voicePath: 'games/002_shape_fit/voices/correct_triangle.mp3'
        },
        square: {
            label: 'しかく',
            piecePath: `${ASSET_BASE}/pieces/square.png`,
            slotPath: `${ASSET_BASE}/slots/square_slot.png`,
            voicePath: 'games/002_shape_fit/voices/correct_square.mp3'
        },
        star: {
            label: 'ほし',
            piecePath: `${ASSET_BASE}/pieces/star.png`,
            slotPath: `${ASSET_BASE}/slots/star_slot.png`,
            voicePath: 'games/002_shape_fit/voices/correct_star.mp3'
        },
        heart: {
            label: 'ハート',
            piecePath: `${ASSET_BASE}/pieces/heart.png`,
            slotPath: `${ASSET_BASE}/slots/heart_slot.png`,
            voicePath: 'games/002_shape_fit/voices/correct_heart.mp3'
        },
        diamond: {
            label: 'ひしがた',
            piecePath: `${ASSET_BASE}/pieces/diamond.png`,
            slotPath: `${ASSET_BASE}/slots/diamond_slot.png`,
            voicePath: 'games/002_shape_fit/voices/correct_diamond.mp3'
        }
    };
    const LEVELS = [
        ['circle', 'triangle', 'square'],
        ['circle', 'triangle', 'square', 'star'],
        ['circle', 'triangle', 'square', 'star', 'heart'],
        ['circle', 'triangle', 'square', 'star', 'heart', 'diamond']
    ];
    const ASSET_PATHS = [
        BACKGROUND_TEXTURE,
        ...Object.values(SHAPES).flatMap((shape) => [shape.piecePath, shape.slotPath])
    ];

    const state = {
        currentLevelIndex: 0,
        placedCount: 0,
        pieces: [],
        slots: [],
        backgroundLayer: null,
        slotLayer: null,
        pieceLayer: null,
        effectLayer: null,
        draggingPiece: null,
        isBusy: false,
        rewardSelected: null,
        introPlayed: false,
        timeoutIds: new Set(),
        destroyed: false
    };

    const app = new window.PIXI.Application({
        resizeTo: container,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });
    container.appendChild(app.view);

    if (window.EduToys) {
        window.EduToys.pixiApp = app;
    }

    if (window.PIXI.BaseTexture && window.PIXI.BaseTexture.defaultOptions) {
        window.PIXI.BaseTexture.defaultOptions.scaleMode = window.PIXI.SCALE_MODES.NEAREST;
    }

    const dom = {
        levelLabel: document.getElementById('ui-level-label'),
        progressLabel: document.getElementById('ui-progress-label'),
        banner: document.getElementById('shape-fit-banner'),
        bannerText: document.getElementById('shape-fit-banner-text'),
        overlay: document.getElementById('clear-overlay'),
        rewardMessage: document.getElementById('reward-message'),
        rewardOptions: document.getElementById('reward-sticker-options'),
        rewardActionRow: document.getElementById('reward-action-row'),
        replayButton: document.getElementById('btn-replay'),
        stickerBookButton: document.getElementById('btn-open-sticker-book')
    };

    const listeners = [];
    function bind(element, eventName, handler) {
        if (!element) {
            return;
        }

        element.addEventListener(eventName, handler);
        listeners.push(() => element.removeEventListener(eventName, handler));
    }

    function createHowl(src, options = {}) {
        return typeof window.Howl === 'function'
            ? new window.Howl({ src: [src], ...options })
            : { play() {}, stop() {}, playing() { return false; } };
    }

    const voiceGuide = createHowl('games/002_shape_fit/voices/guide.mp3');
    const voiceLevelClear = createHowl('games/002_shape_fit/voices/level_clear.mp3');
    const voiceClear = createHowl('games/002_shape_fit/voices/clear.mp3');
    const shapeVoices = Object.fromEntries(
        Object.entries(SHAPES).map(([shapeId, shape]) => [shapeId, createHowl(shape.voicePath)])
    );
    const bgmGame = createHowl('static/sounds/bgm/Pops_02.mp3', { loop: true, volume: 0.2 });
    const seGrab = createHowl('static/sounds/staging/短い音-ポヨン.mp3', { volume: 0.78 });
    const seCorrect = createHowl('static/sounds/staging/キュピーン1.mp3', { volume: 0.82 });
    const seWrong = createHowl('static/sounds/staging/短い音-ズッコケ.mp3', { volume: 0.7 });
    const seLevelClear = createHowl('static/sounds/staging/グロッケングリッサンド1.mp3', { volume: 0.72 });
    const seClear = createHowl('static/sounds/staging/ジャジャーン1.mp3', { volume: 0.68 });
    const seReward = createHowl('static/sounds/system/完了3.mp3', { volume: 0.8 });

    function schedule(callback, delay) {
        const timeoutId = window.setTimeout(() => {
            state.timeoutIds.delete(timeoutId);
            if (!state.destroyed) {
                callback();
            }
        }, delay);
        state.timeoutIds.add(timeoutId);
        return timeoutId;
    }

    function clearScheduledCallbacks() {
        state.timeoutIds.forEach((timeoutId) => {
            window.clearTimeout(timeoutId);
        });
        state.timeoutIds.clear();
    }

    function cleanup() {
        state.destroyed = true;
        clearScheduledCallbacks();
        listeners.splice(0).forEach((unbind) => unbind());
    }

    if (window.EduToys) {
        window.EduToys.gameCleanup = cleanup;
    }

    function shuffle(items) {
        const nextItems = [...items];

        for (let index = nextItems.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]];
        }

        return nextItems;
    }

    function applyNearestToTexture(texture) {
        if (texture?.baseTexture) {
            texture.baseTexture.scaleMode = window.PIXI.SCALE_MODES.NEAREST;
            texture.baseTexture.mipmap = window.PIXI.MIPMAP_MODES.OFF;
            texture.baseTexture.update();
        }
    }

    function updateHud() {
        const targetCount = LEVELS[state.currentLevelIndex].length;

        if (dom.levelLabel) {
            dom.levelLabel.textContent = `れべる ${state.currentLevelIndex + 1}`;
        }

        if (dom.progressLabel) {
            dom.progressLabel.textContent = `${state.placedCount} / ${targetCount}`;
        }
    }

    function showBanner(message, isWarning = false, duration = 900) {
        if (!dom.banner || !dom.bannerText) {
            return;
        }

        dom.bannerText.textContent = message;
        dom.banner.classList.remove('hidden', 'opacity-0', 'shape-fit-banner--warning', 'animate-shake');
        if (isWarning) {
            dom.banner.classList.add('shape-fit-banner--warning', 'animate-shake');
        }

        dom.banner.classList.add('opacity-100');

        schedule(() => {
            if (!dom.banner) {
                return;
            }

            dom.banner.classList.remove('opacity-100', 'animate-shake');
            dom.banner.classList.add('opacity-0');
            schedule(() => {
                if (dom.banner) {
                    dom.banner.classList.add('hidden');
                }
            }, 180);
        }, duration);
    }

    function resetRewardOverlay() {
        state.rewardSelected = null;

        if (dom.rewardOptions) {
            dom.rewardOptions.innerHTML = '';
        }
        if (dom.rewardMessage) {
            dom.rewardMessage.textContent = 'ごほうび シールを えらんでね！';
        }
        if (dom.rewardActionRow) {
            dom.rewardActionRow.classList.add('hidden');
        }
    }

    function hideOverlay() {
        if (!dom.overlay) {
            return;
        }

        dom.overlay.classList.remove('opacity-100');
        dom.overlay.classList.add('opacity-0');

        schedule(() => {
            if (!dom.overlay) {
                return;
            }

            dom.overlay.classList.remove('flex');
            dom.overlay.classList.add('hidden');
            resetRewardOverlay();
        }, 500);
    }

    function handleRewardSelected(sticker, selectedButton) {
        if (state.rewardSelected) {
            return;
        }

        state.rewardSelected = sticker.id;

        try {
            if (!window.EduToys?.storage) {
                throw new Error('EduToys storage is not available.');
            }

            window.EduToys.storage.awardSticker(sticker.id);
            seReward.play();

            document.querySelectorAll('.reward-sticker-option').forEach((button) => {
                button.classList.remove('reward-sticker-option--selected');
            });
            selectedButton.classList.add('reward-sticker-option--selected');

            if (dom.rewardMessage) {
                dom.rewardMessage.textContent = `${sticker.name} を げっと！`;
            }
        } catch (error) {
            console.error('Failed to award sticker:', error);
            if (dom.rewardMessage) {
                dom.rewardMessage.textContent = 'シールを ほぞん できなかったよ';
            }
        }

        if (dom.rewardActionRow) {
            dom.rewardActionRow.classList.remove('hidden');
        }
    }

    async function populateRewardOptions() {
        resetRewardOverlay();

        if (!window.EduToys?.stickerBook || !dom.rewardOptions) {
            if (dom.rewardMessage) {
                dom.rewardMessage.textContent = 'シールを よみこめなかったよ';
            }
            if (dom.rewardActionRow) {
                dom.rewardActionRow.classList.remove('hidden');
            }
            return;
        }

        try {
            const options = await window.EduToys.stickerBook.getRewardOptions(GAME_ID, 3);

            if (!options.length) {
                throw new Error('No reward options found.');
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
                dom.rewardOptions.appendChild(button);
            });
        } catch (error) {
            console.error('Failed to prepare reward stickers:', error);
            if (dom.rewardMessage) {
                dom.rewardMessage.textContent = 'シールを よみこめなかったよ';
            }
            if (dom.rewardActionRow) {
                dom.rewardActionRow.classList.remove('hidden');
            }
        }
    }

    function clearStage() {
        app.stage.removeChildren();
        state.pieces = [];
        state.slots = [];
        state.backgroundLayer = null;
        state.slotLayer = new window.PIXI.Container();
        state.pieceLayer = new window.PIXI.Container();
        state.effectLayer = new window.PIXI.Container();
        app.stage.addChild(state.slotLayer, state.pieceLayer, state.effectLayer);
    }

    function drawBackground() {
        if (!state.slotLayer) {
            return;
        }

        const width = app.screen.width;
        const height = app.screen.height;
        const texture = window.PIXI.Texture.from(BACKGROUND_TEXTURE);
        applyNearestToTexture(texture);

        const sprite = new window.PIXI.Sprite(texture);
        sprite.width = width;
        sprite.height = height;
        sprite.position.set(0, 0);
        app.stage.addChildAt(sprite, 0);
        state.backgroundLayer = sprite;
    }

    function createSparkles(x, y, color) {
        const particleCount = 8;

        for (let index = 0; index < particleCount; index += 1) {
            const sparkle = new window.PIXI.Graphics();
            sparkle.beginFill(color, 1);
            sparkle.drawRect(-4, -4, 8, 8);
            sparkle.endFill();
            sparkle.position.set(x, y);
            state.effectLayer.addChild(sparkle);

            const angle = (Math.PI * 2 * index) / particleCount;
            const distance = 34 + (index % 2) * 10;
            gsap.to(sparkle, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.42,
                ease: 'power2.out',
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        }
    }

    function getPieceScaleForCount(count) {
        const landscape = app.screen.width >= app.screen.height;

        if (landscape) {
            if (count <= 3) {
                return 3;
            }
            return 2;
        }

        if (count <= 4) {
            return 2;
        }
        return 1;
    }

    function getSlotScaleForCount(count, pieceScale) {
        if (pieceScale >= 3) {
            return 2;
        }

        if (count >= 5) {
            return 1;
        }

        return 1;
    }

    function getGridPositions(area, count, columns, jitter = 0) {
        const positions = [];
        const clampedColumns = Math.max(1, Math.min(columns, count));
        const rows = Math.ceil(count / clampedColumns);
        const cellWidth = (area.right - area.left) / clampedColumns;
        const cellHeight = (area.bottom - area.top) / rows;

        for (let index = 0; index < count; index += 1) {
            const row = Math.floor(index / clampedColumns);
            const indexInRow = index % clampedColumns;
            const itemsInRow = Math.min(clampedColumns, count - (row * clampedColumns));
            const rowLeft = area.left + ((clampedColumns - itemsInRow) * cellWidth) / 2;
            const x = rowLeft + cellWidth * (indexInRow + 0.5);
            const y = area.top + cellHeight * (row + 0.5);
            const jitterX = jitter > 0 ? (Math.random() - 0.5) * Math.min(jitter, cellWidth * 0.16) : 0;
            const jitterY = jitter > 0 ? (Math.random() - 0.5) * Math.min(jitter, cellHeight * 0.16) : 0;

            positions.push({
                x: x + jitterX,
                y: y + jitterY
            });
        }

        return positions;
    }

    function getSlotPositions(count) {
        const width = app.screen.width;
        const height = app.screen.height;
        const landscape = width >= height;

        if (landscape) {
            return getGridPositions({
                left: width * 0.06,
                right: width * 0.46,
                top: height * 0.16,
                bottom: height * 0.86
            }, count, count <= 3 ? 1 : 2);
        }

        return getGridPositions({
            left: width * 0.1,
            right: width * 0.9,
            top: height * 0.14,
            bottom: height * 0.46
        }, count, Math.min(3, count));
    }

    function getPiecePositions(count) {
        const width = app.screen.width;
        const height = app.screen.height;
        const landscape = width >= height;

        if (landscape) {
            return shuffle(getGridPositions({
                left: width * 0.52,
                right: width * 0.92,
                top: height * 0.18,
                bottom: height * 0.86
            }, count, 2, 20));
        }

        return shuffle(getGridPositions({
            left: width * 0.1,
            right: width * 0.9,
            top: height * 0.52,
            bottom: height * 0.88
        }, count, Math.min(3, count), 18));
    }

    function createSlotDisplay(shapeId, position, slotScale, pieceScale) {
        const texture = window.PIXI.Texture.from(SHAPES[shapeId].slotPath);
        applyNearestToTexture(texture);

        const display = new window.PIXI.Container();
        display.position.set(position.x, position.y);
        display.homeX = position.x;
        display.homeY = position.y;
        display.shapeId = shapeId;
        display.targetScale = slotScale;
        display.snapRadius = Math.max(68, 58 * pieceScale);

        const panelSize = 64 * slotScale + 42;
        const shadow = new window.PIXI.Graphics();
        shadow.beginFill(0xcfae8f, 0.2);
        shadow.drawRect((-panelSize / 2) + 8, (-panelSize / 2) + 10, panelSize, panelSize);
        shadow.endFill();
        display.addChild(shadow);

        const panelOuter = new window.PIXI.Graphics();
        panelOuter.beginFill(0xfff6e9, 0.96);
        panelOuter.drawRect(-panelSize / 2, -panelSize / 2, panelSize, panelSize);
        panelOuter.endFill();
        display.addChild(panelOuter);

        const panelInner = new window.PIXI.Graphics();
        panelInner.beginFill(0xffedd7, 0.98);
        panelInner.drawRect((-panelSize / 2) + 8, (-panelSize / 2) + 8, panelSize - 16, panelSize - 16);
        panelInner.endFill();
        display.addChild(panelInner);

        const slotGlow = new window.PIXI.Graphics();
        slotGlow.beginFill(0xffffff, 0.48);
        slotGlow.drawRect((-panelSize / 2) + 16, (-panelSize / 2) + 16, panelSize - 32, panelSize - 32);
        slotGlow.endFill();
        display.addChild(slotGlow);

        const slotSprite = new window.PIXI.Sprite(texture);
        slotSprite.anchor.set(0.5);
        slotSprite.alpha = 0.92;
        slotSprite.scale.set(slotScale);
        display.addChild(slotSprite);

        display.slotSprite = slotSprite;
        display.panelOuter = panelOuter;
        display.panelInner = panelInner;

        return display;
    }

    function shakeDisplay(target) {
        if (!target) {
            return;
        }

        gsap.fromTo(target, {
            x: target.homeX - 8
        }, {
            x: target.homeX + 8,
            duration: 0.08,
            repeat: 3,
            yoyo: true,
            ease: 'power1.inOut',
            onComplete: () => {
                target.x = target.homeX;
            }
        });
    }

    function returnPieceHome(piece, withWarning = false, slot = null) {
        piece.alpha = 1;
        gsap.to(piece.scale, {
            x: piece.homeScale,
            y: piece.homeScale,
            duration: 0.18,
            ease: 'power2.out'
        });
        gsap.to(piece, {
            x: piece.homeX,
            y: piece.homeY,
            duration: 0.32,
            ease: 'back.out(1.5)'
        });

        if (withWarning) {
            seWrong.play();
            showBanner('おなじ かたちを さがしてね', true, 1100);
            shakeDisplay(slot);
        }
    }

    function showHanamaru() {
        const hanamaru = window.PIXI.Sprite.from('static/images/hanamaru.svg');
        hanamaru.anchor.set(0.5);
        hanamaru.position.set(app.screen.width / 2, app.screen.height / 2);
        hanamaru.scale.set(0);
        state.effectLayer.addChild(hanamaru);

        gsap.to(hanamaru.scale, {
            x: 1.8,
            y: 1.8,
            duration: 0.72,
            ease: 'elastic.out(1, 0.45)'
        });
    }

    function showClearOverlay() {
        showHanamaru();
        seClear.play();
        voiceClear.play();

        if (!dom.overlay) {
            return;
        }

        dom.overlay.classList.remove('hidden');
        dom.overlay.classList.add('flex');

        schedule(() => {
            dom.overlay.classList.remove('opacity-0');
            dom.overlay.classList.add('opacity-100');
        }, 100);

        populateRewardOptions();
    }

    function advanceLevelOrClear() {
        state.isBusy = true;

        if (state.currentLevelIndex >= LEVELS.length - 1) {
            schedule(() => {
                state.isBusy = false;
                showClearOverlay();
            }, 900);
            return;
        }

        seLevelClear.play();
        voiceLevelClear.play();
        showBanner('すごーい！ つぎの もんだい！', false, 1200);

        schedule(() => {
            loadLevel(state.currentLevelIndex + 1);
            state.isBusy = false;
        }, 1200);
    }

    function handlePiecePlaced(piece, slot) {
        piece.isPlaced = true;
        piece.eventMode = 'none';
        state.draggingPiece = null;
        state.placedCount += 1;
        updateHud();

        seCorrect.play();
        shapeVoices[piece.shapeId]?.play();
        createSparkles(slot.x, slot.y, piece.sparkleColor);

        gsap.to(piece.scale, {
            x: slot.targetScale,
            y: slot.targetScale,
            duration: 0.2,
            ease: 'power2.out'
        });
        gsap.to(piece, {
            x: slot.x,
            y: slot.y,
            duration: 0.24,
            ease: 'back.out(1.6)'
        });
        gsap.to(slot, {
            alpha: 0.58,
            duration: 0.18
        });
        if (slot.slotSprite) {
            gsap.to(slot.slotSprite, {
                alpha: 0.22,
                duration: 0.18
            });
        }
        if (slot.panelInner) {
            gsap.to(slot.panelInner, {
                alpha: 0.72,
                duration: 0.18
            });
        }

        showBanner(`${SHAPES[piece.shapeId].label} ぴったん！`, false, 760);

        if (state.placedCount >= LEVELS[state.currentLevelIndex].length) {
            advanceLevelOrClear();
        }
    }

    function getNearestSlot(piece) {
        let bestMatch = null;
        let bestDistance = Infinity;

        state.slots.forEach((slot) => {
            const dx = piece.x - slot.x;
            const dy = piece.y - slot.y;
            const distance = Math.sqrt((dx * dx) + (dy * dy));
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = slot;
            }
        });

        return {
            slot: bestMatch,
            distance: bestDistance
        };
    }

    function endDrag(piece) {
        if (state.draggingPiece !== piece || piece.isPlaced || state.isBusy) {
            return;
        }

        piece.alpha = 1;
        state.draggingPiece = null;

        const { slot, distance } = getNearestSlot(piece);
        const threshold = slot ? slot.snapRadius : Infinity;

        if (slot && slot.shapeId === piece.shapeId && distance <= threshold) {
            handlePiecePlaced(piece, slot);
            return;
        }

        const nearAnySlot = slot && distance <= threshold;
        returnPieceHome(piece, nearAnySlot, slot);
    }

    function addPieceInteraction(piece) {
        piece.eventMode = 'static';
        piece.cursor = 'grab';
        piece
            .on('pointerdown', () => {
                if (piece.isPlaced || state.draggingPiece || state.isBusy) {
                    return;
                }

                state.draggingPiece = piece;
                state.pieceLayer.addChild(piece);
                seGrab.play();

                gsap.to(piece.scale, {
                    x: piece.homeScale * 1.1,
                    y: piece.homeScale * 1.1,
                    duration: 0.12,
                    ease: 'power2.out'
                });
            })
            .on('pointermove', (event) => {
                if (state.draggingPiece !== piece || piece.isPlaced || state.isBusy) {
                    return;
                }

                const nextPosition = event.data.getLocalPosition(app.stage);
                piece.position.set(nextPosition.x, nextPosition.y);
                piece.alpha = 0.96;
            })
            .on('pointerup', () => endDrag(piece))
            .on('pointerupoutside', () => endDrag(piece));
    }

    function buildLevel(shapeIds) {
        clearStage();
        drawBackground();

        const pieceOrder = shuffle(shapeIds);
        const slotOrder = shuffle(shapeIds);
        const pieceScale = getPieceScaleForCount(shapeIds.length);
        const slotScale = getSlotScaleForCount(shapeIds.length, pieceScale);
        const slotPositions = getSlotPositions(shapeIds.length);
        const piecePositions = getPiecePositions(shapeIds.length);

        slotOrder.forEach((shapeId, index) => {
            const slot = createSlotDisplay(shapeId, slotPositions[index], slotScale, pieceScale);
            state.slotLayer.addChild(slot);
            state.slots.push(slot);
        });

        pieceOrder.forEach((shapeId, index) => {
            const texture = window.PIXI.Texture.from(SHAPES[shapeId].piecePath);
            applyNearestToTexture(texture);

            const piece = new window.PIXI.Sprite(texture);
            piece.anchor.set(0.5);
            piece.position.set(piecePositions[index].x, piecePositions[index].y);
            piece.homeX = piece.x;
            piece.homeY = piece.y;
            piece.homeScale = pieceScale;
            piece.shapeId = shapeId;
            piece.sparkleColor = [0xffd54f, 0xf48fb1, 0x81c784, 0x64b5f6, 0xc084fc][index % 5];
            piece.angle = (Math.random() - 0.5) * 10;
            piece.scale.set(0);
            piece.isPlaced = false;
            addPieceInteraction(piece);
            state.pieceLayer.addChild(piece);
            state.pieces.push(piece);

            gsap.to(piece.scale, {
                x: pieceScale,
                y: pieceScale,
                duration: 0.38,
                delay: index * 0.06,
                ease: 'back.out(1.7)'
            });
        });
    }

    function loadLevel(levelIndex) {
        state.currentLevelIndex = levelIndex;
        state.placedCount = 0;
        state.draggingPiece = null;
        updateHud();
        buildLevel(LEVELS[levelIndex]);
    }

    async function startGame() {
        try {
            if (window.PIXI.Assets?.init && !(window.EduToys && window.EduToys.pixiAssetsInitialized)) {
                await window.PIXI.Assets.init();
                if (window.EduToys) {
                    window.EduToys.pixiAssetsInitialized = true;
                }
            }

            await window.PIXI.Assets.load(ASSET_PATHS);
            ASSET_PATHS.forEach((assetPath) => {
                applyNearestToTexture(window.PIXI.Texture.from(assetPath));
            });

            if (!bgmGame.playing()) {
                bgmGame.play();
            }

            loadLevel(0);

            if (!state.introPlayed) {
                state.introPlayed = true;
                voiceGuide.play();
            }
            showBanner('かたちを ぴったり はめてね！', false, 1200);
        } catch (error) {
            console.error('Failed to start shape fit game:', error);
        }
    }

    bind(dom.replayButton, 'click', () => {
        hideOverlay();
        state.isBusy = false;
        loadLevel(0);
        voiceGuide.play();
        showBanner('もういちど やってみよう！', false, 1100);
    });

    bind(dom.stickerBookButton, 'click', () => {
        if (window.EduToys && typeof window.EduToys.showStickerBook === 'function') {
            window.EduToys.showStickerBook();
        }
    });

    if (app.renderer && typeof app.renderer.on === 'function') {
        app.renderer.on('resize', () => {
            if (!state.destroyed) {
                loadLevel(state.currentLevelIndex);
            }
        });
    }

    startGame();
})();
