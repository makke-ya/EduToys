const { execFileSync } = require('child_process');
const path = require('path');

describe('sticker generation script', () => {
    it('should target existing sticker png assets in dry-run mode', () => {
        const repoRoot = path.resolve(__dirname, '..');
        const output = execFileSync('node', ['scripts/generate_sticker_images.mjs', '--dry-run'], {
            cwd: repoRoot,
            encoding: 'utf8'
        });

        expect(output).toContain('static/stickers/animals/rabbit.png');
        expect(output).toContain('static/stickers/food/cake.png');
        expect(output).not.toContain('nanobanana-output');
    });
});
