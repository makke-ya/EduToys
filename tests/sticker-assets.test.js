const fs = require('fs');
const path = require('path');

describe('sticker asset catalog', () => {
    it('should point every sticker to an existing png file', () => {
        const repoRoot = path.resolve(__dirname, '..');
        const catalogPath = path.join(repoRoot, 'static', 'stickers', 'stickers.json');
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

        for (const sticker of catalog.stickers) {
            expect(sticker.path.endsWith('.png')).toBe(true);
            expect(fs.existsSync(path.join(repoRoot, sticker.path))).toBe(true);
        }
    });
});
