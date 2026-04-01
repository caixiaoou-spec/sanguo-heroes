#!/usr/bin/env node
/**
 * 批量生成将领像素画头像 PNG (128x128)
 * 风格与 renderer.js 的 drawPortrait 完全一致
 * 运行: node generate_portraits.js
 * 依赖: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// ── 从 generals.js 提取将领数据（手动 parse，避免 ESM 问题）──────────────────
const generalsRaw = fs.readFileSync(
    path.join(__dirname, 'js/data/generals.js'), 'utf8'
);

// 提取 generals 数组内容（匹配 `const generals = [` 或 `const GENERALS_DATA = [`）
const match = generalsRaw.match(/const\s+\w+\s*=\s*(\[[\s\S]*\]);\s*(?:export|$)/);
if (!match) {
    console.error('无法解析将领数组，请检查 generals.js 格式');
    process.exit(1);
}

let generals;
try {
    // 去掉注释后 eval（仅本地脚本使用，安全）
    const cleaned = match[1]
        .replace(/\/\/[^\n]*/g, '')   // 单行注释
        .replace(/\/\*[\s\S]*?\*\//g, ''); // 多行注释
    generals = eval(cleaned);
} catch (e) {
    console.error('eval 失败:', e.message);
    process.exit(1);
}

// ── 目标目录 ─────────────────────────────────────────────────────────────────
const portraitsDir = path.join(__dirname, 'assets/portraits');
if (!fs.existsSync(portraitsDir)) fs.mkdirSync(portraitsDir, { recursive: true });

// ── 辅助函数（复制自 renderer.js）────────────────────────────────────────────
function darkenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
}

function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
}

