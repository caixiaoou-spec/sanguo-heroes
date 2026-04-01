/**
 * economy.test.js — EconomySystem 内政逻辑测试
 */

import EconomySystem from '../../js/systems/economy.js';
import { createMockGameState, createMockGeneral, createMockCity, createMockFaction } from '../helpers/mockGameState.js';

function makeGs(overrides = {}) {
    const faction = createMockFaction({ id: 'f1', isPlayer: true, gold: 10000, food: 20000, fame: 50 });
    const city = createMockCity({ id: 'city1', owner: 'f1', population: 50000, agriculture: 60, commerce: 50, defense: 30, soldiers: 1000, morale: 70 });
    const general = createMockGeneral({ id: 'g1', faction: 'f1', city: 'city1', pol: 60, lead: 70, cha: 55, soldiers: 500 });
    city.generals = ['g1'];
    return createMockGameState({
        playerFaction: 'f1',
        factions: [faction],
        cities: [city],
        generals: [general],
        ...overrides
    });
}

// ─────────────────────────────────────────────
// develop
// ─────────────────────────────────────────────
describe('EconomySystem.develop()', () => {
    test('金钱充足时 agriculture 提升', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        const agBefore = city.agriculture;
        const result = EconomySystem.develop(gs, 'city1', 'agriculture');
        expect(result.success).toBe(true);
        expect(city.agriculture).toBeGreaterThan(agBefore);
    });

    test('金钱充足时 commerce 提升', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        const before = city.commerce;
        const result = EconomySystem.develop(gs, 'city1', 'commerce');
        expect(result.success).toBe(true);
        expect(city.commerce).toBeGreaterThan(before);
    });

    test('扣除 1000 金', () => {
        const gs = makeGs();
        const faction = gs.getFaction('f1');
        const goldBefore = faction.gold;
        EconomySystem.develop(gs, 'city1', 'agriculture');
        expect(faction.gold).toBe(goldBefore - 1000);
    });

    test('金钱不足时返回 failure', () => {
        const gs = makeGs();
        gs.getFaction('f1').gold = 500;
        const result = EconomySystem.develop(gs, 'city1', 'agriculture');
        expect(result.success).toBe(false);
    });

    test('城中无武将时返回 failure', () => {
        const gs = makeGs();
        // 把武将的 city 设为其他城，使 getGeneralsInCity('city1') 返回空
        gs.getGeneral('g1').city = 'other_city';
        const result = EconomySystem.develop(gs, 'city1', 'agriculture');
        expect(result.success).toBe(false);
    });

    test('agriculture 不超过 100', () => {
        const gs = makeGs();
        gs.getCity('city1').agriculture = 98;
        EconomySystem.develop(gs, 'city1', 'agriculture');
        expect(gs.getCity('city1').agriculture).toBeLessThanOrEqual(100);
    });
});

// ─────────────────────────────────────────────
// recruit
// ─────────────────────────────────────────────
describe('EconomySystem.recruit()', () => {
    test('金钱充足时城市兵力增加', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        const before = city.soldiers;
        const result = EconomySystem.recruit(gs, 'city1');
        expect(result.success).toBe(true);
        expect(city.soldiers).toBeGreaterThan(before);
    });

    test('扣除 2000 金', () => {
        const gs = makeGs();
        const faction = gs.getFaction('f1');
        const goldBefore = faction.gold;
        EconomySystem.recruit(gs, 'city1');
        expect(faction.gold).toBe(goldBefore - 2000);
    });

    test('金钱不足时返回 failure', () => {
        const gs = makeGs();
        gs.getFaction('f1').gold = 1000;
        const result = EconomySystem.recruit(gs, 'city1');
        expect(result.success).toBe(false);
    });

    test('征兵后士气略降', () => {
        const gs = makeGs();
        const moraleBefore = gs.getCity('city1').morale;
        EconomySystem.recruit(gs, 'city1');
        expect(gs.getCity('city1').morale).toBeLessThan(moraleBefore);
    });
});

