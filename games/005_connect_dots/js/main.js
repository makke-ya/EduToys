/**
 * てんつなぎ - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const svg = document.getElementById('dots-svg');
    const dotsGroup = document.getElementById('dots-group');
    const linesPath = document.getElementById('lines-path');
    const activeLine = document.getElementById('active-line');
    const goalIllustration = document.getElementById('goal-illustration');
    const finishOverlay = document.getElementById('finish-overlay');
    const instruction = document.getElementById('instruction');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/005_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');

    // なぞる音のシンセサイザー
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
        // 330Hz (E4) から 660Hz (E5) まで上昇
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

    // 形状データ定義
    const SHAPES = [
        {
            name: 'おうち',
            dots: [{x:20,y:80}, {x:20,y:45}, {x:50,y:15}, {x:80,y:45}, {x:80,y:80}, {x:20,y:80}]
        },
        {
            name: 'おほしさま',
            dots: [{x:50,y:10}, {x:61,y:35}, {x:88,y:35}, {x:66,y:52}, {x:75,y:77}, {x:50,y:60}, {x:25,y:77}, {x:34,y:52}, {x:12,y:35}, {x:39,y:35}, {x:50,y:10}]
        },
        {
            name: 'しかく',
            dots: [{x:20,y:20}, {x:80,y:20}, {x:80,y:80}, {x:20,y:80}, {x:20,y:20}]
        },
        {
            name: 'さんかく',
            dots: [{x:50,y:15}, {x:85,y:85}, {x:15,y:85}, {x:50,y:15}]
        },
        {
            name: 'ダイヤモンド',
            dots: [{x:50,y:10}, {x:90,y:50}, {x:50,y:90}, {x:10,y:50}, {x:50,y:10}]
        }
    ];

    let sessionShapes = [];
    let currentShapeIndex = 0;
    let currentTargetIndex = 0;
    let pathData = "";
    let isDragging = false;

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
        activeLine.classList.add('hidden');
        goalIllustration.classList.remove('illustration-fadein');
        goalIllustration.setAttribute('d', "M " + shape.dots.map(d => `${d.x} ${d.y}`).join(" L ") + " Z");
        
        instruction.textContent = `${shape.name}を つくろう！ (${currentShapeIndex + 1}/3)`;

        // 点を描画
        dotsGroup.innerHTML = '';
        shape.dots.forEach((dot, index) => {
            // 最後の点は開始点と同じなのでラベルは出さない
            if (index > 0 && dot.x === shape.dots[0].x && dot.y === shape.dots[0].y) return;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'dot-marker');
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', dot.x);
            circle.setAttribute('cy', dot.y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', 'white');
            circle.setAttribute('stroke', '#4caf50');
            circle.setAttribute('stroke-width', 1);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', dot.x);
            text.setAttribute('y', dot.y + 1);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', '4');
            text.setAttribute('class', 'dot-label');
            text.textContent = index + 1;

            g.appendChild(circle);
            g.appendChild(text);
            dotsGroup.appendChild(g);
        });

        updateDotsStatus();
    }

    function updateDotsStatus() {
        const markers = dotsGroup.querySelectorAll('.dot-marker');
        markers.forEach((m, i) => {
            const circle = m.querySelector('circle');
            if (i < currentTargetIndex) {
                circle.setAttribute('class', 'dot-reached');
            } else if (i === currentTargetIndex) {
                m.classList.add('dot-active');
                circle.setAttribute('fill', '#fff9c4');
            } else {
                m.classList.remove('dot-active');
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
        const pos = getMousePos(e);
        const shape = sessionShapes[currentShapeIndex];
        const startDot = shape.dots[currentTargetIndex];
        
        // ターゲット点の近くから開始したか
        const dist = Math.hypot(startDot.x - pos.x, startDot.y - pos.y);
        if (dist < 10) {
            isDragging = true;
            activeLine.setAttribute('x1', startDot.x);
            activeLine.setAttribute('y1', startDot.y);
            activeLine.setAttribute('x2', pos.x);
            activeLine.setAttribute('y2', pos.y);
            activeLine.classList.remove('hidden');
            startSynth();
        }
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const pos = getMousePos(e);
        const shape = sessionShapes[currentShapeIndex];
        const nextDot = shape.dots[currentTargetIndex + 1];
        const startDot = shape.dots[currentTargetIndex];

        activeLine.setAttribute('x2', pos.x);
        activeLine.setAttribute('y2', pos.y);

        // 次の点に近づいたか
        const distToNext = Math.hypot(nextDot.x - pos.x, nextDot.y - pos.y);
        
        // 進捗計算（音程用）
        const segmentTotal = Math.hypot(nextDot.x - startDot.x, nextDot.y - startDot.y);
        const progress = Math.max(0, Math.min(1, 1 - (distToNext / segmentTotal)));
        updateSynth(progress);

        if (distToNext < 8) {
            completeSegment();
        }
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
        activeLine.classList.add('hidden');
        stopSynth();
    });

    function completeSegment() {
        const shape = sessionShapes[currentShapeIndex];
        const startDot = shape.dots[currentTargetIndex];
        const nextDot = shape.dots[currentTargetIndex + 1];

        if (currentTargetIndex === 0) {
            pathData = `M ${startDot.x} ${startDot.y} L ${nextDot.x} ${nextDot.y}`;
        } else {
            pathData += ` L ${nextDot.x} ${nextDot.y}`;
        }
        linesPath.setAttribute('d', pathData);
        
        soundTap.currentTime = 0;
        soundTap.play().catch(e=>{});

        currentTargetIndex++;
        updateDotsStatus();

        if (currentTargetIndex >= shape.dots.length - 1) {
            finishSingleShape();
        } else {
            // 次のセグメントの準備
            activeLine.setAttribute('x1', nextDot.x);
            activeLine.setAttribute('y1', nextDot.y);
        }
    }

    function finishSingleShape() {
        isDragging = false;
        activeLine.classList.add('hidden');
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
            const btn = document.createElementNS ? document.createElement('button') : null;
            if(!btn) return;
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