function drawPortrait(ctx, x, y, size, portraitData) {
    const s = size / 32;

    // 背景渐变
    const bgGrad = ctx.createLinearGradient(x, y, x, y + size);
    bgGrad.addColorStop(0, '#3a2a1a');
    bgGrad.addColorStop(1, '#1a0e04');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(x, y, size, size);

    // 肤色
    const skinColor  = '#f0c890';
    const skinLight  = '#f8d8a0';
    const skinDark   = '#d0a870';
    const skinShadow = '#b89060';

    // 脸型
    const faceType = portraitData?.face || 'normal';
    let faceW = 16, faceH = 18, faceX = 8;
    if (faceType === 'square') { faceW = 17; faceH = 19; faceX = 7; }
    else if (faceType === 'long')  { faceW = 15; faceH = 20; faceX = 8; }
    else if (faceType === 'round') { faceW = 18; faceH = 17; faceX = 7; }

    ctx.fillStyle = skinColor;
    ctx.fillRect(x + faceX * s, y + 7 * s, faceW * s, faceH * s);
    ctx.fillStyle = skinLight;
    ctx.fillRect(x + faceX * s, y + 9 * s, 3 * s, 8 * s);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(x + (faceX + faceW - 2) * s, y + 10 * s, 2 * s, 10 * s);
    ctx.fillRect(x + (faceX + 2) * s, y + (7 + faceH - 2) * s, (faceW - 4) * s, 2 * s);

    // 眉毛
    ctx.fillStyle = '#2a2a2a';
    if (faceType === 'square') {
        ctx.fillRect(x + 10 * s, y + 11 * s, 5 * s, 2 * s);
        ctx.fillRect(x + 17 * s, y + 11 * s, 5 * s, 2 * s);
    } else {
        ctx.fillRect(x + 10 * s, y + 12 * s, 5 * s, 1 * s);
        ctx.fillRect(x + 17 * s, y + 12 * s, 5 * s, 1 * s);
    }

    // 眼睛
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 10 * s, y + 14 * s, 5 * s, 3 * s);
    ctx.fillRect(x + 17 * s, y + 14 * s, 5 * s, 3 * s);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x + 11 * s, y + 14 * s, 3 * s, 3 * s);
    ctx.fillRect(x + 18 * s, y + 14 * s, 3 * s, 3 * s);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 12 * s, y + 14 * s, 1 * s, 1 * s);
    ctx.fillRect(x + 19 * s, y + 14 * s, 1 * s, 1 * s);
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 10 * s, y + 17 * s, 5 * s, 1 * s);
    ctx.fillRect(x + 17 * s, y + 17 * s, 5 * s, 1 * s);

    // 鼻子
    ctx.fillStyle = skinDark;
    ctx.fillRect(x + 15 * s, y + 17 * s, 2 * s, 3 * s);
    ctx.fillStyle = skinLight;
    ctx.fillRect(x + 15 * s, y + 17 * s, 1 * s, 2 * s);

    // 嘴巴
    ctx.fillStyle = '#c06060';
    ctx.fillRect(x + 13 * s, y + 21 * s, 6 * s, 1 * s);
    ctx.fillStyle = '#d07070';
    ctx.fillRect(x + 14 * s, y + 21 * s, 2 * s, 1 * s);

    if (portraitData) {
        const armorColor  = portraitData.color || '#888';
        const darkerArmor = darkenColor(armorColor, 40);
        const lighterArmor = lightenColor(armorColor, 30);
        const hairHighlight = '#333';

        // 发型
        ctx.fillStyle = '#1a1a1a';
        switch (portraitData.hair) {
            case 'long':
                ctx.fillRect(x + 6 * s, y + 3 * s, 20 * s, 8 * s);
                ctx.fillRect(x + 5 * s, y + 8 * s, 4 * s, 16 * s);
                ctx.fillRect(x + 23 * s, y + 8 * s, 4 * s, 16 * s);
                ctx.fillStyle = hairHighlight;
                ctx.fillRect(x + 10 * s, y + 4 * s, 2 * s, 3 * s);
                ctx.fillRect(x + 18 * s, y + 4 * s, 2 * s, 3 * s);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x + 8 * s, y + 7 * s, 16 * s, 2 * s);
                break;
            case 'bun':
                ctx.fillRect(x + 8 * s, y + 2 * s, 16 * s, 3 * s);
                ctx.fillRect(x + 12 * s, y + 0, 8 * s, 3 * s);
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x + 13 * s, y + 1 * s, 6 * s, 1 * s);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x + 7 * s, y + 4 * s, 18 * s, 5 * s);
                ctx.fillStyle = hairHighlight;
                ctx.fillRect(x + 13 * s, y + 3 * s, 3 * s, 2 * s);
                break;
            case 'wild':
                ctx.fillRect(x + 4 * s, y + 1 * s, 24 * s, 10 * s);
                ctx.fillRect(x + 3 * s, y + 5 * s, 3 * s, 10 * s);
                ctx.fillRect(x + 26 * s, y + 5 * s, 3 * s, 10 * s);
                ctx.fillRect(x + 5 * s, y + 10 * s, 3 * s, 12 * s);
                ctx.fillRect(x + 24 * s, y + 10 * s, 3 * s, 12 * s);
                ctx.fillStyle = hairHighlight;
                ctx.fillRect(x + 8 * s, y + 2 * s, 2 * s, 4 * s);
                ctx.fillRect(x + 14 * s, y + 1 * s, 2 * s, 3 * s);
                ctx.fillRect(x + 22 * s, y + 2 * s, 2 * s, 4 * s);
                break;
            case 'bald':
                ctx.fillStyle = skinDark;
                ctx.fillRect(x + 8 * s, y + 5 * s, 16 * s, 2 * s);
                ctx.fillStyle = skinLight;
                ctx.fillRect(x + 10 * s, y + 7 * s, 6 * s, 2 * s);
                break;
            case 'crown':
                ctx.fillRect(x + 7 * s, y + 4 * s, 18 * s, 6 * s);
                ctx.fillStyle = '#c8a850';
                ctx.fillRect(x + 9 * s, y + 1 * s, 14 * s, 4 * s);
                ctx.fillStyle = '#ffe080';
                ctx.fillRect(x + 11 * s, y + 2 * s, 2 * s, 2 * s);
                ctx.fillRect(x + 15 * s, y + 1 * s, 2 * s, 3 * s);
                ctx.fillRect(x + 19 * s, y + 2 * s, 2 * s, 2 * s);
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(x + 15 * s, y + 0, 2 * s, 1 * s);
                break;
            default: // short
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x + 7 * s, y + 3 * s, 18 * s, 7 * s);
                ctx.fillStyle = hairHighlight;
                ctx.fillRect(x + 12 * s, y + 4 * s, 3 * s, 2 * s);
                break;
        }

        // 盔甲
        ctx.fillStyle = armorColor;
        ctx.fillRect(x + 3 * s, y + 25 * s, 26 * s, 7 * s);
        ctx.fillStyle = lighterArmor;
        ctx.fillRect(x + 4 * s, y + 25 * s, 8 * s, 2 * s);
        ctx.fillRect(x + 20 * s, y + 25 * s, 8 * s, 2 * s);
        ctx.fillStyle = darkerArmor;
        ctx.fillRect(x + 14 * s, y + 25 * s, 4 * s, 7 * s);
        ctx.fillStyle = '#f0c890';
        ctx.fillRect(x + 12 * s, y + 24 * s, 8 * s, 2 * s);
        ctx.fillStyle = '#c8a850';
        ctx.fillRect(x + 3 * s, y + 25 * s, 26 * s, 1 * s);

        // 胡须
        if (faceType === 'square') {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + 9 * s, y + 20 * s, 3 * s, 5 * s);
            ctx.fillRect(x + 20 * s, y + 20 * s, 3 * s, 5 * s);
            ctx.fillRect(x + 11 * s, y + 22 * s, 10 * s, 3 * s);
        } else if (faceType === 'long') {
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(x + 12 * s, y + 22 * s, 2 * s, 5 * s);
            ctx.fillRect(x + 18 * s, y + 22 * s, 2 * s, 5 * s);
            ctx.fillRect(x + 14 * s, y + 23 * s, 4 * s, 3 * s);
        }
    } else {
        ctx.fillStyle = '#666';
        ctx.fillRect(x + 3 * s, y + 25 * s, 26 * s, 7 * s);
        ctx.fillStyle = '#555';
        ctx.fillRect(x + 14 * s, y + 25 * s, 4 * s, 7 * s);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x + 7 * s, y + 3 * s, 18 * s, 7 * s);
    }

    // 金色边框
    const cs = 3 * s;
    ctx.strokeStyle = '#a08030';
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    ctx.strokeStyle = '#c8a850';
    ctx.lineWidth = Math.max(1, 1 * s);
    ctx.strokeRect(x, y, size, size);

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

// ── 主循环 ────────────────────────────────────────────────────────────────────
let generated = 0;
let skipped   = 0;

for (const gen of generals) {
    const filePath = path.join(portraitsDir, `${gen.id}.png`);
    if (fs.existsSync(filePath)) {
        skipped++;
        continue;
    }

    const SIZE = 128;
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    drawPortrait(ctx, 0, 0, SIZE, gen.portrait || null);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
    generated++;
    if (generated % 20 === 0) process.stdout.write(`  已生成 ${generated} 张...\n`);
}

console.log(`\n完成！生成 ${generated} 张新头像，跳过 ${skipped} 张已有头像。`);
