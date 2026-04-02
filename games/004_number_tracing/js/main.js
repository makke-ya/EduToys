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
    const instruction = document.getElementById('instruction');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/004_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');

    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;

    function startSynth() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (oscillator) return;
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        oscillator.type = 'triangle';
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        oscillator.start();
    }

    function updateSynth(progress) {
        if (!oscillator) return;
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

    // 0-9 全てのパスデータ定義 (日本の小学校での書き順に準拠)
    const NUMBER_DATA = {
        '0': { paths: ['M 50 15 C 20 15, 20 85, 50 85 C 80 85, 80 15, 50 15'] },
        '1': { paths: ['M 50 15 L 50 85'] },
        '2': { paths: ['M 25 35 C 25 10, 75 10, 75 35 C 75 55, 25 85, 25 85 L 75 85'] },
        '3': { paths: ['M 30 25 C 70 20, 70 45, 50 45 C 70 45, 70 80, 30 75'] },
        '4': { paths: ['M 55 15 L 25 65 L 80 65', 'M 60 15 L 60 85'] },
        '5': { paths: ['M 65 15 L 35 15 L 35 45 C 35 45, 75 40, 75 65 C 75 90, 30 90, 30 75', 'M 35 15 L 70 15'] },
        '6': { paths: ['M 60 15 C 30 20, 25 50, 25 60 C 25 85, 75 85, 75 60 C 75 40, 30 45, 30 60'] },
        '7': { paths: ['M 25 20 L 75 20 L 40 85'] },
        '8': { paths: ['M 50 50 C 20 50, 20 15, 50 15 C 80 15, 80 50, 50 50 C 80 50, 80 85, 50 85 C 20 85, 20 50, 50 50'] },
        '9': { paths: ['M 70 50 C 70 20, 25 20, 25 50 C 25 75, 70 75, 70 40 L 70 85'] }
    };

    let selectedNumbers = []; // 今回書く3つの数字
    let currentIndexInSession = 0; // 3つのうち何番目か
    let currentStrokeIndex = 0;
    let isDrawing = false;
    let samplingPoints = [];
    let lastReachedIndex = -1;

    function initGame() {
        // 0-9から重複なしで3つ選ぶ
        const allNums = Object.keys(NUMBER_DATA);
        selectedNumbers = allNums.sort(() => Math.random() - 0.5).slice(0, 3);
        currentIndexInSession = 0;
        initNumber();
    }

    function initNumber() {
        const num = selectedNumbers[currentIndexInSession];
        currentStrokeIndex = 0;
        resultChar.textContent = num;
        resultChar.classList.add('hidden');
        resultChar.classList.remove('success-bounce');
        svg.classList.remove('hidden');
        
        instruction.textContent = `すうじを なぞろう！ (${currentIndexInSession + 1}/3)`;
        initStroke();
    }

    function initStroke() {
        const num = selectedNumbers[currentIndexInSession];
        const data = NUMBER_DATA[num];
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
        const searchRange = 20; // 探索範囲をさらに広げてスムーズに
        const startSearch = lastReachedIndex + 1;
        const endSearch = Math.min(startSearch + searchRange, samplingPoints.length);

        for (let i = startSearch; i < endSearch; i++) {
            const p = samplingPoints[i];
            const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
            if (dist < 18) { // 判定距離をさらに拡大
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
            if (gainNode) gainNode.gain.setTargetAtTime(0.02, audioCtx.currentTime, 0.1);
        }
    }

    function completeStroke() {
        isDrawing = false;
        stopSynth();
        currentStrokeIndex++;
        soundTap.play().catch(e=>{});

        const num = selectedNumbers[currentIndexInSession];
        const data = NUMBER_DATA[num];
        if (currentStrokeIndex < data.paths.length) {
            initStroke();
        } else {
            finishSingleNumber();
        }
    }

    function finishSingleNumber() {
        svg.classList.add('hidden');
        resultChar.classList.remove('hidden');
        resultChar.classList.add('success-bounce');
        
        const num = selectedNumbers[currentIndexInSession];
        const voice = new Audio(`../../static/sounds/voice/num_${num}.mp3`);
        voice.play().catch(e=>{});

        GameUtils.showHanamaru();
        
        setTimeout(() => {
            currentIndexInSession++;
            if (currentIndexInSession < selectedNumbers.length) {
                // 次の数字へ
                initNumber();
            } else {
                // 全て完了
                showFinalFinish();
            }
        }, 1500);
    }

    function showFinalFinish() {
        setTimeout(() => {
            soundClear.play().catch(e=>{});
            soundClearVoice.play().catch(e=>{});
        }, 300);

        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 1500);
    }

    function setupStickers() {
        if (!window.StickerSystem) return;
        const choices = document.getElementById('sticker-choices');
        choices.innerHTML = '';
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

    initGame();
    soundIntro.play().catch(e=>{});
});
