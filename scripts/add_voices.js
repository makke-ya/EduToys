const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dirs = fs.readdirSync(path.join(projectRoot, 'games')).filter(d => d.startsWith('0'));

dirs.forEach(dir => {
    const jsPath = path.join(projectRoot, 'games', dir, 'js', 'main.js');
    if (!fs.existsSync(jsPath)) return;
    
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    const gameId = dir.split('_')[0]; // "001", "002" etc.
    
    // 音声オブジェクトの追加（既存の定数宣言の下に挿入）
    const audioDefs = `    const soundIntro = new Audio('../../static/sounds/voice/${gameId}_intro.mp3');
    const soundClearVoice = new Audio('../../static/sounds/voice/clear.mp3');
    const soundSelectSticker = new Audio('../../static/sounds/voice/select_sticker.mp3');\n`;
    
    // まだ挿入されていなければ挿入
    if (!jsContent.includes('soundIntro')) {
        jsContent = jsContent.replace(
            /(const soundError = [^;]+;)\n/,
            `$1\n${audioDefs}`
        );
        // 001はsoundErrorがないので別のフックポイントを使用
        if (dir === '001_counting_apples') {
            jsContent = jsContent.replace(
                /(const soundSelect = [^;]+;)\n/,
                `$1\n${audioDefs}`
            );
        }
    }

    // 問題文の自動再生の追加（ユーザーインタラクション時に1回だけ）
    if (!jsContent.includes('soundIntro.play()')) {
        const introLogic = `
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
`;
        jsContent = jsContent.replace(/function init\(\) \{/, `${introLogic}\n    function init() {`);
    }

    // クリアボイスの追加
    if (!jsContent.includes('soundClearVoice.play()')) {
        jsContent = jsContent.replace(
            /soundClear\.play\(\)\.catch\(e=>\{\}\)/,
            `soundClear.play().catch(e=>{}); soundClearVoice.play().catch(e=>{});`
        );
    }
    
    // シール選択ボイスの追加
    if (!jsContent.includes('soundSelectSticker.play()')) {
        jsContent = jsContent.replace(
            /finishOverlay\.classList\.remove\('hidden'\);\n\s*setupStickers\(\);/,
            `finishOverlay.classList.remove('hidden');\n            soundSelectSticker.play().catch(e=>{});\n            setupStickers();`
        );
    }

    fs.writeFileSync(jsPath, jsContent);
});

console.log('Voice narration added to all games.');
