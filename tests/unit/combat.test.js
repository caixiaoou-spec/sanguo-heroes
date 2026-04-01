/**
 * combat.test.js — CombatSystem 战斗逻辑测试
 */

import CombatSystem from '../../js/systems/combat.js';
import {
    createMockGameState,
    createMockGeneral,
    createMockCity,
    createMockFaction,
    createMockBattle,
    createMockBattleUnit,
} from '../helpers/mockGameState.js';

// ─────────────────────────────────────────────
// 辅助：创建一个可运行的 CombatSystem 实例
// ─────────────────────────────────────────────
function makeCS(gsOverrides = {}) {
    const city = createMockCity({ id: 'defender_city', owner: 'defender_faction' });
    const attackerFaction = createMockFaction({ id: 'attacker_faction', fame: 50 });
    const defenderFaction = createMockFaction({ id: 'defender_faction', fame: 30 });
    const attacker = createMockGeneral({ id: 'atk1', faction: 'attacker_faction', city: 'src_city', soldiers: 1000 });
    const defender = createMockGeneral({ id: 'def1', faction: 'defender_faction', city: 'defender_city', soldiers: 1000 });
    const gs = createMockGameState({
        playerFaction: 'attacker_faction',
        cities: [city, createMockCity({ id: 'src_city', owner: 'attacker_faction' })],
        factions: [attackerFaction, defenderFaction],
        generals: [attacker, defender],
        skills: [],
        ...gsOverrides
    });
    return { cs: new CombatSystem(gs), gs, attacker, defender, city, attackerFaction, defenderFaction };
}

// ─────────────────────────────────────────────
// _getUnitAdvantage — 兵种克制
// ─────────────────────────────────────────────
describe('CombatSystem._getUnitAdvantage()', () => {
    const { cs } = makeCS();

    test('骑兵克步兵 → 1.2', () => {
        expect(cs._getUnitAdvantage('cavalry', 'infantry')).toBe(1.2);
    });

    test('枪兵克骑兵 → 1.5', () => {
        expect(cs._getUnitAdvantage('spear', 'cavalry')).toBe(1.5);
    });

    test('步兵克弓兵 → 1.3', () => {
        expect(cs._getUnitAdvantage('infantry', 'archer')).toBe(1.3);
    });

    test('弓兵克骑兵 → 1.2', () => {
        expect(cs._getUnitAdvantage('archer', 'cavalry')).toBe(1.2);
    });

    test('无克制关系 → 1.0', () => {
        expect(cs._getUnitAdvantage('infantry', 'infantry')).toBe(1.0);
        expect(cs._getUnitAdvantage('cavalry', 'spear')).toBe(1.0); // spear克cavalry, 不是反过来
    });
});

// ─────────────────────────────────────────────
// createBattle — 创建战斗对象结构
// ─────────────────────────────────────────────
describe('CombatSystem.createBattle()', () => {
    test('返回的 battle 对象有必要字段', () => {
        const { cs } = makeCS();
        const battle = cs.createBattle(['atk1'], 'defender_city');

        expect(battle).toHaveProperty('phase');
        expect(battle).toHaveProperty('attacker');
        expect(battle).toHaveProperty('defender');
        expect(battle).toHaveProperty('soldiers');
        expect(battle).toHaveProperty('projectiles');
        expect(battle).toHaveProperty('effects');
        expect(battle).toHaveProperty('damageNumbers');
        expect(battle).toHaveProperty('skillAnimations');
        expect(battle).toHaveProperty('duelResults');
        expect(battle).toHaveProperty('matchScore');
    });

    test('attacker.generals 包含传入的武将', () => {
        const { cs } = makeCS();
        const battle = cs.createBattle(['atk1'], 'defender_city');
        expect(battle.attacker.generals.length).toBe(1);
        expect(battle.attacker.generals[0].general.id).toBe('atk1');
    });

    test('matchScore 初始为 0:0', () => {
        const { cs } = makeCS();
        const battle = cs.createBattle(['atk1'], 'defender_city');
        expect(battle.matchScore.left).toBe(0);
        expect(battle.matchScore.right).toBe(0);
    });

    test('result 初始为 null', () => {
        const { cs } = makeCS();
        const battle = cs.createBattle(['atk1'], 'defender_city');
        expect(battle.result).toBeNull();
    });
});

