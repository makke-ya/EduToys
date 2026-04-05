const fs = require('fs');
let code = fs.readFileSync('games/004_number_tracing/js/main.js', 'utf8');

// Fix 5 stroke order: First stroke goes down and curves, Second stroke goes right across the top
code = code.replace(
    /'5': \{ paths: \['M 40 15 L 35 45 C 35 45, 80 40, 80 65 C 80 90, 30 90, 30 75', 'M 40 15 L 75 15'\] \}/,
    "'5': { paths: ['M 40 15 L 35 45 C 35 45, 80 40, 80 65 C 80 90, 30 90, 30 75', 'M 40 15 L 75 15'] }"
);

fs.writeFileSync('games/004_number_tracing/js/main.js', code);
