document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/system/エラー2.mp3');

    const EMOJIS = [
        { icon: '😄', emotion: 'うれしい' }, { icon: '😭', emotion: 'かなしい' }, { icon: '😡', emotion: 'おこってる' }
    ];
    let isFinished = false;

    function init() {
        const stage = document.getElementById('stage');
        const qText = document.getElementById('question-text');
        const choicesContainer = document.getElementById('choices');
        
        const question = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        qText.textContent = `「${question.emotion}」おかおは どれかな？`;
        
        const currentChoices = [...EMOJIS].sort(() => Math.random() - 0.5);

        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'text-8xl p-4 bg-white rounded-full shadow-md border-4 border-blue-200 hover:scale-110 hover:border-blue-400 transition-transform active:scale-95';
            btn.innerHTML = choice.icon;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice.emotion === question.emotion) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{    init();
});
                    btn.classList.add('scale-125', 'bg-yellow-200', 'border-yellow-400');
                    isFinished = true;
                    setTimeout(finishGame, 800);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    btn.classList.add('opacity-50');
                }
            };
            choicesContainer.appendChild(btn);
        });
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
            btn.className = "flex flex-col items-center justify-center p-6 rounded-2xl border-4 " + sticker.data.color + " shadow-md hover:scale-110 transition-transform bg-white";
            btn.innerHTML = '<div class="text-6xl mb-2">' + sticker.item + '</div><div class="text-sm font-bold">' + sticker.data.label + '</div>';
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
});