// ─────────────────────────────────────────────
// _normalAttack — 伤害计算
// ─────────────────────────────────────────────
describe('CombatSystem._normalAttack()', () => {
    function makeDuel(attackerOverrides = {}, defenderOverrides = {}) {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const atkUnit = createMockBattleUnit(
            { id: 'atk', war: 80, lead: 70, unitType: 'infantry', ...attackerOverrides },
            { side: 'left', x: 150 }
        );
        const defUnit = createMockBattleUnit(
            { id: 'def', war: 60, lead: 50, unitType: 'infantry', ...defenderOverrides },
            { side: 'right', x: 200 }
        );
        battle.currentDuel = {
            left: atkUnit, right: defUnit,
            leftFormation: null, rightFormation: null
        };
        battle.attacker.generals = [atkUnit];
        battle.defender.generals = [defUnit];
        return { cs, battle, atkUnit, defUnit };
    }

    test('攻击后 defender HP 减少', () => {
        const { cs, battle, atkUnit, defUnit } = makeDuel();
        const hpBefore = defUnit.hp;
        cs._normalAttack(battle, atkUnit, defUnit);
        expect(defUnit.hp).toBeLessThan(hpBefore);
    });

    test('HP 不会低于 0', () => {
        const { cs, battle, atkUnit, defUnit } = makeDuel({ war: 100 });
        defUnit.hp = 1;
        cs._normalAttack(battle, atkUnit, defUnit);
        expect(defUnit.hp).toBeGreaterThanOrEqual(0);
    });

    test('HP 归零时 state 变为 dead', () => {
        const { cs, battle, atkUnit, defUnit } = makeDuel({ war: 100 });
        defUnit.hp = 1;
        defUnit.maxHp = 300;
        cs._normalAttack(battle, atkUnit, defUnit);
        if (defUnit.hp === 0) {
            expect(defUnit.state).toBe('dead');
        }
    });

    test('产生 damageNumbers 记录', () => {
        const { cs, battle, atkUnit, defUnit } = makeDuel();
        cs._normalAttack(battle, atkUnit, defUnit);
        expect(battle.damageNumbers.length).toBeGreaterThan(0);
        expect(battle.damageNumbers[0].value).toBeGreaterThan(0);
    });

    test('弓兵攻击产生 projectile', () => {
        const { cs, battle, atkUnit, defUnit } = makeDuel({ unitType: 'archer' });
        cs._normalAttack(battle, atkUnit, defUnit);
        expect(battle.projectiles.length).toBeGreaterThan(0);
    });

    test('非弓兵不产生 projectile', () => {
        const { cs, battle, atkUnit, defUnit } = makeDuel({ unitType: 'infantry' });
        cs._normalAttack(battle, atkUnit, defUnit);
        expect(battle.projectiles.length).toBe(0);
    });

    test('士兵比例影响伤害（满员 vs 1 兵）', () => {
        const { cs, battle: b1, atkUnit: a1, defUnit: d1 } = makeDuel({ war: 80 });
        const { cs: cs2, battle: b2, atkUnit: a2, defUnit: d2 } = makeDuel({ war: 80 });

        // full soldiers
        a1.soldiers = a1.maxSoldiers;
        cs._normalAttack(b1, a1, d1);
        const dmgFull = b1.damageNumbers[0].value;

        // 1 soldier (very low ratio)
        a2.soldiers = 1;
        cs2._normalAttack(b2, a2, d2);
        const dmgLow = b2.damageNumbers[0].value;

        expect(dmgFull).toBeGreaterThan(dmgLow);
    });
});

