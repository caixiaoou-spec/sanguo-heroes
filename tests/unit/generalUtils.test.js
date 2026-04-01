/**
 * generalUtils.test.js — 共享工具函数测试
 */

import { calcMaxHp, calcMaxMp, calcMarchTurns, checkLevelUp } from '../../js/utils/generalUtils.js';
import { HP_BASE, MP_BASE, MAX_GENERAL_LEVEL } from '../../js/utils/constants.js';

// ─────────────────────────────────────────────
// calcMaxHp
// ─────────────────────────────────────────────
describe('calcMaxHp()', () => {
    test('公式正确：HP_BASE + war*2 + lead', () => {
        expect(calcMaxHp(80, 70)).toBe(HP_BASE + 80 * 2 + 70); // 330
    });

    test('war=0 lead=0 返回 HP_BASE', () => {
        expect(calcMaxHp(0, 0)).toBe(HP_BASE);
    });

    test('超高属性（项羽 war=101）正常计算', () => {
        expect(calcMaxHp(101, 88)).toBe(HP_BASE + 101 * 2 + 88); // 390
    });
});

// ─────────────────────────────────────────────
// calcMaxMp
// ─────────────────────────────────────────────
describe('calcMaxMp()', () => {
    test('公式正确：MP_BASE + int*2', () => {
        expect(calcMaxMp(60)).toBe(MP_BASE + 60 * 2); // 170
    });

    test('int=0 返回 MP_BASE', () => {
        expect(calcMaxMp(0)).toBe(MP_BASE);
    });

    test('int=99 正常计算', () => {
        expect(calcMaxMp(99)).toBe(MP_BASE + 99 * 2); // 248
    });
});

// ─────────────────────────────────────────────
// calcMarchTurns
// ─────────────────────────────────────────────
describe('calcMarchTurns()', () => {
    test('dist ≤ 60 → 1 回合', () => {
        expect(calcMarchTurns(0)).toBe(1);
        expect(calcMarchTurns(60)).toBe(1);
    });

    test('dist 61-120 → 2 回合', () => {
        expect(calcMarchTurns(61)).toBe(2);
        expect(calcMarchTurns(120)).toBe(2);
    });

    test('dist 121-200 → 3 回合', () => {
        expect(calcMarchTurns(121)).toBe(3);
        expect(calcMarchTurns(200)).toBe(3);
    });

    test('dist > 200 → 4 回合', () => {
        expect(calcMarchTurns(201)).toBe(4);
        expect(calcMarchTurns(999)).toBe(4);
    });
});

// ─────────────────────────────────────────────
// checkLevelUp
// ─────────────────────────────────────────────
describe('checkLevelUp()', () => {
    function makeGen(overrides = {}) {
        return { id: 'test', level: 5, exp: 0, war: 80, int: 60, lead: 70, hp: 330, maxHp: 330, mp: 170, maxMp: 170, skills: [], ...overrides };
    }

    test('exp 不足时返回 false，等级不变', () => {
        const gen = makeGen({ level: 5, exp: 499 });
        expect(checkLevelUp(gen, null)).toBe(false);
        expect(gen.level).toBe(5);
    });

    test('exp 足够时升级，返回 true', () => {
        const gen = makeGen({ level: 5, exp: 500 }); // 需要 5*100=500
        expect(checkLevelUp(gen, null)).toBe(true);
        expect(gen.level).toBe(6);
    });

    test('升级后 exp 正确扣除', () => {
        const gen = makeGen({ level: 5, exp: 650 }); // 升一级需500，剩150
        checkLevelUp(gen, null);
        expect(gen.exp).toBe(150);
    });

    test('可连续升多级', () => {
        // level=5: 需500, level=6: 需600, total=1100
        const gen = makeGen({ level: 5, exp: 1200 });
        checkLevelUp(gen, null);
        expect(gen.level).toBe(7);
    });

    test('升级后 maxHp / maxMp 重新计算', () => {
        const gen = makeGen({ level: 5, exp: 500, war: 80, lead: 70, int: 60 });
        checkLevelUp(gen, null);
        expect(gen.maxHp).toBe(calcMaxHp(80, 70));
        expect(gen.maxMp).toBe(calcMaxMp(60));
    });

    test('升级后 hp/mp 恢复为 maxHp/maxMp', () => {
        const gen = makeGen({ level: 5, exp: 500, war: 80, lead: 70, int: 60 });
        gen.hp = 50; // 模拟受伤状态
        checkLevelUp(gen, null);
        expect(gen.hp).toBe(gen.maxHp);
        expect(gen.mp).toBe(gen.maxMp);
    });

    test('等级上限 50 时不再升级', () => {
        const gen = makeGen({ level: 50, exp: 99999 });
        expect(checkLevelUp(gen, null)).toBe(false);
        expect(gen.level).toBe(50);
    });

    test('升级时调用 gameState._assignSkills', () => {
        const gen = makeGen({ level: 5, exp: 500 });
        const gs = { _assignSkills: jest.fn() };
        checkLevelUp(gen, gs);
        expect(gs._assignSkills).toHaveBeenCalledWith(gen);
    });

    test('gameState=null 时不报错', () => {
        const gen = makeGen({ level: 5, exp: 500 });
        expect(() => checkLevelUp(gen, null)).not.toThrow();
    });
});
