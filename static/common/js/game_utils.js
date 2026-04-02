/**
 * EduToys Common Utilities
 */

const GameUtils = {
    // はなまる演出を表示
    showHanamaru: function(containerId = 'game-container') {
        const container = document.getElementById(containerId);
        const div = document.createElement('div');
        div.className = 'hanamaru-container';
        div.innerHTML = `
            <svg class="hanamaru" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" />
                <path d="M60,100 L90,130 L140,70" stroke-width="12" />
            </svg>
        `;
        container.appendChild(div);
        
        // キラキラを散らす
        for(let i=0; i<20; i++) {
            this.createSparkle(container);
        }

        setTimeout(() => div.remove(), 2000);
    },

    // キラキラを生成
    createSparkle: function(parent) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        const dx = (Math.random() - 0.5) * 400;
        const dy = (Math.random() - 0.5) * 400;
        sparkle.style.setProperty('--dx', `${dx}px`);
        sparkle.style.setProperty('--dy', `${dy}px`);
        sparkle.style.left = '50%';
        sparkle.style.top = '50%';
        parent.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 600);
    },

    // マイルドなエラー演出 (首をかしげるような揺れ)
    shakeElement: function(element) {
        element.classList.add('animate-shake');
        setTimeout(() => element.classList.remove('animate-shake'), 500);
    }
};

window.GameUtils = GameUtils;
