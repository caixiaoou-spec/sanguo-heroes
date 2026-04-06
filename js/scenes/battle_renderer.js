/**
 * battle_renderer.js — 战斗渲染层
 *
 * 从 BattleScene 提取的所有 canvas/renderer 渲染方法。
 * 通过 scene 引用访问战斗状态。
 */
import Renderer from '../engine/renderer.js';

const FORMATIONS = [
    { id: 'crane_wing', name: '鹤翼阵', desc: '主将居中，士兵两翼展开', bonus: '均衡（默认）', bonusTag: '' },
    { id: 'arrow', name: '锋矢阵', desc: '主将冲锋在前，V形跟随', bonus: '主将攻击+10%', bonusTag: '攻+10%' },
    { id: 'fish', name: '鱼鳞阵', desc: '士兵密集前排，保护主将', bonus: '受伤-15%', bonusTag: '伤-15%' },
    { id: 'goose', name: '雁行阵', desc: '斜线排列，远程靠后', bonus: '弓兵射程+30', bonusTag: '射程+' },
    { id: 'circle', name: '方圆阵', desc: '主将居中，士兵围绕防御', bonus: '全体HP+10%', bonusTag: 'HP+10%' },
    { id: 'charge', name: '冲锋阵', desc: '全军并排，齐头冲锋', bonus: '移速+20%', bonusTag: '速+20%' },
];

export class BattleRenderer {
    constructor(scene) {
        this._s = scene;
    }

    _renderPickPhase(r, ctx) {
        r.clear('#0a0a14');
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 220);
        skyGrad.addColorStop(0, '#0a1428');
        skyGrad.addColorStop(0.5, '#1a2a4a');
        skyGrad.addColorStop(1, '#3a5a3a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, r.width, 220);
        this._drawMountains(r, ctx);
        const fieldGrad = ctx.createLinearGradient(0, 230, 0, r.height);
        fieldGrad.addColorStop(0, '#2a4a2a');
        fieldGrad.addColorStop(1, '#1a2a1a');
        ctx.fillStyle = fieldGrad;
        ctx.fillRect(0, 230, r.width, r.height - 230);

        // Top bar
        r.fillRect(0, 0, r.width, 66, 'rgba(10,5,2,0.85)');
        r.drawLine(0, 66, r.width, 66, '#c8a850', 2);

        const atkFaction = this._s.battle.attacker.faction;
        const defFaction = this._s.battle.defender.faction;
        r.drawText(`攻方: ${atkFaction ? atkFaction.name : '???'}`, 20, 18, { color: '#44aaff', size: 19, bold: true, shadow: true });
        r.drawText('选将出战', r.width / 2, 18, { color: '#ffe080', size: 23, align: 'center', bold: true, shadow: true });
        r.drawText(`守方: ${defFaction ? defFaction.name : '???'}`, r.width - 20, 18, { color: '#ff6644', size: 19, align: 'right', bold: true, shadow: true });

        // Score display — below the gold line
        const score = this._s.battle.matchScore;
        r.drawText(`${score.left} : ${score.right}`, r.width / 2, 70, {
            color: '#ffe080', size: 17, align: 'center'
        });

        // Show AI's picked unit at top — same card layout as player cards
        if (this._s._aiPickedUnit) {
            const aiUnit = this._s._aiPickedUnit;
            const gen = aiUnit.general;

            const cardW = 160;
            const cardH = 212;
            const cardX = r.width / 2 - cardW / 2;
            const cardY = 90;

            r.roundRect(cardX, cardY, cardW, cardH, 5, 'rgba(255,50,50,0.15)', '#ff4444');

            // "对方出战" label inside card top
            r.fillRect(cardX + 1, cardY + 1, cardW - 2, 24, 'rgba(255,50,50,0.25)');
            r.drawText('对方出战', r.width / 2, cardY + 13, { color: '#ff6644', size: 14, align: 'center', baseline: 'middle', bold: true });

            // Portrait
            r.drawPortrait(cardX + cardW / 2 - 30, cardY + 28, 60, gen.portrait, gen.name, gen.id);

            // Name
            r.drawText(gen.name, r.width / 2, cardY + 100, {
                color: '#ff8866', size: 17, align: 'center', bold: true, shadow: true
            });

            // Stats
            r.drawText(`武${gen.war} 智${gen.int}`, r.width / 2, cardY + 120, {
                color: '#aaa', size: 16, align: 'center'
            });
            r.drawText(`统${gen.lead} 兵${aiUnit.soldiers}`, r.width / 2, cardY + 138, {
                color: '#aaa', size: 16, align: 'center'
            });

            // HP bar + text (inside card)
            const hpRatio = aiUnit.hp / aiUnit.maxHp;
            r.drawBar(cardX + 15, cardY + 162, cardW - 30, 6, hpRatio,
                hpRatio > 0.5 ? '#44cc44' : (hpRatio > 0.25 ? '#cccc44' : '#cc4444'));
            r.drawText(`HP: ${Math.floor(aiUnit.hp)}/${aiUnit.maxHp}`, r.width / 2, cardY + 176, {
                color: '#999', size: 15, align: 'center'
            });

            // Unit type badge (inside card)
            const aiTypeMap = { cavalry: '骑兵', infantry: '步兵', spear: '枪兵', archer: '弓兵' };
            const aiTypeColorMap = { cavalry: '#ffaa44', infantry: '#88cc44', spear: '#44aaff', archer: '#ff88aa' };
            const aiTypeName = aiTypeMap[gen.unitType] || gen.unitType || '步兵';
            const aiTypeColor = aiTypeColorMap[gen.unitType] || '#aaa';
            r.drawText(`【${aiTypeName}】`, r.width / 2, cardY + 191, {
                color: aiTypeColor, size: 13, align: 'center', bold: true
            });
        }

        // VS text — centered in the gap between AI card bottom and player cards
        const aiCardBottom = 90 + 212;  // 302
        const playerCardsTop = r.height - 260;  // 540
        const vsY = Math.round((aiCardBottom + playerCardsTop) / 2);
        r.drawText('VS', r.width / 2, vsY, { color: '#ffe080', size: 30, align: 'center', bold: true, shadow: true });

        // Player's alive generals as cards at bottom
        const myGenerals = this._s.playerSide === 'attacker'
            ? this._s.battle.attacker.generals
            : this._s.battle.defender.generals;
        const alive = myGenerals.filter(u => u.state !== 'dead');

        const cardW = 120;
        const cardH = 192;
        const cardGap = 134;
        const ROW_MAX = 8;
        const useDouble = alive.length > ROW_MAX;
        const row1Count = useDouble ? Math.ceil(alive.length / 2) : alive.length;
        const row2Count = useDouble ? alive.length - row1Count : 0;
        const rowSpacing = 10;
        const totalH = useDouble ? cardH * 2 + rowSpacing : cardH;
        const baseY = r.height - totalH - 55;

        const _cardPos = (i) => {
            if (!useDouble) {
                return { x: r.width / 2 - (alive.length * cardGap) / 2 + i * cardGap, y: baseY };
            }
            if (i < row1Count) {
                return { x: r.width / 2 - (row1Count * cardGap) / 2 + i * cardGap, y: baseY };
            }
            const j = i - row1Count;
            return { x: r.width / 2 - (row2Count * cardGap) / 2 + j * cardGap, y: baseY + cardH + rowSpacing };
        };

        r.drawText('选择出战武将', r.width / 2, baseY - 22, { color: '#c8a850', size: 17, align: 'center' });

        for (let i = 0; i < alive.length; i++) {
            const unit = alive[i];
            const gen = unit.general;
            const { x: cx, y: cy } = _cardPos(i);
            const isHovered = this._s.hoveredPickUnit === unit;
            const isSelected = this._s._playerPickedUnit === unit;

            const bgColor = isSelected ? 'rgba(200,168,80,0.35)' : (isHovered ? 'rgba(200,168,80,0.2)' : 'rgba(30,20,10,0.7)');
            const borderColor = isSelected ? '#ffe080' : (isHovered ? '#c8a850' : '#554420');
            r.roundRect(cx, cy, cardW, cardH, 5, bgColor, borderColor);
            if (isSelected) {
                r.roundRect(cx + 1, cy + 1, cardW - 2, cardH - 2, 4, null, 'rgba(255,224,128,0.4)');
            }

            // Portrait
            r.drawPortrait(cx + 30, cy + 8, 60, gen.portrait, gen.name, gen.id);

            // Name
            r.drawText(gen.name, cx + 60, cy + 80, {
                color: isSelected ? '#ffe080' : (isHovered ? '#ffe080' : '#c8b888'), size: 17, align: 'center', bold: true, shadow: true
            });

            // Stats
            r.drawText(`武${gen.war} 智${gen.int}`, cx + 60, cy + 100, {
                color: '#aaa', size: 16, align: 'center'
            });
            r.drawText(`统${gen.lead} 兵${unit.soldiers}`, cx + 60, cy + 120, {
                color: '#aaa', size: 16, align: 'center'
            });

            // HP bar
            const hpRatio = unit.hp / unit.maxHp;
            r.drawBar(cx + 10, cy + 144, 100, 6, hpRatio,
                hpRatio > 0.5 ? '#44cc44' : (hpRatio > 0.25 ? '#cccc44' : '#cc4444'));
            r.drawText(`HP: ${Math.floor(unit.hp)}/${unit.maxHp}`, cx + 60, cy + 158, {
                color: '#999', size: 15, align: 'center'
            });

            // Unit type badge
            const typeMap = { cavalry: '骑兵', infantry: '步兵', spear: '枪兵', archer: '弓兵' };
            const typeColorMap = { cavalry: '#ffaa44', infantry: '#88cc44', spear: '#44aaff', archer: '#ff88aa' };
            const typeName = typeMap[gen.unitType] || gen.unitType || '步兵';
            const typeColor = typeColorMap[gen.unitType] || '#aaa';
            r.drawText(`【${typeName}】`, cx + 60, cy + 178, {
                color: typeColor, size: 13, align: 'center', bold: true
            });
        }

        // Retreat button (left side, always visible when retreat is available)
        const retreatInfo = this._s._getRetreatInfo();
        if (retreatInfo.canRetreat) {
            const rBtnW = 180;
            const rBtnH = 40;
            const rBtnX = 20;
            const rBtnY = r.height - 50;
            const rHover = Renderer.pointInRect(this._s.input.mouse.x, this._s.input.mouse.y, rBtnX, rBtnY, rBtnW, rBtnH);
            r.roundRect(rBtnX, rBtnY, rBtnW, rBtnH, 6,
                rHover ? 'rgba(160,30,30,0.8)' : 'rgba(100,20,20,0.6)', '#aa4444');
            r.drawText(retreatInfo.label, rBtnX + rBtnW / 2, rBtnY + rBtnH / 2, {
                color: '#ffaaaa', size: 15, align: 'center', baseline: 'middle', bold: true, shadow: true
            });
        }

        // Confirm button (shown when a general is selected)
        if (this._s._playerPickedUnit) {
            const btnW = 180;
            const btnH = 40;
            const btnX = r.width / 2 - btnW / 2;
            const btnY = r.height - 50;
            const btnHover = Renderer.pointInRect(this._s.input.mouse.x, this._s.input.mouse.y, btnX, btnY, btnW, btnH);
            r.roundRect(btnX, btnY, btnW, btnH, 6,
                btnHover ? 'rgba(220,120,50,0.6)' : 'rgba(180,80,30,0.5)', '#c8a850');
            r.drawText('确认出战', r.width / 2, btnY + btnH / 2, {
                color: '#ffe080', size: 18, align: 'center', baseline: 'middle', bold: true, shadow: true
            });
        }

        // Remaining count on sides — shown in top bar
        const atkAlive = this._s.battle.attacker.generals.filter(u => u.state !== 'dead').length;
        const defAlive = this._s.battle.defender.generals.filter(u => u.state !== 'dead').length;
        r.drawText(`我军: ${this._s.playerSide === 'attacker' ? atkAlive : defAlive}人`, 20, 38, {
            color: '#44aaff', size: 14
        });
        r.drawText(`敌军: ${this._s.playerSide === 'attacker' ? defAlive : atkAlive}人`, r.width - 20, 38, {
            color: '#ff6644', size: 14, align: 'right'
        });
    }


