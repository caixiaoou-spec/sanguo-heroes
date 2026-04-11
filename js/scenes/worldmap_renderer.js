/**
 * worldmap_renderer.js — 大地图渲染层
 *
 * 从 WorldMapScene 提取的所有 _draw* 方法。
 * 通过 scene 引用访问游戏状态和 UI 状态。
 */

import Renderer from '../engine/renderer.js';
import DiplomacySystem from '../systems/diplomacy.js';

export class WorldMapRenderer {
    constructor(scene) {
        this._s = scene;  // reference to WorldMapScene for state access
    }

    _drawMapBackground(r, ctx) {
        const m = this._s._mapArea;
        const totalW = m.x + m.w + 100;
        const totalH = m.y + m.h + 100;

        // Parchment/ancient map background — cover full virtual map area
        const grad = ctx.createLinearGradient(0, 0, totalW, totalH);
        grad.addColorStop(0, '#2c3e2c');
        grad.addColorStop(0.3, '#1e3020');
        grad.addColorStop(0.6, '#1a2a1c');
        grad.addColorStop(1, '#162218');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, totalW, totalH);

        // Subtle terrain texture (seeded noise dots)
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 500; i++) {
            const seed = i * 7919;
            const tx = (seed * 13) % totalW;
            const ty = (seed * 17) % totalH;
            const shade = ((seed * 31) % 3 === 0) ? '#3a5a3a' : '#1a3a1a';
            ctx.fillStyle = shade;
            ctx.fillRect(tx, ty, 2, 2);
        }
        ctx.globalAlpha = 1;

        // Terrain regions (colored ground zones)
        this._drawTerrain(ctx, m);

        // Mountain ranges (decorative, north-central area)
        this._drawMountains(ctx, m);

        // Rivers (animated flowing water)
        this._drawRivers(ctx, m);

        // Region labels (faint background text)
        this._drawRegionLabels(r, ctx);

        // Animated clouds (position relative to virtual map, scrolls with map)
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < 6; i++) {
            const cx = (this._s.cloudOffset * (0.3 + i * 0.15) + i * 300) % (totalW + 300) - 150;
            const cy = 80 + i * 170;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 100, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + 40, cy - 8, 60, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Map border (ornamental)
        ctx.strokeStyle = '#c8a85033';
        ctx.lineWidth = 1;
        ctx.strokeRect(m.x - 5, m.y - 5, m.w + 10, m.h + 10);
    }

    _drawTerrain(ctx, m) {
        // Terrain region polygons (coords relative to _mapArea)
        const regions = [
            // 中原平原 (Central Plains)
            { type: 'plain', points: [[400,220],[600,200],[750,250],[780,350],[650,380],[450,370],[380,300]] },
            // 河北平原
            { type: 'plain', points: [[450,100],[650,90],[700,180],[600,200],[450,200]] },
            // 蜀地山地
            { type: 'mountain', points: [[50,350],[200,320],[250,400],[220,500],[100,520],[40,450]] },
            // 凉州/西域沙漠
            { type: 'desert', points: [[0,180],[120,170],[180,240],[150,320],[50,340],[0,300]] },
            // 荆南沼泽
            { type: 'swamp', points: [[350,470],[500,460],[550,530],[480,580],[380,570],[330,520]] },
            // 交州沼泽
            { type: 'swamp', points: [[330,540],[480,580],[550,620],[450,660],[300,640],[270,580]] },
            // 江东平原
            { type: 'plain', points: [[750,340],[900,310],[950,380],[920,460],[780,450],[730,400]] },
            // 并州山地
            { type: 'mountain', points: [[340,130],[450,120],[490,200],[440,240],[350,230],[310,180]] },
        ];

        const typeStyles = {
            plain:    'rgba(80,120,60,0.10)',
            mountain: 'rgba(100,80,50,0.12)',
            swamp:    'rgba(50,90,50,0.10)',
            desert:   'rgba(160,140,80,0.08)',
        };

        for (const region of regions) {
            ctx.fillStyle = typeStyles[region.type] || typeStyles.plain;
            ctx.beginPath();
            ctx.moveTo(m.x + region.points[0][0], m.y + region.points[0][1]);
            for (let i = 1; i < region.points.length; i++) {
                ctx.lineTo(m.x + region.points[i][0], m.y + region.points[i][1]);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Lakes
        const lakes = [
            { name: '洞庭湖', cx: m.x + 480, cy: m.y + 490, rx: 20, ry: 14 },
            { name: '鄱阳湖', cx: m.x + 700, cy: m.y + 450, rx: 18, ry: 22 },
            { name: '太湖', cx: m.x + 830, cy: m.y + 400, rx: 15, ry: 12 },
        ];

        for (const lake of lakes) {
            ctx.fillStyle = 'rgba(40,80,140,0.15)';
            ctx.beginPath();
            ctx.ellipse(lake.cx, lake.cy, lake.rx, lake.ry, 0, 0, Math.PI * 2);
            ctx.fill();
            // Lake shimmer
            ctx.fillStyle = 'rgba(80,140,200,0.06)';
            ctx.beginPath();
            ctx.ellipse(lake.cx - 3, lake.cy - 2, lake.rx * 0.6, lake.ry * 0.5, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawMountains(ctx, m) {
        // Mountain positions (screen coords, placed in natural locations)
        const mountains = [
            // 秦岭 (between Chang'an and Hanzhong)
            { cx: m.x + 280, cy: m.y + 370, count: 6, spread: 45 },
            // 太行山 (between Luoyang and Yecheng - runs north-south)
            { cx: m.x + 480, cy: m.y + 200, count: 5, spread: 35 },
            // 五岭 (south, between Jingnan and Jiaozhi)
            { cx: m.x + 560, cy: m.y + 560, count: 4, spread: 40 },
            // 巴山 (Sichuan basin rim)
            { cx: m.x + 150, cy: m.y + 400, count: 5, spread: 35 },
            // 祁连山 (far west, Liangzhou)
            { cx: m.x + 80, cy: m.y + 280, count: 4, spread: 35 },
            // 南岭 (separating Jingnan from Jiaozhi)
            { cx: m.x + 450, cy: m.y + 600, count: 3, spread: 30 },
            // 泰山 (Shandong)
            { cx: m.x + 710, cy: m.y + 250, count: 3, spread: 25 },
            // 燕山 (north of Beiping)
            { cx: m.x + 660, cy: m.y + 100, count: 4, spread: 30 },
        ];

        for (const mg of mountains) {
            for (let j = 0; j < mg.count; j++) {
                const seed = mg.cx * 31 + j * 997;
                const ox = (seed % mg.spread) - mg.spread / 2 + j * (mg.spread * 0.6);
                const oy = ((seed * 13) % 20) - 10;
                const h = 14 + (seed % 8);
                const w = 10 + (seed % 6);
                const bx = mg.cx + ox;
                const by = mg.cy + oy;

                // Mountain body
                ctx.fillStyle = '#2a4a2a';
                ctx.beginPath();
                ctx.moveTo(bx - w, by + h * 0.4);
                ctx.lineTo(bx, by - h * 0.6);
                ctx.lineTo(bx + w, by + h * 0.4);
                ctx.closePath();
                ctx.fill();

                // Snow cap
                ctx.fillStyle = '#5a7a5a';
                ctx.beginPath();
                ctx.moveTo(bx - w * 0.3, by - h * 0.2);
                ctx.lineTo(bx, by - h * 0.6);
                ctx.lineTo(bx + w * 0.3, by - h * 0.2);
                ctx.closePath();
                ctx.fill();

                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.beginPath();
                ctx.moveTo(bx, by - h * 0.6);
                ctx.lineTo(bx + w, by + h * 0.4);
                ctx.lineTo(bx + w * 0.3, by + h * 0.4);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    _drawRivers(ctx, m) {
        const phase = this._s.riverPhase;

        // Helper to draw one flowing river as a curved path
        const drawRiver = (points, width, alpha) => {
            ctx.save();
            ctx.strokeStyle = `rgba(60,120,180,${alpha})`;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                const wave = Math.sin(phase + i * 0.8) * 1.5;
                const px = points[i][0] + wave;
                const py = points[i][1];
                if (i === 1) {
                    ctx.lineTo(px, py);
                } else {
                    const prev = points[i - 1];
                    const cpx = (prev[0] + px) / 2;
                    const cpy = (prev[1] + py) / 2;
                    ctx.quadraticCurveTo(prev[0] + Math.sin(phase + i) * 1.2, prev[1], cpx, cpy);
                }
            }
            ctx.stroke();

            // River shimmer
            ctx.strokeStyle = `rgba(100,180,240,${alpha * 0.3})`;
            ctx.lineWidth = width * 0.4;
            ctx.stroke();
            ctx.restore();
        };

        // 黄河 (Yellow River) - flows from west to east in north
        const huanghe = [
            [m.x + 60, m.y + 280],
            [m.x + 150, m.y + 260],
            [m.x + 250, m.y + 240],
            [m.x + 350, m.y + 220],
            [m.x + 440, m.y + 200],
            [m.x + 530, m.y + 210],
            [m.x + 620, m.y + 230],
            [m.x + 700, m.y + 210],
            [m.x + 780, m.y + 190],
        ];
        drawRiver(huanghe, 3, 0.3);

        // 长江 (Yangtze) - flows from Sichuan through central to east
        const changjiang = [
            [m.x + 60, m.y + 460],
            [m.x + 140, m.y + 480],
            [m.x + 230, m.y + 470],
            [m.x + 330, m.y + 450],
            [m.x + 420, m.y + 460],
            [m.x + 500, m.y + 470],
            [m.x + 580, m.y + 450],
            [m.x + 660, m.y + 430],
            [m.x + 740, m.y + 410],
            [m.x + 820, m.y + 390],
            [m.x + 880, m.y + 370],
        ];
        drawRiver(changjiang, 3.5, 0.35);

        // Small tributaries
        const tributaries = [
            // 汉水
            [[m.x + 300, m.y + 340], [m.x + 400, m.y + 390], [m.x + 500, m.y + 450]],
            // 淮河
            [[m.x + 560, m.y + 330], [m.x + 650, m.y + 350], [m.x + 740, m.y + 360]],
            // 珠江
            [[m.x + 400, m.y + 580], [m.x + 500, m.y + 600], [m.x + 600, m.y + 610], [m.x + 680, m.y + 590]],
            // 辽河
            [[m.x + 750, m.y + 80], [m.x + 790, m.y + 110], [m.x + 820, m.y + 140]],
        ];
        for (const pts of tributaries) {
            drawRiver(pts, 1.5, 0.2);
        }
    }

    _drawRegionLabels(r, ctx) {
        const m = this._s._mapArea;
        const labels = [
            { text: '幽州', x: m.x + 720, y: m.y + 60 },
            { text: '河北', x: m.x + 570, y: m.y + 150 },
            { text: '中原', x: m.x + 520, y: m.y + 280 },
            { text: '关中', x: m.x + 280, y: m.y + 280 },
            { text: '蜀', x: m.x + 120, y: m.y + 450 },
            { text: '荆州', x: m.x + 430, y: m.y + 420 },
            { text: '江东', x: m.x + 770, y: m.y + 420 },
            { text: '凉州', x: m.x + 60, y: m.y + 280 },
            { text: '并州', x: m.x + 380, y: m.y + 170 },
            { text: '交州', x: m.x + 500, y: m.y + 580 },
            { text: '南蛮', x: m.x + 250, y: m.y + 580 },
            { text: '西域', x: m.x + 30, y: m.y + 200 },
        ];

        ctx.globalAlpha = 0.08;
        ctx.font = 'bold 30px "SimSun", "STSong", serif';
        ctx.fillStyle = '#c8a850';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const lb of labels) {
            ctx.fillText(lb.text, lb.x, lb.y);
        }
        ctx.globalAlpha = 1;
    }

    _drawRoutes(r, ctx) {
        const drawn = new Set();
        for (const city of this._s.gs.cities) {
            for (const neighborId of (city.neighbors || [])) {
                const key = [city.id, neighborId].sort().join('-');
                if (drawn.has(key)) continue;
                drawn.add(key);

                const neighbor = this._s.gs.getCity(neighborId);
                if (!neighbor) continue;

                const p1 = this._s._cityScreenPos(city);
                const p2 = this._s._cityScreenPos(neighbor);

                // Road shadow
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 3;
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.moveTo(p1.x + 1, p1.y + 1);
                ctx.lineTo(p2.x + 1, p2.y + 1);
                ctx.stroke();

                // Road main line (dotted, like ancient map paths)
                ctx.strokeStyle = 'rgba(180,150,80,0.35)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 6]);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        ctx.setLineDash([]);
    }

    _drawCities(r, ctx) {
        for (const city of this._s.gs.cities) {
            const faction = city.owner ? this._s.gs.getFaction(city.owner) : null;
            const color = faction ? faction.color : '#666';
            const isHovered = this._s.hoveredCity === city;
            const isSelected = this._s.selectedCity === city;
            const sp = this._s._cityScreenPos(city);
            const x = sp.x, y = sp.y;

            // Territory glow
            if (faction) {
                const gradient = ctx.createRadialGradient(x, y, 3, x, y, 30);
                gradient.addColorStop(0, color + '30');
                gradient.addColorStop(1, color + '00');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, Math.PI * 2);
                ctx.fill();
            }

            // Selected/hover highlight ring
            if (isSelected || isHovered) {
                ctx.save();
                ctx.strokeStyle = isSelected ? '#ffe080' : '#ffffff88';
                ctx.lineWidth = isSelected ? 2 : 1;
                ctx.shadowColor = isSelected ? '#ffe080' : '#ffffff';
                ctx.shadowBlur = isSelected ? 8 : 4;
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // City icon: castle/tower shape instead of circle
            this._drawCityIcon(ctx, x, y, color, faction, isSelected || isHovered);

            // Player-owned city indicator: pulsing golden ring
            if (city.owner === this._s.gs.playerFaction) {
                const pulse = 0.4 + Math.sin(this._s.flagWave * 0.8 + city.x * 0.05) * 0.2;
                ctx.save();
                ctx.strokeStyle = `rgba(255,224,128,${pulse})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Flag with banner
            if (faction) {
                const wave = Math.sin(this._s.flagWave + city.x * 0.1) * 2;
                // Flag pole
                ctx.strokeStyle = '#8a7a5a';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(x, y - 10);
                ctx.lineTo(x, y - 28);
                ctx.stroke();
                // Banner
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(x, y - 28);
                ctx.lineTo(x + 11 + wave, y - 25);
                ctx.lineTo(x + 9 + wave, y - 21);
                ctx.lineTo(x, y - 18);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // City name
            r.drawText(city.name, x, y + 14, {
                color: isHovered || isSelected ? '#ffe080' : '#ddd',
                size: 17, align: 'center', baseline: 'top', shadow: true
            });

            // General count and soldiers
            const genCount = this._s.gs.getGeneralsInCity(city.id).length;
            if (genCount > 0) {
                r.drawText(`${genCount}将`, x, y + 34, {
                    color: '#aaa', size: 13, align: 'center', baseline: 'top'
                });
            }
        }
    }

    _drawCityIcon(ctx, x, y, color, faction, highlighted) {
        const light = faction ? (faction.colorLight || color) : '#888';

        // City wall base (wider rectangle)
        ctx.fillStyle = '#3a3025';
        ctx.fillRect(x - 9, y - 4, 18, 14);

        // City wall top (battlements)
        ctx.fillStyle = '#4a3a28';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x - 8 + i * 7, y - 7, 4, 5);
        }

        // Gate
        ctx.fillStyle = '#1a1008';
        ctx.beginPath();
        ctx.arc(x, y + 6, 3, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 3, y + 6, 6, 4);

        // Inner color fill (faction color)
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(x - 7, y - 2, 14, 10);
        ctx.globalAlpha = 1;

        // Tower roofs
        ctx.fillStyle = light;
        // Left tower
        ctx.beginPath();
        ctx.moveTo(x - 9, y - 7);
        ctx.lineTo(x - 7, y - 11);
        ctx.lineTo(x - 5, y - 7);
        ctx.closePath();
        ctx.fill();
        // Right tower
        ctx.beginPath();
        ctx.moveTo(x + 5, y - 7);
        ctx.lineTo(x + 7, y - 11);
        ctx.lineTo(x + 9, y - 7);
        ctx.closePath();
        ctx.fill();

        // Outline
        ctx.strokeStyle = highlighted ? '#ffe080' : '#6a5a3a';
        ctx.lineWidth = highlighted ? 1.5 : 0.8;
        ctx.strokeRect(x - 9, y - 7, 18, 17);
    }

    _drawHUD(r, ctx) {
        const pf = this._s.gs.getPlayerFaction();
        if (!pf) return;

        // Top bar
        r.fillRect(0, 0, r.width, 42, 'rgba(30,15,5,0.92)');
        r.drawLine(0, 42, r.width, 42, '#c8a850', 1);

        const items = [
            { label: '势力', value: pf.name, color: pf.color },
            { label: '回合', value: `${this._s.gs.turn}` },
            { label: '金钱', value: `${pf.gold}` },
            { label: '粮草', value: `${pf.food}` },
            { label: '城池', value: `${this._s.gs.getCitiesOf(pf.id).length}` },
            { label: '武将', value: `${this._s.gs.getGeneralsOf(pf.id).length}` },
            { label: '行动', value: `${this._s.gs.actionPoints}/${this._s.gs.maxActionPoints}` },
        ];

        let hx = 15;
        for (const item of items) {
            r.drawText(item.label, hx, 21, { color: '#bbb', size: 16, baseline: 'middle' });
            hx += r.measureText(item.label, 16).width + 5;
            r.drawText(item.value, hx, 21, { color: item.color || '#ffe080', size: 18, baseline: 'middle', bold: true });
            hx += r.measureText(item.value, 18, true).width + 18;
        }

        // Bottom bar
        r.fillRect(0, r.height - 50, r.width, 50, 'rgba(30,15,5,0.92)');
        r.drawLine(0, r.height - 50, r.width, r.height - 50, '#c8a850', 1);

        // Mouse position for hover detection
        const mx = this._s.input.mouse.x;
        const my = this._s.input.mouse.y;

        // Fullscreen toggle button (top-right of top bar)
        const fsIcon = document.fullscreenElement ? '⊡' : '⛶';
        const fsBtnHover = mx >= r.width - 42 && mx <= r.width && my >= 4 && my <= 38;
        r.drawText(fsIcon, r.width - 21, 21, {
            color: fsBtnHover ? '#ffe080' : '#c8a850',
            size: 20,
            align: 'center',
            baseline: 'middle'
        });

        const leftBtns = [
            { text: '武将', x: 15, w: 80 },
            { text: '外交', x: 105, w: 80 },
            { text: '存档', x: 195, w: 80 },
        ];
        for (const btn of leftBtns) {
            const hover = mx >= btn.x && mx <= btn.x + btn.w && my >= r.height - 44 && my <= r.height - 8;
            r.drawButton(btn.x, r.height - 44, btn.w, 36, btn.text, hover);
        }

        // End turn button
        const etx = r.width - 130;
        const etHover = mx >= etx && mx <= etx + 116 && my >= r.height - 44 && my <= r.height - 8;
        r.drawButton(etx, r.height - 44, 116, 36, '结束回合', etHover);

        // Scroll hint + camera position indicator
        const maxCamX = Math.max(0, this._s._mapArea.x + this._s._mapArea.w - r.width);
        const maxCamY = Math.max(0, this._s._mapArea.y + this._s._mapArea.h - (r.height - 92));
        const hintText = (maxCamX > 0 || maxCamY > 0) ? '滚轮上下移动 / 拖拽地图' : '地图';
        r.drawText(hintText, r.width / 2, r.height - 28, {
            color: '#555', size: 13, align: 'center', baseline: 'middle'
        });

        // Scroll position indicator (small bar on right edge)
        if (maxCamY > 0) {
            const barH = 80;
            const barX = r.width - 6;
            const barY = r.height - 50 - barH - 4;
            r.fillRect(barX, barY, 4, barH, 'rgba(80,60,20,0.5)');
            const viewH2 = r.height - 92;
            const thumbH = Math.max(12, barH * Math.min(1, viewH2 / (this._s._mapArea.y + this._s._mapArea.h)));
            const thumbY = barY + (this._s._camY / maxCamY) * (barH - thumbH);
            r.fillRect(barX, thumbY, 4, thumbH, '#c8a850');
        }
    }

    _drawCityPanel(r, ctx) {
        const city = this._s.selectedCity;
        const faction = city.owner ? this._s.gs.getFaction(city.owner) : null;
        const isOwned = city.owner === this._s.gs.playerFaction;

        const px = r.width - 280;
        const py = 50;
        const pw = 270;

        // Pre-calculate content height to size panel dynamically
        const captives = isOwned ? this._s.gs.getCapturedInCity(city.id) : [];
        const allCityGens = isOwned ? this._s.gs.getGeneralsInCity(city.id) : [];
        const visibleGens = Math.min(allCityGens.length, 4);
        const genBlockH = visibleGens > 0 ? 26 + visibleGens * 40 + (allCityGens.length > visibleGens ? 20 : 0) : 36;
        const captiveBlockH = isOwned ? (captives.length > 0 ? 26 + captives.length * 36 + 10 : 44) : 0;
        const baseH = isOwned ? (160 + 28 + 3 * 30 + 24 + 12 + genBlockH + captiveBlockH + 16) : 220;
        const ph = Math.min(Math.max(545, baseH), r.height - py - 8);

        // Panel background with slight gradient
        r.roundRect(px, py, pw, ph, 6, 'rgba(25,12,4,0.96)', '#c8a850');

        // Title bar
        const grad = ctx.createLinearGradient(px, py, px + pw, py + 34);
        grad.addColorStop(0, 'rgba(120,70,20,0.85)');
        grad.addColorStop(1, 'rgba(80,48,12,0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(px + 1, py + 1, pw - 2, 33);
        r.drawLine(px, py + 34, px + pw, py + 34, '#c8a850', 1);

        // City name + faction color dot
        if (faction) {
            r.fillCircle(px + 18, py + 17, 5, faction.color);
        }
        r.drawText(city.name, px + pw / 2, py + 17, {
            color: '#ffe080', size: 20, align: 'center', baseline: 'middle', bold: true, shadow: true
        });

        // Owner line
        r.drawText(`所属：${faction ? faction.name : '无主'}`, px + 14, py + 44, {
            color: faction ? faction.color : '#888', size: 15
        });

        // ─── Section: City Stats ───
        r.drawLine(px + 14, py + 62, px + pw - 14, py + 62, '#c8a85044', 1);
        r.drawText('城池信息', px + 14, py + 72, { color: '#c8a850', size: 14, bold: true });

        const stats = [
            ['人口', city.population],
            ['农业', city.agriculture],
            ['商业', city.commerce],
            ['防御', city.defense],
            ['驻军', city.soldiers],
            ['士气', city.morale || 70],
        ];
        for (let i = 0; i < stats.length; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const sx = px + 14 + col * 128;
            const sy = py + 90 + row * 22;
            r.drawText(stats[i][0], sx, sy, { color: '#999', size: 14 });
            r.drawText(`${stats[i][1]}`, sx + 52, sy, { color: '#ffe080', size: 14 });
        }

        if (isOwned) {
            // ─── Section: Actions ───
            const actSectionY = py + 160;
            r.drawLine(px + 14, actSectionY, px + pw - 14, actSectionY, '#c8a85044', 1);
            r.drawText('城池操作', px + 14, actSectionY + 10, { color: '#c8a850', size: 14, bold: true });

            const actionsY = actSectionY + 28;
            const btnW = 118;
            const btnH = 24;
            const btnGap = 30;
            const actions = [
                { text: '开发农业', x: px + 10, y: actionsY },
                { text: '开发商业', x: px + 138, y: actionsY },
                { text: '征兵', x: px + 10, y: actionsY + btnGap },
                { text: '修筑城防', x: px + 138, y: actionsY + btnGap },
                { text: '搜索武将', x: px + 10, y: actionsY + btnGap * 2 },
                { text: '调遣', x: px + 138, y: actionsY + btnGap * 2 },
                { text: '出征', x: px + 10, y: actionsY + btnGap * 3 },
            ];

            const mx = this._s.input.mouse.x;
            const my = this._s.input.mouse.y;

            for (const act of actions) {
                const hover = mx >= act.x && mx <= act.x + btnW && my >= act.y && my <= act.y + btnH;
                r.drawButton(act.x, act.y, btnW, btnH, act.text, hover, 14);
            }

            // ─── Section: Generals ───
            const genSectionY = actionsY + btnGap * 3 + btnH + 12;
            r.drawLine(px + 14, genSectionY, px + pw - 14, genSectionY, '#c8a85044', 1);

            const allCityGens = this._s.gs.getGeneralsInCity(city.id);
            const idleGens = allCityGens.filter(g => g.status === 'idle');
            const encampedGens = allCityGens.filter(g => g.status === 'encamped');
            r.drawText(`驻守武将 (城内${idleGens.length} / 城外${encampedGens.length})`, px + 14, genSectionY + 10, { color: '#c8a850', size: 14, bold: true });

            // Combine: idle first, then encamped
            const generals = [...idleGens, ...encampedGens];
            const genListY = genSectionY + 26;
            const maxVisible = Math.min(generals.length, 4);
            const startIdx = this._s._cityGenScroll;
            for (let i = 0; i < maxVisible && startIdx + i < generals.length; i++) {
                const gen = generals[startIdx + i];
                const gy = genListY + i * 40;
                const isEncamped = gen.status === 'encamped';

                // Row background (alternating)
                if (i % 2 === 0) {
                    r.fillRect(px + 6, gy - 2, pw - 12, 38, 'rgba(255,255,255,0.02)');
                }

                // Portrait
                r.drawPortrait(px + 14, gy, 32, gen.portrait, gen.name, gen.id);

                // Name + encamped badge
                r.drawText(gen.name, px + 52, gy + 2, { color: isEncamped ? '#bb9944' : '#ffe080', size: 14, bold: true });
                if (isEncamped) {
                    r.drawText('[城外]', px + 52 + gen.name.length * 14 + 2, gy + 2, { color: '#cc7700', size: 12 });
                }
                // Level and soldiers
                r.drawText(`Lv${gen.level}  兵${gen.soldiers}`, px + 52, gy + 18, { color: '#aaa', size: 13 });
                // Stats
                r.drawText(`武${gen.war} 智${gen.int} 统${gen.lead}`, px + 168, gy + 10, { color: '#ccc', size: 13, baseline: 'middle' });
            }

            if (generals.length === 0) {
                r.drawText('暂无驻守武将', px + pw / 2, genListY + 10, {
                    color: '#666', size: 14, align: 'center'
                });
            } else if (generals.length > maxVisible) {
                // Scroll indicator
                const infoY = genListY + maxVisible * 40 + 4;
                const scrollInfo = `${startIdx + 1}-${Math.min(startIdx + maxVisible, generals.length)} / ${generals.length}  [滑动/滚轮]`;
                r.drawText(scrollInfo, px + pw / 2, infoY, {
                    color: '#777', size: 16, align: 'center'
                });
                if (startIdx > 0) {
                    r.drawText('▲', px + pw - 20, genListY - 6, { color: '#c8a850', size: 16, align: 'center' });
                }
                if (startIdx + maxVisible < generals.length) {
                    r.drawText('▼', px + pw - 20, infoY - 2, { color: '#c8a850', size: 16, align: 'center' });
                }
            }

            // ─── Section: Captives (always shown for owned cities) ───
            {
                const scrollRowH = generals.length > maxVisible ? 24 : 0;
                const genListEnd = genListY + Math.max(maxVisible, 1) * 40 + (generals.length === 0 ? 20 : 0) + scrollRowH + 12;
                const capSectionY = genListEnd;
                r.drawLine(px + 14, capSectionY, px + pw - 14, capSectionY, '#c8a85044', 1);
                r.drawText(`囚禁武将 (${captives.length})`, px + 14, capSectionY + 10, { color: '#cc4444', size: 14, bold: true });
                if (captives.length === 0) {
                    r.drawText('暂无俘虏', px + pw / 2, capSectionY + 28, { color: '#555', size: 13, align: 'center' });
                } else {
                    for (let i = 0; i < captives.length; i++) {
                        const cap = captives[i];
                        const gy = capSectionY + 26 + i * 36;
                        r.fillRect(px + 6, gy - 2, pw - 12, 34, 'rgba(80,20,20,0.3)');
                        r.drawPortrait(px + 12, gy, 28, cap.portrait, cap.name, cap.id);
                        const origFaction = this._s.gs.getFaction(cap.originalFaction);
                        r.drawText(cap.name, px + 46, gy + 2, { color: '#ffaa88', size: 13, bold: true });
                        r.drawText(`原：${origFaction ? origFaction.name : '无主'}  Lv${cap.level}`, px + 46, gy + 16, { color: '#888', size: 12 });
                        const recX = px + pw - 120;
                        const exeX = px + pw - 60;
                        const btnY = gy + 4;
                        const btnH2 = 22;
                        const recHover = mx >= recX && mx <= recX + 52 && my >= btnY && my <= btnY + btnH2;
                        const exeHover = mx >= exeX && mx <= exeX + 52 && my >= btnY && my <= btnY + btnH2;
                        r.roundRect(recX, btnY, 52, btnH2, 3,
                            recHover ? 'rgba(40,120,40,0.9)' : 'rgba(20,60,20,0.8)', '#44aa44');
                        r.drawText('招降', recX + 26, btnY + 11, { color: '#88ff88', size: 12, align: 'center', baseline: 'middle' });
                        r.roundRect(exeX, btnY, 52, btnH2, 3,
                            exeHover ? 'rgba(140,30,30,0.9)' : 'rgba(70,15,15,0.8)', '#aa4444');
                        r.drawText('斩杀', exeX + 26, btnY + 11, { color: '#ff8888', size: 12, align: 'center', baseline: 'middle' });
                    }
                }
            }
        } else {
            // Non-owned city: just show generals count
            const genSectionY = py + 160;
            r.drawLine(px + 14, genSectionY, px + pw - 14, genSectionY, '#c8a85044', 1);
            const generals = this._s.gs.getGeneralsInCity(city.id);
            r.drawText(`驻守武将: ${generals.length}名`, px + 14, genSectionY + 14, { color: '#999', size: 15 });
        }
    }

    _drawAttackSelectPanel(r, ctx) {
        const cx = r.width / 2 - 200;
        const cy = 100;
        const cw = 400;
        const maxVisible = 8;
        const visibleCount = Math.min(this._s.availableAttackers.length, maxVisible);
        const startIdx = this._s._attackScroll;

        // Panel height: title(30) + targets(55) + label(22) + generals(N*36) + scroll(16) + confirm(34) + pad(20)
        r.roundRect(cx, cy, cw, 177 + visibleCount * 36, 4, 'rgba(30,15,5,0.95)', '#c8a850');

        // Title
        r.fillRect(cx, cy, cw, 30, 'rgba(90,58,16,0.8)');
        r.drawText('选择出征', cx + cw / 2, cy + 15, {
            color: '#ffe080', size: 19, align: 'center', baseline: 'middle', bold: true
        });

        // Close button
        r.drawText('×', cx + cw - 15, cy + 15, { color: '#c8a850', size: 21, align: 'center', baseline: 'middle' });

        // Target selection (max 4)
        r.drawText('目标城池：', cx + 10, cy + 40, { color: '#999', size: 15 });
        const maxTargets = Math.min(this._s.attackTargets.length, 4);
        for (let i = 0; i < maxTargets; i++) {
            const tid = this._s.attackTargets[i];
            const tc = this._s.gs.getCity(tid);
            const bx = cx + 10 + i * 90;
            const by = cy + 55;
            const selected = this._s.attackTarget === tid;
            r.roundRect(bx, by, 85, 28, 3, selected ? 'rgba(200,168,80,0.3)' : 'rgba(0,0,0,0.3)', selected ? '#ffe080' : '#554420');
            r.drawText(tc.name, bx + 42, by + 14, {
                color: selected ? '#ffe080' : '#aaa', size: 15, align: 'center', baseline: 'middle'
            });
        }

        // General selection (with scroll)
        const scrollable = this._s.availableAttackers.length > maxVisible;
        r.drawText(`选择武将（最多5人）${scrollable ? ' [滑动/滚轮]' : ''}：`, cx + 10, cy + 92, { color: '#999', size: 15 });
        // ▲ scroll indicator — drawn to the right of the label, same row
        if (startIdx > 0) {
            r.drawText('▲', cx + cw - 20, cy + 92, { color: '#c8a850', size: 15, align: 'center' });
        }
        for (let vi = 0; vi < visibleCount; vi++) {
            const gen = this._s.availableAttackers[startIdx + vi];
            const gy = cy + 110 + vi * 36;
            const selected = this._s.selectedAttackers.includes(gen.id);
            const isEncamped = gen.status === 'encamped';

            r.roundRect(cx + 10, gy, cw - 20, 34, 3, selected ? 'rgba(200,168,80,0.2)' : 'rgba(0,0,0,0.2)', selected ? '#ffe080' : '#554420');
            r.drawPortrait(cx + 14, gy + 2, 30, gen.portrait, gen.name, gen.id);
            r.drawText(gen.name, cx + 50, gy + 8, { color: isEncamped ? '#bb9944' : '#ffe080', size: 13, bold: true });
            r.drawText(`武${gen.war} 统${gen.lead} 兵${gen.soldiers}`, cx + 50, gy + 22, { color: '#aaa', size: 12 });
            r.drawText(isEncamped ? '城外' : '城内', cx + cw - 70, gy + 17, {
                color: isEncamped ? '#cc7700' : '#44aa44', size: 12, baseline: 'middle'
            });
            if (selected) {
                r.drawText('✓', cx + cw - 30, gy + 17, { color: '#44ff44', size: 16, baseline: 'middle' });
            }
        }

        // ▼ scroll indicator — in its own 16px row below generals list
        if (startIdx + visibleCount < this._s.availableAttackers.length) {
            r.drawText('▼', cx + cw - 20, cy + 112 + visibleCount * 36, { color: '#c8a850', size: 15, align: 'center' });
        }

        // Confirm button — 18px below generals list bottom
        const confirmY = cy + 128 + visibleCount * 36;
        const canConfirm = this._s.selectedAttackers.length > 0;
        r.drawButton(cx + 130, confirmY, 140, 34, '出征！', canConfirm, 15);
    }

    _drawTransferSelectPanel(r, ctx) {
        const cx = r.width / 2 - 200;
        const cy = 100;
        const cw = 400;
        const maxVisible = 8;
        const visibleCount = Math.min(this._s.availableTransfers.length, maxVisible);
        const startIdx = this._s._transferScroll;

        r.roundRect(cx, cy, cw, 177 + visibleCount * 36, 4, 'rgba(30,15,5,0.95)', '#4488cc');

        // Title
        r.fillRect(cx, cy, cw, 30, 'rgba(30,60,100,0.8)');
        r.drawText(`调遣武将 - ${this._s.transferSource.name}`, cx + cw / 2, cy + 15, {
            color: '#88bbff', size: 19, align: 'center', baseline: 'middle', bold: true
        });

        // Close button
        r.drawText('×', cx + cw - 15, cy + 15, { color: '#88bbff', size: 21, align: 'center', baseline: 'middle' });

        // Target selection (max 4)
        r.drawText('目标城池：', cx + 10, cy + 40, { color: '#999', size: 15 });
        const maxTargets = Math.min(this._s.transferTargets.length, 4);
        for (let i = 0; i < maxTargets; i++) {
            const tid = this._s.transferTargets[i];
            const tc = this._s.gs.getCity(tid);
            const bx = cx + 10 + i * 90;
            const by = cy + 55;
            const selected = this._s.transferTarget === tid;
            r.roundRect(bx, by, 85, 28, 3, selected ? 'rgba(68,136,204,0.3)' : 'rgba(0,0,0,0.3)', selected ? '#88bbff' : '#334455');
            r.drawText(tc.name, bx + 42, by + 14, {
                color: selected ? '#88bbff' : '#aaa', size: 15, align: 'center', baseline: 'middle'
            });
        }

        // General selection (with scroll)
        const scrollable = this._s.availableTransfers.length > maxVisible;
        r.drawText(`选择武将${scrollable ? ' [滑动/滚轮]' : ''}：`, cx + 10, cy + 92, { color: '#999', size: 15 });
        if (startIdx > 0) {
            r.drawText('▲', cx + cw - 20, cy + 92, { color: '#4488cc', size: 15, align: 'center' });
        }
        for (let vi = 0; vi < visibleCount; vi++) {
            const gen = this._s.availableTransfers[startIdx + vi];
            const gy = cy + 110 + vi * 36;
            const selected = this._s.selectedTransfers.includes(gen.id);

            r.roundRect(cx + 10, gy, cw - 20, 34, 3, selected ? 'rgba(68,136,204,0.2)' : 'rgba(0,0,0,0.2)', selected ? '#88bbff' : '#334455');
            r.drawPortrait(cx + 14, gy + 2, 30, gen.portrait, gen.name, gen.id);
            r.drawText(gen.name, cx + 50, gy + 8, { color: '#88bbff', size: 13, bold: true });
            r.drawText(`武${gen.war} 统${gen.lead} 兵${gen.soldiers}`, cx + 50, gy + 22, { color: '#aaa', size: 12 });
            if (selected) {
                r.drawText('✓', cx + cw - 30, gy + 17, { color: '#44ff44', size: 16, baseline: 'middle' });
            }
        }

        if (startIdx + visibleCount < this._s.availableTransfers.length) {
            r.drawText('▼', cx + cw - 20, cy + 112 + visibleCount * 36, { color: '#4488cc', size: 15, align: 'center' });
        }

        const confirmY = cy + 128 + visibleCount * 36;
        const canConfirm = this._s.selectedTransfers.length > 0;
        r.drawButton(cx + 130, confirmY, 140, 34, '调遣', canConfirm, 15);
    }

    _drawGeneralListPanel(r, ctx) {
        const px = r.width / 2 - 340;
        const py = 40;
        const pw = 680;
        const generals = this._s.gs.getGeneralsOf(this._s.gs.playerFaction);
        const maxVisible = 16;
        const visibleCount = Math.min(generals.length, maxVisible);
        const startIdx = this._s._generalListScroll;

        r.roundRect(px, py, pw, 50 + visibleCount * 30 + 20, 4, 'rgba(30,15,5,0.95)', '#c8a850');

        // Title
        r.fillRect(px, py, pw, 30, 'rgba(90,58,16,0.8)');
        const scrollable = generals.length > maxVisible;
        r.drawText(`武将列表(${generals.length})${scrollable ? ' [滑动/滚轮]' : ''}`, px + pw / 2, py + 15, {
            color: '#ffe080', size: 19, align: 'center', baseline: 'middle', bold: true
        });
        // Scroll indicators in title bar (to avoid overlapping headers)
        if (startIdx > 0) {
            r.drawText('▲ 上翻', px + pw - 60, py + 15, { color: '#c8a850', size: 13, baseline: 'middle' });
        }

        // Headers
        const headers = ['武将', '级', '武', '智', '统', '政', '魅', '兵力', '兵种', '驻地'];
        const hx = [px + 10, px + 100, px + 148, px + 192, px + 236, px + 280, px + 324, px + 368, px + 430, px + 510];
        for (let i = 0; i < headers.length; i++) {
            r.drawText(headers[i], hx[i], py + 42, { color: '#c8a850', size: 14 });
        }

        // Rows (with scroll)
        const typeMap = { cavalry: '骑兵', infantry: '步兵', spear: '枪兵', archer: '弓兵' };
        const typeColorMap = { cavalry: '#ffaa44', infantry: '#88cc44', spear: '#44aaff', archer: '#ff88aa' };
        for (let vi = 0; vi < visibleCount; vi++) {
            const gen = generals[startIdx + vi];
            const gy = py + 60 + vi * 30;
            if (vi % 2 === 0) {
                r.fillRect(px + 5, gy - 2, pw - 10, 28, 'rgba(200,168,80,0.05)');
            }

            r.drawPortrait(px + 10, gy, 24, gen.portrait, gen.name, gen.id);
            r.drawText(gen.name, px + 40, gy + 4, { color: '#ffe080', size: 15 });
            r.drawText(`${gen.level}`, hx[1], gy + 4, { color: '#ccc', size: 15 });
            r.drawText(`${gen.war}`, hx[2], gy + 4, { color: gen.war >= 85 ? '#ff6644' : '#ccc', size: 15 });
            r.drawText(`${gen.int}`, hx[3], gy + 4, { color: gen.int >= 85 ? '#44aaff' : '#ccc', size: 15 });
            r.drawText(`${gen.lead}`, hx[4], gy + 4, { color: gen.lead >= 85 ? '#ffe080' : '#ccc', size: 15 });
            r.drawText(`${gen.pol}`, hx[5], gy + 4, { color: gen.pol >= 85 ? '#44ff44' : '#ccc', size: 15 });
            r.drawText(`${gen.cha}`, hx[6], gy + 4, { color: '#ccc', size: 15 });
            r.drawText(`${gen.soldiers}`, hx[7], gy + 4, { color: '#ccc', size: 15 });

            const typeName = typeMap[gen.unitType] || '步兵';
            const typeColor = typeColorMap[gen.unitType] || '#aaa';
            r.drawText(typeName, hx[8], gy + 4, { color: typeColor, size: 14 });

            const city = gen.city ? this._s.gs.getCity(gen.city) : null;
            r.drawText(city ? city.name : '-', hx[9], gy + 4, { color: '#aaa', size: 15 });
        }

        // ▼ scroll indicator — below last row, safely inside panel
        if (startIdx + visibleCount < generals.length) {
            r.drawText('▼ 下翻', px + pw - 60, py + 64 + visibleCount * 30, { color: '#c8a850', size: 13, baseline: 'middle' });
        }
    }

    _drawGeneralDetailPanel(r, ctx) {
        const gen = this._s.showGeneralDetail;
        if (!gen) return;

        const px = r.width / 2 - 290;
        const pw = 580;
        // Calculate height dynamically based on skill row count
        const skills = gen.skills.map(sid => this._s.gs.getSkill(sid)).filter(Boolean);
        const skillRows = Math.max(1, Math.ceil(skills.length / 4));
        // title(30) + portrait+info(110) + gap(12) + stats(58) + gap(14) + HP/MP(26) + gap(14) + skills header(22) + skills + pad(24)
        const ph = 30 + 110 + 12 + 58 + 14 + 26 + 14 + 22 + skillRows * 48 + 24;
        const py = Math.max(10, r.height / 2 - ph / 2);

        r.roundRect(px, py, pw, ph, 4, 'rgba(30,15,5,0.95)', '#c8a850');

        // Title bar
        r.fillRect(px, py, pw, 30, 'rgba(90,58,16,0.8)');
        r.drawText('武将详情', px + pw / 2, py + 15, {
            color: '#ffe080', size: 19, align: 'center', baseline: 'middle', bold: true
        });
        r.drawText('×', px + pw - 15, py + 15, { color: '#c8a850', size: 21, align: 'center', baseline: 'middle' });

        // Portrait
        r.drawPortrait(px + 15, py + 38, 90, gen.portrait, gen.name, gen.id);

        // Basic info (next to portrait)
        const infoX = px + 120;
        r.drawText(gen.name, infoX, py + 46, { color: '#ffe080', size: 24, bold: true });
        r.drawText(`Lv.${gen.level}   EXP: ${gen.exp || 0}/${gen.level * 100}`, infoX, py + 76, { color: '#aaa', size: 15 });
        r.drawText(`兵种: ${this._s._unitTypeName(gen.unitType)}   忠诚: ${gen.loyalty}`, infoX, py + 98, { color: '#aaa', size: 15 });
        const city = gen.city ? this._s.gs.getCity(gen.city) : null;
        r.drawText(`驻地: ${city ? city.name : '无'}   兵力: ${gen.soldiers}`, infoX, py + 120, { color: '#aaa', size: 15 });

        // Stats boxes
        const statsY = py + 152;
        const stats = [
            { name: '武力', val: gen.war, color: '#ff6644' },
            { name: '智力', val: gen.int, color: '#44aaff' },
            { name: '统率', val: gen.lead, color: '#ffe080' },
            { name: '政治', val: gen.pol, color: '#44ff44' },
            { name: '魅力', val: gen.cha, color: '#ff88ff' },
        ];
        const statBoxW = 104;
        const statBoxH = 54;
        const statGap = (pw - 30 - statBoxW * 5) / 4;
        for (let i = 0; i < stats.length; i++) {
            const sx = px + 15 + i * (statBoxW + statGap);
            r.roundRect(sx, statsY, statBoxW, statBoxH, 3, 'rgba(200,168,80,0.1)', '#554420');
            r.drawText(stats[i].name, sx + statBoxW / 2, statsY + 14, { color: '#999', size: 14, align: 'center' });
            r.drawText(`${stats[i].val}`, sx + statBoxW / 2, statsY + 40, {
                color: stats[i].color, size: 22, align: 'center', baseline: 'middle', bold: true
            });
        }

        // HP/MP bars：标签+数字在同一行，条紧跟其下
        const barY = statsY + statBoxH + 18;
        const barW = (pw - 50) / 2 - 10;
        // HP
        r.drawText('HP', px + 15, barY + 8, { color: '#44cc44', size: 14, bold: true, baseline: 'middle' });
        r.drawText(`${gen.hp}/${gen.maxHp}`, px + 40 + barW / 2, barY + 8, { color: '#44cc44', size: 13, align: 'center', baseline: 'middle' });
        r.drawBar(px + 40, barY + 18, barW, 8, gen.hp / gen.maxHp, '#44cc44');
        // MP
        const mpX = px + 40 + barW + 24;
        r.drawText('MP', mpX - 25, barY + 8, { color: '#4488ff', size: 14, bold: true, baseline: 'middle' });
        r.drawText(`${gen.mp}/${gen.maxMp}`, mpX + barW / 2, barY + 8, { color: '#4488ff', size: 13, align: 'center', baseline: 'middle' });
        r.drawBar(mpX, barY + 18, barW, 8, gen.mp / gen.maxMp, '#4488ff');

        // Skills
        const skillHeaderY = barY + 26 + 14;
        r.drawText('技能：', px + 15, skillHeaderY, { color: '#c8a850', size: 16, bold: true });
        for (let i = 0; i < skills.length; i++) {
            const skill = skills[i];
            const skillBoxW = Math.floor((pw - 30 - 9) / 4);
            const sx = px + 15 + (i % 4) * (skillBoxW + 3);
            const sy = skillHeaderY + 22 + Math.floor(i / 4) * 48;

            r.roundRect(sx, sy, skillBoxW, 42, 3, 'rgba(200,168,80,0.1)', '#554420');
            r.drawText(skill.name, sx + skillBoxW / 2, sy + 13, {
                color: this._s._skillTypeColor(skill.type), size: 15, align: 'center'
            });
            r.drawText(`MP:${skill.mpCost}  CD:${skill.cooldown}s`, sx + skillBoxW / 2, sy + 30, {
                color: '#888', size: 13, align: 'center'
            });
        }

    }

    _drawDiplomacyPanel(r, ctx) {
        const px = r.width / 2 - 250;
        const py = 60;
        const pw = 500;
        const factions = this._s.gs.getAliveFactions().filter(f => f.id !== this._s.gs.playerFaction);
        const maxVisible = 6;
        const visibleCount = Math.min(factions.length, maxVisible);
        const startIdx = this._s._diplomacyScroll;

        r.roundRect(px, py, pw, 50 + visibleCount * 80, 4, 'rgba(30,15,5,0.95)', '#c8a850');

        r.fillRect(px, py, pw, 30, 'rgba(90,58,16,0.8)');
        const scrollable = factions.length > maxVisible;
        r.drawText(`外交${scrollable ? ' [点击▲▼翻页]' : ''}`, px + pw / 2, py + 15, {
            color: '#ffe080', size: 19, align: 'center', baseline: 'middle', bold: true
        });

        for (let vi = 0; vi < visibleCount; vi++) {
            const f = factions[startIdx + vi];
            const fy = py + 50 + vi * 80;
            const relation = DiplomacySystem.getRelation(this._s.gs, this._s.gs.playerFaction, f.id);

            r.fillRect(px + 10, fy, pw - 20, 70, 'rgba(200,168,80,0.05)');
            r.strokeRect(px + 10, fy, pw - 20, 70, '#554420');

            // Faction color dot
            r.fillCircle(px + 30, fy + 20, 8, f.color);

            r.drawText(f.name, px + 50, fy + 10, { color: '#ffe080', size: 17, bold: true });
            r.drawText(`城池: ${this._s.gs.getCitiesOf(f.id).length}  武将: ${this._s.gs.getGeneralsOf(f.id).length}`, px + 50, fy + 30, { color: '#aaa', size: 14 });

            const relationText = relation === 'ally' ? '同盟' : (relation === 'enemy' ? '交战' : '中立');
            const relationColor = relation === 'ally' ? '#44ff44' : (relation === 'enemy' ? '#ff4444' : '#ffff44');
            r.drawText(relationText, px + 220, fy + 15, { color: relationColor, size: 16, bold: true });

            // Action buttons (context-sensitive based on relation)
            const mx = this._s.input.mouse.x;
            const my = this._s.input.mouse.y;

            if (relation === 'ally') {
                // Already allied: left button disabled, right button = 宣战 (break alliance)
                r.drawButton(px + 300, fy + 25, 70, 25, '同盟中', false, 0, true);
                const warHover = mx >= px + 380 && mx <= px + 450 && my >= fy + 25 && my <= fy + 50;
                r.drawButton(px + 380, fy + 25, 70, 25, '宣战', warHover);
            } else if (relation === 'enemy') {
                // At war: left button = 同盟, right button = 停战
                const allyHover = mx >= px + 300 && mx <= px + 370 && my >= fy + 25 && my <= fy + 50;
                r.drawButton(px + 300, fy + 25, 70, 25, '同盟', allyHover);
                const ceaseHover = mx >= px + 380 && mx <= px + 450 && my >= fy + 25 && my <= fy + 50;
                r.drawButton(px + 380, fy + 25, 70, 25, '停战', ceaseHover);
            } else {
                // Neutral: left = 同盟, right = 宣战
                const allyHover = mx >= px + 300 && mx <= px + 370 && my >= fy + 25 && my <= fy + 50;
                r.drawButton(px + 300, fy + 25, 70, 25, '同盟', allyHover);
                const warHover = mx >= px + 380 && mx <= px + 450 && my >= fy + 25 && my <= fy + 50;
                r.drawButton(px + 380, fy + 25, 70, 25, '宣战', warHover);
            }
        }

        // Scroll indicators — larger tap targets for touch/iPad
        if (startIdx > 0) {
            r.fillRect(px + pw - 54, py + 30, 44, 34, 'rgba(200,168,80,0.15)');
            r.strokeRect(px + pw - 54, py + 30, 44, 34, '#c8a850');
            r.drawText('▲', px + pw - 32, py + 47, { color: '#ffe080', size: 22, align: 'center', baseline: 'middle' });
        }
        if (startIdx + visibleCount < factions.length) {
            const arrowY = py + 50 + visibleCount * 80 - 4;
            r.fillRect(px + pw - 54, arrowY - 17, 44, 34, 'rgba(200,168,80,0.15)');
            r.strokeRect(px + pw - 54, arrowY - 17, 44, 34, '#c8a850');
            r.drawText('▼', px + pw - 32, arrowY, { color: '#ffe080', size: 22, align: 'center', baseline: 'middle' });
        }
    }

    _drawBreakAlliancePanel(r, ctx) {
        const pw = 420, ph = 160;
        const px = r.width / 2 - pw / 2;
        const py = r.height / 2 - ph / 2;
        const allyName = this._s._pendingBreakAllianceName;

        // Dim overlay
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, r.width, r.height);

        r.roundRect(px, py, pw, ph, 6, 'rgba(30,10,5,0.97)', '#cc4444');
        r.fillRect(px, py, pw, 30, 'rgba(100,20,20,0.8)');
        r.drawText('破坏同盟', px + pw / 2, py + 15, {
            color: '#ff8888', size: 17, align: 'center', baseline: 'middle', bold: true
        });

        r.drawText(`攻击${allyName}的城池将破坏同盟关系`, px + pw / 2, py + 58, {
            color: '#ffe080', size: 15, align: 'center', baseline: 'middle'
        });
        r.drawText('确定要宣战并出征吗？', px + pw / 2, py + 82, {
            color: '#aaa', size: 14, align: 'center', baseline: 'middle'
        });

        const mx = this._s.input.mouse.x;
        const my = this._s.input.mouse.y;
        const confirmX = px + pw / 2 - 130;
        const cancelX = px + pw / 2 + 10;
        const btnY = py + ph - 46;

        const confirmHover = mx >= confirmX && mx <= confirmX + 120 && my >= btnY && my <= btnY + 36;
        r.drawButton(confirmX, btnY, 120, 36, '宣战出征', confirmHover, 15);
        const cancelHover = mx >= cancelX && mx <= cancelX + 120 && my >= btnY && my <= btnY + 36;
        r.drawButton(cancelX, btnY, 120, 36, '取消', cancelHover, 15);
    }

    _drawBattleAlertPanel(r, ctx) {
        const alert = this._s._pendingBattleAlert;
        if (alert.isInterception) {
            this._drawInterceptionAlertPanel(r, ctx);
            return;
        }

        const faction = alert.attackerFaction;
        const defCity = this._s.gs.getCity(alert.defenderCityId);
        if (!defCity) { this._s._pendingBattleAlert = null; return; }
        const attackerGens = alert.attackerIds.map(id => this._s.gs.getGeneral(id)).filter(Boolean);

        const pw = 420;
        // Dynamic height: title(38) + faction(40) + divider(20) + generals(52 each) + defender(40) + gap(20) + button(36) + padding(20)
        const ph = 38 + 40 + 20 + attackerGens.length * 52 + 40 + 20 + 36 + 20;
        const px = r.width / 2 - pw / 2;
        const py = r.height / 2 - ph / 2;

        // Dim overlay
        r.fillRect(0, 0, r.width, r.height, 'rgba(0,0,0,0.6)');

        // Determine if player is the attacker
        const isPlayerAttacking = alert.playerIsAttacker;

        // Panel
        r.roundRect(px, py, pw, ph, 6, 'rgba(40,20,8,0.97)', isPlayerAttacking ? '#cc8833' : '#cc3333');

        // Border glow
        ctx.save();
        ctx.shadowColor = isPlayerAttacking ? '#ffaa44' : '#ff4444';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = isPlayerAttacking ? '#cc8833' : '#cc3333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px + 6, py);
        ctx.lineTo(px + pw - 6, py);
        ctx.quadraticCurveTo(px + pw, py, px + pw, py + 6);
        ctx.lineTo(px + pw, py + ph - 6);
        ctx.quadraticCurveTo(px + pw, py + ph, px + pw - 6, py + ph);
        ctx.lineTo(px + 6, py + ph);
        ctx.quadraticCurveTo(px, py + ph, px, py + ph - 6);
        ctx.lineTo(px, py + 6);
        ctx.quadraticCurveTo(px, py, px + 6, py);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // Title bar
        const isBreakthrough = alert.isRetreatBreakthrough;
        const titleText = isBreakthrough ? '突围！' : (isPlayerAttacking ? '我军到达！' : '敌军来袭！');
        const titleColor = isBreakthrough ? '#ff8800' : (isPlayerAttacking ? '#ffcc44' : '#ff4444');
        r.fillRect(px, py, pw, 38, isBreakthrough ? 'rgba(150,60,10,0.9)' : (isPlayerAttacking ? 'rgba(150,100,30,0.8)' : 'rgba(150,30,30,0.8)'));
        r.drawText(titleText, px + pw / 2, py + 19, {
            color: titleColor, size: 23, align: 'center', baseline: 'middle', bold: true, shadow: true
        });

        // Faction info
        const factionColor = faction ? faction.color : '#ff4444';
        const factionName = faction ? faction.name : '未知势力';
        if (isBreakthrough) {
            const destCity = this._s.gs.getCity(alert.retreatFinalDestination);
            const destName = destCity ? destCity.name : '己方城池';
            r.drawText(`撤退路径被 ${defCity.name} 阻断！`, px + pw / 2, py + 50, {
                color: '#ffaa44', size: 16, align: 'center', baseline: 'middle', shadow: true
            });
            r.drawText(`迎战或直接突围撤退回 ${destName}`, px + pw / 2, py + 68, {
                color: '#ccaa66', size: 14, align: 'center', baseline: 'middle'
            });
        } else if (isPlayerAttacking) {
            r.drawText(`我军已到达 ${defCity.name}，准备进攻！`, px + pw / 2, py + 60, {
                color: '#ffe080', size: 18, align: 'center', baseline: 'middle', shadow: true
            });
        } else {
            r.drawText(`${factionName} 向 ${defCity.name} 发起进攻！`, px + pw / 2, py + 60, {
                color: '#ffe080', size: 18, align: 'center', baseline: 'middle', shadow: true
            });
        }

        // Divider
        r.drawLine(px + 20, py + 78, px + pw - 20, py + 78, '#c8a85044', 1);

        // Attacker generals list
        r.drawText(isPlayerAttacking ? '出征武将：' : '来犯武将：', px + 30, py + 98, {
            color: '#ccc', size: 16, baseline: 'middle'
        });

        attackerGens.forEach((gen, i) => {
            const gy = py + 118 + i * 52;

            // Portrait
            r.drawPortrait(px + 35, gy, 40, gen.portrait, gen.name, gen.id);

            // Name and stats
            r.drawText(gen.name, px + 85, gy + 6, {
                color: factionColor, size: 17, bold: true
            });
            r.drawText(`武${gen.war} 智${gen.int} 统${gen.lead}`, px + 85, gy + 22, {
                color: '#aaa', size: 14
            });
            r.drawText(`兵力 ${gen.soldiers}`, px + 220, gy + 6, {
                color: '#ddd', size: 15
            });
            r.drawText(this._s._unitTypeName(gen.unitType), px + 220, gy + 22, {
                color: '#888', size: 14
            });
        });

        // Defender info
        const defGens = this._s.gs.getGeneralsInCity(defCity.id);
        const defSoldiers = defGens.reduce((s, g) => s + g.soldiers, 0) + (defCity.soldiers || 0);
        const dy = py + 118 + attackerGens.length * 52 + 8;

        r.drawLine(px + 20, dy - 4, px + pw - 20, dy - 4, '#c8a85044', 1);
        r.drawText(`${defCity.name} 守军：${defGens.length}将  兵力 ${defSoldiers}  城防 ${defCity.defense}`, px + pw / 2, dy + 12, {
            color: '#88bbff', size: 15, align: 'center', baseline: 'middle'
        });

        // Confirm button
        const btnW = 120, btnH = 36;
        const btnX = px + pw / 2 - btnW / 2;
        const btnY = py + ph - btnH - 16;
        const mx = this._s.input.mouse.x, my = this._s.input.mouse.y;
        const hover = Renderer.pointInRect(mx, my, btnX, btnY, btnW, btnH);
        const btnLabel = isBreakthrough ? '突围迎战！' : (isPlayerAttacking ? '进攻！' : '迎战！');
        r.drawButton(btnX, btnY, btnW, btnH, btnLabel, hover);
    }

    _drawInterceptionAlertPanel(r, ctx) {
        const alert = this._s._pendingBattleAlert;
        const atkFaction = this._s.gs.getFaction(alert.attackerFactionId);
        const defFaction = this._s.gs.getFaction(alert.defenderFactionId);
        const atkGens = alert.attackerIds.map(id => this._s.gs.getGeneral(id)).filter(Boolean);
        const defGens = alert.defenderIds.map(id => this._s.gs.getGeneral(id)).filter(Boolean);

        const pw = 460;
        const listRows = Math.max(atkGens.length, defGens.length);
        const ph = 38 + 30 + 20 + listRows * 52 + 20 + 36 + 20;
        const px = r.width / 2 - pw / 2;
        const py = r.height / 2 - ph / 2;

        r.fillRect(0, 0, r.width, r.height, 'rgba(0,0,0,0.6)');
        r.roundRect(px, py, pw, ph, 6, 'rgba(40,20,8,0.97)', '#cc8833');

        // Title
        r.fillRect(px, py, pw, 38, 'rgba(130,80,20,0.85)');
        r.drawText('野战！路途相遇', px + pw / 2, py + 19, {
            color: '#ffcc44', size: 23, align: 'center', baseline: 'middle', bold: true, shadow: true
        });

        // Subtitle
        const atkName = atkFaction ? atkFaction.name : '???';
        const defName = defFaction ? defFaction.name : '???';
        r.drawText(`${atkName}  VS  ${defName}`, px + pw / 2, py + 56, {
            color: '#ffe080', size: 17, align: 'center', baseline: 'middle'
        });

        r.drawLine(px + 20, py + 74, px + pw - 20, py + 74, '#c8a85044', 1);

        // Two columns: attacker left, defender right
        const colW = (pw - 40) / 2;
        r.drawText(`${atkName} 出征武将`, px + 20 + colW / 2, py + 90, {
            color: (atkFaction ? atkFaction.color : '#44aaff'), size: 15, align: 'center', bold: true
        });
        r.drawText(`${defName} 出征武将`, px + 20 + colW + colW / 2, py + 90, {
            color: (defFaction ? defFaction.color : '#ff6644'), size: 15, align: 'center', bold: true
        });

        const drawGenRow = (gen, col, row) => {
            const gx = px + 20 + col * (colW + 0);
            const gy = py + 110 + row * 52;
            r.drawPortrait(gx, gy, 40, gen.portrait, gen.name, gen.id);
            r.drawText(gen.name, gx + 48, gy + 6, { color: '#ffe080', size: 16, bold: true });
            r.drawText(`武${gen.war} 统${gen.lead} 兵${gen.soldiers}`, gx + 48, gy + 24, { color: '#aaa', size: 13 });
        };

        atkGens.forEach((g, i) => drawGenRow(g, 0, i));
        defGens.forEach((g, i) => drawGenRow(g, 1, i));

        // Confirm button
        const btnW = 120, btnH = 36;
        const btnX = px + pw / 2 - btnW / 2;
        const btnY = py + ph - btnH - 16;
        const hover = Renderer.pointInRect(this._s.input.mouse.x, this._s.input.mouse.y, btnX, btnY, btnW, btnH);
        r.drawButton(btnX, btnY, btnW, btnH, '迎战！', hover);
    }

    _drawTurnReportPanel(r, ctx) {
        const px = r.width / 2 - 260;
        const pw = 520;
        const maxVisible = 14;
        const visibleCount = Math.min(this._s.turnReports.length, maxVisible);
        // 40 header + items + 28 scroll row + 10 gap + 28 close text + 14 bottom pad
        const ph = 40 + visibleCount * 32 + 80;
        const py = r.height / 2 - ph / 2;

        r.roundRect(px, py, pw, ph, 4, 'rgba(30,15,5,0.95)', '#c8a850');

        r.fillRect(px, py, pw, 40, 'rgba(90,58,16,0.8)');
        r.drawText(`第 ${this._s.gs.turn} 回合结算`, px + pw / 2, py + 20, {
            color: '#ffe080', size: 23, align: 'center', baseline: 'middle', bold: true
        });

        const startIdx = this._s._turnReportScroll || 0;
        for (let vi = 0; vi < visibleCount; vi++) {
            const report = this._s.turnReports[startIdx + vi];
            if (!report) break;
            const ry = py + 50 + vi * 32;
            const icon = report.type === 'warning' ? '⚠' : (report.type === 'event' ? '★' : (report.type === 'victory' ? '♛' : '●'));
            const color = report.type === 'warning' ? '#ff8844' : (report.type === 'event' ? '#44aaff' : (report.type === 'victory' ? '#ffe080' : '#ccc'));

            r.drawText(icon, px + 22, ry + 6, { color, size: 17 });
            r.drawText(report.text, px + 46, ry + 6, { color, size: 17, maxWidth: pw - 68 });
        }

        // Scroll arrows — side by side in scroll row to avoid overlap
        const scrollRowY = py + 40 + visibleCount * 32;
        if (startIdx > 0) {
            r.drawText('▲ 上翻', px + 30, scrollRowY + 14, { color: '#ffe080', size: 15, baseline: 'middle' });
        }
        if (startIdx + visibleCount < this._s.turnReports.length) {
            r.drawText('▼ 下翻', px + pw - 90, scrollRowY + 14, { color: '#ffe080', size: 15, baseline: 'middle' });
        }

        // Close hint at the very bottom of the panel, clearly separated
        const closeY = py + ph - 18;
        r.drawText('（点击任意处继续）', px + pw / 2, closeY, {
            color: '#aaa', size: 17, align: 'center'
        });
    }

    _drawMarches(r, ctx) {
        for (const march of this._s.gs.marches) {
            // Don't draw arrived marches (animProgress >= 1) — they're already in the city
            if ((march.animProgress ?? 0) >= 1) continue;

            const pos = this._s._marchScreenPos(march);
            if (!pos) continue;

            const faction = this._s.gs.getFaction(march.faction);
            const isAttack = march.type === 'attack';
            const isPlayer = march.faction === this._s.gs.playerFaction;

            // Draw route line (dashed, subtle)
            const srcCity = this._s.gs.getCity(march.sourceCity);
            const tgtCity = this._s.gs.getCity(march.targetCity);
            const sp = this._s._cityScreenPos(srcCity);
            const tp = this._s._cityScreenPos(tgtCity);
            ctx.save();
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = isAttack ? 'rgba(255,120,80,0.25)' : 'rgba(100,180,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(tp.x, tp.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Small subtle glow
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = isAttack ? '#ff8860' : '#80b0ff';
            ctx.fill();
            ctx.globalAlpha = 1;

            // Draw small arrow/triangle marker (lightweight, semi-transparent)
            const facing = (tp.x - sp.x) >= 0 ? 1 : -1;
            const angle = Math.atan2(tp.y - sp.y, tp.x - sp.x);
            const factionColor = faction?.color || '#aaa';

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(angle);
            ctx.globalAlpha = 0.7;

            // Small filled triangle (arrow pointing in travel direction)
            ctx.fillStyle = factionColor;
            ctx.beginPath();
            ctx.moveTo(6, 0);
            ctx.lineTo(-4, -4);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();

            // Tiny flag trailing behind
            const wave = Math.sin(this._s.flagWave + march.id * 2) * 1;
            ctx.fillStyle = isAttack ? 'rgba(255,100,60,0.6)' : 'rgba(80,160,255,0.6)';
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(-5, -5 + wave);
            ctx.lineTo(-10, -3 + wave);
            ctx.lineTo(-5, -1);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.restore();

            // Label (small, semi-transparent)
            const gen0 = this._s.gs.getGeneral(march.generalIds[0]);
            const label = gen0 ? gen0.name : (faction?.name || '');
            const labelColor = isPlayer ? 'rgba(100,255,100,0.7)' : (isAttack ? 'rgba(255,150,120,0.7)' : 'rgba(140,190,255,0.7)');
            r.drawText(label, pos.x, pos.y + 10, {
                color: labelColor, size: 14, align: 'center'
            });
        }
    }

    // Draw stationary camp triangles for encamped generals (over garrison cap, no other city)
    _drawEncampedGenerals(r, ctx) {
        const gs = this._s.gs;
        // Group encamped generals by city
        const byCityId = {};
        for (const gen of gs.generals) {
            if (gen.status !== 'encamped' || !gen.city) continue;
            if (!byCityId[gen.city]) byCityId[gen.city] = [];
            byCityId[gen.city].push(gen);
        }
        const t = this._s.flagWave; // reuse existing animation timer

        for (const [cityId, gens] of Object.entries(byCityId)) {
            const city = gs.getCity(cityId);
            if (!city) continue;
            const sp = this._s._cityScreenPos(city);
            const faction = gs.getFaction(city.owner);
            const color = faction?.color || '#aaa';
            const isPlayer = city.owner === gs.playerFaction;

            // Offset slightly to the right of the city marker
            const cx = sp.x + 22;
            const cy = sp.y - 4;

            // Subtle pulsing glow
            const pulse = 0.35 + Math.sin(t * 2.5) * 0.15;
            ctx.save();
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.globalAlpha = 1;

            // Stationary triangle pointing right (encamped, not moving)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(cx + 6, cy);
            ctx.lineTo(cx - 4, cy - 4);
            ctx.lineTo(cx - 4, cy + 4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = isPlayer ? '#88ff88' : 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Small tent/camp icon — two diagonal lines above triangle
            ctx.strokeStyle = 'rgba(255,255,200,0.6)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(cx - 2, cy - 5);
            ctx.lineTo(cx + 2, cy - 9);
            ctx.lineTo(cx + 6, cy - 5);
            ctx.stroke();

            // General count badge
            const cnt = gens.length;
            r.drawText(`${cnt}驻`, cx, cy + 11, {
                color: isPlayer ? 'rgba(120,255,120,0.8)' : 'rgba(255,220,140,0.8)',
                size: 12, align: 'center'
            });

            ctx.restore();
        }
    }

    _drawBattleFlashes(r, ctx) {
        for (const flash of this._s._battleFlashes) {
            const city = this._s.gs.getCity(flash.cityId);
            if (!city) continue;
            const sp = this._s._cityScreenPos(city);
            const alpha = Math.min(1, flash.timer / 0.5);
            const pulse = 1 + Math.sin(flash.timer * 8) * 0.2;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(sp.x, sp.y - 20);
            ctx.scale(pulse, pulse);

            // Crossed swords
            ctx.strokeStyle = '#ff4422';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(10, 10);
            ctx.moveTo(10, -10);
            ctx.lineTo(-10, 10);
            ctx.stroke();

            // Center circle
            ctx.fillStyle = '#ff6644';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    _drawMarchTooltip(r, ctx) {
        const march = this._s.hoveredMarch;
        if (!march) return;
        const vpos = this._s._marchScreenPos(march);
        if (!vpos) return;
        // Convert virtual coords to screen coords
        const pos = { x: vpos.x - this._s._camX, y: vpos.y - this._s._camY };

        const faction = this._s.gs.getFaction(march.faction);
        const srcCity = this._s.gs.getCity(march.sourceCity);
        const tgtCity = this._s.gs.getCity(march.targetCity);
        const generals = march.generalIds.map(id => this._s.gs.getGeneral(id)).filter(Boolean);

        const tipW = 180;
        const tipH = 60 + generals.length * 18;
        let tipX = pos.x + 20;
        let tipY = pos.y - tipH / 2;
        // Keep tooltip on screen
        if (tipX + tipW > r.width - 10) tipX = pos.x - tipW - 20;
        if (tipY < 10) tipY = 10;
        if (tipY + tipH > r.height - 10) tipY = r.height - tipH - 10;

        r.roundRect(tipX, tipY, tipW, tipH, 4, 'rgba(20,10,5,0.95)', '#c8a850');

        const typeText = march.type === 'attack' ? '出征' : '调遣';
        const typeColor = march.type === 'attack' ? '#ff6644' : '#44aaff';
        r.drawText(`【${typeText}】${faction?.name || ''}`, tipX + tipW / 2, tipY + 12, {
            color: typeColor, size: 15, align: 'center', bold: true
        });

        r.drawText(`${srcCity?.name || '?'} → ${tgtCity?.name || '?'}`, tipX + tipW / 2, tipY + 28, {
            color: '#ddd', size: 14, align: 'center'
        });

        r.drawText(`预计 ${march.turnsRemaining} 回合后到达`, tipX + tipW / 2, tipY + 42, {
            color: '#aaa', size: 13, align: 'center'
        });

        for (let i = 0; i < generals.length; i++) {
            const gen = generals[i];
            r.drawText(`${gen.name}  武${gen.war} 兵${gen.soldiers}`, tipX + tipW / 2, tipY + 58 + i * 18, {
                color: '#ccc', size: 13, align: 'center'
            });
        }
    }

    _drawVictoryScreen(r, ctx) {
        const vs = this._s._victoryScreen;
        const elapsed = vs.elapsed;
        const W = r.width;
        const H = r.height;
        const cx = W / 2;
        const cy = H / 2;

        // ─── Phase 1 (0~3s): 黑幕淡入 ───
        const overlayAlpha = Math.min(1, elapsed / 1.5);
        ctx.globalAlpha = overlayAlpha;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;

        if (overlayAlpha < 0.3) return;

        // ─── 粒子礼花 ───
        for (const p of (vs.particles || [])) {
            const lifeRatio = p.life / p.maxLife;
            ctx.globalAlpha = Math.min(1, lifeRatio * 3) * overlayAlpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ─── 背景金光晕 ───
        if (elapsed > 0.5) {
            const glowAlpha = Math.min(0.35, (elapsed - 0.5) / 3) * overlayAlpha;
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.8);
            grd.addColorStop(0, `rgba(200,168,50,${glowAlpha})`);
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, W, H);
        }

        // ─── 主标题「天下归一」逐字出现 ───
        const titleChars = ['天', '下', '归', '一'];
        const titleStart = 0.8;
        const charDelay = 0.35;
        const titleY = cy - 60;
        titleChars.forEach((ch, i) => {
            const charTime = elapsed - titleStart - i * charDelay;
            if (charTime <= 0) return;
            const charAlpha = Math.min(1, charTime / 0.3);
            const offsetY = Math.max(0, (1 - charTime / 0.4)) * 30;
            ctx.globalAlpha = charAlpha * overlayAlpha;
            // 金色光晕
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20 + Math.sin(elapsed * 3 + i) * 8;
            const charX = cx - 90 + i * 60;
            ctx.font = 'bold 64px serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffe44c';
            ctx.fillText(ch, charX, titleY + offsetY);
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1;

        // ─── Phase 2 (3~8s): 势力名 + 统计卡片 ───
        const statsAlpha = Math.min(1, Math.max(0, (elapsed - 2.8) / 0.8));
        if (statsAlpha > 0) {
            const gs = this._s.gs;
            const faction = gs.getPlayerFaction();

            // 势力名
            ctx.globalAlpha = statsAlpha * overlayAlpha;
            ctx.shadowColor = faction ? faction.color : '#ffd700';
            ctx.shadowBlur = 15;
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = faction ? faction.color : '#ffd700';
            ctx.fillText(`${faction ? faction.name : ''}  一统天下`, cx, titleY + 52);
            ctx.shadowBlur = 0;

            // 统计卡片
            const stats = [
                { label: '统治城池', value: gs.getCitiesOf(gs.playerFaction).length },
                { label: '历经回合', value: gs.turn },
                { label: '麾下武将', value: gs.getGeneralsOf(gs.playerFaction).length },
                { label: '灭亡势力', value: gs.factions.filter(f => !f.alive && f.id !== gs.playerFaction).length },
            ];
            const cardW = 160, cardH = 80, gap = 20;
            const totalW = stats.length * cardW + (stats.length - 1) * gap;
            const startX = cx - totalW / 2;
            const cardY = cy + 20;

            stats.forEach((stat, i) => {
                const cardX = startX + i * (cardW + gap);
                const cardAlpha = Math.min(1, Math.max(0, (elapsed - 3.2 - i * 0.15) / 0.4));
                ctx.globalAlpha = cardAlpha * overlayAlpha;
                ctx.fillStyle = 'rgba(20,10,0,0.85)';
                ctx.strokeStyle = '#c8a850';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#c8a850';
                ctx.font = '13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(stat.label, cardX + cardW / 2, cardY + 24);

                ctx.fillStyle = '#ffe080';
                ctx.font = 'bold 32px sans-serif';
                ctx.fillText(stat.value, cardX + cardW / 2, cardY + 62);
            });

            // ─── Phase 3 (8s+): 提示文字闪烁 ───
            const hintAlpha = Math.min(1, Math.max(0, (elapsed - 7.5) / 1.0));
            if (hintAlpha > 0) {
                const blink = 0.6 + 0.4 * Math.sin(elapsed * 3);
                ctx.globalAlpha = hintAlpha * blink * overlayAlpha;
                ctx.fillStyle = '#aaa';
                ctx.font = '18px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('点击任意位置返回主菜单', cx, cy + 160);
            }
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
    }
}
