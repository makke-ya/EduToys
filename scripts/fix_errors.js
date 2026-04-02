const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dirs = ['002_compare_size', '003_shape_match', '004_name_guess', '005_emotions', '007_opposites', '008_clothes', '009_color_mix'];

dirs.forEach(dir => {
    const jsPath = path.join(projectRoot, 'games', dir, 'js', 'main.js');
    if (!fs.existsSync(jsPath)) return;
    
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // 1. エラー音の差し替え
    jsContent = jsContent.replace(
        /const soundError = new Audio\('\.\.\/\.\.\/static\/sounds\/system\/エラー2\.mp3'\);/g,
        "const soundError = new Audio('../../static/sounds/staging/短い音-ズッコケ.mp3');"
    );

    // 2. 激しいエラーアニメーションの緩和
    // 002
    jsContent = jsContent.replace(
        "element.classList.add('animate-ping'); // ブルブル震える",
        "element.classList.add('opacity-50', 'scale-90'); // 責めないように少し小さく・半透明になる"
    );
    jsContent = jsContent.replace(
        "setTimeout(() => element.classList.remove('animate-ping'), 500);",
        "setTimeout(() => element.classList.remove('opacity-50', 'scale-90'), 800);"
    );

    // 003, 004
    jsContent = jsContent.replace(
        "btn.classList.add('bg-red-200', 'border-red-400', 'animate-ping');",
        "btn.classList.add('opacity-50', 'scale-95');"
    );
    jsContent = jsContent.replace(
        "setTimeout(() => btn.classList.remove('bg-red-200', 'border-red-400', 'animate-ping'), 500);",
        "setTimeout(() => btn.classList.remove('opacity-50', 'scale-95'), 800);"
    );

    // その他の opacity-50 になっているものは、そのまま（十分マイルド）
    // 004 の bg-gray-300 は残すが、ボタンを無効化することで責める感じをなくす
    jsContent = jsContent.replace(
        "btn.classList.add('bg-gray-300', 'text-gray-500', 'border-gray-400');",
        "btn.classList.add('opacity-50');"
    );

    fs.writeFileSync(jsPath, jsContent);
});

console.log('Error feedback softened for all games.');
