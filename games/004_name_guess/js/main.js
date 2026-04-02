document.addEventListener('DOMContentLoaded', () => {
    const target = document.getElementById('target-item');
    const choicesContainer = document.getElementById('choices');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/004_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const DICTIONARY = [
        { icon: '🐶', name: 'いぬ' }, { icon: '🐱', name: 'ねこ' }, { icon: '🐘', name: 'ぞう' },
        { icon: '🍎', name: 'りんご' }, { icon: '🍓', name: 'いちご' }, { icon: '🌻', name: 'ひまわり' },
        { icon: '🚗', name: 'くるま' }, { icon: '✈️', name: 'ひこうき' }, { icon: '🧸', name: 'くま' }
    ];
    let isFinished = false;

    
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
    // 自動再生できれば最初から鳴らす
    setTimeout(playIntro, 100);

    function init() {
        const question = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
        target.innerHTML = question.icon;
        
        const currentChoices = [question];
        while (currentChoices.length < 3) {
            const dummy = DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];
            if (!currentChoices.find(c => c.name === dummy.name)) {
                currentChoices.push(dummy);
            }
        }
        
        currentChoices.sort(() => Math.random() - 0.5);

        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'w-full py-4 text-3xl font-bold bg-white rounded-full shadow-md border-4 border-pink-200 hover:bg-pink-50 hover:border-pink-400 transition-colors active:scale-95';
            btn.textContent = choice.name;
            btn.onclick = () => handleTap(choice.name === question.name, btn);
            choicesContainer.appendChild(btn);
        });
    }

    function handleTap(isCorrect, btn) {
        if (isFinished) return;

        if (isCorrect) {
            soundTap.currentTime = 0;
            soundTap.play().catch(e=>{});
            btn.classList.add('bg-green-400', 'text-white', 'border-green-500');
            target.classList.add('animate-bounce');
            isFinished = true;
            setTimeout(finishGame, 1000);
        } else {
            soundError.currentTime = 0;
            soundError.play().catch(e=>{});
            btn.classList.add('opacity-50');
            btn.disabled = true;
        }
    }
    
    function finishGame() {
        GameUtils.showHanamaru();
        setTimeout(() => soundClear.play().catch(e=>{}); soundClearVoice.play().catch(e=>{});, 300);
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