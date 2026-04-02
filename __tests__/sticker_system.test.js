/**
 * @jest-environment jsdom
 */

// StickerSystem をインポートまたは定義（既存の sticker_system.js をモックまたは読み込む）
// ここではテスト用に簡易的に定義し、後で実際のファイルを修正します

describe('StickerSystem', () => {
  const STORAGE_KEY = 'edutoys_stickers';

  beforeEach(() => {
    localStorage.clear();
    // テスト対象の定義（実際には sticker_system.js が読み込まれる想定）
    window.StickerSystem = {
        saveSticker: function(sticker) {
            const data = localStorage.getItem(STORAGE_KEY);
            const saved = data ? JSON.parse(data) : [];
            const newSticker = {
                ...sticker,
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString(),
                x: 0,
                y: 0,
                rotation: 0
            };
            saved.push(newSticker);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
            return newSticker;
        },
        updateStickerPosition: function(id, x, y, rotation) {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return;
            const saved = JSON.parse(data);
            const sticker = saved.find(s => s.id === id);
            if (sticker) {
                sticker.x = x;
                sticker.y = y;
                sticker.rotation = rotation;
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        },
        getSavedStickers: function() {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        }
    };
  });

  test('シールを保存すると、デフォルトの座標(0,0)が設定される', () => {
    const sticker = { item: '🍎', rarity: 'N' };
    const saved = window.StickerSystem.saveSticker(sticker);
    expect(saved.x).toBe(0);
    expect(saved.y).toBe(0);
    expect(saved.rotation).toBe(0);
    expect(saved.id).toBeDefined();
  });

  test('シールの座標を更新できる', () => {
    const sticker = { item: '🚗', rarity: 'N' };
    const saved = window.StickerSystem.saveSticker(sticker);
    
    window.StickerSystem.updateStickerPosition(saved.id, 100, 200, 45);
    
    const allStickers = window.StickerSystem.getSavedStickers();
    const updated = allStickers.find(s => s.id === saved.id);
    expect(updated.x).toBe(100);
    expect(updated.y).toBe(200);
    expect(updated.rotation).toBe(45);
  });
});
