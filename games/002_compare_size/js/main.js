document.addEventListener('DOMContentLoaded', () => {
    const itemLeft = document.getElementById('item-left');
    const itemRight = document.getElementById('item-right');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');

    const EMOJIS = ['🐘', '🍎', '🐶', '🚗', '🍓', '🐱', '⚽', '🧸'];
    let isFinished = false;

    function init() {
        const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        // ランダムにどちらを大きくするか決定 (0: 左, 1: 右)
        const isLeftBigger = Math.random() < 0.5;

        itemLeft.innerHTML = `<div class="${isLeftBigger ? 'text-9xl' : 'text-5xl'} transition-all">${emoji}</div>`;
        itemRight.innerHTML = `<div class="${!isLeftBigger ? 'text-9xl' : 'text-5xl'} transition-all">${emoji}</div>`;

        // イベントリスナーの登録
        itemLeft.onclick = () => handleTap(isLeftBigger, itemLeft);
        itemRight.onclick = () => handleTap(!isLeftBigger, itemRight);
    }

    function handleTap(isCorrect, element) {
        if (isFinished) return;

        if (isCorrect) {
            // 正解
            soundTap.currentTime = 0;
            soundTap.play().catch(e=>{});
            element.classList.add('scale-150', 'opacity-0');
            isFinished = true;
            setTimeout(finishGame, 500);
        } else {
            // 不正解
            soundError.currentTime = 0;
            soundError.play().catch(e=>{});
            element.classList.add('opacity-50', 'scale-90'); // 責めないように少し小さく・半透明になる
            setTimeout(() => element.classList.remove('opacity-50', 'scale-90'), 800);
        }
    }
    
    function finishGame() {
        setTimeout(() => soundClear.play().catch(e=>{}), 300);
        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 800);
    }

    function setupStickers() {
        if (!window.StickerSystem) return;
        const choices = document.getElementById('sticker-choices');
        const selectionArea = document.getElementById('sticker-selection');
        const afterSelection = document.getElementById('after-selection');
        StickerSystem.drawThree().forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white`;
            btn.innerHTML = `<div class="text-6xl mb-2">${sticker.item}</div><div class="text-sm font-bold">${sticker.data.label}</div>`;
            btn.addEventListener('click', () => {
                soundSelect.currentTime = 0;
                soundSelect.play().catch(e=>{});
                StickerSystem.saveSticker(sticker);
                selectionArea.classList.add('hidden');
                afterSelection.classList.remove('hidden');
            });
            choices.appendChild(btn);
        });
    }

    init();
});