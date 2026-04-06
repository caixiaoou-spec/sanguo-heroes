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
        // 单指平移：记录起点，用绝对偏移计算（不累加delta，彻底避免跳跃）
        this._panTouchSeq = -1;
        this._panStartClientX = 0;
        this._panStartClientY = 0;
        this._panStartTx = 0;
        this._panStartTy = 0;
    }

    // 每帧调用
    update(input) {
        this._updatePinch(input);
        if (this.zoom > 1) {
            this._updatePan(input);
        } else {
            this._panTouchSeq = -1;
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
            // 手指抬起时强制重置，确保下次触碰重新初始化
            this._panTouchSeq = -1;
            return;
        }
        const cx = input.mouse.clientX;
        const cy = input.mouse.clientY;

        // 新触碰（或重置后第一次）：记录起始状态
        if (this._panTouchSeq !== input.touchSeq) {
            this._panTouchSeq = input.touchSeq;
            this._panStartClientX = cx;
            this._panStartClientY = cy;
            this._panStartTx = this._tx;
            this._panStartTy = this._ty;
            return;
        }

        // 绝对偏移：_tx = 触碰时的_tx + 手指移动距离，不累加误差
        // 竖屏时容器旋转 -90°：container X = portrait -Y，container Y = portrait X
        let newTx, newTy;
        if (window.innerHeight > window.innerWidth) {
            newTx = this._panStartTx - (cy - this._panStartClientY);
            newTy = this._panStartTy + (cx - this._panStartClientX);
        } else {
            newTx = this._panStartTx + (cx - this._panStartClientX);
            newTy = this._panStartTy + (cy - this._panStartClientY);
        }

        const maxTx = (window.innerWidth  * (this.zoom - 1)) / 2;
        const maxTy = (window.innerHeight * (this.zoom - 1)) / 2;
        const clampedTx = Math.max(-maxTx, Math.min(maxTx, newTx));
        const clampedTy = Math.max(-maxTy, Math.min(maxTy, newTy));

        if (Math.abs(clampedTx - this._tx) < 0.5 && Math.abs(clampedTy - this._ty) < 0.5) return;

        // 到达边界时同步起点，防止反向移动时跳跃
        if (clampedTx !== newTx) this._panStartClientX += (newTx - clampedTx);
        if (clampedTy !== newTy) this._panStartClientY += (newTy - clampedTy);

        this._tx = clampedTx;
        this._ty = clampedTy;
        this._applyTransform();
        input.isDragging = true;
    }

    _clampTranslation() {
        // Use landscape dimensions regardless of device orientation
        const lw = Math.max(window.innerWidth, window.innerHeight);
        const lh = Math.min(window.innerWidth, window.innerHeight);
        const maxTx = lw * (this.zoom - 1) / 2;
        const maxTy = lh * (this.zoom - 1) / 2;
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
