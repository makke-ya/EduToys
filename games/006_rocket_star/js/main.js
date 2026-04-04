/**
 * ほしあつめロケット - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const stage = document.getElementById('game-stage');
    const rocket = document.getElementById('rocket');
    const instruction = document.getElementById('instruction');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundCollect = new Audio('../../static/sounds/system/正解1.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/006_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/006_clear.mp3');

    let currentRound = 0;
    const TOTAL_ROUNDS = 3;
    let stars = [];
    let isDragging = false;
    let isTransitioning = false;
    let isFinished = false;

    // ロケットの物理状態
    let rocketX = 50, rocketY = 80;
    let targetX = 50, targetY = 80;
    let rocketRotation = 0;

    function initRound() {
        isTransitioning = true;
        isDragging = false;
        stage.querySelectorAll('.star').forEach(s => s.remove());
        stage.querySelectorAll('.particle').forEach(p => p.remove());
        stars = [];

        instruction.textContent = `おほしさまを あつめよう！ (${currentRound + 1}/${TOTAL_ROUNDS})`;

        rocketX = 50; rocketY = 120;
        targetX = 50; targetY = 80;
        
        const starCount = 6 + currentRound * 3;
        for (let i = 0; i < starCount; i++) {
            createStar();
        }

        setTimeout(() => {
            isTransitioning = false;
            if (currentRound === 0) {
                soundIntro.play().catch(e => {});
            }
        }, 1000);
    }

    function createStar() {
        const star = document.createElement('div');
        star.className = 'star';
        star.innerHTML = '⭐';
        const x = Math.random() * 80 + 10;
        const y = Math.random() * 65 + 15;
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        stage.appendChild(star);
        stars.push({ el: star, x, y, collected: false });
    }

    function update() {
        if (isFinished) return;

        const easing = isDragging ? 0.15 : 0.05;
        const dx = targetX - rocketX;
        const dy = targetY - rocketY;
        
        rocketX += dx * easing;
        rocketY += dy * easing;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            const da = (angle - rocketRotation + 540) % 360 - 180;
            rocketRotation += da * 0.2;
        }

        rocket.style.left = `calc(${rocketX}% - 3rem)`;
        rocket.style.top = `calc(${rocketY}% - 3rem)`;
        rocket.style.transform = `rotate(${rocketRotation}deg)`;

        if (!isTransitioning) {
            checkCollisions();
            if (isDragging && Math.random() > 0.3) {
                createParticle(rocketX, rocketY, rocketRotation);
            }
        }
        requestAnimationFrame(update);
    }

    function createParticle(x, y, rot) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 10 + 5;
        p.style.width = `${size}px`; p.style.height = `${size}px`;
        const offsetRad = (rot + 90) * (Math.PI / 180);
        const px = x + Math.cos(offsetRad) * 5;
        const py = y + Math.sin(offsetRad) * 5;
        p.style.left = `${px}%`; p.style.top = `${py}%`;
        stage.appendChild(p);
        p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 0.8 },
            { transform: `translate(${(Math.random()-0.5)*40}px, ${20 + Math.random()*40}px) scale(0)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-out' }).onfinish = () => p.remove();
    }

    function checkCollisions() {
        if (isTransitioning || isFinished) return;
        stars.forEach(star => {
            if (star.collected) return;
            const dist = Math.hypot(star.x - rocketX, star.y - rocketY);
            if (dist < 10) {
                collectStar(star);
            }
        });
    }

    function collectStar(star) {
        if (isTransitioning || isFinished) return;
        star.collected = true;
        star.el.classList.add('star-collected');
        soundCollect.currentTime = 0;
        soundCollect.play().catch(e => {});

        if (stars.every(s => s.collected)) {
            completeRound();
        }
    }

    function completeRound() {
        if (isTransitioning) return;
        isTransitioning = true;
        isDragging = false;
        
        // はなまるを表示 (明示的にIDを指定)
        try {
            GameUtils.showHanamaru('game-container');
        } catch(e) { console.error(e); }

        setTimeout(() => {
            if (currentRound < TOTAL_ROUNDS - 1) {
                currentRound++;
                initRound();
            } else {
                finishGame();
            }
        }, 2500);
    }

    function finishGame() {
        isFinished = true;
        isTransitioning = false;
        soundClear.play().catch(e => {});
        soundClearVoice.play().catch(e => {});
        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            setupStickers();
        }, 1500);
    }

    function setupStickers() {
        const choices = document.getElementById('sticker-choices');
        choices.innerHTML = '';
        StickerSystem.drawThree().forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = `flex flex-col items-center justify-center p-8 rounded-[40px] border-4 ${sticker.data.color} shadow-2xl hover:scale-110 transition-transform bg-white/90`;
            btn.innerHTML = `<div class="text-7xl mb-4">${sticker.item}</div><div class="text-lg font-black text-gray-800">${sticker.data.label}</div>`;
            btn.addEventListener('click', () => {
                soundSelect.play().catch(e => {});
                StickerSystem.saveSticker(sticker);
                document.getElementById('sticker-selection').classList.add('hidden');
                document.getElementById('after-selection').classList.remove('hidden');
            });
            choices.appendChild(btn);
        });
    }

    function onMove(e) {
        if (!isDragging || isTransitioning || isFinished) return;
        const rect = container.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        targetX = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
        targetY = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    }

    container.addEventListener('pointerdown', (e) => {
        if (isTransitioning || isFinished) return;
        isDragging = true;
        container.setPointerCapture(e.pointerId);
        onMove(e);
        soundTap.play().catch(e => {});
    });

    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerup', () => isDragging = false);

    initRound();
    update();
});
