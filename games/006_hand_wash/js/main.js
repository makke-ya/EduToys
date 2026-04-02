document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/system/エラー2.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/006_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    let isFinished = false;
    let germsCount = 5;

    
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
        const germsContainer = document.getElementById('germs');
        for (let i = 0; i < germsCount; i++) {
            const germ = document.createElement('div');
            germ.className = 'text-3xl animate-bounce cursor-pointer pointer-events-auto';
            germ.innerHTML = '🦠';
            germ.style.transform = `translate(${(Math.random()-0.5)*100}px, ${(Math.random()-0.5)*100}px)`;
            germ.onclick = () => {
                if (isFinished || germ.classList.contains('opacity-0')) return;
                soundTap.currentTime = 0; soundTap.play().catch(e=>{});

                // 泡の演出
                const bubble = document.createElement('div');
                bubble.className = 'absolute text-5xl animate-ping pointer-events-none';
                bubble.innerHTML = '🫧';
                bubble.style.left = germ.style.left;
                bubble.style.top = germ.style.top;
                germsContainer.appendChild(bubble);
                setTimeout(() => bubble.remove(), 500);

                germ.innerHTML = '✨';
                germ.classList.add('opacity-0', 'scale-150', 'transition-all', 'duration-500');
                germsCount--;
                if (germsCount === 0) {
                    isFinished = true;
                    const clearVoice = new Audio('../../static/sounds/voice/006_clear.mp3');
                    clearVoice.play().catch(e=>{});
                    document.getElementById('hands').classList.add('animate-pulse');
                    setTimeout(finishGame, 1000);
                }
            };
            };
            germsContainer.appendChild(germ);
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