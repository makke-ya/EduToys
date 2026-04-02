/**
 * sticker_system.js
 * シールの抽選と保存を管理するシステム
 */

const STICKER_DB = {
    N: { label: 'ノーマル', color: 'text-gray-500 bg-gray-100 border-gray-300', rate: 86.9, items: ['🍎', '🚗', '🐶', '🎈', '🌻', '🐟', '⚽', '🧸', '🦋', '🐢', '🍩', '🍔', '✈️', '🚌', '🐸'] }, // 15種類
    R: { label: 'レア', color: 'text-blue-500 bg-blue-100 border-blue-300', rate: 10.0, items: ['⭐', '🌙', '🐱', '🌸', '🐬', '🍓', '🍀', '🏰'] }, // 8種類
    SR: { label: 'スーパーレア', color: 'text-purple-500 bg-purple-100 border-purple-300', rate: 3.0, items: ['👑', '🦄', '🚀', '💎', '🍰'] }, // 5種類
    UR: { label: 'ウルトラレア', color: 'text-yellow-500 bg-yellow-100 border-yellow-400', rate: 0.1, items: ['🐉', '🌈'] } // 2種類
};

const STICKER_STORAGE_KEY = 'edutoys_stickers';

const StickerSystem = {
    // 確率に基づいてレアリティを決定
    _rollRarity: function() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const [rarity, data] of Object.entries(STICKER_DB)) {
            cumulative += data.rate;
            if (rand <= cumulative) {
                return rarity;
            }
        }
        return 'N';
    },

    // 3つのシールを抽選して返す
    drawThree: function() {
        const drawn = [];
        while(drawn.length < 3) {
            const rarity = this._rollRarity();
            const items = STICKER_DB[rarity].items;
            const item = items[Math.floor(Math.random() * items.length)];
            
            // 重複チェック
            if (!drawn.find(d => d.item === item && d.rarity === rarity)) {
                drawn.push({ rarity, item, data: STICKER_DB[rarity] });
            }
        }
        return drawn;
    },

    // シールを保存する
    saveSticker: function(sticker) {
        const saved = this.getSavedStickers();
        const newSticker = {
            ...sticker,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString(),
            x: 0,
            y: 0,
            rotation: 0
        };
        saved.push(newSticker);
        localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(saved));
        return newSticker;
    },

    // シールの座標を更新する
    updateStickerPosition: function(id, x, y, rotation) {
        const saved = this.getSavedStickers();
        const sticker = saved.find(s => s.id === id);
        if (sticker) {
            sticker.x = x;
            sticker.y = y;
            sticker.rotation = rotation;
        }
        localStorage.setItem(STICKER_STORAGE_KEY, JSON.stringify(saved));
    },

    // 保存されたシールを取得する
    getSavedStickers: function() {
        const data = localStorage.getItem(STICKER_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }
};

// ブラウザ環境でグローバルに使えるようにする
window.StickerSystem = StickerSystem;
