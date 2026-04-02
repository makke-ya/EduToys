const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 1. index.html
let indexContent = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
indexContent = indexContent.replace(/'games\/005_emotions\/start\.html\?autoplay=1'/g, "'games/005_number_tracing/start.html?autoplay=1'");
indexContent = indexContent.replace(/どんなきもち？/g, 'すうじなぞり');
indexContent = indexContent.replace(/どんな おかおを しているかな？/g, 'すうじを ゆびで なぞってみよう！');
indexContent = indexContent.replace(/😊/g, '👆');
fs.writeFileSync(path.join(root, 'index.html'), indexContent);

// 2. game.json
const jsonPath = path.join(root, 'games', '005_number_tracing', 'game.json');
let jsonContent = fs.readFileSync(jsonPath, 'utf8');
jsonContent = jsonContent.replace(/どんなきもち？/g, 'すうじなぞり');
jsonContent = jsonContent.replace(/どんな おかおを しているかな？/g, 'すうじを ゆびで なぞってみよう！');
fs.writeFileSync(jsonPath, jsonContent);

// 3. GAME_IDEAS.md
const mdPath = path.join(root, 'docs', 'GAME_IDEAS.md');
let mdContent = fs.readFileSync(mdPath, 'utf8');
mdContent = mdContent.replace(/\[games\/005_emotions\]/g, '[games/005_number_tracing]');
fs.writeFileSync(mdPath, mdContent);

console.log('Refs updated for 005.');
