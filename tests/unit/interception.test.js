/**
 * interception.test.js — 路途相遇拦截逻辑测试
 *
 * 由于 WorldMapScene 依赖 canvas/game 全局 API，这里构建一个最小化的测试替身
 * (TestInterceptor)，内联了 worldmap.js 中的三个纯逻辑方法：
 *   _checkMarchInterceptions / _resolveInterception / _autoResolveInterception
 *
 * 这样可以对逻辑做全面测试，同时不触碰 DOM/Canvas。
 */

import {
    createMockGameState,
    createMockGeneral,
    createMockCity,
    createMockFaction,
} from '../helpers/mockGameState.js';

// ─────────────────────────────────────────────
// 测试替身：复制自 worldmap.js 的纯逻辑部分
// ─────────────────────────────────────────────
class TestInterceptor {
    constructor(gs) {
        this.gs = gs;
        this._turnReports = [];
        this._marchNotifications = [];
    }

    // --- 直接内联自 worldmap.js ---

    _checkMarchInterceptions() {
        const marches = this.gs.marches;
        const intercepted = new Set();

        for (let i = 0; i < marches.length; i++) {
            const a = marches[i];
            if (intercepted.has(a.id)) continue;
            if (a.type !== 'attack') continue;

            for (let j = i + 1; j < marches.length; j++) {
                const b = marches[j];
                if (intercepted.has(b.id)) continue;
                if (b.type !== 'attack') continue;

                if (a.faction === b.faction) continue;

                const isOpposite = (a.sourceCity === b.targetCity && a.targetCity === b.sourceCity);
                if (!isOpposite) continue;

                if (a.progress + b.progress < 1) continue;

                intercepted.add(a.id);
                intercepted.add(b.id);

                this._resolveInterception(a, b);
                break; // march A is consumed; stop looking for more matches for it
            }
        }

        if (intercepted.size > 0) {
            this.gs.marches = this.gs.marches.filter(m => !intercepted.has(m.id));
        }
    }

    _resolveInterception(marchA, marchB) {
        const gs = this.gs;
        const playerFaction = gs.playerFaction;
        const aIsPlayer = marchA.faction === playerFaction;
        const bIsPlayer = marchB.faction === playerFaction;
        const playerInvolved = aIsPlayer || bIsPlayer;

        const generalsA = marchA.generalIds.map(id => gs.getGeneral(id)).filter(Boolean);
        const generalsB = marchB.generalIds.map(id => gs.getGeneral(id)).filter(Boolean);

        const factionAName = (gs.getFaction(marchA.faction) || {}).name || '未知';
        const factionBName = (gs.getFaction(marchB.faction) || {}).name || '未知';
        const cityAName = (gs.getCity(marchA.targetCity) || {}).name || '???';
        const msgText = `${factionAName}与${factionBName}的军队在前往${cityAName}途中相遇，爆发野战！`;
        this._turnReports.push({ text: msgText, type: 'warning' });
        this._marchNotifications.push({ text: msgText, timer: 4.0 });

        if (playerInvolved) {
            const attackerMarch = aIsPlayer ? marchA : marchB;
            const defenderMarch = aIsPlayer ? marchB : marchA;
            const attackerIds = attackerMarch.generalIds;
            const defenderIds = defenderMarch.generalIds;
            const attackerFactionId = attackerMarch.faction;
            const defenderFactionId = defenderMarch.faction;
            const playerSide = aIsPlayer ? 'attacker' : 'defender';

            for (const gen of [...generalsA, ...generalsB]) {
                gen.city = null;
                gen.status = 'marching';
            }

            gs.battleQueue.push({
                isInterception: true,
                attackerIds,
                defenderIds,
                attackerFactionId,
                defenderFactionId,
                playerSide,
                attackerSourceCity: attackerMarch.sourceCity,
                defenderSourceCity: defenderMarch.sourceCity,
                attackerTargetCity: attackerMarch.targetCity,
                defenderTargetCity: defenderMarch.targetCity,
            });
        } else {
            this._autoResolveInterception(marchA, generalsA, marchB, generalsB);
        }
    }

