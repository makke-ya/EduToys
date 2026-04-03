/**
 * ほしあつめロケット - main.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('game-stage');
    const rocket = document.getElementById('rocket');
    const instruction = document.getElementById('instruction');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundCollect = new Audio('../../static/sounds/staging/短い音-キラキラ1.mp3');
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

    // ロケットの状態
    let rocketPos = { x: 50, y: 80 }; // パーセント
    let targetPos = { x: 50, y: 80 };

    function initRound() {
        isTransitioning = false;
        isDragging = false;
        stage.querySelectorAll('.star').forEach(s => s.remove());
        stars = [];

        instruction.textContent = `おほしさまを あつめよう！ (${currentRound + 1}/${TOTAL_ROUNDS})`;

        // ロケットを初期位置へ
        rocketPos = { x: 50, y: 85 };
        updateRocketElement();

        // 星を生成
        const starCount = 5 + currentRound * 2;
        for (let i = 0; i < starCount; i++) {
            createStar();
        }

        if (currentRound === 0) {
            soundIntro.play().catch(e => {});
        }
    }

    function createStar() {
        const star = document.createElement('div');
        star.className = 'star';
        star.innerHTML = '⭐';
        
        // 重なりすぎないようにランダム配置
        const x = Math.random() * 80 + 10;
        const y = Math.random() * 60 + 10;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.dataset.collected = 'false';

        stage.appendChild(star);
        stars.push({
            el: star,
            x: x,
            y: y,
            collected: false
        });
    }

    function updateRocketElement() {
        rocket.style.left = `calc(${rocketPos.x}% - 2.5rem)`;
        rocket.style.top = `calc(${rocketPos.y}% - 2.5rem)`;
    }

    // パーティクル生成
    function createParticle(x, y) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 8 + 4;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${x}%`;
        p.style.top = `${y}%`;
        
        stage.appendChild(p);

        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 50 + 20;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;

        p.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
        ], {
            duration: 800,
            easing: 'ease-out'
        }).onfinish = () => p.remove();
    }

    function handleMove(e) {
        if (!isDragging || isTransitioning || isFinished) return;

        const rect = stage.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        rocketPos.x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
        rocketPos.y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));

        updateRocketElement();
        checkCollisions();

        // 移動中に火花を散らす
        if (Math.random() > 0.5) {
            createParticle(rocketPos.x, rocketPos.y + 5);
        }
    }

    function checkCollisions() {
        stars.forEach(star => {
            if (star.collected) return;

            const dx = star.x - rocketPos.x;
            const dy = star.y - rocketPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 8) { // 当たり判定半径
                collectStar(star);
            }
        });
    }

    function collectStar(star) {
        star.collected = true;
        star.el.classList.add('star-collected');
        
        soundCollect.currentTime = 0;
        soundCollect.play().catch(e => {});

        // 全て集めたかチェック
        if (stars.every(s => s.collected)) {
            completeRound();
        }
    }

    function completeRound() {
        isTransitioning = true;
        isDragging = false;
        GameUtils.showHanamaru();

        setTimeout(() => {
            currentRound++;
            if (currentRound < TOTAL_ROUNDS) {
                initRound();
            } else {
                finishGame();
            }
        }, 2500);
    }

    function finishGame() {
        isFinished = true;
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
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-lg hover:scale-110 transition-transform bg-white/90 backdrop-blur-sm`;
            btn.innerHTML = `<div class="text-6xl mb-2">${sticker.item}</div><div class="text-sm font-bold text-gray-800">${sticker.data.label}</div>`;
            btn.addEventListener('click', () => {
                soundSelect.play().catch(e => {});
                StickerSystem.saveSticker(sticker);
                document.getElementById('sticker-selection').classList.add('hidden');
                document.getElementById('after-selection').classList.remove('hidden');
            });
            choices.appendChild(btn);
        });
    }

    // イベントリスナー
    rocket.addEventListener('pointerdown', (e) => {
        if (isTransitioning || isFinished) return;
        isDragging = true;
        rocket.setPointerCapture(e.pointerId);
        soundTap.play().catch(e => {});
    });

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', () => isDragging = false);

    initRound();
});
