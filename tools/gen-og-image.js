#!/usr/bin/env node
// Generate OG image (1200x630) for social sharing
// Run: node tools/gen-og-image.js
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const W = 1200, H = 630;
const buf = Buffer.alloc(W * H * 3); // RGB

function rgb(x, y, r, g, b) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    buf[i] = r; buf[i+1] = g; buf[i+2] = b;
}

function fillRect(x, y, w, h, r, g, b) {
    for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++)
            rgb(x+dx, y+dy, r, g, b);
}

function circle(cx, cy, radius, r, g, b, fill=true) {
    for (let dy = -radius; dy <= radius; dy++)
        for (let dx = -radius; dx <= radius; dx++) {
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (fill ? dist <= radius : Math.abs(dist - radius) < 0.8)
                rgb(cx+dx, cy+dy, r, g, b);
        }
}

function line(x0, y0, x1, y1, r, g, b) {
    const dx = Math.abs(x1-x0), dy = Math.abs(y1-y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
        rgb(x0, y0, r, g, b);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx)  { err += dx; y0 += sy; }
    }
}

// ── Background ───────────────────────────────────────────────────────────────
fillRect(0, 0, W, H, 8, 18, 8);          // deep forest green

// Map parchment area
fillRect(30, 20, W-60, H-40, 18, 30, 14);

// Subtle terrain bands (horizontal gradient effect)
for (let y = 20; y < H-20; y++) {
    const noise = Math.sin(y * 0.07) * 3 + Math.sin(y * 0.13) * 2;
    for (let x = 30; x < W-30; x++) {
        const n2 = Math.sin(x * 0.05 + y * 0.03) * 3;
        const base = 18 + Math.round(noise + n2);
        rgb(x, y, base, base+14, Math.round(base*0.6));
    }
}

// River-like diagonal stripes (blue tint)
for (let i = 0; i < 3; i++) {
    const startX = [200, 400, 580][i];
    const startY = [80, 160, 260][i];
    for (let t = 0; t < 180; t++) {
        const x = startX + t * 1.2 + Math.sin(t * 0.15) * 18;
        const y = startY + t * 0.8 + Math.cos(t * 0.12) * 12;
        for (let w = -2; w <= 2; w++) {
            const px = Math.round(x + w * Math.cos(0.6));
            const py = Math.round(y + w * Math.sin(0.6));
            rgb(px, py, 30, 55, 80);
        }
    }
}

// ── City coordinate mapping ──────────────────────────────────────────────────
// data range: xMin=130, xMax=690, yMin=70, yMax=580
const PAD = 60;
function toScreen(dx, dy) {
    return {
        x: Math.round(PAD + (dx - 130) / (690 - 130) * (W - PAD*2)),
        y: Math.round(PAD + (dy - 70)  / (580 - 70)  * (H - PAD*2)),
    };
}

const cities = [
    { name:'洛阳', x:480,y:280 }, { name:'长安', x:350,y:290 },
    { name:'许昌', x:530,y:310 }, { name:'邺城', x:520,y:220 },
    { name:'成都', x:250,y:400 }, { name:'建业', x:620,y:400 },
    { name:'襄阳', x:470,y:370 }, { name:'江陵', x:440,y:400 },
    { name:'长沙', x:490,y:450 }, { name:'北平', x:570,y:150 },
    { name:'汉中', x:330,y:350 }, { name:'宛城', x:490,y:340 },
    { name:'汝南', x:550,y:340 }, { name:'寿春', x:590,y:350 },
    { name:'庐江', x:600,y:380 }, { name:'下邳', x:600,y:300 },
    { name:'平原', x:560,y:240 }, { name:'陈留', x:530,y:290 },
    { name:'天水', x:270,y:300 }, { name:'江州', x:310,y:430 },
    { name:'梓潼', x:280,y:370 }, { name:'吴郡', x:650,y:390 },
    { name:'会稽', x:670,y:420 }, { name:'柴桑', x:570,y:400 },
    { name:'桂阳', x:500,y:480 }, { name:'武陵', x:420,y:450 },
    { name:'辽东', x:630,y:110 }, { name:'太原', x:420,y:190 },
    { name:'上党', x:460,y:220 }, { name:'武威', x:180,y:260 },
    { name:'金城', x:230,y:275 }, { name:'安定', x:290,y:250 },
    { name:'西域', x:140,y:230 }, { name:'玄菟', x:680,y:80  },
    { name:'右北平',x:610,y:130 }, { name:'南海', x:560,y:540 },
    { name:'苍梧', x:470,y:530 }, { name:'交趾', x:430,y:570 },
    { name:'南中', x:300,y:520 }, { name:'越嶲', x:250,y:480 },
    { name:'建宁', x:280,y:540 }, { name:'濮阳', x:540,y:260 },
    { name:'北海', x:600,y:230 }, { name:'琅琊', x:620,y:270 },
    { name:'广陵', x:630,y:330 }, { name:'鄱阳', x:590,y:430 },
    { name:'零陵', x:450,y:480 }, { name:'益州', x:230,y:440 },
    { name:'上庸', x:390,y:340 }, { name:'弘农', x:420,y:290 },
    { name:'河内', x:480,y:240 }, { name:'南郡', x:460,y:415 },
    { name:'颍川', x:510,y:320 }, { name:'济北', x:560,y:270 },
    { name:'新野', x:480,y:355 }, { name:'鄴城', x:520,y:220 },
];

