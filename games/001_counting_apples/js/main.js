/**
 * かずをかぞえよう - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('apple-stage');
    const counterDisplay = document.getElementById('counter');
    const finishOverlay = document.getElementById('finish-overlay');
    const basket = document.getElementById('basket');
    const instruction = document.getElementById('instruction');

    // オブジェクトのバリエーション
    const VARIATIONS = [
        { name: 'リンゴ', emoji: '🍎' },
        { name: 'イチゴ', emoji: '🍓' },
        { name: 'くるま', emoji: '🚗' },
        { name: 'ひよこ', emoji: '🐤' }
    ];

    // 音声ファイルの準備
    const bgm = new Audio('../../static/sounds/bgm/Pops_01.mp3');
    bgm.loop = true;
    bgm.volume = 0.3;

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/001_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    let currentRound = 0;
    const TOTAL_ROUNDS = 3;
    let totalItemsInRound = 0;
    let tappedCount = 0;
    let isFinished = false;
    let isTransitioning = false;
    let bgmStarted = false;

    const tryPlayBgm = () => {
        if (!bgmStarted && !isFinished) {
            bgm.play().then(() => {
                bgmStarted = true;
                document.body.removeEventListener('click', tryPlayBgm);
                document.body.removeEventListener('touchstart', tryPlayBgm);
            }).catch(e => console.log('BGM wait'));
        }
    };

    document.body.addEventListener('click', tryPlayBgm);
    document.body.addEventListener('touchstart', tryPlayBgm, { passive: true });

    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
        }
    };
    setTimeout(playIntro, 500);

    async function initRound() {
        isTransitioning = false;
        tappedCount = 0;
        counterDisplay.textContent = tappedCount;
        stage.innerHTML = '';
        
        const itemType = VARIATIONS[Math.floor(Math.random() * VARIATIONS.length)];
        totalItemsInRound = Math.floor(Math.random() * 3) + 3; // 3〜5個
        
        instruction.textContent = `${itemType.name}を タップ してね！ (${currentRound + 1}/${TOTAL_ROUNDS})`;

        for (let i = 0; i < totalItemsInRound; i++) {
            createItem(itemType.emoji);
            await new Promise(r => setTimeout(r, 200));
        }
    }

    function createItem(emoji) {
        const item = document.createElement('div');
        item.className = 'item absolute cursor-pointer select-none text-7xl transition-all duration-700 ease-in-out scale-0 animate-bounce';
        item.innerHTML = emoji;

        // ランダムな位置に配置
        const x = Math.random() * 70 + 15;
        const y = Math.random() * 50 + 15;
        item.style.left = `${x}%`;
        item.style.top = `${y}%`;
        item.dataset.tapped = 'false';

        item.addEventListener('click', () => handleTap(item));
        item.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTap(item);
        }, { passive: false });

        stage.appendChild(item);
        setTimeout(() => item.classList.remove('scale-0'), 50);
    }

    function handleTap(item) {
        if (isFinished || isTransitioning || item.dataset.tapped === 'true') return;

        tappedCount++;
        counterDisplay.textContent = tappedCount;

        // 数え上げ音声を再生
        const countVoice = new Audio(`../../static/sounds/voice/num_${tappedCount}.mp3`);
        countVoice.play().catch(e=>{});

        item.dataset.tapped = 'true';
        item.classList.remove('animate-bounce');

        // カゴへ移動する演出
        const basketRect = basket.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();

        item.style.left = `${itemRect.left - stageRect.left}px`;
        item.style.top = `${itemRect.top - stageRect.top}px`;
        item.style.position = 'absolute';

        setTimeout(() => {
            const targetX = basketRect.left - stageRect.left + (basketRect.width / 4);
            const targetY = basketRect.top - stageRect.top;
            item.style.left = `${targetX}px`;
            item.style.top = `${targetY}px`;
            item.style.transform = 'scale(0.2) rotate(20deg)';
            item.style.opacity = '0';
        }, 10);

        basket.classList.add('scale-125');
        setTimeout(() => basket.classList.remove('scale-125'), 200);

        showNumberAt(itemRect, tappedCount);

        if (tappedCount === totalItemsInRound) {
            completeRound();
        }
    }

    function showNumberAt(rect, numberToShow) {
        const stageRect = stage.getBoundingClientRect();
        const num = document.createElement('div');
        num.className = 'absolute text-5xl font-black text-orange-500 animate-bounce z-50 pointer-events-none drop-shadow-md';
        num.textContent = numberToShow;
        num.style.left = `${rect.left - stageRect.left}px`;
        num.style.top = `${rect.top - stageRect.top - 40}px`;
        stage.appendChild(num);
        setTimeout(() => num.remove(), 1000);
    }

    function completeRound() {
        isTransitioning = true;
        
        setTimeout(() => {
            const finalCountVoice = new Audio(`../../static/sounds/voice/num_${totalItemsInRound}.mp3`);
            finalCountVoice.play().catch(e=>{});
            GameUtils.showHanamaru();
        }, 800);

        setTimeout(() => {
            currentRound++;
            if (currentRound < TOTAL_ROUNDS) {
                initRound();
            } else {
                finishGame();
            }
        }, 2500);
    }

    function finishGame() {
        isFinished = true;
        setTimeout(() => {
            soundClear.play().catch(e => {});
            soundClearVoice.play().catch(e => {});
        }, 300);

        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            soundSelectSticker.play().catch(e=>{});
            setupStickers();
        }, 1500);
    }

    function setupStickers() {
        if (!window.StickerSystem) return;
        const choicesContainer = document.getElementById('sticker-choices');
        choicesContainer.innerHTML = '';
        const selectionArea = document.getElementById('sticker-selection');
        const afterSelection = document.getElementById('after-selection');
        
        StickerSystem.drawThree().forEach((sticker) => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white`;
            btn.innerHTML = `<div class="text-6xl mb-2">${sticker.item}</div><div class="text-sm font-bold">${sticker.data.label}</div>`;
            btn.addEventListener('click', () => {
                soundSelect.play().catch(e => {});
                StickerSystem.saveSticker(sticker);
                selectionArea.classList.add('hidden');
                afterSelection.classList.remove('hidden');
            });
            choicesContainer.appendChild(btn);
        });
    }

    initRound();
});
