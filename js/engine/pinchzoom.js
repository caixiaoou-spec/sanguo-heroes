// 双指捏合缩放 + 单指平移（放大后）
// 对 canvas 应用 CSS transform: translate + scale
export default class PinchZoom {
    constructor(canvas) {
        this.canvas = canvas;
        this.zoom = 1;
        this.minZoom = 1.0;
        this.maxZoom = 4.0;
        // 平移偏移（CSS 像素）
        this._tx = 0;
        this._ty = 0;
        // 单指平移追踪：raw clientX/clientY
        this._panLastX = null;
        this._panLastY = null;
    }

    // 每帧调用
    update(input) {
        this._updatePinch(input);
        if (this.zoom > 1) {
            this._updatePan(input);
        } else {
            this._panLastX = null;
            this._panLastY = null;
        }
    }

    _updatePinch(input) {
        if (!input.isPinching || input.pinchDelta === 0) return;
        const factor = 1 + input.pinchDelta * 0.007;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
        if (this.zoom <= 1.001) {
            this.zoom = 1;
            this._tx = 0;
            this._ty = 0;
        }
        this._clampTranslation();
        this._applyTransform();
    }

    _updatePan(input) {
        // 放大状态下，单指移动平移 CSS 视口
        if (!input.mouse.down || input.isPinching) {
            this._panLastX = null;
            this._panLastY = null;
            return;
        }
        const cx = input.mouse.clientX;
        const cy = input.mouse.clientY;
        if (cx === undefined || cx === 0) return;

        if (this._panLastX === null) {
            this._panLastX = cx;
            this._panLastY = cy;
            return;
        }

        const dx = cx - this._panLastX;
        const dy = cy - this._panLastY;
        this._panLastX = cx;
        this._panLastY = cy;

        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

        this._tx += dx;
        this._ty += dy;
        this._clampTranslation();
        this._applyTransform();
        // 标记为拖拽，使游戏不注册 click
        input.isDragging = true;
    }

    _clampTranslation() {
        const maxTx = (window.innerWidth  * (this.zoom - 1)) / 2;
        const maxTy = (window.innerHeight * (this.zoom - 1)) / 2;
        this._tx = Math.max(-maxTx, Math.min(maxTx, this._tx));
        this._ty = Math.max(-maxTy, Math.min(maxTy, this._ty));
    }

    _applyTransform() {
        if (this.zoom <= 1 && this._tx === 0 && this._ty === 0) {
            this.canvas.style.transform = '';
        } else {
            this.canvas.style.transform = `translate(${this._tx}px, ${this._ty}px) scale(${this.zoom})`;
        }
    }

    reset() {
        this.zoom = 1;
        this._tx = 0;
        this._ty = 0;
        this.canvas.style.transform = '';
    }
}
