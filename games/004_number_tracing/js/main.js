/**
 * すうじをなぞろう - main.js
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

        if (!svg) return;

        const soundTap = new Audio('static/sounds/staging/短い音-ポヨン.mp3');
        const soundClear = new Audio('static/sounds/staging/ジャジャーン1.mp3');
        const soundSelect = new Audio('static/sounds/system/決定10.mp3');
        const soundIntro = new Audio('static/sounds/voice/004_intro.mp3');
        const soundClearVoice = new Audio('static/sounds/voice/clear.mp3');

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

        // 0-9 全てのパスデータ定義 (KanjiVGのセンターラインデータ)
        const NUMBER_DATA = {
            '0': { paths: ['M54.89,15.5c-10.26,0-27.89,8.82-27.89,38.15c0,29.33,15.46,38.58,28.32,38.58c12.86,0,27.6-10.69,27.6-38.73c0.01-28.03-15.02-38-28.03-38'] },
            '1': { paths: ['M40.5,31.97c6.5-2.02,17.3-9.54,20.63-16.47c0,11.71,0,71.27,0,77.34'] },
            '2': { paths: ['M30.51,35.83c2.93-14.12,14.92-20.05,25.33-20.05c13.87,0,25.18,5.64,25.18,19.06c0,14.74-6.25,22.99-53.52,55.89c12.28,0,49.25,0,56.05,0'] },
            '3': { paths: ['M32.23,28.07c3.61-7.23,13.73-12.39,23.37-12.39c15.36,0,23.16,6.78,23.16,15.88c0,8.96-3.61,18.61-22.98,18.33c-6.44-0.1-6.37,0.27,0,0c20.81-0.87,27.46,8.53,27.46,20.81c0,11.99-12.86,21.68-26.73,21.68c-13.87,0-24.38-5.67-29.01-13.18'] },
            '4': { paths: ['M60.96,16.08c-5.06,9.1-28.1,48.04-34.46,58.45c14.16,0,50.53,0,57.03,0', 'M66.55,47.33c0,7.23,0,38.76,0,45.11'] },
            '5': { paths: ['M34.49,16.94c4.62,0,39.08,0,45.58,0', 'M34.49,16.94c-0.29,7.51-1.66,30.19-2.1,38.57c8.67-7.66,15.75-12.27,27.21-12.27c13.69,0,24.45,6.76,24.45,23.22c0,16.96-13.49,25.67-26.64,25.67c-12.01,0-22.99-3.94-28.91-12.1'] },
            '6': { paths: ['M67.87,15.79c-14.6,9.39-38.87,23.99-38.87,53.61c0,15.14,14.02,23.02,27.86,23.02c15.17,0,26.9-8.48,26.9-25.4c0-14.93-11.47-23.92-26.15-23.92c-17.05,0-28.61,10.26-28.61,26.3'] },
            '7': { paths: ['M25.5,17.81c0,3.61,0,13.01,0,17.34', 'M26.61,17.15c5.35,0,46.48,0,53.71,0c-8.09,18.36-29.36,67.56-32.54,75.5'] },
            '8': { paths: ['M82.19,31.68c0.29,3.03-24.19,14.34-27.75,16.33c-13.43,7.52-26.44,12.28-26.44,25.29c0,10.98,8.67,18.86,26.16,18.86c18.21,0,28.76-8.28,28.76-19.11c0-12.03-12.88-17.77-27.6-24.75c-14.02-6.65-24.13-8.67-23.99-18.93c0.12-8.67,8.82-13.73,22.98-13.73c14.16,0,27.31,6.94,29.19,21.68'] },
            '9': { paths: ['M77.1,31.68c0.72-7.08-1.59-16.47-16.91-16.47c-15.32,0-35.69,12.14-35.69,30.49c0,11.13,10.8,14.63,16.44,14.63c5.64,0,26.81-3.31,34.65-23.31c2.89-7.37,8.98-19.31,3.32-5.2c-8.17,20.38-20.12,48.94-24.74,60.79'] }
        };

        let selectedNumbers = []; // 今回書く3つの数字
        let currentIndexInSession = 0; // 3つのうち何番目か
        let currentStrokeIndex = 0;
        let isDrawing = false;
        let samplingPoints = [];
        let lastReachedIndex = -1;

        soundIntro.play().catch(e=>{});

        function initGame() {
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
            
            completedPaths.innerHTML = '';
            
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
            const voice = new Audio(`static/sounds/voice/num_${num}.mp3`);
            voice.play().catch(e=>{});

            try {
                GameUtils.showHanamaru('game-container');
            } catch(e) { console.error(e); }
            
            setTimeout(() => {
                currentIndexInSession++;
                if (currentIndexInSession < selectedNumbers.length) {
                    initNumber();
                } else {
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
        const upHandler = () => {
            isDrawing = false;
            stopSynth();
        };
        window.addEventListener('pointerup', upHandler);

        initGame();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
