document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/system/エラー2.mp3');

    const WEATHERS = [
        { icon: '☀️', name: 'はれ', correct: '🧢' },
        { icon: '☔', name: 'あめ', correct: '☂️' },
        { icon: '⛄', name: 'ゆき', correct: '🧣' }
    ];
    const ALL_CLOTHES = ['🧢', '☂️', '🧣', '🕶️', '👢'];
    let isFinished = false;

    function init() {
        const weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
        document.getElementById('weather').innerHTML = `${weather.icon}<br><span class="text-2xl font-bold">${weather.name} のひは？</span>`;
        
        let currentChoices = [weather.correct];
        while(currentChoices.length < 3) {
            const dummy = ALL_CLOTHES[Math.floor(Math.random() * ALL_CLOTHES.length)];
            if(!currentChoices.includes(dummy)) currentChoices.push(dummy);
        }
        currentChoices.sort(() => Math.random() - 0.5);

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'text-7xl p-4 bg-white rounded-full shadow-md border-4 border-orange-200 hover:scale-110 transition-transform active:scale-95';
            btn.innerHTML = choice;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice === weather.correct) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{    init();
});
                    btn.classList.add('bg-yellow-200');
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