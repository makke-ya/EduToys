const fs = require('fs');
const path = require('path');

describe('002_shape_fit assets', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const gameDir = path.join(repoRoot, 'games', '002_shape_fit');

    it('should provide a valid game manifest and entry point', () => {
        const manifestPath = path.join(gameDir, 'game.json');
        expect(fs.existsSync(manifestPath)).toBe(true);

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        expect(manifest).toEqual({
            name: 'かたちぴったん',
            description: 'かたちを ぴったり はめよう！',
            entry_point: 'start.html',
            thumbnail: 'static/thumbnails/002_shape_fit.jpg'
        });

        expect(fs.existsSync(path.join(gameDir, manifest.entry_point))).toBe(true);
    });

    it('should provide the shape fit html, styles, pixel-art images, thumbnail, and voices', () => {
        const startHtmlPath = path.join(gameDir, 'start.html');
        const startHtml = fs.readFileSync(startHtmlPath, 'utf8');

        expect(startHtml).toContain('games/002_shape_fit/css/style.css');
        expect(startHtml).toContain('games/002_shape_fit/js/game.js');
        expect(startHtml).toContain('VOICEVOX:四国めたん');

        const requiredFiles = [
            'games/002_shape_fit/css/style.css',
            'games/002_shape_fit/js/game.js',
            'games/002_shape_fit/images/background_shapes.png',
            'games/002_shape_fit/images/pieces/circle.png',
            'games/002_shape_fit/images/pieces/triangle.png',
            'games/002_shape_fit/images/pieces/square.png',
            'games/002_shape_fit/images/pieces/star.png',
            'games/002_shape_fit/images/pieces/heart.png',
            'games/002_shape_fit/images/pieces/diamond.png',
            'games/002_shape_fit/images/slots/circle_slot.png',
            'games/002_shape_fit/images/slots/triangle_slot.png',
            'games/002_shape_fit/images/slots/square_slot.png',
            'games/002_shape_fit/images/slots/star_slot.png',
            'games/002_shape_fit/images/slots/heart_slot.png',
            'games/002_shape_fit/images/slots/diamond_slot.png',
            'games/002_shape_fit/voices/guide.mp3',
            'games/002_shape_fit/voices/correct_circle.mp3',
            'games/002_shape_fit/voices/correct_triangle.mp3',
            'games/002_shape_fit/voices/correct_square.mp3',
            'games/002_shape_fit/voices/correct_star.mp3',
            'games/002_shape_fit/voices/correct_heart.mp3',
            'games/002_shape_fit/voices/correct_diamond.mp3',
            'games/002_shape_fit/voices/level_clear.mp3',
            'games/002_shape_fit/voices/clear.mp3',
            'static/thumbnails/002_shape_fit.jpg'
        ];

        requiredFiles.forEach((relativePath) => {
            expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
        });
    });

    it('should register a sticker reward pool for the shape fit game', () => {
        const catalogPath = path.join(repoRoot, 'static', 'stickers', 'stickers.json');
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

        expect(catalog.gameStickerPools).toHaveProperty('002_shape_fit');
        expect(catalog.gameStickerPools['002_shape_fit']).toEqual(expect.arrayContaining([
            'animals_rabbit',
            'food_apple',
            'vehicles_car',
            'nature_star'
        ]));
    });
});

describe('003_hiragana_suisui assets', () => {
    const repoRoot = path.resolve(__dirname, '..');
    const gameDir = path.join(repoRoot, 'games', '003_hiragana_suisui');

    it('should provide a valid game manifest and entry point', () => {
        const manifestPath = path.join(gameDir, 'game.json');
        expect(fs.existsSync(manifestPath)).toBe(true);

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        expect(manifest).toEqual({
            name: 'ひらがなすいすい',
            description: 'もじを すいすい なぞろう！',
            entry_point: 'start.html',
            thumbnail: 'static/thumbnails/003_hiragana_suisui.jpg'
        });

        expect(fs.existsSync(path.join(gameDir, manifest.entry_point))).toBe(true);
    });

    it('should provide the hiragana html, styles, data wiring, background, thumbnail, and clear voice', () => {
        const startHtmlPath = path.join(gameDir, 'start.html');
        const startHtml = fs.readFileSync(startHtmlPath, 'utf8');

        expect(startHtml).toContain('games/003_hiragana_suisui/css/style.css');
        expect(startHtml).toContain('games/003_hiragana_suisui/js/letter-data.js');
        expect(startHtml).toContain('games/003_hiragana_suisui/js/trace-engine.js');
        expect(startHtml).toContain('games/003_hiragana_suisui/js/game.js');
        expect(startHtml).toContain('VOICEVOX:四国めたん');

        const requiredFiles = [
            'games/003_hiragana_suisui/css/style.css',
            'games/003_hiragana_suisui/js/game.js',
            'games/003_hiragana_suisui/js/letter-data.js',
            'games/003_hiragana_suisui/js/trace-engine.js',
            'games/003_hiragana_suisui/images/background_hiragana.png',
            'games/003_hiragana_suisui/voices/clear.mp3',
            'static/thumbnails/003_hiragana_suisui.jpg',
            'static/characters/animcjk/manifest.json',
            'static/characters/animcjk/hiragana.json',
            'static/characters/animcjk/COPYING.txt',
            'static/characters/animcjk/LGPL.txt'
        ];

        requiredFiles.forEach((relativePath) => {
            expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
        });
    });

    it('should register a sticker reward pool for the hiragana game', () => {
        const catalogPath = path.join(repoRoot, 'static', 'stickers', 'stickers.json');
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

        expect(catalog.gameStickerPools).toHaveProperty('003_hiragana_suisui');
        expect(catalog.gameStickerPools['003_hiragana_suisui']).toEqual(expect.arrayContaining([
            'animals_rabbit',
            'food_apple',
            'vehicles_train',
            'nature_rainbow'
        ]));
    });
});
