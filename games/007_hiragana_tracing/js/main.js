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

    // ひらがなのパスデータ定義 (Cubic Bezier: C x1 y1, x2 y2, x y)
    const HIRAGANA_DATA = {
        'あ': { 
            paths: [
                'M 20 40 L 80 40', // 1画目: 横棒
                'M 50 15 C 50 40, 45 60, 40 85', // 2画目: 縦棒
                'M 60 25 C 60 85, 20 85, 20 55 C 20 25, 80 25, 80 65 C 80 85, 50 90, 40 85' // 3画目: のの字
            ],
            voice: '007_a.mp3'
        },
        'い': { 
            paths: [
                'M 25 30 C 25 60, 30 85, 45 80', // 1画目
                'M 75 35 C 75 50, 70 70, 65 75' // 2画目
            ],
            voice: '007_i.mp3'
        },
        'か': {
            paths: [
                'M 25 35 C 55 25, 85 40, 75 80 C 70 85, 65 85, 60 80', // 1画目: 左から右へ、曲がって下へ
                'M 45 15 L 40 75', // 2画目: 斜め縦棒
                'M 65 25 C 75 25, 85 30, 85 40' // 3画目: 右上の点
            ],
            voice: '007_ka.mp3'
        },
        'さ': {
            paths: [
                'M 25 35 L 75 35', // 1画目: 横棒
                'M 55 15 C 55 50, 45 75, 30 85', // 2画目: 縦棒（少し斜め）
                'M 35 75 C 50 85, 75 80, 80 65' // 3画目: 下のカーブ
            ],
            voice: '007_sa.mp3'
        },
        'な': {
            paths: [
                'M 25 30 L 50 30', // 1画目: 横棒
                'M 35 15 L 35 55', // 2画目: 縦棒
                'M 65 20 C 75 20, 85 25, 85 35', // 3画目: 右上の点
                'M 60 40 C 60 85, 30 85, 30 65 C 30 45, 80 45, 80 75 C 80 90, 65 95, 55 90' // 4画目: 結び
            ],
            voice: '007_na.mp3'
        },
        'ぬ': { 
            paths: [
                'M 40 20 L 50 75', // 1画目: 縦棒
                'M 25 45 C 75 10, 85 60, 50 85 C 30 95, 20 70, 20 50 C 20 20, 80 20, 80 65 C 80 85, 90 85, 95 65' // 2画目: 複雑なループ
            ],
            voice: '007_nu.mp3'
        },
        'ね': { 
            paths: [
                'M 30 15 L 30 85', // 1画目: 縦棒
                'M 20 40 L 70 30 C 70 65, 30 65, 30 45 C 30 20, 80 20, 80 60 C 80 85, 90 85, 95 65' // 2画目: ジグザグとループ
            ],
            voice: '007_ne.mp3'
        },
        'こ': { 
            paths: [
                'M 30 30 C 50 25, 75 30, 75 40', // 1画目
                'M 25 75 C 45 85, 70 85, 80 75' // 2画目
            ],
            voice: '007_ko.mp3'
        },
        'め': {
            paths: [
                'M 45 20 L 35 75', // 1画目: 短い縦棒
                'M 20 50 C 80 15, 90 70, 50 90 C 30 95, 20 75, 20 55 C 20 25, 80 25, 85 65' // 2画目: 大きな円
            ],
            voice: '007_me.mp3'
        },
        'り': { 
            paths: [
                'M 30 30 C 30 60, 35 80, 45 80', // 1画目
                'M 70 20 C 70 60, 60 85, 50 90' // 2画目
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
            if (dist < 22) { // ゆるめの判定
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