// Draw thin connection lines first
const edges = [
    ['洛阳','长安'],['洛阳','许昌'],['洛阳','邺城'],['邺城','北平'],
    ['北平','辽东'],['长安','汉中'],['汉中','成都'],['成都','江州'],
    ['江州','江陵'],['江陵','襄阳'],['襄阳','宛城'],['宛城','许昌'],
    ['许昌','陈留'],['陈留','濮阳'],['濮阳','邺城'],['邺城','平原'],
    ['平原','北海'],['北海','下邳'],['下邳','寿春'],['寿春','庐江'],
    ['庐江','建业'],['建业','吴郡'],['建业','广陵'],['柴桑','长沙'],
    ['长沙','桂阳'],['长沙','武陵'],['武陵','江陵'],['长安','天水'],
    ['天水','武威'],['武威','西域'],['成都','梓潼'],['梓潼','汉中'],
    ['江州','南中'],['南中','建宁'],['南海','苍梧'],['苍梧','交趾'],
];

const cityMap = {};
cities.forEach(c => cityMap[c.name] = toScreen(c.x, c.y));

for (const [a, b] of edges) {
    if (!cityMap[a] || !cityMap[b]) continue;
    const pa = cityMap[a], pb = cityMap[b];
    line(pa.x, pa.y, pb.x, pb.y, 60, 80, 50);
}

// Draw cities
const major = new Set(['洛阳','长安','成都','建业','邺城','北平','汉中','襄阳']);
for (const c of cities) {
    const p = toScreen(c.x, c.y);
    if (!p) continue;
    const isMajor = major.has(c.name);
    const r = isMajor ? 6 : 4;
    circle(p.x, p.y, r+2, 40, 55, 30);    // shadow
    circle(p.x, p.y, r,   200, 168, 80);   // gold fill
    if (isMajor) circle(p.x, p.y, r+1, 255, 224, 128, false); // bright ring
}

// ── Border frame ─────────────────────────────────────────────────────────────
const BX=12, BY=12, BW=W-24, BH=H-24;
// outer border
for (let x = BX; x < BX+BW; x++) { rgb(x, BY, 200,168,80); rgb(x, BY+BH, 200,168,80); }
for (let y = BY; y < BY+BH; y++) { rgb(BX, y, 200,168,80); rgb(BX+BW, y, 200,168,80); }
// inner border
const bx=18,by=18,bw=W-36,bh=H-36;
for (let x = bx; x < bx+bw; x++) { rgb(x, by, 140,110,50); rgb(x, by+bh, 140,110,50); }
for (let y = by; y < by+bh; y++) { rgb(bx, y, 140,110,50); rgb(bx+bw, y, 140,110,50); }

// Corner ornaments
function corner(x, y, sx, sy) {
    for (let i = 0; i < 20; i++) rgb(x+i*sx, y,    200,168,80);
    for (let i = 0; i < 20; i++) rgb(x,    y+i*sy, 200,168,80);
}
corner(BX, BY,  1, 1); corner(BX+BW, BY,  -1, 1);
corner(BX, BY+BH, 1,-1); corner(BX+BW, BY+BH,-1,-1);

// ── Title text (pixel-drawn) ─────────────────────────────────────────────────
// Simple large dots to hint at Chinese title characters — use a title band
fillRect(30, H-90, W-60, 60, 10, 8, 4);
for (let x = 30; x < W-30; x++) {
    rgb(x, H-90, 200,168,80);
    rgb(x, H-32, 200,168,80);
}
// Gold highlight stripe in title band
for (let x = 30; x < W-30; x++) {
    rgb(x, H-89, 255,220,100);
    rgb(x, H-88, 200,168,80);
}

// Dots representing "三国英雄传" — evenly spaced bright blobs
const titleText = [
    [0.12,0.5],[0.20,0.5],[0.28,0.5],  // 三 国 英
    [0.44,0.5],[0.52,0.5],             // 雄 传
];
for (const [fx, fy] of titleText) {
    const tx = Math.round(30 + fx * (W-60));
    const ty = Math.round((H-90) + fy * 60);
    circle(tx, ty, 8, 255, 224, 128);
    circle(tx, ty, 5, 255, 240, 160);
}

// ── Encode PNG ───────────────────────────────────────────────────────────────
function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++)
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf  = Buffer.allocUnsafe(4); lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf  = Buffer.allocUnsafe(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Add PNG filter byte (0 = None) before each row
const filtered = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
    filtered[y * (1 + W*3)] = 0;
    buf.copy(filtered, y * (1 + W*3) + 1, y * W * 3, (y+1) * W * 3);
}

const ihdr = Buffer.allocUnsafe(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

const idat = zlib.deflateSync(filtered, { level: 6 });

const png = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
]);

const outPath = path.join(__dirname, '..', 'assets', 'og-image.png');
fs.writeFileSync(outPath, png);
console.log('Generated:', outPath, `(${(png.length/1024).toFixed(1)} KB)`);
