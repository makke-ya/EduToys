/**
 * かずをかぞえよう - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('apple-stage');
    const counterDisplay = document.getElementById('counter');
    const finishOverlay = document.getElementById('finish-overlay');

    // 音声ファイルの準備
    const bgm = new Audio('../../static/sounds/bgm/Pops_01.mp3');
    bgm.loop = true;
    bgm.volume = 0.3; // BGMの音量は少し下げる

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/001_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const TOTAL_APPLES = 5; // 幼児向けに5個程度から開始
    let tappedCount = 0;
    let isFinished = false;
    let bgmStarted = false;

    const tryPlayBgm = () => {
        if (!bgmStarted && !isFinished) {
            bgm.play().then(() => {
                bgmStarted = true;
                document.body.removeEventListener('click', tryPlayBgm);
                document.body.removeEventListener('touchstart', tryPlayBgm);
            }).catch(e => {
                console.log('Autoplay prevented. Waiting for user interaction.', e);
            });
        }
    };

    // URLパラメータに autoplay=1 があれば即時再生を試みる
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoplay') === '1') {
        tryPlayBgm();
    }

    // フォールバック: 画面のどこかを触ったら再生
    document.body.addEventListener('click', tryPlayBgm);
    document.body.addEventListener('touchstart', tryPlayBgm, { passive: true });

    // リンゴの生成と配置
    
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
// リンゴの生成と配置
async function init() {
    for (let i = 0; i < TOTAL_APPLES; i++) {
        createApple(i);
        // 0.2秒ごとに1つずつ出す
        await new Promise(r => setTimeout(r, 200));
    }
}

function createApple(id) {
    const apple = document.createElement('div');
    apple.className = 'apple absolute cursor-pointer select-none text-6xl transition-all duration-500 scale-0 animate-bounce';
    apple.innerHTML = '🍎';

    // ランダムな位置に配置
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 60 + 20;
    apple.style.left = `${x}%`;
    apple.style.top = `${y}%`;

    apple.dataset.tapped = 'false';

    apple.addEventListener('click', () => handleTap(apple));
    apple.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTap(apple);
    }, { passive: false });

    stage.appendChild(apple);

    // 登場アニメーション
    setTimeout(() => apple.classList.remove('scale-0'), 50);
}

    function handleTap(apple) {
        if (isFinished || apple.dataset.tapped === 'true') return;

        // タップ音を再生 (連続タップに対応するためcurrentTimeをリセット)
        soundTap.currentTime = 0;
        soundTap.play().catch(e => console.log('Audio play failed:', e));

        apple.dataset.tapped = 'true';
        apple.classList.add('opacity-50', 'scale-75', 'rotate-12');
        
        // カウントを先に増やす
        tappedCount++;
        counterDisplay.textContent = tappedCount;

        // タップした瞬間に数字を表示するアニメーション (増やした後の数を表示)
        showNumberAt(apple, tappedCount);

        if (tappedCount === TOTAL_APPLES) {
            finishGame();
        }
    }

    function showNumberAt(apple, numberToShow) {
        const num = document.createElement('div');
        num.className = 'absolute text-4xl font-black text-orange-500 animate-number-up pointer-events-none';
        num.textContent = numberToShow;
        num.style.left = apple.style.left;
        num.style.top = apple.style.top;
        stage.appendChild(num);

        setTimeout(() => num.remove(), 1000);
    }

    function finishGame() {
        GameUtils.showHanamaru();
        isFinished = true;
        
        // クリア音を再生
        setTimeout(() => {
            soundClear.play().catch(e => console.log('Audio play failed:', e));
        }, 300);

        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            soundSelectSticker.play().catch(e=>{});
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
                // 選択音を再生
                soundSelect.currentTime = 0;
                soundSelect.play().catch(e => console.log('Audio play failed:', e));

                StickerSystem.saveSticker(sticker);
                selectionArea.classList.add('hidden');
                afterSelection.classList.remove('hidden');
            });
            
            choicesContainer.appendChild(btn);
        });
    }

    init();
});
