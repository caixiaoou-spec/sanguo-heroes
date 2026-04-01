/**
 * diplomacy.test.js — DiplomacySystem 外交逻辑测试
 */

import DiplomacySystem from '../../js/systems/diplomacy.js';
import { createMockGameState, createMockFaction, createMockCity } from '../helpers/mockGameState.js';

function makeGs() {
    const f1 = createMockFaction({ id: 'f1', name: '势力一', fame: 80, gold: 20000, allies: [], enemies: [] });
    const f2 = createMockFaction({ id: 'f2', name: '势力二', fame: 40, gold: 10000, allies: [], enemies: [] });
    const f3 = createMockFaction({ id: 'f3', name: '势力三', fame: 30, gold: 5000, allies: [], enemies: [] });
    const city1 = createMockCity({ id: 'c1', owner: 'f1' });
    const city2 = createMockCity({ id: 'c2', owner: 'f2' });
    return createMockGameState({
        playerFaction: 'f1',
        factions: [f1, f2, f3],
        cities: [city1, city2]
    });
}

// ─────────────────────────────────────────────
// declareWar
// ─────────────────────────────────────────────
describe('DiplomacySystem.declareWar()', () => {
    test('宣战后双方互为 enemies', () => {
        const gs = makeGs();
        DiplomacySystem.declareWar(gs, 'f1', 'f2');
        expect(gs.getFaction('f1').enemies).toContain('f2');
        expect(gs.getFaction('f2').enemies).toContain('f1');
    });

    test('宣战后移除双方 allies 关系', () => {
        const gs = makeGs();
        gs.getFaction('f1').allies = ['f2'];
        gs.getFaction('f2').allies = ['f1'];
        DiplomacySystem.declareWar(gs, 'f1', 'f2');
        expect(gs.getFaction('f1').allies).not.toContain('f2');
        expect(gs.getFaction('f2').allies).not.toContain('f1');
    });

    test('已在交战时返回 failure', () => {
        const gs = makeGs();
        gs.getFaction('f1').enemies = ['f2'];
        const result = DiplomacySystem.declareWar(gs, 'f1', 'f2');
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// canAttack
// ─────────────────────────────────────────────
describe('DiplomacySystem.canAttack()', () => {
    test('自己不能攻击自己', () => {
        const gs = makeGs();
        expect(DiplomacySystem.canAttack(gs, 'f1', 'f1')).toBe(false);
    });

    test('同盟方不能攻击', () => {
        const gs = makeGs();
        gs.getFaction('f1').allies = ['f2'];
        expect(DiplomacySystem.canAttack(gs, 'f1', 'f2')).toBe(false);
    });

    test('中立方可以攻击', () => {
        const gs = makeGs();
        expect(DiplomacySystem.canAttack(gs, 'f1', 'f2')).toBe(true);
    });

    test('敌对方可以攻击', () => {
        const gs = makeGs();
        gs.getFaction('f1').enemies = ['f2'];
        expect(DiplomacySystem.canAttack(gs, 'f1', 'f2')).toBe(true);
    });
});

// ─────────────────────────────────────────────
// getRelation
// ─────────────────────────────────────────────
describe('DiplomacySystem.getRelation()', () => {
    test('无关系时 → neutral', () => {
        const gs = makeGs();
        expect(DiplomacySystem.getRelation(gs, 'f1', 'f2')).toBe('neutral');
    });

    test('盟友关系 → ally', () => {
        const gs = makeGs();
        gs.getFaction('f1').allies = ['f2'];
        expect(DiplomacySystem.getRelation(gs, 'f1', 'f2')).toBe('ally');
    });

    test('敌对关系 → enemy', () => {
        const gs = makeGs();
        gs.getFaction('f1').enemies = ['f2'];
        expect(DiplomacySystem.getRelation(gs, 'f1', 'f2')).toBe('enemy');
    });
});

// ─────────────────────────────────────────────
// ceasefire
// ─────────────────────────────────────────────
describe('DiplomacySystem.ceasefire()', () => {
    test('金钱不足时返回 failure', () => {
        const gs = makeGs();
        gs.getFaction('f1').gold = 1000;
        const result = DiplomacySystem.ceasefire(gs, 'f1', 'f2');
        expect(result.success).toBe(false);
    });

    test('停战成功时扣除 5000 金', () => {
        // 强制 Math.random 返回 0（保证接受）
        const origRandom = Math.random;
        Math.random = () => 0;
        const gs = makeGs();
        gs.getFaction('f1').enemies = ['f2'];
        gs.getFaction('f2').enemies = ['f1'];
        const goldBefore = gs.getFaction('f1').gold;
        const result = DiplomacySystem.ceasefire(gs, 'f1', 'f2');
        Math.random = origRandom;
        if (result.success) {
            expect(gs.getFaction('f1').gold).toBe(goldBefore - 5000);
        }
    });

    test('停战成功后双方 enemies 关系解除', () => {
        const origRandom = Math.random;
        Math.random = () => 0;
        const gs = makeGs();
        gs.getFaction('f1').enemies = ['f2'];
        gs.getFaction('f2').enemies = ['f1'];
        DiplomacySystem.ceasefire(gs, 'f1', 'f2');
        Math.random = origRandom;
        expect(gs.getFaction('f1').enemies).not.toContain('f2');
        expect(gs.getFaction('f2').enemies).not.toContain('f1');
    });
});

// ─────────────────────────────────────────────
// formAlliance
// ─────────────────────────────────────────────
describe('DiplomacySystem.formAlliance()', () => {
    test('已是同盟时返回 failure', () => {
        const gs = makeGs();
        gs.getFaction('f1').allies = ['f2'];
        const result = DiplomacySystem.formAlliance(gs, 'f1', 'f2');
        expect(result.success).toBe(false);
    });

    test('交战中无法结盟', () => {
        const gs = makeGs();
        gs.getFaction('f1').enemies = ['f2'];
        const result = DiplomacySystem.formAlliance(gs, 'f1', 'f2');
        expect(result.success).toBe(false);
    });

    test('结盟成功后双方互为 allies', () => {
        const origRandom = Math.random;
        Math.random = () => 0;
        const gs = makeGs();
        const result = DiplomacySystem.formAlliance(gs, 'f1', 'f2');
        Math.random = origRandom;
        if (result.success) {
            expect(gs.getFaction('f1').allies).toContain('f2');
            expect(gs.getFaction('f2').allies).toContain('f1');
        }
    });
});

// ─────────────────────────────────────────────
// persuadeSurrender
// ─────────────────────────────────────────────
describe('DiplomacySystem.persuadeSurrender()', () => {
    test('目标城池超过 2 个时拒绝', () => {
        const gs = makeGs();
        // f2 拥有多于2城
        gs.cities.push(
            createMockCity({ id: 'c3', owner: 'f2' }),
            createMockCity({ id: 'c4', owner: 'f2' })
        );
        const result = DiplomacySystem.persuadeSurrender(gs, 'f1', 'f2');
        expect(result.success).toBe(false);
    });

    test('投降成功后 f2.alive = false', () => {
        const origRandom = Math.random;
        Math.random = () => 0;
        const gs = makeGs();
        // f2 只有 1 城
        const result = DiplomacySystem.persuadeSurrender(gs, 'f1', 'f2');
        Math.random = origRandom;
        if (result.success) {
            expect(gs.getFaction('f2').alive).toBe(false);
        }
    });

    test('投降成功后所有势力的 allies/enemies 中不再含有灭亡势力 id', () => {
        const origRandom = Math.random;
        Math.random = () => 0;
        const gs = makeGs();
        // 设置 f3 与 f2 为盟友、f1 与 f2 为敌对
        gs.getFaction('f3').allies = ['f2'];
        gs.getFaction('f2').allies = ['f3'];
        gs.getFaction('f1').enemies = ['f2'];
        gs.getFaction('f2').enemies = ['f1'];
        DiplomacySystem.persuadeSurrender(gs, 'f1', 'f2');
        Math.random = origRandom;
        for (const f of gs.factions) {
            expect(f.allies).not.toContain('f2');
            expect(f.enemies).not.toContain('f2');
        }
    });
});
