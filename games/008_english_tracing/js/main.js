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

    // アルファベットのパスデータ定義 (仮のシンプルなパス)
    const ALPHABET_DATA = {
        'A': { paths: ['M 54.5 15 L 20 90', 'M 54.5 15 L 89 90', 'M 35 60 L 74 60'], voice: '008_a_upper.mp3' },
        'a': { paths: ['M 70 45 C 50 25, 20 40, 20 65 C 20 90, 50 100, 70 85', 'M 70 35 L 70 90 C 70 95, 80 95, 85 85'], voice: '008_a_lower.mp3' },
        'B': { paths: ['M 30 15 L 30 90', 'M 30 15 C 70 15, 80 30, 70 50 C 60 55, 30 50, 30 50', 'M 30 50 C 75 50, 85 70, 75 90 C 65 95, 30 90, 30 90'], voice: '008_b_upper.mp3' },
        'b': { paths: ['M 30 15 L 30 90', 'M 30 55 C 70 45, 80 75, 60 90 C 45 100, 30 90, 30 90'], voice: '008_b_lower.mp3' },
        'C': { paths: ['M 80 30 C 65 5, 20 15, 20 55 C 20 90, 60 100, 80 80'], voice: '008_c_upper.mp3' },
        'c': { paths: ['M 75 45 C 55 30, 25 40, 25 65 C 25 90, 60 95, 75 80'], voice: '008_c_lower.mp3' }
    };

    const WORDS = [
        { word: 'APPLE', chars: ['A', 'a'], emoji: '🍎', voice: '008_word_apple.mp3' },
        { word: 'BEAR', chars: ['B', 'b'], emoji: '🐻', voice: '008_word_bear.mp3' },
        { word: 'CAT', chars: ['C', 'c'], emoji: '🐱', voice: '008_word_cat.mp3' }
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
            if (currentWordIndex < WORDS.length) {
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