    _autoResolveInterception(marchA, generalsA, marchB, generalsB) {
        const gs = this.gs;
        let powerA = generalsA.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0);
        let powerB = generalsB.reduce((s, g) => s + g.war + g.lead + g.soldiers * 0.01, 0);
        powerA *= (0.8 + Math.random() * 0.4);
        powerB *= (0.8 + Math.random() * 0.4);

        const winnersWin = powerA >= powerB;
        const winners = winnersWin ? generalsA : generalsB;
        const losers  = winnersWin ? generalsB : generalsA;
        const winnerMarch = winnersWin ? marchA : marchB;
        const loserMarch  = winnersWin ? marchB : marchA;

        for (const gen of winners) {
            gen.soldiers = Math.floor(gen.soldiers * 0.8);
            gen.status = 'marching';
        }
        if (winners.length > 0) {
            const winnerIds = winners.map(g => g.id);
            gs.createMarch('attack', winnerMarch.faction, winnerIds, winnerMarch.sourceCity, winnerMarch.targetCity);
        }

        for (const gen of losers) {
            gen.soldiers = Math.floor(gen.soldiers * 0.4);
            const srcCity = gs.getCity(loserMarch.sourceCity);
            if (srcCity) {
                gen.city = srcCity.id;
                gen.status = 'idle';
                if (!srcCity.generals.includes(gen.id)) srcCity.generals.push(gen.id);
            } else {
                gen.status = 'idle';
            }
        }
    }
}

// ─────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────

/**
 * 创建含两座城市、两个势力、各两名武将的标准测试环境
 * cityA(0,0)  ←→  cityB(100,0)   (距离=100, turnsTotal=2)
 */
function makeEnv({ playerFaction = 'faction_ai1', ai2Faction = 'faction_ai2' } = {}) {
    const cityA = createMockCity({ id: 'cityA', name: 'A城', x: 0,   y: 0,   owner: 'faction_ai1', generals: [] });
    const cityB = createMockCity({ id: 'cityB', name: 'B城', x: 100, y: 0,   owner: 'faction_ai2', generals: [] });
    const factionA = createMockFaction({ id: 'faction_ai1', name: '势力甲', isPlayer: playerFaction === 'faction_ai1' });
    const factionB = createMockFaction({ id: 'faction_ai2', name: '势力乙', isPlayer: playerFaction === 'faction_ai2' });
    const genA1 = createMockGeneral({ id: 'genA1', faction: 'faction_ai1', city: 'cityA', war: 80, lead: 70, soldiers: 1000, status: 'idle' });
    const genA2 = createMockGeneral({ id: 'genA2', faction: 'faction_ai1', city: 'cityA', war: 75, lead: 65, soldiers: 800,  status: 'idle' });
    const genB1 = createMockGeneral({ id: 'genB1', faction: 'faction_ai2', city: 'cityB', war: 70, lead: 60, soldiers: 900,  status: 'idle' });
    const genB2 = createMockGeneral({ id: 'genB2', faction: 'faction_ai2', city: 'cityB', war: 65, lead: 55, soldiers: 700,  status: 'idle' });

    const gs = createMockGameState({
        playerFaction,
        cities: [cityA, cityB],
        factions: [factionA, factionB],
        generals: [genA1, genA2, genB1, genB2],
        skills: [],
        battleQueue: [],
    });
    // Ensure battleQueue exists
    if (!gs.battleQueue) gs.battleQueue = [];

    const interceptor = new TestInterceptor(gs);
    return { gs, interceptor, cityA, cityB, factionA, factionB, genA1, genA2, genB1, genB2 };
}

/**
 * 手动向 gs.marches 插入 march（不走 createMarch 距离计算）
 */
function pushMarch(gs, { id, type='attack', faction, generalIds, sourceCity, targetCity, progress }) {
    gs.marches.push({ id, type, faction, generalIds, sourceCity, targetCity, progress, turnsTotal: 2, turnsRemaining: 1, animProgress: progress });
}

// ─────────────────────────────────────────────
// 1. _checkMarchInterceptions — 触发条件
// ─────────────────────────────────────────────

