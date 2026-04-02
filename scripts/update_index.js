const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexFile, 'utf8');

const games = [
    { id: '002', name: 'おおきいのはどっち？', dir: '002_compare_size', desc: 'おおきいほうを タップしてね！', icon: '🐘', color: 'green', tag: 'かず・かたち', tagColor: 'green' },
    { id: '003', name: 'かたちあわせ', dir: '003_shape_match', desc: 'おなじ かたちを さがそう！', icon: '🔺', color: 'yellow', tag: 'かず・かたち', tagColor: 'green' },
    { id: '004', name: 'これなあに？', dir: '004_name_guess', desc: 'えをみて なまえを あててね！', icon: '🐶', color: 'pink', tag: 'ことば', tagColor: 'pink' },
    { id: '005', name: 'どんなきもち？', dir: '005_emotions', desc: 'どんな おかおを しているかな？', icon: '😊', color: 'blue', tag: 'にんげんかんけい', tagColor: 'blue' },
    { id: '006', name: 'てあらいできるかな', dir: '006_hand_wash', desc: 'ばいきんを アワアワで やっつけよう！', icon: '🧼', color: 'cyan', tag: 'せいかつ', tagColor: 'cyan' },
    { id: '007', name: 'はんたいことば', dir: '007_opposites', desc: 'はんたいの いみを さがしてね！', icon: '↔️', color: 'purple', tag: 'ことば', tagColor: 'pink' },
    { id: '008', name: 'おきがええらび', dir: '008_clothes', desc: 'おてんきに あう おようふくは どれ？', icon: '👕', color: 'orange', tag: 'せいかつ', tagColor: 'cyan' },
    { id: '009', name: 'いろまぜマジック', dir: '009_color_mix', desc: 'いろを まぜると どうなるかな？', icon: '🎨', color: 'red', tag: 'ひょうげん', tagColor: 'red' },
    { id: '010', name: 'カラフルピアノ', dir: '010_piano', desc: 'すきな おとを ならして あそぼう！', icon: '🎹', color: 'indigo', tag: 'ひょうげん', tagColor: 'red' }
];

let gamesHtml = '';
games.forEach(game => {
    gamesHtml += `
            <!-- ${game.dir} -->
            <button onclick="openInIframe('games/${game.dir}/start.html?autoplay=1')" class="block text-left bg-white rounded-3xl shadow-lg border-4 border-${game.color}-300 hover:border-${game.color}-500 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group">
                <div class="h-40 bg-${game.color}-100 flex items-center justify-center text-7xl group-hover:scale-110 transition-transform">
                    ${game.icon}
                </div>
                <div class="p-6">
                    <span class="inline-block bg-${game.tagColor}-100 text-${game.tagColor}-700 text-sm font-bold px-3 py-1 rounded-full mb-2">${game.tag}</span>
                    <h2 class="text-2xl font-black text-gray-800 mb-2">${game.name}</h2>
                    <p class="text-gray-600 font-medium">${game.desc}</p>
                </div>
            </button>`;
});

// 置換マーカーがないので正規表現でリストの部分に追加する
const replacementRegex = /(<!-- 001_counting_apples -->[\s\S]*?<\/button>)/;
content = content.replace(replacementRegex, '$1' + gamesHtml);

fs.writeFileSync(indexFile, content);
console.log('index.html updated successfully.');