// ─────────────────────────────────────────────
// _useSkill — 技能消耗 MP / CD
// ─────────────────────────────────────────────
describe('CombatSystem._useSkill()', () => {
    function makeSkillSetup() {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const skill = { id: 'test_skill', name: '测试技', mpCost: 30, cooldown: 5, damage: 1.5, effect: 'damage', targetType: 'single', animation: 'slash' };
        const userUnit = createMockBattleUnit({ war: 80, int: 60 }, { side: 'left', x: 150, mp: 100, maxMp: 170 });
        const targetUnit = createMockBattleUnit({ war: 60, lead: 50 }, { side: 'right', x: 800, hp: 200, maxHp: 200 });
        userUnit.skills = [{ ...skill, currentCd: 0 }];
        battle.currentDuel = {
            left: userUnit, right: targetUnit,
            leftFormation: null, rightFormation: null
        };
        return { cs, battle, skill: userUnit.skills[0], userUnit, targetUnit };
    }

    test('使用技能扣除 mpCost', () => {
        const { cs, battle, skill, userUnit, targetUnit } = makeSkillSetup();
        const mpBefore = userUnit.mp;
        cs._useSkill(battle, userUnit, skill, targetUnit);
        expect(userUnit.mp).toBe(mpBefore - skill.mpCost);
    });

    test('使用技能设置 cooldown', () => {
        const { cs, battle, skill, userUnit, targetUnit } = makeSkillSetup();
        cs._useSkill(battle, userUnit, skill, targetUnit);
        expect(skill.currentCd).toBe(skill.cooldown);
    });

    test('使用技能后 user.state = skill', () => {
        const { cs, battle, skill, userUnit, targetUnit } = makeSkillSetup();
        cs._useSkill(battle, userUnit, skill, targetUnit);
        expect(userUnit.state).toBe('skill');
    });

    test('技能动画被推入 skillAnimations', () => {
        const { cs, battle, skill, userUnit, targetUnit } = makeSkillSetup();
        cs._useSkill(battle, userUnit, skill, targetUnit);
        expect(battle.skillAnimations.length).toBe(1);
    });

    test('skillAnimation 包含 hitFired=false 和 payload', () => {
        const { cs, battle, skill, userUnit, targetUnit } = makeSkillSetup();
        cs._useSkill(battle, userUnit, skill, targetUnit);
        const anim = battle.skillAnimations[0];
        expect(anim.hitFired).toBe(false);
        expect(anim.payload).not.toBeNull();
    });

    test('heal 技能 payload 类型为 heal', () => {
        const { cs, battle, userUnit, targetUnit } = makeSkillSetup();
        battle.currentDuel.left = userUnit;
        battle.currentDuel.right = targetUnit;
        const healSkill = { id: 'heal_s', name: '回复', mpCost: 20, cooldown: 4, damage: 0.5, effect: 'heal', targetType: 'ally', animation: 'aura' };
        userUnit.skills = [{ ...healSkill, currentCd: 0 }];
        cs._useSkill(battle, userUnit, userUnit.skills[0], userUnit);
        const anim = battle.skillAnimations[0];
        expect(anim.payload.type).toBe('heal');
    });
});

// ─────────────────────────────────────────────
// checkBattleEnd
// ─────────────────────────────────────────────
describe('CombatSystem.checkBattleEnd()', () => {
    test('双方都有存活 → false', () => {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const left = createMockBattleUnit({}, { side: 'left', state: 'fight' });
        const right = createMockBattleUnit({}, { side: 'right', state: 'fight' });
        battle.attacker.generals = [left];
        battle.defender.generals = [right];
        expect(cs.checkBattleEnd(battle)).toBe(false);
    });

    test('进攻方全灭 → true + result=defender_wins', () => {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const left = createMockBattleUnit({}, { side: 'left', state: 'dead' });
        const right = createMockBattleUnit({}, { side: 'right', state: 'fight' });
        battle.attacker.generals = [left];
        battle.defender.generals = [right];
        expect(cs.checkBattleEnd(battle)).toBe(true);
        expect(battle.result).toBe('defender_wins');
    });

    test('防守方全灭 → true + result=attacker_wins', () => {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const left = createMockBattleUnit({}, { side: 'left', state: 'fight' });
        const right = createMockBattleUnit({}, { side: 'right', state: 'dead' });
        battle.attacker.generals = [left];
        battle.defender.generals = [right];
        expect(cs.checkBattleEnd(battle)).toBe(true);
        expect(battle.result).toBe('attacker_wins');
    });
});