describe('_checkMarchInterceptions() — 触发条件', () => {
    test('相向行军 progress 之和 >= 1 时触发拦截', () => {
        const { gs, interceptor } = makeEnv();
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 });
        pushMarch(gs, { id: 2, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 });

        interceptor._checkMarchInterceptions();

        // Both marches should have been removed (intercepted)
        expect(gs.marches.filter(m => m.id === 1 || m.id === 2)).toHaveLength(0);
    });

    test('相向行军 progress 之和 < 1 时不触发拦截', () => {
        const { gs, interceptor } = makeEnv();
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.3 });
        pushMarch(gs, { id: 2, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.3 });

        interceptor._checkMarchInterceptions();

        // Neither march should be removed
        expect(gs.marches).toHaveLength(2);
    });

    test('同向行军（非对向路线）不触发拦截', () => {
        const { gs, interceptor, cityA } = makeEnv();
        // Both heading from A to B (same faction, same direction — won't match opposite check)
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.6 });
        pushMarch(gs, { id: 2, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.6 });

        interceptor._checkMarchInterceptions();

        expect(gs.marches).toHaveLength(2);
    });

    test('同一势力的相向行军不触发拦截', () => {
        const { gs, interceptor } = makeEnv();
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 });
        pushMarch(gs, { id: 2, faction: 'faction_ai1', generalIds: ['genA2'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 });

        interceptor._checkMarchInterceptions();

        // Same faction — no interception
        expect(gs.marches).toHaveLength(2);
    });

    test('非 attack 类型的行军不参与拦截检测', () => {
        const { gs, interceptor } = makeEnv();
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.6 });
        gs.marches[0].type = 'reinforce'; // 改成增援类型
        pushMarch(gs, { id: 2, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.6 });

        interceptor._checkMarchInterceptions();

        expect(gs.marches).toHaveLength(2);
    });

    test('progress 之和恰好等于 1.0 时触发', () => {
        const { gs, interceptor } = makeEnv();
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 });
        pushMarch(gs, { id: 2, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 });

        interceptor._checkMarchInterceptions();

        expect(gs.marches.filter(m => m.id === 1 || m.id === 2)).toHaveLength(0);
    });

    test('一次只能拦截一对行军（同一行军不能被两次拦截）', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'some_other' });
        // Use high ids to avoid conflict with auto-generated march ids from createMarch
        gs._marchIdCounter = 100;
        // marchA vs marchB: interception
        // marchC opposes marchA on same route — but marchA is already intercepted
        pushMarch(gs, { id: 101, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 });
        pushMarch(gs, { id: 102, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 });
        pushMarch(gs, { id: 103, faction: 'faction_ai2', generalIds: ['genB2'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.6 });

        interceptor._checkMarchInterceptions();

        // march 101 & 102 intercepted; march 103 should survive (march 101 already consumed)
        expect(gs.marches.find(m => m.id === 103)).toBeTruthy();
        expect(gs.marches.find(m => m.id === 101)).toBeFalsy();
        expect(gs.marches.find(m => m.id === 102)).toBeFalsy();
    });
});

// ─────────────────────────────────────────────
// 2. _resolveInterception — 玩家参与时进入 battleQueue
// ─────────────────────────────────────────────

describe('_resolveInterception() — 玩家参与', () => {
    test('玩家在 A 方：将对决加入 battleQueue，isInterception=true', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'faction_ai1' });
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1', 'genA2'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 };

        interceptor._resolveInterception(marchA, marchB);

        expect(gs.battleQueue).toHaveLength(1);
        const entry = gs.battleQueue[0];
        expect(entry.isInterception).toBe(true);
        expect(entry.attackerFactionId).toBe('faction_ai1');
        expect(entry.defenderFactionId).toBe('faction_ai2');
        expect(entry.playerSide).toBe('attacker');
    });

    test('玩家在 B 方：playerSide 为 defender', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'faction_ai2' });
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 };

        interceptor._resolveInterception(marchA, marchB);

        expect(gs.battleQueue).toHaveLength(1);
        const entry = gs.battleQueue[0];
        expect(entry.playerSide).toBe('defender');
        expect(entry.attackerFactionId).toBe('faction_ai2'); // player is attacker side by convention
    });

    test('battleQueue 条目包含正确的 sourceCity 和 targetCity 信息', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'faction_ai1' });
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 };

        interceptor._resolveInterception(marchA, marchB);

        const entry = gs.battleQueue[0];
        expect(entry.attackerSourceCity).toBe('cityA');
        expect(entry.attackerTargetCity).toBe('cityB');
        expect(entry.defenderSourceCity).toBe('cityB');
        expect(entry.defenderTargetCity).toBe('cityA');
    });

    test('玩家参与时，所有武将 city 置 null，status 置 marching', () => {
        const { gs, interceptor, genA1, genA2, genB1 } = makeEnv({ playerFaction: 'faction_ai1' });
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1', 'genA2'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1'],           sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 };

        interceptor._resolveInterception(marchA, marchB);

        expect(genA1.city).toBeNull();
        expect(genA1.status).toBe('marching');
        expect(genA2.city).toBeNull();
        expect(genB1.city).toBeNull();
        expect(genB1.status).toBe('marching');
    });

    test('产生通知消息', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'faction_ai1' });
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 };

        interceptor._resolveInterception(marchA, marchB);

        expect(interceptor._turnReports.length).toBeGreaterThan(0);
        expect(interceptor._turnReports[0].type).toBe('warning');
        expect(interceptor._marchNotifications.length).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────
