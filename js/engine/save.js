// 存档系统
export default class SaveManager {
    constructor() {
        this.SAVE_KEY = 'sango_heroes_save';
        this.SETTINGS_KEY = 'sango_heroes_settings';
    }

    save(gameState) {
        try {
            const data = {
                version: 1,
                timestamp: Date.now(),
                turn: gameState.turn,
                playerFaction: gameState.playerFaction,
                factions: gameState.factions.map(f => ({
                    id: f.id, name: f.name, gold: f.gold, food: f.food, fame: f.fame,
                    alive: f.alive, cities: f.cities, allies: f.allies, enemies: f.enemies
                })),
                cities: gameState.cities.map(c => ({
                    id: c.id, owner: c.owner, population: c.population,
                    agriculture: c.agriculture, commerce: c.commerce,
                    defense: c.defense, soldiers: c.soldiers, generals: c.generals
                })),
                generals: gameState.generals.map(g => ({
                    id: g.id, faction: g.faction, city: g.city,
                    level: g.level, exp: g.exp, loyalty: g.loyalty,
                    hp: g.hp, mp: g.mp, soldiers: g.soldiers,
                    equipment: g.equipment, skills: g.skills,
                    status: g.status
                })),
                marches: gameState.marches,
                _marchIdCounter: gameState._marchIdCounter
            };
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Save failed:', e);
            return false;
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            console.error('Load failed:', e);
            return null;
        }
    }

    hasSave() {
        return !!localStorage.getItem(this.SAVE_KEY);
    }

    deleteSave() {
        localStorage.removeItem(this.SAVE_KEY);
    }

    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const raw = localStorage.getItem(this.SETTINGS_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }
}
