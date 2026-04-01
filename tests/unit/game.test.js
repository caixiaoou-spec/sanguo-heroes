/**
 * game.test.js — GameState 核心逻辑测试
 */

import GameState from '../../js/engine/game.js';

// ─────────────────────────────────────────────
// initNewGame
// ─────────────────────────────────────────────
describe('GameState.initNewGame()', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('设置 playerFaction 为传入的 factionId', () => {
        expect(gs.playerFaction).toBe('cao_cao');
    });

    test('turn 从 1 开始', () => {
        expect(gs.turn).toBe(1);
    });

    test('cities 数组非空', () => {
        expect(gs.cities.length).toBeGreaterThan(0);
    });

    test('factions 数组非空', () => {
        expect(gs.factions.length).toBeGreaterThan(0);
    });

    test('generals 数组非空', () => {
        expect(gs.generals.length).toBeGreaterThan(0);
    });

    test('每个武将有 hp/maxHp/mp/maxMp 字段', () => {
        for (const g of gs.generals) {
            expect(g.hp).toBeGreaterThan(0);
            expect(g.maxHp).toBeGreaterThan(0);
            expect(g.mp).toBeGreaterThan(0);
            expect(g.maxMp).toBeGreaterThan(0);
        }
    });

    test('玩家势力 isPlayer 为 true', () => {
        const pf = gs.getPlayerFaction();
        expect(pf).not.toBeNull();
        expect(pf.isPlayer).toBe(true);
    });

    test('其余势力 isPlayer 为 false', () => {
        for (const f of gs.factions) {
            if (f.id !== 'cao_cao') {
                expect(f.isPlayer).toBe(false);
            }
        }
    });

    test('actionPoints 等于 maxActionPoints', () => {
        expect(gs.actionPoints).toBe(gs.maxActionPoints);
    });

    test('marches 初始为空', () => {
        expect(gs.marches).toEqual([]);
    });

    test('玩家势力至少拥有一座城池', () => {
        const cities = gs.getCitiesOf('cao_cao');
        expect(cities.length).toBeGreaterThan(0);
    });

    test('城中武将引用存在于 generals 列表', () => {
        for (const city of gs.cities) {
            for (const gid of city.generals) {
                const gen = gs.getGeneral(gid);
                expect(gen).not.toBeNull();
            }
        }
    });

    test('HP 公式 100 + war*2 + lead 正确', () => {
        const g = gs.getGeneral('cao_cao');
        expect(g).not.toBeNull();
        const expected = 100 + g.war * 2 + g.lead;
        expect(g.maxHp).toBe(expected);
    });

    test('MP 公式 50 + int*2 正确', () => {
        const g = gs.getGeneral('cao_cao');
        const expected = 50 + g.int * 2;
        expect(g.maxMp).toBe(expected);
    });
});

// ─────────────────────────────────────────────
// createMarch — 行军回合数计算
// ─────────────────────────────────────────────
describe('GameState.createMarch() — 行军回合数', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    function makeMarch(x1, y1, x2, y2) {
        // 临时插入两个测试城池
        const src = { id: 'src_city', name: '出发城', x: x1, y: y1 };
        const tgt = { id: 'tgt_city', name: '目标城', x: x2, y: y2 };
        gs.cities.push(src, tgt);
        const march = gs.createMarch('attack', 'cao_cao', [], 'src_city', 'tgt_city');
        // 清理临时城池
        gs.cities.splice(gs.cities.indexOf(src), 1);
        gs.cities.splice(gs.cities.indexOf(tgt), 1);
        return march;
    }

    test('距离 <=60 → 1 回合', () => {
        const march = makeMarch(0, 0, 40, 0); // dist=40
        expect(march.turnsTotal).toBe(1);
    });

    test('距离 <=120 → 2 回合', () => {
        const march = makeMarch(0, 0, 90, 0); // dist=90
        expect(march.turnsTotal).toBe(2);
    });

    test('距离 <=200 → 3 回合', () => {
        const march = makeMarch(0, 0, 150, 0); // dist=150
        expect(march.turnsTotal).toBe(3);
    });

    test('距离 >200 → 4 回合', () => {
        const march = makeMarch(0, 0, 300, 0); // dist=300
        expect(march.turnsTotal).toBe(4);
    });

    test('边界值 dist=60 → 1 回合', () => {
        const march = makeMarch(0, 0, 60, 0);
        expect(march.turnsTotal).toBe(1);
    });

    test('边界值 dist=61 → 2 回合', () => {
        const march = makeMarch(0, 0, 61, 0);
        expect(march.turnsTotal).toBe(2);
    });

    test('创建的行军对象结构正确', () => {
        const march = makeMarch(0, 0, 40, 0);
        expect(march).toHaveProperty('id');
        expect(march).toHaveProperty('turnsRemaining');
        expect(march.turnsRemaining).toBe(march.turnsTotal);
        expect(march.generalIds).toEqual([]);
    });

    test('连续创建行军 id 递增', () => {
        const m1 = makeMarch(0, 0, 40, 0);
        const m2 = makeMarch(0, 0, 40, 0);
        expect(m2.id).toBe(m1.id + 1);
    });
});

