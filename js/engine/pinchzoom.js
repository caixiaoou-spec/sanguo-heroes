// 双指捏合缩放 — 对 canvas 元素应用 CSS scale transform
export default class PinchZoom {
    constructor(canvas) {
        this.canvas = canvas;
        this.zoom = 1;
        this.minZoom = 1.0;
        this.maxZoom = 4.0;
    }

    // 每帧调用：读取 input 的 pinchDelta 并更新缩放
    update(input) {
        if (!input.isPinching || input.pinchDelta === 0) return;
        const factor = 1 + input.pinchDelta * 0.007;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
        if (this.zoom <= 1.001) {
            this.zoom = 1;
            this.canvas.style.transform = '';
        } else {
            this.canvas.style.transform = `scale(${this.zoom})`;
        }
    }

    reset() {
        this.zoom = 1;
        this.canvas.style.transform = '';
    }
}
