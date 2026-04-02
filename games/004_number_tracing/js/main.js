/**
 * すうじをなぞろう - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('svg-canvas');
    const bgPath = document.getElementById('bg-path');
    const guidePath = document.getElementById('guide-path');
    const userPath = document.getElementById('user-path');
    const targetDot = document.getElementById('target-dot');
    const resultChar = document.getElementById('result-char');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/004_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');

    // 数字のパス定義 (100x100 基準)
    const NUMBER_DATA = {
        '1': { paths: ['M 50 15 L 50 85'], char: '1' },
        '2': { paths: ['M 25 35 C 25 10, 75 10, 75 35 C 75 55, 25 85, 25 85 L 75 85'], char: '2' },
        '3': { paths: ['M 30 20 C 70 20, 70 45, 50 45 C 70 45, 70 80, 30 80'], char: '3' }
    };

    let currentNumber = '1';
    let currentStrokeIndex = 0;
    let isDrawing = false;
    let samplingPoints = [];
    let reachedPoints = new Set();
    let userPoints = [];

    // どの数字を出すかランダム（または1から順に）
    const nums = Object.keys(NUMBER_DATA);
    currentNumber = nums[Math.floor(Math.random() * nums.length)];
    resultChar.textContent = currentNumber;

    function initStroke() {
        const data = NUMBER_DATA[currentNumber];
        const d = data.paths[currentStrokeIndex];
        bgPath.setAttribute('d', data.paths.join(' ')); // 背景は全画表示
        guidePath.setAttribute('d', d);
        
        // サンプリング点の生成
        samplingPoints = [];
        const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempPath.setAttribute('d', d);
        const length = tempPath.getTotalLength();
        const step = 2; // 2単位ごとにサンプリング
        for (let i = 0; i <= length; i += step) {
            samplingPoints.push(tempPath.getPointAtLength(i));
        }
        reachedPoints.clear();
        
        updateTargetDot();
    }

    function updateTargetDot() {
        // 次のターゲット（まだ到達していない最初の点）を表示
        for (let i = 0; i < samplingPoints.length; i++) {
            if (!reachedPoints.has(i)) {
                targetDot.setAttribute('cx', samplingPoints[i].x);
                targetDot.setAttribute('cy', samplingPoints[i].y);
                targetDot.classList.remove('hidden');
                return;
            }
        }
        targetDot.classList.add('hidden');
    }

    function getMousePos(e) {
        const rect = svg.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width * 100,
            y: (clientY - rect.top) / rect.height * 100
        };
    }

    function handleStart(e) {
        if (finishOverlay.classList.contains('hidden') === false) return;
        isDrawing = true;
        handleMove(e);
    }

    function handleMove(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        
        // パスに近いか判定 (許容範囲: 10単位)
        let isNear = false;
        samplingPoints.forEach((p, index) => {
            const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
            if (dist < 10) {
                isNear = true;
                // 順番通りに到達しているか（ある程度寛容に）
                const lastReached = Array.from(reachedPoints).sort((a,b)=>b-a)[0] || -1;
                if (index <= lastReached + 5) {
                    reachedPoints.add(index);
                }
            }
        });

        if (isNear) {
            updateTargetDot();
            
            // 判定: 80%以上の点に到達したらストローク完了
            if (reachedPoints.size > samplingPoints.length * 0.8) {
                completeStroke();
            }
        } else {
            // 外れたら少し揺らすなどの演出（オプション）
        }
    }

    function completeStroke() {
        isDrawing = false;
        currentStrokeIndex++;
        soundTap.play().catch(e=>{});

        const data = NUMBER_DATA[currentNumber];
        if (currentStrokeIndex < data.paths.length) {
            // 次の画へ
            initStroke();
        } else {
            // 全部完了
            finishTracing();
        }
    }

    function finishTracing() {
        svg.classList.add('hidden');
        resultChar.classList.remove('hidden');
        resultChar.classList.add('success-bounce');
        
        // 数字のボイス
        const voice = new Audio(`../../static/sounds/voice/num_${currentNumber}.mp3`);
        voice.play().catch(e=>{});

        GameUtils.showHanamaru();
        
        setTimeout(() => {
            soundClear.play().catch(e=>{});
            soundClearVoice.play().catch(e=>{});
        }, 500);

        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 1500);
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

    svg.addEventListener('pointerdown', handleStart);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', () => isDrawing = false);

    initStroke();
    soundIntro.play().catch(e=>{});
});
