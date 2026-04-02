document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/007_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const PAIRS = [
        { a: {icon:'🐘', word:'おおきい'}, b: {icon:'🐭', word:'ちいさい'} },
        { a: {icon:'☀️', word:'あつい'}, b: {icon:'⛄', word:'さむい'} },
        { a: {icon:'😊', word:'わらう'}, b: {icon:'😭', word:'なく'} }
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
        const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
        const isA = Math.random() < 0.5;
        const question = isA ? pair.a : pair.b;
        const answer = isA ? pair.b : pair.a;
        
        document.getElementById('target-item').innerHTML = `${question.icon}<br><span class="text-2xl">${question.word}</span>`;
        
        let currentChoices = [answer];
        while (currentChoices.length < 3) {
            const randomPair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
            const dummy = Math.random() < 0.5 ? randomPair.a : randomPair.b;
            if (!currentChoices.find(c => c.word === dummy.word) && dummy.word !== question.word) {
                currentChoices.push(dummy);
            }
        }
        currentChoices.sort(() => Math.random() - 0.5);

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'text-6xl p-6 bg-white rounded-3xl shadow-md border-4 border-purple-200 hover:scale-110 hover:border-purple-400 transition-transform active:scale-95 flex flex-col items-center';
            btn.innerHTML = `${choice.icon}<span class="text-xl mt-2 font-bold">${choice.word}</span>`;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice.word === answer.word) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{    init();
});
                    btn.classList.add('bg-green-200', 'border-green-400');
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