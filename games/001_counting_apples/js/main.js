/**
 * かずをかぞえよう - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('apple-stage');
    const counterDisplay = document.getElementById('counter');
    const finishOverlay = document.getElementById('finish-overlay');

    const TOTAL_APPLES = 5; // 幼児向けに5個程度から開始
    let tappedCount = 0;
    let isFinished = false;

    // リンゴの生成と配置
    function init() {
        for (let i = 0; i < TOTAL_APPLES; i++) {
            createApple(i);
        }
    }

    function createApple(id) {
        const apple = document.createElement('div');
        apple.className = 'apple absolute cursor-pointer select-none text-6xl transition-transform active:scale-110';
        apple.innerHTML = '🍎';
        
        // ランダムな位置に配置 (ヘッダーとフッターを避ける)
        const x = Math.random() * 80 + 10; // 10% to 90%
        const y = Math.random() * 60 + 20; // 20% to 80%
        apple.style.left = `${x}%`;
        apple.style.top = `${y}%`;

        apple.dataset.tapped = 'false';

        apple.addEventListener('click', () => handleTap(apple));
        apple.addEventListener('touchstart', (e) => {
            e.preventDefault(); // タッチデバイスの遅延防止
            handleTap(apple);
        }, { passive: false });

        stage.appendChild(apple);
    }

    function handleTap(apple) {
        if (isFinished || apple.dataset.tapped === 'true') return;

        apple.dataset.tapped = 'true';
        apple.classList.add('opacity-50', 'scale-75', 'rotate-12');
        
        // タップした瞬間に数字を表示するアニメーション
        showNumberAt(apple);

        tappedCount++;
        counterDisplay.textContent = tappedCount;

        if (tappedCount === TOTAL_APPLES) {
            finishGame();
        }
    }

    function showNumberAt(apple) {
        const num = document.createElement('div');
        num.className = 'absolute text-4xl font-black text-orange-500 animate-number-up pointer-events-none';
        num.textContent = tappedCount + 1;
        num.style.left = apple.style.left;
        num.style.top = apple.style.top;
        stage.appendChild(num);

        setTimeout(() => num.remove(), 1000);
    }

    function finishGame() {
        isFinished = true;
        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 800);
    }

    function setupStickers() {
        if (!window.StickerSystem) return; // テスト環境等のフォールバック
        
        const choicesContainer = document.getElementById('sticker-choices');
        const selectionArea = document.getElementById('sticker-selection');
        const afterSelection = document.getElementById('after-selection');
        
        const drawnStickers = StickerSystem.drawThree();
        
        drawnStickers.forEach((sticker) => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white`;
            btn.innerHTML = `
                <div class="text-6xl mb-2 drop-shadow-sm">${sticker.item}</div>
                <div class="text-sm font-bold">${sticker.data.label}</div>
            `;
            
            btn.addEventListener('click', () => {
                StickerSystem.saveSticker(sticker);
                selectionArea.classList.add('hidden');
                afterSelection.classList.remove('hidden');
            });
            
            choicesContainer.appendChild(btn);
        });
    }

    init();
});
