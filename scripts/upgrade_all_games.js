const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dirs = fs.readdirSync(path.join(projectRoot, 'games')).filter(d => d.startsWith('0'));

dirs.forEach(dir => {
    const htmlPath = path.join(projectRoot, 'games', dir, 'start.html');
    if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf8');
        
        // 共通CSSの追加（Tailwindの後に挿入）
        if (!html.includes('game_style.css')) {
            html = html.replace('</head>', '    <link rel="stylesheet" href="../../static/common/css/game_style.css">\n</head>');
        }
        
        // 共通JSの追加（sticker_systemの前に挿入）
        if (!html.includes('game_utils.js')) {
            html = html.replace('<script src="../../static/common/js/sticker_system.js">', 
                               '<script src="../../static/common/js/game_utils.js"></script>\n    <script src="../../static/common/js/sticker_system.js">');
        }

        // ボタンクラスの書き換え (Tailwindのデフォルトクラスを一部置換)
        html = html.replace(/bg-yellow-400 hover:bg-yellow-500 text-white[^"]*font-bold rounded-full shadow-lg/g, 'btn-bubbly');
        html = html.replace(/bg-red-400 hover:bg-red-500 text-white[^"]*font-bold rounded-full shadow-xl/g, 'btn-bubbly');

        // 結果画面（finish-overlay）のレスポンシブレイアウト修正
        html = html.replace('text-6xl md:text-8xl', 'text-4xl sm:text-5xl md:text-7xl');
        html = html.replace('text-3xl font-black text-gray-700', 'text-xl sm:text-2xl md:text-3xl font-black text-gray-700');
        html = html.replace('text-4xl font-black text-orange-500', 'text-2xl sm:text-3xl md:text-4xl font-black text-orange-500');
        html = html.replace('<div class="flex gap-8">', '<div class="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full px-4 justify-center items-center">');
        html = html.replace(/px-10 py-6/g, 'px-6 py-4 md:px-10 md:py-6 w-full sm:w-auto text-center justify-center');
        html = html.replace(/text-3xl font-black rounded-full/g, 'text-xl md:text-3xl font-black rounded-full');

        fs.writeFileSync(htmlPath, html);
    }

    const jsPath = path.join(projectRoot, 'games', dir, 'js', 'main.js');
    if (fs.existsSync(jsPath)) {
        let js = fs.readFileSync(jsPath, 'utf8');

        // 花丸演出の挿入 (クリア処理の冒頭)
        if (!js.includes('GameUtils.showHanamaru')) {
            js = js.replace('function finishGame() {', 'function finishGame() {\n        GameUtils.showHanamaru();');
        }

        // 不正解時の演出を shakeElement に置換
        js = js.replace(/element\.classList\.add\('opacity-50', 'scale-90'\);/g, 'GameUtils.shakeElement(element);');
        js = js.replace(/btn\.classList\.add\('opacity-50', 'scale-95'\);/g, 'GameUtils.shakeElement(btn);');

        fs.writeFileSync(jsPath, js);
    }
});

console.log('Quality upgrades applied to all games.');
