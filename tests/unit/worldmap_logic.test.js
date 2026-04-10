/**
 * worldmap_logic.test.js — WorldMapLogic 纯逻辑层测试
 *
 * 覆盖 js/scenes/worldmap_logic.js 中不依赖 canvas/renderer 的方法：
 *   - _buildTimeline / _buildTimelineWindow  时间轴事件收集
 *   - _autoResolveBattle                      AI 自动结算攻城
 *   - _autoResolveInterception                AI 自动结算野战
 *   - _enterCity                              将领进城（含驻守上限）
 *   - _resolveArrival                         行军到达处理
 *   - _resolveInterception                    拦截触发（玩家 vs AI）
 *   - _checkRealtimeEvents                    实时事件检测
 */

import { WorldMapLogic } from '../../js/scenes/worldmap_logic.js';
import {
    createMockGameState,
    createMockGeneral,
    createMockCity,
    createMockFaction,
} from '../helpers/mockGameState.js';

// ─────────────────────────────────────────────
// 辅助：构建最小化 WorldMapLogic 实例
// ─────────────────────────────────────────────

/**
 * 默认地图：
 *   city_a (player_fac, x=100) ── city_b (enemy_fac, x=200) ── city_c (player_fac, x=300)
 */
function makeWML(gsOverrides = {}, callbacks = {}) {
    const cityA = createMockCity({ id: 'city_a', owner: 'player_fac', x: 100, y: 100, neighbors: ['city_b'], generals: [] });
    const cityB = createMockCity({ id: 'city_b', owner: 'enemy_fac',  x: 200, y: 100, neighbors: ['city_a', 'city_c'], generals: [] });
    const cityC = createMockCity({ id: 'city_c', owner: 'player_fac', x: 300, y: 100, neighbors: ['city_b'], generals: [] });
    const playerFac = createMockFaction({ id: 'player_fac', isPlayer: true, gold: 50000 });
    const enemyFac  = createMockFaction({ id: 'enemy_fac', gold: 50000 });
    const gen1 = createMockGeneral({ id: 'g1', faction: 'player_fac', city: 'city_a', soldiers: 1000 });
    const gen2 = createMockGeneral({ id: 'g2', faction: 'enemy_fac',  city: 'city_b', soldiers: 800  });

    const gs = createMockGameState({
        playerFaction: 'player_fac',
        cities: [cityA, cityB, cityC],
        factions: [playerFac, enemyFac],
        generals: [gen1, gen2],
        ...gsOverrides,
    });

    const cb = {
        onTurnReport:    jest.fn(),
        onMarchNote:     jest.fn(),
        onBattleFlash:   jest.fn(),
        startNextBattle: jest.fn(),
        ...callbacks,
    };

    return { wml: new WorldMapLogic(gs, cb), gs, cb, gen1, gen2, cityA, cityB, cityC, playerFac, enemyFac };
}

// ─────────────────────────────────────────────
// _buildTimeline
// ─────────────────────────────────────────────
describe('WorldMapLogic._buildTimeline()', () => {
    test('无行军时返回空事件列表', () => {
        const { wml } = makeWML();
        expect(wml._buildTimeline(1)).toEqual([]);
    });

    test('到达事件在窗口内 [currentTurn, currentTurn+1) 被收集', () => {
        const { wml, gs } = makeWML();
        // arrivalTurn = 1.5，currentTurn=1 → 窗口 [1, 2)
        gs.marches.push({
            id: 1, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 1.5, arrivalTurn: 1.5, progress: 0,
        });
        const events = wml._buildTimeline(1);
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('arrive');
    });

    test('到达事件在窗口外不被收集', () => {
        const { wml, gs } = makeWML();
        gs.marches.push({
            id: 1, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 3, arrivalTurn: 3, progress: 0,
        });
        const events = wml._buildTimeline(1);
        expect(events.length).toBe(0);
    });

    test('两军相向 attack 行军产生 meet 事件', () => {
        const { wml, gs } = makeWML();
        // A: city_a→city_b, depart=0, travel=2, arrival=2
        // B: city_b→city_a, depart=0, travel=2, arrival=2
        // meetTurn = (2*2 + 0*2 + 0*2)/(2+2) = 1.0，在窗口 [1,2) 内
        gs.marches.push({
            id: 1, type: 'attack', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5,
        });
        gs.marches.push({
            id: 2, type: 'attack', faction: 'enemy_fac',
            generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_a',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5,
        });
        const events = wml._buildTimeline(1);
        const meetEvents = events.filter(e => e.type === 'meet');
        expect(meetEvents.length).toBe(1);
    });

    test('meet 事件排在同 eventTurn 的 arrive 事件之前', () => {
        const { wml, gs } = makeWML();
        // meet 在 turn=1.0
        gs.marches.push({
            id: 1, type: 'attack', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5,
        });
        gs.marches.push({
            id: 2, type: 'attack', faction: 'enemy_fac',
            generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_a',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5,
        });
        // arrive 也在 turn=1.0
        gs.marches.push({
            id: 3, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 1, arrivalTurn: 1.0, progress: 1,
        });
        const events = wml._buildTimeline(1);
        expect(events[0].type).toBe('meet');
        expect(events[1].type).toBe('arrive');
    });

    test('同一对行军不重复生成 meet 事件', () => {
        const { wml, gs } = makeWML();
        gs.marches.push({
            id: 1, type: 'attack', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5,
        });
        gs.marches.push({
            id: 2, type: 'attack', faction: 'enemy_fac',
            generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_a',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5,
        });
        const events = wml._buildTimeline(1);
        expect(events.filter(e => e.type === 'meet').length).toBe(1);
    });
});