// 3. _resolveInterception — AI vs AI（不入 battleQueue）
// ─────────────────────────────────────────────

describe('_resolveInterception() — AI vs AI', () => {
    test('AI 双方拦截不加入 battleQueue', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'some_other_faction' });
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.5 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 };

        interceptor._resolveInterception(marchA, marchB);

        expect(gs.battleQueue).toHaveLength(0);
    });
});

// ─────────────────────────────────────────────
// 4. _autoResolveInterception — AI 自动解算
// ─────────────────────────────────────────────

describe('_autoResolveInterception() — AI 自动解算', () => {
    /**
     * 为了让测试结果可预期（不受随机因子影响），
     * 我们让胜利方具有压倒性的战力优势（士兵 x100），
     * 使得即使乘以最低随机系数 0.8 也远超对方 x 1.2。
     */
    function makeEnvWithDominance() {
        const cityA = createMockCity({ id: 'cityA', x: 0, y: 0, owner: 'faction_ai1', generals: [] });
        const cityB = createMockCity({ id: 'cityB', x: 100, y: 0, owner: 'faction_ai2', generals: [] });
        const fA = createMockFaction({ id: 'faction_ai1', name: '强势力' });
        const fB = createMockFaction({ id: 'faction_ai2', name: '弱势力' });
        // genA 有 100000 士兵 → powerA ≈ 1000 + 80 + 70 >> powerB
        const genA = createMockGeneral({ id: 'genA', faction: 'faction_ai1', city: 'cityA', war: 80, lead: 70, soldiers: 100000 });
        const genB = createMockGeneral({ id: 'genB', faction: 'faction_ai2', city: 'cityB', war: 10, lead: 10, soldiers: 1 });
        const gs = createMockGameState({
            playerFaction: 'some_other',
            cities: [cityA, cityB],
            factions: [fA, fB],
            generals: [genA, genB],
            skills: [],
            battleQueue: [],
        });
        if (!gs.battleQueue) gs.battleQueue = [];
        const interceptor = new TestInterceptor(gs);
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA'], sourceCity: 'cityA', targetCity: 'cityB', turnsTotal: 2, turnsRemaining: 1, progress: 0.5, animProgress: 0 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB'], sourceCity: 'cityB', targetCity: 'cityA', turnsTotal: 2, turnsRemaining: 1, progress: 0.5, animProgress: 0 };
        return { gs, interceptor, marchA, marchB, genA, genB, cityA, cityB };
    }

    test('胜利方武将 status 变为 marching（继续进军）', () => {
        const { gs, interceptor, marchA, marchB, genA, genB } = makeEnvWithDominance();
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);
        expect(genA.status).toBe('marching');
    });

    test('胜利方武将士兵数减少为原来的 0.8', () => {
        const { interceptor, marchA, marchB, genA, genB } = makeEnvWithDominance();
        const originalSoldiers = genA.soldiers;
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);
        expect(genA.soldiers).toBe(Math.floor(originalSoldiers * 0.8));
    });

    test('胜利方创建新的进军行军（继续向原目标前进）', () => {
        const { gs, interceptor, marchA, marchB, genA, genB } = makeEnvWithDominance();
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);

        // A new march should have been created for the winner
        const newMarches = gs.marches;
        expect(newMarches.length).toBeGreaterThan(0);
        const winnerMarch = newMarches.find(m => m.faction === 'faction_ai1');
        expect(winnerMarch).toBeTruthy();
        expect(winnerMarch.targetCity).toBe('cityB');
        expect(winnerMarch.generalIds).toContain('genA');
    });

    test('失败方武将士兵数减少为原来的 0.4', () => {
        const { interceptor, marchA, marchB, genA, genB } = makeEnvWithDominance();
        const originalSoldiers = genB.soldiers;
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);
        expect(genB.soldiers).toBe(Math.floor(originalSoldiers * 0.4));
    });

    test('失败方武将撤回到己方出发城（sourceCity）', () => {
        const { interceptor, marchA, marchB, genA, genB } = makeEnvWithDominance();
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);
        // genB was in marchB which sourced from cityB
        expect(genB.city).toBe('cityB');
        expect(genB.status).toBe('idle');
    });

    test('失败方武将加回到出发城的 generals 列表', () => {
        const { gs, interceptor, marchA, marchB, genA, genB, cityB } = makeEnvWithDominance();
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);
        expect(cityB.generals).toContain('genB');
    });

    test('失败方不新建行军', () => {
        const { gs, interceptor, marchA, marchB, genA, genB } = makeEnvWithDominance();
        interceptor._autoResolveInterception(marchA, [genA], marchB, [genB]);
        // Only winner march should exist
        const loserMarch = gs.marches.find(m => m.faction === 'faction_ai2');
        expect(loserMarch).toBeFalsy();
    });

    test('多武将情形：每名败方武将都撤退到 sourceCity', () => {
        const cityA = createMockCity({ id: 'cityA', x: 0, y: 0, owner: 'faction_ai1', generals: [] });
        const cityB = createMockCity({ id: 'cityB', x: 100, y: 0, owner: 'faction_ai2', generals: [] });
        const fA = createMockFaction({ id: 'faction_ai1' });
        const fB = createMockFaction({ id: 'faction_ai2' });
        const genA1 = createMockGeneral({ id: 'genA1', faction: 'faction_ai1', war: 90, lead: 90, soldiers: 100000 });
        const genA2 = createMockGeneral({ id: 'genA2', faction: 'faction_ai1', war: 90, lead: 90, soldiers: 100000 });
        const genB1 = createMockGeneral({ id: 'genB1', faction: 'faction_ai2', war: 10, lead: 10, soldiers: 1 });
        const genB2 = createMockGeneral({ id: 'genB2', faction: 'faction_ai2', war: 10, lead: 10, soldiers: 1 });
        const gs = createMockGameState({
            playerFaction: 'other',
            cities: [cityA, cityB],
            factions: [fA, fB],
            generals: [genA1, genA2, genB1, genB2],
            skills: [],
            battleQueue: [],
        });
        if (!gs.battleQueue) gs.battleQueue = [];
        const interceptor = new TestInterceptor(gs);
        const marchA = { id: 1, type: 'attack', faction: 'faction_ai1', generalIds: ['genA1', 'genA2'], sourceCity: 'cityA', targetCity: 'cityB', turnsTotal: 2, turnsRemaining: 1, progress: 0.5, animProgress: 0 };
        const marchB = { id: 2, type: 'attack', faction: 'faction_ai2', generalIds: ['genB1', 'genB2'], sourceCity: 'cityB', targetCity: 'cityA', turnsTotal: 2, turnsRemaining: 1, progress: 0.5, animProgress: 0 };

        interceptor._autoResolveInterception(marchA, [genA1, genA2], marchB, [genB1, genB2]);

        expect(genB1.city).toBe('cityB');
        expect(genB2.city).toBe('cityB');
        expect(genB1.status).toBe('idle');
        expect(genB2.status).toBe('idle');
        expect(cityB.generals).toContain('genB1');
        expect(cityB.generals).toContain('genB2');
    });
});

