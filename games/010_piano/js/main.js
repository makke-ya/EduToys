document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/system/エラー2.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/010_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const NOTES = [
        { color: 'bg-red-400', key: 'ド' }, { color: 'bg-orange-400', key: 'レ' },
        { color: 'bg-yellow-400', key: 'ミ' }, { color: 'bg-green-400', key: 'ファ' },
        { color: 'bg-blue-400', key: 'ソ' }, { color: 'bg-indigo-400', key: 'ラ' },
        { color: 'bg-purple-400', key: 'シ' }, { color: 'bg-pink-400', key: 'ド' }
    ];
    let tapCount = 0;
    
    
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
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = '';
        NOTES.forEach((note, i) => {
            const key = document.createElement('button');
            key.className = `w-12 h-48 md:w-16 md:h-64 rounded-b-xl shadow-md border-b-8 border-black/20 text-white font-bold text-xl flex items-end justify-center pb-4 hover:brightness-110 active:translate-y-2 active:border-b-0 transition-all ${note.color}`;
            key.textContent = note.key;
            key.onclick = () => {
                // 本来は音階ごとの音源を鳴らすが、今回はタップ音で代用しピッチを変える擬似実装
                const s = soundTap.cloneNode();
                s.preservesPitch = false;
                s.playbackRate = 0.8 + (i * 0.1);
                s.play().catch(e=>{    init();
});
                
                tapCount++;
                // 適当に10回弾いたらクリアとする
                if(tapCount === 10) setTimeout(finishGame, 500);
            };
            keyboard.appendChild(key);
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