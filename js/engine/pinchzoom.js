// 双指捏合缩放 — 对 #game-container 应用 CSS scale transform
export default class PinchZoom {
    constructor(container) {
        this.container = container;
        this.zoom = 1;
        this.minZoom = 0.8;
        this.maxZoom = 3.0;
    }

    // 每帧调用：读取 input 的 pinchDelta 并更新缩放
    update(input) {
        if (!input.isPinching || input.pinchDelta === 0) return;
        // pinchDelta > 0 表示两指距离拉大（放大），< 0 表示缩小
        const factor = 1 + input.pinchDelta * 0.006;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
        this.container.style.transform = `scale(${this.zoom})`;
    }

    // 重置缩放至 1x
    reset() {
        this.zoom = 1;
        this.container.style.transform = '';
    }
}