// ─────────────────────────────────────────────
// _buildTimelineWindow
// ─────────────────────────────────────────────
describe('WorldMapLogic._buildTimelineWindow()', () => {
    test('窗口 (1.0, 2.0] 包含 arrivalTurn=1.5 的事件', () => {
        const { wml, gs } = makeWML();
        gs.marches.push({
            id: 1, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 1.5, arrivalTurn: 1.5, progress: 0,
        });
        const events = wml._buildTimelineWindow(1.0, 2.0);
        expect(events.length).toBe(1);
    });

    test('窗口 (1.0, 2.0] 不包含 arrivalTurn=1.0 的事件（边界排除）', () => {
        const { wml, gs } = makeWML();
        gs.marches.push({
            id: 1, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 1, arrivalTurn: 1.0, progress: 0,
        });
        const events = wml._buildTimelineWindow(1.0, 2.0);
        expect(events.length).toBe(0);
    });

    test('窗口 (1.0, 2.0] 包含 arrivalTurn=2.0 的事件（边界包含）', () => {
        const { wml, gs } = makeWML();
        gs.marches.push({
            id: 1, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 2, arrivalTurn: 2.0, progress: 0,
        });
        const events = wml._buildTimelineWindow(1.0, 2.0);
        expect(events.length).toBe(1);
    });
});

// ─────────────────────────────────────────────
// _autoResolveBattle
// ─────────────────────────────────────────────
describe('WorldMapLogic._autoResolveBattle()', () => {
    test('攻方战力压倒性优势时：城市易主，攻方将领进驻', () => {
        const { wml, gs, gen1, gen2, cityB } = makeWML();
        // 确保 city_b 没有守将（gen2 不在 city_b）
        gen2.city = 'city_c';
        cityB.generals = [];
        cityB.defense = 0;

        const attackerFac = gs.getFaction('player_fac');
        gen1.city = 'city_a';

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
        wml._autoResolveBattle([gen1], 'city_b', attackerFac, 'city_a');
        spy.mockRestore();

        expect(gs.getCity('city_b').owner).toBe('player_fac');
    });

    test('攻方战力弱时：攻方撤退，城市不易主', () => {
        const { wml, gs, gen1, gen2, cityB } = makeWML();
        const attackerFac = gs.getFaction('player_fac');

        // 给 city_b 一个超强守将
        gen2.war = 99; gen2.lead = 99; gen2.soldiers = 5000;
        gen2.city = 'city_b';
        cityB.generals = ['g2'];

        // 让 math.random 返回低值使攻方弱
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.1);
        wml._autoResolveBattle([gen1], 'city_b', attackerFac, 'city_a');
        spy.mockRestore();

        expect(gs.getCity('city_b').owner).toBe('enemy_fac'); // 城市不易主
    });

    test('守方势力被消灭时 faction.alive = false', () => {
        const { wml, gs, gen1, gen2, cityB, enemyFac } = makeWML();
        // enemy 只有 city_b，攻方胜后 enemy 应被标记消灭
        // 确保 city_c 不属于 enemy
        gs.getCity('city_c').owner = 'player_fac';
        // gen2 不在 city_b（无守将）
        gen2.city = null;
        cityB.generals = [];
        cityB.defense = 0;

        const attackerFac = gs.getFaction('player_fac');

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
        wml._autoResolveBattle([gen1], 'city_b', attackerFac, 'city_a');
        spy.mockRestore();

        expect(enemyFac.alive).toBe(false);
    });

    test('攻方胜利后守方将领 soldiers 减少到 30%', () => {
        const { wml, gs, gen1, gen2, cityB } = makeWML();
        // 弱化守将：war/lead 设为 1，使攻方必胜
        gen2.city = 'city_b';
        gen2.war = 1; gen2.lead = 1;
        gen2.soldiers = 1000;
        cityB.generals = ['g2'];
        cityB.defense = 0;
        // 添加另一个 enemy 城市供守方撤退
        const cityD = createMockCity({ id: 'city_d', owner: 'enemy_fac', x: 400, y: 100, neighbors: ['city_b'], generals: [] });
        gs.cities.push(cityD);

        // gen1: war=80, lead=70, soldiers=1000 → atkPower_base = 160
        // gen2: war=1, lead=1, soldiers=1000 → defPower_base = 12
        // 无论随机数如何，atkPower >> defPower
        const attackerFac = gs.getFaction('player_fac');
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
        wml._autoResolveBattle([gen1], 'city_b', attackerFac, 'city_a');
        spy.mockRestore();

        expect(gen2.soldiers).toBe(300); // 1000 * 0.3
    });
});