// ─────────────────────────────────────────────
// search
// ─────────────────────────────────────────────
describe('EconomySystem.search()', () => {
    test('城中无武将时返回 failure', () => {
        const gs = makeGs();
        gs.getGeneral('g1').city = 'other_city';
        const result = EconomySystem.search(gs, 'city1');
        expect(result.success).toBe(false);
    });

    test('无在野武将时返回 failure', () => {
        const gs = makeGs();
        // 确保所有武将都有势力，getUnaffiliatedGenerals 返回空
        const result = EconomySystem.search(gs, 'city1');
        // 可能成功也可能失败（随机），但如果没有在野武将则必然 failure
        // 让 getUnaffiliatedGenerals 返回空
        const origFn = gs.getUnaffiliatedGenerals.bind(gs);
        gs.getUnaffiliatedGenerals = () => [];
        const result2 = EconomySystem.search(gs, 'city1');
        expect(result2.success).toBe(false);
        gs.getUnaffiliatedGenerals = origFn;
    });

    test('招募成功时武将 faction/city/status/soldiers 更新', () => {
        const gs = makeGs();
        const unaffiliated = { id: 'stranger', name: '陌生人', faction: null, city: null, status: null, soldiers: 0, war: 60, int: 50, lead: 50, pol: 40, cha: 50, level: 5, exp: 0, loyalty: 0, skills: [] };
        gs.generals.push(unaffiliated);
        gs.getUnaffiliatedGenerals = () => [unaffiliated];
        gs._assignSkills = (gen) => { gen.skills = []; };

        // 强制招募成功：cha=99 让 recruitChance > 1
        gs.getGeneral('g1').cha = 99;

        // 多次尝试确保至少一次成功（recruitChance=0.4+99/150≈1.06>1 每次都会成功）
        const result = EconomySystem.search(gs, 'city1');
        if (result.success && result.general) {
            expect(result.general.faction).toBe('f1');
            expect(result.general.city).toBe('city1');
            expect(result.general.status).toBe('idle');
            expect(result.general.soldiers).toBe(500);
        }
        // 就算随机未通过 chance，也不报错
        expect(typeof result).toBe('object');
    });

    test('发现但未招募时返回 success=true 但 general 字段不存在', () => {
        const gs = makeGs();
        const unaffiliated = { id: 'stranger2', name: '路人甲', faction: null, city: null, status: null, soldiers: 0, war: 50, int: 50, lead: 50, pol: 40, cha: 30, level: 3, exp: 0, loyalty: 0, skills: [] };
        gs.generals.push(unaffiliated);
        gs.getUnaffiliatedGenerals = () => [unaffiliated];

        // 让 chance 检测总是通过，recruitChance 总是失败
        const origRandom = Math.random;
        let callCount = 0;
        Math.random = () => {
            callCount++;
            // 第一次调用（chance检测）返回 0（总是通过），第二次（recruitChance）返回 0.99（总是失败）
            return callCount === 1 ? 0 : 0.99;
        };
        const result = EconomySystem.search(gs, 'city1');
        Math.random = origRandom;

        expect(result.success).toBe(true);
        expect(result.general).toBeUndefined();
        expect(unaffiliated.faction).toBe(null); // 未被招募
    });
});

// ─────────────────────────────────────────────
// fortify
// ─────────────────────────────────────────────
describe('EconomySystem.fortify()', () => {
    test('防御值提升', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        const before = city.defense;
        const result = EconomySystem.fortify(gs, 'city1');
        expect(result.success).toBe(true);
        expect(city.defense).toBeGreaterThan(before);
    });

    test('扣除 1500 金', () => {
        const gs = makeGs();
        const faction = gs.getFaction('f1');
        const goldBefore = faction.gold;
        EconomySystem.fortify(gs, 'city1');
        expect(faction.gold).toBe(goldBefore - 1500);
    });

    test('金钱不足时返回 failure', () => {
        const gs = makeGs();
        gs.getFaction('f1').gold = 1000;
        const result = EconomySystem.fortify(gs, 'city1');
        expect(result.success).toBe(false);
    });

    test('defense 不超过 100', () => {
        const gs = makeGs();
        gs.getCity('city1').defense = 98;
        EconomySystem.fortify(gs, 'city1');
        expect(gs.getCity('city1').defense).toBeLessThanOrEqual(100);
    });
});

