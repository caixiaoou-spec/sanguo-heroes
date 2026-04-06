// 游戏引擎 - 输入处理
export default class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false, button: 0, clientX: 0, clientY: 0 };
        this.clicks = [];
        this.rightClicks = [];
        this.scrollDelta = 0;
        this.dragStart = null;
        this.isDragging = false;
        this.touchStart = null;
        this._twoFingerActive = false;
        this._twoFingerLastY = 0;
        this._twoFingerLastDist = 0;
        this.isPinching = false;
        this.pinchDelta = 0;
        this.touchSeq = 0; // increments on each single-finger touchstart

        // 逻辑分辨率，不依赖canvas.width（因为canvas.width含DPR）
        this.logicalWidth = 1280;
        this.logicalHeight = 800;

        this._setupListeners();
    }

    _getCanvasCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / rect.width * this.logicalWidth,
            y: (clientY - rect.top) / rect.height * this.logicalHeight
        };
    }

    _setupListeners() {
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', e => {
            const coords = this._getCanvasCoords(e.clientX, e.clientY);
            this.mouse.x = coords.x;
            this.mouse.y = coords.y;
            this.mouse.clientX = e.clientX;
            this.mouse.clientY = e.clientY;

            if (this.mouse.down && this.dragStart) {
                const dx = this.mouse.x - this.dragStart.x;
                const dy = this.mouse.y - this.dragStart.y;
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                    this.isDragging = true;
                }
            }
        });

        this.canvas.addEventListener('mousedown', e => {
            const coords = this._getCanvasCoords(e.clientX, e.clientY);
            this.mouse.x = coords.x;
            this.mouse.y = coords.y;
            this.mouse.clientX = e.clientX;
            this.mouse.clientY = e.clientY;
            this.mouse.down = true;
            this.mouse.button = e.button;
            this.dragStart = { x: this.mouse.x, y: this.mouse.y };
        });

        this.canvas.addEventListener('mouseup', e => {
            const coords = this._getCanvasCoords(e.clientX, e.clientY);
            this.mouse.x = coords.x;
            this.mouse.y = coords.y;
            if (!this.isDragging) {
                if (e.button === 0) {
                    this.clicks.push({ x: this.mouse.x, y: this.mouse.y });
                } else if (e.button === 2) {
                    this.rightClicks.push({ x: this.mouse.x, y: this.mouse.y });
                }
            }
            this.mouse.down = false;
            this.isDragging = false;
            this.dragStart = null;
        });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            this.scrollDelta += e.deltaY;
        }, { passive: false });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        // Touch support
        this.canvas.addEventListener('touchstart', e => {
            e.preventDefault();
            if (e.touches.length === 2) {
                // Two-finger gesture: cancel single-touch state, prepare for scroll/pinch
                this._twoFingerActive = true;
                this._twoFingerLastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                this._twoFingerLastDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                this.isPinching = false;
                this.pinchDelta = 0;
                this.mouse.down = false;
                this.isDragging = false;
                this.touchStart = null;
                this.dragStart = null;
                return;
            }
            this._twoFingerActive = false;
            const touch = e.touches[0];
            const coords = this._getCanvasCoords(touch.clientX, touch.clientY);
            this.mouse.x = coords.x;
            this.mouse.y = coords.y;
            this.mouse.clientX = touch.clientX;
            this.mouse.clientY = touch.clientY;
            this.mouse.down = true;
            this.touchSeq++;
            this.touchStart = { x: this.mouse.x, y: this.mouse.y };
            this.dragStart = { x: this.mouse.x, y: this.mouse.y };
        }, { passive: false });

        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (e.touches.length === 2 || this._twoFingerActive) {
                const t0 = e.touches[0];
                const t1 = e.touches.length >= 2 ? e.touches[1] : e.changedTouches[0];
                const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
                const midY = (t0.clientY + t1.clientY) / 2;
                const dd = dist - this._twoFingerLastDist;   // positive = fingers spreading apart
                const dy = this._twoFingerLastY - midY;      // positive = fingers moving up

                // Pinch = fingers clearly spreading/closing; scroll = fingers moving together
                if (Math.abs(dd) > 3) {
                    this.isPinching = true;
                    this.pinchDelta = dd;
                } else {
                    this.isPinching = false;
                    this.pinchDelta = 0;
                    // Two-finger vertical swipe → scroll delta (for panel lists)
                    this.scrollDelta += dy * 2;
                }
                this._twoFingerLastDist = dist;
                this._twoFingerLastY = midY;
                return;
            }
            const touch = e.touches[0];
            const coords = this._getCanvasCoords(touch.clientX, touch.clientY);
            this.mouse.x = coords.x;
            this.mouse.y = coords.y;
            this.mouse.clientX = touch.clientX;
            this.mouse.clientY = touch.clientY;
            if (this.touchStart) {
                const dx = this.mouse.x - this.touchStart.x;
                const dy = this.mouse.y - this.touchStart.y;
                if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
                    this.isDragging = true;
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', e => {
            if (this._twoFingerActive && e.touches.length < 2) {
                this._twoFingerActive = false;
                this.isPinching = false;
                this.pinchDelta = 0;
                // Clear single-finger state so the next single-finger drag starts fresh
                this.mouse.down = false;
                this.isDragging = false;
                this.touchStart = null;
                this.dragStart = null;
                return;
            }
            if (!this.isDragging && this.touchStart) {
                this.clicks.push({ x: this.touchStart.x, y: this.touchStart.y });
            }
            this.mouse.down = false;
            this.isDragging = false;
            this.touchStart = null;
            this.dragStart = null;
        });
    }

    getClick() {
        return this.clicks.shift() || null;
    }

    clearClicks() {
        this.clicks = [];
        this.rightClicks = [];
    }

    getRightClick() {
        return this.rightClicks.shift() || null;
    }

    consumeScroll() {
        const d = this.scrollDelta;
        this.scrollDelta = 0;
        return d;
    }

    getDrag() {
        if (this.isDragging && this.dragStart) {
            return {
                dx: this.mouse.x - this.dragStart.x,
                dy: this.mouse.y - this.dragStart.y,
                startX: this.dragStart.x,
                startY: this.dragStart.y
            };
        }
        return null;
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }
}
