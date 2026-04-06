// 三国英雄传——蔡博尧版 - 游戏入口与主循环
import Renderer from './engine/renderer.js';
import InputManager from './engine/input.js';
import AudioManager from './engine/audio.js';
import SaveManager from './engine/save.js';
import GameState from './engine/game.js';
import PinchZoom from './engine/pinchzoom.js';
import MenuScene from './scenes/menu.js';
import FactionSelectScene from './scenes/factionSelect.js';
import WorldMapScene from './scenes/worldmap.js';
import BattleScene from './scenes/battle.js';
import EventSystem from './systems/event.js';
import generals from './data/generals.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.container = document.getElementById('game-container');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager(this.canvas);
        this.audio = new AudioManager();
        this.saveManager = new SaveManager();
        this.gameState = new GameState();
        this.eventSystem = new EventSystem(this.gameState);
        this.pinchZoom = new PinchZoom(this.canvas);

        this.currentScene = null;
        this.lastTime = 0;
        this.running = true;

        // Initialize audio + attempt fullscreen on first interaction
        this._audioInitialized = false;
        const initOnFirstInteraction = () => {
            if (!this._audioInitialized) {
                this.audio.init();
                this._audioInitialized = true;
            }
            this._tryAutoFullscreen();
        };
        this.canvas.addEventListener('click', initOnFirstInteraction, { once: true });
        this.canvas.addEventListener('touchstart', initOnFirstInteraction, { once: true });

        // Preload all portrait images
        this.renderer.preloadAllPortraits(generals.map(g => g.id));

        // Start with menu
        this.switchScene('menu');

        // Start game loop
        requestAnimationFrame(t => this.loop(t));
    }

    switchScene(sceneName, ...args) {
        // Clear accumulated clicks so they don't bleed into the next scene
        this.input.clearClicks();
        switch (sceneName) {
            case 'menu':
                this.currentScene = new MenuScene(this);
                break;
            case 'faction_select':
                this.currentScene = new FactionSelectScene(this);
                break;
            case 'worldmap':
                this.currentScene = new WorldMapScene(this);
                break;
            case 'battle':
                this.currentScene = new BattleScene(this, ...args);
                break;
        }
    }

    startBattle(attackerGeneralIds, defenderCityId, attackerSourceCity, extraOpts = {}) {
        // Store the return-to-worldmap info
        this._battleReturnData = { attackerIds: attackerGeneralIds, targetCity: defenderCityId, attackerSourceCity, ...extraOpts };
        this.switchScene('battle', attackerGeneralIds, defenderCityId);
    }

    startDefenseBattle(attackerGeneralIds, defenderCityId, attackerSourceCity) {
        this._battleReturnData = { attackerIds: attackerGeneralIds, targetCity: defenderCityId, playerSide: 'defender', attackerSourceCity };
        this.switchScene('battle', attackerGeneralIds, defenderCityId, 'defender');
    }

    startInterceptionBattle(attackerIds, defenderIds, attackerFactionId, defenderFactionId, playerSide, attackerSourceCity, defenderSourceCity, attackerTargetCity, defenderTargetCity) {
        this._battleReturnData = {
            isInterception: true,
            attackerIds, defenderIds,
            attackerFactionId, defenderFactionId,
            playerSide,
            attackerSourceCity, defenderSourceCity,
            attackerTargetCity, defenderTargetCity
        };
        this.switchScene('battle', attackerIds, null, playerSide, {
            isInterception: true, defenderIds, attackerFactionId, defenderFactionId
        });
    }

    // 请求全屏（移动端：隐藏浏览器导航栏）
    requestFullscreen() {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
        if (req) req.call(el).catch(() => {});
    }

    // 首次交互时在移动设备上自动请求全屏
    _tryAutoFullscreen() {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && !document.fullscreenElement) {
            this.requestFullscreen();
        }
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap at 50ms
        this.lastTime = timestamp;

        this.pinchZoom.update(this.input);

        if (this.currentScene) {
            try {
                this.currentScene.update(dt);
                this.currentScene.render();
            } catch (e) {
                console.error('[GameLoop] Exception caught:', e);
            }
        }

        requestAnimationFrame(t => this.loop(t));
    }
}

// Launch game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
