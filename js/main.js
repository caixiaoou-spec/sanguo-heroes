// 三国英雄传——蔡博尧版 - 游戏入口与主循环
import Renderer from './engine/renderer.js';
import InputManager from './engine/input.js';
import AudioManager from './engine/audio.js';
import SaveManager from './engine/save.js';
import GameState from './engine/game.js';
import MenuScene from './scenes/menu.js';
import FactionSelectScene from './scenes/factionSelect.js';
import WorldMapScene from './scenes/worldmap.js';
import BattleScene from './scenes/battle.js';
import EventSystem from './systems/event.js';
import generals from './data/generals.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.input = new InputManager(this.canvas);
        this.audio = new AudioManager();
        this.saveManager = new SaveManager();
        this.gameState = new GameState();
        this.eventSystem = new EventSystem(this.gameState);

        this.currentScene = null;
        this.lastTime = 0;
        this.running = true;

        // Initialize audio on first interaction
        this._audioInitialized = false;
        const initAudio = () => {
            if (!this._audioInitialized) {
                this.audio.init();
                this._audioInitialized = true;
            }
        };
        this.canvas.addEventListener('click', initAudio, { once: true });
        this.canvas.addEventListener('touchstart', initAudio, { once: true });

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

    loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // Cap at 50ms
        this.lastTime = timestamp;

        if (this.currentScene) {
            this.currentScene.update(dt);
            this.currentScene.render();
        }

        requestAnimationFrame(t => this.loop(t));
    }
}

// Launch game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
