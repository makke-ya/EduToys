/**
 * どっちがおおい？ - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const itemLeft = document.getElementById('item-left');
    const itemRight = document.getElementById('item-right');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/002_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const EMOJIS = ['🍎', '🍓', '🚗', '🐶', '⚽', '🍬', '🐤', '🦒'];
    let isFinished = false;

    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
        }
    };
    setTimeout(playIntro, 500);

    function init() {
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        
        // モードをランダムに決定 (0: グリッド, 1: ランダム)
        const mode = Math.random() > 0.5 ? 'grid' : 'random';

        // 個数を決定
        const counts = [
            Math.floor(Math.random() * 3) + 1, // 1-3
            Math.floor(Math.random() * 4) + 6  // 6-9
        ].sort(() => Math.random() - 0.5);

        const countLeft = counts[0];
        const countRight = counts[1];
        const isLeftBigger = countLeft > countRight;

        renderItems(itemLeft, emoji, countLeft, mode);
        renderItems(itemRight, emoji, countRight, mode);

        itemLeft.onclick = () => handleTap(isLeftBigger, itemLeft);
        itemRight.onclick = () => handleTap(!isLeftBigger, itemRight);
    }

    function renderItems(container, emoji, count, mode) {
        container.innerHTML = '';
        container.className = 'relative w-full h-full min-h-[200px] flex items-center justify-center p-4 rounded-3xl border-4 border-transparent transition-all duration-300';
        
        if (mode === 'grid') {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-3 gap-3 pointer-events-none';
            for (let i = 0; i < count; i++) {
                const span = document.createElement('span');
                span.className = 'text-5xl drop-shadow-sm animate-bounce';
                span.style.animationDelay = `${i * 0.1}s`;
                span.textContent = emoji;
                grid.appendChild(span);
            }
            container.appendChild(grid);
        } else {
            // ランダム配置モード
            const wrapper = document.createElement('div');
            wrapper.className = 'absolute inset-0 pointer-events-none';
            for (let i = 0; i < count; i++) {
                const span = document.createElement('span');
                span.className = 'absolute text-5xl drop-shadow-sm animate-bounce';
                span.style.left = `${Math.random() * 70 + 10}%`;
                span.style.top = `${Math.random() * 70 + 10}%`;
                span.style.animationDelay = `${i * 0.1}s`;
                span.textContent = emoji;
                wrapper.appendChild(span);
            }
            container.appendChild(wrapper);
        }
    }

    function handleTap(isCorrect, element) {
        if (isFinished) return;

        if (isCorrect) {
            isFinished = true;
            soundTap.currentTime = 0;
            soundTap.play().catch(e=>{});
            
            // 正解演出: 太い枠線と背景色
            element.classList.add('bg-yellow-100', 'border-orange-500', 'scale-105', 'z-10');
            
            // 全てのアイテムをさらに跳ねさせる
            element.querySelectorAll('span').forEach(s => {
                s.classList.add('scale-125');
            });
            
            setTimeout(finishGame, 1500);
        } else {
            soundError.currentTime = 0;
            soundError.play().catch(e=>{});
            GameUtils.shakeElement(element);
        }
    }
    
    function finishGame() {
        GameUtils.showHanamaru();
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
        StickerSystem.drawThree().forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white`;
            btn.innerHTML = `<div class="text-6xl mb-2">${sticker.item}</div><div class="text-sm font-bold">${sticker.data.label}</div>`;
            btn.addEventListener('click', () => {
                soundSelect.play().catch(e=>{});
                StickerSystem.saveSticker(sticker);
                document.getElementById('sticker-selection').classList.add('hidden');
                document.getElementById('after-selection').classList.remove('hidden');
            });
            choices.appendChild(btn);
        });
    }

    init();
});
