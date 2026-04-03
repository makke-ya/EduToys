/**
 * てんつなぎ - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('dots-svg');
    const dotsGroup = document.getElementById('dots-group');
    const linesPath = document.getElementById('lines-path');
    const guidePath = document.getElementById('guide-path');
    const goalIllustration = document.getElementById('goal-illustration');
    const finishOverlay = document.getElementById('finish-overlay');
    const instruction = document.getElementById('instruction');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/005_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');

    let audioCtx = null;
    let oscillator = null;
    let gainNode = null;

    function startSynth() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (oscillator) return;
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
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
    let currentTargetIndex = 0;
    let pathData = "";
    let isDrawing = false;
    let samplingPoints = [];
    let lastReachedIndexInSegment = -1;

    function initGame() {
        sessionShapes = SHAPES.sort(() => Math.random() - 0.5).slice(0, 3);
        currentShapeIndex = 0;
        loadShape();
    }

    function loadShape() {
        const shape = sessionShapes[currentShapeIndex];
        currentTargetIndex = 0;
        pathData = "";
        linesPath.setAttribute('d', "");
        
        // 全体のガイドパスをセット
        const dGuide = "M " + shape.dots.map(d => `${d.x} ${d.y}`).join(" L ") + " Z";
        guidePath.setAttribute('d', dGuide);
        
        goalIllustration.classList.remove('illustration-fadein');
        goalIllustration.setAttribute('d', dGuide);
        instruction.textContent = `${shape.name}を なぞろう！ (${currentShapeIndex + 1}/3)`;

        renderDots();
        initSegmentSampling();
    }

    function renderDots() {
        const shape = sessionShapes[currentShapeIndex];
        dotsGroup.innerHTML = '';
        shape.dots.forEach((dot, index) => {
            // 重なる点は1つだけ描画
            if (index > 0 && dot.x === shape.dots[0].x && dot.y === shape.dots[0].y) return;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'dot-marker');
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', dot.x); circle.setAttribute('cy', dot.y); circle.setAttribute('r', 3);
            circle.setAttribute('fill', 'white'); circle.setAttribute('stroke', '#4caf50'); circle.setAttribute('stroke-width', 1);
            
            // 番号は削除
            g.appendChild(circle);
            dotsGroup.appendChild(g);
        });
        updateDotsStatus();
    }

    function initSegmentSampling() {
        const shape = sessionShapes[currentShapeIndex];
        const p1 = shape.dots[currentTargetIndex];
        const p2 = shape.dots[currentTargetIndex + 1];
        if (!p2) return;

        samplingPoints = [];
        const steps = 30; // 密度を上げて滑らかに
        for (let i = 0; i <= steps; i++) {
            samplingPoints.push({
                x: p1.x + (p2.x - p1.x) * (i / steps),
                y: p1.y + (p2.y - p1.y) * (i / steps)
            });
        }
        lastReachedIndexInSegment = -1;
    }

    function updateDotsStatus() {
        const markers = dotsGroup.querySelectorAll('.dot-marker');
        markers.forEach((m, i) => {
            const circle = m.querySelector('circle');
            if (i < currentTargetIndex) {
                circle.setAttribute('class', 'dot-reached');
                m.classList.remove('dot-active');
            } else if (i === currentTargetIndex) {
                m.classList.add('dot-active');
                circle.setAttribute('fill', '#fff9c4');
                circle.setAttribute('r', 5); // ターゲットを少し大きく
            } else {
                m.classList.remove('dot-active');
                circle.setAttribute('r', 3);
            }
        });
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
        if (finishOverlay.classList.contains('hidden') === false) return;
        const pos = getMousePos(e);
        const shape = sessionShapes[currentShapeIndex];
        const startDot = shape.dots[currentTargetIndex];
        const dist = Math.hypot(startDot.x - pos.x, startDot.y - pos.y);
        if (dist < 15) {
            isDrawing = true;
            startSynth();
        }
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        
        let foundNewPoint = false;
        const searchRange = 8;
        const startSearch = lastReachedIndexInSegment + 1;
        const endSearch = Math.min(startSearch + searchRange, samplingPoints.length);

        for (let i = startSearch; i < endSearch; i++) {
            const p = samplingPoints[i];
            const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
            if (dist < 12) {
                lastReachedIndexInSegment = i;
                foundNewPoint = true;
            }
        }

        if (foundNewPoint) {
            const progress = lastReachedIndexInSegment / (samplingPoints.length - 1);
            updateSynth(progress);
            renderCurrentProgress();

            if (lastReachedIndexInSegment >= samplingPoints.length - 1) {
                completeSegment();
            }
        } else {
            if (gainNode) gainNode.gain.setTargetAtTime(0.02, audioCtx.currentTime, 0.1);
        }
    });

    window.addEventListener('pointerup', () => {
        isDrawing = false;
        stopSynth();
    });

    function renderCurrentProgress() {
        const shape = sessionShapes[currentShapeIndex];
        const currentP = samplingPoints[lastReachedIndexInSegment];
        let d = pathData;
        if (currentTargetIndex === 0) {
            d = `M ${shape.dots[0].x} ${shape.dots[0].y} L ${currentP.x} ${currentP.y}`;
        } else {
            d += ` L ${currentP.x} ${currentP.y}`;
        }
        linesPath.setAttribute('d', d);
    }

    function completeSegment() {
        const shape = sessionShapes[currentShapeIndex];
        const p2 = shape.dots[currentTargetIndex + 1];
        
        if (currentTargetIndex === 0) {
            pathData = `M ${shape.dots[0].x} ${shape.dots[0].y} L ${p2.x} ${p2.y}`;
        } else {
            pathData += ` L ${p2.x} ${p2.y}`;
        }
        linesPath.setAttribute('d', pathData);
        
        soundTap.currentTime = 0;
        soundTap.play().catch(e=>{});

        currentTargetIndex++;
        updateDotsStatus();

        if (currentTargetIndex >= shape.dots.length - 1) {
            finishSingleShape();
        } else {
            initSegmentSampling();
        }
    }

    function finishSingleShape() {
        isDrawing = false;
        stopSynth();
        goalIllustration.classList.add('illustration-fadein');
        GameUtils.showHanamaru();
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
    soundIntro.play().catch(e=>{});
});
