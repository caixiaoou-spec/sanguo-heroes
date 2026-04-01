// 势力选择场景
import { FACTIONS_DATA } from '../data/factions.js';
import Renderer from '../engine/renderer.js';

export default class FactionSelectScene {
    constructor(game) {
        this.game = game;
        this.renderer = game.renderer;
        this.input = game.input;
        this.selectedFaction = null;
        this.hoveredFaction = null;
        this.factions = FACTIONS_DATA;
        this.animTimer = 0;
    }

    _layout() {
        const r = this.renderer;
        const n = this.factions.length;
        // 动态列数：≤8用4列，≤15用5列，≤25用5列（5行），更多用6列
        const cols = n <= 8 ? 4 : 5;
        const rows = Math.ceil(n / cols);
        const startY = 80;
        const bottomY = r.height - 68; // 底部按钮区域（留足够空间给确认按钮）
        const availH = bottomY - startY;
        const gap = 8;
        const cardH = Math.floor((availH - (rows - 1) * gap) / rows);
        const cardW = Math.floor((r.width - 20 * 2 - (cols - 1) * gap) / cols);
        const startX = Math.floor((r.width - (cols * cardW + (cols - 1) * gap)) / 2);
        return { cols, cardW, cardH, gap, startX, startY };
    }

    update(dt) {
        this.animTimer += dt;

        const mx = this.input.mouse.x;
        const my = this.input.mouse.y;

        // Calculate card positions
        this.hoveredFaction = null;
        const { cols, cardW, cardH, gap, startX, startY } = this._layout();

        for (let i = 0; i < this.factions.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * (cardW + gap);
            const cy = startY + row * (cardH + gap);

            if (mx >= cx && mx <= cx + cardW && my >= cy && my <= cy + cardH) {
                this.hoveredFaction = this.factions[i];
            }
        }

        const click = this.input.getClick();
        if (click) {
            const r = this.renderer;

            if (this.hoveredFaction) {
                this.game.audio.playSFX('click');
                this.selectedFaction = this.hoveredFaction;
            }

            // Confirm button
            if (this.selectedFaction) {
                const btnX = r.width / 2 - 80;
                const btnY = r.height - 50;
                if (click.x >= btnX && click.x <= btnX + 160 && click.y >= btnY && click.y <= btnY + 36) {
                    this.game.audio.playSFX('click');
                    this.game.gameState.initNewGame(this.selectedFaction.id);
                    this.game.switchScene('worldmap');
                }
            }

            // Back button
            if (click.x >= 20 && click.x <= 90 && click.y >= r.height - 50 && click.y <= r.height - 14) {
                this.game.audio.playSFX('click');
                this.game.switchScene('menu');
            }
        }
    }

    render() {
        const r = this.renderer;
        const ctx = r.ctx;

        r.clear('#0a0a1a');

        // Title
        r.drawText('选择势力', r.width / 2, 38, {
            color: '#ffe080', size: 28, align: 'center', baseline: 'middle', bold: true, shadow: true
        });

        r.drawText('选择你将率领的势力，统一天下', r.width / 2, 64, {
            color: '#c8a850', size: 15, align: 'center', baseline: 'middle'
        });

        // Faction cards
        const { cols, cardW, cardH, gap, startX, startY } = this._layout();
        const compact = cols >= 5;

        for (let i = 0; i < this.factions.length; i++) {
            const f = this.factions[i];
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = startX + col * (cardW + gap);
            const cy = startY + row * (cardH + gap);

            const isHovered = this.hoveredFaction === f;
            const isSelected = this.selectedFaction === f;

            // Card background
            const bgColor = isSelected ? 'rgba(200,168,80,0.15)' : 'rgba(30,15,5,0.9)';
            const borderColor = isSelected ? '#ffe080' : (isHovered ? '#c8a850' : '#554420');
            r.roundRect(cx, cy, cardW, cardH, 4, bgColor, borderColor);

            if (isSelected || isHovered) {
                // Glow effect
                ctx.shadowColor = f.color;
                ctx.shadowBlur = isSelected ? 15 : 8;
                r.roundRect(cx, cy, cardW, cardH, 4, null, f.color);
                ctx.shadowBlur = 0;
            }

            // Color strip
            r.fillRect(cx, cy, cardW, 4, f.color);

            // Horizontal layout: dot on left, text on right
            const dotR = compact ? 22 : 26;
            const dotX = cx + dotR + 10;
            const dotY = cy + cardH / 2 - 6;

            // Faction color dot
            r.fillCircle(dotX, dotY, dotR, f.color);
            r.strokeCircle(dotX, dotY, dotR, f.colorLight || f.color, 2);

            // First character of name inside dot
            r.drawText(f.name[0], dotX, dotY, {
                color: '#fff', size: compact ? 18 : 22, align: 'center', baseline: 'middle', bold: true
            });

            // Text area to the right of the dot
            const textX = dotX + dotR + 10;
            const textW = cx + cardW - textX - 6;
            let textY = cy + 18;

            // Faction name
            r.drawText(f.name, textX, textY, {
                color: '#ffe080', size: compact ? 16 : 18, bold: true
            });
            textY += compact ? 18 : 22;

            // Title
            r.drawText(f.title, textX, textY, {
                color: '#999', size: compact ? 12 : 13
            });
            textY += compact ? 15 : 18;

            // Description
            r.drawText(f.description, textX, textY, {
                color: '#c8a850', size: compact ? 11 : 12, maxWidth: textW
            });
            textY += compact ? 14 : 18;

            // Stats in two columns
            const statSize = compact ? 11 : 12;
            const statCol2 = textX + Math.floor(textW / 2);
            r.drawText(`城: ${f.cities.length}  将: ${f.generals.length}`, textX, textY, { color: '#aaa', size: statSize });
            textY += compact ? 13 : 16;
            r.drawText(`金: ${f.gold}  粮: ${f.food}`, textX, textY, { color: '#aaa', size: statSize });
        }

        // Bottom buttons
        const mx = this.input.mouse.x, my = this.input.mouse.y;
        // Back
        r.drawButton(20, r.height - 50, 70, 36, '返回',
            Renderer.pointInRect(mx, my, 20, r.height - 50, 70, 36));

        // Confirm
        if (this.selectedFaction) {
            const btnX = r.width / 2 - 80;
            const btnY = r.height - 50;
            r.drawButton(btnX, btnY, 160, 36, `以${this.selectedFaction.name}开始`,
                Renderer.pointInRect(mx, my, btnX, btnY, 160, 36));
        }
    }
}
