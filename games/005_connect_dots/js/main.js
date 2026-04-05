/**
 * てんつなぎ - main.js
 */

(() => {
    const init = () => {
        const svg = document.getElementById('dots-svg');
        const dotsGroup = document.getElementById('dots-group');
        const bgPath = document.getElementById('bg-path');
        const guidePath = document.getElementById('guide-path');
        const tracedPath = document.getElementById('traced-path');
        const targetDot = document.getElementById('target-dot');
        const goalIllustration = document.getElementById('goal-illustration');
        const finishOverlay = document.getElementById('finish-overlay');
        const instruction = document.getElementById('instruction');

        if (!svg) return;

        const soundTap = new Audio('static/sounds/staging/短い音-ポヨン.mp3');
        const soundClear = new Audio('static/sounds/staging/ジャジャーン1.mp3');
        const soundSelect = new Audio('static/sounds/system/決定10.mp3');
        const soundIntro = new Audio('static/sounds/voice/005_intro.mp3');
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
            const freq = 330 + (330 * progress);
            oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.05);
            gainNode.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.05);
        }

        function stopSynth() {
            if (gainNode) gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
            if (oscillator) {
                oscillator.stop(audioCtx.currentTime + 0.1);
                oscillator = null;
            }
        }

        const SHAPES = [
            { name: 'おうち', dots: [{x:20,y:80}, {x:20,y:45}, {x:50,y:15}, {x:80,y:45}, {x:80,y:80}, {x:20,y:80}] },
            { name: 'おほしさま', dots: [{x:50,y:10}, {x:61,y:35}, {x:88,y:35}, {x:66,y:52}, {x:75,y:77}, {x:50,y:60}, {x:25,y:77}, {x:34,y:52}, {x:12,y:35}, {x:39,y:35}, {x:50,y:10}] },
            { name: 'しかく', dots: [{x:20,y:20}, {x:80,y:20}, {x:80,y:80}, {x:20,y:80}, {x:20,y:20}] },
            { name: 'さんかく', dots: [{x:50,y:15}, {x:85,y:85}, {x:15,y:85}, {x:50,y:15}] },
            { name: 'ダイヤモンド', dots: [{x:50,y:10}, {x:90,y:50}, {x:50,y:90}, {x:10,y:50}, {x:50,y:10}] }
        ];

        let sessionShapes = [];
        let currentShapeIndex = 0;
        let isDrawing = false;
        let samplingPoints = [];
        let lastReachedIndex = -1;

        soundIntro.play().catch(e=>{});

        function initGame() {
            sessionShapes = SHAPES.sort(() => Math.random() - 0.5).slice(0, 3);
            currentShapeIndex = 0;
            loadShape();
        }

        function loadShape() {
            const shape = sessionShapes[currentShapeIndex];
            const d = "M " + shape.dots.map(p => `${p.x} ${p.y}`).join(" L ");
            
            bgPath.setAttribute('d', d);
            guidePath.setAttribute('d', d);
            tracedPath.setAttribute('d', '');
            goalIllustration.setAttribute('d', d);
            goalIllustration.classList.remove('illustration-fadein');
            
            instruction.textContent = `${shape.name}を なぞろう！ (${currentShapeIndex + 1}/3)`;

            const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tempPath.setAttribute('d', d);
            svg.appendChild(tempPath);
            const length = tempPath.getTotalLength();
            
            samplingPoints = [];
            const step = 2;
            for (let i = 0; i <= length; i += step) {
                samplingPoints.push(tempPath.getPointAtLength(i));
            }
            svg.removeChild(tempPath);
            
            lastReachedIndex = -1;
            renderDots(shape);
            updateTargetDot();
        }

        function renderDots(shape) {
            dotsGroup.innerHTML = '';
            shape.dots.forEach((dot, index) => {
                if (index > 0 && dot.x === shape.dots[0].x && dot.y === shape.dots[0].y) return;
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', dot.x);
                circle.setAttribute('cy', dot.y);
                circle.setAttribute('r', 3);
                circle.setAttribute('fill', 'white');
                circle.setAttribute('stroke', '#4caf50');
                circle.setAttribute('stroke-width', 1);
                dotsGroup.appendChild(circle);
            });
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
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) / rect.width * 100,
                y: (clientY - rect.top) / rect.height * 100
            };
        }

        svg.addEventListener('pointerdown', (e) => {
            if (!finishOverlay.classList.contains('hidden')) return;
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
            const searchRange = 25;
            const startSearch = lastReachedIndex + 1;
            const endSearch = Math.min(startSearch + searchRange, samplingPoints.length);

            for (let i = startSearch; i < endSearch; i++) {
                const p = samplingPoints[i];
                const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
                if (dist < 18) {
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
                    completeShape();
                }
            } else {
                if (gainNode) gainNode.gain.setTargetAtTime(0.02, audioCtx.currentTime, 0.1);
            }
        }

        function completeShape() {
            isDrawing = false;
            stopSynth();
            soundTap.play().catch(e=>{});
            
            goalIllustration.classList.add('illustration-fadein');
            GameUtils.showHanamaru('game-container');

            setTimeout(() => {
                currentShapeIndex++;
                if (currentShapeIndex < sessionShapes.length) {
                    loadShape();
                } else {
                    showFinalFinish();
                }
            }, 2000);
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

        initGame();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