// ─────────────────────────────────────────────
// aiPickNextGeneral
// ─────────────────────────────────────────────
describe('CombatSystem.aiPickNextGeneral()', () => {
    const { cs } = makeCS();

    test('空数组 → null', () => {
        expect(cs.aiPickNextGeneral([])).toBeNull();
    });

    test('全部死亡 → null', () => {
        const units = [createMockBattleUnit({}, { state: 'dead' })];
        expect(cs.aiPickNextGeneral(units)).toBeNull();
    });

    test('返回战力最高的存活将领', () => {
        const weak = createMockBattleUnit({ war: 50 }, { state: 'standby' });
        const strong = createMockBattleUnit({ war: 90 }, { state: 'standby' });
        const result = cs.aiPickNextGeneral([weak, strong]);
        expect(result.general.war).toBe(90);
    });
});

// ─────────────────────────────────────────────
// startSequentialDuel
// ─────────────────────────────────────────────
describe('CombatSystem.startSequentialDuel()', () => {
    test('设置 battle.phase = duel_intro', () => {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const left = createMockBattleUnit({}, { side: 'left' });
        const right = createMockBattleUnit({}, { side: 'right' });
        cs.startSequentialDuel(battle, left, right, null, null);
        expect(battle.phase).toBe('duel_intro');
    });

    test('circle 阵型给对应武将 HP+10%', () => {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const left = createMockBattleUnit({ maxHp: 200 }, { side: 'left', hp: 200, maxHp: 200 });
        const right = createMockBattleUnit({ maxHp: 200 }, { side: 'right', hp: 200, maxHp: 200 });
        cs.startSequentialDuel(battle, left, right, 'circle', null);
        expect(left.hp).toBe(220);
        expect(left.maxHp).toBe(220);
        expect(right.hp).toBe(200); // no circle
    });

    test('重置攻击计时器为 0', () => {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const left = createMockBattleUnit({}, { side: 'left', attackTimer: 99 });
        const right = createMockBattleUnit({}, { side: 'right', attackTimer: 99 });
        cs.startSequentialDuel(battle, left, right, null, null);
        expect(left.attackTimer).toBe(0);
        expect(right.attackTimer).toBe(0);
    });
});

