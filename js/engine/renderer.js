// 游戏引擎 - Canvas 渲染器
export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 1280;
        this.height = 800;

        // HiDPI / Retina 适配
        this.dpr = window.devicePixelRatio || 1;
        canvas.width = this.width * this.dpr;
        canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        // Stretch canvas to fill viewport; in portrait, rotate container -90° so game shows landscape
        const container = canvas.parentElement;
        const fitCanvas = () => {
            const W = window.innerWidth;
            const H = window.innerHeight;
            if (H > W) {
                // Portrait: container becomes landscape-sized and rotated -90° CCW
                container.style.left   = (W - H) / 2 + 'px';
                container.style.top    = (H - W) / 2 + 'px';
                container.style.right  = 'auto';
                container.style.bottom = 'auto';
                container.style.width  = H + 'px';
                container.style.height = W + 'px';
                container.style.transform = 'rotate(-90deg)';
                canvas.style.width  = H + 'px';
                canvas.style.height = W + 'px';
            } else {
                container.style.left   = '0';
                container.style.top    = '0';
                container.style.right  = '0';
                container.style.bottom = '0';
                container.style.width  = '';
                container.style.height = '';
                container.style.transform = '';
                canvas.style.width  = W + 'px';
                canvas.style.height = H + 'px';
            }
        };
        fitCanvas();
        window.addEventListener('resize', fitCanvas);
        window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 100));

        // Camera for world map
        this.camera = { x: 0, y: 0, zoom: 1 };

        // Portrait image cache
        this.portraitImages = {};
        this.portraitLoading = new Set();
        this.portraitFailed = new Set();
    }

    // Lazy-load a portrait image, return Image if ready, null otherwise
    getPortraitImage(generalId) {
        if (!generalId) return null;
        if (this.portraitImages[generalId]) return this.portraitImages[generalId];
        if (this.portraitLoading.has(generalId) || this.portraitFailed.has(generalId)) return null;

        this.portraitLoading.add(generalId);
        const img = new Image();
        img.src = `assets/portraits/${generalId}.png`;
        img.onload = () => {
            this.portraitLoading.delete(generalId);
            this.portraitImages[generalId] = img;
        };
        img.onerror = () => {
            this.portraitLoading.delete(generalId);
            this.portraitFailed.add(generalId);
        };
        return null;
    }

    // Preload all portraits at once
    preloadAllPortraits(generalIds) {
        for (const id of generalIds) {
            this.getPortraitImage(id);
        }
    }

    clear(color = '#1a1a2e') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // Camera transforms
    pushCamera() {
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
    }

    popCamera() {
        this.ctx.restore();
    }

    screenToWorld(sx, sy) {
        return {
            x: (sx - this.width / 2) / this.camera.zoom + this.camera.x,
            y: (sy - this.height / 2) / this.camera.zoom + this.camera.y
        };
    }

    worldToScreen(wx, wy) {
        return {
            x: (wx - this.camera.x) * this.camera.zoom + this.width / 2,
            y: (wy - this.camera.y) * this.camera.zoom + this.height / 2
        };
    }

    // Drawing primitives
    fillRect(x, y, w, h, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, w, h);
    }

    strokeRect(x, y, w, h, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeRect(x, y, w, h);
    }

    fillCircle(x, y, r, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.fill();
    }

    strokeCircle(x, y, r, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawLine(x1, y1, x2, y2, color, lineWidth = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    drawText(text, x, y, { color = '#fff', size = 17, align = 'left', baseline = 'top', bold = false, shadow = false, maxWidth } = {}) {
        this.ctx.font = `${bold ? 'bold ' : ''}${size}px SimHei, Microsoft YaHei, sans-serif`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        if (shadow) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillText(text, x + 1, y + 1, maxWidth);
        }
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y, maxWidth);
    }

    measureText(text, size = 17, bold = false) {
        this.ctx.font = `${bold ? 'bold ' : ''}${size}px SimHei, Microsoft YaHei, sans-serif`;
        return this.ctx.measureText(text);
    }

    // Draw a bar (HP/MP style)
    drawBar(x, y, w, h, ratio, fgColor, bgColor = '#1a0e04', borderColor = '#554420') {
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.fillStyle = fgColor;
        this.ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, w, h);
    }

    // Draw rounded rect
    roundRect(x, y, w, h, r, fillColor, strokeColor) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }

    // Draw pixel art portrait - 精细版
    drawPortrait(x, y, size, portraitData, generalName, generalId = null) {
        // Try to use pre-generated image first
        if (generalId) {
            const img = this.getPortraitImage(generalId);
            if (img) {
                const ctx = this.ctx;
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, x, y, size, size);
                this._drawPortraitFrame(x, y, size);
                ctx.restore();
                return;
            }
        }

        // Fallback to procedural rendering
        const s = size / 32; // Scale factor (base is 32x32)
        const ctx = this.ctx;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // 背景渐变 - 从深色到更深色
        const bgGrad = ctx.createLinearGradient(x, y, x, y + size);
        bgGrad.addColorStop(0, '#3a2a1a');
        bgGrad.addColorStop(1, '#1a0e04');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(x, y, size, size);

        // 肤色系统
        const skinColor = '#f0c890';
        const skinLight = '#f8d8a0';
        const skinDark = '#d0a870';
        const skinShadow = '#b89060';

        // 脸部形状 - 根据face类型调整
        const faceType = portraitData?.face || 'normal';
        let faceW = 16, faceH = 18, faceX = 8;
        if (faceType === 'square') { faceW = 17; faceH = 19; faceX = 7; }
        else if (faceType === 'long') { faceW = 15; faceH = 20; faceX = 8; }
        else if (faceType === 'round') { faceW = 18; faceH = 17; faceX = 7; }

        // 脸部底色
        ctx.fillStyle = skinColor;
        ctx.fillRect(x + faceX * s, y + 7 * s, faceW * s, faceH * s);

        // 脸部高光（左侧）
        ctx.fillStyle = skinLight;
        ctx.fillRect(x + faceX * s, y + 9 * s, 3 * s, 8 * s);

        // 脸部阴影（右侧和下方）
        ctx.fillStyle = skinShadow;
        ctx.fillRect(x + (faceX + faceW - 2) * s, y + 10 * s, 2 * s, 10 * s);
        ctx.fillRect(x + (faceX + 2) * s, y + (7 + faceH - 2) * s, (faceW - 4) * s, 2 * s);

        // 眉毛 - 更有表现力
        ctx.fillStyle = '#2a2a2a';
        if (portraitData?.face === 'square') {
            // 粗眉 - 威武型
            ctx.fillRect(x + 10 * s, y + 11 * s, 5 * s, 2 * s);
            ctx.fillRect(x + 17 * s, y + 11 * s, 5 * s, 2 * s);
        } else {
            ctx.fillRect(x + 10 * s, y + 12 * s, 5 * s, 1 * s);
            ctx.fillRect(x + 17 * s, y + 12 * s, 5 * s, 1 * s);
        }

        // 眼睛 - 更有神韵
        // 眼白
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 10 * s, y + 14 * s, 5 * s, 3 * s);
        ctx.fillRect(x + 17 * s, y + 14 * s, 5 * s, 3 * s);
        // 眼珠
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 11 * s, y + 14 * s, 3 * s, 3 * s);
        ctx.fillRect(x + 18 * s, y + 14 * s, 3 * s, 3 * s);
        // 瞳孔高光
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + 12 * s, y + 14 * s, 1 * s, 1 * s);
        ctx.fillRect(x + 19 * s, y + 14 * s, 1 * s, 1 * s);
        // 眼睛下眼线
        ctx.fillStyle = skinDark;
        ctx.fillRect(x + 10 * s, y + 17 * s, 5 * s, 1 * s);
        ctx.fillRect(x + 17 * s, y + 17 * s, 5 * s, 1 * s);

        // 鼻子 - 带阴影
        ctx.fillStyle = skinDark;
        ctx.fillRect(x + 15 * s, y + 17 * s, 2 * s, 3 * s);
        ctx.fillStyle = skinLight;
        ctx.fillRect(x + 15 * s, y + 17 * s, 1 * s, 2 * s);

        // 嘴巴
        ctx.fillStyle = '#c06060';
        ctx.fillRect(x + 13 * s, y + 21 * s, 6 * s, 1 * s);
        // 嘴唇高光
        ctx.fillStyle = '#d07070';
        ctx.fillRect(x + 14 * s, y + 21 * s, 2 * s, 1 * s);

        if (portraitData) {
            const armorColor = portraitData.color || '#888';

            // 发型 - 更精细
            ctx.fillStyle = '#1a1a1a';
            const hairDark = '#0a0a0a';
            const hairHighlight = '#333';
            switch (portraitData.hair) {
                case 'long':
                    // 长发 - 飘逸型
                    ctx.fillRect(x + 6 * s, y + 3 * s, 20 * s, 8 * s);
                    ctx.fillRect(x + 5 * s, y + 8 * s, 4 * s, 16 * s);
                    ctx.fillRect(x + 23 * s, y + 8 * s, 4 * s, 16 * s);
                    // 发丝高光
                    ctx.fillStyle = hairHighlight;
                    ctx.fillRect(x + 10 * s, y + 4 * s, 2 * s, 3 * s);
                    ctx.fillRect(x + 18 * s, y + 4 * s, 2 * s, 3 * s);
                    // 发际线
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(x + 8 * s, y + 7 * s, 16 * s, 2 * s);
                    break;
                case 'bun':
                    // 束发 - 文官型
                    ctx.fillRect(x + 8 * s, y + 2 * s, 16 * s, 3 * s);
                    // 发髻
                    ctx.fillRect(x + 12 * s, y + 0, 8 * s, 3 * s);
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(x + 13 * s, y + 1 * s, 6 * s, 1 * s); // 发簪
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(x + 7 * s, y + 4 * s, 18 * s, 5 * s);
                    // 高光
                    ctx.fillStyle = hairHighlight;
                    ctx.fillRect(x + 13 * s, y + 3 * s, 3 * s, 2 * s);
                    break;
                case 'wild':
                    // 怒发 - 猛将型
                    ctx.fillRect(x + 4 * s, y + 1 * s, 24 * s, 10 * s);
                    ctx.fillRect(x + 3 * s, y + 5 * s, 3 * s, 10 * s);
                    ctx.fillRect(x + 26 * s, y + 5 * s, 3 * s, 10 * s);
                    ctx.fillRect(x + 5 * s, y + 10 * s, 3 * s, 12 * s);
                    ctx.fillRect(x + 24 * s, y + 10 * s, 3 * s, 12 * s);
                    // 蓬乱的发丝
                    ctx.fillStyle = hairHighlight;
                    ctx.fillRect(x + 8 * s, y + 2 * s, 2 * s, 4 * s);
                    ctx.fillRect(x + 14 * s, y + 1 * s, 2 * s, 3 * s);
                    ctx.fillRect(x + 22 * s, y + 2 * s, 2 * s, 4 * s);
                    break;
                case 'bald':
                    // 光头 - 仅头顶阴影
                    ctx.fillStyle = skinDark;
                    ctx.fillRect(x + 8 * s, y + 5 * s, 16 * s, 2 * s);
                    ctx.fillStyle = skinLight;
                    ctx.fillRect(x + 10 * s, y + 7 * s, 6 * s, 2 * s);
                    break;
                case 'crown':
                    // 冠冕 - 君主型
                    ctx.fillRect(x + 7 * s, y + 4 * s, 18 * s, 6 * s);
                    // 冠
                    ctx.fillStyle = '#c8a850';
                    ctx.fillRect(x + 9 * s, y + 1 * s, 14 * s, 4 * s);
                    ctx.fillStyle = '#ffe080';
                    ctx.fillRect(x + 11 * s, y + 2 * s, 2 * s, 2 * s);
                    ctx.fillRect(x + 15 * s, y + 1 * s, 2 * s, 3 * s);
                    ctx.fillRect(x + 19 * s, y + 2 * s, 2 * s, 2 * s);
                    // 珠饰
                    ctx.fillStyle = '#ff4444';
                    ctx.fillRect(x + 15 * s, y + 0, 2 * s, 1 * s);
                    break;
                default: // short
                    ctx.fillRect(x + 7 * s, y + 3 * s, 18 * s, 7 * s);
                    ctx.fillStyle = hairHighlight;
                    ctx.fillRect(x + 12 * s, y + 4 * s, 3 * s, 2 * s);
                    break;
            }

            // 盔甲 - 更精致
            const darkerArmor = this._darkenColor(armorColor, 40);
            const lighterArmor = this._lightenColor(armorColor, 30);

            // 肩甲
            ctx.fillStyle = armorColor;
            ctx.fillRect(x + 3 * s, y + 25 * s, 26 * s, 7 * s);
            // 肩甲高光
            ctx.fillStyle = lighterArmor;
            ctx.fillRect(x + 4 * s, y + 25 * s, 8 * s, 2 * s);
            ctx.fillRect(x + 20 * s, y + 25 * s, 8 * s, 2 * s);
            // 甲胄中线装饰
            ctx.fillStyle = darkerArmor;
            ctx.fillRect(x + 14 * s, y + 25 * s, 4 * s, 7 * s);
            // 衣领
            ctx.fillStyle = '#f0c890';
            ctx.fillRect(x + 12 * s, y + 24 * s, 8 * s, 2 * s);
            // 盔甲边缘金线
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 3 * s, y + 25 * s, 26 * s, 1 * s);

            // 胡须
            if (portraitData.face === 'square') {
                // 络腮胡
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(x + 9 * s, y + 20 * s, 3 * s, 5 * s);
                ctx.fillRect(x + 20 * s, y + 20 * s, 3 * s, 5 * s);
                ctx.fillRect(x + 11 * s, y + 22 * s, 10 * s, 3 * s);
            } else if (portraitData.face === 'long') {
                // 长须
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(x + 12 * s, y + 22 * s, 2 * s, 5 * s);
                ctx.fillRect(x + 18 * s, y + 22 * s, 2 * s, 5 * s);
                ctx.fillRect(x + 14 * s, y + 23 * s, 4 * s, 3 * s);
            }
        } else {
            // 默认铠甲
            ctx.fillStyle = '#666';
            ctx.fillRect(x + 3 * s, y + 25 * s, 26 * s, 7 * s);
            ctx.fillStyle = '#555';
            ctx.fillRect(x + 14 * s, y + 25 * s, 4 * s, 7 * s);
            // 默认发型
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x + 7 * s, y + 3 * s, 18 * s, 7 * s);
        }

        // 边框
        this._drawPortraitFrame(x, y, size);

        ctx.restore();
    }

    // Draw ornate gold frame around portrait
    _drawPortraitFrame(x, y, size) {
        const ctx = this.ctx;
        const s = size / 32;

        // 双层金边
        ctx.strokeStyle = '#a08030';
        ctx.lineWidth = Math.max(1, 2 * s);
        ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
        ctx.strokeStyle = '#c8a850';
        ctx.lineWidth = Math.max(1, 1 * s);
        ctx.strokeRect(x, y, size, size);

        // 角落装饰
        const cs = 3 * s;
        ctx.fillStyle = '#ffe080';
        ctx.fillRect(x, y, cs, 1 * s);
        ctx.fillRect(x, y, 1 * s, cs);
        ctx.fillRect(x + size - cs, y, cs, 1 * s);
        ctx.fillRect(x + size - 1 * s, y, 1 * s, cs);
        ctx.fillRect(x, y + size - 1 * s, cs, 1 * s);
        ctx.fillRect(x, y + size - cs, 1 * s, cs);
        ctx.fillRect(x + size - cs, y + size - 1 * s, cs, 1 * s);
        ctx.fillRect(x + size - 1 * s, y + size - cs, 1 * s, cs);
    }

    _darkenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - amount);
        const g = Math.max(0, ((num >> 8) & 0xff) - amount);
        const b = Math.max(0, (num & 0xff) - amount);
        return `rgb(${r},${g},${b})`;
    }

    _lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);
        return `rgb(${r},${g},${b})`;
    }

    // Draw sprite (pixel art character for battle) - 精细版
    drawSprite(x, y, type, color, facing = 1, frame = 0, state = 'advance') {
        const ctx = this.ctx;
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        const s = 1.6; // pixel scale
        // Snap to integer pixels for crisp rendering
        x = Math.round(x);
        y = Math.round(y);
        const bob = Math.sin(frame * 0.15) * 0.4 * s;

        if (facing === -1) {
            ctx.translate(x + 16 * s, y);
            ctx.scale(-1, 1);
            x = 0;
            y = 0;
        }

        const dk = this._darkenColor(color, 35);
        const lt = this._lightenColor(color, 25);
        const dk2 = this._darkenColor(color, 55);
        const skinBase = '#e8be88';
        const skinShadow = '#c89a68';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 8 * s, y + 18 * s, 7 * s, 2.5 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        // ──── CAVALRY: horse + mounted rider ────
        if (type === 'cavalry') {
            const phase = (Math.floor(frame * 0.05) % 4);
            const horseBody = '#7a4a2a';
            const horseDk = '#5a3218';
            const horseLt = '#9a6a3a';

            // Horse body
            ctx.fillStyle = horseBody;
            ctx.fillRect(x - 3 * s, y + 10 * s, 22 * s, 7 * s);
            // Horse chest (broader front)
            ctx.fillRect(x - 5 * s, y + 10 * s, 5 * s, 6 * s);
            // Horse rump
            ctx.fillStyle = horseDk;
            ctx.fillRect(x + 14 * s, y + 10 * s, 5 * s, 6 * s);
            // Horse belly highlight
            ctx.fillStyle = horseLt;
            ctx.fillRect(x + 2 * s, y + 14 * s, 12 * s, 2 * s);

            // Horse armor plates (faction colored)
            ctx.fillStyle = dk;
            ctx.fillRect(x - 2 * s, y + 10 * s, 10 * s, 3 * s);
            ctx.fillStyle = color;
            ctx.fillRect(x - 1 * s, y + 10.5 * s, 8 * s, 2 * s);
            // Side armor trim
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x - 1 * s, y + 10 * s, 8 * s, 0.5 * s);
            ctx.fillRect(x - 1 * s, y + 12.5 * s, 8 * s, 0.5 * s);

            // Horse head
            ctx.fillStyle = horseBody;
            ctx.fillRect(x - 7 * s, y + 8 * s, 5 * s, 6 * s);
            ctx.fillRect(x - 9 * s, y + 9 * s, 3 * s, 4 * s);
            // Horse face plate (armor)
            ctx.fillStyle = dk;
            ctx.fillRect(x - 8 * s, y + 9 * s, 4 * s, 2.5 * s);
            // Horse eye
            ctx.fillStyle = '#111';
            ctx.fillRect(x - 6 * s, y + 10 * s, 1 * s, 1 * s);
            // Horse nostril
            ctx.fillStyle = '#3a2010';
            ctx.fillRect(x - 9 * s, y + 12 * s, 1 * s, 1 * s);

            // Mane
            ctx.fillStyle = '#1a1208';
            ctx.fillRect(x - 3 * s, y + 8 * s, 6 * s, 2 * s);
            ctx.fillRect(x - 4 * s, y + 7 * s, 3 * s, 2 * s);

            // Horse legs - 4-phase gallop
            const legOff = [
                [1, -1.5, -1, 1.5], [2.5, 0, -2.5, 0], [-1, 1.5, 1, -1.5], [0, -2.5, 0, 2.5]
            ][phase].map(v => v * s);
            ctx.fillStyle = horseDk;
            // Front legs
            ctx.fillRect(x - 2 * s, y + 16 * s + legOff[0], 2 * s, 5 * s);
            ctx.fillRect(x + 2 * s, y + 16 * s + legOff[1], 2 * s, 5 * s);
            // Rear legs
            ctx.fillRect(x + 12 * s, y + 16 * s + legOff[2], 2 * s, 5 * s);
            ctx.fillRect(x + 16 * s, y + 16 * s + legOff[3], 2 * s, 5 * s);
            // Hooves
            ctx.fillStyle = '#222';
            ctx.fillRect(x - 2 * s, y + 20.5 * s + legOff[0], 2.5 * s, 1 * s);
            ctx.fillRect(x + 2 * s, y + 20.5 * s + legOff[1], 2.5 * s, 1 * s);
            ctx.fillRect(x + 12 * s, y + 20.5 * s + legOff[2], 2.5 * s, 1 * s);
            ctx.fillRect(x + 16 * s, y + 20.5 * s + legOff[3], 2.5 * s, 1 * s);

            // Horse tail
            const tailWave = Math.sin(frame * 0.12) * 1.5 * s;
            ctx.fillStyle = '#1a1208';
            ctx.fillRect(x + 18 * s, y + 11 * s + tailWave, 2 * s, 5 * s);

            // ── Rider on horse ──
            // Rider body (armor)
            ctx.fillStyle = color;
            ctx.fillRect(x + 2 * s, y + 1 * s + bob, 8 * s, 9 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(x + 2 * s, y + 1 * s + bob, 3 * s, 5 * s);
            ctx.fillStyle = dk;
            ctx.fillRect(x + 7 * s, y + 1 * s + bob, 3 * s, 9 * s);
            // Shoulder pads
            ctx.fillStyle = dk;
            ctx.fillRect(x + 1 * s, y + 1 * s + bob, 2 * s, 3 * s);
            ctx.fillRect(x + 9 * s, y + 1 * s + bob, 2 * s, 3 * s);
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 1 * s, y + 1 * s + bob, 10 * s, 0.5 * s);

            // Rider head
            ctx.fillStyle = skinBase;
            ctx.fillRect(x + 4 * s, y - 5 * s + bob, 5 * s, 5 * s);
            ctx.fillStyle = skinShadow;
            ctx.fillRect(x + 7 * s, y - 3 * s + bob, 2 * s, 3 * s);
            // Helmet
            ctx.fillStyle = dk;
            ctx.fillRect(x + 3 * s, y - 7 * s + bob, 7 * s, 3 * s);
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 5 * s, y - 8 * s + bob, 3 * s, 2 * s);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 5 * s, y - 3 * s + bob, 1 * s, 1 * s);
            ctx.fillRect(x + 7 * s, y - 3 * s + bob, 1 * s, 1 * s);

            // Spear
            ctx.fillStyle = '#8a7050';
            ctx.fillRect(x + 10 * s, y - 10 * s + bob, 1 * s, 20 * s);
            ctx.fillStyle = '#ccc';
            ctx.fillRect(x + 9.5 * s, y - 13 * s + bob, 2 * s, 4 * s);
            ctx.fillStyle = '#eee';
            ctx.fillRect(x + 10 * s, y - 14 * s + bob, 1 * s, 2 * s);
            // Pennant
            const penWave = Math.sin(frame * 0.1) * 1.5;
            ctx.fillStyle = color;
            ctx.fillRect(x + 11 * s, y - 11 * s + bob, 4 * s + penWave, 2 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(x + 11 * s, y - 11 * s + bob, 4 * s + penWave, 0.8 * s);

        // ──── ARCHER: light armor + bow ────
        } else if (type === 'archer') {
            // Head
            ctx.fillStyle = skinBase;
            ctx.fillRect(x + 5 * s, y + 0.5 * s + bob, 6 * s, 5 * s);
            ctx.fillStyle = skinShadow;
            ctx.fillRect(x + 9 * s, y + 2 * s + bob, 2 * s, 3 * s);
            // Headband
            ctx.fillStyle = color;
            ctx.fillRect(x + 4 * s, y + 0 * s + bob, 8 * s, 1.5 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(x + 10 * s, y + 0.5 * s + bob, 3 * s, 3 * s); // trailing band
            // Hair
            ctx.fillStyle = '#1a1208';
            ctx.fillRect(x + 5 * s, y - 1 * s + bob, 6 * s, 2 * s);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 6 * s, y + 2.5 * s + bob, 1 * s, 1 * s);
            ctx.fillRect(x + 9 * s, y + 2.5 * s + bob, 1 * s, 1 * s);

            // Light leather armor body
            ctx.fillStyle = '#6a5030';
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 8 * s, 9 * s);
            ctx.fillStyle = '#7a6040';
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 4 * s, 5 * s);
            ctx.fillStyle = '#5a4020';
            ctx.fillRect(x + 8 * s, y + 5 * s + bob, 4 * s, 9 * s);
            // Cross straps
            ctx.fillStyle = '#8a6a40';
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 1.5 * s, 9 * s);
            ctx.fillRect(x + 7 * s, y + 5 * s + bob, 1 * s, 9 * s);
            // Faction color trim
            ctx.fillStyle = color;
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 8 * s, 1 * s);

            // Belt
            ctx.fillStyle = '#5a4020';
            ctx.fillRect(x + 4 * s, y + 13.5 * s + bob, 8 * s, 1 * s);

            // Legs
            const legMove = Math.sin(frame * 0.15) * 2 * s;
            ctx.fillStyle = '#5a4a30';
            ctx.fillRect(x + 4 * s, y + 14.5 * s + legMove, 3 * s, 4 * s);
            ctx.fillRect(x + 9 * s, y + 14.5 * s - legMove, 3 * s, 4 * s);
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(x + 4 * s, y + 17.5 * s + legMove, 3.5 * s, 1.5 * s);
            ctx.fillRect(x + 9 * s, y + 17.5 * s - legMove, 3.5 * s, 1.5 * s);

            // Arm
            ctx.fillStyle = '#6a5030';
            const armSw = Math.sin(frame * 0.15) * 0.8 * s;
            ctx.fillRect(x + 2 * s, y + 6 * s + bob + armSw, 2 * s, 6 * s);

            // Bow
            ctx.strokeStyle = '#6a3a18';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(x + 14 * s, y + 8 * s + bob, 5.5 * s, -0.9, 0.9);
            ctx.stroke();
            // Bowstring
            ctx.strokeStyle = '#bbb';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + 14 * s + Math.cos(-0.9) * 5.5 * s, y + 8 * s + bob + Math.sin(-0.9) * 5.5 * s);
            ctx.lineTo(x + 14 * s + Math.cos(0.9) * 5.5 * s, y + 8 * s + bob + Math.sin(0.9) * 5.5 * s);
            ctx.stroke();
            // Arrow
            ctx.fillStyle = '#ccc';
            ctx.fillRect(x + 10 * s, y + 7.5 * s + bob, 9 * s, 0.8 * s);
            ctx.fillStyle = '#aaa';
            ctx.fillRect(x + 19 * s, y + 6.8 * s + bob, 1 * s, 2.4 * s);

            // Quiver on back
            ctx.fillStyle = '#5a3a18';
            ctx.fillRect(x + 1 * s, y + 3 * s + bob, 2.5 * s, 8 * s);
            ctx.fillStyle = '#ccc';
            for (let a = 0; a < 3; a++) {
                ctx.fillRect(x + 1.5 * s + a * 0.7 * s, y + 1 * s + bob, 0.4 * s, 3 * s);
            }

            // Attack flash
            if (state === 'fight') {
                ctx.fillStyle = 'rgba(255,255,200,0.25)';
                ctx.fillRect(x + 12 * s, y + 4 * s + bob, 6 * s, 4 * s);
            }

        // ──── SPEAR: heavy armor + long spear + shield ────
        } else if (type === 'spear') {
            // Head
            ctx.fillStyle = skinBase;
            ctx.fillRect(x + 5 * s, y + 0.5 * s + bob, 6 * s, 5 * s);
            ctx.fillStyle = skinShadow;
            ctx.fillRect(x + 5 * s, y + 3.5 * s + bob, 6 * s, 2 * s);
            // Full helm with cheek guards
            ctx.fillStyle = '#555';
            ctx.fillRect(x + 4 * s, y - 2 * s + bob, 8 * s, 4 * s);
            ctx.fillStyle = '#666';
            ctx.fillRect(x + 5 * s, y - 3 * s + bob, 6 * s, 2 * s);
            ctx.fillStyle = '#777';
            ctx.fillRect(x + 7 * s, y - 3.5 * s + bob, 2 * s, 2 * s); // crest
            // Cheek guards
            ctx.fillStyle = '#555';
            ctx.fillRect(x + 4 * s, y + 2 * s + bob, 1.5 * s, 3 * s);
            ctx.fillRect(x + 10.5 * s, y + 2 * s + bob, 1.5 * s, 3 * s);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 6 * s, y + 2 * s + bob, 1 * s, 1 * s);
            ctx.fillRect(x + 9 * s, y + 2 * s + bob, 1 * s, 1 * s);

            // Heavy armor body
            ctx.fillStyle = color;
            ctx.fillRect(x + 3 * s, y + 5 * s + bob, 10 * s, 9 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(x + 3 * s, y + 5 * s + bob, 4 * s, 5 * s);
            ctx.fillStyle = dk;
            ctx.fillRect(x + 9 * s, y + 5 * s + bob, 4 * s, 9 * s);
            // Scale armor pattern
            ctx.fillStyle = dk2;
            for (let row = 0; row < 4; row++) {
                ctx.fillRect(x + 4 * s, y + (6 + row * 2.2) * s + bob, 8 * s, 0.5 * s);
            }
            // Shoulder plates
            ctx.fillStyle = dk;
            ctx.fillRect(x + 1 * s, y + 4.5 * s + bob, 3 * s, 3 * s);
            ctx.fillRect(x + 12 * s, y + 4.5 * s + bob, 3 * s, 3 * s);
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 1 * s, y + 4.5 * s + bob, 14 * s, 0.5 * s);

            // Belt
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 3 * s, y + 13.5 * s + bob, 10 * s, 1 * s);

            // Legs
            const legSp = Math.sin(frame * 0.15) * 1.5 * s;
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(x + 4 * s, y + 14.5 * s + legSp, 3 * s, 4 * s);
            ctx.fillRect(x + 9 * s, y + 14.5 * s - legSp, 3 * s, 4 * s);
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(x + 3.5 * s, y + 17.5 * s + legSp, 4 * s, 1.5 * s);
            ctx.fillRect(x + 8.5 * s, y + 17.5 * s - legSp, 4 * s, 1.5 * s);

            // Shield (faction colored, ornate)
            ctx.fillStyle = dk;
            ctx.fillRect(x + 0 * s, y + 4 * s + bob, 4 * s, 8 * s);
            ctx.fillStyle = color;
            ctx.fillRect(x + 0.5 * s, y + 4.5 * s + bob, 3 * s, 7 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(x + 1 * s, y + 6 * s + bob, 2 * s, 2 * s); // emblem
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 0 * s, y + 4 * s + bob, 4 * s, 0.5 * s);
            ctx.fillRect(x + 0 * s, y + 11.5 * s + bob, 4 * s, 0.5 * s);

            // Long spear
            ctx.fillStyle = '#7a5a30';
            ctx.fillRect(x + 12 * s, y - 10 * s + bob, 1 * s, 26 * s);
            // Spearhead
            ctx.fillStyle = '#ccc';
            ctx.fillRect(x + 11 * s, y - 13 * s + bob, 3 * s, 4 * s);
            ctx.fillStyle = '#eee';
            ctx.fillRect(x + 11.5 * s, y - 14 * s + bob, 2 * s, 2 * s);
            // Tassel
            ctx.fillStyle = color;
            ctx.fillRect(x + 11 * s, y - 10 * s + bob, 3 * s, 1.5 * s);

            // Attack flash
            if (state === 'fight') {
                ctx.fillStyle = 'rgba(255,255,200,0.25)';
                ctx.fillRect(x + 10 * s, y + 2 * s + bob, 5 * s, 5 * s);
            }

        // ──── INFANTRY: medium armor + sword ────
        } else {
            // Head
            ctx.fillStyle = skinBase;
            ctx.fillRect(x + 5 * s, y + 0.5 * s + bob, 6 * s, 5 * s);
            ctx.fillStyle = skinShadow;
            ctx.fillRect(x + 5 * s, y + 3.5 * s + bob, 6 * s, 2 * s);
            // Flat helmet
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(x + 4 * s, y - 1 * s + bob, 8 * s, 2.5 * s);
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(x + 5 * s, y - 2 * s + bob, 6 * s, 2 * s);
            // Helmet rim
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(x + 3.5 * s, y + 1 * s + bob, 9 * s, 0.8 * s);
            // Hair
            ctx.fillStyle = '#1a1208';
            ctx.fillRect(x + 5 * s, y - 0.5 * s + bob, 6 * s, 1 * s);
            // Eyes
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 6 * s, y + 2.5 * s + bob, 1 * s, 1 * s);
            ctx.fillRect(x + 9 * s, y + 2.5 * s + bob, 1 * s, 1 * s);

            // Medium armor body
            ctx.fillStyle = color;
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 8 * s, 9 * s);
            ctx.fillStyle = lt;
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 3 * s, 5 * s);
            ctx.fillStyle = dk;
            ctx.fillRect(x + 9 * s, y + 5 * s + bob, 3 * s, 9 * s);
            // Chest plate detail
            ctx.fillStyle = dk;
            ctx.fillRect(x + 5 * s, y + 7 * s + bob, 6 * s, 0.5 * s);
            ctx.fillRect(x + 5 * s, y + 10 * s + bob, 6 * s, 0.5 * s);
            // Faction trim
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 4 * s, y + 5 * s + bob, 8 * s, 0.5 * s);

            // Belt
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 4 * s, y + 13.5 * s + bob, 8 * s, 1 * s);

            // Legs
            const legInf = Math.sin(frame * 0.15) * 2 * s;
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(x + 4 * s, y + 14.5 * s + legInf, 3 * s, 4 * s);
            ctx.fillRect(x + 9 * s, y + 14.5 * s - legInf, 3 * s, 4 * s);
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(x + 3.5 * s, y + 17.5 * s + legInf, 4 * s, 1.5 * s);
            ctx.fillRect(x + 8.5 * s, y + 17.5 * s - legInf, 4 * s, 1.5 * s);

            // Arm swing
            const armInf = Math.sin(frame * 0.15) * 1 * s;
            ctx.fillStyle = color;
            ctx.fillRect(x + 2 * s, y + 6 * s + bob + armInf, 2 * s, 6 * s);

            // Sword
            ctx.fillStyle = '#bbb';
            ctx.fillRect(x + 12 * s, y + 2 * s + bob, 1.5 * s, 10 * s);
            ctx.fillStyle = '#ddd';
            ctx.fillRect(x + 13 * s, y + 2 * s + bob, 0.5 * s, 10 * s); // highlight edge
            // Guard
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(x + 11 * s, y + 11.5 * s + bob, 4 * s, 1.5 * s);
            // Pommel
            ctx.fillStyle = '#c8a850';
            ctx.fillRect(x + 12 * s, y + 13 * s + bob, 1.5 * s, 1 * s);

            // Attack flash
            if (state === 'fight') {
                ctx.fillStyle = 'rgba(255,255,200,0.25)';
                ctx.fillRect(x + 12 * s, y + 2 * s + bob, 4 * s, 5 * s);
            }
        }

        ctx.restore();
    }

    // Draw a button on canvas
    drawButton(x, y, w, h, text, isHovered = false, fontSize = 21, disabled = false) {
        const ctx = this.ctx;
        if (disabled) {
            this.roundRect(x, y, w, h, 3, 'rgba(40,40,40,0.6)', '#555');
            this.drawText(text, x + w / 2, y + h / 2, {
                color: '#666', size: fontSize, align: 'center', baseline: 'middle'
            });
            return;
        }
        const bgTop = isHovered ? '#7a5a20' : '#5a3a10';
        const bgBot = isHovered ? '#5a3a10' : '#3a2208';

        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, bgTop);
        grad.addColorStop(1, bgBot);

        this.roundRect(x, y, w, h, 3, null, null);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#ffe080' : '#c8a850';
        ctx.lineWidth = 1;
        ctx.stroke();

        this.drawText(text, x + w / 2, y + h / 2, {
            color: '#ffe080', size: fontSize, align: 'center', baseline: 'middle', shadow: true
        });
    }

    // Check if point is inside rect
    static pointInRect(px, py, x, y, w, h) {
        return px >= x && px <= x + w && py >= y && py <= y + h;
    }
}
