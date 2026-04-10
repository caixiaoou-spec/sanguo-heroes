/**
 * battle_logic.test.js — BattleLogic 纯逻辑层测试
 *
 * 覆盖 js/scenes/battle_logic.js 中不依赖 canvas/renderer 的方法：
 *   - _getFormationPositions   阵型位置计算
 *   - _getRetreatInfo          撤退条件判断
 *   - _handleInterceptionAfterBattle  拦截战结算
 *   - _spawnDuelSoldiers       士兵生成
 *   - _doRetreat               撤退副作用（含路径阻截）
 */

import { BattleLogic } from '../../js/scenes/battle_logic.js';
import {
    createMockGameState,
    createMockGeneral,
    createMockCity,
    createMockFaction,
    createMockBattle,
    createMockBattleUnit,
} from '../helpers/mockGameState.js';

// ─────────────────────────────────────────────
// 辅助：构建最小化 scene mock
// ─────────────────────────────────────────────

/**
 * 默认场景：player 作为攻方进攻 city_b
 *   city_a (player) ─── city_b (enemy)
 */
function makeScene(overrides = {}) {
    const cityA = createMockCity({ id: 'city_a', owner: 'player_fac', x: 100, y: 100, neighbors: ['city_b'], generals: [] });
    const cityB = createMockCity({ id: 'city_b', owner: 'enemy_fac',  x: 200, y: 100, neighbors: ['city_a'], generals: [] });
    const playerFac = createMockFaction({ id: 'player_fac', isPlayer: true });
    const enemyFac  = createMockFaction({ id: 'enemy_fac' });
    const playerGen = createMockGeneral({ id: 'p1', faction: 'player_fac', city: 'city_a', soldiers: 1000 });
    const enemyGen  = createMockGeneral({ id: 'e1', faction: 'enemy_fac',  city: 'city_b', soldiers: 800 });

    const gs = createMockGameState({
        playerFaction: 'player_fac',
        cities: [cityA, cityB],
        factions: [playerFac, enemyFac],
        generals: [playerGen, enemyGen],
    });

    const playerUnit = createMockBattleUnit({ id: 'p1', faction: 'player_fac', city: 'city_a', soldiers: 1000 }, { state: 'idle' });
    playerUnit.general = playerGen;
    const enemyUnit  = createMockBattleUnit({ id: 'e1', faction: 'enemy_fac',  city: 'city_b', soldiers: 800  }, { state: 'idle' });
    enemyUnit.general = enemyGen;

    const battle = createMockBattle({
        isInterception: false,
        attacker: { faction: playerFac, generals: [playerUnit], city: null },
        defender: { faction: enemyFac,  generals: [enemyUnit],  city: cityB },
        result: null,
    });

    const scene = {
        gs,
        battle,
        playerSide: 'attacker',
        _isRetreatBreakthrough: false,
        _retreatFinalDestination: null,
        _duelLeftPos:  null,
        _duelRightPos: null,
        game: {
            audio: { stopBGM: jest.fn() },
            switchScene: jest.fn(),
            _battleReturnData: {
                isInterception: false,
                attackerSourceCity: 'city_a',
                defenderSourceCity: 'city_b',
                attackerTargetCity: 'city_b',
                defenderTargetCity: 'city_a',
            },
        },
        combat: { aiPickNextGeneral: jest.fn().mockReturnValue(null) },
        ...overrides,
    };

    return { scene, gs, playerGen, enemyGen, playerUnit, enemyUnit, cityA, cityB, playerFac, enemyFac };
}

