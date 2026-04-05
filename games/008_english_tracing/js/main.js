/**
 * えいごなぞり - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('svg-canvas');
    const bgPath = document.getElementById('bg-path');
    const guidePath = document.getElementById('guide-path');
    const tracedPath = document.getElementById('traced-path');
    const completedPaths = document.getElementById('completed-paths');
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
    const soundIntro = new Audio('../../static/sounds/voice/008_intro.mp3');
    const soundWordClear = new Audio('../../static/sounds/system/正解1.mp3');
    const soundGameClear = new Audio('../../static/sounds/voice/008_clear.mp3');

    // アルファベットのパスデータ定義 (KanjiVGの高品質センターラインデータ)
    const ALPHABET_DATA = {
        'A': { 
            paths: [
                'M54.46,14.41c-8.67,19.8-31.28,70.81-34.46,78.47',
                'M54.46,14.41c5.06,11.27,30.2,68.64,34.54,78.47',
                'M32.18,66.14c12.28,0,33.91,0,44.02,0'
            ],
            voice: '008_a_upper.mp3'
        },
        'a': { 
            paths: [
                'M34.26,50.61c1.88-7.08,5.78-15.61,20.52-15.61c9.97,0,17.34,4.51,17.34,12.31c0,6.79,0.14,36.1,0.14,39.28c0,8.67,6.36,6.65,9.25,0.43',
                'M70.82,58.71c-20.23,1.01-40.32,4.33-40.32,21.38c0,16.33,26.59,15.32,40.7,3.01'
            ],
            voice: '008_a_lower.mp3'
        },
        'B': { 
            paths: [
                'M28.29,17.66c0,8.53-0.29,65.32-0.29,72.4',
                'M28.53,16.94c17.05,0,13.74,0,30.94,0c24.41,0,24.55,33.81,0,33.81c-16.47,0-17.07,0-30.51,0',
                'M28.53,52.78c18.2,0,14.67,0,33.02,0c26.05,0,26.21,38.01,0,38.01c-17.58,0-18.22,0-32.56,0'
            ],
            voice: '008_b_upper.mp3'
        },
        'b': { 
            paths: [
                'M36,15.39c0,5.92,0,67.26,0,77.09',
                'M36.36,52.09c3.82-10.58,11.92-16.79,21.6-16.79c9.68,0,21.2,6.36,21.2,26.09c0,21.59-8.05,31.28-20.48,31.28c-12.43,0-19.36-9.25-22.43-17.24'
            ],
            voice: '008_b_lower.mp3'
        },
        'C': { 
            paths: [
                'M85.05,32.4c-6.94-13.73-19.8-16.76-29.91-16.76c-14.02,0-30.64,12.43-30.64,34.39c0,25.58,10.85,42.49,31.38,42.49c19.64,0,24.41-9.1,28.6-19.36'
            ],
            voice: '008_c_upper.mp3'
        },
        'c': { 
            paths: [
                'M77.68,51.77c-3.32-10.26-8.38-16.76-23.41-16.76c-11.85,0-23.27,8.81-23.27,27.83c0,19.28,9.54,29.25,23.7,29.25c16.04,0,22.25-9.39,23.41-17.63'
            ],
            voice: '008_c_lower.mp3'
        },
        'D': {
            paths: [
                'M29,17.32c0,9.1,0,62,0,73.27',
                'M29.43,16.8c2.31,0,1.44,0,22.4,0c20.96,0,32.23,16.18,32.23,34.97c0,18.79-10.55,39.16-30.5,39.16c-19.95,0-24.21,0-24.21,0'
            ],
            voice: '008_d_upper.mp3'
        },
        'd': {
            paths: [
                'M74.3,52.09c-3.82-10.58-11.92-16.79-21.6-16.79c-9.68,0-21.2,6.36-21.2,26.09c0,21.59,8.05,31.28,20.48,31.28c12.43,0,19.36-9.25,22.43-17.24',
                'M74.74,15.39c0,5.92,0,67.26,0,77.09'
            ],
            voice: '008_d_lower.mp3'
        },
        'E': {
            paths: [
                'M31.5,17.32c0,9.1,0,62,0,73.27',
                'M31.93,16.8c2.31,0,27.19,0,48.15,0',
                'M31.93,52.35c2.31,0,25.44,0,46.4,0',
                'M31.93,90.79c2.31,0,28.94,0,49.9,0'
            ],
            voice: '008_e_upper.mp3'
        },
        'e': {
            paths: [
                'M78.15,62.25c1.16-15.17-6.17-27.25-21.64-27.25c-13.87,0-25.51,10.84-25.51,27.89c0,17.05,6.58,29.62,24.64,29.62c18.06,0,20.53-12.56,22.55-18.2',
                'M32.09,62.9c6.94,0,36.08,0,45.76,0'
            ],
            voice: '008_e_lower.mp3'
        },
        'F': {
            paths: [
                'M36,17.32c0,9.1,0,63.75,0,75.02',
                'M36.43,16.8c2.31,0,21.19,0,42.15,0',
                'M36.43,52.35c2.31,0,17.19,0,38.15,0'
            ],
            voice: '008_f_upper.mp3'
        },
        'f': {
            paths: [
                'M75.92,16.8c-12.58-3.76-22.34,0.58-22.34,12.14c0,11.57,0,55.91,0,63.86',
                'M39,36.74c5.35,0,30.01,0,35.64,0'
            ],
            voice: '008_f_lower.mp3'
        }
    };

    const WORDS = [
        { word: 'APPLE', chars: ['A', 'a'], emoji: '🍎', voice: '008_word_apple.mp3' },
        { word: 'BEAR', chars: ['B', 'b'], emoji: '🐻', voice: '008_word_bear.mp3' },
        { word: 'CAT', chars: ['C', 'c'], emoji: '🐱', voice: '008_word_cat.mp3' },
        { word: 'DOG', chars: ['D', 'd'], emoji: '🐶', voice: '008_word_dog.mp3' },
        { word: 'EGG', chars: ['E', 'e'], emoji: '🥚', voice: '008_word_egg.mp3' },
        { word: 'FISH', chars: ['F', 'f'], emoji: '🐟', voice: '008_word_fish.mp3' }
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
        
        // 初回のみイントロ再生
        setTimeout(() => {
            soundIntro.play().catch(e => {});
        }, 1000);
    }

    function initWord() {
        currentCharIndex = 0;
        updateWordProgress();
        initChar();
    }

    function updateWordProgress() {
        const chars = WORDS[currentWordIndex].chars;
        wordProgress.innerHTML = '';
        for (let i = 0; i < chars.length; i++) {
            const span = document.createElement('span');
            span.textContent = chars[i];
            if (i < currentCharIndex) {
                span.className = "text-cyan-600";
            } else {
                span.className = "text-gray-300";
            }
            wordProgress.appendChild(span);
        }
    }

    function initChar() {
        const char = WORDS[currentWordIndex].chars[currentCharIndex];
        currentStrokeIndex = 0;
        resultChar.textContent = char;
        resultChar.classList.add('hidden');
        resultChar.classList.remove('success-bounce');
        svg.classList.remove('hidden');
        
        // Clear completed paths
        completedPaths.innerHTML = '';
        
        instruction.textContent = `「${char}」を なぞろう！`;
        
        // 文字の音声を再生
        const charVoiceFile = ALPHABET_DATA[char] ? ALPHABET_DATA[char].voice : '008_a_upper.mp3';
        const charVoice = new Audio(`../../static/sounds/voice/${charVoiceFile}`);
        charVoice.play().catch(e => {});

        initStroke();
    }

    function initStroke() {
        const char = WORDS[currentWordIndex].chars[currentCharIndex];
        const data = ALPHABET_DATA[char];
        if (!data) return;

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
            x: (clientX - rect.left) / rect.width * 109,
            y: (clientY - rect.top) / rect.height * 109
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
            if (dist < 18) { // 少し厳しめの判定
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
        
        // Add current stroke to completed paths
        const finishedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        finishedPath.setAttribute('d', tracedPath.getAttribute('d'));
        completedPaths.appendChild(finishedPath);
        tracedPath.setAttribute('d', '');

        currentStrokeIndex++;
        soundTap.play().catch(e=>{});

        const char = WORDS[currentWordIndex].chars[currentCharIndex];
        const data = ALPHABET_DATA[char];
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
            
            if (currentCharIndex < WORDS[currentWordIndex].chars.length) {
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
        soundWordClear.play().catch(e=>{});
        
        // 単語の読み上げ
        setTimeout(() => {
            const wordVoice = new Audio(`../../static/sounds/voice/${wordData.voice}`);
            wordVoice.play().catch(e => {});
        }, 1000);

        setTimeout(() => {
            wordFinishOverlay.classList.add('hidden');
            currentWordIndex++;
            if (currentWordIndex < 3) { // 3単語でクリア
                initWord();
            } else {
                showFinalFinish();
            }
        }, 3500);
    }

    function showFinalFinish() {
        setTimeout(() => {
            soundClear.play().catch(e=>{});
            soundGameClear.play().catch(e=>{});
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
            introPlayed = true;
        }
    };
    document.body.addEventListener('click', playIntro, { once: true });
});