// ─────────────────────────────────────────────
// checkVictory
// ─────────────────────────────────────────────
describe('GameState.checkVictory()', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('多方势力存活时返回 null', () => {
        expect(gs.checkVictory()).toBeNull();
    });

    test('玩家是唯一存活势力 → victory', () => {
        for (const f of gs.factions) {
            if (f.id !== 'cao_cao') f.alive = false;
        }
        expect(gs.checkVictory()).toBe('victory');
    });

    test('玩家势力被消灭 → defeat', () => {
        const pf = gs.getPlayerFaction();
        pf.alive = false;
        expect(gs.checkVictory()).toBe('defeat');
    });

    test('其他势力是唯一存活 → defeat', () => {
        for (const f of gs.factions) {
            if (f.id === 'cao_cao') f.alive = false;
            // keep one other alive
        }
        expect(gs.checkVictory()).toBe('defeat');
    });
});

// ─────────────────────────────────────────────
// getters
// ─────────────────────────────────────────────
describe('GameState — Getter 方法', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('getCity 返回正确城池', () => {
        const city = gs.cities[0];
        expect(gs.getCity(city.id)).toBe(city);
    });

    test('getCity 不存在 id → falsy', () => {
        expect(gs.getCity('nonexistent_city_xyz')).toBeFalsy();
    });

    test('getGeneral 返回正确武将', () => {
        const g = gs.getGeneral('cao_cao');
        expect(g).not.toBeNull();
        expect(g.id).toBe('cao_cao');
    });

    test('getFaction 返回正确势力', () => {
        const f = gs.getFaction('cao_cao');
        expect(f).not.toBeNull();
        expect(f.id).toBe('cao_cao');
    });

    test('getCitiesOf 只返回该势力城池', () => {
        const cities = gs.getCitiesOf('cao_cao');
        for (const c of cities) {
            expect(c.owner).toBe('cao_cao');
        }
    });

    test('getGeneralsOf 不包含 dead 状态武将', () => {
        const g = gs.generals[0];
        g.faction = 'cao_cao';
        g.status = 'dead';
        const list = gs.getGeneralsOf('cao_cao');
        expect(list.find(x => x.id === g.id)).toBeUndefined();
    });

    test('getAliveFactions 只返回 alive=true 的势力', () => {
        gs.factions[0].alive = false;
        const alive = gs.getAliveFactions();
        for (const f of alive) {
            expect(f.alive).toBe(true);
        }
    });
});

// ─────────────────────────────────────────────
// _assignSkills
// ─────────────────────────────────────────────
describe('GameState._assignSkills()', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('项羽获得专属技能', () => {
        const xiang = gs.getGeneral('xiang_yu');
        if (xiang) {
            expect(xiang.skills).toContain('qianguwuer');
        }
    });

    test('普通武将技能数 >= 2', () => {
        const g = gs.getGeneral('cao_cao');
        if (g) {
            gs._assignSkills(g);
            expect(g.skills.length).toBeGreaterThanOrEqual(2);
        }
    });

    test('武将技能 id 都存在于 skills 列表', () => {
        const skillIds = new Set(gs.skills.map(s => s.id));
        const g = gs.getGeneral('cao_cao');
        if (g) {
            gs._assignSkills(g);
            for (const sid of g.skills) {
                expect(skillIds.has(sid)).toBe(true);
            }
        }
    });
});

