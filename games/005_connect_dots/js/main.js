/**
 * てんつなぎ - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('dots-container');
    const linesPath = document.getElementById('lines-path');
    const goalIllustration = document.getElementById('goal-illustration');
    const goalParts = document.querySelectorAll('.goal-part');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/005_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');

    // おうちの頂点データ
    const DOTS = [
        { x: 20, y: 80, num: 1 },
        { x: 20, y: 45, num: 2 },
        { x: 50, y: 15, num: 3 },
        { x: 80, y: 45, num: 4 },
        { x: 80, y: 80, num: 5 },
        { x: 20, y: 80, num: 6 }
    ];

    let currentTargetIndex = 0;
    let pathData = "";

    function init() {
        DOTS.forEach((dot, index) => {
            // 6番目の点は1番目と同じ位置なのでボタンは作らない
            if (index === 5) return;

            const el = document.createElement('button');
            el.className = 'dot absolute w-12 h-12 bg-white border-4 border-green-400 rounded-full flex items-center justify-center text-xl font-bold text-green-600 shadow-md z-20 transition-all active:scale-90';
            el.style.left = `calc(${dot.x}% - 24px)`;
            el.style.top = `calc(${dot.y}% - 24px)`;
            el.textContent = dot.num;
            
            el.addEventListener('click', () => handleTap(index, el));
            container.appendChild(el);

            if (index === 0) el.classList.add('dot-active');
        });
    }

    function handleTap(index, el) {
        if (index !== currentTargetIndex) {
            // 順番が違う
            if (index > currentTargetIndex) {
                GameUtils.shakeElement(el);
            }
            return;
        }

        // 正解
        soundTap.currentTime = 0;
        // 音階を上げる演出（ピッチ変更はブラウザ制限があるため、簡易的に）
        soundTap.play().catch(e=>{});

        const dot = DOTS[index];
        if (currentTargetIndex === 0) {
            pathData = `M ${dot.x} ${dot.y}`;
        } else {
            pathData += ` L ${dot.x} ${dot.y}`;
        }
        linesPath.setAttribute('d', pathData);
        
        el.classList.remove('dot-active');
        el.classList.add('bg-green-400', 'text-white', 'scale-75');
        el.disabled = true;

        currentTargetIndex++;
        
        // 次のターゲットを強調
        const nextDotEl = container.children[currentTargetIndex];
        if (nextDotEl) {
            nextDotEl.classList.add('dot-active');
        }

        // 最後(6番目)の点へ自動で線を引く
        if (currentTargetIndex === 5) {
            finishGame();
        }
    }

    function finishGame() {
        const lastDot = DOTS[5];
        pathData += ` L ${lastDot.x} ${lastDot.y}`;
        linesPath.setAttribute('d', pathData);

        // イラストを表示
        goalIllustration.classList.add('illustration-fadein');
        goalParts.forEach(p => p.classList.add('illustration-fadein'));

        GameUtils.showHanamaru();
        
        setTimeout(() => {
            soundClear.play().catch(e=>{});
            soundClearVoice.play().catch(e=>{});
        }, 500);

        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 2000);
    }

    function setupStickers() {
        if (!window.StickerSystem) return;
        const choices = document.getElementById('sticker-choices');
        StickerSystem.drawThree().forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white`;
            btn.innerHTML = `<div class="text-6xl mb-2">${sticker.item}</div><div class="text-sm font-bold">${sticker.data.label}</div>`;
            btn.addEventListener('click', () => {
                soundSelect.play().catch(e=>{});
                StickerSystem.saveSticker(sticker);
                document.getElementById('sticker-selection').classList.add('hidden');
                document.getElementById('after-selection').classList.remove('hidden');
            });
            choices.appendChild(btn);
        });
    }

    init();
    soundIntro.play().catch(e=>{});
});
