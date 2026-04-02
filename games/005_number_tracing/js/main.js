document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');

    const dragPoint = document.getElementById('drag-point');
    const tracingArea = document.getElementById('tracing-area');
    const checkpointsContainer = document.getElementById('checkpoints');
    const numberOutline = document.getElementById('number-outline');

    let isFinished = false;
    let dragging = false;
    let currentCheckIndex = 0;
    
    // 今回は「1」と「2」のなぞりデータ
    const NUMBER_PATHS = [
        {
            number: '1',
            checkpoints: [
                { x: 35, y: 30 }, // スタート
                { x: 50, y: 15 }, // 頂点
                { x: 50, y: 50 }, // 真ん中
                { x: 50, y: 85 }  // ゴール
            ]
        },
        {
            number: '2',
            checkpoints: [
                { x: 30, y: 30 }, // スタート
                { x: 50, y: 15 }, // 上カーブ
                { x: 75, y: 35 }, // 右カーブ
                { x: 40, y: 85 }, // 左下へ
                { x: 80, y: 85 }  // 右へ
            ]
        }
    ];

    let currentPath = [];
    let checkElements = [];

    
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
        const numData = NUMBER_PATHS[Math.floor(Math.random() * NUMBER_PATHS.length)];
        numberOutline.textContent = numData.number;
        currentPath = numData.checkpoints;
        currentCheckIndex = 0;

        checkpointsContainer.innerHTML = '';
        checkElements = [];

        currentPath.forEach((pt, index) => {
            const cp = document.createElement('div');
            cp.className = 'absolute w-12 h-12 bg-yellow-300 rounded-full opacity-30 transform -translate-x-1/2 -translate-y-1/2 transition-all';
            cp.style.left = `${pt.x}%`;
            cp.style.top = `${pt.y}%`;
            
            if (index === 0) cp.classList.add('animate-ping', 'opacity-80', 'bg-yellow-400');
            
            checkpointsContainer.appendChild(cp);
            checkElements.push(cp);
        });

        // Pointer Events によるドラッグ実装（マウスとタッチ両対応）
        dragPoint.addEventListener('pointerdown', startDrag);
        // ドキュメント全体で動かせるようにする
        document.addEventListener('pointermove', onDrag, { passive: false });
        document.addEventListener('pointerup', endDrag);

        // 初期位置へ（中心を合わせるための調整値）
        dragPoint.style.left = `calc(${currentPath[0].x}% - 2rem)`;
        dragPoint.style.top = `calc(${currentPath[0].y}% - 2rem)`;
    }

    function startDrag(e) {
        if (isFinished) return;
        dragging = true;
        dragPoint.classList.add('scale-125');
        // ドラッグ中に画面がスクロールするのを防ぐ
        e.preventDefault();
        
        // 最初のポイントにすでに乗っているかチェック
        checkHit(e.clientX, e.clientY);
    }
function onDrag(e) {
    if (!dragging || isFinished) return;
    e.preventDefault();

    // キラキラを生成（なぞり演出）
    if (Math.random() > 0.5) GameUtils.createSparkle(tracingArea);

    // clientX, clientY を tracingArea 内の相対座標（%）に変換
...
        const rect = tracingArea.getBoundingClientRect();
        
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // はみ出し制限
        x = Math.max(0, Math.min(x, rect.width));
        y = Math.max(0, Math.min(y, rect.height));

        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;

        // マウス位置にドラッグポイントを追従させる
        dragPoint.style.left = `calc(${percentX}% - 2rem)`;
        dragPoint.style.top = `calc(${percentY}% - 2rem)`;

        checkHit(e.clientX, e.clientY);
    }

    function endDrag(e) {
        dragging = false;
        dragPoint.classList.remove('scale-125');
    }

    function checkHit(clientX, clientY) {
        if (currentCheckIndex >= currentPath.length) return;

        const cpEl = checkElements[currentCheckIndex];
        const cpRect = cpEl.getBoundingClientRect();

        // 判定は clientX/Y（画面絶対座標）同士で計算
        const cpCenterX = cpRect.left + cpRect.width / 2;
        const cpCenterY = cpRect.top + cpRect.height / 2;

        const dist = Math.sqrt(Math.pow(clientX - cpCenterX, 2) + Math.pow(clientY - cpCenterY, 2));

        // 当たり判定 (40pxくらいならOK)
        if (dist < 40) {
            cpEl.classList.remove('animate-ping', 'opacity-30', 'bg-yellow-400');
            cpEl.classList.add('bg-green-400', 'opacity-80', 'scale-150');
            soundTap.currentTime = 0; soundTap.play().catch(e=>{});
            
            setTimeout(() => cpEl.classList.remove('scale-150'), 200);

            currentCheckIndex++;

            if (currentCheckIndex < currentPath.length) {
                checkElements[currentCheckIndex].classList.add('animate-ping', 'opacity-80', 'bg-yellow-400');
            } else {
                isFinished = true;
                dragPoint.classList.add('opacity-0');
                numberOutline.classList.add('text-green-400', 'scale-110', 'transition-all');
                setTimeout(finishGame, 800);
            }
        }
    }

    function finishGame() {
        GameUtils.showHanamaru();
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
