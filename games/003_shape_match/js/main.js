document.addEventListener('DOMContentLoaded', () => {
    const silhouette = document.getElementById('silhouette');
    const silhouetteGuide = document.getElementById('silhouette-guide');
    const choicesContainer = document.getElementById('choices');
    const finishOverlay = document.getElementById('finish-overlay');
    const instruction = document.querySelector('h1#instruction');

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
        { icon: '🌻', name: 'ひまわり' }, { icon: '🎈', name: 'ふうせん' },
        { icon: '🦁', name: 'らいおん' }, { icon: '🍰', name: 'けーき' }
    ];

    let currentRound = 0;
    const TOTAL_ROUNDS = 3;
    let isFinished = false;
    let isTransitioning = false;
    let correctAnswer = null;

    let draggingElement = null;
    let offsetX = 0;
    let offsetY = 0;

    let introPlayed = false;
    const playIntro = () => {
        if (!introPlayed) {
            soundIntro.play().catch(e=>{});
            introPlayed = true;
        }
    };
    document.body.addEventListener('click', playIntro, { once: true });
    setTimeout(playIntro, 500);

    function initRound() {
        isTransitioning = false;
        
        // ヘッダーの更新
        if (instruction) {
            instruction.textContent = `かたちあわせに ちょうせん！ (${currentRound + 1}/${TOTAL_ROUNDS})`;
        }

        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        correctAnswer = item;
        
        silhouette.innerHTML = item.icon;
        silhouette.className = 'text-[120px] filter brightness-0 opacity-20 transition-all duration-500';
        silhouette.style.transform = '';
        
        silhouetteGuide.className = 'absolute inset-0 border-8 border-dashed border-gray-200 rounded-[40px] transition-all duration-300';
        
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
            
            el.addEventListener('pointerdown', handlePointerDown);
            choicesContainer.appendChild(el);
        });
    }

    function handlePointerDown(e) {
        if (isFinished || isTransitioning) return;
        const el = e.currentTarget;
        draggingElement = el;
        const rect = el.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        el.classList.add('scale-110', 'z-50', 'absolute');
        el.style.left = `${rect.left}px`;
        el.style.top = `${rect.top}px`;
        document.body.appendChild(el);
        
        soundTap.currentTime = 0; soundTap.play().catch(e=>{});
        el.setPointerCapture(e.pointerId);
    }

    document.addEventListener('pointermove', (e) => {
        if (!draggingElement) return;
        e.preventDefault();
        draggingElement.style.left = `${e.clientX - offsetX}px`;
        draggingElement.style.top = `${e.clientY - offsetY}px`;
        checkDistance(e.clientX, e.clientY);
    });

    document.addEventListener('pointerup', (e) => {
        if (!draggingElement) return;
        
        const icon = draggingElement.dataset.icon;
        const silRect = silhouette.getBoundingClientRect();
        const elRect = draggingElement.getBoundingClientRect();
        const centerX = elRect.left + elRect.width / 2;
        const centerY = elRect.top + elRect.height / 2;

        const isOverlap = centerX > silRect.left - 40 && centerX < silRect.right + 40 && 
                          centerY > silRect.top - 40 && centerY < silRect.bottom + 40;

        if (isOverlap && icon === correctAnswer.icon) {
            isTransitioning = true;
            const targetX = silRect.left;
            const targetY = silRect.top;
            
            draggingElement.style.transition = 'all 0.3s ease-out';
            draggingElement.style.left = `${targetX}px`;
            draggingElement.style.top = `${targetY}px`;
            draggingElement.classList.remove('bg-white', 'border-yellow-200', 'shadow-md');
            draggingElement.classList.add('border-transparent', 'bg-transparent', 'shadow-none');
            
            silhouette.classList.remove('filter', 'brightness-0', 'opacity-20');
            silhouette.classList.add('scale-125');
            silhouetteGuide.classList.add('opacity-0');
            
            soundSelect.currentTime = 0; soundSelect.play().catch(e=>{});
            GameUtils.showHanamaru();

            setTimeout(() => {
                if (draggingElement) draggingElement.remove();
                draggingElement = null;
                currentRound++;
                if (currentRound < TOTAL_ROUNDS) {
                    initRound();
                } else {
                    finishGame();
                }
            }, 2000);
        } else {
            if (isOverlap) {
                soundError.currentTime = 0; soundError.play().catch(e=>{});
            }
            resetDraggingElement();
        }
        draggingElement = null;
    });

    function checkDistance(clientX, clientY) {
        const silRect = silhouette.getBoundingClientRect();
        const dist = Math.sqrt(Math.pow(clientX - (silRect.left + silRect.width/2), 2) + Math.pow(clientY - (silRect.top + silRect.height/2), 2));
        if (dist < 100) {
            silhouetteGuide.classList.add('border-yellow-400', 'scale-110');
        } else {
            silhouetteGuide.classList.remove('border-yellow-400', 'scale-110');
        }
    }

    function resetDraggingElement() {
        if (!draggingElement) return;
        const el = draggingElement;
        GameUtils.shakeElement(el);
        setTimeout(() => {
            if (el && el.parentNode === document.body) {
                el.classList.remove('absolute', 'z-50', 'scale-110');
                el.style.left = '';
                el.style.top = '';
                choicesContainer.appendChild(el);
            }
        }, 300);
    }
    
    function finishGame() {
        isFinished = true;
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

    initRound();
});
