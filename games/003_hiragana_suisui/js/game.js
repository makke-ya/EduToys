(function() {
    const container = document.getElementById('game-canvas-container');
    if (!container || !window.PIXI || !window.EduToys?.hiraganaSuisuiLetters || !window.EduToys?.hiraganaSuisuiTraceEngine) {
        return;
    }

    const letterDataApi = window.EduToys.hiraganaSuisuiLetters;
    const traceEngineApi = window.EduToys.hiraganaSuisuiTraceEngine;
    const LETTERS_PER_PLAY = 3;
    const LETTER_STROKE_WIDTH = 124;
    const LETTER_STROKE_EDGE_WIDTH = 158;
    const GUIDE_STROKE_WIDTH = 74;
    const TARGET_DOT_RADIUS = 22;
    const TRACKER_LOOK_AHEAD = 6;
    const TRACKER_COMPLETE_RATIO = 0.98;
    const SVG_NS = 'http://www.w3.org/2000/svg';

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

    const state = {
        allLetters: [],
        playLetters: [],
        currentLetterIndex: 0,
        currentStrokeIndex: 0,
        currentLetterMetrics: null,
        tracing: false,
        backgroundLayer: null,
        letterLayer: null,
        traceLayer: null,
        overlayLayer: null,
        currentGuideSprite: null,
        currentOutlineSprite: null,
        completedStrokeSprites: [],
        textureCache: new Map(),
        busy: false,
        rewardStickerId: null
    };

    const ui = {
        instruction: document.getElementById('ui-instruction-label'),
        letter: document.getElementById('ui-letter-label'),
        progress: document.getElementById('ui-progress-label'),
        banner: document.getElementById('trace-banner'),
        bannerText: document.getElementById('trace-banner-text')
    };

    const voiceClear = new Howl({ src: [letterDataApi.getClearVoicePath()] });
    const bgmGame = new Howl({
        src: ['static/sounds/bgm/MusicBox_03.mp3'],
        loop: true,
        volume: 0.24
    });
    const seTraceStart = new Howl({ src: ['static/sounds/staging/短い音-ポヨン.mp3'], volume: 0.75 });
    const seStrokeComplete = new Howl({ src: ['static/sounds/system/正解4.mp3'], volume: 0.7 });
    const seLetterComplete = new Howl({ src: ['static/sounds/staging/グロッケングリッサンド1.mp3'], volume: 0.72 });
    const seReward = new Howl({ src: ['static/sounds/system/完了3.mp3'], volume: 0.78 });
    const seReplay = new Howl({ src: ['static/sounds/system/決定11.mp3'], volume: 0.7 });

    function wait(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    function createSvgMarkup(viewBox, body) {
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`;
    }

    function toTextureCacheKey(viewBox, body) {
        return `${viewBox}::${body}`;
    }

    function getSvgTexture(viewBox, body) {
        const key = toTextureCacheKey(viewBox, body);
        if (state.textureCache.has(key)) {
            return state.textureCache.get(key);
        }

        const svg = createSvgMarkup(viewBox, body);
        const texture = window.PIXI.Texture.from(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        state.textureCache.set(key, texture);
        return texture;
    }

    function makeRenderStrokeBody(stroke, fillColor, edgeColor, strokeWidth = LETTER_STROKE_WIDTH, edgeWidth = LETTER_STROKE_EDGE_WIDTH) {
        if (!stroke?.renderPath) {
            return '';
        }

        return [
            `<path d="${stroke.renderPath}" fill="none" stroke="${edgeColor}" stroke-width="${edgeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`,
            `<path d="${stroke.renderPath}" fill="none" stroke="${fillColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"/>`
        ].join('');
    }

    function makeOutlineBody(letter) {
        return letter.strokes.map((stroke) => (
            makeRenderStrokeBody(stroke, 'rgba(255,255,255,0.94)', 'rgba(132,120,112,0.24)')
        )).join('');
    }

    function makeStrokeBody(letter, strokeIndex, fillColor, strokeColor, strokeWidth = 18) {
        const stroke = letter.strokes[strokeIndex];
        if (!stroke) {
            return '';
        }

        return makeRenderStrokeBody(stroke, fillColor, strokeColor, Math.max(strokeWidth * 4.5, LETTER_STROKE_WIDTH), Math.max((strokeWidth * 4.5) + 30, LETTER_STROKE_EDGE_WIDTH));
    }

    function makeGuideBody(letter, strokeIndex) {
        const stroke = letter.strokes[strokeIndex];
        if (!stroke?.guidePath) {
            return '';
        }

        return `<path d="${stroke.guidePath}" fill="none" stroke="#ffb8d1" stroke-width="${GUIDE_STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round" opacity="0.95"/>`;
    }

    function createSpriteFromSvg(viewBox, body) {
        return new window.PIXI.Sprite(getSvgTexture(viewBox, body));
    }

    function parseViewBox(viewBox) {
        const [minX, minY, width, height] = (viewBox || '0 0 1024 1024').split(/\s+/).map(Number);
        return { minX, minY, width, height };
    }

    function getLetterLayout(letter) {
        const parsed = parseViewBox(letter.viewBox);
        const reservedTop = 110;
        const reservedBottom = 70;
        const availableWidth = app.screen.width * 0.78;
        const availableHeight = Math.max(120, app.screen.height - reservedTop - reservedBottom);
        const scale = Math.min(availableWidth / parsed.width, availableHeight / parsed.height);
        const renderedWidth = parsed.width * scale;
        const renderedHeight = parsed.height * scale;
        const offsetX = (app.screen.width - renderedWidth) / 2;
        const offsetY = reservedTop + ((availableHeight - renderedHeight) / 2);

        return {
            parsed,
            scale,
            offsetX,
            offsetY
        };
    }

    function positionSprite(sprite, layout) {
        sprite.x = layout.offsetX;
        sprite.y = layout.offsetY;
        sprite.width = layout.parsed.width * layout.scale;
        sprite.height = layout.parsed.height * layout.scale;
    }

    function createPathMetrics(pathData) {
        const svgPath = document.createElementNS(SVG_NS, 'path');
        svgPath.setAttribute('d', pathData);
        const totalLength = svgPath.getTotalLength();
        const sampleCount = Math.max(30, Math.ceil(totalLength / 20));
        const points = [];

        for (let index = 0; index <= sampleCount; index += 1) {
            const point = svgPath.getPointAtLength((totalLength * index) / sampleCount);
            points.push({ x: point.x, y: point.y });
        }

        return { points };
    }

    function collectStrokeGuidePoints(stroke) {
        if (!stroke?.guidePath) {
            return [];
        }

        return createPathMetrics(stroke.guidePath).points;
    }

    function createTrackerOptions(layout) {
        const baseRadius = Math.max(30, 46 * Math.min(layout.scale, 1.08));
        return {
            hitRadius: baseRadius,
            startRadius: baseRadius * 1.32,
            followRadius: baseRadius * 1.12,
            lookAheadPoints: TRACKER_LOOK_AHEAD,
            completionRatio: TRACKER_COMPLETE_RATIO
        };
    }

    function createStrokeMetrics(letter, strokeIndex, layout) {
        const stroke = letter.strokes[strokeIndex];
        const guidePoints = collectStrokeGuidePoints(stroke);
        if (!guidePoints.length) {
            return null;
        }

        const scaledPoints = guidePoints.map((point) => ({
            x: layout.offsetX + ((point.x - layout.parsed.minX) * layout.scale),
            y: layout.offsetY + ((point.y - layout.parsed.minY) * layout.scale)
        }));

        return {
            points: scaledPoints,
            startPoint: scaledPoints[0],
            endPoint: scaledPoints[scaledPoints.length - 1]
        };
    }

    function getCurrentLetter() {
        return state.playLetters[state.currentLetterIndex] || null;
    }

    function getCurrentStrokeInfo() {
        const letter = getCurrentLetter();
        if (!letter) {
            return null;
        }

        if (!state.currentLetterMetrics || state.currentLetterMetrics.letterId !== letter.id || state.currentLetterMetrics.strokeIndex !== state.currentStrokeIndex) {
            const layout = getLetterLayout(letter);
            const strokeMetrics = createStrokeMetrics(letter, state.currentStrokeIndex, layout);
            state.currentLetterMetrics = {
                letterId: letter.id,
                strokeIndex: state.currentStrokeIndex,
                layout,
                strokeMetrics,
                tracker: strokeMetrics ? new traceEngineApi.OrderedStrokeTracker(strokeMetrics.points, createTrackerOptions(layout)) : null
            };
        }

        return state.currentLetterMetrics;
    }

    function updateUi() {
        const letter = getCurrentLetter();
        if (!letter) {
            return;
        }

        if (ui.instruction) {
            ui.instruction.textContent = letter.guideText;
        }
        if (ui.letter) {
            ui.letter.textContent = letter.label;
        }
        if (ui.progress) {
            ui.progress.textContent = `${Math.min(state.currentLetterIndex + 1, state.playLetters.length)} / ${state.playLetters.length}`;
        }
    }

    function showBanner(text, variant) {
        if (!ui.banner || !ui.bannerText) {
            return;
        }

        ui.banner.classList.remove('hidden', 'hiragana-banner--warning', 'opacity-0');
        if (variant === 'warning') {
            ui.banner.classList.add('hiragana-banner--warning');
        }
        ui.banner.classList.add('opacity-100');
        ui.bannerText.textContent = text;

        window.clearTimeout(showBanner.timeoutId);
        showBanner.timeoutId = window.setTimeout(() => {
            ui.banner.classList.remove('opacity-100');
            ui.banner.classList.add('opacity-0');
            window.setTimeout(() => {
                ui.banner.classList.add('hidden');
            }, 180);
        }, 720);
    }

    function clearLetterSprites() {
        if (!state.letterLayer) {
            return;
        }

        if (state.currentGuideSprite) {
            gsap.killTweensOf(state.currentGuideSprite);
        }
        if (state.currentOutlineSprite) {
            gsap.killTweensOf(state.currentOutlineSprite.scale);
        }

        state.letterLayer.removeChildren().forEach((child) => child.destroy());
        state.completedStrokeSprites = [];
        state.currentGuideSprite = null;
        state.currentOutlineSprite = null;
    }

    function drawBackground() {
        if (state.backgroundLayer) {
            app.stage.removeChild(state.backgroundLayer);
            state.backgroundLayer.destroy({ children: true });
        }

        const layer = new window.PIXI.Container();
        const background = new window.PIXI.Sprite(window.PIXI.Texture.from('games/003_hiragana_suisui/images/background_hiragana.png'));
        background.width = app.screen.width;
        background.height = app.screen.height;
        layer.addChild(background);
        app.stage.addChildAt(layer, 0);
        state.backgroundLayer = layer;
    }

    function drawTrace() {
        if (!state.traceLayer) {
            return;
        }

        state.traceLayer.clear();

        const strokeInfo = getCurrentStrokeInfo();
        if (!strokeInfo?.strokeMetrics || !strokeInfo.tracker) {
            return;
        }

        const { strokeMetrics, tracker } = strokeInfo;
        const pathPoints = strokeMetrics.points.slice(0, Math.max(1, tracker.currentIndex + 1));
        const targetPoint = tracker.currentPoint || strokeMetrics.startPoint;

        if (pathPoints.length > 1) {
            state.traceLayer.lineStyle(24, 0xffd05f, 0.92, 0.5, true);
            state.traceLayer.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let index = 1; index < pathPoints.length; index += 1) {
                state.traceLayer.lineTo(pathPoints[index].x, pathPoints[index].y);
            }
        }

        if (strokeMetrics.startPoint) {
            state.traceLayer.lineStyle(5, 0xffffff, 0.95);
            state.traceLayer.beginFill(0x74d67b, 0.24);
            state.traceLayer.drawCircle(strokeMetrics.startPoint.x, strokeMetrics.startPoint.y, TARGET_DOT_RADIUS + 12);
            state.traceLayer.endFill();
        }

        if (targetPoint) {
            const dotFill = tracker.completed ? 0xffcd63 : 0x5bcf68;
            state.traceLayer.lineStyle(6, 0xffffff, 0.95);
            state.traceLayer.beginFill(dotFill, 1);
            state.traceLayer.drawCircle(targetPoint.x, targetPoint.y, TARGET_DOT_RADIUS);
            state.traceLayer.endFill();
            state.traceLayer.lineStyle(3, tracker.completed ? 0xffe7b4 : 0xc9f8cf, 0.92);
            state.traceLayer.drawCircle(targetPoint.x, targetPoint.y, TARGET_DOT_RADIUS + 9);
        }
    }

    function renderLetter() {
        const letter = getCurrentLetter();
        if (!letter || !state.letterLayer) {
            return;
        }

        clearLetterSprites();
        state.currentLetterMetrics = null;

        const layout = getLetterLayout(letter);
        const outlineSprite = createSpriteFromSvg(letter.viewBox, makeOutlineBody(letter));
        positionSprite(outlineSprite, layout);
        state.letterLayer.addChild(outlineSprite);
        state.currentOutlineSprite = outlineSprite;

        for (let index = 0; index < state.currentStrokeIndex; index += 1) {
            const completedSprite = createSpriteFromSvg(letter.viewBox, makeStrokeBody(letter, index, '#ffeec0', '#ffd180'));
            positionSprite(completedSprite, layout);
            state.letterLayer.addChild(completedSprite);
            state.completedStrokeSprites.push(completedSprite);
        }

        const guideBody = makeGuideBody(letter, state.currentStrokeIndex);
        if (guideBody) {
            const guideSprite = createSpriteFromSvg(letter.viewBox, guideBody);
            positionSprite(guideSprite, layout);
            guideSprite.alpha = 0.96;
            state.letterLayer.addChild(guideSprite);
            state.currentGuideSprite = guideSprite;
            gsap.fromTo(guideSprite, { alpha: 0.55 }, {
                alpha: 1,
                duration: 0.8,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }

        updateUi();
        drawTrace();
    }

    function pauseCurrentStroke(showWarning) {
        state.tracing = false;
        drawTrace();

        if (showWarning) {
            showBanner('つづきは みどりの まるから いこう！', 'warning');
        }
    }

    function playLetterSpeech(letter) {
        if (!window.speechSynthesis || !letter?.label) {
            return;
        }

        const utterance = new SpeechSynthesisUtterance(letter.label);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.82;
        utterance.pitch = 1.08;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    async function completeLetter() {
        const letter = getCurrentLetter();
        if (!letter || state.busy) {
            return;
        }

        state.busy = true;
        seLetterComplete.play();
        playLetterSpeech(letter);

        if (state.currentOutlineSprite) {
            gsap.fromTo(state.currentOutlineSprite.scale, {
                x: state.currentOutlineSprite.scale.x * 0.95,
                y: state.currentOutlineSprite.scale.y * 1.05
            }, {
                x: state.currentOutlineSprite.scale.x,
                y: state.currentOutlineSprite.scale.y,
                duration: 0.45,
                ease: 'elastic.out(1, 0.45)'
            });
        }

        showBanner(`${letter.label} できた！`);
        await wait(850);

        state.currentLetterIndex += 1;
        state.currentStrokeIndex = 0;
        state.currentLetterMetrics = null;
        state.busy = false;

        if (state.currentLetterIndex >= state.playLetters.length) {
            await showClear();
            return;
        }

        renderLetter();
    }

    function markStrokeComplete() {
        const letter = getCurrentLetter();
        if (!letter) {
            return;
        }

        seStrokeComplete.play();
        showBanner('いいね！');
        state.currentStrokeIndex += 1;
        state.currentLetterMetrics = null;

        if (state.currentStrokeIndex >= letter.strokes.length) {
            completeLetter();
            return;
        }

        renderLetter();
    }

    function getEventPoint(event) {
        const point = event?.global;
        if (!point) {
            return null;
        }

        return { x: point.x, y: point.y };
    }

    function onPointerDown(event) {
        if (state.busy) {
            return;
        }

        const strokeInfo = getCurrentStrokeInfo();
        const point = getEventPoint(event);
        if (!strokeInfo?.tracker || !point) {
            return;
        }

        if (!strokeInfo.tracker.start(point)) {
            showBanner('みどりの まるから はじめよう！', 'warning');
            return;
        }

        state.tracing = true;
        seTraceStart.play();
        drawTrace();
    }

    function onPointerMove(event) {
        if (!state.tracing || state.busy) {
            return;
        }

        const strokeInfo = getCurrentStrokeInfo();
        const point = getEventPoint(event);
        if (!strokeInfo?.tracker || !point) {
            return;
        }

        const trackerState = strokeInfo.tracker.move(point);
        drawTrace();

        if (trackerState.completed) {
            state.tracing = false;
            markStrokeComplete();
        }
    }

    function onPointerUp() {
        if (!state.tracing || state.busy) {
            return;
        }

        const strokeInfo = getCurrentStrokeInfo();
        if (!strokeInfo?.tracker) {
            state.tracing = false;
            return;
        }

        const trackerState = strokeInfo.tracker.stop();
        if (trackerState.completed) {
            state.tracing = false;
            markStrokeComplete();
            return;
        }

        pauseCurrentStroke(true);
    }

    function resetRewardOverlay() {
        state.rewardStickerId = null;

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
        if (!overlay) {
            return;
        }

        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');

        window.setTimeout(() => {
            overlay.classList.remove('flex');
            overlay.classList.add('hidden');
            resetRewardOverlay();
        }, 500);
    }

    function handleRewardSelected(sticker, selectedButton) {
        if (state.rewardStickerId) {
            return;
        }

        state.rewardStickerId = sticker.id;
        const rewardMessage = document.getElementById('reward-message');
        const actionRow = document.getElementById('reward-action-row');
        const optionButtons = document.querySelectorAll('.reward-sticker-option');

        try {
            if (!window.EduToys?.storage) {
                throw new Error('EduToys storage is not available.');
            }

            window.EduToys.storage.awardSticker(sticker.id);
            seReward.play();
            optionButtons.forEach((button) => button.classList.remove('reward-sticker-option--selected'));
            selectedButton.classList.add('reward-sticker-option--selected');
            rewardMessage.textContent = `${sticker.name} を げっと！`;
        } catch (error) {
            console.error('Failed to award sticker:', error);
            rewardMessage.textContent = 'シールを ほぞん できなかったよ';
        }

        actionRow?.classList.remove('hidden');
    }

    async function populateRewardOptions() {
        const optionsContainer = document.getElementById('reward-sticker-options');
        const rewardMessage = document.getElementById('reward-message');
        const actionRow = document.getElementById('reward-action-row');

        resetRewardOverlay();

        if (!window.EduToys?.stickerBook) {
            rewardMessage.textContent = 'シールを よみこめなかったよ';
            actionRow?.classList.remove('hidden');
            return;
        }

        try {
            const options = await window.EduToys.stickerBook.getRewardOptions('003_hiragana_suisui', 3);

            if (!options.length) {
                rewardMessage.textContent = 'シールを よみこめなかったよ';
                actionRow?.classList.remove('hidden');
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
                optionsContainer?.appendChild(button);
            });
        } catch (error) {
            console.error('Failed to prepare reward stickers:', error);
            rewardMessage.textContent = 'シールを よみこめなかったよ';
            actionRow?.classList.remove('hidden');
        }
    }

    async function showClear() {
        state.busy = true;
        voiceClear.play();
        await populateRewardOptions();

        const overlay = document.getElementById('clear-overlay');
        if (!overlay) {
            state.busy = false;
            return;
        }

        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        window.requestAnimationFrame(() => {
            overlay.classList.remove('opacity-0');
            overlay.classList.add('opacity-100');
        });

        state.busy = false;
    }

    function selectLettersForPlay() {
        state.playLetters = letterDataApi.selectPlayLetters(state.allLetters, LETTERS_PER_PLAY);
        state.currentLetterIndex = 0;
        state.currentStrokeIndex = 0;
        state.currentLetterMetrics = null;
        state.tracing = false;
        state.busy = false;
    }

    function startRound() {
        hideOverlay();
        selectLettersForPlay();
        renderLetter();
        bgmGame.play();
        playLetterSpeech(getCurrentLetter());
    }

    function bindUiEvents() {
        document.getElementById('btn-replay')?.addEventListener('click', () => {
            seReplay.play();
            startRound();
        });

        document.getElementById('btn-open-sticker-book')?.addEventListener('click', () => {
            hideOverlay();
            if (window.EduToys?.showStickerBook) {
                window.EduToys.showStickerBook();
            }
        });
    }

    function installInteraction() {
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;
        app.stage.on('pointerdown', onPointerDown);
        app.stage.on('pointermove', onPointerMove);
        app.stage.on('pointerup', onPointerUp);
        app.stage.on('pointerupoutside', onPointerUp);
    }

    function createLayers() {
        state.letterLayer = new window.PIXI.Container();
        state.traceLayer = new window.PIXI.Graphics();
        state.overlayLayer = new window.PIXI.Container();
        app.stage.addChild(state.letterLayer);
        app.stage.addChild(state.traceLayer);
        app.stage.addChild(state.overlayLayer);
    }

    async function initGame() {
        state.allLetters = await letterDataApi.loadPlayableHiraganaData();
        drawBackground();
        createLayers();
        installInteraction();
        bindUiEvents();
        startRound();
    }

    if (app.renderer && typeof app.renderer.on === 'function') {
        app.renderer.on('resize', () => {
            drawBackground();
            renderLetter();
        });
    }

    window.EduToys.gameCleanup = () => {
        bgmGame.stop();
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        state.textureCache.clear();
    };

    initGame().catch((error) => {
        console.error('Failed to initialize 003_hiragana_suisui:', error);
    });
})();
