// 音频管理器 - 支持丰富程序化BGM + 外部音频文件
export default class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.currentBGM = null;
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.5;
        this.muted = false;
        this._bgmInterval = null;
        this._activeBgmBus = null;
        // For external audio file playback
        this._bgmAudioElement = null;
        this._bgmSourceNode = null;
        this._bgmFileCache = {};
    }

    init() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.bgmGain = this.audioCtx.createGain();
            this.bgmGain.gain.value = this.bgmVolume;
            this.bgmGain.connect(this.audioCtx.destination);

            this.sfxGain = this.audioCtx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.audioCtx.destination);
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    resume() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Generate a simple tone for sound effects
    playSFX(type) {
        if (!this.audioCtx || this.muted) return;
        this.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        const now = this.audioCtx.currentTime;

        switch (type) {
            case 'click':
                osc.frequency.value = 600;
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'attack':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'skill':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.1);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'victory':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.15);
                osc.frequency.setValueAtTime(784, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.setValueAtTime(0.3, now + 0.4);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                break;
            case 'defeat':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(200, now + 0.5);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            case 'recruit':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            default:
                osc.frequency.value = 440;
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
        }
    }

    // ==================== BGM System ====================

    // Try to play an external audio file first, fall back to procedural
    playBGM(type) {
        this.stopBGM();
        if (!this.audioCtx || this.muted) return;
        this.resume();

        // Try external file: assets/audio/bgm_{type}.mp3 or .ogg
        const filePath = `assets/audio/bgm_${type}`;
        if (this._bgmFileCache[type] === 'unavailable') {
            this._playProceduralBGM(type);
            return;
        }

        // Try loading external audio file
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0; // We'll route through Web Audio API

        const tryLoad = (ext) => {
            return new Promise((resolve) => {
                const testAudio = new Audio();
                testAudio.src = `${filePath}.${ext}`;
                testAudio.oncanplaythrough = () => resolve(`${filePath}.${ext}`);
                testAudio.onerror = () => resolve(null);
                // Timeout after 500ms
                setTimeout(() => resolve(null), 500);
            });
        };

        Promise.race([
            tryLoad('mp3').then(url => url || tryLoad('ogg')),
            new Promise(resolve => setTimeout(() => resolve(null), 800))
        ]).then(url => {
            if (url && this.currentBGM === null) {
                // External file found
                audio.src = url;
                const source = this.audioCtx.createMediaElementSource(audio);
                const bgmBus = this.audioCtx.createGain();
                bgmBus.gain.value = this.bgmVolume;
                source.connect(bgmBus);
                bgmBus.connect(this.audioCtx.destination);
                this._activeBgmBus = bgmBus;
                this._bgmAudioElement = audio;
                this._bgmSourceNode = source;
                this._bgmFileCache[type] = url;
                audio.play().catch(() => {});
                this.currentBGM = type;
            } else {
                this._bgmFileCache[type] = 'unavailable';
                this._playProceduralBGM(type);
            }
        }).catch(() => {
            this._bgmFileCache[type] = 'unavailable';
            this._playProceduralBGM(type);
        });

        // Mark as current immediately to prevent race conditions
        this.currentBGM = type;
    }

    // Rich procedural BGM with multiple layers
    _playProceduralBGM(type) {
        if (this.muted) return;

        const bgmBus = this.audioCtx.createGain();
        bgmBus.gain.value = this.bgmVolume;
        bgmBus.connect(this.audioCtx.destination);
        this._activeBgmBus = bgmBus;

        if (type === 'battle') {
            this._playBattleBGM(bgmBus);
        } else {
            this._playMapBGM(bgmBus);
        }

        this.currentBGM = type;
    }

    // 大气磅礴的世界地图BGM - 古风宫廷感 (双段式 AABB)
    _playMapBGM(bus) {
        const ctx = this.audioCtx;

        // 宫商角徵羽 五声音阶 (D大调 + G大调转调)
        const D3=146.83, E3=164.81, Fs3=185, G3=196, A3=220, B3=246.94;
        const D4=293.66, E4=329.63, Fs4=369.99, G4=392, A4=440, B4=493.88;
        const D5=587.33, E5=659.25, Fs5=739.99, A5=880, B5=987.77;
        const G2=98, D2=73.42, A2=110;

        // ─── A段: 悠扬舒展 (古筝风) ───
        const melodyA = [
            D4, 0, Fs4, A4,  D5, B4, A4, 0,
            Fs4, A4, B4, A4,  Fs4, E4, D4, 0,
            E4, 0, Fs4, A4,  B4, D5, B4, A4,
            Fs4, E4, D4, E4,  Fs4, E4, D4, 0,
        ];
        const harmonyA = [
            0, 0, A3, D4,  Fs4, D4, D4, 0,
            A3, D4, Fs4, D4,  A3, Fs3, D3, 0,
            Fs3, 0, A3, D4,  Fs4, A4, Fs4, D4,
            A3, Fs3, D3, Fs3,  A3, Fs3, D3, 0,
        ];
        const bassA = [
            D3, D3, D3, D3,  D3, D3, A3, A3,
            Fs3, Fs3, D3, D3,  A3, A3, D3, D3,
            E3, E3, E3, E3,  B3, B3, B3, B3,
            A3, A3, Fs3, Fs3,  E3, E3, D3, D3,
        ];

        // ─── B段: 转G大调, 更开阔壮丽 ───
        const melodyB = [
            G4, 0, B4, D5,  E5, D5, B4, A4,
            G4, A4, B4, D5,  B4, A4, G4, 0,
            A4, B4, D5, E5,  Fs5, E5, D5, B4,
            D5, B4, A4, G4,  A4, B4, A4, G4,
        ];
        const harmonyB = [
            0, 0, G3, B3,  D4, B3, G3, 0,
            G3, D4, G4, B4,  G4, D4, B3, 0,
            D4, G4, B4, D5,  A4, D5, B4, G4,
            B4, G4, D4, B3,  D4, G4, D4, B3,
        ];
        const bassB = [
            G2, G2, G2, G2,  G3, G3, D3, D3,
            E3, E3, G3, G3,  D3, D3, G2, G2,
            D3, D3, G3, G3,  A3, A3, D3, D3,
            G3, G3, D3, D3,  E3, E3, G2, G2,
        ];

        const noteLen = 0.38;
        const sectionLen = 32 * noteLen;
        const loopLen = sectionLen * 4; // AABB

        let sectionIdx = 0;

        const playSection = () => {
            if (this.muted || !this.currentBGM) return;
            const now = ctx.currentTime;
            const isB = (sectionIdx % 4) >= 2;
            const mel = isB ? melodyB : melodyA;
            const har = isB ? harmonyB : harmonyA;
            const bas = isB ? bassB : bassA;

            mel.forEach((freq, i) => {
                if (freq === 0) return;
                const t = now + i * noteLen;
                // 主旋律 — 古筝拨弦
                this._playTone(bus, 'triangle', freq, t, noteLen * 0.85, 0.06, 'pluck');
                // 高八度泛音 (很轻, 增加空灵感)
                this._playTone(bus, 'sine', freq * 2, t + 0.05, noteLen * 0.3, 0.008, 'pluck');
            });

            har.forEach((freq, i) => {
                if (freq === 0) return;
                const t = now + i * noteLen;
                // 和声pad — 笛箫感
                this._playTone(bus, 'sine', freq, t, noteLen * 0.9, 0.025, 'pad');
            });

            bas.forEach((freq, i) => {
                const t = now + i * noteLen;
                this._playTone(bus, 'sine', freq, t, noteLen * 0.95, 0.04, 'bass');
            });

            // 鼓点 — B段更密集
            for (let i = 0; i < 32; i++) {
                const t = now + i * noteLen;
                if (i % 8 === 0) {
                    this._playDrum(bus, t, 'accent');
                } else if (i % 4 === 0) {
                    this._playDrum(bus, t, 'soft');
                }
                if (isB && i % 2 === 0) {
                    this._playDrum(bus, t, 'tick');
                }
            }
            // 段首强拍
            this._playDrum(bus, now, 'heavy');

            sectionIdx++;
        };

        playSection();
        this._bgmInterval = setInterval(playSection, sectionLen * 1000);
    }

    // 激昂战斗BGM - 多段式 (前奏→主题→桥段→高潮)
    _playBattleBGM(bus) {
        const ctx = this.audioCtx;

        // A小调 + D小调转调
        const A2=110, C3=130.81, D3=146.83, E3=164.81, F3=174.61, G3=196;
        const A3=220, C4=261.63, D4=293.66, E4=329.63, F4=349.23, G4=392, A4=440;
        const C5=523.25, D5=587.33, E5=659.25, F5=698.46, G5=783.99;
        const A1=55, E2=82.41, D2=73.42, F2=87.31, G2=98;

        // ─── A段: 主战斗旋律 Am ───
        const melodyA = [
            A4, 0, C5, D5,  E5, D5, C5, A4,
            G4, A4, C5, A4,  G4, F4, E4, 0,
            A4, C5, D5, E5,  F5, E5, D5, C5,
            D5, C5, A4, G4,  A4, 0, 0, 0,
        ];
        const powerA = [
            A3, A3, E4, E4,  A3, A3, C4, C4,
            G3, G3, A3, A3,  G3, F3, E3, E3,
            A3, A3, D4, D4,  F4, F4, E4, E4,
            D4, D4, A3, A3,  A3, 0, 0, 0,
        ];
        const bassA = [
            A2, A2, A2, A2,  E3, E3, A2, A2,
            C3, C3, A2, A2,  F3, F3, E3, E3,
            A2, A2, D3, D3,  F3, F3, E3, E3,
            D3, D3, A2, A2,  A2, A2, A2, A2,
        ];

        // ─── B段: 转Dm, 更紧张 ───
        const melodyB = [
            D5, 0, F5, G5,  F5, E5, D5, C5,
            D5, E5, F5, E5,  D5, C5, A4, 0,
            D5, F5, E5, D5,  C5, D5, E5, F5,
            E5, D5, C5, A4,  D5, 0, 0, 0,
        ];
        const powerB = [
            D4, D4, F4, F4,  D4, D4, A3, A3,
            D4, E4, F4, E4,  D4, C4, A3, A3,
            D4, F4, E4, D4,  C4, D4, E4, F4,
            E4, D4, C4, A3,  D4, 0, 0, 0,
        ];
        const bassB = [
            D3, D3, D3, D3,  F3, F3, D3, D3,
            G3, G3, F3, F3,  D3, D3, A2, A2,
            D3, D3, F3, F3,  A2, A2, E3, E3,
            C3, C3, A2, A2,  D3, D3, D3, D3,
        ];

        const noteLen = 0.2; // 快节奏
        const sectionLen = 32 * noteLen;
        let sectionIdx = 0;

        const playSection = () => {
            if (this.muted || !this.currentBGM) return;
            const now = ctx.currentTime;
            const isB = (sectionIdx % 4) >= 2;
            const mel = isB ? melodyB : melodyA;
            const pow = isB ? powerB : powerA;
            const bas = isB ? bassB : bassA;

            mel.forEach((freq, i) => {
                if (freq === 0) return;
                const t = now + i * noteLen;
                // 主旋律 — 锋利锯齿波
                this._playTone(bus, 'sawtooth', freq, t, noteLen * 0.75, 0.045, 'sharp');
                // 高八度叠加 (增加力度)
                this._playTone(bus, 'sawtooth', freq * 2, t, noteLen * 0.4, 0.01, 'sharp');
            });

            pow.forEach((freq, i) => {
                if (freq === 0) return;
                const t = now + i * noteLen;
                // 力量和弦
                this._playTone(bus, 'square', freq, t, noteLen * 0.65, 0.02, 'pad');
            });

            bas.forEach((freq, i) => {
                const t = now + i * noteLen;
                // 重低音
                this._playTone(bus, 'sawtooth', freq, t, noteLen * 0.9, 0.035, 'bass');
            });

            // 密集鼓点
            for (let i = 0; i < 32; i++) {
                const t = now + i * noteLen;
                if (i % 4 === 0) {
                    this._playDrum(bus, t, 'heavy');
                    this._playCymbal(bus, t);
                } else if (i % 2 === 0) {
                    this._playDrum(bus, t, 'accent');
                } else {
                    this._playDrum(bus, t, 'tick');
                }
            }

            // B段加倍击镲
            if (isB) {
                for (let i = 2; i < 32; i += 4) {
                    this._playCymbal(bus, now + i * noteLen);
                }
            }

            sectionIdx++;
        };

        playSection();
        this._bgmInterval = setInterval(playSection, sectionLen * 1000);
    }

    // 通用音符播放
    _playTone(bus, oscType, freq, start, dur, vol, style) {
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(bus);

        switch (style) {
            case 'pluck': // 拨弦 - 快起快衰
                gain.gain.setValueAtTime(vol, start);
                gain.gain.exponentialRampToValueAtTime(vol * 0.5, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
                break;
            case 'pad': // 柔和 - 慢起慢衰
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(vol, start + dur * 0.3);
                gain.gain.linearRampToValueAtTime(vol * 0.8, start + dur * 0.7);
                gain.gain.linearRampToValueAtTime(0, start + dur);
                break;
            case 'bass': // 低音 - 饱满
                gain.gain.setValueAtTime(vol, start);
                gain.gain.setValueAtTime(vol, start + dur * 0.6);
                gain.gain.linearRampToValueAtTime(0, start + dur);
                break;
            case 'sharp': // 锋利 - 快起中衰
                gain.gain.setValueAtTime(vol, start);
                gain.gain.setValueAtTime(vol * 0.7, start + dur * 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
                break;
            default:
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(vol, start + 0.05);
                gain.gain.setValueAtTime(vol, start + dur - 0.05);
                gain.gain.linearRampToValueAtTime(0, start + dur);
        }

        osc.start(start);
        osc.stop(start + dur);
    }

    // 鼓声合成
    _playDrum(bus, time, style) {
        const ctx = this.audioCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(bus);
        filter.type = 'lowpass';

        switch (style) {
            case 'heavy': // 重鼓
                osc.frequency.setValueAtTime(80, time);
                osc.frequency.exponentialRampToValueAtTime(30, time + 0.2);
                filter.frequency.value = 200;
                gain.gain.setValueAtTime(0.12, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
                osc.start(time);
                osc.stop(time + 0.25);
                break;
            case 'accent': // 中鼓
                osc.frequency.setValueAtTime(60, time);
                osc.frequency.exponentialRampToValueAtTime(25, time + 0.15);
                filter.frequency.value = 180;
                gain.gain.setValueAtTime(0.08, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
                osc.start(time);
                osc.stop(time + 0.18);
                break;
            case 'soft': // 轻鼓
                osc.frequency.setValueAtTime(50, time);
                osc.frequency.exponentialRampToValueAtTime(20, time + 0.12);
                filter.frequency.value = 150;
                gain.gain.setValueAtTime(0.04, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
                osc.start(time);
                osc.stop(time + 0.15);
                break;
            case 'tick': // 小鼓/边击
                osc.type = 'triangle';
                osc.frequency.value = 200;
                filter.frequency.value = 500;
                gain.gain.setValueAtTime(0.03, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
                osc.start(time);
                osc.stop(time + 0.06);
                break;
        }
    }

    // 镲片合成 (白噪音)
    _playCymbal(bus, time) {
        const ctx = this.audioCtx;
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 5000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(bus);

        noise.start(time);
        noise.stop(time + 0.1);
    }

    stopBGM() {
        // 1. 清除定时器
        if (this._bgmInterval) {
            clearInterval(this._bgmInterval);
            this._bgmInterval = null;
        }
        // 2. 停止外部音频
        if (this._bgmAudioElement) {
            this._bgmAudioElement.pause();
            this._bgmAudioElement.currentTime = 0;
            this._bgmAudioElement = null;
        }
        if (this._bgmSourceNode) {
            try { this._bgmSourceNode.disconnect(); } catch (e) {}
            this._bgmSourceNode = null;
        }
        // 3. 断开BGM总线
        if (this._activeBgmBus) {
            try { this._activeBgmBus.disconnect(); } catch (e) {}
            this._activeBgmBus = null;
        }
        this.currentBGM = null;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBGM();
        }
        return this.muted;
    }
}
