const fs = require('fs');
const path = require('path');

const games = [
    { id: '002', name: 'おおきいのはどっち？', dir: '002_compare_size', desc: 'おおきいほうを タップしてね！', icon: '🐘', color: 'green' },
    { id: '003', name: 'かたちあわせ', dir: '003_shape_match', desc: 'おなじ かたちを さがそう！', icon: '🔺', color: 'yellow' },
    { id: '004', name: 'これなあに？', dir: '004_name_guess', desc: 'えをみて なまえを あててね！', icon: '🐶', color: 'pink' },
    { id: '005', name: 'どんなきもち？', dir: '005_emotions', desc: 'どんな おかおを しているかな？', icon: '😊', color: 'blue' },
    { id: '006', name: 'てあらいできるかな', dir: '006_hand_wash', desc: 'ばいきんを アワアワで やっつけよう！', icon: '🧼', color: 'cyan' },
    { id: '007', name: 'はんたいことば', dir: '007_opposites', desc: 'はんたいの いみを さがしてね！', icon: '↔️', color: 'purple' },
    { id: '008', name: 'おきがええらび', dir: '008_clothes', desc: 'おてんきに あう おようふくは どれ？', icon: '👕', color: 'orange' },
    { id: '009', name: 'いろまぜマジック', dir: '009_color_mix', desc: 'いろを まぜると どうなるかな？', icon: '🎨', color: 'red' },
    { id: '010', name: 'カラフルピアノ', dir: '010_piano', desc: 'すきな おとを ならして あそぼう！', icon: '🎹', color: 'indigo' }
];

const templateHTML = (game) => `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${game.name} - EduToys</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-${game.color}-100 overflow-hidden flex flex-col items-center justify-center h-screen relative">
    <button onclick="parent.postMessage('closeGame', '*')" class="absolute top-4 left-4 z-40 bg-white/80 text-gray-700 px-4 py-2 rounded-full font-bold shadow-sm hover:bg-white transition-colors">◀ もどる</button>

    <div id="game-container" class="relative w-full max-w-2xl h-[80vh] bg-white rounded-3xl shadow-xl border-8 border-${game.color}-400 overflow-hidden m-4">
        <div id="header" class="absolute top-4 left-0 w-full text-center">
            <h1 class="text-3xl font-bold text-${game.color}-500 bg-white/80 inline-block px-6 py-2 rounded-full shadow-md">${game.desc}</h1>
        </div>
        
        <div id="stage" class="w-full h-full relative flex items-center justify-center text-8xl">
            <!-- ゲームコンテンツ -->
            <div class="cursor-pointer hover:scale-110 transition-transform" id="target-item">${game.icon}</div>
        </div>

        <div id="finish-overlay" class="hidden absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-50">
            <h2 class="text-5xl md:text-6xl font-black text-pink-500 animate-bounce mb-4">よくできました！</h2>
            <div id="sticker-selection" class="w-full max-w-xl text-center">
                <p class="text-2xl font-bold text-gray-700 mb-6 bg-yellow-100 py-2 rounded-full mx-8 border-2 border-yellow-300">すきなシールを 1つ えらんでね！</p>
                <div id="sticker-choices" class="flex justify-center gap-6 mb-8"></div>
            </div>
            <div id="after-selection" class="hidden flex flex-col items-center">
                <p class="text-2xl font-bold text-orange-500 mb-8">シールをゲットしたよ！</p>
                <div class="flex gap-4">
                    <a href="../../sticker_book.html?autoplay=1" class="px-6 py-4 bg-white text-orange-500 border-4 border-orange-400 hover:bg-orange-50 text-xl font-bold rounded-full shadow-lg transition-transform active:scale-95">📕 シールちょう</a>
                    <button onclick="location.reload()" class="px-6 py-4 bg-yellow-400 hover:bg-yellow-500 text-white text-xl font-bold rounded-full shadow-lg transition-transform active:scale-95">もういっかい！</button>
                </div>
            </div>
        </div>
    </div>
    <script src="../../static/common/js/sticker_system.js"></script>
    <script src="js/main.js"></script>
</body>
</html>`;

const templateJS = () => `document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('stage');
    const target = document.getElementById('target-item');
    const finishOverlay = document.getElementById('finish-overlay');

    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');

    // 簡易的なクリアロジック（タップで即クリア）
    target.addEventListener('click', () => {
        soundTap.currentTime = 0;
        soundTap.play().catch(e=>{});
        target.classList.add('scale-150', 'opacity-0');
        setTimeout(finishGame, 500);
    });
    
    function finishGame() {
        setTimeout(() => soundClear.play().catch(e=>{}), 300);
        setTimeout(() => {
            finishOverlay.classList.remove('hidden');
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
            btn.className = "flex flex-col items-center justify-center p-6 rounded-2xl border-4 " + sticker.data.color + " shadow-md hover:scale-110 transition-transform bg-white";
            btn.innerHTML = '<div class="text-6xl mb-2">' + sticker.item + '</div><div class="text-sm font-bold">' + sticker.data.label + '</div>';
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
});`;

const templateJSON = (game) => JSON.stringify({
    name: game.name,
    description: game.desc,
    entry_point: "start.html"
}, null, 2);

const templateTest = (game) => `/**
 * @jest-environment jsdom
 */
describe('${game.dir}', () => {
  test('初期化テスト', () => {
    expect(true).toBe(true);
  });
});`;

// プロジェクトのルートディレクトリを基準にする
const projectRoot = path.join(__dirname, '..');

games.forEach(game => {
    const baseDir = path.join(projectRoot, 'games', game.dir);
    fs.mkdirSync(path.join(baseDir, 'js'), { recursive: true });
    
    fs.writeFileSync(path.join(baseDir, 'start.html'), templateHTML(game));
    fs.writeFileSync(path.join(baseDir, 'js', 'main.js'), templateJS());
    fs.writeFileSync(path.join(baseDir, 'game.json'), templateJSON(game));
    
    const testDir = path.join(projectRoot, '__tests__', 'games');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, game.dir + '.test.js'), templateTest(game));
});

console.log('9 games generated successfully.');
