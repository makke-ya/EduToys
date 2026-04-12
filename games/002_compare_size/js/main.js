/**
 * どっちがおおい？ - main.js
 */

(() => {
    const init = () => {
        const itemLeft = document.getElementById('item-left');
        const itemRight = document.getElementById('item-right');
        const finishOverlay = document.getElementById('finish-overlay');
        const instruction = document.querySelector('h1#instruction');

        if (!itemLeft) return;

        const soundTap = new Audio('static/sounds/staging/短い音-ポヨン.mp3');
        const soundCorrect = new Audio('static/sounds/system/正解1.mp3');
        const soundClear = new Audio('static/sounds/staging/ジャジャーン1.mp3');
        const soundSelect = new Audio('static/sounds/system/決定10.mp3');
        const soundError = new Audio('static/sounds/staging/短い音-ズッコケ.mp3');
        const soundIntro = new Audio('static/sounds/voice/002_intro.mp3');
        const soundClearVoice = new Audio('static/sounds/voice/clear.mp3');
        const soundSelectSticker = new Audio('static/sounds/voice/select_sticker.mp3');

        // SVGイラストのバリエーション
        const ITEMS = [
            // りんご
            `<svg viewBox="0 0 48 48" class="svg-item"><ellipse cx="24" cy="28" rx="16" ry="16" fill="#e53935"/><ellipse cx="24" cy="28" rx="16" ry="16" fill="url(#as1)" opacity="0.25"/><path d="M24,12 Q22,6 18,4" stroke="#5d4037" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="21" cy="9" rx="4" ry="3" fill="#66bb6a" transform="rotate(-30,21,9)"/><defs><radialGradient id="as1" cx="38%" cy="32%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>`,
            // いちご
            `<svg viewBox="0 0 48 48" class="svg-item"><path d="M24,10 Q14,16 12,30 Q12,42 24,44 Q36,42 36,30 Q34,16 24,10Z" fill="#e53935"/><circle cx="20" cy="24" r="1" fill="#ffcdd2"/><circle cx="28" cy="24" r="1" fill="#ffcdd2"/><circle cx="24" cy="30" r="1" fill="#ffcdd2"/><circle cx="20" cy="34" r="1" fill="#ffcdd2"/><circle cx="28" cy="34" r="1" fill="#ffcdd2"/><path d="M20,10 L24,14 L28,10" stroke="#66bb6a" stroke-width="2.5" fill="#66bb6a" stroke-linejoin="round"/></svg>`,
            // ひよこ
            `<svg viewBox="0 0 48 48" class="svg-item"><ellipse cx="24" cy="28" rx="15" ry="15" fill="#fdd835"/><circle cx="18" cy="24" r="2.5" fill="#4e342e"/><circle cx="30" cy="24" r="2.5" fill="#4e342e"/><circle cx="18.8" cy="23.2" r="0.8" fill="white"/><circle cx="30.8" cy="23.2" r="0.8" fill="white"/><path d="M22,30 L24,34 L26,30" fill="#ff8f00" stroke="#ff8f00" stroke-width="0.8" stroke-linejoin="round"/><path d="M21,12 Q24,6 27,12" fill="#fdd835" stroke="#fbc02d" stroke-width="1.2"/></svg>`,
            // サッカーボール
            `<svg viewBox="0 0 48 48" class="svg-item"><circle cx="24" cy="24" r="18" fill="white" stroke="#424242" stroke-width="1.5"/><path d="M24,6 L20,16 L28,16Z M24,42 L20,32 L28,32Z M6,20 L14,16 L14,24Z M42,20 L34,16 L34,24Z M6,28 L14,32 L14,24Z M42,28 L34,32 L34,24Z" fill="#424242" opacity="0.8"/></svg>`,
            // キャンディ
            `<svg viewBox="0 0 48 48" class="svg-item"><circle cx="24" cy="22" r="14" fill="#f06292"/><circle cx="24" cy="22" r="14" fill="url(#cd1)" opacity="0.2"/><path d="M18,22 Q21,16 24,22 Q27,28 30,22" fill="none" stroke="#f8bbd0" stroke-width="2.5"/><path d="M24,36 L22,46" stroke="#8d6e63" stroke-width="3" stroke-linecap="round"/><defs><radialGradient id="cd1" cx="35%" cy="30%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>`,
            // くるま
            `<svg viewBox="0 0 56 40" class="svg-item"><rect x="6" y="14" width="44" height="18" rx="6" fill="#1e88e5"/><path d="M14,14 L20,4 L36,4 L42,14" fill="#42a5f5"/><rect x="22" y="6" width="12" height="8" rx="2" fill="#bbdefb" opacity="0.6"/><circle cx="16" cy="32" r="5.5" fill="#424242"/><circle cx="16" cy="32" r="2.5" fill="#757575"/><circle cx="40" cy="32" r="5.5" fill="#424242"/><circle cx="40" cy="32" r="2.5" fill="#757575"/></svg>`
        ];

        let currentRound = 0;
        const TOTAL_ROUNDS = 3;
        let isFinished = false;
        let isTransitioning = false;

        soundIntro.play().catch(e=>{});

        function initRound() {
            isTransitioning = false;
            
            itemLeft.classList.remove('correct-highlight');
            itemRight.classList.remove('correct-highlight');
            
            const svgMarkup = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            
            if (instruction) {
                instruction.textContent = `どっちが おおいかな？ (${currentRound + 1}/${TOTAL_ROUNDS})`;
            }

            const mode = Math.random() > 0.5 ? 'grid' : 'random';
            let c1 = Math.floor(Math.random() * 4) + 1; // 1-4
            let c2 = Math.floor(Math.random() * 4) + 6; // 6-9
            const counts = [c1, c2].sort(() => Math.random() - 0.5);

            const countLeft = counts[0];
            const countRight = counts[1];
            const isLeftBigger = countLeft > countRight;

            renderItems(itemLeft, svgMarkup, countLeft, mode);
            renderItems(itemRight, svgMarkup, countRight, mode);

            itemLeft.onclick = () => handleTap(isLeftBigger, itemLeft);
            itemRight.onclick = () => handleTap(!isLeftBigger, itemRight);
        }

        function renderItems(container, svgMarkup, count, mode) {
            container.innerHTML = '';
            if (mode === 'grid') {
                const grid = document.createElement('div');
                grid.className = 'grid grid-cols-3 gap-2 md:gap-3 pointer-events-none w-full h-full content-center justify-items-center p-1 md:p-2';
                for (let i = 0; i < count; i++) {
                    const span = document.createElement('span');
                    span.className = 'drop-shadow-md animate-bounce';
                    span.style.animationDelay = `${i * 0.1}s`;
                    span.innerHTML = svgMarkup;
                    grid.appendChild(span);
                }
                container.appendChild(grid);
            } else {
                const wrapper = document.createElement('div');
                wrapper.className = 'absolute inset-0 pointer-events-none p-4';
                for (let i = 0; i < count; i++) {
                    const span = document.createElement('span');
                    span.className = 'absolute drop-shadow-md animate-bounce';
                    span.style.left = `${Math.random() * 50 + 10}%`;
                    span.style.top = `${Math.random() * 50 + 10}%`;
                    span.style.animationDelay = `${i * 0.1}s`;
                    span.innerHTML = svgMarkup;
                    wrapper.appendChild(span);
                }
                container.appendChild(wrapper);
            }
        }

        function handleTap(isCorrect, element) {
            if (isFinished || isTransitioning) return;

            if (isCorrect) {
                isTransitioning = true;
                soundCorrect.currentTime = 0;
                soundCorrect.play().catch(e=>{});
                
                element.classList.add('correct-highlight');
                
                try {
                    GameUtils.showHanamaru('game-container');
                } catch (e) { console.error(e); }

                setTimeout(() => {
                    currentRound++;
                    if (currentRound < TOTAL_ROUNDS) {
                        initRound();
                    } else {
                        finishGame();
                    }
                }, 2000);
            } else {
                soundError.currentTime = 0;
                soundError.play().catch(e=>{});
                GameUtils.shakeElement(element);
            }
        }
        
        function finishGame() {
            isFinished = true;
            setTimeout(() => {
                soundClear.play().catch(e=>{});
                soundClearVoice.play().catch(e=>{});
            }, 300);
            setTimeout(() => {
                finishOverlay.classList.add('show');
                soundSelectSticker.play().catch(e=>{});
                setupStickers();
            }, 800);
        }

        function setupStickers() {
            if (!window.StickerSystem) return;
            const choices = document.getElementById('sticker-choices');
            choices.innerHTML = '';
            StickerSystem.drawThree().forEach(sticker => {
                const btn = document.createElement('button');
                btn.className = `sticker-btn ${sticker.data.color}`;
                btn.innerHTML = `<div class="text-5xl md:text-7xl mb-2 md:mb-4">${sticker.item}</div><div class="text-sm md:text-lg font-black" style="color:var(--color-text);">${sticker.data.label}</div>`;
                btn.addEventListener('click', () => {
                    soundSelect.play().catch(e=>{});
                    StickerSystem.saveSticker(sticker);
                    document.getElementById('sticker-selection').classList.add('hidden');
                    document.getElementById('after-selection').classList.remove('hidden');
                });
                choices.appendChild(btn);
            });
        }

        initRound();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
