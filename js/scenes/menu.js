// 主菜单场景
export default class MenuScene {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        this.input = game.input;
        this.selectedBtn = -1;
        this.starField = [];
        this.titlePulse = 0;

        const r = this.renderer;
        // Create star field for background
        for (let i = 0; i < 100; i++) {
            this.starField.push({
                x: Math.random() * r.width,
                y: Math.random() * r.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                brightness: Math.random()
            });
        }

        this.buttons = [
            { text: '新的征程', action: 'new_game' },
            { text: '继续征战', action: 'load_game' },
            { text: '游戏设置', action: 'settings' }
        ];
    }

    update(dt) {
        this.titlePulse += dt * 2;
        const r = this.renderer;

        // Animate stars
        for (const star of this.starField) {
            star.y += star.speed;
            star.brightness = 0.5 + Math.sin(Date.now() * 0.001 + star.x) * 0.5;
            if (star.y > r.height) { star.y = 0; star.x = Math.random() * r.width; }
        }

        // Check mouse hover
        const mx = this.input.mouse.x;
        const my = this.input.mouse.y;
        this.selectedBtn = -1;
        const btnW = 240, btnH = 54;
        const btnX = (r.width - btnW) / 2;
        const btnStartY = r.height * 0.42;
        for (let i = 0; i < this.buttons.length; i++) {
            const btnY = btnStartY + i * 68;
            if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
                this.selectedBtn = i;
            }
        }

        // Check clicks
        const click = this.input.getClick();
        if (click && this.selectedBtn >= 0) {
            this.game.audio.playSFX('click');
            const action = this.buttons[this.selectedBtn].action;
            switch (action) {
                case 'new_game':
                    this.game.switchScene('faction_select');
                    break;
                case 'load_game':
                    if (this.game.saveManager.hasSave()) {
                        const data = this.game.saveManager.load();
                        if (data) {
                            this.game.gameState.loadFromSave(data);
                            this.game.switchScene('worldmap');
                        }
                    }
                    break;
                case 'settings':
                    this.game.audio.toggleMute();
                    break;
            }
        }
    }

    render() {
        const r = this.renderer;
        const ctx = r.ctx;
        const cx = r.width / 2;
        const cy = r.height / 2;

        // Background
        r.clear('#0a0a1a');

        // Stars
        for (const star of this.starField) {
            const alpha = star.brightness;
            ctx.fillStyle = `rgba(200,180,140,${alpha})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        }

        // Decorative border (inset 50px from edges)
        const bx = 50, by = 30;
        const bw = r.width - 100, bh = r.height - 60;
        ctx.strokeStyle = '#c8a850';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.strokeRect(bx + 5, by + 5, bw - 10, bh - 10);

        // Decorative dragons/patterns
        this._drawDecoration(ctx, bx, by, bw, bh);

        // Title
        const pulse = Math.sin(this.titlePulse) * 0.1 + 1;
        ctx.save();
        ctx.translate(cx, r.height * 0.22);
        ctx.scale(pulse, pulse);
        r.drawText('三国英雄传', 0, 0, {
            color: '#ffe080', size: 54, align: 'center', baseline: 'middle',
            bold: true, shadow: true
        });
        ctx.restore();

        // Subtitle
        r.drawText('三国策略游戏', cx, r.height * 0.28, {
            color: '#c8a850', size: 23, align: 'center', baseline: 'middle',
            shadow: true
        });

        // Version
        r.drawText('v1.0', cx, r.height * 0.32, {
            color: '#666', size: 15, align: 'center', baseline: 'middle'
        });

        // Buttons
        const btnW = 240, btnH = 54;
        const btnX = (r.width - btnW) / 2;
        const btnStartY = r.height * 0.42;
        for (let i = 0; i < this.buttons.length; i++) {
            const btnY = btnStartY + i * 68;
            const hover = i === this.selectedBtn;

            if (this.buttons[i].action === 'load_game' && !this.game.saveManager.hasSave()) {
                r.roundRect(btnX, btnY, btnW, btnH, 4, '#1a1008', '#554420');
                r.drawText(this.buttons[i].text, btnX + btnW / 2, btnY + btnH / 2, {
                    color: '#555', size: 25, align: 'center', baseline: 'middle'
                });
            } else {
                r.drawButton(btnX, btnY, btnW, btnH, this.buttons[i].text, hover);
            }
        }

        // Music toggle indicator
        const muteText = this.game.audio.muted ? '音效：关' : '音效：开';
        r.drawText(muteText, cx, r.height * 0.74, {
            color: '#888', size: 17, align: 'center', baseline: 'middle'
        });

    }

    _drawDecoration(ctx, bx, by, bw, bh) {
        const drawCorner = (x, y, sx, sy) => {
            ctx.strokeStyle = '#c8a850';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y + 30 * sy);
            ctx.lineTo(x, y);
            ctx.lineTo(x + 30 * sx, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 5 * sx, y + 25 * sy);
            ctx.lineTo(x + 5 * sx, y + 5 * sy);
            ctx.lineTo(x + 25 * sx, y + 5 * sy);
            ctx.stroke();
        };

        drawCorner(bx + 10, by + 10, 1, 1);
        drawCorner(bx + bw - 10, by + 10, -1, 1);
        drawCorner(bx + 10, by + bh - 10, 1, -1);
        drawCorner(bx + bw - 10, by + bh - 10, -1, -1);
    }
}
