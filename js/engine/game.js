// 游戏状态管理
import CITIES_DATA from '../data/cities.js';
import { FACTIONS_DATA, NEUTRAL_CITIES } from '../data/factions.js';
import GENERALS_DATA from '../data/generals.js';
import SKILLS_DATA from '../data/skills.js';
import ITEMS_DATA from '../data/items.js';
import EVENTS_DATA from '../data/events.js';
import { calcMaxHp, calcMaxMp, calcMarchTurns } from '../utils/generalUtils.js';

export default class GameState {
    constructor() {
        this.turn = 1;
        this.phase = 'player'; // 'player', 'ai', 'event', 'battle'
        this.playerFaction = null;
        this.factions = [];
        this.cities = [];
        this.generals = [];
        this.skills = [];
        this.items = [];
        this.events = [];
        this.notifications = [];
        this.selectedCity = null;
        this.battleQueue = [];
        this.actionPoints = 0;
        this.maxActionPoints = 3;
        this.marches = [];
        this._marchIdCounter = 0;
    }

    initNewGame(factionId) {
        this.turn = 1;
        this.playerFaction = factionId;

        // Initialize skills & items from data
        this.skills = [...SKILLS_DATA];
        this.items = [...ITEMS_DATA];
        this.events = [...EVENTS_DATA];

        // Initialize cities
        this.cities = CITIES_DATA.map(cd => ({
            ...cd,
            owner: null,
            soldiers: Math.floor(cd.population * 0.05),
            generals: [],
            development: 0,
            morale: 70
        }));

        // Initialize factions
        this.factions = FACTIONS_DATA.map(fd => ({
            ...fd,
            alive: true,
            allies: [],
            enemies: [],
            isPlayer: fd.id === factionId,
            actionsUsed: {}
        }));

        // Assign cities to factions
        for (const fd of FACTIONS_DATA) {
            for (const cityId of fd.cities) {
                const city = this.getCity(cityId);
                if (city) {
                    city.owner = fd.id;
                    city.soldiers = Math.floor(city.population * 0.08);
                }
            }
        }

        // Initialize generals (flatten stats object if present)
        this.generals = GENERALS_DATA.map(gd => {
            const s = gd.stats || {};
            const war = s.war || gd.war || 50;
            const int = s.int || gd.int || 50;
            const lead = s.lead || gd.lead || 50;
            const pol = s.pol || gd.pol || 50;
            const cha = s.cha || gd.cha || 50;
            return {
                ...gd,
                war, int, lead, pol, cha,
                hp: calcMaxHp(war, lead),
                maxHp: calcMaxHp(war, lead),
                mp: calcMaxMp(int),
                maxMp: calcMaxMp(int),
                soldiers: 0,
                city: null,
                status: 'idle',
                equipment: { weapon: null, armor: null, mount: null },
                cooldowns: {},
                actionUsed: false
            };
        });

        // Assign generals to cities
        for (const fd of FACTIONS_DATA) {
            const factionCities = this.cities.filter(c => c.owner === fd.id);
            fd.generals.forEach((gid, i) => {
                const gen = this.getGeneral(gid);
                if (gen && factionCities.length > 0) {
                    const city = factionCities[i % factionCities.length];
                    gen.city = city.id;
                    gen.faction = fd.id;
                    gen.soldiers = Math.floor(1000 + Math.random() * 2000);
                    city.generals.push(gid);
                }
            });
        }

        // Assign skills to generals based on level
        for (const gen of this.generals) {
            if (gen.faction !== 'none') {
                this._assignSkills(gen);
            }
        }

        this.actionPoints = this.maxActionPoints;
        this.marches = [];
        this._marchIdCounter = 0;
    }

    _assignSkills(general) {
        // Xiang Yu gets his exclusive skills only
        if (general.id === 'xiang_yu') {
            general.skills = ['qianguwuer', 'bawangxiejia', 'pofujinzhou', 'lishansqb'];
            return;
        }
        const exclusiveSkills = new Set(['qianguwuer', 'bawangxiejia', 'pofujinzhou', 'lishansqb']);
        // Use stats.war / stats.int (not bare properties)
        const war = general.stats ? general.stats.war : (general.war || 50);
        const intel = general.stats ? general.stats.int : (general.int || 50);
        const isWarrior = war > intel;
        // Prefer level-appropriate skills; fall back to all skills if pool is too small
        const levelFiltered = this.skills.filter(s => s.levelReq <= general.level && !exclusiveSkills.has(s.id));
        const allFiltered   = this.skills.filter(s => !exclusiveSkills.has(s.id));
        const pool = levelFiltered.length >= 3 ? levelFiltered : allFiltered;
        const typeFiltered = pool.filter(s => {
            if (isWarrior) return s.type === 'martial' || s.type === 'support';
            return s.type === 'strategist' || s.type === 'support';
        });
        const filtered = typeFiltered.length >= 3 ? typeFiltered : pool;
        // Always assign exactly 3 skills using deterministic seed
        let seed = 0;
        for (let i = 0; i < general.id.length; i++) seed = (seed * 31 + general.id.charCodeAt(i)) >>> 0;
        seed ^= general.level * 2654435761;
        const seededRng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
        const shuffled = [...filtered].sort(() => seededRng() - 0.5);
        general.skills = shuffled.slice(0, 3).map(s => s.id);
    }