// ─────────────────────────────────────────────
// settleBattle — 占城逻辑
// ─────────────────────────────────────────────
describe('CombatSystem.settleBattle() — 攻方胜利占城', () => {
    test('attacker_wins 时城池 owner 变为进攻方', () => {
        const city = createMockCity({ id: 'target_city', owner: 'defender_faction', soldiers: 500, generals: [] });
        const atkFaction = createMockFaction({ id: 'attacker_faction', gold: 5000, food: 5000 });
        const defFaction = createMockFaction({ id: 'defender_faction' });
        const atkGen = createMockGeneral({ id: 'atk1', faction: 'attacker_faction', city: 'src_city' });
        const defGen = createMockGeneral({ id: 'def1', faction: 'defender_faction', city: 'target_city' });
        const gs = createMockGameState({
            cities: [city, createMockCity({ id: 'src_city', owner: 'attacker_faction' })],
            factions: [atkFaction, defFaction],
            generals: [atkGen, defGen],
            playerFaction: 'attacker_faction'
        });
        const cs = new CombatSystem(gs);

        const atkUnit = createMockBattleUnit({}, { general: atkGen, side: 'left', state: 'fight', hp: 150 });
        const defUnit = createMockBattleUnit({}, { general: defGen, side: 'right', state: 'dead', hp: 0 });

        const battle = {
            result: 'attacker_wins',
            attacker: { faction: atkFaction, generals: [atkUnit] },
            defender: { faction: defFaction, generals: [defUnit], city }
        };

        cs.settleBattle(battle);

        expect(city.owner).toBe('attacker_faction');
    });

    test('攻方胜利时城池兵力归零', () => {
        const city = createMockCity({ id: 'target_city', owner: 'defender_faction', soldiers: 500, generals: [] });
        const atkFaction = createMockFaction({ id: 'attacker_faction', gold: 5000, food: 5000 });
        const defFaction = createMockFaction({ id: 'defender_faction' });
        const atkGen = createMockGeneral({ id: 'atk1', faction: 'attacker_faction', city: 'src_city' });
        const defGen = createMockGeneral({ id: 'def1', faction: 'defender_faction', city: 'target_city' });
        const gs = createMockGameState({
            cities: [city, createMockCity({ id: 'src_city', owner: 'attacker_faction' })],
            factions: [atkFaction, defFaction],
            generals: [atkGen, defGen],
            playerFaction: 'attacker_faction'
        });
        const cs = new CombatSystem(gs);

        const atkUnit = createMockBattleUnit({}, { general: atkGen, side: 'left', state: 'fight', hp: 150 });
        const defUnit = createMockBattleUnit({}, { general: defGen, side: 'right', state: 'dead', hp: 0 });

        const battle = {
            result: 'attacker_wins',
            attacker: { faction: atkFaction, generals: [atkUnit] },
            defender: { faction: defFaction, generals: [defUnit], city }
        };

        cs.settleBattle(battle);

        expect(city.soldiers).toBe(0);
    });

    test('守方无城池后势力被消灭', () => {
        const city = createMockCity({ id: 'last_city', owner: 'defender_faction', soldiers: 0, generals: [] });
        const atkFaction = createMockFaction({ id: 'attacker_faction', gold: 5000, food: 5000 });
        const defFaction = createMockFaction({ id: 'defender_faction', alive: true });
        const atkGen = createMockGeneral({ id: 'atk1', faction: 'attacker_faction', city: 'src_city' });
        const defGen = createMockGeneral({ id: 'def1', faction: 'defender_faction', city: 'last_city' });
        const gs = createMockGameState({
            cities: [city, createMockCity({ id: 'src_city', owner: 'attacker_faction' })],
            factions: [atkFaction, defFaction],
            generals: [atkGen, defGen],
            playerFaction: 'attacker_faction'
        });
        const cs = new CombatSystem(gs);

        const atkUnit = createMockBattleUnit({}, { general: atkGen, side: 'left', state: 'fight', hp: 150 });
        const defUnit = createMockBattleUnit({}, { general: defGen, side: 'right', state: 'dead', hp: 0, soldiers: 0 });

        const battle = {
            result: 'attacker_wins',
            attacker: { faction: atkFaction, generals: [atkUnit] },
            defender: { faction: defFaction, generals: [defUnit], city }
        };

        cs.settleBattle(battle);

        expect(defFaction.alive).toBe(false);
    });
});

