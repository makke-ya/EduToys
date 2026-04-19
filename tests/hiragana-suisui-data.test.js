const path = require('path');

describe('003 hiragana letter data helpers', () => {
    const modulePath = path.join(__dirname, '..', 'games', '003_hiragana_suisui', 'js', 'letter-data.js');
    let letterDataModule;

    function extractPathNumbers(pathData) {
        return (String(pathData || '').match(/-?\d*\.?\d+/g) || []).map(Number);
    }

    beforeEach(() => {
        jest.resetModules();
        letterDataModule = require(modulePath);
    });

    it('should expose a normalized playable hiragana dataset', () => {
        const dataset = letterDataModule.getPlayableHiraganaData();

        expect(Array.isArray(dataset)).toBe(true);
        expect(dataset.length).toBeGreaterThanOrEqual(70);
        expect(dataset).toEqual(expect.arrayContaining([
            expect.objectContaining({ label: 'あ', strokeCount: 3 }),
            expect.objectContaining({ label: 'ん' })
        ]));
        expect(dataset[0]).toEqual(expect.objectContaining({
            id: expect.any(String),
            label: expect.any(String),
            strokes: expect.any(Array),
            difficultyGroup: expect.any(String)
        }));
        expect(dataset[0].strokes[0]).toEqual(expect.objectContaining({
            guidePath: expect.any(String),
            renderPath: expect.any(String),
            segments: expect.any(Array)
        }));
    });

    it('should select unique play letters from the full hiragana dataset', () => {
        const dataset = letterDataModule.getPlayableHiraganaData();
        const selected = letterDataModule.selectPlayLetters(dataset, 3, () => 0.21);

        expect(selected).toHaveLength(3);
        expect(new Set(selected.map((entry) => entry.id)).size).toBe(3);
    });

    it('should normalize each stroke to a single in-bounds guide path for all hiragana', () => {
        const dataset = letterDataModule.getPlayableHiraganaData();

        dataset.forEach((entry) => {
            const [minX, minY, width, height] = entry.viewBox.split(/\s+/).map(Number);
            const maxX = minX + width;
            const maxY = minY + height;

            entry.strokes.forEach((stroke) => {
                const values = extractPathNumbers(stroke.guidePath);
                const xs = values.filter((_, index) => index % 2 === 0);
                const ys = values.filter((_, index) => index % 2 === 1);

                expect(stroke.guidePath).toEqual(expect.any(String));
                expect(xs.length).toBeGreaterThan(0);
                expect(ys.length).toBeGreaterThan(0);
                expect(Math.min(...xs)).toBeGreaterThanOrEqual(minX);
                expect(Math.max(...xs)).toBeLessThanOrEqual(maxX);
                expect(Math.min(...ys)).toBeGreaterThanOrEqual(minY);
                expect(Math.max(...ys)).toBeLessThanOrEqual(maxY);
            });
        });
    });

    it('should avoid malformed duplicate guide paths such as the broken second stroke of お', () => {
        const dataset = letterDataModule.getPlayableHiraganaData();
        const letterO = dataset.find((entry) => entry.label === 'お');

        expect(letterO).toBeDefined();
        expect(letterO.strokes[1].guidePath).toContain('M 287,100');
        expect(letterO.strokes[1].guidePath).not.toContain('1712');
    });

    it('should render every hiragana stroke from its sanitized stroke path to avoid stray outline artifacts', () => {
        const dataset = letterDataModule.getPlayableHiraganaData();
        const letterZa = dataset.find((entry) => entry.label === 'ざ');

        dataset.forEach((entry) => {
            entry.strokes.forEach((stroke) => {
                expect(stroke.renderPath).toBe(stroke.guidePath);
            });
        });

        expect(letterZa).toBeDefined();
        expect(letterZa.strokes[0].renderPath).toBe('M 274,415 751,300');
        expect(letterZa.strokes[0].renderPath).not.toContain('562 416');
    });
});
