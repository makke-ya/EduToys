/**
 * かずをかぞえよう - main.js
 */

(() => {
    const init = () => {
        const stage = document.getElementById('apple-stage');
        const counterDisplay = document.getElementById('counter');
        const finishOverlay = document.getElementById('finish-overlay');
        const basket = document.getElementById('basket');
        const instruction = document.getElementById('instruction');

        if (!stage) return; // コンテンツがまだロードされていない場合は中断

        // SVGイラストのバリエーション
        const VARIATIONS = [
            {
                name: 'りんご',
                svg: `<svg viewBox="0 0 64 64" class="svg-item"><ellipse cx="32" cy="38" rx="22" ry="22" fill="#e53935"/><ellipse cx="32" cy="38" rx="22" ry="22" fill="url(#apple-shine)" opacity="0.3"/><path d="M32,16 Q30,8 24,6" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="28" cy="12" rx="6" ry="4" fill="#66bb6a" transform="rotate(-30,28,12)"/><defs><radialGradient id="apple-shine" cx="40%" cy="35%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>`
            },
            {
                name: 'いちご',
                svg: `<svg viewBox="0 0 64 64" class="svg-item"><path d="M32,14 Q18,22 16,40 Q16,56 32,58 Q48,56 48,40 Q46,22 32,14Z" fill="#e53935"/><path d="M32,14 Q18,22 16,40 Q16,56 32,58 Q48,56 48,40 Q46,22 32,14Z" fill="url(#berry-shine)" opacity="0.25"/><circle cx="26" cy="30" r="1.2" fill="#ffcdd2"/><circle cx="38" cy="30" r="1.2" fill="#ffcdd2"/><circle cx="32" cy="38" r="1.2" fill="#ffcdd2"/><circle cx="24" cy="42" r="1.2" fill="#ffcdd2"/><circle cx="40" cy="42" r="1.2" fill="#ffcdd2"/><circle cx="32" cy="48" r="1.2" fill="#ffcdd2"/><path d="M26,14 L32,18 L38,14" stroke="#66bb6a" stroke-width="3" fill="#66bb6a" stroke-linejoin="round"/><defs><radialGradient id="berry-shine" cx="35%" cy="30%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>`
            },
            {
                name: 'くるま',
                svg: `<svg viewBox="0 0 80 56" class="svg-item"><rect x="8" y="20" width="64" height="24" rx="8" fill="#1e88e5"/><path d="M20,20 L28,6 L52,6 L60,20" fill="#42a5f5"/><rect x="30" y="8" width="20" height="12" rx="2" fill="#bbdefb" opacity="0.7"/><circle cx="22" cy="44" r="8" fill="#424242"/><circle cx="22" cy="44" r="4" fill="#757575"/><circle cx="58" cy="44" r="8" fill="#424242"/><circle cx="58" cy="44" r="4" fill="#757575"/><rect x="62" y="26" width="8" height="4" rx="2" fill="#ffee58"/></svg>`
            },
            {
                name: 'ひよこ',
                svg: `<svg viewBox="0 0 64 64" class="svg-item"><ellipse cx="32" cy="38" rx="20" ry="20" fill="#fdd835"/><ellipse cx="32" cy="38" rx="20" ry="20" fill="url(#chick-shine)" opacity="0.25"/><circle cx="24" cy="32" r="3" fill="#4e342e"/><circle cx="40" cy="32" r="3" fill="#4e342e"/><circle cx="24.5" cy="31" r="1" fill="white"/><circle cx="40.5" cy="31" r="1" fill="white"/><path d="M30,38 L32,42 L34,38" fill="#ff8f00" stroke="#ff8f00" stroke-width="1" stroke-linejoin="round"/><path d="M28,14 Q32,6 36,14" fill="#fdd835" stroke="#fbc02d" stroke-width="1.5"/><path d="M14,42 Q6,40 10,48" fill="#fdd835" stroke="#fbc02d" stroke-width="1.5"/><path d="M50,42 Q58,40 54,48" fill="#fdd835" stroke="#fbc02d" stroke-width="1.5"/><defs><radialGradient id="chick-shine" cx="40%" cy="30%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>`
            }
        ];

        // 音声ファイルの準備 (パスをルート相対に変更)
        const bgm = new Audio('static/sounds/bgm/Pops_01.mp3');
        bgm.loop = true;
        bgm.volume = 0.3;

        const soundTap = new Audio('static/sounds/staging/短い音-ポヨン.mp3');
        const soundClear = new Audio('static/sounds/staging/ジャジャーン1.mp3');
        const soundSelect = new Audio('static/sounds/system/決定10.mp3');
        const soundIntro = new Audio('static/sounds/voice/001_intro.mp3');
        const soundClearVoice = new Audio('static/sounds/voice/clear.mp3');
        const soundSelectSticker = new Audio('static/sounds/voice/select_sticker.mp3');

        let currentRound = 0;
        const TOTAL_ROUNDS = 3;
        let totalItemsInRound = 0;
        let tappedCount = 0;
        let isFinished = false;
        let isTransitioning = false;

        // SPA方式なので、読み込み直後にBGMを鳴らせる
        bgm.play().catch(e => console.log('BGM auto-play wait'));
        soundIntro.play().catch(e => {});

        async function initRound() {
            isTransitioning = false;
            tappedCount = 0;
            counterDisplay.textContent = tappedCount;
            stage.innerHTML = '';
            
            const itemType = VARIATIONS[Math.floor(Math.random() * VARIATIONS.length)];
            totalItemsInRound = Math.floor(Math.random() * 3) + 3; // 3〜5個
            
            instruction.textContent = `${itemType.name}を タップ してね！ (${currentRound + 1}/${TOTAL_ROUNDS})`;

            for (let i = 0; i < totalItemsInRound; i++) {
                createItem(itemType.svg);
                await new Promise(r => setTimeout(r, 200));
            }
        }

        function createItem(svgMarkup) {
            const item = document.createElement('div');
            item.className = 'item absolute cursor-pointer select-none transition-all duration-700 ease-in-out scale-0 animate-bounce hover:scale-110 drop-shadow-md';
            item.innerHTML = svgMarkup;

            const x = Math.random() * 40 + 20;
            const y = Math.random() * 40 + 20;
            item.style.left = `${x}%`;
            item.style.top = `${y}%`;
            item.dataset.tapped = 'false';

            const tapHandler = (e) => {
                if (e.cancelable) e.preventDefault();
                handleTap(item);
            };
            item.addEventListener('click', tapHandler);
            item.addEventListener('touchstart', tapHandler, { passive: false });

            stage.appendChild(item);
            setTimeout(() => item.classList.remove('scale-0'), 50);
        }

        function handleTap(item) {
            if (isFinished || isTransitioning || item.dataset.tapped === 'true') return;

            tappedCount++;
            counterDisplay.textContent = tappedCount;

            soundTap.currentTime = 0;
            soundTap.play().catch(e=>{});

            const countVoice = new Audio(`static/sounds/voice/num_${tappedCount}.mp3`);
            countVoice.play().catch(e=>{});

            item.dataset.tapped = 'true';
            item.classList.remove('animate-bounce', 'hover:scale-110');

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
            num.className = 'absolute text-5xl md:text-6xl font-black animate-bounce z-50 pointer-events-none drop-shadow-md';
            num.style.color = 'var(--theme-color)';
            num.textContent = numberToShow;
            num.style.left = `${rect.left - stageRect.left}px`;
            num.style.top = `${rect.top - stageRect.top - 40}px`;
            stage.appendChild(num);
            setTimeout(() => num.remove(), 1000);
        }

        function completeRound() {
            isTransitioning = true;
            
            setTimeout(() => {
                const finalCountVoice = new Audio(`static/sounds/voice/num_${totalItemsInRound}.mp3`);
                finalCountVoice.play().catch(e=>{});
                try {
                    GameUtils.showHanamaru('game-container');
                } catch (e) { console.error(e); }
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
                finishOverlay.classList.add('show');
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
                btn.className = `sticker-btn ${sticker.data.color}`;
                btn.innerHTML = `<div class="text-5xl md:text-7xl mb-2 md:mb-4">${sticker.item}</div><div class="text-sm md:text-lg font-black" style="color:var(--color-text);">${sticker.data.label}</div>`;
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
    };

    // 読み込み方法に応じた起動
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