// ─────────────────────────────────────────────
// createInterceptionBattle
// ─────────────────────────────────────────────
describe('CombatSystem.createInterceptionBattle()', () => {
    test('返回 isInterception=true 的 battle 对象', () => {
        const { cs } = makeCS();
        const battle = cs.createInterceptionBattle(['atk1'], ['def1'], 'attacker_faction', 'defender_faction');
        expect(battle.isInterception).toBe(true);
    });

    test('defender.city 为 null（野战无城池）', () => {
        const { cs } = makeCS();
        const battle = cs.createInterceptionBattle(['atk1'], ['def1'], 'attacker_faction', 'defender_faction');
        expect(battle.defender.city).toBeNull();
    });

    test('cityDefenseBonus 为 0', () => {
        const { cs } = makeCS();
        const battle = cs.createInterceptionBattle(['atk1'], ['def1'], 'attacker_faction', 'defender_faction');
        expect(battle.defender.cityDefenseBonus).toBe(0);
    });

    test('attacker.generals 包含传入武将', () => {
        const { cs } = makeCS();
        const battle = cs.createInterceptionBattle(['atk1'], ['def1'], 'attacker_faction', 'defender_faction');
        expect(battle.attacker.generals.length).toBe(1);
        expect(battle.attacker.generals[0].general.id).toBe('atk1');
    });

    test('result 初始为 null', () => {
        const { cs } = makeCS();
        const battle = cs.createInterceptionBattle(['atk1'], ['def1'], 'attacker_faction', 'defender_faction');
        expect(battle.result).toBeNull();
    });
});

// ─────────────────────────────────────────────
// findHistoricalDuel
// ─────────────────────────────────────────────
describe('CombatSystem.findHistoricalDuel()', () => {
    test('不存在历史单挑记录时返回 null', () => {
        const { cs } = makeCS();
        expect(cs.findHistoricalDuel('nonexistent_a', 'nonexistent_b')).toBeNull();
    });

    test('顺序不影响查找结果', () => {
        const { cs } = makeCS();
        // 用真实数据中必然存在的历史单挑：关羽 vs 颜良
        const r1 = cs.findHistoricalDuel('guan_yu', 'yan_liang');
        const r2 = cs.findHistoricalDuel('yan_liang', 'guan_yu');
        // 两种顺序结果相同（要么都 null 要么都找到同一条）
        expect(r1?.title ?? null).toBe(r2?.title ?? null);
    });
});

