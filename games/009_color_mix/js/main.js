document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/009_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const MIXES = [
        { c1: 'bg-red-500', c2: 'bg-blue-500', ans: 'bg-purple-500' },
        { c1: 'bg-red-500', c2: 'bg-yellow-400', ans: 'bg-orange-500' },
        { c1: 'bg-blue-500', c2: 'bg-yellow-400', ans: 'bg-green-500' }
    ];
    const ALL_COLORS = ['bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-teal-500'];
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
        const mix = MIXES[Math.floor(Math.random() * MIXES.length)];
        document.getElementById('color1').className = `w-24 h-24 rounded-full shadow-inner ${mix.c1}`;
        document.getElementById('color2').className = `w-24 h-24 rounded-full shadow-inner ${mix.c2}`;
        
        let currentChoices = [mix.ans];
        while(currentChoices.length < 3) {
            const dummy = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
            if(!currentChoices.includes(dummy)) currentChoices.push(dummy);
        }
        currentChoices.sort(() => Math.random() - 0.5);

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = `w-20 h-20 rounded-full shadow-md hover:scale-110 transition-transform active:scale-95 ${choice}`;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice === mix.ans) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{    init();
});
                    const resBox = document.getElementById('result-box');
                    resBox.className = `w-28 h-28 rounded-full shadow-lg border-4 border-white animate-bounce ${choice}`;
                    resBox.innerHTML = '';
                    isFinished = true;
                    setTimeout(finishGame, 1000);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    btn.classList.add('opacity-20');
                }
            };
            choicesContainer.appendChild(btn);
        });
    }

    function finishGame() {
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