// ─────────────────────────────────────────────
// _autoResolveInterception
// ─────────────────────────────────────────────
describe('WorldMapLogic._autoResolveInterception()', () => {
    function makeMarchPair(factionA, factionB) {
        return [
            { id: 1, type: 'attack', faction: factionA, generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5 },
            { id: 2, type: 'attack', faction: factionB, generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_a', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5 },
        ];
    }

    test('胜方 soldiers 减少到 80%', () => {
        const { wml, gs, gen1, gen2 } = makeWML();
        gen1.soldiers = 1000;
        gen2.soldiers = 200; // gen1 明显更强
        const [marchA, marchB] = makeMarchPair('player_fac', 'enemy_fac');

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        wml._autoResolveInterception(marchA, [gen1], marchB, [gen2]);
        spy.mockRestore();

        expect(gen1.soldiers).toBe(800); // 1000 * 0.8
    });

    test('败方 soldiers 减少到 40%', () => {
        const { wml, gs, gen1, gen2 } = makeWML();
        gen1.soldiers = 1000;
        gen2.soldiers = 200;
        const [marchA, marchB] = makeMarchPair('player_fac', 'enemy_fac');

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        wml._autoResolveInterception(marchA, [gen1], marchB, [gen2]);
        spy.mockRestore();

        expect(gen2.soldiers).toBe(80); // 200 * 0.4
    });

    test('胜方继续生成 attack 行军朝目标城', () => {
        const { wml, gs, gen1, gen2 } = makeWML();
        gen1.soldiers = 2000;
        gen2.soldiers = 100;
        const [marchA, marchB] = makeMarchPair('player_fac', 'enemy_fac');

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        wml._autoResolveInterception(marchA, [gen1], marchB, [gen2]);
        spy.mockRestore();

        const winnerMarch = gs.marches.find(m => m.faction === 'player_fac' && m.type === 'attack');
        expect(winnerMarch).toBeDefined();
        expect(winnerMarch.targetCity).toBe('city_b');
    });

    test('败方生成 transfer 撤退行军', () => {
        const { wml, gs, gen1, gen2 } = makeWML();
        gen1.soldiers = 2000;
        gen2.soldiers = 100;
        gen2.city = 'city_b';
        gs.getCity('city_b').generals = ['g2'];
        const [marchA, marchB] = makeMarchPair('player_fac', 'enemy_fac');

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        wml._autoResolveInterception(marchA, [gen1], marchB, [gen2]);
        spy.mockRestore();

        const loserMarch = gs.marches.find(m => m.faction === 'enemy_fac' && m.type === 'transfer');
        expect(loserMarch).toBeDefined();
        expect(loserMarch.targetCity).toBe('city_b'); // 撤回 loserMarch.sourceCity
    });
});

// ─────────────────────────────────────────────
// _enterCity
// ─────────────────────────────────────────────
describe('WorldMapLogic._enterCity()', () => {
    test('驻守未满：将领进城后 status=idle，city=cityId', () => {
        const { wml, gs, gen1 } = makeWML();
        gen1.city = null;
        wml._enterCity(gen1, 'city_a');
        expect(gen1.status).toBe('idle');
        expect(gen1.city).toBe('city_a');
    });

    test('将领被加入城市 generals 列表', () => {
        const { wml, gs, gen1 } = makeWML();
        gen1.city = null;
        gs.getCity('city_a').generals = [];
        wml._enterCity(gen1, 'city_a');
        expect(gs.getCity('city_a').generals).toContain('g1');
    });

    test('不重复添加将领到 generals 列表', () => {
        const { wml, gs, gen1 } = makeWML();
        gen1.city = 'city_a';
        gs.getCity('city_a').generals = ['g1'];
        wml._enterCity(gen1, 'city_a');
        const count = gs.getCity('city_a').generals.filter(id => id === 'g1').length;
        expect(count).toBe(1);
    });

    test('驻守已满（12人）：将领 status=encamped（无其他可用城市）', () => {
        const { wml, gs, gen1 } = makeWML();
        // 填满 city_a 驻守（生成 12 个 idle 将领）
        const idleGens = Array.from({ length: 12 }, (_, i) => {
            const g = createMockGeneral({ id: `fill_${i}`, faction: 'player_fac', city: 'city_a', status: 'idle' });
            gs.generals.push(g);
            gs.getCity('city_a').generals.push(g.id);
            return g;
        });
        // city_c 也填满
        Array.from({ length: 12 }, (_, i) => {
            const g = createMockGeneral({ id: `fill_c_${i}`, faction: 'player_fac', city: 'city_c', status: 'idle' });
            gs.generals.push(g);
            gs.getCity('city_c').generals.push(g.id);
        });

        gen1.city = null;
        wml._enterCity(gen1, 'city_a');

        expect(gen1.status).toBe('encamped');
    });

    test('驻守已满但有空位城市：将领被转移行军', () => {
        const { wml, gs, gen1 } = makeWML();
        // 填满 city_a（12个idle），city_c 未满
        Array.from({ length: 12 }, (_, i) => {
            const g = createMockGeneral({ id: `fill_${i}`, faction: 'player_fac', city: 'city_a', status: 'idle' });
            gs.generals.push(g);
            gs.getCity('city_a').generals.push(g.id);
        });
        // city_c 有空位
        gs.getCity('city_c').generals = [];

        gen1.city = null;
        wml._enterCity(gen1, 'city_a');

        expect(gen1.status).toBe('marching');
        expect(gs.marches.some(m => m.faction === 'player_fac' && m.targetCity === 'city_c')).toBe(true);
    });
});

// ─────────────────────────────────────────────
// _resolveArrival
// ─────────────────────────────────────────────
describe('WorldMapLogic._resolveArrival()', () => {
    function makeMarch(overrides = {}) {
        return {
            id: 99, type: 'transfer', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_c',
            departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 1,
            isRetreatBreakthrough: false, retreatFinalDestination: null,
            ...overrides,
        };
    }

    test('transfer 到达后行军从 gs.marches 移除', () => {
        const { wml, gs, gen1 } = makeWML();
        const march = makeMarch();
        gs.marches.push(march);
        gen1.city = null; gen1.status = 'marching';

        wml._resolveArrival(march);

        expect(gs.marches.find(m => m.id === 99)).toBeUndefined();
    });

    test('transfer 到达后将领进驻目标城', () => {
        const { wml, gs, gen1 } = makeWML();
        const march = makeMarch();
        gs.marches.push(march);
        gen1.city = null; gen1.status = 'marching';

        wml._resolveArrival(march);

        expect(gen1.city).toBe('city_c');
        expect(gen1.status).toBe('idle');
    });

    test('transfer 目标城被敌占：重定向到最近己方城市', () => {
        const { wml, gs, gen1 } = makeWML();
        // city_c 被占领
        gs.getCity('city_c').owner = 'enemy_fac';
        const march = makeMarch({ targetCity: 'city_c' });
        gs.marches.push(march);
        gen1.city = null; gen1.status = 'marching';

        wml._resolveArrival(march);

        // 生成新行军到己方城市（city_a）
        expect(gs.marches.some(m => m.faction === 'player_fac' && m.type === 'transfer' && m.sourceCity === 'city_c')).toBe(true);
    });

    test('attack 到达后目标城已是己方：将领直接进驻，返回 false', () => {
        const { wml, gs, gen1 } = makeWML();
        // city_b 已被玩家占领
        gs.getCity('city_b').owner = 'player_fac';
        const march = makeMarch({ type: 'attack', targetCity: 'city_b' });
        gs.marches.push(march);
        gen1.city = null; gen1.status = 'marching';

        const result = wml._resolveArrival(march);

        expect(result).toBe(false);
        expect(gen1.city).toBe('city_b');
    });

    test('attack 玩家参与（玩家进攻）：push 到 battleQueue，返回 true', () => {
        const { wml, gs, gen1 } = makeWML();
        const march = makeMarch({ type: 'attack', faction: 'player_fac', targetCity: 'city_b' });
        gs.marches.push(march);
        gen1.city = march.sourceCity; gen1.status = 'idle';
        gs.getCity('city_a').generals = ['g1'];

        const result = wml._resolveArrival(march);

        expect(result).toBe(true);
        expect(gs.battleQueue.length).toBeGreaterThan(0);
        const battleData = gs.battleQueue[0];
        expect(battleData.defenderCityId).toBe('city_b');
        expect(battleData.playerIsAttacker).toBe(true);
    });

    test('attack 敌方进攻玩家城市：push 到 battleQueue，返回 true', () => {
        const { wml, gs, gen2 } = makeWML();
        const march = makeMarch({ type: 'attack', faction: 'enemy_fac', targetCity: 'city_a', sourceCity: 'city_b' });
        gs.marches.push(march);
        gen2.city = 'city_b'; gen2.status = 'idle';
        gs.getCity('city_b').generals = ['g2'];

        const result = wml._resolveArrival(march);

        expect(result).toBe(true);
        expect(gs.battleQueue.length).toBeGreaterThan(0);
        const battleData = gs.battleQueue[0];
        expect(battleData.playerIsAttacker).toBe(false);
    });

    test('AI vs AI 攻城：自动结算，返回 false', () => {
        const { wml, gs } = makeWML();
        // 增加第三个势力
        const fac3 = createMockFaction({ id: 'fac3', gold: 50000 });
        const gen3 = createMockGeneral({ id: 'g3', faction: 'fac3', city: 'city_c', soldiers: 2000, war: 90, lead: 90 });
        const cityD = createMockCity({ id: 'city_d', owner: 'enemy_fac', x: 300, y: 200, neighbors: ['city_b'], generals: ['g2'] });
        gs.factions.push(fac3);
        gs.generals.push(gen3);
        gs.cities.push(cityD);
        gs.getCity('city_b').generals = ['g2'];

        const march = makeMarch({ type: 'attack', faction: 'fac3', targetCity: 'city_b', sourceCity: 'city_c' });
        gs.marches.push(march);
        gen3.city = 'city_c';
        gs.getCity('city_c').generals = ['g3'];

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
        const result = wml._resolveArrival(march);
        spy.mockRestore();

        expect(result).toBe(false);
        // battleQueue 不应被 push（不涉及玩家）
        expect(gs.battleQueue.length).toBe(0);
    });
});

// ─────────────────────────────────────────────
// _resolveInterception
// ─────────────────────────────────────────────
describe('WorldMapLogic._resolveInterception()', () => {
    function makeMarchPair() {
        return [
            { id: 1, type: 'attack', faction: 'player_fac', generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5 },
            { id: 2, type: 'attack', faction: 'enemy_fac',  generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_a', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5 },
        ];
    }

    test('玩家参与：推入 battleQueue，isInterception=true', () => {
        const { wml, gs } = makeWML();
        const [marchA, marchB] = makeMarchPair();
        wml._resolveInterception(marchA, marchB);

        expect(gs.battleQueue.length).toBe(1);
        expect(gs.battleQueue[0].isInterception).toBe(true);
    });

    test('玩家参与：玩家为 attackerMarch，playerSide=attacker', () => {
        const { wml, gs } = makeWML();
        const [marchA, marchB] = makeMarchPair();
        wml._resolveInterception(marchA, marchB);

        const data = gs.battleQueue[0];
        expect(data.attackerFactionId).toBe('player_fac');
        expect(data.defenderFactionId).toBe('enemy_fac');
        expect(data.playerSide).toBe('attacker');
    });

    test('AI vs AI：不推入 battleQueue，直接自动结算', () => {
        const { wml, gs } = makeWML();
        const fac3 = createMockFaction({ id: 'fac3' });
        const gen3 = createMockGeneral({ id: 'g3', faction: 'fac3', city: 'city_c', soldiers: 1000 });
        const cityD = createMockCity({ id: 'city_d', owner: 'fac3', x: 350, y: 100, neighbors: ['city_c'], generals: ['g3'] });
        gs.factions.push(fac3);
        gs.generals.push(gen3);
        gs.cities.push(cityD);

        const marchAI1 = { id: 3, type: 'attack', faction: 'enemy_fac', generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_d', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5 };
        const marchAI2 = { id: 4, type: 'attack', faction: 'fac3',      generalIds: ['g3'], sourceCity: 'city_d', targetCity: 'city_b', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.5 };

        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
        wml._resolveInterception(marchAI1, marchAI2);
        spy.mockRestore();

        expect(gs.battleQueue.length).toBe(0);
    });

    test('解析拦截时调用 onTurnReport 和 onMarchNote', () => {
        const { wml, gs, cb } = makeWML();
        const [marchA, marchB] = makeMarchPair();
        wml._resolveInterception(marchA, marchB);

        expect(cb.onTurnReport).toHaveBeenCalled();
        expect(cb.onMarchNote).toHaveBeenCalled();
    });
});

// ─────────────────────────────────────────────
// _checkRealtimeEvents
// ─────────────────────────────────────────────
describe('WorldMapLogic._checkRealtimeEvents()', () => {
    test('prevVT >= nowVT 时直接返回 false', () => {
        const { wml } = makeWML();
        expect(wml._checkRealtimeEvents(2, 2)).toBe(false);
        expect(wml._checkRealtimeEvents(3, 2)).toBe(false);
    });

    test('窗口内无事件：返回 false，不调用 startNextBattle', () => {
        const { wml, cb } = makeWML();
        const result = wml._checkRealtimeEvents(0, 1);
        expect(result).toBe(false);
        expect(cb.startNextBattle).not.toHaveBeenCalled();
    });

    test('检测到玩家 arrive 事件并触发 battle：调用 startNextBattle，返回 true', () => {
        const { wml, gs, gen1, cb } = makeWML();
        gen1.city = 'city_a';
        gs.getCity('city_a').generals = ['g1'];

        const march = {
            id: 1, type: 'attack', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b',
            departTurn: 0, travelTime: 1, arrivalTurn: 0.5,
            progress: 0, isRetreatBreakthrough: false,
        };
        gs.marches.push(march);

        const result = wml._checkRealtimeEvents(0, 1);

        expect(result).toBe(true);
        expect(cb.startNextBattle).toHaveBeenCalledTimes(1);
    });

    test('检测到 meet 事件并触发 battle：battleQueue 有条目，startNextBattle 被调用', () => {
        const { wml, gs, gen1, gen2, cb } = makeWML();
        // 两军相向，meetTurn=0.5 in window (0, 1]
        const marchA = { id: 1, type: 'attack', faction: 'player_fac', generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.25 };
        const marchB = { id: 2, type: 'attack', faction: 'enemy_fac',  generalIds: ['g2'], sourceCity: 'city_b', targetCity: 'city_a', departTurn: 0, travelTime: 2, arrivalTurn: 2, progress: 0.25 };
        gs.marches.push(marchA, marchB);

        const result = wml._checkRealtimeEvents(0, 1);

        expect(gs.battleQueue.length).toBeGreaterThan(0);
        expect(cb.startNextBattle).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    test('已处理行军不重复处理', () => {
        const { wml, gs, gen1, cb } = makeWML();
        gen1.city = 'city_a';
        gs.getCity('city_a').generals = ['g1'];

        const march = {
            id: 1, type: 'attack', faction: 'player_fac',
            generalIds: ['g1'], sourceCity: 'city_a', targetCity: 'city_b',
            departTurn: 0, travelTime: 1, arrivalTurn: 0.5,
            progress: 0, isRetreatBreakthrough: false,
        };
        gs.marches.push(march);

        wml._checkRealtimeEvents(0, 1);
        // 再次调用，march 已被移除，不再处理
        cb.startNextBattle.mockClear();
        const result2 = wml._checkRealtimeEvents(0, 1);

        expect(cb.startNextBattle).not.toHaveBeenCalled();
        expect(result2).toBe(false);
    });
});