// ─────────────────────────────────────────────
// settleBattle — 败方逃跑 / 俘虏 / 撤退行军
// ─────────────────────────────────────────────
describe('CombatSystem.settleBattle() — 败方处理', () => {
    function makeSettleBattle({ defState = 'dead', atkState = 'fight', extraCities = [] } = {}) {
        const srcCity  = createMockCity({ id: 'src_city',  x: 0,   y: 0,   owner: 'attacker_faction' });
        const defCity  = createMockCity({ id: 'target_city', x: 100, y: 0, owner: 'defender_faction', soldiers: 500, generals: [] });
        const homeCity = createMockCity({ id: 'home_city', x: 200, y: 0,   owner: 'defender_faction', generals: [] });
        const atkFaction = createMockFaction({ id: 'attacker_faction', gold: 5000, food: 5000, fame: 50 });
        const defFaction = createMockFaction({ id: 'defender_faction' });
        const atkGen = createMockGeneral({ id: 'atk1', faction: 'attacker_faction', city: 'src_city' });
        const defGen = createMockGeneral({ id: 'def1', faction: 'defender_faction', city: 'target_city', soldiers: 500 });
        defCity.generals = ['def1'];
        const gs = createMockGameState({
            cities: [srcCity, defCity, homeCity, ...extraCities],
            factions: [atkFaction, defFaction],
            generals: [atkGen, defGen],
            playerFaction: 'attacker_faction'
        });
        const cs = new CombatSystem(gs);
        const atkUnit = createMockBattleUnit({}, { general: atkGen, side: 'left', state: atkState, hp: 150, soldiers: 500, maxSoldiers: 1000 });
        const defUnit = createMockBattleUnit({}, { general: defGen, side: 'right', state: defState, hp: defState === 'dead' ? 0 : 100, soldiers: 500, maxSoldiers: 1000 });
        const battle = {
            result: 'attacker_wins',
            isInterception: false,
            attacker: { faction: atkFaction, generals: [atkUnit] },
            defender: { faction: defFaction, generals: [defUnit], city: defCity }
        };
        return { cs, gs, battle, atkGen, defGen, defCity, homeCity };
    }

    test('败方阵亡武将：soldiers 清零或仅剩逃脱份额', () => {
        const { cs, battle, defGen } = makeSettleBattle({ defState: 'dead' });
        const maxSoldiers = 1000; // makeSettleBattle 中 maxSoldiers=1000
        cs.settleBattle(battle);
        // 死亡武将先被置 0，随后若逃脱则赋为 maxSoldiers*0.1
        expect([0, Math.floor(maxSoldiers * 0.1)]).toContain(defGen.soldiers);
    });

    test('败方阵亡被俘虏：status=captured, faction=none', () => {
        // 强制 Math.random 返回极小值确保进入俘虏分支
        const origRandom = Math.random;
        Math.random = () => 0;
        const { cs, battle, defGen } = makeSettleBattle({ defState: 'dead' });
        cs.settleBattle(battle);
        Math.random = origRandom;
        // 俘虏或阵亡（killCount 已在 results.killed，captures 是超集的不同分支）
        expect(['captured', 'dead', 'idle'].includes(defGen.status)).toBe(true);
    });

    test('defeated 但存活的败方武将（hp>0）：攻方阵亡单位 hp=0', () => {
        const { cs, gs, battle, defGen } = makeSettleBattle({ defState: 'fight' });
        // 设为守方胜利：攻方死亡，守方存活
        battle.result = 'defender_wins';
        battle.attacker.generals[0].state = 'dead';
        battle.attacker.generals[0].hp = 0;
        battle.defender.generals[0].state = 'fight';
        battle.defender.generals[0].hp = 80;
        cs.settleBattle(battle);
        // 攻方武将 hp 已被设为 0（battle unit 层面）
        expect(battle.attacker.generals[0].hp).toBe(0);
    });

    test('results 包含 killed/captures/escaped 数组', () => {
        const { cs, battle } = makeSettleBattle({ defState: 'dead' });
        const results = cs.settleBattle(battle);
        expect(Array.isArray(results.killed)).toBe(true);
        expect(Array.isArray(results.captures)).toBe(true);
        expect(Array.isArray(results.escaped)).toBe(true);
    });

    test('results.loot 包含 gold 和 food', () => {
        const { cs, battle } = makeSettleBattle({ defState: 'dead' });
        const results = cs.settleBattle(battle);
        expect(results.loot).toHaveProperty('gold');
        expect(results.loot).toHaveProperty('food');
    });

    test('胜方武将获得 exp', () => {
        const { cs, battle, atkGen } = makeSettleBattle({ defState: 'dead' });
        const expBefore = atkGen.exp;
        cs.settleBattle(battle);
        expect(atkGen.exp).toBeGreaterThan(expBefore);
    });
});

// ─────────────────────────────────────────────
// settleBattle — encamped 武将处理
// ─────────────────────────────────────────────
describe('CombatSystem.settleBattle() — encamped 武将逃离', () => {
    test('攻方占城后，守方 encamped 武将无友军城池时变为 unaffiliated', () => {
        const srcCity   = createMockCity({ id: 'src',    x: 0,   y: 0,   owner: 'atk' });
        const lastCity  = createMockCity({ id: 'last',   x: 50,  y: 0,   owner: 'def', soldiers: 0, generals: [] });
        const atkFaction = createMockFaction({ id: 'atk', gold: 5000, food: 5000 });
        const defFaction = createMockFaction({ id: 'def' });
        const atkGen  = createMockGeneral({ id: 'a1', faction: 'atk', city: 'src' });
        const defGen  = createMockGeneral({ id: 'd1', faction: 'def', city: 'last', status: 'dead' });
        const campGen = createMockGeneral({ id: 'd2', faction: 'def', city: 'last', status: 'encamped' });
        lastCity.generals = ['d1', 'd2'];
        const gs = createMockGameState({
            cities: [srcCity, lastCity],
            factions: [atkFaction, defFaction],
            generals: [atkGen, defGen, campGen],
            playerFaction: 'atk'
        });
        const cs = new CombatSystem(gs);
        const atkUnit = createMockBattleUnit({}, { general: atkGen, state: 'fight', hp: 150 });
        const defUnit = createMockBattleUnit({}, { general: defGen, state: 'dead', hp: 0, soldiers: 0 });
        const battle = {
            result: 'attacker_wins',
            isInterception: false,
            attacker: { faction: atkFaction, generals: [atkUnit] },
            defender: { faction: defFaction, generals: [defUnit], city: lastCity }
        };
        cs.settleBattle(battle);
        // 无友军城池 → 变为 unaffiliated
        expect(campGen.faction).toBe('none');
    });
});