    loadFromSave(saveData) {
        this.turn = saveData.turn;
        this.playerFaction = saveData.playerFaction;
        this.skills = [...SKILLS_DATA];
        this.items = [...ITEMS_DATA];
        this.events = [...EVENTS_DATA];

        // Restore cities
        this.cities = CITIES_DATA.map(cd => {
            const saved = saveData.cities.find(sc => sc.id === cd.id);
            return saved ? { ...cd, ...saved } : { ...cd, owner: null, soldiers: 0, generals: [], development: 0, morale: 70 };
        });

        // Restore factions
        this.factions = FACTIONS_DATA.map(fd => {
            const saved = saveData.factions.find(sf => sf.id === fd.id);
            return saved ? { ...fd, ...saved, isPlayer: fd.id === saveData.playerFaction } : { ...fd, alive: false, isPlayer: false };
        });

        // Restore generals
        this.generals = GENERALS_DATA.map(gd => {
            const saved = saveData.generals.find(sg => sg.id === gd.id);
            const s = gd.stats || {};
            const war = s.war || gd.war || 50;
            const int = s.int || gd.int || 50;
            const lead = s.lead || gd.lead || 50;
            const pol = s.pol || gd.pol || 50;
            const cha = s.cha || gd.cha || 50;
            const base = {
                ...gd, war, int, lead, pol, cha,
                maxHp: calcMaxHp(war, lead),
                maxMp: calcMaxMp(int)
            };
            if (saved) {
                return { ...base, ...saved, maxHp: base.maxHp, maxMp: base.maxMp };
            }
            return {
                ...base,
                hp: base.maxHp, mp: base.maxMp,
                soldiers: 0, city: null, status: 'idle',
                equipment: { weapon: null, armor: null, mount: null },
                cooldowns: {}, actionUsed: false
            };
        });

        this.actionPoints = this.maxActionPoints;

        // Restore marches
        this.marches = saveData.marches || [];
        this._marchIdCounter = saveData._marchIdCounter || 0;
    }

    // Getters
    getCity(id) { return this.cities.find(c => c.id === id); }
    getFaction(id) { return this.factions.find(f => f.id === id); }
    getGeneral(id) { return this.generals.find(g => g.id === id); }
    getSkill(id) { return this.skills.find(s => s.id === id); }
    getItem(id) { return this.items.find(i => i.id === id); }
    getPlayerFaction() { return this.getFaction(this.playerFaction); }

    getCitiesOf(factionId) { return this.cities.filter(c => c.owner === factionId); }
    getGeneralsOf(factionId) { return this.generals.filter(g => g.faction === factionId && g.status !== 'dead'); }
    getGeneralsInCity(cityId) { return this.generals.filter(g => g.city === cityId && g.status !== 'dead' && g.status !== 'captured'); }
    // Only idle (garrisoned inside) generals — used for 12-cap check
    getGarrisonCount(cityId) { return this.generals.filter(g => g.city === cityId && g.status === 'idle').length; }
    getUnaffiliatedGenerals() { return this.generals.filter(g => g.faction === 'none' && g.status !== 'dead'); }
    getCapturedInCity(cityId) { return this.generals.filter(g => g.city === cityId && g.status === 'captured'); }

    removeGeneralFromCity(cityId, genId) {
        const city = this.getCity(cityId);
        if (city) city.generals = city.generals.filter(gid => gid !== genId);
    }
    addGeneralToCity(cityId, genId) {
        const city = this.getCity(cityId);
        if (city && !city.generals.includes(genId)) city.generals.push(genId);
    }

    getAliveFactions() { return this.factions.filter(f => f.alive); }

    // Check victory
    checkVictory() {
        const alive = this.getAliveFactions();
        if (alive.length === 1) {
            return alive[0].id === this.playerFaction ? 'victory' : 'defeat';
        }
        const playerFaction = this.getPlayerFaction();
        if (!playerFaction || !playerFaction.alive) return 'defeat';
        return null;
    }

    addNotification(text, type = 'info') {
        this.notifications.push({ text, type, turn: this.turn });
    }

    // ── 行军系统 ──
    createMarch(type, faction, generalIds, sourceCityId, targetCityId, departTurnOverride) {
        const sourceCity = this.getCity(sourceCityId);
        const targetCity = this.getCity(targetCityId);
        if (!sourceCity || !targetCity) {
            console.warn('createMarch: invalid city ids', sourceCityId, targetCityId);
            return null;
        }
        const dist = Math.sqrt((sourceCity.x - targetCity.x) ** 2 + (sourceCity.y - targetCity.y) ** 2);
        const turns = calcMarchTurns(dist);

        const departTurn = departTurnOverride !== undefined ? departTurnOverride : this.turn;
        const travelTime = turns;    // float，供时间轴系统使用
        const arrivalTurn = departTurn + travelTime;

        const march = {
            id: ++this._marchIdCounter,
            type,
            faction,
            generalIds: [...generalIds],
            sourceCity: sourceCityId,
            targetCity: targetCityId,
            turnsTotal: turns,
            turnsRemaining: turns,
            animProgress: 0,
            progress: 0,
            // Plan B 时间轴字段
            departTurn,
            travelTime,
            arrivalTurn
        };
        this.marches.push(march);
        return march;
    }

    getGeneralMarch(genId) {
        return this.marches.find(m => m.generalIds.includes(genId)) || null;
    }
}
