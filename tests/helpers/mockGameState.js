/**
 * 测试用工厂函数 — 创建最小化的 mock 对象
 * 不依赖真实数据文件，纯内存构造，速度快
 */

export function createMockGeneral(overrides = {}) {
    return {
        id: 'test_general',
        name: '测试将',
        faction: 'test_faction',
        war: 80,
        int: 60,
        lead: 70,
        pol: 50,
        cha: 55,
        level: 10,
        exp: 0,
        loyalty: 100,
        hp: 260,    // 100 + 80*2 + 100*0=260  (war*2+lead matching formula)
        maxHp: 260,
        mp: 170,    // 50 + 60*2
        maxMp: 170,
        soldiers: 1000,
        maxSoldiers: 1000,
        city: 'test_city',
        status: 'idle',
        unitType: 'infantry',
        skills: [],
        equipment: { weapon: null, armor: null, mount: null },
        cooldowns: {},
        actionUsed: false,
        ...overrides
    };
}

export function createMockCity(overrides = {}) {
    return {
        id: 'test_city',
        name: '测试城',
        x: 100,
        y: 100,
        owner: 'test_faction',
        population: 50000,
        agriculture: 50,
        commerce: 50,
        defense: 30,
        soldiers: 2000,
        generals: [],
        development: 0,
        morale: 70,
        ...overrides
    };
}

export function createMockFaction(overrides = {}) {
    return {
        id: 'test_faction',
        name: '测试势力',
        alive: true,
        isPlayer: false,
        gold: 10000,
        food: 20000,
        fame: 50,
        allies: [],
        enemies: [],
        actionsUsed: {},
        cities: [],
        generals: [],
        ...overrides
    };
}

/**
 * 创建最小化 GameState mock
 * 提供 getCity/getFaction/getGeneral/getCitiesOf/getGeneralsOf/getGeneralsInCity 等方法
 */
export function createMockGameState(overrides = {}) {
    const cities = overrides.cities || [];
    const factions = overrides.factions || [];
    const generals = overrides.generals || [];
    const skills = overrides.skills || [];

    return {
        turn: 1,
        playerFaction: overrides.playerFaction || 'test_faction',
        cities,
        factions,
        generals,
        skills,
        notifications: [],
        marches: [],
        battleQueue: [],
        _marchIdCounter: 0,

        getCity(id) { return cities.find(c => c.id === id) || null; },
        getFaction(id) { return factions.find(f => f.id === id) || null; },
        getGeneral(id) { return generals.find(g => g.id === id) || null; },
        getSkill(id) { return skills.find(s => s.id === id) || null; },
        getPlayerFaction() { return this.getFaction(this.playerFaction); },

        getCitiesOf(factionId) { return cities.filter(c => c.owner === factionId); },
        getGeneralsOf(factionId) { return generals.filter(g => g.faction === factionId && g.status !== 'dead'); },
        getGeneralsInCity(cityId) {
            return generals.filter(g => g.city === cityId && g.status !== 'dead' && g.status !== 'captured');
        },
        getGarrisonCount(cityId) {
            return generals.filter(g => g.city === cityId && g.status === 'idle').length;
        },
        getUnaffiliatedGenerals() { return generals.filter(g => g.faction === 'none' && g.status !== 'dead'); },
        getAliveFactions() { return factions.filter(f => f.alive); },

        addNotification(text, type = 'info') {
            this.notifications.push({ text, type, turn: this.turn });
        },

        _assignSkills(general) {
            // no-op in tests unless overridden
        },

        checkVictory() {
            const alive = this.getAliveFactions();
            if (alive.length === 1) {
                return alive[0].id === this.playerFaction ? 'victory' : 'defeat';
            }
            const pf = this.getPlayerFaction();
            if (!pf || !pf.alive) return 'defeat';
            return null;
        },

        createMarch(type, faction, generalIds, sourceCityId, targetCityId, departTurnOverride) {
            const sourceCity = this.getCity(sourceCityId);
            const targetCity = this.getCity(targetCityId);
            const dist = Math.sqrt((sourceCity.x - targetCity.x) ** 2 + (sourceCity.y - targetCity.y) ** 2);
            let turns;
            if (dist <= 60) turns = 1;
            else if (dist <= 120) turns = 2;
            else if (dist <= 200) turns = 3;
            else turns = 4;
            const departTurn = departTurnOverride !== undefined ? departTurnOverride : this.turn;
            const travelTime = turns;
            const arrivalTurn = departTurn + travelTime;
            const march = {
                id: ++this._marchIdCounter,
                type, faction,
                generalIds: [...generalIds],
                sourceCity: sourceCityId,
                targetCity: targetCityId,
                turnsTotal: turns,
                turnsRemaining: turns,
                animProgress: 0,
                progress: 0,
                departTurn,
                travelTime,
                arrivalTurn
            };
            this.marches.push(march);
            return march;
        },

        ...overrides
    };
}

/**
 * 创建一个最小化的 battle 对象供 combat.js 方法使用
 */
export function createMockBattle(overrides = {}) {
    return {
        phase: 'dueling',
        timer: 0,
        fieldWidth: 1200,
        fieldHeight: 400,
        attacker: { faction: createMockFaction({ id: 'attacker' }), generals: [], totalSoldiers: 0 },
        defender: { faction: createMockFaction({ id: 'defender' }), generals: [], totalSoldiers: 0, city: createMockCity(), cityDefenseBonus: 0.3 },
        soldiers: { left: [], right: [] },
        projectiles: [],
        effects: [],
        damageNumbers: [],
        skillAnimations: [],
        currentDuel: null,
        duelResults: [],
        matchScore: { left: 0, right: 0 },
        result: null,
        ...overrides
    };
}

/**
 * 创建一个 battle unit (将领战斗单位)
 */
export function createMockBattleUnit(generalOverrides = {}, unitOverrides = {}) {
    const general = createMockGeneral(generalOverrides);
    return {
        general,
        side: 'left',
        x: 150,
        y: 200,
        hp: general.hp,
        maxHp: general.maxHp,
        mp: general.mp,
        maxMp: general.maxMp,
        soldiers: general.soldiers,
        maxSoldiers: general.soldiers,
        skills: [],
        targetX: 0,
        targetY: 0,
        state: 'standby',
        attackTimer: 0,
        frame: 0,
        facing: 1,
        ...unitOverrides
    };
}
