/**
 * かたちあわせ - main.js
 */

(() => {
    const init = () => {
        const silhouette = document.getElementById('silhouette');
        const silhouetteGuide = document.getElementById('silhouette-guide');
        const choicesContainer = document.getElementById('choices');
        const finishOverlay = document.getElementById('finish-overlay');
        const instruction = document.querySelector('h1#instruction');

        if (!silhouette) return;

        const soundGrab = new Audio('static/sounds/system/スイッチ3.mp3');
        const soundRelease = new Audio('static/sounds/system/スイッチ5.mp3');
        const soundCorrect = new Audio('static/sounds/system/正解1.mp3');
        const soundClear = new Audio('static/sounds/staging/ジャジャーン1.mp3');
        const soundSelect = new Audio('static/sounds/system/決定10.mp3');
        const soundError = new Audio('static/sounds/staging/短い音-ズッコケ.mp3');

        const soundIntro = new Audio('static/sounds/voice/003_intro.mp3');
        const soundClearVoice = new Audio('static/sounds/voice/clear.mp3');
        const soundSelectSticker = new Audio('static/sounds/voice/select_sticker.mp3');

        // SVGイラストのバリエーション
        const ITEMS = [
            { name: 'りんご', svg: `<svg viewBox="0 0 80 80"><ellipse cx="40" cy="46" rx="26" ry="26" fill="#e53935"/><ellipse cx="40" cy="46" rx="26" ry="26" fill="url(#s3a)" opacity="0.25"/><path d="M40,20 Q38,12 32,8" stroke="#5d4037" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="36" cy="15" rx="7" ry="4" fill="#66bb6a" transform="rotate(-25,36,15)"/><defs><radialGradient id="s3a" cx="38%" cy="32%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>` },
            { name: 'くるま', svg: `<svg viewBox="0 0 96 64"><rect x="10" y="24" width="76" height="28" rx="10" fill="#1e88e5"/><path d="M24,24 L34,8 L62,8 L72,24" fill="#42a5f5"/><rect x="36" y="10" width="24" height="14" rx="3" fill="#bbdefb" opacity="0.6"/><circle cx="28" cy="52" r="9" fill="#424242"/><circle cx="28" cy="52" r="4.5" fill="#757575"/><circle cx="68" cy="52" r="9" fill="#424242"/><circle cx="68" cy="52" r="4.5" fill="#757575"/><rect x="76" y="32" width="8" height="5" rx="2" fill="#ffee58"/></svg>` },
            { name: 'ぞう', svg: `<svg viewBox="0 0 80 80"><ellipse cx="40" cy="42" rx="24" ry="22" fill="#90a4ae"/><ellipse cx="40" cy="42" rx="24" ry="22" fill="url(#s3e)" opacity="0.2"/><ellipse cx="16" cy="38" rx="10" ry="14" fill="#90a4ae"/><ellipse cx="16" cy="38" rx="7" ry="10" fill="#b0bec5"/><ellipse cx="64" cy="38" rx="10" ry="14" fill="#90a4ae"/><ellipse cx="64" cy="38" rx="7" ry="10" fill="#b0bec5"/><path d="M28,50 Q20,72 26,76" stroke="#78909c" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="32" cy="36" r="3" fill="#37474f"/><circle cx="48" cy="36" r="3" fill="#37474f"/><circle cx="33" cy="35" r="1" fill="white"/><circle cx="49" cy="35" r="1" fill="white"/><defs><radialGradient id="s3e" cx="40%" cy="30%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>` },
            { name: 'ほし', svg: `<svg viewBox="0 0 80 80"><polygon points="40,8 48,30 72,30 52,44 60,68 40,52 20,68 28,44 8,30 32,30" fill="#fdd835" stroke="#f9a825" stroke-width="2" stroke-linejoin="round"/><polygon points="40,16 46,30 58,30 48,40 52,56 40,46 28,56 32,40 22,30 34,30" fill="#ffee58" opacity="0.5"/></svg>` },
            { name: 'ひまわり', svg: `<svg viewBox="0 0 80 80"><g transform="translate(40,40)"><ellipse rx="12" ry="5" fill="#fdd835" transform="rotate(0)"/><ellipse rx="12" ry="5" fill="#fdd835" transform="rotate(30)"/><ellipse rx="12" ry="5" fill="#fdd835" transform="rotate(60)"/><ellipse rx="12" ry="5" fill="#fdd835" transform="rotate(90)"/><ellipse rx="12" ry="5" fill="#fdd835" transform="rotate(120)"/><ellipse rx="12" ry="5" fill="#fdd835" transform="rotate(150)"/></g><circle cx="40" cy="40" r="10" fill="#795548"/><circle cx="40" cy="40" r="7" fill="#8d6e63"/></svg>` },
            { name: 'ふうせん', svg: `<svg viewBox="0 0 64 80"><ellipse cx="32" cy="30" rx="20" ry="26" fill="#e53935"/><ellipse cx="32" cy="30" rx="20" ry="26" fill="url(#s3b)" opacity="0.3"/><path d="M32,56 L28,58 L36,58 Z" fill="#c62828"/><path d="M32,58 Q34,68 30,78" stroke="#bdbdbd" stroke-width="1.5" fill="none"/><defs><radialGradient id="s3b" cx="35%" cy="25%"><stop offset="0%" stop-color="white"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs></svg>` }
        ];

        let currentRound = 0;
        const TOTAL_ROUNDS = 3;
        let isFinished = false;
        let isTransitioning = false;
        let correctAnswer = null;

        let draggingElement = null;
        let offsetX = 0;
        let offsetY = 0;

        soundIntro.play().catch(e=>{});

        function initRound() {
            isTransitioning = false;
            
            if (instruction) {
                instruction.textContent = `かたちあわせに ちょうせん！ (${currentRound + 1}/${TOTAL_ROUNDS})`;
            }

            const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            correctAnswer = item;
            
            silhouette.innerHTML = item.svg;
            silhouette.className = 'silhouette-target';
            silhouette.style.transform = '';
            
            silhouetteGuide.className = 'silhouette-guide';
            
            const currentChoices = [item];
            while (currentChoices.length < 3) {
                const dummy = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                if (!currentChoices.find(c => c.name === dummy.name)) currentChoices.push(dummy);
            }
            currentChoices.sort(() => Math.random() - 0.5);

            choicesContainer.innerHTML = '';
            currentChoices.forEach(choice => {
                const el = document.createElement('div');
                el.className = 'choice-item';
                el.innerHTML = choice.svg;
                el.dataset.name = choice.name;
                
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
            
            el.style.position = 'absolute';
            el.style.zIndex = '50';
            el.style.boxShadow = 'var(--shadow-xl)';
            el.style.transform = 'scale(1.1)';
            el.style.left = `${rect.left}px`;
            el.style.top = `${rect.top}px`;
            document.body.appendChild(el);
            
            soundGrab.currentTime = 0; soundGrab.play().catch(e=>{});
            el.setPointerCapture(e.pointerId);
        }

        const onMove = (e) => {
            if (!draggingElement) return;
            e.preventDefault();
            draggingElement.style.left = `${e.clientX - offsetX}px`;
            draggingElement.style.top = `${e.clientY - offsetY}px`;
            checkDistance(e.clientX, e.clientY);
        };

        const onUp = (e) => {
            if (!draggingElement) return;
            
            soundRelease.currentTime = 0; soundRelease.play().catch(e=>{});

            const name = draggingElement.dataset.name;
            const silRect = silhouette.getBoundingClientRect();
            const elRect = draggingElement.getBoundingClientRect();
            const centerX = elRect.left + elRect.width / 2;
            const centerY = elRect.top + elRect.height / 2;

            const isOverlap = centerX > silRect.left - 40 && centerX < silRect.right + 40 && 
                              centerY > silRect.top - 40 && centerY < silRect.bottom + 40;

            if (isOverlap && name === correctAnswer.name) {
                isTransitioning = true;
                const targetX = silRect.left + (silRect.width - elRect.width) / 2;
                const targetY = silRect.top + (silRect.height - elRect.height) / 2;
                
                draggingElement.style.transition = 'all 0.3s ease-out';
                draggingElement.style.left = `${targetX}px`;
                draggingElement.style.top = `${targetY}px`;
                draggingElement.style.border = 'none';
                draggingElement.style.background = 'transparent';
                draggingElement.style.boxShadow = 'none';
                
                silhouette.classList.add('revealed');
                silhouetteGuide.classList.add('matched');
                
                soundCorrect.currentTime = 0; soundCorrect.play().catch(e=>{});
                try {
                    GameUtils.showHanamaru('game-container');
                } catch(e) { console.error(e); }

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
        };

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);

        function checkDistance(clientX, clientY) {
            const silRect = silhouette.getBoundingClientRect();
            const dist = Math.sqrt(Math.pow(clientX - (silRect.left + silRect.width/2), 2) + Math.pow(clientY - (silRect.top + silRect.height/2), 2));
            if (dist < 100) {
                silhouetteGuide.classList.add('near');
            } else {
                silhouetteGuide.classList.remove('near');
            }
        }

        function resetDraggingElement() {
            if (!draggingElement) return;
            const el = draggingElement;
            GameUtils.shakeElement(el);
            setTimeout(() => {
                if (el && el.parentNode === document.body) {
                    el.style.position = '';
                    el.style.zIndex = '';
                    el.style.boxShadow = '';
                    el.style.transform = '';
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
                finishOverlay.classList.add('show');
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

        initRound();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
