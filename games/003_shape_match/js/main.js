document.addEventListener('DOMContentLoaded', () => {
    const silhouette = document.getElementById('silhouette');
    const silhouetteGuide = document.getElementById('silhouette-guide');
    const choicesContainer = document.getElementById('choices');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');

    const soundIntro = new Audio('../../static/sounds/voice/003_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');

    const ITEMS = [
        { icon: '🍎', name: 'りんご' }, { icon: '🚗', name: 'くるま' },
        { icon: '🐘', name: 'ぞう' }, { icon: '⭐', name: 'ほし' },
        { icon: '🌻', name: 'ひまわり' }, { icon: '🎈', name: 'ふうせん' }
    ];
    let isFinished = false;
    let correctAnswer = null;

    let draggingElement = null;
    let offsetX = 0;
    let offsetY = 0;

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
    setTimeout(playIntro, 100);

    function init() {
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        correctAnswer = item;
        silhouette.innerHTML = item.icon;
        
        const currentChoices = [item];
        while (currentChoices.length < 3) {
            const dummy = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            if (!currentChoices.find(c => c.icon === dummy.icon)) currentChoices.push(dummy);
        }
        currentChoices.sort(() => Math.random() - 0.5);

        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const el = document.createElement('div');
            el.className = 'text-7xl p-6 bg-white rounded-3xl shadow-md border-4 border-yellow-200 cursor-grab select-none touch-none hover:scale-105 transition-transform';
            el.innerHTML = choice.icon;
            el.dataset.icon = choice.icon;
            
            el.addEventListener('pointerdown', (e) => {
                if (isFinished) return;
                draggingElement = el;
                const rect = el.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                
                el.classList.add('scale-110', 'z-50', 'absolute');
                el.style.left = `${rect.left}px`;
                el.style.top = `${rect.top}px`;
                document.body.appendChild(el);
                
                soundTap.currentTime = 0; soundTap.play().catch(e=>{});
            });

            choicesContainer.appendChild(el);
        });

        document.addEventListener('pointermove', (e) => {
            if (!draggingElement) return;
            e.preventDefault();
            draggingElement.style.left = `${e.clientX - offsetX}px`;
            draggingElement.style.top = `${e.clientY - offsetY}px`;
            
            // 距離チェック（ガイドの色を変えるなどの視覚的フィードバック）
            checkDistance(e.clientX, e.clientY);
        });

        document.addEventListener('pointerup', (e) => {
            if (!draggingElement) return;
            
            const icon = draggingElement.dataset.icon;
            const silRect = silhouette.getBoundingClientRect();
            const elRect = draggingElement.getBoundingClientRect();
            const centerX = elRect.left + elRect.width / 2;
            const centerY = elRect.top + elRect.height / 2;

            const isOverlap = centerX > silRect.left - 20 && centerX < silRect.right + 20 && 
                              centerY > silRect.top - 20 && centerY < silRect.bottom + 20;

            if (isOverlap && icon === correctAnswer.icon) {
                // 正解（スナップ）
                draggingElement.style.left = `${silRect.left}px`;
                draggingElement.style.top = `${silRect.top}px`;
                draggingElement.classList.remove('scale-110', 'z-50', 'bg-white', 'border-yellow-200');
                draggingElement.classList.add('scale-100', 'border-transparent', 'bg-transparent', 'shadow-none');
                
                silhouette.classList.remove('filter', 'brightness-0', 'opacity-20');
                silhouette.classList.add('scale-125', 'transition-transform');
                silhouetteGuide.classList.add('opacity-0');
                
                soundSelect.currentTime = 0; soundSelect.play().catch(e=>{});
                isFinished = true;
                setTimeout(finishGame, 800);
            } else {
                if (isOverlap) {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                }
                resetDraggingElement();
            }
            draggingElement = null;
        });
    }

    function checkDistance(clientX, clientY) {
        const silRect = silhouette.getBoundingClientRect();
        const dist = Math.sqrt(Math.pow(clientX - (silRect.left + silRect.width/2), 2) + Math.pow(clientY - (silRect.top + silRect.height/2), 2));
        
        if (dist < 100) {
            silhouetteGuide.classList.add('border-yellow-400', 'scale-125');
        } else {
            silhouetteGuide.classList.remove('border-yellow-400', 'scale-125');
        }
    }

    function resetDraggingElement() {
        GameUtils.shakeElement(draggingElement);
        setTimeout(() => {
            if (draggingElement && draggingElement.parentNode === document.body) {
                draggingElement.classList.remove('absolute', 'z-50', 'scale-110');
                draggingElement.style.left = '';
                draggingElement.style.top = '';
                choicesContainer.appendChild(draggingElement);
            }
        }, 300);
    }
    
    function finishGame() {
        GameUtils.showHanamaru();
        setTimeout(() => {
            soundClear.play().catch(e=>{});
            soundClearVoice.play().catch(e=>{});
        }, 300);
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
            btn.className = `flex flex-col items-center justify-center p-6 rounded-2xl border-4 ${sticker.data.color} shadow-md hover:scale-110 transition-transform bg-white`;
            btn.innerHTML = `<div class="text-6xl mb-2">${sticker.item}</div><div class="text-sm font-bold">${sticker.data.label}</div>`;
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