// ─────────────────────────────────────────────
// _getFormationPositions
// ─────────────────────────────────────────────
describe('BattleLogic._getFormationPositions()', () => {
    const { scene } = makeScene();
    const logic = new BattleLogic(scene);

    function makeGenerals(n) {
        return Array.from({ length: n }, (_, i) =>
            createMockGeneral({ id: `g${i}` })
        );
    }

    test('返回与将领数量相等的 positions', () => {
        const pos = logic._getFormationPositions('arrow', makeGenerals(3), 'left');
        expect(pos.length).toBe(3);
    });

    test('每个 position 包含 x、y、soldierOffsets', () => {
        const pos = logic._getFormationPositions('crane_wing', makeGenerals(2), 'left');
        for (const p of pos) {
            expect(typeof p.x).toBe('number');
            expect(typeof p.y).toBe('number');
            expect(Array.isArray(p.soldierOffsets)).toBe(true);
        }
    });

    test('left 侧 arrow 阵：主将 x 在基准 x(100) 右侧', () => {
        const [p] = logic._getFormationPositions('arrow', makeGenerals(1), 'left');
        expect(p.x).toBeGreaterThan(100);
    });

    test('right 侧 arrow 阵：主将 x 在基准 x(1100) 左侧', () => {
        const [p] = logic._getFormationPositions('arrow', makeGenerals(1), 'right');
        expect(p.x).toBeLessThan(1100);
    });

    test('circle 阵：soldierOffsets 有 8 个', () => {
        const [p] = logic._getFormationPositions('circle', makeGenerals(1), 'left');
        expect(p.soldierOffsets.length).toBe(8);
    });

    test('fish 阵：soldierOffsets 有 6 个', () => {
        const [p] = logic._getFormationPositions('fish', makeGenerals(1), 'left');
        expect(p.soldierOffsets.length).toBe(6);
    });

    test('单将（isDuel）时 arrow 阵 x 偏移量和多将不同', () => {
        const [single] = logic._getFormationPositions('arrow', makeGenerals(1), 'left');
        const [multi]  = logic._getFormationPositions('arrow', makeGenerals(3), 'left');
        // isDuel=true 时 dir*90，否则 dir*80
        expect(single.x).not.toBe(multi.x);
    });

    test('未知阵型 fallback 到 crane_wing：soldierOffsets 有 6 个', () => {
        const [p] = logic._getFormationPositions('unknown_formation', makeGenerals(1), 'left');
        expect(p.soldierOffsets.length).toBe(6);
    });

    test('goose 阵：多将时 y 各不相同', () => {
        const pos = logic._getFormationPositions('goose', makeGenerals(3), 'left');
        const ys = pos.map(p => p.y);
        expect(new Set(ys).size).toBe(3);
    });
});

// ─────────────────────────────────────────────
// _getRetreatInfo
// ─────────────────────────────────────────────
describe('BattleLogic._getRetreatInfo()', () => {
    test('进攻方（普通战斗）：可撤退，损兵30%', () => {
        const { scene } = makeScene();
        scene.playerSide = 'attacker';
        scene.battle.isInterception = false;
        const logic = new BattleLogic(scene);
        const info = logic._getRetreatInfo();
        expect(info.canRetreat).toBe(true);
        expect(info.label).toMatch(/30%/);
    });

    test('防御方有其他城市：可弃城撤退，损兵40%', () => {
        const { scene, gs } = makeScene();
        scene.playerSide = 'defender';
        scene.battle.isInterception = false;
        // 增加一个额外的己方城市（city_c）
        const cityC = createMockCity({ id: 'city_c', owner: 'player_fac', x: 300, y: 100, generals: [] });
        gs.cities.push(cityC);
        const logic = new BattleLogic(scene);
        const info = logic._getRetreatInfo();
        expect(info.canRetreat).toBe(true);
        expect(info.label).toMatch(/40%/);
    });

    test('防御方无其他城市：不可撤退', () => {
        const { scene } = makeScene();
        scene.playerSide = 'defender';
        scene.battle.isInterception = false;
        // 让 player 只拥有 city_b（battle.defender.city），city_a 归敌方
        scene.gs.getCity('city_a').owner = 'enemy_fac';
        scene.gs.getCity('city_b').owner = 'player_fac';
        scene.battle.defender.city = scene.gs.getCity('city_b');
        // 此时 getCitiesOf('player_fac') = [city_b]，过滤掉 city_b 后 otherCities = []
        const logic = new BattleLogic(scene);
        const info = logic._getRetreatInfo();
        expect(info.canRetreat).toBe(false);
        expect(info.label).toBe('');
    });

    test('拦截战：双方均可撤退，损兵25%', () => {
        const { scene } = makeScene();
        scene.battle.isInterception = true;
        const logic = new BattleLogic(scene);
        const info = logic._getRetreatInfo();
        expect(info.canRetreat).toBe(true);
        expect(info.label).toMatch(/25%/);
    });

    test('突围撤退（_isRetreatBreakthrough=true）：损兵50%', () => {
        const { scene } = makeScene();
        scene._isRetreatBreakthrough = true;
        const logic = new BattleLogic(scene);
        const info = logic._getRetreatInfo();
        expect(info.canRetreat).toBe(true);
        expect(info.label).toMatch(/50%/);
    });
});

