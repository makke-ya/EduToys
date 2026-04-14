/**
 * Game: Counting Bubbles
 */
class GameBubbleScene extends BaseScene {
    constructor(app) {
        super(app);
        this.currentNumber = 1;
        this.maxNumber = 10;
        this.bubbles = [];
        this.isClearing = false;
        this.hanamaru = null;
        
        this.createWorld();
    }

    createWorld() {
        this.bg = PIXI.Sprite.from('static/images/games/001_animal_hide_and_seek/bg.png');
        this.bg.anchor.set(0.5);
        this.addChild(this.bg);

        this.bubbleContainer = new PIXI.Container();
        this.addChild(this.bubbleContainer);

        // 戻るボタン (Canvas)
        this.btnBack = this.createBackButton();
        this.addChild(this.btnBack);

        // 指示テキスト
        this.infoText = new PIXI.Text('しゃぼんだまを タップしてね！', {
            fontFamily: 'Rounded M+ 1c',
            fontSize: 32,
            fontWeight: '900',
            fill: 0x5a4b41,
        });
        this.infoText.anchor.set(0.5);
        this.addChild(this.infoText);

        this.onResize();
    }

    createBackButton() {
        const btn = new PIXI.Graphics();
        btn.beginFill(0xffffff, 0.8);
        btn.drawRoundedRect(0, 0, 120, 60, 30);
        btn.interactive = true;
        btn.cursor = 'pointer';
        
        const label = new PIXI.Text('◀ もどる', { fontSize: 20, fontWeight: '900', fill: 0x5a4b41 });
        label.anchor.set(0.5);
        label.position.set(60, 30);
        btn.addChild(label);
        
        btn.on('pointertap', () => this.app.switchScene('menu'));
        return btn;
    }

    onShow() {
        this.resetGame();
        new Audio('static/sounds/voice/numbers/intro.mp3').play().catch(e=>{});
        this.startBubbleSpawn();
    }

    resetGame() {
        this.currentNumber = 1;
        this.isClearing = false;
        
        // シャボン玉の掃除
        this.bubbles.forEach(b => {
            gsap.killTweensOf(b);
            this.bubbleContainer.removeChild(b);
        });
        this.bubbles = [];
        
        this.infoText.text = '1 を さがしてね！';

        // はなまるの掃除
        if (this.hanamaru) {
            this.removeChild(this.hanamaru);
            this.hanamaru = null;
        }
    }

    startBubbleSpawn() {
        if (this.spawnTimer) clearInterval(this.spawnTimer);
        this.spawnTimer = setInterval(() => {
            if (this.isClearing) return;
            this.spawnBubble();
        }, 1500);
    }

    spawnBubble() {
        const container = new PIXI.Container();
        const size = 100 + Math.random() * 80;
        
        const g = new PIXI.Graphics();
        g.beginFill(0xffffff, 0.2);
        g.lineStyle(4, 0xffffff, 0.5);
        g.drawCircle(0, 0, size / 2);
        g.beginFill(0xffffff, 0.4);
        g.drawEllipse(-size/6, -size/6, size/8, size/12);
        container.addChild(g);

        // 基準解像度 1024x768 内での配置
        container.x = 100 + Math.random() * (DesignWidth - 200);
        container.y = DesignHeight + size;
        container.interactive = true;
        container.cursor = 'pointer';

        const duration = 6 + Math.random() * 4;
        const drift = (Math.random() - 0.5) * 150;
        
        gsap.to(container, {
            y: -size,
            x: container.x + drift,
            duration: duration,
            ease: "none",
            onComplete: () => {
                this.bubbleContainer.removeChild(container);
                this.bubbles = this.bubbles.filter(b => b !== container);
            }
        });

        gsap.to(g, { x: 10, duration: 1 + Math.random(), repeat: -1, yoyo: true, ease: "sine.inOut" });
        container.on('pointerdown', () => this.handleBubbleTap(container));
        
        this.bubbleContainer.addChild(container);
        this.bubbles.push(container);
    }

    handleBubbleTap(bubble) {
        if (this.isClearing) return;
        this.createPopEffect(bubble.x, bubble.y);
        this.showNumber(this.currentNumber, bubble.x, bubble.y);
        new Audio(`static/sounds/voice/numbers/${this.currentNumber}.mp3`).play().catch(e=>{});
        
        gsap.killTweensOf(bubble);
        this.bubbleContainer.removeChild(bubble);
        this.bubbles = this.bubbles.filter(b => b !== bubble);

        this.currentNumber++;
        if (this.currentNumber > this.maxNumber) {
            this.showClear();
        } else {
            this.infoText.text = `${this.currentNumber} を さがしてね！`;
        }
    }

    createPopEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const p = new PIXI.Graphics();
            p.beginFill(0xffffff, 0.8);
            p.drawCircle(0, 0, 4 + Math.random() * 4);
            p.position.set(x, y);
            this.addChild(p);
            
            const angle = (Math.PI * 2 / 8) * i;
            const dist = 50 + Math.random() * 50;
            gsap.to(p, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 0.5,
                onComplete: () => this.removeChild(p)
            });
        }
    }

    showNumber(num, x, y) {
        const text = new PIXI.Text(num, {
            fontFamily: 'Rounded M+ 1c',
            fontSize: 80,
            fontWeight: '900',
            fill: [0xffffff, 0xffd740],
            stroke: 0x5a4b41,
            strokeThickness: 6
        });
        text.anchor.set(0.5);
        text.position.set(x, y);
        this.addChild(text);

        gsap.to(text, {
            y: y - 200,
            alpha: 0,
            duration: 1.5,
            ease: "back.out(1.7)",
            onComplete: () => this.removeChild(text)
        });
    }

    showClear() {
        this.isClearing = true;
        this.infoText.text = 'やったね！ おめでとう！';
        if (this.spawnTimer) clearInterval(this.spawnTimer);

        this.hanamaru = PIXI.Sprite.from('static/images/games/001_animal_hide_and_seek/hanamaru.png');
        this.hanamaru.anchor.set(0.5);
        this.hanamaru.position.set(this.centerX, this.centerY);
        this.hanamaru.scale.set(0);
        this.addChild(this.hanamaru);

        gsap.to(this.hanamaru.scale, { x: 1, y: 1, duration: 1, ease: "elastic.out(1, 0.3)" });
        new Audio('static/sounds/voice/numbers/clear.mp3').play().catch(e=>{});

        setTimeout(() => {
            if (window.StickerSystem) {
                window.StickerSystem.showStickerSelection(() => {
                    this.app.switchScene('menu');
                });
            } else {
                this.app.switchScene('menu');
            }
        }, 3000);
    }

    onResize() {
        this.bg.width = DesignWidth;
        this.bg.height = DesignHeight;
        this.bg.position.set(this.centerX, this.centerY);
        
        this.btnBack.position.set(20, 20);
        this.infoText.position.set(this.centerX, 80);
    }
}

const DesignWidth = 1024;
const DesignHeight = 768;
