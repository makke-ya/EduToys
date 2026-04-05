/**
 * どっちがおおい？ - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const itemLeft = document.getElementById('item-left');
    const itemRight = document.getElementById('item-right');
    const finishOverlay = document.getElementById('finish-overlay');
    const instruction = document.querySelector('h1#instruction'); // start.htmlにid="instruction"があると仮定

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundCorrect = new Audio('../../static/sounds/system/正解1.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定10.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/002_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const EMOJIS = ['🍎', '🍓', '🚗', '🐶', '⚽', '🍬', '🐤', '🦒'];
    let currentRound = 0;
    const TOTAL_ROUNDS = 3;
    let isFinished = false;
    let isTransitioning = false;

    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
        }
    };
    document.body.addEventListener('click', playIntro, { once: true });
    setTimeout(playIntro, 500);

    function initRound() {
        isTransitioning = false;
        
        // Remove success states
        itemLeft.classList.remove('bg-yellow-200', 'border-orange-500', 'scale-110', 'z-10', 'shadow-2xl');
        itemRight.classList.remove('bg-yellow-200', 'border-orange-500', 'scale-110', 'z-10', 'shadow-2xl');
        
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        
        // ヘッダーの更新
        if (instruction) {
            instruction.textContent = `どっちが おおいかな？ (${currentRound + 1}/${TOTAL_ROUNDS})`;
        }

        // モードをランダムに決定
        const mode = Math.random() > 0.5 ? 'grid' : 'random';

        // 個数を決定 (差を2以上にして分かりやすくする)
        let c1 = Math.floor(Math.random() * 4) + 1; // 1-4
        let c2 = Math.floor(Math.random() * 4) + 6; // 6-9
        const counts = [c1, c2].sort(() => Math.random() - 0.5);

        const countLeft = counts[0];
        const countRight = counts[1];
        const isLeftBigger = countLeft > countRight;

        renderItems(itemLeft, emoji, countLeft, mode);
        renderItems(itemRight, emoji, countRight, mode);

        itemLeft.onclick = () => handleTap(isLeftBigger, itemLeft);
        itemRight.onclick = () => handleTap(!isLeftBigger, itemRight);
    }

    function renderItems(container, emoji, count, mode) {
        // Only remove the inner grid/wrapper, keep the tailwind classes intact
        container.innerHTML = '';
        if (mode === 'grid') {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-3 gap-4 pointer-events-none w-full h-full content-center justify-items-center p-2';
            for (let i = 0; i < count; i++) {
                const span = document.createElement('span');
                span.className = 'text-6xl drop-shadow-md animate-bounce';
                span.style.animationDelay = `${i * 0.1}s`;
                span.textContent = emoji;
                grid.appendChild(span);
            }
            container.appendChild(grid);
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'absolute inset-0 pointer-events-none p-6';
            for (let i = 0; i < count; i++) {
                const span = document.createElement('span');
                span.className = 'absolute text-6xl drop-shadow-md animate-bounce';
                span.style.left = `${Math.random() * 60 + 10}%`;
                span.style.top = `${Math.random() * 60 + 10}%`;
                span.style.animationDelay = `${i * 0.1}s`;
                span.textContent = emoji;
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
            
            element.classList.add('bg-yellow-200', 'border-orange-500', 'scale-110', 'z-10', 'shadow-2xl');
            element.querySelectorAll('span').forEach(s => s.classList.add('scale-125', 'transition-transform'));
            
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
            finishOverlay.classList.remove('hidden');
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
            btn.className = `flex flex-col items-center justify-center p-8 rounded-[40px] border-4 ${sticker.data.color} shadow-2xl hover:scale-110 transition-transform bg-white/90`;
            btn.innerHTML = `<div class="text-7xl mb-4">${sticker.item}</div><div class="text-lg font-black text-gray-800">${sticker.data.label}</div>`;
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
});