// ─────────────────────────────────────────────
// _handleInterceptionAfterBattle
// ─────────────────────────────────────────────
describe('BattleLogic._handleInterceptionAfterBattle()', () => {
    test('非拦截战：直接返回，不生成行军', () => {
        const { scene, gs } = makeScene();
        scene.battle.isInterception = false;
        const logic = new BattleLogic(scene);
        logic._handleInterceptionAfterBattle();
        expect(gs.marches.length).toBe(0);
    });

    test('拦截战 + 进攻方胜：胜者继续向攻方目标城行军', () => {
        const { scene, gs, playerGen, cityA, cityB } = makeScene();
        // 让 cityB 有一个供胜者到达的目标城 cityC
        const cityC = createMockCity({ id: 'city_c', owner: 'enemy_fac', x: 300, y: 100, neighbors: ['city_b'], generals: [] });
        gs.cities.push(cityC);

        scene.battle.isInterception = true;
        scene.battle.result = 'attacker_wins';
        scene.playerSide = 'attacker';
        scene.game._battleReturnData = {
            isInterception: true,
            attackerSourceCity: 'city_a',
            defenderSourceCity: 'city_b',
            attackerTargetCity: 'city_c',
            defenderTargetCity: 'city_a',
        };

        // 攻方胜将领：playerUnit.state = 'idle'（非 dead）
        const playerUnit = scene.battle.attacker.generals[0];
        playerUnit.state = 'idle';
        playerGen.city = 'city_b'; // 战斗后临时放在city_b
        gs.getCity('city_b').generals = ['p1'];

        const logic = new BattleLogic(scene);
        logic._handleInterceptionAfterBattle();

        expect(gs.marches.length).toBeGreaterThan(0);
        const march = gs.marches[0];
        expect(march.type).toBe('attack');
        expect(march.faction).toBe('player_fac');
        expect(march.targetCity).toBe('city_c');
    });

    test('拦截战 + 防守方胜：胜者（defender）继续向目标城行军', () => {
        const { scene, gs, enemyGen, cityA, cityB } = makeScene();
        const cityC = createMockCity({ id: 'city_c', owner: 'player_fac', x: 300, y: 100, neighbors: ['city_b'], generals: [] });
        gs.cities.push(cityC);

        scene.battle.isInterception = true;
        scene.battle.result = 'defender_wins';
        scene.playerSide = 'attacker';
        scene.game._battleReturnData = {
            isInterception: true,
            attackerSourceCity: 'city_a',
            defenderSourceCity: 'city_b',
            attackerTargetCity: 'city_c',
            defenderTargetCity: 'city_a',
        };

        const enemyUnit = scene.battle.defender.generals[0];
        enemyUnit.state = 'idle';
        enemyGen.city = 'city_b';
        gs.getCity('city_b').generals = ['e1'];

        const logic = new BattleLogic(scene);
        logic._handleInterceptionAfterBattle();

        expect(gs.marches.length).toBeGreaterThan(0);
        const march = gs.marches[0];
        expect(march.faction).toBe('enemy_fac');
        expect(march.targetCity).toBe('city_a');
    });
});

