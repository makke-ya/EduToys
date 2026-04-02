/**
 * sticker_system.js
 * シールの抽選と保存を管理するシステム
 */

const STICKER_DB = {
    N: { label: 'ノーマル', color: 'text-gray-500 bg-gray-100 border-gray-300', rate: 60, items: ['🍎', '🚗', '🐶', '🎈', '🌻', '🐟', '⚽', '🧸'] },
    R: { label: 'レア', color: 'text-blue-500 bg-blue-100 border-blue-300', rate: 25, items: ['⭐', '🌙', '🐱', '🌸', '🐬', '🚗', '🍓', '🍀'] },
    SR: { label: 'スーパーレア', color: 'text-purple-500 bg-purple-100 border-purple-300', rate: 12, items: ['👑', '🦄', '🚀', '💎', '🍰', '🛸', '🦖', '🎸'] },
    UR: { label: 'ウルトラレア', color: 'text-yellow-500 bg-yellow-100 border-yellow-400', rate: 3, items: ['🐉', '🌈', '🏆', '✨', '🌍', '🌋', '🧞‍♂️', '🎰'] }
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
        saved.push({
            ...sticker,
            date: new Date().toISOString()
        });
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
