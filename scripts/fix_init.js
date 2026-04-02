const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const dirs = ['005_emotions', '006_hand_wash', '007_opposites', '008_clothes', '009_color_mix', '010_piano'];

dirs.forEach(dir => {
    const jsPath = path.join(projectRoot, 'games', dir, 'js', 'main.js');
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    if (!jsContent.includes('init();\n});')) {
        jsContent = jsContent.replace('});', '    init();\n});');
        fs.writeFileSync(jsPath, jsContent);
    }
});

console.log('Init fixed.');