// ─────────────────────────────────────────────
// _spawnDuelSoldiers
// ─────────────────────────────────────────────
describe('BattleLogic._spawnDuelSoldiers()', () => {
    function makeDuelUnits(leftSoldiers, rightSoldiers) {
        const { scene } = makeScene();
        const leftUnit = {
            general: createMockGeneral({ unitType: 'infantry' }),
            x: 200, y: 300,
            soldiers: leftSoldiers,
            state: 'idle',
        };
        const rightUnit = {
            general: createMockGeneral({ unitType: 'cavalry' }),
            x: 1000, y: 300,
            soldiers: rightSoldiers,
            state: 'idle',
        };
        return { scene, leftUnit, rightUnit };
    }

    test('左侧生成 min(20, floor(soldiers/100)) 个士兵', () => {
        const { scene, leftUnit, rightUnit } = makeDuelUnits(1500, 800);
        const logic = new BattleLogic(scene);
        logic._spawnDuelSoldiers(leftUnit, rightUnit);
        expect(scene.battle.soldiers.left.length).toBe(Math.min(20, Math.floor(1500 / 100)));
    });

    test('右侧生成 min(20, floor(soldiers/100)) 个士兵', () => {
        const { scene, leftUnit, rightUnit } = makeDuelUnits(500, 2500);
        const logic = new BattleLogic(scene);
        logic._spawnDuelSoldiers(leftUnit, rightUnit);
        expect(scene.battle.soldiers.right.length).toBe(Math.min(20, Math.floor(2500 / 100)));
    });

    test('生成士兵有 hp、state、type 字段', () => {
        const { scene, leftUnit, rightUnit } = makeDuelUnits(500, 500);
        const logic = new BattleLogic(scene);
        logic._spawnDuelSoldiers(leftUnit, rightUnit);
        for (const s of scene.battle.soldiers.left) {
            expect(s.hp).toBe(3);
            expect(s.state).toBe('advance');
            expect(s.type).toBe('infantry');
        }
        for (const s of scene.battle.soldiers.right) {
            expect(s.type).toBe('cavalry');
        }
    });

    test('调用前先清空旧士兵', () => {
        const { scene, leftUnit, rightUnit } = makeDuelUnits(200, 200);
        scene.battle.soldiers.left  = [{ x: 0, y: 0, hp: 3, state: 'old' }];
        scene.battle.soldiers.right = [{ x: 0, y: 0, hp: 3, state: 'old' }];
        const logic = new BattleLogic(scene);
        logic._spawnDuelSoldiers(leftUnit, rightUnit);
        // 旧士兵应被清除，新士兵重新生成
        for (const s of scene.battle.soldiers.left)  expect(s.state).not.toBe('old');
        for (const s of scene.battle.soldiers.right) expect(s.state).not.toBe('old');
    });

    test('士兵数量为 0 时不生成任何士兵', () => {
        const { scene, leftUnit, rightUnit } = makeDuelUnits(0, 0);
        const logic = new BattleLogic(scene);
        logic._spawnDuelSoldiers(leftUnit, rightUnit);
        expect(scene.battle.soldiers.left.length).toBe(0);
        expect(scene.battle.soldiers.right.length).toBe(0);
    });
});

