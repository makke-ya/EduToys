document.addEventListener('DOMContentLoaded', () => {
    const silhouette = document.getElementById('silhouette');
    const choicesContainer = document.getElementById('choices');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');
    const soundIntro = new Audio('../../static/sounds/voice/003_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const SHAPES = ['🔺', '🟩', '🔵', '⭐', '❤️', '🌙', '🔷'];
    let isFinished = false;
    let correctAnswer = '';

    // ドラッグ中の要素と位置情報
    let draggingElement = null;
    let offsetX = 0;
    let offsetY = 0;
    let startX = 0;
    let startY = 0;

    
    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
            document.body.removeEventListener('click', playIntro);
            document.body.removeEventListener('touchstart', playIntro);
        }
    };
    document.body.addEventListener('click', playIntro);
    document.body.addEventListener('touchstart', playIntro, { passive: true });
    // 自動再生できれば最初から鳴らす
    setTimeout(playIntro, 100);

    function init() {
        correctAnswer = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        silhouette.innerHTML = correctAnswer;
        
        const currentChoices = [correctAnswer];
        while (currentChoices.length < 3) {
            const dummy = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            if (!currentChoices.includes(dummy)) currentChoices.push(dummy);
        }
        currentChoices.sort(() => Math.random() - 0.5);

        choicesContainer.innerHTML = '';
        currentChoices.forEach(shape => {
            const el = document.createElement('div');
            el.className = 'text-7xl p-4 bg-gray-100 rounded-3xl shadow-sm border-4 border-gray-200 cursor-grab select-none touch-none';
            el.innerHTML = shape;
            el.dataset.shape = shape;
            
            // ドラッグ開始
            el.addEventListener('pointerdown', (e) => {
                if (isFinished) return;
                draggingElement = el;
                const rect = el.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                startX = el.offsetLeft;
                startY = el.offsetTop;
                
                el.classList.remove('bg-gray-100', 'border-gray-200');
                el.classList.add('bg-white', 'border-yellow-400', 'scale-110', 'z-50', 'absolute');
                
                // 初期の絶対位置を設定
                el.style.left = \`\${rect.left}px\`;
                el.style.top = \`\${rect.top}px\`;
                document.body.appendChild(el); // ボディの直下に移動して他要素の上に表示
                
                soundTap.currentTime = 0; soundTap.play().catch(e=>{});
            });

            choicesContainer.appendChild(el);
        });

        // ドキュメント全体でドラッグ中の動きを追従
        document.addEventListener('pointermove', (e) => {
            if (!draggingElement) return;
            e.preventDefault();
            draggingElement.style.left = \`\${e.clientX - offsetX}px\`;
            draggingElement.style.top = \`\${e.clientY - offsetY}px\`;
        });

        // ドロップ判定
        document.addEventListener('pointerup', (e) => {
            if (!draggingElement) return;
            
            const shape = draggingElement.dataset.shape;
            const silRect = silhouette.getBoundingClientRect();
            const elRect = draggingElement.getBoundingClientRect();

            // 重なり判定 (要素の中心がシルエットの矩形内にあるか)
            const centerX = elRect.left + elRect.width / 2;
            const centerY = elRect.top + elRect.height / 2;

            const isOverlap = centerX > silRect.left && centerX < silRect.right && 
                              centerY > silRect.top && centerY < silRect.bottom;

            if (isOverlap) {
                if (shape === correctAnswer) {
                    // 正解
                    draggingElement.remove();
                    silhouette.classList.remove('filter', 'brightness-0', 'opacity-30');
                    silhouette.classList.add('scale-125', 'transition-transform');
                    isFinished = true;
                    setTimeout(finishGame, 800);
                } else {
                    // 不正解 (元の位置に戻す)
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    resetDraggingElement();
                }
            } else {
                // 重なっていない場合は元の位置に戻す
                resetDraggingElement();
            }
            draggingElement = null;
        });
    }

    function resetDraggingElement() {
        draggingElement.classList.add('opacity-50', 'scale-95'); // ちょっと違うよの表現
        setTimeout(() => {
            draggingElement.classList.remove('opacity-50', 'scale-95', 'absolute', 'z-50', 'bg-white', 'border-yellow-400', 'scale-110');
            draggingElement.classList.add('bg-gray-100', 'border-gray-200');
            draggingElement.style.left = '';
            draggingElement.style.top = '';
            choicesContainer.appendChild(draggingElement);
        }, 300);
    }
    
    function finishGame() {
        setTimeout(() => soundClear.play().catch(e=>{}); soundClearVoice.play().catch(e=>{});, 300);
        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
            soundSelectSticker.play().catch(e=>{});
            setupStickers();
        }, 800);
    }

    function setupStickers() {
        if (!window.StickerSystem) return;
        const choices = document.getElementById('sticker-choices');
        const selectionArea = document.getElementById('sticker-selection');
        const afterSelection = document.getElementById('after-selection');
        StickerSystem.drawThree().forEach(sticker => {
            const btn = document.createElement('button');
            btn.className = \`flex flex-col items-center justify-center p-6 rounded-2xl border-4 \${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white\`;
            btn.innerHTML = \`<div class="text-6xl mb-2">\${sticker.item}</div><div class="text-sm font-bold">\${sticker.data.label}</div>\`;
            btn.addEventListener('click', () => {
                soundSelect.currentTime = 0;
                soundSelect.play().catch(e=>{});
                StickerSystem.saveSticker(sticker);
                selectionArea.classList.add('hidden');
                afterSelection.classList.remove('hidden');
            });
            choices.appendChild(btn);
        });
    }

    init();
});