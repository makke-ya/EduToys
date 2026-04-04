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
    const soundIntro = new Audio('../../static/sounds/voice/007_intro.mp3');
    const soundWordClear = new Audio('../../static/sounds/voice/007_word_clear.mp3');
    const soundGameClear = new Audio('../../static/sounds/voice/007_clear.mp3');

    // ひらがなのパスデータ定義 (KanjiVGのセンターラインデータ)
    const HIRAGANA_DATA = {
        'あ': { 
            paths: [
                'M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25c1.51-0.34,4.62-0.88,6.62-0.5',
                'M49.76,17.62c0.88,1,1.82,3.26,1.38,5.25c-3.75,16.75-6.25,38.13-5.13,53.63c0.41,5.7,1.88,10.88,3.38,13.62',
                'M65.63,44.12c0.75,1.12,1.16,4.39,0.5,6.12c-4.62,12.26-11.24,23.76-25.37,35.76c-6.86,5.83-15.88,3.75-16.25-8.38c-0.34-10.87,13.38-23.12,32.38-26.74c12.42-2.37,27,1.38,30.5,12.75c4.05,13.18-3.76,26.37-20.88,30.49'
            ],
            voice: '007_a.mp3'
        },
        'い': { 
            paths: [
                'M21.5,29.66c2.01,2.17,2.61,4.68,2.17,7.43c-3.09,19.16-1.03,32.01,7.93,41.45c6.12,6.45,6.26,3.14,7.04-5.21',
                'M72.96,36.51c9.44,8.05,17.79,18.82,18.41,33.83'
            ],
            voice: '007_i.mp3'
        },
        'か': {
            paths: [
                'M24.62,38.62c1.88,1.62,4.65,2.33,8.62,1c25.5-8.5,29.5-4.13,29.5,7.62c0,9.38-1.24,17.46-4.25,25.25c-7.62,19.76-10.87,17.39-16.12,10.89',
                'M48.5,17.5c1,1.38,1.29,4.7,0.5,7.12c-5,15.25-18.02,40.93-19.62,43.88c-3.12,5.75-6.38,11.88-9.38,16.25',
                'M77.37,31.62c7.5,6.88,13.25,15.75,15,24.88'
            ],
            voice: '007_ka.mp3'
        },
        'さ': {
            paths: [
                'M27,38.9c2.42,1.33,5.38,1.47,8.32,1.06c8.79-1.24,28.67-7.76,34.15-10.43c2.79-1.36,3.78-1.91,6.28-3.53',
                'M41.5,13.88c1.5,0.88,3.63,2.94,4.5,5.12c5.5,13.75,15.25,27.62,26.87,39.5c7.98,8.15,6.38,10-6,3.12',
                'M35.25,80.5c4.5,11.75,20.88,12.5,38.38,7.5'
            ],
            voice: '007_sa.mp3'
        },
        'な': {
            paths: [
                'M22.88,28.96c1.18,0.58,3.3,1.1,5.47,1.05c5.53-0.13,10.9-0.98,16.52-2.42c4.82-1.23,9.13-3.12,11.38-4.22',
                'M42.99,14c0.63,0.89,0.56,2.52,0.31,3.72c-2.96,14.16-7.95,26.56-14.25,37.87c-2.05,3.69-4.25,7.24-6.55,10.65',
                'M72.26,23.25c6.88,2.5,12.62,5.62,14.75,9.5c4.06,7.41-0.25,3.38-3.5,3.88',
                'M68.88,44.62c-1,1.88-2.14,5.24-1.88,8.25c0.62,7,1.5,13.12,1.5,20.62c0,20-27.88,19.75-27.88,9.38c0-5.62,8.25-8.25,13.88-8.25c8.75,0,21.5,3.25,29.75,11.5'
            ],
            voice: '007_na.mp3'
        },
        'ぬ': { 
            paths: [
                'M25.38,28.5c2,1.38,2.97,3.23,3.38,5.88c1.87,12.18,4.12,23.92,8.54,34.67c1.79,4.36,3.96,8.33,6.84,12.46',
                'M57.12,19.25c0.88,2.12,1.06,3.79,0.62,5.88c-3.12,15-13.14,39.81-18.12,48.62c-11.87,21-20.62,1.25-20.62-4.5c0-22.63,43.75-44.25,62.36-29.59c7.66,6.03,9.8,14.58,9.14,23.34c-2,26.75-32.88,28.38-32.88,16.88c0-9.38,17.38-7.12,27.12-1.12c3.1,1.91,7.25,5.25,9.5,7.5'
            ],
            voice: '007_nu.mp3'
        },
        'ね': { 
            paths: [
                'M33.29,14.5c1.62,1.62,2.1,3.21,1.88,5.88c-1.03,11.93-2.06,31.66-2.53,53.12c-0.1,4.62-0.18,9.31-0.22,14',
                'M17.16,37.88c1.62,0.88,3.25,1.38,5.62,0.75c2.14-0.56,7.8-2.31,12.37-4.03c6.26-2.35,6.88-1.47,3.12,3.63c-5.56,7.53-13.02,17.38-18.48,26.77c-5.6,9.62-3.45,8.3,2,3c19.12-18.62,38.5-39.12,54.12-39.12c11.38,0,12.88,11.25,12.88,32.5c0,28.62-30.18,24.88-30.18,16.26c0-9.63,18.73-7.82,28.06-1.88c2.75,1.75,5.88,4.88,7.5,6.75'
            ],
            voice: '007_ne.mp3'
        },
        'こ': { 
            paths: [
                'M34.75,26.75c1.12,0.88,2.91,2.01,6,1.5c7.62-1.25,14.11-2.56,22.38-2.62c15.5-0.12,5.88,5-5.75,9',
                'M30,68.12c2.25,14.5,15.26,17.96,31,16.75c6.5-0.5,11.88-1.25,17.62-2.88'
            ],
            voice: '007_ko.mp3'
        },
        'め': {
            paths: [
                'M27.48,31.75c1.75,1,2.41,3.09,2.5,5.25c0.5,11.62,2.75,23.5,7.25,31.38c1.39,2.44,5.38,8.5,7.25,10.38',
                'M59.6,19.38c1,1.5,1.35,4.12,0.88,6.62c-2.75,14.62-13.62,37.75-20.1,47.24c-12.28,17.14-16.78,13.14-22.28,0.64c-5.38-15.38,26.4-42.18,53.42-35.28c29.08,8.27,23.96,46.02-7.98,50.15'
            ],
            voice: '007_me.mp3'
        },
        'り': { 
            paths: [
                'M38.75,25.25c1.25,1.5,2.24,4.03,1.62,6.62c-2.88,12.13-6.29,29.65-4.25,42.38c2,12.5,1.75-0.75,5.62-6.25',
                'M69.37,18.75c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,0,26.38,0,35.75c0,16.5-5,25.75-12.62,33.12'
            ],
            voice: '007_ri.mp3'
        }
    };

    const WORDS = [
        { word: 'いぬ', emoji: '🐶', voice: '007_word_inu.mp3' },
        { word: 'ねこ', emoji: '🐱', voice: '007_word_neko.mp3' },
        { word: 'あり', emoji: '🐜', voice: '007_word_ari.mp3' },
        { word: 'あめ', emoji: '☔', voice: '007_word_ame.mp3' },
        { word: 'さかな', emoji: '🐟', voice: '007_word_sakana.mp3' }
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
        
        // 文字の音声を再生
        const charVoice = new Audio(`../../static/sounds/voice/${HIRAGANA_DATA[char].voice}`);
        charVoice.play().catch(e => {});

        initStroke();
    }

    function initStroke() {
        const char = WORDS[currentWordIndex].word[currentCharIndex];
        const data = HIRAGANA_DATA[char];
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
            if (dist < 24) { // ゆるめの判定 (24/109)
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
            // BGM等の初期化が必要ならここ
        }
    };
    document.body.addEventListener('click', playIntro, { once: true });
});