// ─────────────────────────────────────────────
// _doRetreat — 撤退路径阻截（间接覆盖 findRetreatBlocker）
// ─────────────────────────────────────────────
describe('BattleLogic._doRetreat() — 路径阻截', () => {
    /**
     * 场景：city_a(player) ── city_b(enemy) ── city_c(player)
     * 玩家从 city_a 发兵进攻 city_c，战斗后撤退；
     * 回程 city_c → city_a 必须经过 city_b（enemy），触发阻截
     */
    function makeBlockingScene() {
        const cityA = createMockCity({ id: 'city_a', owner: 'player_fac', x: 100, y: 100, neighbors: ['city_b'], generals: [] });
        const cityB = createMockCity({ id: 'city_b', owner: 'enemy_fac',  x: 200, y: 100, neighbors: ['city_a', 'city_c'], generals: [] });
        const cityC = createMockCity({ id: 'city_c', owner: 'enemy_fac',  x: 300, y: 100, neighbors: ['city_b'], generals: [] });
        const playerFac = createMockFaction({ id: 'player_fac', isPlayer: true });
        const enemyFac  = createMockFaction({ id: 'enemy_fac' });
        const playerGen = createMockGeneral({ id: 'p1', faction: 'player_fac', city: 'city_c', soldiers: 800 });
        const gs = createMockGameState({
            playerFaction: 'player_fac',
            cities: [cityA, cityB, cityC],
            factions: [playerFac, enemyFac],
            generals: [playerGen],
        });

        const playerUnit = createMockBattleUnit({}, { state: 'idle' });
        playerUnit.general = playerGen;

        const battle = createMockBattle({
            isInterception: false,
            attacker: { faction: playerFac, generals: [playerUnit], city: null },
            defender: { faction: enemyFac,  generals: [],            city: cityC },
            result: null,
        });
        // playerGen 当前在 city_c（攻方打到了敌城）
        gs.getCity('city_c').generals = ['p1'];

        const scene = {
            gs,
            battle,
            playerSide: 'attacker',
            _isRetreatBreakthrough: false,
            _retreatFinalDestination: null,
            game: {
                audio: { stopBGM: jest.fn() },
                switchScene: jest.fn(),
                _battleReturnData: {
                    isInterception: false,
                    attackerSourceCity: 'city_a',  // 撤退目标
                    defenderSourceCity: 'city_c',
                    attackerTargetCity: 'city_c',
                    defenderTargetCity: 'city_a',
                },
            },
            combat: { aiPickNextGeneral: jest.fn() },
        };

        return { scene, gs, playerGen };
    }

    test('撤退路径无阻截：生成普通 transfer 行军', () => {
        // 直连城市，无中间敌方
        const { scene, gs } = makeScene();
        // city_a(player) --- city_b(enemy)，进攻 city_b 后撤退回 city_a
        // city_a 直接相邻，无阻截
        const playerGen = gs.getGeneral('p1');
        playerGen.city = 'city_b';
        gs.getCity('city_b').generals = ['p1'];

        const logic = new BattleLogic(scene);
        logic._doRetreat();

        const marchTypes = gs.marches.map(m => m.type);
        expect(marchTypes).toContain('transfer');
        expect(gs.marches.find(m => m.isRetreatBreakthrough)).toBeUndefined();
    });

    test('撤退路径有敌方阻截：生成 isRetreatBreakthrough=true 的 attack 行军', () => {
        const { scene, gs } = makeBlockingScene();
        const logic = new BattleLogic(scene);
        logic._doRetreat();

        const breakthrough = gs.marches.find(m => m.isRetreatBreakthrough);
        expect(breakthrough).toBeDefined();
        expect(breakthrough.type).toBe('attack');
        expect(breakthrough.targetCity).toBe('city_b'); // 阻截城市
        expect(breakthrough.retreatFinalDestination).toBe('city_a');
    });

    test('进攻方撤退后将领 soldiers 损失30%', () => {
        const { scene, gs } = makeScene();
        const playerGen = gs.getGeneral('p1');
        playerGen.city = 'city_b';
        playerGen.soldiers = 1000;
        gs.getCity('city_b').generals = ['p1'];

        const logic = new BattleLogic(scene);
        logic._doRetreat();

        expect(playerGen.soldiers).toBe(700); // 1000 * 0.7
    });

    test('突围撤退（_isRetreatBreakthrough=true）：损失50%，直接生成 transfer 行军', () => {
        const { scene, gs } = makeScene();
        scene._isRetreatBreakthrough = true;
        scene._retreatFinalDestination = 'city_a';

        const playerGen = gs.getGeneral('p1');
        playerGen.city = 'city_b';
        playerGen.soldiers = 1000;
        gs.getCity('city_b').generals = ['p1'];

        const logic = new BattleLogic(scene);
        logic._doRetreat();

        expect(playerGen.soldiers).toBe(500); // 1000 * 0.5
        const march = gs.marches.find(m => m.type === 'transfer' && m.targetCity === 'city_a');
        expect(march).toBeDefined();
        expect(scene.game.switchScene).toHaveBeenCalledWith('worldmap');
    });

    test('防御方撤退：city_b 被攻方占领', () => {
        const { scene, gs, enemyGen, enemyFac } = makeScene();
        scene.playerSide = 'defender';
        scene.battle.isInterception = false;

        // 添加第二个己方城市（player_fac 的 city_c）以便撤退
        const cityC = createMockCity({ id: 'city_c', owner: 'player_fac', x: 300, y: 100, neighbors: ['city_b'], generals: [] });
        gs.cities.push(cityC);

        // playerGen 在 city_b（防守位置）
        const playerGen = gs.getGeneral('p1');
        playerGen.city = 'city_b';
        gs.getCity('city_b').owner = 'player_fac'; // player is defender
        gs.getCity('city_b').generals = ['p1'];

        // 设置战斗：player 是防守方，enemy 是进攻方
        scene.battle.attacker = { faction: enemyFac, generals: [scene.battle.defender.generals[0]], city: null };
        scene.battle.defender = {
            faction: gs.getFaction('player_fac'),
            generals: [{
                general: playerGen,
                state: 'idle',
                soldiers: playerGen.soldiers
            }],
            city: gs.getCity('city_b'),
        };
        scene.game._battleReturnData = {
            isInterception: false,
            attackerSourceCity: 'city_a',
            defenderSourceCity: 'city_b',
            attackerTargetCity: 'city_b',
            defenderTargetCity: 'city_a',
        };

        const logic = new BattleLogic(scene);
        logic._doRetreat();

        // 攻方（enemy）应进驻 city_b
        expect(gs.getCity('city_b').owner).toBe('enemy_fac');
        // 防守方将领应标记为撤退中
        expect(playerGen.status).toBe('marching');
        expect(scene.game.switchScene).toHaveBeenCalledWith('worldmap');
    });
});
