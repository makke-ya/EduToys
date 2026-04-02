const fs = require('fs');
const path = require('path');

const docsFile = path.join(__dirname, '..', 'docs', 'GAME_IDEAS.md');
let content = fs.readFileSync(docsFile, 'utf8');

const updates = [
    { old: '- **E-04. 大小比較**: どちらが「大きい/小さい」か当てる。 [ ]', new: '- **E-04. 大小比較**: どちらが「大きい/小さい」か当てる。 [games/002_compare_size]' },
    { old: '- **E-11. 形合わせ（あかまる風）**: 色と形を指定された場所に置く。 [ ]', new: '- **E-11. 形合わせ（あかまる風）**: 色と形を指定された場所に置く。 [games/003_shape_match]' },
    { old: '- **L-06. 絵カード名前当て**: イラストを見て名前を4択から選ぶ。 [ ]', new: '- **L-06. 絵カード名前当て**: イラストを見て名前を4択から選ぶ。 [games/004_name_guess]' },
    { old: '- **R-06. 表情どっち？**: 泣いている子に合う感情を選ぶ。 [ ]', new: '- **R-06. 表情どっち？**: 泣いている子に合う感情を選ぶ。 [games/005_emotions]' },
    { old: '- **H-02. 手洗いステップ**: 石鹸、こする、流すの順序。 [ ]', new: '- **H-02. 手洗いステップ**: 石鹸、こする、流すの順序。 [games/006_hand_wash]' },
    { old: '- **L-08. 反対ことばパズル**: 「大きい」の反対は？などの対義語ペア。 [ ]', new: '- **L-08. 反対ことばパズル**: 「大きい」の反対は？などの対義語ペア。 [games/007_opposites]' },
    { old: '- **E-24. 天気と服装**: 晴れ・雨・雪に適した服を選ぶ。 [ ]', new: '- **E-24. 天気と服装**: 晴れ・雨・雪に適した服を選ぶ。 [games/008_clothes]' },
    { old: '- **E-29. 色のまぜまぜ**: 赤＋青＝？などの混色実験。 [ ]', new: '- **E-29. 色のまぜまぜ**: 赤＋青＝？などの混色実験。 [games/009_color_mix]' },
    { old: '- **A-06. カラフルピアノ**: 音階に合わせて色が変わるピアノ。 [ ]', new: '- **A-06. カラフルピアノ**: 音階に合わせて色が変わるピアノ。 [games/010_piano]' }
];

updates.forEach(up => {
    content = content.replace(up.old, up.new);
});

fs.writeFileSync(docsFile, content);
console.log('GAME_IDEAS.md updated successfully.');