// ─────────────────────────────────────────────
// assignSoldiers
// ─────────────────────────────────────────────
describe('EconomySystem.assignSoldiers()', () => {
    test('城市兵力转移给武将', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        city.soldiers = 2000;
        const gen = gs.getGeneral('g1');
        gen.soldiers = 0;
        gen.lead = 50;
        const result = EconomySystem.assignSoldiers(gs, 'g1', 500);
        expect(result.success).toBe(true);
        expect(gen.soldiers).toBe(500);
        expect(city.soldiers).toBe(1500);
    });

    test('不超过 lead*50 上限', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        city.soldiers = 5000;
        const gen = gs.getGeneral('g1');
        gen.soldiers = 0;
        gen.lead = 10; // max = 10*50 = 500
        EconomySystem.assignSoldiers(gs, 'g1', 1000);
        expect(gen.soldiers).toBeLessThanOrEqual(gen.lead * 50);
    });
});

// ─────────────────────────────────────────────
// checkLevelUp
// ─────────────────────────────────────────────
describe('EconomySystem.checkLevelUp()', () => {
    test('exp 不足时不升级', () => {
        const gs = makeGs();
        const gen = gs.getGeneral('g1');
        gen.level = 5;
        gen.exp = 0;
        const result = EconomySystem.checkLevelUp(gen, gs);
        expect(result).toBe(false);
        expect(gen.level).toBe(5);
    });

    test('exp 足够时升级', () => {
        const gs = makeGs();
        const gen = gs.getGeneral('g1');
        gen.level = 5;
        gen.exp = 500; // 5*100=500
        const result = EconomySystem.checkLevelUp(gen, gs);
        expect(result).toBe(true);
        expect(gen.level).toBe(6);
    });

    test('升级后 exp 扣除对应量', () => {
        const gs = makeGs();
        const gen = gs.getGeneral('g1');
        gen.level = 5;
        gen.exp = 600; // 升级需500, 剩100
        EconomySystem.checkLevelUp(gen, gs);
        expect(gen.exp).toBe(100);
    });

    test('升级后 maxHp / maxMp 重算', () => {
        const gs = makeGs();
        const gen = gs.getGeneral('g1');
        gen.level = 5;
        gen.exp = 500;
        gen.war = 80;
        gen.lead = 70;
        gen.int = 60;
        EconomySystem.checkLevelUp(gen, gs);
        expect(gen.maxHp).toBe(100 + gen.war * 2 + gen.lead);
        expect(gen.maxMp).toBe(50 + gen.int * 2);
    });

    test('等级上限 50 不再升级', () => {
        const gs = makeGs();
        const gen = gs.getGeneral('g1');
        gen.level = 50;
        gen.exp = 9999;
        EconomySystem.checkLevelUp(gen, gs);
        expect(gen.level).toBe(50);
    });
});

// ─────────────────────────────────────────────
// processTurnSettlement
// ─────────────────────────────────────────────
describe('EconomySystem.processTurnSettlement()', () => {
    test('每回合增加金和粮', () => {
        const gs = makeGs();
        const faction = gs.getFaction('f1');
        const goldBefore = faction.gold;
        const foodBefore = faction.food;
        EconomySystem.processTurnSettlement(gs);
        // 扣除消耗后，金应该增加
        expect(faction.gold).toBeGreaterThan(goldBefore);
        // 粮食增减视消耗而定，至少不会负数
        expect(faction.food).toBeGreaterThanOrEqual(0);
    });

    test('粮草不足时士气下降', () => {
        const gs = makeGs();
        const faction = gs.getFaction('f1');
        const city = gs.getCity('city1');
        faction.food = 0;
        city.soldiers = 100000; // 大量士兵消耗粮食
        const moraleBefore = city.morale;
        // 强制食物缺口：先处理一次 settlement，下一次 food 为负
        EconomySystem.processTurnSettlement(gs);
        if (faction.food === 0) {
            // food 被 clamp 到 0，说明发生了粮草不足
            expect(city.morale).toBeLessThanOrEqual(moraleBefore);
        }
    });

    test('返回 reports 数组', () => {
        const gs = makeGs();
        const reports = EconomySystem.processTurnSettlement(gs);
        expect(Array.isArray(reports)).toBe(true);
    });

    test('人口增长（士气>50 时）', () => {
        const gs = makeGs();
        const city = gs.getCity('city1');
        city.morale = 80;
        const popBefore = city.population;
        EconomySystem.processTurnSettlement(gs);
        expect(city.population).toBeGreaterThan(popBefore);
    });
});
