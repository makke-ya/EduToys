document.addEventListener('DOMContentLoaded', () => {
    const patternRow = document.getElementById('pattern-row');
    const choicesContainer = document.getElementById('choices');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');

    const soundIntro = new Audio('../../static/sounds/voice/007_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const ITEMS = ['🍎', '🍌', '🚗', '🚌', '🐶', '🐱', '⭐', '🌙'];
    let isFinished = false;
    let correctAnswer = '';

    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
            document.body.removeEventListener('click', playIntro);
            document.body.removeEventListener('touchstart', playIntro);
        }
    };
    document.body.addEventListener('click', playIntro);
    document.body.addEventListener('touchstart', playIntro, { passive: true });
    setTimeout(playIntro, 100);

    function init() {
        // パターンの元となる2つを選ぶ
        const itemA = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        let itemB = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        while (itemB === itemA) itemB = ITEMS[Math.floor(Math.random() * ITEMS.length)];

        const pattern = [itemA, itemB, itemA, itemB];
        correctAnswer = itemA;

        patternRow.innerHTML = '';
        pattern.forEach(item => {
            const div = document.createElement('div');
            div.className = 'text-7xl bg-white p-2 rounded-2xl shadow-sm';
            div.innerHTML = item;
            patternRow.appendChild(div);
        });

        // 最後の「？」枠
        const questionDiv = document.createElement('div');
        questionDiv.className = 'text-7xl bg-white p-2 rounded-2xl shadow-sm border-4 border-purple-300 animate-pulse flex items-center justify-center w-24 h-24';
        questionDiv.innerHTML = '？';
        patternRow.appendChild(questionDiv);

        // 選択肢
        const choices = [itemA, itemB];
        // ダミーを1つ追加
        let dummy = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        while (choices.includes(dummy)) dummy = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        choices.push(dummy);
        choices.sort(() => Math.random() - 0.5);

        choicesContainer.innerHTML = '';
        choices.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'text-7xl p-6 bg-white rounded-3xl shadow-md border-4 border-purple-200 hover:scale-110 hover:border-purple-400 transition-transform active:scale-95';
            btn.innerHTML = item;
            btn.onclick = () => {
                if (isFinished) return;
                if (item === correctAnswer) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{});
                    questionDiv.innerHTML = item;
                    questionDiv.classList.remove('animate-pulse', 'border-purple-300');
                    questionDiv.classList.add('border-green-400', 'scale-110');
                    isFinished = true;
                    setTimeout(finishGame, 800);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    GameUtils.shakeElement(btn);
                }
            };
            choicesContainer.appendChild(btn);
        });
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