// ─────────────────────────────────────────────
// 5. 端到端：_checkMarchInterceptions 与 _autoResolveInterception 协作
// ─────────────────────────────────────────────

describe('端到端：_checkMarchInterceptions 触发 AI 自动解算', () => {
    test('触发拦截后，原两支行军从 marches 中移除', () => {
        const { gs, interceptor } = makeEnv({ playerFaction: 'some_other' });
        pushMarch(gs, { id: 10, faction: 'faction_ai1', generalIds: ['genA1'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.6 });
        pushMarch(gs, { id: 11, faction: 'faction_ai2', generalIds: ['genB1'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 });

        interceptor._checkMarchInterceptions();

        expect(gs.marches.find(m => m.id === 10)).toBeFalsy();
        expect(gs.marches.find(m => m.id === 11)).toBeFalsy();
    });

    test('AI 触发拦截后，胜利方产生新的行军', () => {
        // Make genA1 overwhelmingly strong to guarantee it wins
        const cityA = createMockCity({ id: 'cityA', x: 0, y: 0, owner: 'faction_ai1', generals: [] });
        const cityB = createMockCity({ id: 'cityB', x: 100, y: 0, owner: 'faction_ai2', generals: [] });
        const fA = createMockFaction({ id: 'faction_ai1' });
        const fB = createMockFaction({ id: 'faction_ai2' });
        const strongGen = createMockGeneral({ id: 'genStrong', faction: 'faction_ai1', war: 99, lead: 99, soldiers: 500000 });
        const weakGen   = createMockGeneral({ id: 'genWeak',   faction: 'faction_ai2', war: 1,  lead: 1,  soldiers: 1 });
        const gs = createMockGameState({
            playerFaction: 'other',
            cities: [cityA, cityB],
            factions: [fA, fB],
            generals: [strongGen, weakGen],
            skills: [],
            battleQueue: [],
        });
        if (!gs.battleQueue) gs.battleQueue = [];
        const interceptor = new TestInterceptor(gs);

        pushMarch(gs, { id: 10, faction: 'faction_ai1', generalIds: ['genStrong'], sourceCity: 'cityA', targetCity: 'cityB', progress: 0.6 });
        pushMarch(gs, { id: 11, faction: 'faction_ai2', generalIds: ['genWeak'],   sourceCity: 'cityB', targetCity: 'cityA', progress: 0.5 });

        interceptor._checkMarchInterceptions();

        // A new march for the winner should exist
        const winnerMarch = gs.marches.find(m => m.faction === 'faction_ai1');
        expect(winnerMarch).toBeTruthy();
        expect(winnerMarch.targetCity).toBe('cityB');
    });

    test('不相交路线上的行军互不干扰', () => {
        const cityA = createMockCity({ id: 'cityA', x: 0,   y: 0, owner: 'faction_ai1', generals: [] });
        const cityB = createMockCity({ id: 'cityB', x: 100, y: 0, owner: 'faction_ai2', generals: [] });
        const cityC = createMockCity({ id: 'cityC', x: 200, y: 0, owner: 'faction_ai2', generals: [] });
        const fA = createMockFaction({ id: 'faction_ai1' });
        const fB = createMockFaction({ id: 'faction_ai2' });
        const genA = createMockGeneral({ id: 'genA', faction: 'faction_ai1', city: 'cityA', war: 80, lead: 70, soldiers: 1000 });
        const genB = createMockGeneral({ id: 'genB', faction: 'faction_ai2', city: 'cityB', war: 70, lead: 60, soldiers: 900 });
        const gs = createMockGameState({
            playerFaction: 'other',
            cities: [cityA, cityB, cityC],
            factions: [fA, fB],
            generals: [genA, genB],
            skills: [],
            battleQueue: [],
        });
        if (!gs.battleQueue) gs.battleQueue = [];
        const interceptor = new TestInterceptor(gs);

        // A→C and B→A: different routes, should NOT intercept
        pushMarch(gs, { id: 1, faction: 'faction_ai1', generalIds: ['genA'], sourceCity: 'cityA', targetCity: 'cityC', progress: 0.6 });
        pushMarch(gs, { id: 2, faction: 'faction_ai2', generalIds: ['genB'], sourceCity: 'cityB', targetCity: 'cityA', progress: 0.6 });

        interceptor._checkMarchInterceptions();

        expect(gs.marches).toHaveLength(2);
    });
});
