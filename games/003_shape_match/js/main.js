document.addEventListener('DOMContentLoaded', () => {
    const silhouette = document.getElementById('silhouette');
    const choicesContainer = document.getElementById('choices');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');

    const SHAPES = ['🔺', '🟩', '🔵', '⭐', '❤️', '🌙', '🔷'];
    let isFinished = false;

    function init() {
        // 問題の形を決定
        const correctAnswer = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        
        // シルエットに設定
        silhouette.innerHTML = correctAnswer;
        
        // 選択肢を3つ生成 (正解 + ダミー2つ)
        const currentChoices = [correctAnswer];
        while (currentChoices.length < 3) {
            const dummy = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            if (!currentChoices.includes(dummy)) {
                currentChoices.push(dummy);
            }
        }
        
        // シャッフル
        currentChoices.sort(() => Math.random() - 0.5);

        // ボタンの生成
        choicesContainer.innerHTML = '';
        currentChoices.forEach(shape => {
            const btn = document.createElement('button');
            btn.className = 'text-7xl p-4 bg-gray-100 rounded-3xl shadow-sm border-4 border-gray-200 hover:scale-110 hover:border-yellow-400 transition-all active:scale-95';
            btn.innerHTML = shape;
            btn.onclick = () => handleTap(shape === correctAnswer, btn, correctAnswer);
            choicesContainer.appendChild(btn);
        });
    }

    function handleTap(isCorrect, btn, correctAnswer) {
        if (isFinished) return;

        if (isCorrect) {
            soundTap.currentTime = 0;
            soundTap.play().catch(e=>{});
            // 影に色をつけて正解を演出
            silhouette.classList.remove('filter', 'brightness-0', 'opacity-30');
            silhouette.classList.add('scale-125', 'transition-transform');
            btn.classList.add('opacity-0');
            isFinished = true;
            setTimeout(finishGame, 800);
        } else {
            soundError.currentTime = 0;
            soundError.play().catch(e=>{});
            btn.classList.add('opacity-50', 'scale-95');
            setTimeout(() => btn.classList.remove('opacity-50', 'scale-95'), 800);
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