const fs = require('fs');
const path = require('path');

const implementations = {
    '005_emotions': {
        html: `        <div id="stage" class="w-full h-full relative flex flex-col items-center justify-center gap-8">
            <h2 id="question-text" class="text-4xl font-bold text-gray-700 mb-4"></h2>
            <div id="choices" class="flex gap-8"></div>
        </div>`,
        js: `    const EMOJIS = [
        { icon: '😄', emotion: 'うれしい' }, { icon: '😭', emotion: 'かなしい' }, { icon: '😡', emotion: 'おこってる' }
    ];
    let isFinished = false;

    function init() {
        const stage = document.getElementById('stage');
        const qText = document.getElementById('question-text');
        const choicesContainer = document.getElementById('choices');
        
        const question = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        qText.textContent = \`「\${question.emotion}」おかおは どれかな？\`;
        
        const currentChoices = [...EMOJIS].sort(() => Math.random() - 0.5);

        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'text-8xl p-4 bg-white rounded-full shadow-md border-4 border-blue-200 hover:scale-110 hover:border-blue-400 transition-transform active:scale-95';
            btn.innerHTML = choice.icon;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice.emotion === question.emotion) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{});
                    btn.classList.add('scale-125', 'bg-yellow-200', 'border-yellow-400');
                    isFinished = true;
                    setTimeout(finishGame, 800);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    btn.classList.add('opacity-50');
                }
            };
            choicesContainer.appendChild(btn);
        });
    }`
    },
    '006_hand_wash': {
        html: `        <div id="stage" class="w-full h-full relative flex flex-col items-center justify-center">
            <div id="hands" class="text-9xl relative">
                ✋
                <div id="germs" class="absolute inset-0 flex items-center justify-center gap-2 flex-wrap pointer-events-none"></div>
            </div>
            <p class="mt-8 text-xl font-bold text-gray-500">ばいきんを タップして やっつけよう！</p>
        </div>`,
        js: `    let isFinished = false;
    let germsCount = 5;

    function init() {
        const germsContainer = document.getElementById('germs');
        for (let i = 0; i < germsCount; i++) {
            const germ = document.createElement('div');
            germ.className = 'text-3xl animate-bounce cursor-pointer pointer-events-auto';
            germ.innerHTML = '🦠';
            germ.style.transform = \`translate(\${(Math.random()-0.5)*100}px, \${(Math.random()-0.5)*100}px)\`;
            germ.onclick = () => {
                if (isFinished || germ.classList.contains('opacity-0')) return;
                soundTap.currentTime = 0; soundTap.play().catch(e=>{});
                germ.innerHTML = '✨';
                germ.classList.add('opacity-0', 'scale-150', 'transition-all', 'duration-500');
                germsCount--;
                if (germsCount === 0) {
                    isFinished = true;
                    document.getElementById('hands').classList.add('animate-pulse');
                    setTimeout(finishGame, 1000);
                }
            };
            germsContainer.appendChild(germ);
        }
    }`
    },
    '007_opposites': {
        html: `        <div id="stage" class="w-full h-full relative flex flex-col items-center justify-center gap-8">
            <div class="flex items-center justify-center gap-4">
                <div id="target-item" class="text-8xl p-8 bg-gray-100 rounded-3xl"></div>
                <div class="text-4xl font-bold text-gray-400">の はんたいは？</div>
            </div>
            <div id="choices" class="flex gap-8 mt-8"></div>
        </div>`,
        js: `    const PAIRS = [
        { a: {icon:'🐘', word:'おおきい'}, b: {icon:'🐭', word:'ちいさい'} },
        { a: {icon:'☀️', word:'あつい'}, b: {icon:'⛄', word:'さむい'} },
        { a: {icon:'😊', word:'わらう'}, b: {icon:'😭', word:'なく'} }
    ];
    let isFinished = false;

    function init() {
        const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
        const isA = Math.random() < 0.5;
        const question = isA ? pair.a : pair.b;
        const answer = isA ? pair.b : pair.a;
        
        document.getElementById('target-item').innerHTML = \`\${question.icon}<br><span class="text-2xl">\${question.word}</span>\`;
        
        let currentChoices = [answer];
        while (currentChoices.length < 3) {
            const randomPair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
            const dummy = Math.random() < 0.5 ? randomPair.a : randomPair.b;
            if (!currentChoices.find(c => c.word === dummy.word) && dummy.word !== question.word) {
                currentChoices.push(dummy);
            }
        }
        currentChoices.sort(() => Math.random() - 0.5);

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'text-6xl p-6 bg-white rounded-3xl shadow-md border-4 border-purple-200 hover:scale-110 hover:border-purple-400 transition-transform active:scale-95 flex flex-col items-center';
            btn.innerHTML = \`\${choice.icon}<span class="text-xl mt-2 font-bold">\${choice.word}</span>\`;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice.word === answer.word) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{});
                    btn.classList.add('bg-green-200', 'border-green-400');
                    isFinished = true;
                    setTimeout(finishGame, 800);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    btn.classList.add('opacity-50');
                }
            };
            choicesContainer.appendChild(btn);
        });
    }`
    },
    '008_clothes': {
        html: `        <div id="stage" class="w-full h-full relative flex flex-col items-center justify-center gap-8">
            <div id="weather" class="text-8xl animate-pulse"></div>
            <div id="choices" class="flex gap-6"></div>
        </div>`,
        js: `    const WEATHERS = [
        { icon: '☀️', name: 'はれ', correct: '🧢' },
        { icon: '☔', name: 'あめ', correct: '☂️' },
        { icon: '⛄', name: 'ゆき', correct: '🧣' }
    ];
    const ALL_CLOTHES = ['🧢', '☂️', '🧣', '🕶️', '👢'];
    let isFinished = false;

    function init() {
        const weather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
        document.getElementById('weather').innerHTML = \`\${weather.icon}<br><span class="text-2xl font-bold">\${weather.name} のひは？</span>\`;
        
        let currentChoices = [weather.correct];
        while(currentChoices.length < 3) {
            const dummy = ALL_CLOTHES[Math.floor(Math.random() * ALL_CLOTHES.length)];
            if(!currentChoices.includes(dummy)) currentChoices.push(dummy);
        }
        currentChoices.sort(() => Math.random() - 0.5);

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'text-7xl p-4 bg-white rounded-full shadow-md border-4 border-orange-200 hover:scale-110 transition-transform active:scale-95';
            btn.innerHTML = choice;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice === weather.correct) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{});
                    btn.classList.add('bg-yellow-200');
                    isFinished = true;
                    setTimeout(finishGame, 800);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    btn.classList.add('opacity-50');
                }
            };
            choicesContainer.appendChild(btn);
        });
    }`
    },
    '009_color_mix': {
        html: `        <div id="stage" class="w-full h-full relative flex flex-col items-center justify-center gap-8">
            <div class="flex items-center gap-4 text-6xl">
                <div id="color1" class="w-24 h-24 rounded-full shadow-inner"></div>
                <div class="font-bold text-gray-400">+</div>
                <div id="color2" class="w-24 h-24 rounded-full shadow-inner"></div>
                <div class="font-bold text-gray-400">=</div>
                <div id="result-box" class="w-28 h-28 rounded-full border-4 border-dashed border-gray-400 flex items-center justify-center text-4xl text-gray-300">?</div>
            </div>
            <div id="choices" class="flex gap-6 mt-8"></div>
        </div>`,
        js: `    const MIXES = [
        { c1: 'bg-red-500', c2: 'bg-blue-500', ans: 'bg-purple-500' },
        { c1: 'bg-red-500', c2: 'bg-yellow-400', ans: 'bg-orange-500' },
        { c1: 'bg-blue-500', c2: 'bg-yellow-400', ans: 'bg-green-500' }
    ];
    const ALL_COLORS = ['bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-teal-500'];
    let isFinished = false;

    function init() {
        const mix = MIXES[Math.floor(Math.random() * MIXES.length)];
        document.getElementById('color1').className = \`w-24 h-24 rounded-full shadow-inner \${mix.c1}\`;
        document.getElementById('color2').className = \`w-24 h-24 rounded-full shadow-inner \${mix.c2}\`;
        
        let currentChoices = [mix.ans];
        while(currentChoices.length < 3) {
            const dummy = ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)];
            if(!currentChoices.includes(dummy)) currentChoices.push(dummy);
        }
        currentChoices.sort(() => Math.random() - 0.5);

        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        currentChoices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = \`w-20 h-20 rounded-full shadow-md hover:scale-110 transition-transform active:scale-95 \${choice}\`;
            btn.onclick = () => {
                if (isFinished) return;
                if (choice === mix.ans) {
                    soundTap.currentTime = 0; soundTap.play().catch(e=>{});
                    const resBox = document.getElementById('result-box');
                    resBox.className = \`w-28 h-28 rounded-full shadow-lg border-4 border-white animate-bounce \${choice}\`;
                    resBox.innerHTML = '';
                    isFinished = true;
                    setTimeout(finishGame, 1000);
                } else {
                    soundError.currentTime = 0; soundError.play().catch(e=>{});
                    btn.classList.add('opacity-20');
                }
            };
            choicesContainer.appendChild(btn);
        });
    }`
    },
    '010_piano': {
        html: `        <div id="stage" class="w-full h-full relative flex items-center justify-center">
            <div id="keyboard" class="flex gap-2"></div>
        </div>`,
        js: `    const NOTES = [
        { color: 'bg-red-400', key: 'ド' }, { color: 'bg-orange-400', key: 'レ' },
        { color: 'bg-yellow-400', key: 'ミ' }, { color: 'bg-green-400', key: 'ファ' },
        { color: 'bg-blue-400', key: 'ソ' }, { color: 'bg-indigo-400', key: 'ラ' },
        { color: 'bg-purple-400', key: 'シ' }, { color: 'bg-pink-400', key: 'ド' }
    ];
    let tapCount = 0;
    
    function init() {
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = '';
        NOTES.forEach((note, i) => {
            const key = document.createElement('button');
            key.className = \`w-12 h-48 md:w-16 md:h-64 rounded-b-xl shadow-md border-b-8 border-black/20 text-white font-bold text-xl flex items-end justify-center pb-4 hover:brightness-110 active:translate-y-2 active:border-b-0 transition-all \${note.color}\`;
            key.textContent = note.key;
            key.onclick = () => {
                // 本来は音階ごとの音源を鳴らすが、今回はタップ音で代用しピッチを変える擬似実装
                const s = soundTap.cloneNode();
                s.preservesPitch = false;
                s.playbackRate = 0.8 + (i * 0.1);
                s.play().catch(e=>{});
                
                tapCount++;
                // 適当に10回弾いたらクリアとする
                if(tapCount === 10) setTimeout(finishGame, 500);
            };
            keyboard.appendChild(key);
        });
    }`
    }
};

const projectRoot = path.join(__dirname, '..');

for (const [dir, impl] of Object.entries(implementations)) {
    const htmlPath = path.join(projectRoot, 'games', dir, 'start.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    htmlContent = htmlContent.replace(/<div id="stage"[\s\S]*?<\/div>/, impl.html);
    fs.writeFileSync(htmlPath, htmlContent);

    const jsPath = path.join(projectRoot, 'games', dir, 'js', 'main.js');
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // 既存の init() と イベントリスナー登録部分を新しいロジックに置き換え
    jsContent = jsContent.replace(/document\.addEventListener\('DOMContentLoaded'[\s\S]*?function finishGame/, 
`document.addEventListener('DOMContentLoaded', () => {
    const finishOverlay = document.getElementById('finish-overlay');
    const soundTap = new Audio('../../static/sounds/staging/短い音-ポヨン.mp3');
    const soundClear = new Audio('../../static/sounds/staging/ジャジャーン1.mp3');
    const soundSelect = new Audio('../../static/sounds/system/決定1.mp3');
    const soundError = new Audio('../../static/sounds/system/エラー2.mp3');

${impl.js}

    function finishGame`);
    
    fs.writeFileSync(jsPath, jsContent);
}

console.log('Implementations applied.');
