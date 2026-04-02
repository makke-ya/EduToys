/**
 * すうじをなぞろう - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('svg-canvas');
    const bgPath = document.getElementById('bg-path');
    const guidePath = document.getElementById('guide-path');
    const tracedPath = document.getElementById('traced-path');
    const targetDot = document.getElementById('target-dot');
    const resultChar = document.getElementById('result-char');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/004_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');

    // なぞる音のシンセサイザー (AudioContext)
    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;

    function startSynth() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (oscillator) return;

        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        oscillator.type = 'triangle'; // 柔らかい「うにゅ」感
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        oscillator.start();
    }

    function updateSynth(progress) {
        if (!oscillator) return;
        // 周波数を 220Hz (A3) から 880Hz (A5) までスライド
        const freq = 220 + (880 - 220) * progress;
        oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
        gainNode.gain.setTargetAtTime(0.2, audioCtx.currentTime, 0.05);
    }

    function stopSynth() {
        if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
        if (oscillator) {
            oscillator.stop(audioCtx.currentTime + 0.1);
            oscillator = null;
        }
    }

    // 数字のパス定義
    const NUMBER_DATA = {
        '1': { paths: ['M 50 15 L 50 85'], char: '1' },
        '2': { paths: ['M 25 35 C 25 10, 75 10, 75 35 C 75 55, 25 85, 25 85 L 75 85'], char: '2' },
        '3': { paths: ['M 30 20 C 70 20, 70 45, 50 45 C 70 45, 70 80, 30 80'], char: '3' }
    };

    let currentNumber = '1';
    let currentStrokeIndex = 0;
    let isDrawing = false;
    let samplingPoints = [];
    let lastReachedIndex = -1;

    const nums = Object.keys(NUMBER_DATA);
    currentNumber = nums[Math.floor(Math.random() * nums.length)];
    resultChar.textContent = currentNumber;

    function initStroke() {
        const data = NUMBER_DATA[currentNumber];
        const d = data.paths[currentStrokeIndex];
        bgPath.setAttribute('d', data.paths.join(' '));
        guidePath.setAttribute('d', d);
        tracedPath.setAttribute('d', '');
        
        samplingPoints = [];
        const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempPath.setAttribute('d', d);
        const length = tempPath.getTotalLength();
        const step = 2;
        for (let i = 0; i <= length; i += step) {
            samplingPoints.push(tempPath.getPointAtLength(i));
        }
        lastReachedIndex = -1;
        updateTargetDot();
    }

    function updateTargetDot() {
        const nextIndex = lastReachedIndex + 1;
        if (nextIndex < samplingPoints.length) {
            targetDot.setAttribute('cx', samplingPoints[nextIndex].x);
            targetDot.setAttribute('cy', samplingPoints[nextIndex].y);
            targetDot.classList.remove('hidden');
        } else {
            targetDot.classList.add('hidden');
        }
    }

    function renderTracedPath() {
        if (lastReachedIndex < 0) return;
        let d = `M ${samplingPoints[0].x} ${samplingPoints[0].y}`;
        for (let i = 1; i <= lastReachedIndex; i++) {
            d += ` L ${samplingPoints[i].x} ${samplingPoints[i].y}`;
        }
        tracedPath.setAttribute('d', d);
    }

    function getMousePos(e) {
        const rect = svg.getBoundingClientRect();
        const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
        const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
        return {
            x: (clientX - rect.left) / rect.width * 100,
            y: (clientY - rect.top) / rect.height * 100
        };
    }

    function handleStart(e) {
        if (!finishOverlay.classList.contains('hidden')) return;
        isDrawing = true;
        startSynth();
        handleMove(e);
    }

    function handleMove(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        
        let foundNewPoint = false;
        // 詰まりを解消するため、直近の到達点から前方の一定範囲を探索
        const searchRange = 15; 
        const startSearch = lastReachedIndex + 1;
        const endSearch = Math.min(startSearch + searchRange, samplingPoints.length);

        for (let i = startSearch; i < endSearch; i++) {
            const p = samplingPoints[i];
            const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
            
            // 判定距離を 15 に拡大 (少しルーズにして遊びやすくする)
            if (dist < 15) {
                lastReachedIndex = i;
                foundNewPoint = true;
            }
        }

        if (foundNewPoint) {
            renderTracedPath();
            updateTargetDot();
            
            const progress = lastReachedIndex / (samplingPoints.length - 1);
            updateSynth(progress);

            if (lastReachedIndex >= samplingPoints.length - 1) {
                completeStroke();
            }
        } else {
            // パスから離れすぎた場合は音量を下げる
            if (gainNode) gainNode.gain.setTargetAtTime(0.02, audioCtx.currentTime, 0.1);
        }
    }

    function completeStroke() {
        isDrawing = false;
        stopSynth();
        currentStrokeIndex++;
        soundTap.play().catch(e=>{});

        const data = NUMBER_DATA[currentNumber];
        if (currentStrokeIndex < data.paths.length) {
            initStroke();
        } else {
            finishTracing();
        }
    }

    function finishTracing() {
        svg.classList.add('hidden');
        resultChar.classList.remove('hidden');
        resultChar.classList.add('success-bounce');
        
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
    window.addEventListener('pointerup', () => {
        isDrawing = false;
        stopSynth();
    });

    initStroke();
    soundIntro.play().catch(e=>{});
});