// ─────────────────────────────────────────────
// loadFromSave
// ─────────────────────────────────────────────
describe('GameState.loadFromSave()', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    function makeSaveData(gsSource) {
        return {
            turn: 5,
            playerFaction: gsSource.playerFaction,
            cities: gsSource.cities.map(c => ({ id: c.id, owner: c.owner, soldiers: c.soldiers, generals: c.generals, development: c.development, morale: c.morale })),
            factions: gsSource.factions.map(f => ({ id: f.id, alive: f.alive, gold: f.gold, food: f.food, fame: f.fame, allies: f.allies, enemies: f.enemies, actionsUsed: f.actionsUsed })),
            generals: gsSource.generals.map(g => ({ id: g.id, faction: g.faction, city: g.city, status: g.status, hp: g.hp, mp: g.mp, soldiers: g.soldiers, skills: g.skills, equipment: g.equipment, cooldowns: g.cooldowns, actionUsed: g.actionUsed, level: g.level, exp: g.exp, loyalty: g.loyalty })),
            marches: [],
            _marchIdCounter: 0
        };
    }

    test('恢复 turn', () => {
        const save = makeSaveData(gs);
        save.turn = 7;
        gs.loadFromSave(save);
        expect(gs.turn).toBe(7);
    });

    test('恢复 playerFaction', () => {
        const save = makeSaveData(gs);
        gs.loadFromSave(save);
        expect(gs.playerFaction).toBe('cao_cao');
    });

    test('恢复城池数据', () => {
        const save = makeSaveData(gs);
        const firstCityId = save.cities[0].id;
        save.cities[0].soldiers = 9999;
        gs.loadFromSave(save);
        expect(gs.getCity(firstCityId).soldiers).toBe(9999);
    });

    test('恢复势力存活状态', () => {
        const save = makeSaveData(gs);
        // 消灭一个非玩家势力
        const enemy = save.factions.find(f => f.id !== 'cao_cao');
        if (enemy) {
            enemy.alive = false;
            gs.loadFromSave(save);
            expect(gs.getFaction(enemy.id).alive).toBe(false);
        }
    });

    test('玩家势力 isPlayer 在 loadFromSave 后为 true', () => {
        const save = makeSaveData(gs);
        gs.loadFromSave(save);
        expect(gs.getPlayerFaction().isPlayer).toBe(true);
    });

    test('恢复武将 hp/soldiers/faction', () => {
        const save = makeSaveData(gs);
        const gSave = save.generals.find(g => g.id === 'cao_cao');
        if (gSave) {
            gSave.hp = 50;
            gSave.soldiers = 777;
        }
        gs.loadFromSave(save);
        const gen = gs.getGeneral('cao_cao');
        expect(gen.hp).toBe(50);
        expect(gen.soldiers).toBe(777);
    });

    test('恢复行军列表', () => {
        const save = makeSaveData(gs);
        save.marches = [{ id: 1, type: 'attack', faction: 'cao_cao', generalIds: [], sourceCity: 'x', targetCity: 'y', turnsTotal: 2, turnsRemaining: 1, animProgress: 0, progress: 0, departTurn: 1, travelTime: 2, arrivalTurn: 3 }];
        save._marchIdCounter = 1;
        gs.loadFromSave(save);
        expect(gs.marches).toHaveLength(1);
        expect(gs._marchIdCounter).toBe(1);
    });

    test('缺失的武将存档返回默认值（hp 为 maxHp）', () => {
        const save = makeSaveData(gs);
        // 移除某个武将的存档，让它走默认初始化
        const targetId = save.generals[0].id;
        save.generals = save.generals.filter(g => g.id !== targetId);
        gs.loadFromSave(save);
        const gen = gs.getGeneral(targetId);
        if (gen) {
            expect(gen.hp).toBe(gen.maxHp);
        }
    });
});

// ─────────────────────────────────────────────
// getItem / getUnaffiliatedGenerals / getGarrisonCount
// ─────────────────────────────────────────────
describe('GameState — 额外 Getter 方法', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('getItem 返回存在的物品', () => {
        const item = gs.items[0];
        expect(gs.getItem(item.id)).toBe(item);
    });

    test('getItem 不存在 id → falsy', () => {
        expect(gs.getItem('nonexistent_item_xyz')).toBeFalsy();
    });

    test('getUnaffiliatedGenerals 只返回 faction=none 且非 dead 的武将', () => {
        const g = gs.generals[0];
        const origFaction = g.faction;
        g.faction = 'none';
        g.status = 'idle';
        const list = gs.getUnaffiliatedGenerals();
        expect(list.some(x => x.id === g.id)).toBe(true);
        g.faction = origFaction;
    });

    test('getUnaffiliatedGenerals 不包含 dead 状态', () => {
        const g = gs.generals[0];
        const origFaction = g.faction;
        g.faction = 'none';
        g.status = 'dead';
        const list = gs.getUnaffiliatedGenerals();
        expect(list.some(x => x.id === g.id)).toBe(false);
        g.faction = origFaction;
    });

    test('getGarrisonCount 只统计 idle 状态', () => {
        const city = gs.cities.find(c => c.generals.length > 0);
        if (!city) return;
        const idleCount = gs.getGarrisonCount(city.id);
        const idleGen = gs.generals.find(g => g.city === city.id && g.status === 'idle');
        if (idleGen) {
            idleGen.status = 'marching';
            expect(gs.getGarrisonCount(city.id)).toBe(idleCount - 1);
            idleGen.status = 'idle';
        }
    });

    test('getGarrisonCount 不统计 encamped 武将', () => {
        const city = gs.cities.find(c => c.generals.length > 0);
        if (!city) return;
        const idleCount = gs.getGarrisonCount(city.id);
        const idleGen = gs.generals.find(g => g.city === city.id && g.status === 'idle');
        if (idleGen) {
            idleGen.status = 'encamped';
            expect(gs.getGarrisonCount(city.id)).toBe(idleCount - 1);
            idleGen.status = 'idle';
        }
    });

    test('getGeneralsInCity 排除 captured 武将', () => {
        const city = gs.cities.find(c => c.generals.length > 0);
        if (!city) return;
        const gen = gs.generals.find(g => g.city === city.id && g.status === 'idle');
        if (gen) {
            gen.status = 'captured';
            const list = gs.getGeneralsInCity(city.id);
            expect(list.some(x => x.id === gen.id)).toBe(false);
            gen.status = 'idle';
        }
    });
});

