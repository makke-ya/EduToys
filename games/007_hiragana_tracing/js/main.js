/**
 * ひらがななぞり書き - main.js
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
    const wordProgress = document.getElementById('word-progress');
    const wordFinishOverlay = document.getElementById('word-finish-overlay');
    const wordEmoji = document.getElementById('word-emoji');
    const wordText = document.getElementById('word-text');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/system/出題1.mp3'); // Placeholder
    const soundClearVoice = new Audio('../../static/sounds/system/正解1.mp3'); // Placeholder

    // ひらがなのパスデータ定義
    const HIRAGANA_DATA = {
        'い': { paths: ['M 25 30 C 25 60, 40 80, 45 80', 'M 75 35 C 75 50, 70 65, 65 70'] },
        'ぬ': { paths: ['M 40 25 C 35 60, 20 75, 20 50 C 20 20, 60 20, 70 45 C 80 75, 50 85, 45 60 C 40 40, 65 35, 75 55 C 80 65, 90 60, 90 40', 'M 30 25 L 50 75'] }, // Simplified
        'ね': { paths: ['M 30 20 L 30 85', 'M 20 40 L 70 30 C 70 60, 30 60, 30 40 C 30 20, 80 20, 80 50 C 80 70, 50 85, 45 65 C 40 45, 65 40, 75 60 C 80 70, 90 65, 90 45'] }, // Simplified
        'こ': { paths: ['M 30 30 C 50 25, 70 30, 75 35', 'M 25 75 C 45 85, 65 80, 80 70'] },
        'あ': { paths: ['M 25 40 L 75 40', 'M 50 20 C 50 40, 45 60, 40 80', 'M 60 25 C 60 85, 20 85, 20 55 C 20 25, 80 25, 80 65 C 80 85, 50 90, 40 85'] },
        'り': { paths: ['M 30 30 C 30 60, 35 75, 45 75', 'M 70 30 C 70 50, 60 80, 50 90'] }
    };

    const WORDS = [
        { word: 'いぬ', emoji: '🐶' },
        { word: 'ねこ', emoji: '🐱' },
        { word: 'あり', emoji: '🐜' }
    ];

    let currentWordIndex = 0;
    let currentCharIndex = 0;
    let currentStrokeIndex = 0;
    
    let isDrawing = false;
    let samplingPoints = [];
    let lastReachedIndex = -1;

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

    function initGame() {
        WORDS.sort(() => Math.random() - 0.5);
        currentWordIndex = 0;
        initWord();
    }

    function initWord() {
        currentCharIndex = 0;
        updateWordProgress();
        initChar();
    }

    function updateWordProgress() {
        const word = WORDS[currentWordIndex].word;
        wordProgress.innerHTML = '';
        for (let i = 0; i < word.length; i++) {
            const span = document.createElement('span');
            if (i < currentCharIndex) {
                span.textContent = word[i];
                span.className = "text-purple-600";
            } else {
                span.textContent = '〇';
                span.className = "text-gray-300";
            }
            wordProgress.appendChild(span);
        }
    }

    function initChar() {
        const char = WORDS[currentWordIndex].word[currentCharIndex];
        currentStrokeIndex = 0;
        resultChar.textContent = char;
        resultChar.classList.add('hidden');
        resultChar.classList.remove('success-bounce');
        svg.classList.remove('hidden');
        
        instruction.textContent = `「${char}」を なぞろう！`;
        initStroke();
    }

    function initStroke() {
        const char = WORDS[currentWordIndex].word[currentCharIndex];
        const data = HIRAGANA_DATA[char];
        if (!data) return; // Fallback

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
        const nextIndex = Math.min(lastReachedIndex + 3, samplingPoints.length - 1);
        if (nextIndex >= 0 && nextIndex < samplingPoints.length) {
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
        if (!finishOverlay.classList.contains('hidden') || !wordFinishOverlay.classList.contains('hidden')) return;
        isDrawing = true;
        startSynth();
        handleMove(e);
    }

    function handleMove(e) {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        
        let foundNewPoint = false;
        let maxAdvance = 30;

        while (maxAdvance > 0 && lastReachedIndex + 1 < samplingPoints.length) {
            const p = samplingPoints[lastReachedIndex + 1];
            const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
            if (dist < 20) { // ゆるめの判定 (20)
                lastReachedIndex++;
                foundNewPoint = true;
                maxAdvance--;
            } else {
                break;
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

        const char = WORDS[currentWordIndex].word[currentCharIndex];
        const data = HIRAGANA_DATA[char];
        if (currentStrokeIndex < data.paths.length) {
            initStroke();
        } else {
            finishSingleChar();
        }
    }

    function finishSingleChar() {
        svg.classList.add('hidden');
        resultChar.classList.remove('hidden');
        resultChar.classList.add('success-bounce');
        
        try {
            GameUtils.showHanamaru('game-container');
        } catch(e) { console.error(e); }
        
        setTimeout(() => {
            currentCharIndex++;
            updateWordProgress();
            
            if (currentCharIndex < WORDS[currentWordIndex].word.length) {
                initChar();
            } else {
                finishWord();
            }
        }, 1500);
    }

    function finishWord() {
        const wordData = WORDS[currentWordIndex];
        wordEmoji.textContent = wordData.emoji;
        wordText.textContent = wordData.word;
        
        wordFinishOverlay.classList.remove('hidden');
        soundClearVoice.play().catch(e=>{});

        setTimeout(() => {
            wordFinishOverlay.classList.add('hidden');
            currentWordIndex++;
            if (currentWordIndex < WORDS.length) {
                initWord();
            } else {
                showFinalFinish();
            }
        }, 3000);
    }

    function showFinalFinish() {
        setTimeout(() => {
            soundClear.play().catch(e=>{});
        }, 300);

        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 1000);
    }

    function setupStickers() {
        if (!window.StickerSystem) return;
        const choices = document.getElementById('sticker-choices');
        choices.innerHTML = '';
        StickerSystem.drawThree().forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-8 rounded-[40px] border-4 ${sticker.data.color} shadow-2xl hover:scale-110 transition-transform bg-white/90`;
            btn.innerHTML = `<div class="text-7xl mb-4">${sticker.item}</div><div class="text-lg font-black text-gray-800">${sticker.data.label}</div>`;
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
    
    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
        }
    };
    document.body.addEventListener('click', playIntro, { once: true });
    setTimeout(playIntro, 500);
});