    _renderFormationSelect(r, ctx) {
        r.clear('#0a0a14');
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 220);
        skyGrad.addColorStop(0, '#0a1428');
        skyGrad.addColorStop(0.5, '#1a2a4a');
        skyGrad.addColorStop(1, '#3a5a3a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, r.width, 220);
        this._drawMountains(r, ctx);
        const fieldGrad = ctx.createLinearGradient(0, 230, 0, r.height);
        fieldGrad.addColorStop(0, '#2a4a2a');
        fieldGrad.addColorStop(1, '#1a2a1a');
        ctx.fillStyle = fieldGrad;
        ctx.fillRect(0, 230, r.width, r.height - 230);

        // Top bar
        r.fillRect(0, 0, r.width, 50, 'rgba(10,5,2,0.85)');
        r.drawLine(0, 50, r.width, 50, '#c8a850', 2);

        const pickedGen = this._s._playerPickedUnit.general;
        r.drawText(`${pickedGen.name} 选择阵型`, r.width / 2, 18, {
            color: '#ffe080', size: 23, align: 'center', bold: true, shadow: true
        });

        const atkFaction = this._s.battle.attacker.faction;
        const defFaction = this._s.battle.defender.faction;
        r.drawText(`攻方: ${atkFaction ? atkFaction.name : '???'}`, 20, 36, { color: '#44aaff', size: 15 });
        r.drawText(`守方: ${defFaction ? defFaction.name : '???'}`, r.width - 20, 36, { color: '#ff6644', size: 15, align: 'right' });

        // Left panel - formation buttons
        const panelX = 20;
        const panelY = 70;

        r.fillRect(panelX - 5, panelY - 10, 220, FORMATIONS.length * 58 + 15, 'rgba(10,5,2,0.7)');
        r.drawLine(panelX - 5, panelY - 10, panelX + 215, panelY - 10, '#554420', 1);

        for (let i = 0; i < FORMATIONS.length; i++) {
            const f = FORMATIONS[i];
            const btnY = panelY + i * 58;
            const isSelected = this._s.selectedFormation === f.id;
            const mx = this._s.input.mouse.x;
            const my = this._s.input.mouse.y;
            const hover = mx >= panelX && mx <= panelX + 210 && my >= btnY && my <= btnY + 52;

            const bgColor = isSelected ? 'rgba(200,168,80,0.25)' : (hover ? 'rgba(100,80,40,0.2)' : 'rgba(30,20,10,0.6)');
            const borderColor = isSelected ? '#ffe080' : '#554420';
            r.roundRect(panelX, btnY, 210, 52, 3, bgColor, borderColor);

            r.drawText(f.name, panelX + 10, btnY + 10, {
                color: isSelected ? '#ffe080' : '#c8b888', size: 18, bold: true, shadow: true
            });
            r.drawText(f.desc, panelX + 10, btnY + 34, { color: '#999', size: 14 });

            if (f.bonusTag) {
                const tagW = r.measureText(f.bonusTag, 13, true).width + 8;
                r.roundRect(panelX + 210 - tagW - 8, btnY + 8, tagW, 16, 2,
                    isSelected ? 'rgba(100,200,100,0.3)' : 'rgba(60,80,60,0.3)', '#5a8a4a');
                r.drawText(f.bonusTag, panelX + 210 - tagW / 2 - 4, btnY + 11, {
                    color: '#88cc66', size: 13, align: 'center', bold: true
                });
            }
        }

        // Right area - formation preview (single unit)
        const previewX = 260;
        const previewY = 70;
        const previewW = r.width - 280;
        const previewH = r.height - 150;

        r.fillRect(previewX, previewY, previewW, previewH, 'rgba(10,5,2,0.5)');
        r.roundRect(previewX, previewY, previewW, previewH, 4, null, '#554420');

        r.drawText('阵型预览', previewX + previewW / 2, previewY + 12, {
            color: '#c8a850', size: 16, align: 'center', bold: true
        });

        // Show the picked unit's formation preview
        const playerSideStr = this._s.playerSide === 'attacker' ? 'left' : 'right';
        const previewPositions = this._s._getFormationPositions(this._s.selectedFormation, [this._s._playerPickedUnit], playerSideStr);

        const fieldMinX = playerSideStr === 'left' ? 0 : 900;
        const fieldMaxX = playerSideStr === 'left' ? 300 : 1200;
        const fieldMinY = 80;
        const fieldMaxY = 340;

        const scaleX = (previewW - 40) / (fieldMaxX - fieldMinX);
        const scaleY = (previewH - 60) / (fieldMaxY - fieldMinY);
        const offsetX = previewX + 20;
        const offsetY = previewY + 35;

        for (const pos of previewPositions) {
            const gx = offsetX + (pos.x - fieldMinX) * scaleX;
            const gy = offsetY + (pos.y - fieldMinY) * scaleY;

            for (const so of pos.soldierOffsets) {
                const sx = gx + so.dx * scaleX;
                const sy = gy + so.dy * scaleY;
                ctx.fillStyle = 'rgba(100,160,255,0.6)';
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = '#ffe080';
            ctx.beginPath();
            ctx.arc(gx, gy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c8a850';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            r.drawText(pickedGen.name, gx, gy + 12, {
                color: '#ffe080', size: 15, align: 'center', shadow: true
            });
        }

        // Legend
        ctx.fillStyle = '#ffe080';
        ctx.beginPath();
        ctx.arc(previewX + 15, previewY + previewH - 18, 5, 0, Math.PI * 2);
        ctx.fill();
        r.drawText('= 主将', previewX + 25, previewY + previewH - 24, { color: '#c8b888', size: 16 });

        ctx.fillStyle = 'rgba(100,160,255,0.6)';
        ctx.beginPath();
        ctx.arc(previewX + 90, previewY + previewH - 18, 3, 0, Math.PI * 2);
        ctx.fill();
        r.drawText('= 士兵', previewX + 98, previewY + previewH - 24, { color: '#c8b888', size: 16 });

        const currentFormation = FORMATIONS.find(f => f.id === this._s.selectedFormation);
        if (currentFormation && currentFormation.bonusTag) {
            r.drawText(`加成: ${currentFormation.bonus}`, previewX + previewW / 2, previewY + previewH - 12, {
                color: '#88cc66', size: 14, align: 'center', shadow: true
            });
        }

        // Start button
        const startBtnX = r.width / 2 - 80;
        const startBtnY = r.height - 60;
        const startHover = Renderer.pointInRect(this._s.input.mouse.x, this._s.input.mouse.y, startBtnX, startBtnY, 160, 44);

        r.roundRect(startBtnX, startBtnY, 160, 44, 5,
            startHover ? 'rgba(200,100,50,0.5)' : 'rgba(150,60,30,0.4)',
            '#c8a850');

        if (startHover) {
            r.roundRect(startBtnX + 2, startBtnY + 2, 156, 40, 4, 'rgba(255,200,100,0.1)', null);
        }

        r.drawText('出  战！', r.width / 2, startBtnY + 16, {
            color: '#ffe080', size: 25, align: 'center', bold: true, shadow: true
        });
    }


    _renderDuelIntro(r, ctx) {
        const duel = this._s.battle.currentDuel;
        if (!duel) return;

        // Dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, r.width, r.height);

        const progress = Math.min(1, this._s.duelIntroTimer / 1.5);
        const t = this._s.duelIntroTimer;

        // ── 戏剧光束：从两侧向中心收拢的光柱 ──
        if (progress > 0.3) {
            const lp = Math.min(1, (progress - 0.3) / 0.7);
            ctx.save();
            ctx.globalAlpha = lp * 0.18;
            // 左侧蓝光柱
            const lgrd = ctx.createLinearGradient(0, 0, r.width / 2, r.height);
            lgrd.addColorStop(0, 'rgba(68,170,255,0)');
            lgrd.addColorStop(0.5, 'rgba(68,170,255,1)');
            lgrd.addColorStop(1, 'rgba(68,170,255,0)');
            ctx.fillStyle = lgrd;
            ctx.fillRect(0, 0, r.width / 2, r.height);
            // 右侧红光柱
            const rgrd = ctx.createLinearGradient(r.width, 0, r.width / 2, r.height);
            rgrd.addColorStop(0, 'rgba(255,68,68,0)');
            rgrd.addColorStop(0.5, 'rgba(255,68,68,1)');
            rgrd.addColorStop(1, 'rgba(255,68,68,0)');
            ctx.fillStyle = rgrd;
            ctx.fillRect(r.width / 2, 0, r.width / 2, r.height);
            ctx.restore();
        }

        // ── 冲击线（VS出现时放射线条）──
        if (progress > 0.6) {
            const lp = Math.min(1, (progress - 0.6) / 0.4);
            ctx.save();
            ctx.globalAlpha = lp * 0.12;
            ctx.strokeStyle = '#ffe080';
            ctx.lineWidth = 1;
            for (let i = 0; i < 24; i++) {
                const a = (i / 24) * Math.PI * 2 + t * 0.3;
                const len = 80 + (i % 3) * 40;
                ctx.beginPath();
                ctx.moveTo(r.width / 2 + Math.cos(a) * 30, r.height / 2 + Math.sin(a) * 30);
                ctx.lineTo(r.width / 2 + Math.cos(a) * (30 + len * lp), r.height / 2 + Math.sin(a) * (30 + len * lp));
                ctx.stroke();
            }
            ctx.restore();
        }

        // Title
        r.drawText(`第 ${this._s.duelNumber} 场`, r.width / 2, 50, {
            color: '#c8a850', size: 21, align: 'center', bold: true, shadow: true
        });

        // Left general slides in from left
        // 卡片：高度270，y从60到330，为VS让出垂直中心区域
        const cardH = 270;
        const cardY = r.height / 2 - cardH / 2;
        const leftX = -170 + progress * (r.width / 2 - 90);
        const leftGen = duel.left.general;
        r.roundRect(leftX, cardY, 170, cardH, 5, 'rgba(68,170,255,0.15)', '#44aaff');
        r.drawPortrait(leftX + 55, cardY + 12, 70, leftGen.portrait, leftGen.name, leftGen.id);
        r.drawText(leftGen.name, leftX + 85, cardY + 96, {
            color: '#44aaff', size: 20, align: 'center', bold: true, shadow: true
        });
        r.drawText(`武力 ${leftGen.war}`, leftX + 85, cardY + 120, {
            color: '#ccc', size: 15, align: 'center'
        });
        const leftHpRatio = duel.left.hp / duel.left.maxHp;
        r.drawText(`HP ${Math.floor(duel.left.hp)}/${duel.left.maxHp}`, leftX + 85, cardY + 144, {
            color: '#44cc44', size: 14, align: 'center'
        });
        r.drawBar(leftX + 20, cardY + 158, 130, 8, leftHpRatio,
            leftHpRatio > 0.5 ? '#44cc44' : (leftHpRatio > 0.25 ? '#cccc44' : '#cc4444'));
        r.drawText(`兵: ${duel.left.soldiers}`, leftX + 85, cardY + 184, {
            color: '#aaa', size: 15, align: 'center'
        });
        r.drawText(this._s.battle.attacker.faction.name, leftX + 85, cardY + 210, {
            color: '#44aaff', size: 16, align: 'center'
        });

        // VS with pulse animation — 垂直居中
        const vsAlpha = Math.min(1, this._s.duelIntroTimer / 1.0);
        const vsPulse = 1 + Math.sin(t * 8) * 0.06 * vsAlpha;
        ctx.save();
        ctx.globalAlpha = vsAlpha;
        ctx.translate(r.width / 2, r.height / 2);
        ctx.scale(vsPulse, vsPulse);
        r.drawText('VS', 0, 0, {
            color: '#ffe080', size: 52, align: 'center', baseline: 'middle', bold: true, shadow: true
        });
        ctx.restore();

        // Right general slides in from right
        const rightX = r.width + 170 - progress * (r.width / 2 - 90);
        const rightGen = duel.right.general;
        r.roundRect(rightX - 170, cardY, 170, cardH, 5, 'rgba(255,68,68,0.15)', '#ff4444');
        r.drawPortrait(rightX - 115, cardY + 12, 70, rightGen.portrait, rightGen.name, rightGen.id);
        r.drawText(rightGen.name, rightX - 85, cardY + 96, {
            color: '#ff4444', size: 20, align: 'center', bold: true, shadow: true
        });
        r.drawText(`武力 ${rightGen.war}`, rightX - 85, cardY + 120, {
            color: '#ccc', size: 15, align: 'center'
        });
        const rightHpRatio = duel.right.hp / duel.right.maxHp;
        r.drawText(`HP ${Math.floor(duel.right.hp)}/${duel.right.maxHp}`, rightX - 85, cardY + 144, {
            color: '#44cc44', size: 14, align: 'center'
        });
        r.drawBar(rightX - 150, cardY + 158, 130, 8, rightHpRatio,
            rightHpRatio > 0.5 ? '#44cc44' : (rightHpRatio > 0.25 ? '#cccc44' : '#cc4444'));
        r.drawText(`兵: ${duel.right.soldiers}`, rightX - 85, cardY + 184, {
            color: '#aaa', size: 15, align: 'center'
        });
        r.drawText(this._s.battle.defender.faction.name, rightX - 85, cardY + 210, {
            color: '#ff4444', size: 16, align: 'center'
        });

        // Score
        const score = this._s.battle.matchScore;
        r.drawText(`${score.left} : ${score.right}`, r.width / 2, r.height - 40, {
            color: '#c8a850', size: 19, align: 'center'
        });
    }


