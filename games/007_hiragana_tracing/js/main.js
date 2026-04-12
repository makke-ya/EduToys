/**
 * ひらがななぞり書き - main.js
 */

(() => {
    const init = () => {
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

        if (!svg) return;

        const soundTap = new Audio('static/sounds/staging/短い音-ポヨン.mp3');
        const soundClear = new Audio('static/sounds/staging/ジャジャーン1.mp3');
        const soundSelect = new Audio('static/sounds/system/決定10.mp3');
        const soundIntro = new Audio('static/sounds/voice/007_intro.mp3');
        const soundWordClear = new Audio('static/sounds/voice/007_word_clear.mp3');
        const soundGameClear = new Audio('static/sounds/voice/007_clear.mp3');

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
            'う': {
                paths: [
                    'M42,15.5c5.62,2.12,9.62,3,12.88,3c8.27,0,8,1.12-0.38,5.5',
                    'M33,42.38c2.12,1.12,4.12,2.88,8.5,1.38c4.38-1.5,12.75-7.12,18.5-7c5.75,0.12,10.25,5,10.25,18c0,15.49-8.25,30.24-24.37,41.24'
                ],
                voice: '007_u.mp3'
            },
            'え': {
                paths: [
                    'M40.52,13.25c5.62,2.12,10,3,14.12,3c8.27,0,8,1.12-0.38,5.5',
                    'M32.52,45.12c1.88,1.25,4.5,1.75,7.38,0.62c3.29-1.29,17-7.88,21.25-9.88c4.25-2,8.32,0.04,4.38,4.62c-12.26,14.27-27.26,31.52-39.51,44.4c-3.26,3.42-0.58,3.54,1.5,1.37c13.5-14.12,18.12-20.12,23.62-20.12c7.13,0,3.5,16.75,6.75,22.38c3.25,5.63,19.12,3.75,26.12,2.12'
                ],
                voice: '007_e.mp3'
            },
            'お': {
                paths: [
                    'M22.88,35.12c1.38,1,3.62,2.38,6,2.12c2.38-0.26,19.62-5.12,21.12-5.74c1.5-0.62,4-1.25,5.88-2',
                    'M41.5,16.12c2.25,1,3.59,4.39,3.12,7.38c-2.5,16.12-3.37,45.53-2.25,58.38c0.75,8.62-0.64,10.45-7.12,7.12c-5.13-2.62-13.75-8-13.75-12.38c0-7.5,24.38-23.62,44.75-23.62c17.25,0,25,8.25,25,17.25c0,8.25-9.38,18.88-26.75,21',
                    'M73,22.12c5.38,2.62,8.88,5.88,10.62,8.25c2.27,3.08,0.38,4.5-1.12,5'
                ],
                voice: '007_o.mp3'
            },
            'か': {
                paths: [
                    'M24.62,38.62c1.88,1.62,4.65,2.33,8.62,1c25.5-8.5,29.5-4.13,29.5,7.62c0,9.38-1.24,17.46-4.25,25.25c-7.62,19.76-10.87,17.39-16.12,10.89',
                    'M48.5,17.5c1,1.38,1.29,4.7,0.5,7.12c-5,15.25-18.02,40.93-19.62,43.88c-3.12,5.75-6.38,11.88-9.38,16.25',
                    'M77.37,31.62c7.5,6.88,13.25,15.75,15,24.88'
                ],
                voice: '007_ka.mp3'
            },
            'き': {
                paths: [
                    'M29,32.12c1.5,0.75,3.94,1,6.5,0.62c11.38-1.62,23.12-3.88,29.5-5.38',
                    'M27.25,48.62c1.5,0.75,3.94,1,6.5,0.62c11.38-1.62,26-5,32.38-6.5',
                    'M49.38,16.88c1.12,1.38,1.38,3.5,0.75,6.12C45.25,43,33,75.12,23,85.25',
                    'M40,73.12c12.5,13.75,30.38,13,44.75,6.12'
                ],
                voice: '007_ki.mp3'
            },
            'く': {
                paths: [
                    'M60.66,15c0.5,1.62,0.35,5.44-1,7.38c-6.75,9.62-14.3,19.08-18.62,24.5c-4,5-3.79,7.03-0.88,11c5.5,7.5,12.75,18.75,17.62,27.25c1.48,2.59,2.75,4.75,4.5,8.62'
                ],
                voice: '007_ku.mp3'
            },
            'こ': { 
                paths: [
                    'M34.75,26.75c1.12,0.88,2.91,2.01,6,1.5c7.62-1.25,14.11-2.56,22.38-2.62c15.5-0.12,5.88,5-5.75,9',
                    'M30,68.12c2.25,14.5,15.26,17.96,31,16.75c6.5-0.5,11.88-1.25,17.62-2.88'
                ],
                voice: '007_ko.mp3'
            },
            'さ': {
                paths: [
                    'M27,38.9c2.42,1.33,5.38,1.47,8.32,1.06c8.79-1.24,28.67-7.76,34.15-10.43c2.79-1.36,3.78-1.91,6.28-3.53',
                    'M41.5,13.88c1.5,0.88,3.63,2.94,4.5,5.12c5.5,13.75,15.25,27.62,26.87,39.5c7.98,8.15,6.38,10-6,3.12',
                    'M35.25,80.5c4.5,11.75,20.88,12.5,38.38,7.5'
                ],
                voice: '007_sa.mp3'
            },
            'し': {
                paths: [
                    'M39.12,17.5c1.25,3.12,0.93,6.74,0.38,10.25c-2.12,13.5-3,26.5-3,39.12c0,27.38,19.88,30.12,45.5,17.25'
                ],
                voice: '007_shi.mp3'
            },
            'す': {
                paths: [
                    'M15.5,37.12c2.88,2.12,6.94,1.51,12.75,0.25c16.12-3.5,36.14-5.38,46.62-6.5c7-0.75,11.88-0.62,17.75,0.12',
                    'M57.62,13.38c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,35.12,0,40.75c0,14.62-15.62,16.38-15.62,1.75c0-14.25,18-14.12,18,6.38c0,13.25-7.75,21.5-16,28.38'
                ],
                voice: '007_su.mp3'
            },
            'せ': {
                paths: [
                    'M16.5,49.93c2.88,2.42,6.86,1.57,12.75,0.53c19-3.34,33-5.72,47.12-7.64c6.99-0.95,11.88-1.21,17.75-0.36',
                    'M69.74,17.75c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,17.88,0,23.5c0,25.62-5.75,23.25-11.88,19',
                    'M35.62,26.25c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,28.38,0,34c0,14.5,6.38,19.55,20.14,19.55c10.24,0,13.74,0.07,22.61-1.68'
                ],
                voice: '007_se.mp3'
            },
            'そ': {
                paths: [
                    'M38.4,22c1.88,1.25,4.98,1.05,7.5,0.38c6.5-1.75,13.25-3.75,19.38-5.38c4.63-1.23,7.18,2.06,3.62,5.25c-12.12,10.87-31.14,24.4-40,30.25c-6.25,4.12-5.88,5.75,1.38,3.88c17.08-4.42,35.96-8.68,50.12-10.38c9.38-1.12,9.62,0.12,0.5,1.38c-15.82,2.17-34.38,14.25-34.38,26.5c0,12.88,11.62,20.38,31.5,16.62'
                ],
                voice: '007_so.mp3'
            },
            'た': {
                paths: [
                    'M24.38,35.38c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,16.25-2.88,24.88-4.75c2.64-0.57,5.38-1.5,7.62-2.38',
                    'M45,16.88c0.75,1.25,0.87,3.62,0.38,5.25c-6.35,20.94-12.75,36.37-18.88,52.37c-1.36,3.56-4.75,11.75-6,14.62',
                    'M56.38,53.25c12.38-2.75,18.25-3.7,23.62-3.12c15.12,1.62-1.12,2.25-4.25,4.88',
                    'M54.13,82.25c4.38,7,14.25,8.12,34.5,5.62'
                ],
                voice: '007_ta.mp3'
            },
            'ち': {
                paths: [
                    'M24.5,32.62c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,18.25-4.12,26.88-6c2.64-0.57,5.38-1.5,7.62-2.38',
                    'M45.62,15.62c0.75,1.25,0.71,3.58,0.38,5.25c-3,15-4.25,22.59-8.38,38.62c-3.25,12.62-5.38,11.12,3.62,4.38c8.29-6.21,19.75-9.5,28.5-9.5c8.62,0,14.58,5.88,14.5,14.5c-0.12,13.5-16.5,20.62-29.88,23.25'
                ],
                voice: '007_chi.mp3'
            },
            'つ': {
                paths: [
                    'M14,44.75c1.88,1.62,4.68,2.09,8.12,0.62c17.88-7.62,30-11.12,44.88-10.88c12.56,0.21,22.98,7.17,22.87,19.17c-0.18,18.77-24.75,28.71-45.01,32.08'
                ],
                voice: '007_tsu.mp3'
            },
            'て': {
                paths: [
                    'M20.5,26.38c1.87,1.62,4.42,1.97,8.12,1.37c21.75-3.5,33-5.12,50.12-8.38c12.34-2.34,13-0.88,0.38,1.38c-17.89,3.19-33.78,19.12-33.78,37.62c0,20.5,17.91,30.25,35.16,30.25'
                ],
                voice: '007_te.mp3'
            },
            'と': {
                paths: [
                    'M35.5,18.38c1.74,0.74,3.62,2.62,4.12,5.37c0.5,2.75,4.75,25,5.38,28.12',
                    'M78.12,25.5c0.25,1.88,0.04,4.09-2.25,5.75c-6.37,4.63-13.22,8.49-22.75,15.25c-12.88,9.12-21.62,18.38-21.62,27.5c0,10.12,8.5,13.88,26.88,13.88c6.25,0,14.75-0.12,21.62-1.25'
                ],
                voice: '007_to.mp3'
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
            'め': {
                paths: [
                    'M45,20 L35,75',
                    'M20,50 C80,15, 90,70, 50,90 C30,95, 20,75, 20,55 C20,25, 80,25, 85,65'
                ],
                voice: '007_me.mp3'
            },
            'り': { 
                paths: [
                    'M38.75,25.25c1.25,1.5,2.24,4.03,1.62,6.62c-2.88,12.13-6.29,29.65-4.25,42.38c2,12.5,1.75-0.75,5.62-6.25',
                    'M69.37,18.75c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,0,26.38,0,35.75c0,16.5-5,25.75-12.62,33.12'
                ],
                voice: '007_ri.mp3'
            },
            'ら': {
                paths: [
                    'M35.33,15c3.75,3,9.22,4.41,16.5,4.25c11.12-0.25-0.25,2.38-1.25,3.5',
                    'M35.83,35.75c-2.14,4.34-2.79,8.67-3.11,13.24c-0.42,5.84-0.31,12.05-2.14,19.13c-3.16,12.27,1.49,4.77,3,3.5c11.88-10,21.7-12.67,32.61-12.49c9.21,0.15,16.85,5.19,16.76,13.88c-0.12,13.6-14.24,21.49-32.49,22.49'
                ],
                voice: '007_ra.mp3'
            }
        };

        const WORDS = [
            { word: 'いぬ', emoji: '🐶', voice: '007_word_inu.mp3' },
            { word: 'ねこ', emoji: '🐱', voice: '007_word_neko.mp3' },
            { word: 'あり', emoji: '🐜', voice: '007_word_ari.mp3' },
            { word: 'あめ', emoji: '☔', voice: '007_word_ame.mp3' },
            { word: 'さかな', emoji: '🐟', voice: '007_word_sakana.mp3' },
            { word: 'うし', emoji: '🐮', voice: '007_word_ushi.mp3' },
            { word: 'とり', emoji: '🐦', voice: '007_word_tori.mp3' },
            { word: 'かめ', emoji: '🐢', voice: '007_word_kame.mp3' },
            { word: 'たこ', emoji: '🐙', voice: '007_word_tako.mp3' },
            { word: 'そら', emoji: '☀️', voice: '007_word_sora.mp3' },
            { word: 'なす', emoji: '🍆', voice: '007_word_nasu.mp3' },
            { word: 'つくえ', emoji: '🪑', voice: '007_word_tsukue.mp3' },
            { word: 'きつね', emoji: '🦊', voice: '007_word_kitsune.mp3' }
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

        soundIntro.play().catch(e => {});

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
            completedPaths.innerHTML = '';
            instruction.textContent = `「${char}」を なぞろう！`;
            
            const charVoiceFile = HIRAGANA_DATA[char] ? HIRAGANA_DATA[char].voice : '007_a.mp3';
            new Audio(`static/sounds/voice/${charVoiceFile}`).play().catch(e => {});

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
            const nextIndex = Math.min(lastReachedIndex + 1, samplingPoints.length - 1);
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

        svg.addEventListener('pointerdown', (e) => {
            if (finishOverlay.classList.contains('show') || wordFinishOverlay.classList.contains('show')) return;
            isDrawing = true;
            startSynth();
            handleMove(e);
        });

        const moveHandler = (e) => handleMove(e);
        const upHandler = () => {
            isDrawing = false;
            stopSynth();
        };

        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', upHandler);

        function handleMove(e) {
            if (!isDrawing) return;
            const pos = getMousePos(e);
            
            let foundNewPoint = false;
            const searchRange = 30;
            const startSearch = lastReachedIndex + 1;
            const endSearch = Math.min(startSearch + searchRange, samplingPoints.length);

            let bestIndex = -1;
            let minDist = 30;

            for (let i = startSearch; i < endSearch; i++) {
                const p = samplingPoints[i];
                const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
                if (dist < minDist) {
                    minDist = dist;
                    bestIndex = i;
                }
            }

            if (bestIndex !== -1) {
                lastReachedIndex = bestIndex;
                foundNewPoint = true;
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
            const finishedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            finishedPath.setAttribute('d', tracedPath.getAttribute('d'));
            completedPaths.appendChild(finishedPath);
            tracedPath.setAttribute('d', '');
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
            wordFinishOverlay.classList.add('show');
            soundWordClear.play().catch(e=>{});
            setTimeout(() => {
                new Audio(`static/sounds/voice/${wordData.voice}`).play().catch(e => {});
            }, 1000);
            setTimeout(() => {
                wordFinishOverlay.classList.remove('show');
                currentWordIndex++;
                if (currentWordIndex < 3) {
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
                finishOverlay.classList.add('show');
                setupStickers();
            }, 1000);
        }

        function setupStickers() {
            if (!window.StickerSystem) return;
            const choices = document.getElementById('sticker-choices');
            choices.innerHTML = '';
            StickerSystem.drawThree().forEach(sticker => {
                const btn = document.createElement('button');
                btn.className = `sticker-btn ${sticker.data.color}`;
                btn.innerHTML = `<div class="text-5xl md:text-7xl mb-2 md:mb-4">${sticker.item}</div><div class="text-sm md:text-lg font-black" style="color:var(--color-text);">${sticker.data.label}</div>`;
                btn.addEventListener('click', () => {
                    soundSelect.play().catch(e=>{});
                    StickerSystem.saveSticker(sticker);
                    document.getElementById('sticker-selection').classList.add('hidden');
                    document.getElementById('after-selection').classList.remove('hidden');
                });
                choices.appendChild(btn);
            });
        }

        initGame();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