// ─────────────────────────────────────────────
// addNotification
// ─────────────────────────────────────────────
describe('GameState.addNotification()', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('添加通知到列表', () => {
        const before = gs.notifications.length;
        gs.addNotification('测试通知');
        expect(gs.notifications.length).toBe(before + 1);
    });

    test('通知包含 text / type / turn', () => {
        gs.addNotification('警告消息', 'warning');
        const notif = gs.notifications[gs.notifications.length - 1];
        expect(notif.text).toBe('警告消息');
        expect(notif.type).toBe('warning');
        expect(notif.turn).toBe(gs.turn);
    });

    test('默认 type 为 info', () => {
        gs.addNotification('信息');
        const notif = gs.notifications[gs.notifications.length - 1];
        expect(notif.type).toBe('info');
    });
});

// ─────────────────────────────────────────────
// createMarch — departTurn / arrivalTurn
// ─────────────────────────────────────────────
describe('GameState.createMarch() — 时间轴字段', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('departTurn 默认为当前 turn', () => {
        gs.cities.push({ id: 'cA', x: 0, y: 0 }, { id: 'cB', x: 40, y: 0 });
        gs.turn = 3;
        const march = gs.createMarch('attack', 'cao_cao', [], 'cA', 'cB');
        expect(march.departTurn).toBe(3);
    });

    test('departTurnOverride 覆盖默认值', () => {
        gs.cities.push({ id: 'cA', x: 0, y: 0 }, { id: 'cB', x: 40, y: 0 });
        const march = gs.createMarch('attack', 'cao_cao', [], 'cA', 'cB', 7);
        expect(march.departTurn).toBe(7);
    });

    test('arrivalTurn = departTurn + travelTime', () => {
        gs.cities.push({ id: 'cA', x: 0, y: 0 }, { id: 'cB', x: 40, y: 0 });
        const march = gs.createMarch('attack', 'cao_cao', [], 'cA', 'cB');
        expect(march.arrivalTurn).toBe(march.departTurn + march.travelTime);
    });

    test('行军 push 到 gs.marches', () => {
        gs.cities.push({ id: 'cA', x: 0, y: 0 }, { id: 'cB', x: 40, y: 0 });
        const before = gs.marches.length;
        gs.createMarch('attack', 'cao_cao', [], 'cA', 'cB');
        expect(gs.marches.length).toBe(before + 1);
    });

    test('城池不存在时返回 null', () => {
        const march = gs.createMarch('attack', 'cao_cao', [], 'no_such_city', 'also_none');
        expect(march).toBeNull();
    });
});

// ─────────────────────────────────────────────
// getGeneralMarch
// ─────────────────────────────────────────────
describe('GameState.getGeneralMarch()', () => {
    let gs;
    beforeEach(() => {
        gs = new GameState();
        gs.initNewGame('cao_cao');
    });

    test('武将不在行军中 → null', () => {
        expect(gs.getGeneralMarch('cao_cao')).toBeNull();
    });

    test('武将在行军中 → 返回该行军对象', () => {
        // 添加临时城池并创建行军
        gs.cities.push({ id: 'c1', x: 0, y: 0 }, { id: 'c2', x: 40, y: 0 });
        gs.createMarch('attack', 'cao_cao', ['cao_cao'], 'c1', 'c2');
        const march = gs.getGeneralMarch('cao_cao');
        expect(march).not.toBeNull();
        expect(march.generalIds).toContain('cao_cao');
    });
});