    _renderHistoricalDuelIntro(r, ctx) {
        const duel = this._s.battle.currentDuel;
        const histDuel = this._s.currentHistoricalDuel;
        if (!duel || !histDuel) return;

        // Dark dramatic background
        r.clear('#050508');

        // Animated fire/ember particles at top and bottom
        const t = this._s.historicalDuelIntroTimer;
        ctx.save();
        for (let i = 0; i < 30; i++) {
            const seed = i * 137.5;
            const px = (seed * 7.3) % r.width;
            const py = r.height - (t * 40 + seed * 1.7) % (r.height + 60);
            const size = 1 + (seed % 3);
            const alpha = 0.2 + Math.sin(t * 3 + i) * 0.15;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 3 === 0 ? '#ff6633' : (i % 3 === 1 ? '#ffaa44' : '#ff4422');
            ctx.fillRect(px, py, size, size);
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // Top decorative line
        const lineGrad = ctx.createLinearGradient(0, 0, r.width, 0);
        lineGrad.addColorStop(0, 'rgba(200,168,80,0)');
        lineGrad.addColorStop(0.3, 'rgba(200,168,80,0.8)');
        lineGrad.addColorStop(0.5, '#ffe080');
        lineGrad.addColorStop(0.7, 'rgba(200,168,80,0.8)');
        lineGrad.addColorStop(1, 'rgba(200,168,80,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 38);
        ctx.lineTo(r.width, 38);
        ctx.stroke();

        // Era tag
        r.drawText(`【${histDuel.era}】`, r.width / 2, 18, {
            color: '#aa8844', size: 16, align: 'center'
        });

        // Title with dramatic animation
        const titleAlpha = Math.min(1, t / 0.8);
        ctx.globalAlpha = titleAlpha;
        r.drawText(histDuel.title, r.width / 2, 60, {
            color: '#ffe080', size: 28, align: 'center', bold: true, shadow: true
        });
        ctx.globalAlpha = 1;

        // Decorative line under title
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r.width / 2 - 180, 80);
        ctx.lineTo(r.width / 2 + 180, 80);
        ctx.stroke();

        // Both generals slide in
        const slideProgress = Math.min(1, t / 1.2);
        const eased = 1 - Math.pow(1 - slideProgress, 3); // ease-out cubic

        // Left general
        const leftGen = duel.left.general;
        const leftX = -200 + eased * (r.width / 2 - 150);
        const leftCardW = 140;
        const leftCardH = 220;

        // Glow behind left portrait
        ctx.globalAlpha = 0.15 + Math.sin(t * 2) * 0.05;
        ctx.fillStyle = '#44aaff';
        ctx.beginPath();
        ctx.arc(leftX + leftCardW / 2, 190, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        r.roundRect(leftX, 95, leftCardW, leftCardH, 6, 'rgba(68,170,255,0.1)', '#44aaff');
        r.drawPortrait(leftX + 40, 105, 60, leftGen.portrait, leftGen.name, leftGen.id);
        r.drawText(leftGen.name, leftX + leftCardW / 2, 178, {
            color: '#44aaff', size: 23, align: 'center', bold: true, shadow: true
        });
        r.drawText(`武力 ${leftGen.war}  智力 ${leftGen.int}`, leftX + leftCardW / 2, 200, {
            color: '#ccc', size: 15, align: 'center'
        });
        r.drawText(`统率 ${leftGen.lead}`, leftX + leftCardW / 2, 218, {
            color: '#ccc', size: 15, align: 'center'
        });
        // HP bar
        const leftHpR = duel.left.hp / duel.left.maxHp;
        r.drawBar(leftX + 15, 238, leftCardW - 30, 8, leftHpR,
            leftHpR > 0.5 ? '#44cc44' : (leftHpR > 0.25 ? '#cccc44' : '#cc4444'));
        r.drawText(`HP: ${Math.floor(duel.left.hp)}/${duel.left.maxHp}`, leftX + leftCardW / 2, 253, {
            color: '#999', size: 16, align: 'center'
        });
        // Faction
        r.drawText(this._s.battle.attacker.faction.name, leftX + leftCardW / 2, 275, {
            color: '#44aaff', size: 17, align: 'center'
        });
        // Soldier count
        r.drawText(`兵力: ${duel.left.soldiers}`, leftX + leftCardW / 2, 293, {
            color: '#8ab', size: 16, align: 'center'
        });

        // VS in center with dramatic pulse
        const vsPulse = 1 + Math.sin(t * 4) * 0.1;
        ctx.save();
        ctx.translate(r.width / 2, 190);
        ctx.scale(vsPulse, vsPulse);
        r.drawText('VS', 0, 0, {
            color: '#ff4422', size: 52, align: 'center', bold: true, shadow: true
        });
        ctx.restore();

        // Crossed swords icon
        ctx.strokeStyle = '#c8a850';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r.width / 2 - 20, 155);
        ctx.lineTo(r.width / 2 + 20, 225);
        ctx.moveTo(r.width / 2 + 20, 155);
        ctx.lineTo(r.width / 2 - 20, 225);
        ctx.stroke();

        // Right general
        const rightGen = duel.right.general;
        const rightX = r.width + 200 - eased * (r.width / 2 - 150);
        const rightCardX = rightX - leftCardW;

        // Glow behind right portrait
        ctx.globalAlpha = 0.15 + Math.sin(t * 2 + 1) * 0.05;
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(rightCardX + leftCardW / 2, 190, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        r.roundRect(rightCardX, 95, leftCardW, leftCardH, 6, 'rgba(255,68,68,0.1)', '#ff4444');
        r.drawPortrait(rightCardX + 40, 105, 60, rightGen.portrait, rightGen.name, rightGen.id);
        r.drawText(rightGen.name, rightCardX + leftCardW / 2, 178, {
            color: '#ff4444', size: 23, align: 'center', bold: true, shadow: true
        });
        r.drawText(`武力 ${rightGen.war}  智力 ${rightGen.int}`, rightCardX + leftCardW / 2, 200, {
            color: '#ccc', size: 15, align: 'center'
        });
        r.drawText(`统率 ${rightGen.lead}`, rightCardX + leftCardW / 2, 218, {
            color: '#ccc', size: 15, align: 'center'
        });
        const rightHpR = duel.right.hp / duel.right.maxHp;
        r.drawBar(rightCardX + 15, 238, leftCardW - 30, 8, rightHpR,
            rightHpR > 0.5 ? '#44cc44' : (rightHpR > 0.25 ? '#cccc44' : '#cc4444'));
        r.drawText(`HP: ${Math.floor(duel.right.hp)}/${duel.right.maxHp}`, rightCardX + leftCardW / 2, 253, {
            color: '#999', size: 16, align: 'center'
        });
        r.drawText(this._s.battle.defender.faction.name, rightCardX + leftCardW / 2, 275, {
            color: '#ff4444', size: 17, align: 'center'
        });
        r.drawText(`兵力: ${duel.right.soldiers}`, rightCardX + leftCardW / 2, 293, {
            color: '#b88', size: 16, align: 'center'
        });

        // Historical description box
        const descAlpha = Math.min(1, Math.max(0, (t - 0.5) / 0.8));
        ctx.globalAlpha = descAlpha;

        const descBoxX = 60;
        const descBoxY = 330;
        const descBoxW = r.width - 120;
        const descBoxH = 140;

        // Scroll-like background
        const scrollGrad = ctx.createLinearGradient(descBoxX, descBoxY, descBoxX, descBoxY + descBoxH);
        scrollGrad.addColorStop(0, 'rgba(60,40,20,0.9)');
        scrollGrad.addColorStop(0.1, 'rgba(40,25,10,0.95)');
        scrollGrad.addColorStop(0.9, 'rgba(40,25,10,0.95)');
        scrollGrad.addColorStop(1, 'rgba(60,40,20,0.9)');
        ctx.fillStyle = scrollGrad;
        r.roundRect(descBoxX, descBoxY, descBoxW, descBoxH, 4, scrollGrad, '#8a6a30');

        // Inner border
        r.roundRect(descBoxX + 4, descBoxY + 4, descBoxW - 8, descBoxH - 8, 3, null, 'rgba(200,168,80,0.3)');

        // Decorative corners
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(descBoxX + 8, descBoxY + 8, 12, 2);
        ctx.fillRect(descBoxX + 8, descBoxY + 8, 2, 12);
        ctx.fillRect(descBoxX + descBoxW - 20, descBoxY + 8, 12, 2);
        ctx.fillRect(descBoxX + descBoxW - 10, descBoxY + 8, 2, 12);
        ctx.fillRect(descBoxX + 8, descBoxY + descBoxH - 10, 12, 2);
        ctx.fillRect(descBoxX + 8, descBoxY + descBoxH - 20, 2, 12);
        ctx.fillRect(descBoxX + descBoxW - 20, descBoxY + descBoxH - 10, 12, 2);
        ctx.fillRect(descBoxX + descBoxW - 10, descBoxY + descBoxH - 20, 2, 12);

        // Description text - wrap lines, capped to fit within the box
        const descText = histDuel.desc;
        const maxCharsPerLine = 28;
        const lineHeight = 24;
        const maxLines = Math.floor((descBoxH - 36) / lineHeight); // leave 28 top + 8 bottom pad
        const lines = [];
        for (let i = 0; i < descText.length && lines.length < maxLines; i += maxCharsPerLine) {
            lines.push(descText.slice(i, i + maxCharsPerLine));
        }

        for (let i = 0; i < lines.length; i++) {
            r.drawText(lines[i], r.width / 2, descBoxY + 28 + i * lineHeight, {
                color: '#e8d8b0', size: 17, align: 'center', shadow: true
            });
        }

        ctx.globalAlpha = 1;

        // "Historical Duel" badge
        const badgeW = 120;
        const badgeH = 24;
        const badgeX = r.width / 2 - badgeW / 2;
        const badgeY = descBoxY - 12;
        r.roundRect(badgeX, badgeY, badgeW, badgeH, 3, 'rgba(180,60,20,0.8)', '#ff6633');
        r.drawText('名将单挑', r.width / 2, badgeY + 6, {
            color: '#ffe080', size: 17, align: 'center', bold: true, shadow: true
        });

        // Score at bottom
        const score = this._s.battle.matchScore;
        r.drawText(`第 ${this._s.duelNumber} 场  比分 ${score.left} : ${score.right}`, r.width / 2, r.height - 80, {
            color: '#c8a850', size: 17, align: 'center'
        });

        // "Click to start" prompt (after 1s delay)
        if (t >= 1.0) {
            const blinkAlpha = 0.5 + Math.sin(t * 4) * 0.4;
            ctx.globalAlpha = blinkAlpha;
            r.drawText('点击开始单挑', r.width / 2, r.height - 45, {
                color: '#ffe080', size: 21, align: 'center', bold: true, shadow: true
            });
            ctx.globalAlpha = 1;
        }

        // Bottom decorative line
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, r.height - 25);
        ctx.lineTo(r.width, r.height - 25);
        ctx.stroke();
    }


    _renderBattlefield(r, ctx) {
        r.clear('#0a0a14');

        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 220);
        skyGrad.addColorStop(0, '#0a1428');
        skyGrad.addColorStop(0.3, '#1a2a4a');
        skyGrad.addColorStop(0.6, '#2a3a4a');
        skyGrad.addColorStop(1, '#3a5a3a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, r.width, 220);

        // Stars
        ctx.fillStyle = 'rgba(255,255,200,0.3)';
        for (let i = 0; i < 20; i++) {
            const sx = (i * 137 + 50) % r.width;
            const sy = (i * 73 + 10) % 100;
            const twinkle = 0.2 + Math.sin(this._s.battleTime * 2 + i) * 0.15;
            ctx.globalAlpha = twinkle;
            ctx.fillRect(sx, sy, 2, 2);
        }
        ctx.globalAlpha = 1;

        // ── 云层动画 ──
        for (const c of this._s.clouds) {
            // clouds positions are world-space but sky is screen-space, map to screen
            const sx = c.x - (this._s.cameraX - r.width / 2) * (c.layer === 0 ? 0.05 : 0.1);
            const screenX = ((sx % (r.width + c.w + 40)) + r.width + c.w + 40) % (r.width + c.w + 40) - c.w - 20;
            const cg = ctx.createRadialGradient(
                screenX + c.w / 2, c.y + c.h / 2, 2,
                screenX + c.w / 2, c.y + c.h / 2, c.w * 0.6
            );
            cg.addColorStop(0, `rgba(200,220,255,${c.alpha})`);
            cg.addColorStop(0.5, `rgba(180,200,240,${c.alpha * 0.6})`);
            cg.addColorStop(1, 'rgba(150,180,220,0)');
            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.ellipse(screenX + c.w / 2, c.y + c.h / 2, c.w * 0.6, c.h * 0.55, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── 单挑动态光晕背景 (只在 dueling/duel_result 阶段显示) ──
        if (this._s.battle.phase === 'dueling' || this._s.battle.phase === 'duel_result') {
            const t = this._s.battleTime;
            const pulse = 0.5 + Math.sin(t * 2.8) * 0.18;
            // 左侧蓝方光晕
            const la = (this._s.duelAuraLeft || 0) * pulse * 0.38;
            if (la > 0.01) {
                const lglow = ctx.createRadialGradient(r.width * 0.22, r.height * 0.55, 0, r.width * 0.22, r.height * 0.55, r.width * 0.45);
                lglow.addColorStop(0, `rgba(60,120,255,${la})`);
                lglow.addColorStop(0.5, `rgba(30,80,180,${la * 0.5})`);
                lglow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = lglow;
                ctx.fillRect(0, 0, r.width, r.height);
            }
            // 右侧红方光晕
            const ra = (this._s.duelAuraRight || 0) * pulse * 0.38;
            if (ra > 0.01) {
                const rglow = ctx.createRadialGradient(r.width * 0.78, r.height * 0.55, 0, r.width * 0.78, r.height * 0.55, r.width * 0.45);
                rglow.addColorStop(0, `rgba(255,60,40,${ra})`);
                rglow.addColorStop(0.5, `rgba(180,30,20,${ra * 0.5})`);
                rglow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = rglow;
                ctx.fillRect(0, 0, r.width, r.height);
            }
            // 慢动作时屏幕边缘深色渐晕
            if (this._s.slowMoTimer > 0) {
                ctx.globalAlpha = Math.min(0.5, this._s.slowMoTimer * 3);
                const vglow = ctx.createRadialGradient(r.width/2, r.height/2, r.height*0.2, r.width/2, r.height/2, r.width*0.7);
                vglow.addColorStop(0, 'rgba(0,0,0,0)');
                vglow.addColorStop(1, 'rgba(0,0,0,0.7)');
                ctx.fillStyle = vglow;
                ctx.fillRect(0, 0, r.width, r.height);
                ctx.globalAlpha = 1;
            }
        }

        // Mountains
        this._drawMountains(r, ctx);

        // Field between mountains and ground
        const fieldGrad = ctx.createLinearGradient(0, 230, 0, 320);
        fieldGrad.addColorStop(0, '#2a4a2a');
        fieldGrad.addColorStop(1, '#3a5028');
        ctx.fillStyle = fieldGrad;
        ctx.fillRect(0, 230, r.width, 90);

        // Ground base fill (fixed, full-screen width, no camera offset) so no black gaps on edges
        const groundY = 320;
        ctx.fillStyle = '#3a5028';
        ctx.fillRect(0, groundY, r.width, r.height - groundY);

        // Ground (camera-relative detail layer)
        ctx.save();
        const shakeX = this._s.screenShake > 0 ? (Math.random() - 0.5) * this._s.screenShake : 0;
        const shakeY = this._s.screenShake > 0 ? (Math.random() - 0.5) * this._s.screenShake : 0;
        ctx.translate(-this._s.cameraX + r.width / 2 + shakeX, shakeY);

        // Ground tiles — 分层纹理
        for (const tile of this._s.groundTiles) {
            // 主地块
            ctx.fillStyle = tile.type === 'grass' ? '#384e26' : '#433626';
            ctx.fillRect(tile.x, groundY, 40, r.height - groundY);
            // 表层边缘亮线（草皮/土块分界）
            ctx.fillStyle = tile.type === 'grass' ? '#4e7232' : '#5a4830';
            ctx.fillRect(tile.x, groundY - tile.height, 40, 3 + tile.height);
            // 地面纹理条纹（横向）
            ctx.fillStyle = tile.type === 'grass' ? '#304420' : '#382e1e';
            for (let gy = groundY + 15; gy < r.height; gy += 28) {
                ctx.fillRect(tile.x + 4, gy, 32, 1);
            }
            // 草丛/碎石细节
            if (tile.type === 'grass') {
                ctx.fillStyle = '#5c8a3a';
                const gx = tile.x;
                ctx.fillRect(gx + 6,  groundY - tile.height - 4, 2, 5);
                ctx.fillRect(gx + 14, groundY - tile.height - 6, 2, 7);
                ctx.fillRect(gx + 24, groundY - tile.height - 3, 2, 4);
                ctx.fillRect(gx + 32, groundY - tile.height - 5, 2, 6);
            } else {
                // 砾石小点
                ctx.fillStyle = '#6a5a40';
                ctx.fillRect(tile.x + 8,  groundY + 5,  4, 2);
                ctx.fillRect(tile.x + 22, groundY + 9,  3, 2);
                ctx.fillRect(tile.x + 30, groundY + 3,  5, 2);
            }
        }

        // 中央踩踏土路（战场正中央磨损痕迹）
        const viewLeft = this._s.cameraX - r.width / 2 - 40;
        const viewRight = this._s.cameraX + r.width / 2 + 40;
        const pathGrad = ctx.createLinearGradient(0, groundY - 2, 0, groundY + 22);
        pathGrad.addColorStop(0, 'rgba(90,70,40,0.85)');
        pathGrad.addColorStop(1, 'rgba(70,55,30,0)');
        ctx.fillStyle = pathGrad;
        ctx.fillRect(viewLeft, groundY - 2, viewRight - viewLeft, 24);

        // 地面线（土路边缘）
        ctx.fillStyle = '#6a5432';
        ctx.fillRect(viewLeft, groundY - 1, viewRight - viewLeft, 2);

        // Flags (world-space, inside camera transform)
        this._drawBattleFlags(r, ctx);

        // Draw soldiers
        this._drawSoldiers(r, ctx, this._s.battle.soldiers.left, 1);
        this._drawSoldiers(r, ctx, this._s.battle.soldiers.right, -1);

        // Draw generals (only current duel pair)
        this._drawGeneralUnits(r, ctx);

        // Projectiles
        for (const p of this._s.battle.projectiles) {
            if (p.isArrow) {
                // Draw arrow as a rotated line in flight direction
                const angle = Math.atan2(p.vy, p.vx);
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-6, -1, 12, 2);   // shaft
                ctx.fillStyle = '#888';
                ctx.fillRect(5, -1.5, 4, 3);   // arrowhead
                ctx.fillStyle = '#8a6030';
                ctx.fillRect(-8, -1.5, 3, 3);  // fletching
                ctx.restore();
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(p.x - 5, p.y - 3, 10, 6);
                ctx.globalAlpha = 1;
                ctx.fillRect(p.x - 3, p.y - 1, 6, 2);
                ctx.fillRect(p.x - 1, p.y - 3, 2, 6);
            }
        }

        // Effects (legacy, kept for compatibility)
        for (const effect of this._s.battle.effects) {
            this._drawEffect(r, ctx, effect);
            if (effect.timer < 0.1 && (effect.type === 'explosion' || effect.type === 'beam')) {
                this._s.screenShake = Math.max(this._s.screenShake, 6);
            }
        }

        // Skill animations (new system — travel from caster to target)
        this._drawSkillAnimations(r, ctx);

        // Damage numbers (大伤害有弹出缩放+描边效果)
        for (const d of this._s.battle.damageNumbers) {
            const alpha = 1 - d.timer;
            const text = typeof d.value === 'number' ? `-${d.value}` : d.value;
            const yOff = d.timer * -28;
            const isBig = typeof d.value === 'number' && d.value >= 80;
            const popScale = isBig ? (1 + Math.max(0, 0.08 - d.timer) * 8) : 1;
            const fontSize = isBig ? 28 : 21;
            ctx.save();
            ctx.globalAlpha = alpha;
            if (isBig && popScale > 1) {
                ctx.translate(d.x, d.y + yOff);
                ctx.scale(popScale, popScale);
                // 描边
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeText(text, 0, 0);
                ctx.fillStyle = d.color;
                ctx.fillText(text, 0, 0);
                // 金色光晕
                ctx.strokeStyle = '#ffdd44';
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = alpha * 0.5;
                ctx.strokeText(text, 0, 0);
            } else {
                r.drawText(text, d.x, d.y + yOff, {
                    color: d.color, size: fontSize, align: 'center', bold: true, shadow: true
                });
            }
            ctx.restore();
        }

        // Particles (支持圆形和方形)
        for (const p of this._s.particles) {
            const alpha = Math.max(0, p.life / (p.maxLife || 0.6));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            if (p.round) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
        }

        // Slash trails (刀光残影)
        for (const t of this._s.slashTrails) {
            const alpha = Math.max(0, t.life / t.maxLife) * 0.7;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = t.color || '#ffffff';
            ctx.lineWidth = 2 + (t.life / t.maxLife) * 3;
            ctx.lineCap = 'round';
            ctx.shadowColor = t.color || '#ffffff';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(t.x0, t.y0);
            ctx.lineTo(t.x1, t.y1);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Hit flashes (受击白光)
        for (const f of this._s.hitFlashes) {
            const alpha = Math.max(0, f.life / f.maxLife) * 0.85;
            const r2 = 18 * (1 - f.life / f.maxLife) + 8;
            ctx.globalAlpha = alpha;
            const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r2);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, r2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.restore();  // end camera transform

        // ── Screen-space effects (全屏闪白 / 技能大字) ──
        if (this._s.screenFlash > 0) {
            ctx.globalAlpha = Math.min(1, this._s.screenFlash);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, r.width, r.height);
            ctx.globalAlpha = 1;
        }

        if (this._s.skillBigText) {
            const bt = this._s.skillBigText;
            const p = bt.life / bt.maxLife;
            const alpha = p < 0.2 ? p / 0.2 : (p > 0.7 ? (1 - p) / 0.3 : 1);
            const scale = 0.8 + (1 - p) * 0.5;
            const yOff = (1 - p) * -30;
            ctx.save();
            ctx.globalAlpha = alpha * 0.92;
            ctx.translate(r.width / 2, r.height / 2 + yOff);
            ctx.scale(scale, scale);
            ctx.font = 'bold 52px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = bt.color;
            ctx.shadowBlur = 24;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(bt.text, 2, 2);
            ctx.fillStyle = bt.color;
            ctx.fillText(bt.text, 0, 0);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // ── 开场/结束电影大字 ──
        if (this._s.cinematicText) {
            const ct = this._s.cinematicText;
            const p = ct.life / ct.maxLife;
            // Fade in first 15%, hold, fade out last 25%
            const fadeIn = 0.15, fadeOut = 0.25;
            const alpha = p > (1 - fadeIn) ? (1 - p) / fadeIn
                        : p < fadeOut ? p / fadeOut : 1;
            const scale = p > (1 - fadeIn) ? 0.6 + ((1 - p) / fadeIn) * 0.6
                        : 1.0 + (1 - p) * 0.08;  // subtle grow-over-time
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(r.width / 2, r.height * 0.38);
            ctx.scale(scale, scale);
            // Dark semi-transparent strip behind text
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.fillRect(-260, -38, 520, 72);
            // Colored border lines
            ctx.strokeStyle = ct.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath(); ctx.moveTo(-260, -38); ctx.lineTo(260, -38); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-260, 34); ctx.lineTo(260, 34); ctx.stroke();
            ctx.globalAlpha = alpha;
            // Main text
            ctx.font = 'bold 44px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = ct.color;
            ctx.shadowBlur = 30;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(ct.text, 2, 2);
            ctx.fillStyle = ct.color;
            ctx.fillText(ct.text, 0, 0);
            ctx.shadowBlur = 0;
            // Sub text if present
            if (ct.sub) {
                ctx.font = '16px serif';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText(ct.sub, 0, 30);
            }
            ctx.restore();
        }

        // ── 慢动作提示标识 ──
        if (this._s.slowMoTimer > 0) {
            const a = Math.min(1, this._s.slowMoTimer * 6);
            ctx.save();
            ctx.globalAlpha = a * 0.75;
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#ffcc44';
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 8;
            ctx.fillText('⚡ FOCUS', r.width - 18, 70);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
    }


    _drawGradientHPBar(ctx, x, y, w, h, ratio, flashAlpha = 0, rounded = false) {
        const r2 = rounded ? h / 2 : 0;
        // Background track
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        if (r2) {
            ctx.beginPath(); ctx.roundRect(x, y, w, h, r2); ctx.fill();
        } else {
            ctx.fillRect(x, y, w, h);
        }
        // HP fill gradient
        const fillW = Math.max(0, w * ratio);
        if (fillW > 1) {
            // Color: green→yellow→red based on ratio
            const r0 = ratio > 0.5 ? Math.round((1 - ratio) * 2 * 200) : 200;
            const g0 = ratio > 0.5 ? 200 : Math.round(ratio * 2 * 200);
            const hpGrad = ctx.createLinearGradient(x, y, x + fillW, y);
            hpGrad.addColorStop(0, `rgba(${r0 + 40},${g0 + 40},40,1)`);
            hpGrad.addColorStop(1, `rgba(${r0},${g0},20,1)`);
            ctx.fillStyle = hpGrad;
            if (r2) {
                ctx.beginPath(); ctx.roundRect(x, y, fillW, h, r2); ctx.fill();
            } else {
                ctx.fillRect(x, y, fillW, h);
            }
            // Sheen highlight
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(x, y, fillW, Math.ceil(h * 0.4));
        }
        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        if (r2) {
            ctx.beginPath(); ctx.roundRect(x, y, w, h, r2); ctx.stroke();
        } else {
            ctx.strokeRect(x, y, w, h);
        }
        // Hit flash
        if (flashAlpha > 0.01) {
            ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.7})`;
            if (r2) {
                ctx.beginPath(); ctx.roundRect(x, y, w, h, r2); ctx.fill();
            } else {
                ctx.fillRect(x, y, w, h);
            }
        }
    }


    _drawDuelHUD(r, ctx) {
        const duel = this._s.battle.currentDuel;
        if (!duel) return;

        // ── Top bar: 96px tall ──
        r.fillRect(0, 0, r.width, 96, 'rgba(10,5,2,0.88)');
        r.drawLine(0, 96, r.width, 96, '#c8a850', 2);

        // Left general
        const leftGen = duel.left.general;
        r.drawPortrait(5, 8, 78, leftGen.portrait, leftGen.name, leftGen.id);
        r.drawText(leftGen.name, 90, 16, { color: '#44aaff', size: 17, bold: true, shadow: true });
        r.drawText(`兵:${duel.left.soldiers}`, 90, 36, { color: '#aaa', size: 14 });
        const leftHpRatio = duel.left.hp / duel.left.maxHp;
        // HP number row
        r.drawText(`HP  ${Math.floor(duel.left.hp)}/${duel.left.maxHp}`, 90, 54, { color: '#44cc44', size: 12, bold: true, baseline: 'middle' });
        // HP bar row (below number)
        this._drawGradientHPBar(ctx, 90, 64, 160, 9, leftHpRatio, this._s._hpFlash.left, false);

        // Right general
        const rightGen = duel.right.general;
        r.drawPortrait(r.width - 83, 8, 78, rightGen.portrait, rightGen.name, rightGen.id);
        r.drawText(rightGen.name, r.width - 90, 16, { color: '#ff4444', size: 17, align: 'right', bold: true, shadow: true });
        r.drawText(`兵:${duel.right.soldiers}`, r.width - 90, 36, { color: '#aaa', size: 14, align: 'right' });
        const rightHpRatio = duel.right.hp / duel.right.maxHp;
        // HP number row (right-aligned)
        r.drawText(`HP  ${Math.floor(duel.right.hp)}/${duel.right.maxHp}`, r.width - 90, 54, { color: '#44cc44', size: 12, bold: true, baseline: 'middle', align: 'right' });
        // HP bar row (below number)
        this._drawGradientHPBar(ctx, r.width - 250, 64, 160, 9, rightHpRatio, this._s._hpFlash.right, false);

        // Center: timer + score
        const timeLeft = Math.max(0, duel.maxTime - duel.timer);
        r.drawText(`${Math.floor(timeLeft)}s`, r.width / 2, 28, {
            color: timeLeft < 10 ? '#ff4444' : '#ffe080',
            size: 23, align: 'center', bold: true, shadow: true
        });
        const score = this._s.battle.matchScore;
        const leftLabel = this._s.playerSide === 'attacker' ? '我军' : '敌军';
        const rightLabel = this._s.playerSide === 'attacker' ? '敌军' : '我军';
        r.drawText(`${leftLabel} ${score.left} : ${score.right} ${rightLabel}`, r.width / 2, 64, {
            color: '#c8a850', size: 15, align: 'center'
        });

        // ── Bottom HUD: portrait + info left, skills center, speed right ──
        const hudH = 110;
        const hudY = r.height - hudH;
        const hudGrad = ctx.createLinearGradient(0, hudY, 0, r.height);
        hudGrad.addColorStop(0, 'rgba(30,15,5,0.85)');
        hudGrad.addColorStop(0.15, 'rgba(20,10,5,0.95)');
        hudGrad.addColorStop(1, 'rgba(10,5,2,0.98)');
        ctx.fillStyle = hudGrad;
        ctx.fillRect(0, hudY, r.width, hudH);
        r.drawLine(0, hudY, r.width, hudY, '#c8a850', 2);
        r.drawLine(0, hudY + 2, r.width, hudY + 2, 'rgba(200,168,80,0.3)', 1);

        if (this._s.selectedUnit) {
            const unit = this._s.selectedUnit;
            const gen = unit.general;

            // ── Left section: portrait ──
            const pSize = 64;
            const pX = 10;
            const pY = hudY + (hudH - pSize) / 2;
            r.drawPortrait(pX, pY, pSize, gen.portrait, gen.name, gen.id);

            // ── Info section: name + stats ──
            const infoX = pX + pSize + 12;
            const barW = 110;

            // Row 1: Name + Lv
            r.drawText(gen.name, infoX, hudY + 14, { color: '#ffe080', size: 15, bold: true, shadow: true, baseline: 'middle' });
            r.drawText(`Lv.${gen.level}`, infoX + 78, hudY + 14, { color: '#aaa', size: 12, baseline: 'middle' });

            // Row 2: HP label + number | bar
            r.drawText(`HP ${Math.floor(unit.hp)}/${unit.maxHp}`, infoX, hudY + 36, { color: '#44cc44', size: 12, bold: true, baseline: 'middle' });
            this._drawGradientHPBar(ctx, infoX, hudY + 46, barW, 7, unit.hp / unit.maxHp, 0);

            // Row 3: MP label + number | bar
            r.drawText(`MP ${Math.floor(unit.mp)}/${unit.maxMp}`, infoX, hudY + 62, { color: '#4488ff', size: 12, bold: true, baseline: 'middle' });
            r.drawBar(infoX, hudY + 72, barW, 7, unit.mp / unit.maxMp, '#4488ff');

            // Row 4: Soldiers
            r.drawText(`兵力: ${unit.soldiers}`, infoX, hudY + 92, { color: '#bbb', size: 12, baseline: 'middle' });

            // Vertical divider after info section
            const divX = infoX + 140;
            r.drawLine(divX, hudY + 8, divX, hudY + hudH - 8, '#554420', 1);

            // ── Skills section ──
            const skillH = 64;
            const skillGap = 8;
            const skillStartX = divX + 14;
            const skillY = hudY + (hudH - skillH) / 2;

            const skills = unit.skills;
            let skillCurX = skillStartX;
            for (let i = 0; i < skills.length; i++) {
                const skillName = skills[i].name;
                const skillW = skillName.length >= 4 ? 80 : 64;
                const bx = skillCurX;
                const by = skillY;
                skillCurX += skillW + skillGap;

                const canUse = skills[i].currentCd <= 0 && unit.mp >= skills[i].mpCost;
                const mx = this._s.input.mouse.x;
                const my = this._s.input.mouse.y;
                const hover = mx >= bx && mx <= bx + skillW && my >= by && my <= by + skillH;

                // Skill box background
                r.roundRect(bx, by, skillW, skillH, 4,
                    canUse ? (hover ? 'rgba(200,168,80,0.35)' : 'rgba(50,35,15,0.85)') : 'rgba(25,18,8,0.85)',
                    canUse ? '#c8a850' : '#443320'
                );

                // Skill name
                const nameSize = skillName.length >= 4 ? 15 : 16;
                r.drawText(skillName, bx + skillW / 2, by + 20, {
                    color: canUse ? '#ffe080' : '#555', size: nameSize, align: 'center', bold: true
                });

                // MP cost
                r.drawText(`MP:${skills[i].mpCost}`, bx + skillW / 2, by + 42, {
                    color: canUse ? '#4488ff' : '#333', size: 13, align: 'center'
                });

                // Cooldown overlay — 圆弧扫描动画
                if (skills[i].currentCd > 0) {
                    const cdRatio = skills[i].currentCd / skills[i].cooldown;
                    // Dark fill
                    ctx.fillStyle = 'rgba(0,0,0,0.62)';
                    ctx.fillRect(bx, by, skillW, skillH);
                    // Arc sweep (clock-wise from top, shows remaining CD)
                    const cx2 = bx + skillW / 2, cy2 = by + skillH / 2;
                    const arcR = Math.min(skillW, skillH) * 0.38;
                    ctx.save();
                    ctx.globalAlpha = 0.55;
                    ctx.strokeStyle = '#ff6040';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.arc(cx2, cy2, arcR, -Math.PI / 2, -Math.PI / 2 + cdRatio * Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                    ctx.restore();
                    r.drawText(`${Math.ceil(skills[i].currentCd)}`, bx + skillW / 2, by + skillH / 2, {
                        color: '#ff9070', size: 18, align: 'center', baseline: 'middle', bold: true, shadow: true
                    });
                }
            }
        }

        // Speed button (far right)
        const rbx = r.width - 90;
        const rby = hudY + (hudH - 34) / 2;
        r.drawButton(rbx, rby, 80, 34, `速度x${this._s.speedMultiplier}`,
            Renderer.pointInRect(this._s.input.mouse.x, this._s.input.mouse.y, rbx, rby, 80, 34), 14);
    }


    _drawOrderButtons(r) {
        const duel = this._s.battle.currentDuel;
        if (!duel) return;

        const playerIsLeft = this._s.playerSide === 'attacker';
        const genOrder = playerIsLeft ? duel.generalOrderLeft : duel.generalOrderRight;
        const solOrder = playerIsLeft ? duel.soldierOrderLeft : duel.soldierOrderRight;

        const hudH = 110;
        const hudY = r.height - hudH;
        const bw = 120, bh = 36;
        const gap = 14;
        const totalW = bw * 2 + gap;
        const bx1 = r.width / 2 - totalW / 2;
        const bx2 = bx1 + bw + gap;
        const by = hudY - bh - 8;

        const mx = this._s.input.mouse.x, my = this._s.input.mouse.y;

        // 武将出击 button
        const hov1 = !genOrder && Renderer.pointInRect(mx, my, bx1, by, bw, bh);
        if (!genOrder) {
            r.roundRect(bx1, by, bw, bh, 5,
                hov1 ? 'rgba(80,40,10,0.95)' : 'rgba(40,20,5,0.92)',
                hov1 ? '#ffcc44' : '#c8a850');
            r.drawText('⚔ 武将出击', bx1 + bw / 2, by + bh / 2 + 1, {
                color: hov1 ? '#ffee88' : '#ffe080', size: 16, align: 'center',
                baseline: 'middle', bold: true, shadow: true
            });
        } else {
            r.roundRect(bx1, by, bw, bh, 5, 'rgba(30,30,30,0.6)', '#554422');
            r.drawText('⚔ 武将出击', bx1 + bw / 2, by + bh / 2 + 1, {
                color: '#776644', size: 16, align: 'center',
                baseline: 'middle', bold: true, shadow: false
            });
        }

        // 全军出击 button
        const hov2 = !solOrder && Renderer.pointInRect(mx, my, bx2, by, bw, bh);
        if (!solOrder) {
            r.roundRect(bx2, by, bw, bh, 5,
                hov2 ? 'rgba(20,60,20,0.95)' : 'rgba(10,35,10,0.92)',
                hov2 ? '#88ff88' : '#44aa44');
            r.drawText('⚑ 全军出击', bx2 + bw / 2, by + bh / 2 + 1, {
                color: hov2 ? '#aaffaa' : '#88cc88', size: 16, align: 'center',
                baseline: 'middle', bold: true, shadow: true
            });
        } else {
            r.roundRect(bx2, by, bw, bh, 5, 'rgba(30,30,30,0.6)', '#224422');
            r.drawText('⚑ 全军出击', bx2 + bw / 2, by + bh / 2 + 1, {
                color: '#447744', size: 16, align: 'center',
                baseline: 'middle', bold: true, shadow: false
            });
        }
    }


    _renderDuelResultOverlay(r, ctx) {
        const duel = this._s.battle.currentDuel;
        if (!duel) return;

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, r.width, r.height);

        const lastResult = this._s.battle.duelResults[this._s.battle.duelResults.length - 1];
        if (!lastResult) return;

        const winner = lastResult.winnerSide === 'left' ? duel.left : duel.right;
        const winnerGen = winner.general;
        const isPlayerWin = (this._s.playerSide === 'attacker' && lastResult.winnerSide === 'left') ||
            (this._s.playerSide === 'defender' && lastResult.winnerSide === 'right');

        // Winner portrait with golden glow
        const cx = r.width / 2;

        // Golden aura
        const glowSize = 80 + Math.sin(this._s.battleTime * 4) * 10;
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#ffe080';
        ctx.beginPath();
        ctx.arc(cx, 160, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Portrait
        r.roundRect(cx - 50, 110, 100, 100, 5, 'rgba(200,168,80,0.2)', '#ffe080');
        r.drawPortrait(cx - 40, 115, 80, winnerGen.portrait, winnerGen.name, winnerGen.id);

        // Winner text
        r.drawText(isPlayerWin ? '胜利！' : '败北...', cx, 230, {
            color: isPlayerWin ? '#ffe080' : '#ff6644', size: 32, align: 'center', bold: true, shadow: true
        });

        r.drawText(`${lastResult.winnerName} 击败了 ${lastResult.loserName}`, cx, 268, {
            color: '#ccc', size: 18, align: 'center', shadow: true
        });

        // Historical duel badge
        if (this._s.isHistoricalDuel && this._s.currentHistoricalDuel) {
            r.roundRect(cx - 60, 285, 120, 22, 3, 'rgba(180,60,20,0.7)', '#ff6633');
            r.drawText('名将单挑', cx, 290, {
                color: '#ffe080', size: 15, align: 'center', bold: true
            });
        }

        // Remaining HP — background panel so text is never obscured
        const hpY = this._s.isHistoricalDuel ? 330 : 310;
        const hpPanelW = 180, hpPanelH = 64;
        r.roundRect(cx - hpPanelW / 2, hpY - 6, hpPanelW, hpPanelH, 4,
            'rgba(10,5,2,0.85)', '#554420');
        const hpRatio = winner.hp / winner.maxHp;
        const hpColor = hpRatio > 0.5 ? '#44cc44' : (hpRatio > 0.25 ? '#cccc44' : '#cc4444');
        r.drawText('残余HP', cx, hpY, {
            color: '#aaa', size: 13, align: 'center'
        });
        r.drawBar(cx - 65, hpY + 18, 130, 10, hpRatio, hpColor);
        r.drawText(`${Math.floor(winner.hp)} / ${winner.maxHp}`, cx, hpY + 34, {
            color: hpColor, size: 14, align: 'center', bold: true
        });

        // Score
        const score = this._s.battle.matchScore;
        r.drawText(`比分 ${score.left} : ${score.right}`, cx, hpY + hpPanelH + 12, {
            color: '#c8a850', size: 19, align: 'center', bold: true
        });
    }


    _drawResultOverlay(r, ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, r.width, r.height);

        const isWin = (this._s.playerSide === 'attacker' && this._s.battle.result === 'attacker_wins') ||
            (this._s.playerSide === 'defender' && this._s.battle.result === 'defender_wins');

        const playerFaction = this._s.gs.getPlayerFaction();
        const isGameOver = !playerFaction || !playerFaction.alive;

        const title = isGameOver ? '主公阵亡！' : (isWin ? '战斗胜利！' : '战斗失败...');
        const color = isGameOver ? '#ff4444' : (isWin ? '#ffe080' : '#ff6644');

        // Pre-calculate total content height to size the panel correctly
        const duelCount = Math.min(this._s.battle.duelResults.length, 6);
        const rd = this._s.resultData;
        const killedCount  = rd ? rd.killed.length : 0;
        const captureCount = rd ? rd.captures.length : 0;
        const escapedCount = rd ? rd.escaped.length : 0;
        const hasLoot = rd && (rd.loot.gold > 0 || rd.loot.food > 0);
        const lootLines = hasLoot ? (1 + (rd.loot.gold > 0 ? 1 : 0) + (rd.loot.food > 0 ? 1 : 0)) : 0;
        const leaderLines = (rd && rd.leaderKilled) ? 2 : 0;

        // title(55) + separator + score(28) + duels + separator + leader + killed + captures + escaped + loot + pad
        const contentH = 55 + 10 + 28 + duelCount * 22 + 28 +
            (leaderLines > 0 ? leaderLines * 26 : 0) +
            (killedCount > 0 ? 26 + killedCount * 22 : 0) +
            (captureCount > 0 ? 26 + captureCount * 22 : 0) +
            (escapedCount > 0 ? 26 + escapedCount * 22 : 0) +
            (lootLines > 0 ? 18 + lootLines * 22 : 0) +
            36;
        const panelH = Math.max(200, contentH);
        const panelW = 420;
        const panelX = r.width / 2 - panelW / 2;
        const panelY = Math.max(20, r.height / 2 - panelH / 2);

        r.roundRect(panelX, panelY, panelW, panelH, 6, 'rgba(30,15,5,0.9)', '#c8a850');

        const titleGrad = ctx.createLinearGradient(panelX, panelY, panelX + panelW, panelY);
        titleGrad.addColorStop(0, 'rgba(200,168,80,0)');
        titleGrad.addColorStop(0.5, 'rgba(200,168,80,0.3)');
        titleGrad.addColorStop(1, 'rgba(200,168,80,0)');
        ctx.fillStyle = titleGrad;
        ctx.fillRect(panelX, panelY, panelW, 55);

        r.drawText(title, r.width / 2, panelY + 32, {
            color, size: 28, align: 'center', baseline: 'middle', bold: true, shadow: true
        });

        r.drawLine(r.width / 2 - 140, panelY + 58, r.width / 2 + 140, panelY + 58, '#c8a850', 1);

        // Duel results summary
        const score = this._s.battle.matchScore;
        r.drawText(`总比分: ${score.left} : ${score.right}`, r.width / 2, panelY + 76, {
            color: '#ffe080', size: 16, align: 'center', bold: true
        });

        // Duel history
        let y = panelY + 106;
        for (let i = 0; i < duelCount; i++) {
            const dr = this._s.battle.duelResults[i];
            const resultColor = dr.winnerSide === (this._s.playerSide === 'attacker' ? 'left' : 'right') ? '#44cc44' : '#ff6644';
            const histTag = dr.isHistorical ? ' ★' : '';
            r.drawText(`第${i + 1}场: ${dr.winnerName} 胜 ${dr.loserName}${histTag}`, r.width / 2, y, {
                color: resultColor, size: 14, align: 'center'
            });
            y += 22;
        }

        y += 10;
        r.drawLine(r.width / 2 - 100, y, r.width / 2 + 100, y, '#554420', 1);
        y += 18;

        if (this._s.resultData) {
            const rd = this._s.resultData;
            if (rd.leaderKilled) {
                r.drawText(`${rd.leaderKilled} 已被斩杀！`, r.width / 2, y, {
                    color: '#ff4444', size: 16, align: 'center', bold: true, shadow: true
                });
                y += 26;
                r.drawText('该势力就此覆灭', r.width / 2, y, {
                    color: '#ff8866', size: 14, align: 'center'
                });
                y += 26;
            }

            if (rd.killed.length > 0) {
                r.drawText('阵亡', r.width / 2, y, {
                    color: '#ff6644', size: 15, align: 'center', bold: true
                });
                y += 26;
                for (const gen of rd.killed) {
                    r.drawText(gen.name, r.width / 2, y, {
                        color: '#ff9977', size: 14, align: 'center', shadow: true
                    });
                    y += 22;
                }
            }

            if (rd.captures.length > 0) {
                r.drawText('俘虏', r.width / 2, y, {
                    color: '#c8a850', size: 15, align: 'center', bold: true
                });
                y += 26;
                for (const gen of rd.captures) {
                    r.drawText(gen.name, r.width / 2, y, {
                        color: '#ffe080', size: 14, align: 'center', shadow: true
                    });
                    y += 22;
                }
            }

            if (rd.escaped.length > 0) {
                r.drawText('负伤逃脱', r.width / 2, y, {
                    color: '#88aacc', size: 15, align: 'center', bold: true
                });
                y += 26;
                for (const gen of rd.escaped) {
                    r.drawText(gen.name, r.width / 2, y, {
                        color: '#aaccee', size: 14, align: 'center', shadow: true
                    });
                    y += 22;
                }
            }

            if (rd.loot.gold > 0 || rd.loot.food > 0) {
                y += 10;
                r.drawText('战利品', r.width / 2, y, {
                    color: '#c8a850', size: 15, align: 'center', bold: true
                });
                y += 22;
                if (rd.loot.gold > 0) {
                    r.drawText(`金  ${rd.loot.gold}`, r.width / 2, y, {
                        color: '#ffd700', size: 14, align: 'center', shadow: true
                    });
                    y += 22;
                }
                if (rd.loot.food > 0) {
                    r.drawText(`粮  ${rd.loot.food}`, r.width / 2, y, {
                        color: '#88cc44', size: 14, align: 'center', shadow: true
                    });
                }
            }
        }

        if (isGameOver) {
            r.drawText('你的势力已灭亡，游戏结束', r.width / 2, r.height - 80, {
                color: '#ff6644', size: 15, align: 'center', shadow: true
            });
        }

        const blinkAlpha = 0.5 + Math.sin(this._s.battleTime * 3) * 0.3;
        ctx.globalAlpha = blinkAlpha;
        r.drawText(isGameOver ? '点击返回主菜单' : '点击继续', r.width / 2, r.height - 55, {
            color: '#c8a850', size: 16, align: 'center', shadow: true
        });
        ctx.globalAlpha = 1;
    }


    _drawGeneralUnits(r, ctx) {
        const duel = this._s.battle.currentDuel;
        if (!duel) return;

        const units = [duel.left, duel.right];

        for (const unit of units) {
            if (unit.state === 'dead') continue;

            const gen = unit.general;
            const faction = unit.side === 'left' ? this._s.battle.attacker.faction : this._s.battle.defender.faction;
            const color = faction.color;
            const dk = r._darkenColor(color, 40);
            const dk2 = r._darkenColor(color, 60);
            const lt = r._lightenColor(color, 30);
            const lt2 = r._lightenColor(color, 50);

            ctx.save();
            ctx.translate(Math.round(unit.x), Math.round(unit.y));

            // Selection indicator
            if (unit === this._s.selectedUnit) {
                const pulse = 0.5 + Math.sin(unit.frame * 0.1) * 0.3;
                ctx.strokeStyle = `rgba(255,224,128,${pulse})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(0, 14, 16, 7, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = `rgba(255,224,128,${pulse * 0.4})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(0, 14, 13, 5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 14, 12, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            const s = gen.stats.war >= 90 ? 2.0 : 1.8;
            const isStrategist = gen.stats.int > gen.stats.war;
            const unitType = gen.unitType || 'infantry';
            const osc = Math.sin(unit.frame * 0.08) * 1.2;
            const facing = unit.facing;
            const isFighting = (unit.state === 'fight' || unit.state === 'skill');

            ctx.save();
            if (facing === -1) ctx.scale(-1, 1);

            if (unitType === 'cavalry' && !isStrategist) {
                this._drawGeneralHorse(ctx, s, unit.frame, color, dk, lt);
                this._drawMountedWarrior(ctx, s, osc, color, dk, dk2, lt, lt2, gen, isFighting, unit.frame);
            } else if (isStrategist) {
                this._drawStrategistGeneral(ctx, s, osc, color, dk, lt, lt2, gen, isFighting, unit.frame);
            } else {
                this._drawWarriorGeneral(ctx, s, osc, color, dk, dk2, lt, lt2, gen, unitType, isFighting, unit.frame);
            }

            ctx.restore(); // facing
            ctx.restore(); // translate

            // HP bar
            const barWidth = 40;
            const hpRatio = unit.hp / unit.maxHp;
            const barY = unit.y - 46;
            r.fillRect(unit.x - barWidth / 2 - 1, barY - 1, barWidth + 2, 7, '#000');
            r.drawBar(unit.x - barWidth / 2, barY, barWidth, 5, hpRatio,
                hpRatio > 0.5 ? '#44cc44' : (hpRatio > 0.25 ? '#cccc44' : '#cc4444'));

            // MP bar (selected only)
            if (unit === this._s.selectedUnit) {
                const mpRatio = unit.mp / unit.maxMp;
                r.fillRect(unit.x - barWidth / 2 - 1, barY + 6, barWidth + 2, 4, '#000');
                r.drawBar(unit.x - barWidth / 2, barY + 7, barWidth, 3, mpRatio, '#4488ff');
            }

            // Name tag
            const nameWidth = r.measureText(gen.name, 17, true).width;
            r.fillRect(unit.x - nameWidth / 2 - 4, unit.y - 58, nameWidth + 8, 14, 'rgba(0,0,0,0.6)');
            r.drawText(gen.name, unit.x, unit.y - 52, {
                color: '#ffe080', size: 17, align: 'center', bold: true, shadow: true
            });

            // Soldier count
            r.drawText(`兵:${unit.soldiers}`, unit.x, unit.y + 18, {
                color: '#bbb', size: 15, align: 'center', shadow: true
            });
        }
    }


    _drawGeneralHorse(ctx, s, frame, color, dk, lt) {
        const phase = (Math.floor(frame * 0.04) % 4);
        const hBody = '#6a3a1a';
        const hDk = '#4a2810';
        const hLt = '#8a5a2a';

        ctx.fillStyle = hBody;
        ctx.fillRect(-5 * s, 4 * s, 24 * s, 8 * s);
        ctx.fillRect(-7 * s, 4 * s, 5 * s, 7 * s);
        ctx.fillStyle = hDk;
        ctx.fillRect(14 * s, 4 * s, 5 * s, 7 * s);
        ctx.fillStyle = hLt;
        ctx.fillRect(0, 9 * s, 14 * s, 2 * s);

        ctx.fillStyle = dk;
        ctx.fillRect(-3 * s, 3 * s, 14 * s, 4 * s);
        ctx.fillStyle = color;
        ctx.fillRect(-2 * s, 3.5 * s, 12 * s, 3 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-3 * s, 3 * s, 14 * s, 0.6 * s);
        ctx.fillRect(-3 * s, 6.5 * s, 14 * s, 0.6 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(0, 4.5 * s, 2 * s, 1.5 * s);
        ctx.fillRect(4 * s, 4.5 * s, 2 * s, 1.5 * s);
        ctx.fillRect(8 * s, 4.5 * s, 2 * s, 1.5 * s);

        ctx.fillStyle = hBody;
        ctx.fillRect(-10 * s, 1 * s, 6 * s, 7 * s);
        ctx.fillRect(-13 * s, 2 * s, 4 * s, 5 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(-12 * s, 2 * s, 5 * s, 3 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-11 * s, 3 * s, 3 * s, 1 * s);
        ctx.fillStyle = '#111';
        ctx.fillRect(-9 * s, 3 * s, 1 * s, 1.5 * s);
        ctx.fillStyle = '#3a1a08';
        ctx.fillRect(-13 * s, 5.5 * s, 1 * s, 1 * s);

        ctx.fillStyle = '#1a0e04';
        ctx.fillRect(-6 * s, 0 * s, 8 * s, 2.5 * s);
        ctx.fillRect(-7 * s, -1 * s, 3 * s, 2 * s);

        const legOff = [
            [1, -2, -1, 2], [3, 0, -3, 0], [-1, 2, 1, -2], [0, -3, 0, 3]
        ][phase].map(v => v * s);
        ctx.fillStyle = hDk;
        ctx.fillRect(-4 * s, 12 * s + legOff[0], 2.5 * s, 6 * s);
        ctx.fillRect(1 * s, 12 * s + legOff[1], 2.5 * s, 6 * s);
        ctx.fillRect(10 * s, 12 * s + legOff[2], 2.5 * s, 6 * s);
        ctx.fillRect(15 * s, 12 * s + legOff[3], 2.5 * s, 6 * s);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-4 * s, 17.5 * s + legOff[0], 3 * s, 1.2 * s);
        ctx.fillRect(1 * s, 17.5 * s + legOff[1], 3 * s, 1.2 * s);
        ctx.fillRect(10 * s, 17.5 * s + legOff[2], 3 * s, 1.2 * s);
        ctx.fillRect(15 * s, 17.5 * s + legOff[3], 3 * s, 1.2 * s);

        const tw = Math.sin(frame * 0.1) * 2 * s;
        ctx.fillStyle = '#1a0e04';
        ctx.fillRect(18 * s, 5 * s + tw, 2 * s, 6 * s);
    }


    _drawMountedWarrior(ctx, s, osc, color, dk, dk2, lt, lt2, gen, isFighting, frame) {
        ctx.fillStyle = dk;
        ctx.fillRect(-6 * s, -14 * s + osc, 2.5 * s, 16 * s);
        ctx.fillStyle = dk2;
        ctx.fillRect(-6 * s, -2 * s + osc, 2.5 * s, 4 * s);

        ctx.fillStyle = color;
        ctx.fillRect(-5 * s, -12 * s + osc, 10 * s, 14 * s);
        ctx.fillStyle = lt;
        ctx.fillRect(-5 * s, -12 * s + osc, 4 * s, 7 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(2 * s, -12 * s + osc, 3 * s, 14 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(-7 * s, -12 * s + osc, 3 * s, 4 * s);
        ctx.fillRect(5 * s, -12 * s + osc, 3 * s, 4 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-7 * s, -12 * s + osc, 15 * s, 0.6 * s);
        ctx.fillStyle = lt2;
        ctx.fillRect(-2 * s, -10 * s + osc, 4 * s, 4 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-1 * s, -9 * s + osc, 2 * s, 2 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-5 * s, 0 * s + osc, 10 * s, 1.2 * s);
        ctx.fillStyle = '#ffe080';
        ctx.fillRect(-1 * s, -0.5 * s + osc, 2 * s, 2 * s);

        this._drawGeneralHead(ctx, s, osc, gen, dk, lt);

        if (isFighting) {
            const swing = Math.sin(frame * 0.3) * 0.3;
            ctx.save();
            ctx.translate(5 * s, -14 * s + osc);
            ctx.rotate(swing);
            ctx.fillStyle = '#8a7050';
            ctx.fillRect(0, -4 * s, 1.2 * s, 22 * s);
            ctx.fillStyle = '#ddd';
            ctx.fillRect(-1.5 * s, -7 * s, 4 * s, 4 * s);
            ctx.fillStyle = '#eee';
            ctx.fillRect(-0.5 * s, -9 * s, 2 * s, 3 * s);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.moveTo(-2 * s, -5 * s);
            ctx.quadraticCurveTo(6 * s, 6 * s, 2 * s, 16 * s);
            ctx.lineTo(0, 16 * s);
            ctx.quadraticCurveTo(4 * s, 6 * s, -3 * s, -5 * s);
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 0.2 + Math.sin(frame * 0.3) * 0.15;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(7 * s, -6 * s + osc, 5 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = '#8a7050';
            ctx.fillRect(5 * s, -18 * s + osc, 1.2 * s, 20 * s);
            ctx.fillStyle = '#ccc';
            ctx.fillRect(4 * s, -21 * s + osc, 3 * s, 4 * s);
            ctx.fillStyle = '#eee';
            ctx.fillRect(5 * s, -23 * s + osc, 1.5 * s, 3 * s);
            const pw = Math.sin(frame * 0.08) * 1.5;
            ctx.fillStyle = color;
            ctx.fillRect(6 * s, -18 * s + osc, 5 * s + pw, 2.5 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(6 * s, -18 * s + osc, 5 * s + pw, 1 * s);
        }
    }


    _drawStrategistGeneral(ctx, s, osc, color, dk, lt, lt2, gen, isFighting, frame) {
        ctx.fillStyle = '#f0e8d0';
        ctx.fillRect(-5 * s, -12 * s + osc, 10 * s, 18 * s);
        ctx.fillStyle = '#e0d8c0';
        ctx.fillRect(2 * s, -12 * s + osc, 3 * s, 18 * s);
        ctx.fillRect(-6 * s, 2 * s + osc, 12 * s, 6 * s);
        ctx.fillStyle = '#d8d0b8';
        ctx.fillRect(-6 * s, 4 * s + osc, 12 * s, 4 * s);

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(-7 * s, -12 * s + osc, 3 * s, 16 * s);
        ctx.fillRect(5 * s, -12 * s + osc, 3 * s, 14 * s);
        ctx.globalAlpha = 1;

        ctx.fillStyle = color;
        ctx.fillRect(-5 * s, 0 * s + osc, 10 * s, 2 * s);
        ctx.fillStyle = lt;
        ctx.fillRect(-5 * s, 0 * s + osc, 10 * s, 0.8 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-1 * s, -0.5 * s + osc, 2 * s, 3 * s);

        ctx.fillStyle = lt;
        ctx.fillRect(-3 * s, -12 * s + osc, 6 * s, 4 * s);
        ctx.fillStyle = color;
        ctx.fillRect(-2 * s, -12 * s + osc, 4 * s, 3 * s);

        this._drawGeneralHead(ctx, s, osc, gen, dk, lt);

        const legOsc = Math.sin(frame * 0.1) * 1;
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(-3 * s, 7 * s + osc + legOsc, 3 * s, 3 * s);
        ctx.fillRect(1 * s, 7 * s + osc - legOsc, 3 * s, 3 * s);

        if (isFighting) {
            const waveAngle = Math.sin(frame * 0.25) * 0.5;
            ctx.save();
            ctx.translate(6 * s, -14 * s + osc);
            ctx.rotate(waveAngle);
            ctx.fillStyle = '#f5f0dc';
            ctx.beginPath();
            ctx.moveTo(0, 4 * s);
            ctx.lineTo(-4 * s, -3 * s);
            ctx.lineTo(0, -4 * s);
            ctx.lineTo(4 * s, -3 * s);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#8a7050';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            ctx.strokeStyle = '#b0a080';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, 4 * s); ctx.lineTo(-2 * s, -3 * s);
            ctx.moveTo(0, 4 * s); ctx.lineTo(0, -4 * s);
            ctx.moveTo(0, 4 * s); ctx.lineTo(2 * s, -3 * s);
            ctx.stroke();
            ctx.fillStyle = '#6a4a20';
            ctx.fillRect(-0.5 * s, 3 * s, 1 * s, 4 * s);
            ctx.fillStyle = 'rgba(100,200,255,0.25)';
            ctx.beginPath();
            ctx.arc(0, -2 * s, 6 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = '#f5f0dc';
            ctx.fillRect(5 * s, -12 * s + osc, 2 * s, 8 * s);
            ctx.fillStyle = '#b0a080';
            ctx.fillRect(5.5 * s, -12 * s + osc, 1 * s, 8 * s);
            ctx.fillStyle = '#6a4a20';
            ctx.fillRect(5 * s, -4 * s + osc, 2 * s, 3 * s);
        }
    }


    _drawWarriorGeneral(ctx, s, osc, color, dk, dk2, lt, lt2, gen, unitType, isFighting, frame) {
        const capeWave = Math.sin(frame * 0.06) * 1.5;
        ctx.fillStyle = dk;
        ctx.fillRect(-7 * s, -14 * s + osc, 2.5 * s, 18 * s + capeWave);
        ctx.fillStyle = dk2;
        ctx.fillRect(-7 * s, 0 * s + osc, 2.5 * s, 6 * s + capeWave);

        ctx.fillStyle = color;
        ctx.fillRect(-5 * s, -12 * s + osc, 10 * s, 14 * s);
        ctx.fillStyle = lt;
        ctx.fillRect(-5 * s, -12 * s + osc, 4 * s, 7 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(2 * s, -12 * s + osc, 3 * s, 14 * s);

        ctx.fillStyle = dk;
        ctx.fillRect(-7 * s, -13 * s + osc, 3.5 * s, 4 * s);
        ctx.fillRect(5 * s, -13 * s + osc, 3.5 * s, 4 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-6 * s, -13 * s + osc, 1 * s, 1 * s);
        ctx.fillRect(6 * s, -13 * s + osc, 1 * s, 1 * s);

        ctx.fillStyle = lt2;
        ctx.fillRect(-2 * s, -10 * s + osc, 4 * s, 5 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-1 * s, -9 * s + osc, 2 * s, 3 * s);

        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-5 * s, -12 * s + osc, 10 * s, 0.6 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(-4 * s, -5 * s + osc, 8 * s, 0.5 * s);
        ctx.fillRect(-4 * s, -2 * s + osc, 8 * s, 0.5 * s);

        ctx.fillStyle = '#c8a850';
        ctx.fillRect(-5 * s, 1 * s + osc, 10 * s, 1.5 * s);
        ctx.fillStyle = '#ffe080';
        ctx.fillRect(-1.5 * s, 0.5 * s + osc, 3 * s, 2.5 * s);

        ctx.fillStyle = '#4a3a28';
        ctx.fillRect(-5 * s, 2.5 * s + osc, 10 * s, 5 * s);
        ctx.fillStyle = dk;
        ctx.fillRect(-4 * s, 4 * s + osc, 3 * s, 3 * s);
        ctx.fillRect(1 * s, 4 * s + osc, 3 * s, 3 * s);

        const legOsc = Math.sin(frame * 0.12) * 1.8;
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(-4 * s, 7 * s + osc + legOsc, 3 * s, 5 * s);
        ctx.fillRect(1 * s, 7 * s + osc - legOsc, 3 * s, 5 * s);
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(-4 * s, 11 * s + osc + legOsc, 4 * s, 2 * s);
        ctx.fillRect(1 * s, 11 * s + osc - legOsc, 4 * s, 2 * s);

        this._drawGeneralHead(ctx, s, osc, gen, dk, lt);

        if (isFighting) {
            const swing = Math.sin(frame * 0.3) * 0.35;
            ctx.save();
            ctx.translate(6 * s, -14 * s + osc);
            ctx.rotate(swing);

            if (unitType === 'spear') {
                ctx.fillStyle = '#7a5a30';
                ctx.fillRect(-0.5 * s, -6 * s, 1.2 * s, 26 * s);
                ctx.fillStyle = '#ddd';
                ctx.fillRect(-2 * s, -9 * s, 5 * s, 4 * s);
                ctx.fillStyle = '#eee';
                ctx.fillRect(-0.5 * s, -11 * s, 2 * s, 3 * s);
                ctx.fillStyle = color;
                ctx.fillRect(-1.5 * s, -6 * s, 4 * s, 1.5 * s);
            } else if (unitType === 'archer') {
                ctx.strokeStyle = '#5a3010';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(2 * s, 4 * s, 8 * s, -1.0, 1.0);
                ctx.stroke();
                ctx.strokeStyle = '#bbb';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(2 * s + Math.cos(-1.0) * 8 * s, 4 * s + Math.sin(-1.0) * 8 * s);
                ctx.lineTo(2 * s + Math.cos(1.0) * 8 * s, 4 * s + Math.sin(1.0) * 8 * s);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#ccc';
                ctx.fillRect(-0.5 * s, -4 * s, 2 * s, 16 * s);
                ctx.fillStyle = '#eee';
                ctx.fillRect(0.5 * s, -4 * s, 1 * s, 16 * s);
                ctx.fillStyle = '#c8a850';
                ctx.fillRect(-1.5 * s, 11 * s, 4 * s, 2 * s);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.moveTo(-2 * s, -3 * s);
            ctx.quadraticCurveTo(8 * s, 6 * s, 2 * s, 16 * s);
            ctx.lineTo(0, 16 * s);
            ctx.quadraticCurveTo(5 * s, 6 * s, -3 * s, -3 * s);
            ctx.fill();
            ctx.restore();
            ctx.globalAlpha = 0.2 + Math.sin(frame * 0.3) * 0.15;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(7 * s, -6 * s + osc, 5 * s, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        } else {
            if (unitType === 'spear') {
                ctx.fillStyle = '#7a5a30';
                ctx.fillRect(5 * s, -20 * s + osc, 1.2 * s, 24 * s);
                ctx.fillStyle = '#ccc';
                ctx.fillRect(4 * s, -23 * s + osc, 3 * s, 4 * s);
                ctx.fillStyle = '#eee';
                ctx.fillRect(5 * s, -25 * s + osc, 1.5 * s, 3 * s);
                ctx.fillStyle = color;
                ctx.fillRect(4 * s, -20 * s + osc, 3 * s, 1.5 * s);
            } else if (unitType === 'archer') {
                ctx.strokeStyle = '#5a3010';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(7 * s, -4 * s + osc, 7 * s, -1.0, 1.0);
                ctx.stroke();
                ctx.fillStyle = '#5a3010';
                ctx.fillRect(-6 * s, -10 * s + osc, 2.5 * s, 10 * s);
                ctx.fillStyle = '#ccc';
                for (let a = 0; a < 3; a++) {
                    ctx.fillRect(-5.5 * s + a * s, -14 * s + osc, 0.5 * s, 5 * s);
                }
            } else {
                ctx.fillStyle = '#bbb';
                ctx.fillRect(5 * s, -14 * s + osc, 1.5 * s, 14 * s);
                ctx.fillStyle = '#ddd';
                ctx.fillRect(6 * s, -14 * s + osc, 0.5 * s, 14 * s);
                ctx.fillStyle = '#c8a850';
                ctx.fillRect(4 * s, -1 * s + osc, 4 * s, 2 * s);
                ctx.fillStyle = '#8a6a30';
                ctx.fillRect(5 * s, 1 * s + osc, 2 * s, 2 * s);
            }
        }
    }


    _drawGeneralHead(ctx, s, osc, gen, dk, lt) {
        ctx.fillStyle = '#ebb878';
        ctx.fillRect(-4 * s, -20 * s + osc, 8 * s, 8 * s);
        ctx.fillStyle = '#c89a60';
        ctx.fillRect(2 * s, -18 * s + osc, 2 * s, 5 * s);

        ctx.fillStyle = '#fff';
        ctx.fillRect(-3 * s, -16 * s + osc, 2 * s, 1.5 * s);
        ctx.fillRect(1 * s, -16 * s + osc, 2 * s, 1.5 * s);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-2.5 * s, -16 * s + osc, 1.2 * s, 1.5 * s);
        ctx.fillRect(1.5 * s, -16 * s + osc, 1.2 * s, 1.5 * s);
        ctx.fillStyle = '#1a1208';
        ctx.fillRect(-3 * s, -17 * s + osc, 2.5 * s, 0.7 * s);
        ctx.fillRect(1 * s, -17 * s + osc, 2.5 * s, 0.7 * s);

        ctx.fillStyle = '#1a1208';
        const hairStyle = gen.portrait && gen.portrait.hair;
        switch (hairStyle) {
            case 'wild':
                ctx.fillRect(-6 * s, -23 * s + osc, 12 * s, 5 * s);
                ctx.fillRect(-7 * s, -21 * s + osc, 2 * s, 5 * s);
                ctx.fillRect(5 * s, -21 * s + osc, 2 * s, 5 * s);
                ctx.fillRect(-5 * s, -24 * s + osc, 3 * s, 3 * s);
                break;
            case 'long':
                ctx.fillRect(-5 * s, -22 * s + osc, 10 * s, 4 * s);
                ctx.fillRect(-6 * s, -19 * s + osc, 2 * s, 10 * s);
                ctx.fillRect(4 * s, -19 * s + osc, 2 * s, 10 * s);
                break;
            case 'bun':
                ctx.fillRect(-4 * s, -22 * s + osc, 8 * s, 4 * s);
                ctx.fillRect(-2 * s, -25 * s + osc, 4 * s, 4 * s);
                ctx.fillStyle = '#c8a850';
                ctx.fillRect(-3 * s, -22 * s + osc, 6 * s, 1 * s);
                ctx.fillStyle = '#ffe080';
                ctx.fillRect(-1 * s, -22.5 * s + osc, 2 * s, 1.5 * s);
                break;
            case 'crown':
                ctx.fillStyle = '#1a1208';
                ctx.fillRect(-4 * s, -22 * s + osc, 8 * s, 4 * s);
                ctx.fillStyle = '#c8a850';
                ctx.fillRect(-4 * s, -26 * s + osc, 8 * s, 5 * s);
                ctx.fillStyle = '#ffe080';
                ctx.fillRect(0, -28 * s + osc, 1 * s, 3 * s);
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(-0.5 * s, -25 * s + osc, 1.5 * s, 1.5 * s);
                break;
            default:
                ctx.fillRect(-5 * s, -22 * s + osc, 10 * s, 4 * s);
        }
    }


    _drawSkillAnimations(r, ctx) {
        const anims = this._s.battle.skillAnimations;
        if (!anims || !anims.length) return;

        for (const anim of anims) {
            const t = anim.timer;
            const { fromX, fromY, toX, toY, color, name, hitTime, duration } = anim;
            const dx = toX - fromX, dy = toY - fromY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const angle = Math.atan2(dy, dx);

            ctx.save();

            // Skill name pop-up above caster
            if (t < 0.4) {
                const la = Math.min(1, t * 5) * (1 - t / 0.4);
                ctx.globalAlpha = la;
                const yOff = -60 - t * 30;
                const tw = r.measureText(name, 20, true).width;
                r.fillRect(fromX - tw / 2 - 5, fromY + yOff - 16, tw + 10, 22, 'rgba(0,0,0,0.65)');
                r.drawText(name, fromX, fromY + yOff, { color, size: 20, align: 'center', bold: true, shadow: true });
                ctx.globalAlpha = 1;
            }

            if (anim.isAura) {
                // AURA: expanding rings on caster/self
                const p = t / duration;
                const alpha = (1 - p) * (1 - p);
                for (let i = 0; i < 3; i++) {
                    ctx.globalAlpha = alpha * (1 - i * 0.28);
                    ctx.strokeStyle = i === 0 ? color : '#fff';
                    ctx.lineWidth = 3 - i;
                    ctx.beginPath();
                    ctx.arc(toX, toY, 12 + p * (50 + i * 12), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;

            } else if (anim.animType === 'slash') {
                // SLASH: line travels from caster to target, then impact burst
                if (t < hitTime) {
                    const p = t / hitTime;
                    const tipX = fromX + dx * p;
                    const tipY = fromY + dy * p;
                    ctx.shadowColor = color; ctx.shadowBlur = 12;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 6 * (1 - p * 0.4);
                    ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(tipX, tipY); ctx.stroke();
                    ctx.strokeStyle = color; ctx.lineWidth = 3 * (1 - p * 0.3);
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(tipX, tipY); ctx.stroke();
                    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
                    // Trailing perpendicular slash marks
                    const px = -dy / dist * 14, py = dx / dist * 14;
                    for (let i = 1; i <= 2; i++) {
                        const bp = Math.max(0, p - i * 0.18);
                        const bx = fromX + dx * bp, by = fromY + dy * bp;
                        ctx.globalAlpha = 0.35 / i;
                        ctx.strokeStyle = color; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(bx - px, by - py); ctx.lineTo(bx + px, by + py); ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                } else {
                    // Impact cross-slash burst
                    const ip = (t - hitTime) / (duration - hitTime);
                    const alpha = Math.max(0, 1 - ip * ip);
                    const spread = 28 + ip * 22;
                    ctx.globalAlpha = alpha;
                    ctx.shadowColor = color; ctx.shadowBlur = 10;
                    for (let i = 0; i < 3; i++) {
                        const a = angle + (i - 1) * (Math.PI / 5);
                        ctx.strokeStyle = i === 1 ? '#fff' : color;
                        ctx.lineWidth = (4 - i) * (1 - ip * 0.6);
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(toX - Math.cos(a) * spread * 0.4, toY - Math.sin(a) * spread * 0.4);
                        ctx.lineTo(toX + Math.cos(a) * spread, toY + Math.sin(a) * spread);
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                }

            } else if (anim.animType === 'thrust') {
                // THRUST: extending spear/beam from caster
                if (t < hitTime) {
                    const p = t / hitTime;
                    const tipX = fromX + dx * p, tipY = fromY + dy * p;
                    ctx.shadowColor = color; ctx.shadowBlur = 14;
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round';
                    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(tipX, tipY); ctx.stroke();
                    ctx.strokeStyle = color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(tipX, tipY); ctx.stroke();
                    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.8;
                    ctx.beginPath(); ctx.arc(tipX, tipY, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
                } else {
                    // Shockwave ring at target
                    const ip = (t - hitTime) / (duration - hitTime);
                    const alpha = Math.max(0, 1 - ip);
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = color; ctx.lineWidth = 3 * (1 - ip);
                    ctx.beginPath(); ctx.arc(toX, toY, ip * 40, 0, Math.PI * 2); ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.beginPath(); ctx.arc(toX, toY, ip * 26, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1;
                }

            } else if (anim.animType === 'spin') {
                // SPIN: arc builds on caster first, then expands at target
                const switchT = hitTime * 0.55;
                if (t < switchT) {
                    const p = t / switchT;
                    ctx.strokeStyle = color; ctx.lineWidth = 3;
                    ctx.globalAlpha = p;
                    ctx.shadowColor = color; ctx.shadowBlur = 8;
                    ctx.beginPath(); ctx.arc(fromX, fromY, 12 + p * 22, 0, Math.PI * 2 * p); ctx.stroke();
                    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                } else if (t < hitTime) {
                    const p = (t - switchT) / (hitTime - switchT);
                    ctx.globalAlpha = 1 - p;
                    ctx.strokeStyle = color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(fromX, fromY, 34, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1;
                } else {
                    const ip = (t - hitTime) / (duration - hitTime);
                    const alpha = Math.max(0, 1 - ip * ip);
                    ctx.globalAlpha = alpha;
                    ctx.shadowColor = color; ctx.shadowBlur = 10;
                    ctx.strokeStyle = color; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.arc(toX, toY, 18 + ip * 38, 0, Math.PI * 2); ctx.stroke();
                    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.beginPath(); ctx.arc(toX, toY, (18 + ip * 38) * 0.65, 0, Math.PI * 2); ctx.stroke();
                    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                }

            } else if (anim.animType === 'explosion') {
                // EXPLOSION: glowing orb travels, then explodes
                if (t < hitTime) {
                    const p = t / hitTime;
                    const cx2 = fromX + dx * p, cy2 = fromY + dy * p;
                    for (let i = 1; i <= 5; i++) {
                        const tp = Math.max(0, p - i * 0.07);
                        ctx.globalAlpha = 0.12 * (6 - i) / 5;
                        ctx.fillStyle = color;
                        ctx.beginPath(); ctx.arc(fromX + dx * tp, fromY + dy * tp, 5 - i * 0.6, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.globalAlpha = 1;
                    ctx.shadowColor = color; ctx.shadowBlur = 18;
                    const orbR = 5 + Math.sin(t * 40) * 1.5;
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(cx2, cy2, orbR, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = color;
                    ctx.beginPath(); ctx.arc(cx2, cy2, orbR * 0.6, 0, Math.PI * 2); ctx.fill();
                    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
                } else {
                    const ip = (t - hitTime) / (duration - hitTime);
                    const alpha = Math.max(0, 1 - ip * ip);
                    ctx.globalAlpha = alpha;
                    for (let i = 0; i < 12; i++) {
                        const a = (i / 12) * Math.PI * 2 + ip * 2;
                        const dd = ip * 65;
                        const sz = 6 * (1 - ip);
                        ctx.fillStyle = i % 2 === 0 ? color : '#ffaa00';
                        ctx.fillRect(toX + Math.cos(a) * dd - sz / 2, toY + Math.sin(a) * dd - sz / 2, sz, sz);
                    }
                    ctx.fillStyle = '#fff'; ctx.globalAlpha = alpha * 0.6;
                    ctx.beginPath(); ctx.arc(toX, toY, 18 * (1 - ip), 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1;
                }

            } else if (anim.animType === 'beam') {
                // BEAM: instant full line from caster to target, fades out
                const p = t / duration;
                const alpha = Math.max(0, 1 - p * p);
                ctx.globalAlpha = alpha;
                ctx.shadowColor = color; ctx.shadowBlur = 16;
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 8 * (1 - p * 0.7); ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
                ctx.strokeStyle = color; ctx.lineWidth = 14 * (1 - p * 0.5);
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke();
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;

            } else if (anim.animType === 'rain') {
                // RAIN: telegraph ring, then falling streaks
                if (t < 0.2) {
                    const p = t / 0.2;
                    ctx.globalAlpha = 0.6 + Math.sin(p * Math.PI * 6) * 0.3;
                    ctx.strokeStyle = color; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(toX, toY, 30 + p * 8, 0, Math.PI * 2); ctx.stroke();
                    ctx.globalAlpha = 1;
                } else {
                    const rp = (t - 0.2) / (duration - 0.2);
                    ctx.globalAlpha = Math.max(0, 1 - rp * rp);
                    ctx.fillStyle = color;
                    for (let i = 0; i < 14; i++) {
                        const seed = i * 137.5;
                        const rx = toX - 55 + (seed % 110);
                        const ry = toY - 75 + rp * 90 + (seed * 0.7 % 28);
                        ctx.fillRect(rx, ry, 2, 9);
                        ctx.fillRect(rx - 1, ry + 9, 4, 2);
                    }
                    ctx.globalAlpha = 1;
                }

            } else {
                // DEFAULT: traveling spark dot
                const p = Math.min(1, t / hitTime);
                const cx2 = fromX + dx * p, cy2 = fromY + dy * p;
                const alpha = t < hitTime ? 1 : Math.max(0, 1 - (t - hitTime) / (duration - hitTime));
                ctx.globalAlpha = alpha;
                ctx.shadowColor = color; ctx.shadowBlur = 12;
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(cx2, cy2, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = color;
                ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0; ctx.globalAlpha = 1;
            }

            ctx.restore();
        }
    }


    _drawEffect(r, ctx, effect) {
        const progress = effect.timer / effect.duration;
        const alpha = 1 - progress * progress;
        ctx.globalAlpha = alpha;

        switch (effect.type) {
            case 'explosion':
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2 + progress * 2;
                    const dist = progress * 70;
                    const size = 5 * (1 - progress);
                    ctx.fillStyle = i % 2 === 0 ? effect.color : '#ffaa00';
                    ctx.fillRect(
                        effect.x + Math.cos(angle) * dist - size / 2,
                        effect.y + Math.sin(angle) * dist - size / 2,
                        size, size
                    );
                }
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = alpha * 0.6;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 15 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = alpha;
                break;
            case 'slash':
                ctx.lineWidth = 4 * (1 - progress);
                for (let i = 0; i < 3; i++) {
                    ctx.strokeStyle = i === 0 ? '#fff' : effect.color;
                    ctx.globalAlpha = alpha * (1 - i * 0.3);
                    ctx.beginPath();
                    ctx.moveTo(effect.x - 35 + progress * 20 + i * 3, effect.y - 25 + i * 5);
                    ctx.lineTo(effect.x + 35 - progress * 20 - i * 3, effect.y + 25 - i * 5);
                    ctx.stroke();
                }
                ctx.globalAlpha = alpha;
                break;
            case 'spin': {
                ctx.lineWidth = 3;
                const radius = 20 + progress * 35;
                ctx.strokeStyle = effect.color;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2 * Math.min(1, progress * 3));
                ctx.stroke();
                ctx.strokeStyle = '#fff';
                ctx.globalAlpha = alpha * 0.5;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2 * Math.min(1, progress * 3));
                ctx.stroke();
                ctx.globalAlpha = alpha;
                break;
            }
            case 'beam': {
                const beamH = 12 * (1 - progress);
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillRect(effect.x - 110, effect.y - beamH, 220, beamH * 2);
                ctx.fillStyle = effect.color;
                ctx.globalAlpha = alpha;
                ctx.fillRect(effect.x - 100, effect.y - beamH * 0.6, 200, beamH * 1.2);
                break;
            }
            case 'rain':
                ctx.fillStyle = effect.color;
                for (let i = 0; i < 15; i++) {
                    const seed = i * 137.5;
                    const rx = effect.x - 60 + (seed % 120);
                    const ry = effect.y - 80 + progress * 100 + (seed * 0.7 % 30);
                    ctx.fillRect(rx, ry, 2, 8);
                    ctx.fillRect(rx - 1, ry + 8, 4, 2);
                }
                break;
            case 'aura':
                for (let i = 0; i < 3; i++) {
                    ctx.strokeStyle = i === 0 ? effect.color : '#fff';
                    ctx.globalAlpha = alpha * (1 - i * 0.3);
                    ctx.lineWidth = 3 - i;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, 10 + progress * (40 + i * 10), 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = alpha;
                break;
            default:
                ctx.fillStyle = '#fff';
                ctx.globalAlpha = alpha * 0.6;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 12 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = effect.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 8 * (1 - progress), 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        if (effect.text && progress < 0.5) {
            const textAlpha = 1 - progress * 2;
            ctx.globalAlpha = textAlpha;
            const textW = r.measureText(effect.text, 21, true).width;
            r.fillRect(effect.x - textW / 2 - 4, effect.y - 50, textW + 8, 22, 'rgba(0,0,0,0.6)');
            r.drawText(effect.text, effect.x, effect.y - 44, {
                color: effect.color, size: 21, align: 'center', bold: true, shadow: true
            });
        }

        ctx.globalAlpha = 1;
    }


    _drawMountains(r, ctx) {
        const cx = this._s.cameraX;

        // Layer 0: 极远山（淡蓝灰，几乎静止）
        ctx.fillStyle = '#1a2a38';
        ctx.beginPath();
        ctx.moveTo(0, 230);
        for (let x = 0; x <= r.width; x += 30) {
            const h = 100 + Math.sin(x * 0.004 + cx * 0.00015) * 55 +
                Math.sin(x * 0.009) * 22;
            ctx.lineTo(x, 230 - h);
        }
        ctx.lineTo(r.width, 230); ctx.closePath(); ctx.fill();

        // 极远山雪顶亮边
        ctx.strokeStyle = 'rgba(180,200,230,0.14)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= r.width; x += 30) {
            const h = 100 + Math.sin(x * 0.004 + cx * 0.00015) * 55 +
                Math.sin(x * 0.009) * 22;
            x === 0 ? ctx.moveTo(x, 230 - h) : ctx.lineTo(x, 230 - h);
        }
        ctx.stroke();

        // Layer 1: 远山（深绿偏灰）
        ctx.fillStyle = '#0e2a1a';
        ctx.beginPath();
        ctx.moveTo(0, 225);
        for (let x = 0; x <= r.width; x += 22) {
            const h = 72 + Math.sin(x * 0.007 + cx * 0.0004) * 38 +
                Math.sin(x * 0.016 + 1.2) * 18;
            ctx.lineTo(x, 225 - h);
        }
        ctx.lineTo(r.width, 225); ctx.closePath(); ctx.fill();

        // Layer 2: 中山（带轻微视差）
        ctx.fillStyle = '#173a1a';
        ctx.beginPath();
        ctx.moveTo(0, 228);
        for (let x = 0; x <= r.width; x += 16) {
            const h = 58 + Math.sin(x * 0.011 + cx * 0.0009) * 30 +
                Math.sin(x * 0.023) * 16;
            ctx.lineTo(x, 228 - h);
        }
        ctx.lineTo(r.width, 228); ctx.closePath(); ctx.fill();

        // Layer 3: 近山（最深色，更多视差）
        ctx.fillStyle = '#1e4020';
        ctx.beginPath();
        ctx.moveTo(0, 235);
        for (let x = 0; x <= r.width; x += 12) {
            const h = 44 + Math.sin(x * 0.016 + 0.8 + cx * 0.0018) * 26 +
                Math.sin(x * 0.035) * 12;
            ctx.lineTo(x, 235 - h);
        }
        ctx.lineTo(r.width, 235); ctx.closePath(); ctx.fill();

        // 近山边缘树木剪影
        ctx.fillStyle = '#152e16';
        for (let x = 0; x <= r.width; x += 18) {
            const bh = 44 + Math.sin(x * 0.016 + 0.8 + cx * 0.0018) * 26 + Math.sin(x * 0.035) * 12;
            const by = 235 - bh;
            const th = 9 + (Math.sin(x * 0.11) * 0.5 + 0.5) * 7;
            // 三角形树冠
            ctx.beginPath();
            ctx.moveTo(x, by - th);
            ctx.lineTo(x - 5, by + 1);
            ctx.lineTo(x + 5, by + 1);
            ctx.closePath(); ctx.fill();
        }

        // 山脚薄雾
        const fogGrad = ctx.createLinearGradient(0, 210, 0, 265);
        fogGrad.addColorStop(0, 'rgba(50,70,55,0)');
        fogGrad.addColorStop(0.5, 'rgba(55,75,60,0.22)');
        fogGrad.addColorStop(1, 'rgba(60,80,60,0.45)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, 210, r.width, 55);
    }


    _drawBattleFlags(r, ctx) {
        const t = this._s.battleTime;
        const groundY = 320;
        for (const flag of this._s.battleFlags) {
            const poleX = flag.x;
            const poleH = 80;
            const poleY = groundY - poleH;

            // Pole
            ctx.strokeStyle = '#8a6020';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(poleX, groundY);
            ctx.lineTo(poleX, poleY);
            ctx.stroke();

            // Wavy flag cloth (8 bezier-sampled points)
            const flagW = 36, flagH = 20;
            const wave = Math.sin(t * 5 + flag.waveOffset);
            const wave2 = Math.sin(t * 7.3 + flag.waveOffset + 1);
            ctx.fillStyle = flag.color;
            ctx.globalAlpha = 0.88;
            ctx.beginPath();
            ctx.moveTo(poleX, poleY);
            ctx.bezierCurveTo(
                poleX + flagW * 0.3, poleY + wave * 3,
                poleX + flagW * 0.7, poleY + wave2 * 4,
                poleX + flagW, poleY + wave * 2
            );
            ctx.bezierCurveTo(
                poleX + flagW * 0.7, poleY + flagH + wave2 * 4,
                poleX + flagW * 0.3, poleY + flagH + wave * 3,
                poleX, poleY + flagH
            );
            ctx.closePath(); ctx.fill();

            // Highlight edge
            ctx.strokeStyle = 'rgba(255,255,200,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(poleX, poleY);
            ctx.bezierCurveTo(
                poleX + flagW * 0.3, poleY + wave * 3,
                poleX + flagW * 0.7, poleY + wave2 * 4,
                poleX + flagW, poleY + wave * 2
            );
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Pole top spear tip
            ctx.fillStyle = '#c8a850';
            ctx.beginPath();
            ctx.moveTo(poleX, poleY - 10);
            ctx.lineTo(poleX - 3, poleY - 2);
            ctx.lineTo(poleX + 3, poleY - 2);
            ctx.closePath(); ctx.fill();
        }
    }


    _drawSoldiers(r, ctx, soldiers, facing) {
        for (const s of soldiers) {
            const color = facing === 1 ? '#4488cc' : '#cc4444';
            r.drawSprite(s.x - 13, s.y - 18, s.type, color, facing, s.frame, s.state);
        }
    }
}