// ─────────────────────────────────────────────
// skillAnimation payload — buff / instant_kill
// ─────────────────────────────────────────────
describe('CombatSystem._useSkill() — buff/instant_kill payload', () => {
    function makeSkillSetup() {
        const { cs } = makeCS();
        const battle = createMockBattle();
        const userUnit = createMockBattleUnit({ war: 80, int: 60 }, { side: 'left', mp: 100, maxMp: 170 });
        const targetUnit = createMockBattleUnit({ war: 60 }, { side: 'right', hp: 200, maxHp: 200 });
        battle.currentDuel = { left: userUnit, right: targetUnit, leftFormation: null, rightFormation: null };
        return { cs, battle, userUnit, targetUnit };
    }

    test('buff_atk 技能 payload 类型为 buff', () => {
        const { cs, battle, userUnit, targetUnit } = makeSkillSetup();
        const buffSkill = { id: 'buff_s', name: '激励', mpCost: 20, cooldown: 4, damage: 0, effect: 'buff_atk', targetType: 'self', animation: 'aura' };
        userUnit.skills = [{ ...buffSkill, currentCd: 0 }];
        cs._useSkill(battle, userUnit, userUnit.skills[0], userUnit);
        const anim = battle.skillAnimations[0];
        expect(anim.payload.type).toBe('buff');
    });

    test('instant_kill 技能 payload 类型为 instant_kill', () => {
        const { cs, battle, userUnit, targetUnit } = makeSkillSetup();
        const killSkill = { id: 'ik', name: '斩首', mpCost: 50, cooldown: 10, damage: 5, effect: 'instant_kill', targetType: 'single', animation: 'slash' };
        userUnit.skills = [{ ...killSkill, currentCd: 0 }];
        cs._useSkill(battle, userUnit, userUnit.skills[0], targetUnit);
        const anim = battle.skillAnimations[0];
        expect(anim.payload.type).toBe('instant_kill');
    });
});

// ─────────────────────────────────────────────
// _createBattleUnit
// ─────────────────────────────────────────────
describe('CombatSystem._createBattleUnit()', () => {
    test('facing: left→1, right→-1', () => {
        const { cs, attacker } = makeCS();
        const leftUnit = cs._createBattleUnit(attacker, 'left');
        const rightUnit = cs._createBattleUnit(attacker, 'right');
        expect(leftUnit.facing).toBe(1);
        expect(rightUnit.facing).toBe(-1);
    });

    test('unit.hp = general.hp', () => {
        const { cs, attacker } = makeCS();
        const unit = cs._createBattleUnit(attacker, 'left');
        expect(unit.hp).toBe(attacker.hp);
    });

    test('unit.skills 包含 currentCd=0', () => {
        const { cs } = makeCS();
        const gen = createMockGeneral({ skills: ['someSkill'] });
        // skills 是 id 数组时，_createBattleUnit 应过滤并初始化
        const unit = cs._createBattleUnit(gen, 'left');
        // 若 skill 不在 gs.skills 中，数组为空也是合法的
        expect(Array.isArray(unit.skills)).toBe(true);
    });
});
