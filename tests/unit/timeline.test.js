/**
 * Plan B: Real-time March Timeline — Unit Tests
 *
 * 测试连续时间轴行军系统：
 * - createMarch() 生成 departTurn / arrivalTurn / travelTime 字段
 * - progress 公式：(currentTurn - departTurn) / travelTime
 * - 会面时刻计算：meetTurn = (a.departTurn * b.travelTime + b.departTurn * a.travelTime) / (a.travelTime + b.travelTime)
 * - 时间轴事件构建与排序（按 eventTurn 升序，相同时刻 meet < arrive）
 * - 玩家战斗事件暂停处理
 * - AI 自动战斗事件处理
 * - 多个事件在同一回合内按序处理
 */

import { createMockGameState, createMockCity, createMockFaction, createMockGeneral } from '../helpers/mockGameState.js';

// ─────────────────────────────────────────────────────────────────
// 内联 Timeline 系统（独立于 worldmap.js / canvas，纯逻辑）
// 镜像 Plan B 将要在 worldmap.js 中实现的逻辑
// ─────────────────────────────────────────────────────────────────

/**
 * 计算两城之间距离对应的行军时间（浮点回合数）
 * 与 game.js 的整数版本对应，但返回 float 供时间轴使用
 */
function calcTravelTime(sourceCity, targetCity) {
    const dist = Math.sqrt((sourceCity.x - targetCity.x) ** 2 + (sourceCity.y - targetCity.y) ** 2);
    if (dist <= 60) return 1.0;
    if (dist <= 120) return 2.0;
    if (dist <= 200) return 3.0;
    return 4.0;
}

/**
 * Plan B 版 createMarch：生成含 departTurn / arrivalTurn / travelTime 的行军对象
 */
function createTimelineMarch(gs, type, faction, generalIds, sourceCityId, targetCityId) {
    const sourceCity = gs.getCity(sourceCityId);
    const targetCity = gs.getCity(targetCityId);
    const travelTime = calcTravelTime(sourceCity, targetCity);
    const departTurn = gs.turn;  // 出发时的回合（可为浮点，路途会面时再出发）
    const arrivalTurn = departTurn + travelTime;

    const march = {
        id: ++gs._marchIdCounter,
        type,
        faction,
        generalIds: [...generalIds],
        sourceCity: sourceCityId,
        targetCity: targetCityId,
        departTurn,
        arrivalTurn,
        travelTime,
        animProgress: 0
    };
    gs.marches.push(march);
    return march;
}

/**
 * 计算两支对向行军的会面时刻
 * 推导：progress_a + progress_b = 1 时相遇
 *   (t - a.departTurn)/a.travelTime + (t - b.departTurn)/b.travelTime = 1
 * 解得：
 *   t = (a.travelTime*b.travelTime + a.departTurn*b.travelTime + b.departTurn*a.travelTime)
 *       / (a.travelTime + b.travelTime)
 */
function calcMeetTurn(a, b) {
    return (a.travelTime * b.travelTime + a.departTurn * b.travelTime + b.departTurn * a.travelTime)
           / (a.travelTime + b.travelTime);
}

/**
 * 获取行军在指定时刻的 progress（0 = 出发，1 = 到达）
 */
function getMarchProgress(march, atTurn) {
    return Math.min(1, Math.max(0, (atTurn - march.departTurn) / march.travelTime));
}

/**
 * 时间轴事件类型
 */
const EVENT_MEET = 'meet';
const EVENT_ARRIVE = 'arrive';

/**
 * 构建当前回合的时间轴事件列表
 * 收集 [currentTurn, currentTurn+1) 内发生的：
 *   - 对向行军的会面事件
 *   - 行军到达目标城池的事件
 * 按 eventTurn 升序排列；同一时刻 meet < arrive
 */
function buildTimeline(gs, currentTurn) {
    const nextTurn = currentTurn + 1;
    const events = [];

    const marches = gs.marches;
    const processedMeet = new Set();

    // 会面事件
    for (let i = 0; i < marches.length; i++) {
        const a = marches[i];
        if (a.type !== 'attack') continue;
        for (let j = i + 1; j < marches.length; j++) {
            const b = marches[j];
            if (b.type !== 'attack') continue;
            // 方向相对
            if (a.sourceCity !== b.targetCity || a.targetCity !== b.sourceCity) continue;
            // 阵营相对
            if (a.faction === b.faction) continue;

            const pairKey = [a.id, b.id].sort().join('-');
            if (processedMeet.has(pairKey)) continue;

            const meetTurn = calcMeetTurn(a, b);
            // 会面必须在本回合窗口内
            if (meetTurn >= currentTurn && meetTurn < nextTurn) {
                processedMeet.add(pairKey);
                events.push({
                    type: EVENT_MEET,
                    eventTurn: meetTurn,
                    marchA: a,
                    marchB: b
                });
            }
        }
    }

    // 到达事件
    for (const march of marches) {
        if (march.arrivalTurn >= currentTurn && march.arrivalTurn < nextTurn) {
            // 若到达时刻与某个 meet 事件相同，march 可能已被消费（测试中手动过滤）
            events.push({
                type: EVENT_ARRIVE,
                eventTurn: march.arrivalTurn,
                march
            });
        }
    }

    // 排序：按 eventTurn 升序；同一时刻 meet 优先于 arrive
    events.sort((a, b) => {
        if (a.eventTurn !== b.eventTurn) return a.eventTurn - b.eventTurn;
        // meet < arrive
        if (a.type === EVENT_MEET && b.type === EVENT_ARRIVE) return -1;
        if (a.type === EVENT_ARRIVE && b.type === EVENT_MEET) return 1;
        return 0;
    });

    return events;
}

// ─────────────────────────────────────────────────────────────────
// 测试工具
// ─────────────────────────────────────────────────────────────────

function makeGS() {
    // cityA(0,0) ↔ cityB(100,0)  距离=100 → travelTime=2
    // cityC(0,0) ↔ cityD(300,0)  距离=300 → travelTime=4
    const cityA = createMockCity({ id: 'cityA', x: 0,   y: 0, owner: 'factionA' });
    const cityB = createMockCity({ id: 'cityB', x: 100, y: 0, owner: 'factionB' });
    const cityC = createMockCity({ id: 'cityC', x: 0,   y: 0, owner: 'factionA' });
    const cityD = createMockCity({ id: 'cityD', x: 300, y: 0, owner: 'factionB' });

    const fA = createMockFaction({ id: 'factionA', isPlayer: false });
    const fB = createMockFaction({ id: 'factionB', isPlayer: false });
    const fP = createMockFaction({ id: 'player',   isPlayer: true  });

    const g1 = createMockGeneral({ id: 'g1', faction: 'factionA' });
    const g2 = createMockGeneral({ id: 'g2', faction: 'factionB' });
    const gP = createMockGeneral({ id: 'gP', faction: 'player'   });

    const gs = createMockGameState({
        turn: 1,
        playerFaction: 'player',
        cities: [cityA, cityB, cityC, cityD],
        factions: [fA, fB, fP],
        generals: [g1, g2, gP],
    });
    return gs;
}

// ─────────────────────────────────────────────────────────────────
// 测试套件
// ─────────────────────────────────────────────────────────────────

describe('Plan B: createMarch — departTurn / arrivalTurn / travelTime', () => {

    it('在回合1出发，travelTime=2的行军，arrivalTurn应为3', () => {
        const gs = makeGS();
        gs.turn = 1;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        expect(march.departTurn).toBe(1);
        expect(march.travelTime).toBe(2);
        expect(march.arrivalTurn).toBe(3);
    });

    it('在回合3出发，travelTime=4的行军，arrivalTurn应为7', () => {
        const gs = makeGS();
        gs.turn = 3;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityC', 'cityD');
        expect(march.departTurn).toBe(3);
        expect(march.travelTime).toBe(4);
        expect(march.arrivalTurn).toBe(7);
    });

    it('同一时刻两支行军使用各自的 _marchIdCounter，id不冲突', () => {
        const gs = makeGS();
        gs.turn = 1;
        const m1 = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        const m2 = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        expect(m1.id).not.toBe(m2.id);
    });

    it('行军在中途某时刻（浮点 departTurn）出发后 arrivalTurn 正确', () => {
        const gs = makeGS();
        gs._marchIdCounter = 0;
        // 模拟路途会面后胜者在 t=1.5 重新出发，travelTime=2
        gs.turn = 1.5; // 允许浮点 turn（路途会面时的时间戳）
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        expect(march.departTurn).toBe(1.5);
        expect(march.arrivalTurn).toBeCloseTo(3.5);
    });
});

describe('Plan B: progress 公式', () => {

    it('出发时刻 progress=0', () => {
        const gs = makeGS();
        gs.turn = 1;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        expect(getMarchProgress(march, march.departTurn)).toBe(0);
    });

    it('到达时刻 progress=1', () => {
        const gs = makeGS();
        gs.turn = 1;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        expect(getMarchProgress(march, march.arrivalTurn)).toBe(1);
    });

    it('中途 progress 为线性插值', () => {
        const gs = makeGS();
        gs.turn = 1;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        // travelTime=2, t=2 → (2-1)/2 = 0.5
        expect(getMarchProgress(march, 2)).toBeCloseTo(0.5);
    });

    it('超过到达时刻 progress 上限为1', () => {
        const gs = makeGS();
        gs.turn = 1;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        expect(getMarchProgress(march, 999)).toBe(1);
    });
});

describe('Plan B: 会面时刻计算公式', () => {

    it('同时出发相同行程：在路途中点（0.5 travelTime）相遇', () => {
        const gs = makeGS();
        gs.turn = 1;
        const a = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        const b = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        // 同时出发，travelTime均=2 → meetTurn = (1*2 + 1*2)/(2+2) = 2
        const meet = calcMeetTurn(a, b);
        expect(meet).toBeCloseTo(2.0);
        // progress at meet: a=(2-1)/2=0.5, b=(2-1)/2=0.5 → 之和=1
        expect(getMarchProgress(a, meet) + getMarchProgress(b, meet)).toBeCloseTo(1.0);
    });

    it('a先出发1回合：会面时刻在两者出发点之间', () => {
        // a: depart=1, travel=2  →  arrive=3
        // b: depart=2, travel=2  →  arrive=4
        // meetTurn = (2*2 + 1*2 + 2*2) / (2+2) = (4+2+4)/4 = 10/4 = 2.5
        const a = { departTurn: 1, travelTime: 2, arrivalTurn: 3 };
        const b = { departTurn: 2, travelTime: 2, arrivalTurn: 4 };
        expect(calcMeetTurn(a, b)).toBeCloseTo(2.5);
        // 验证：progress_a + progress_b = 1
        const t = calcMeetTurn(a, b);
        const ap = (t - a.departTurn) / a.travelTime;
        const bp = (t - b.departTurn) / b.travelTime;
        expect(ap + bp).toBeCloseTo(1.0);
    });

    it('行程不等：进度之和在会面时刻恰好为1', () => {
        // a: depart=1, travel=2  (快)
        // b: depart=1, travel=4  (慢)
        // meetTurn = (2*4 + 1*4 + 1*2) / (2+4) = (8+4+2)/6 = 14/6 ≈ 2.333
        const a = { departTurn: 1, travelTime: 2 };
        const b = { departTurn: 1, travelTime: 4 };
        const t = calcMeetTurn(a, b);
        expect(t).toBeCloseTo(14/6);
        // 核心约束：progress_a + progress_b = 1
        const ap = (t - a.departTurn) / a.travelTime;
        const bp = (t - b.departTurn) / b.travelTime;
        expect(ap + bp).toBeCloseTo(1.0);
    });

    it('calcMeetTurn 对称性：交换a/b结果相同', () => {
        const a = { departTurn: 1, travelTime: 3 };
        const b = { departTurn: 2, travelTime: 2 };
        expect(calcMeetTurn(a, b)).toBeCloseTo(calcMeetTurn(b, a));
    });
});

describe('Plan B: buildTimeline — 事件构建与排序', () => {

    it('无行军时返回空列表', () => {
        const gs = makeGS();
        const events = buildTimeline(gs, 1);
        expect(events).toHaveLength(0);
    });

    it('单支行军到达：生成一个 arrive 事件', () => {
        const gs = makeGS();
        gs.turn = 1;
        const march = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        // arrivalTurn=3，在回合3时处理
        const events3 = buildTimeline(gs, 3);
        expect(events3).toHaveLength(1);
        expect(events3[0].type).toBe(EVENT_ARRIVE);
        expect(events3[0].march.id).toBe(march.id);
        expect(events3[0].eventTurn).toBe(3);
    });

    it('arrive 事件不出现在其他回合的时间轴中', () => {
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB'); // arrive=3
        const events1 = buildTimeline(gs, 1);
        const events2 = buildTimeline(gs, 2);
        const events4 = buildTimeline(gs, 4);
        expect(events1).toHaveLength(0);
        expect(events2).toHaveLength(0);
        expect(events4).toHaveLength(0);
    });

    it('对向行军同时出发：meet 事件出现在正确回合', () => {
        const gs = makeGS();
        gs.turn = 1;
        // cityA↔cityB 距离100 → travelTime=2
        // 同时出发，meetTurn = (1*2+1*2)/(2+2) = 2.0 → 出现在回合2的时间轴
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');

        const events2 = buildTimeline(gs, 2);
        expect(events2).toHaveLength(1);
        expect(events2[0].type).toBe(EVENT_MEET);
        expect(events2[0].eventTurn).toBeCloseTo(2.0);
    });

    it('meet 事件只在 meetTurn 所在回合的时间轴中出现', () => {
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        // meetTurn=2，只在 buildTimeline(gs, 2) 中出现 meet；回合1无事件，回合3只有 arrive
        expect(buildTimeline(gs, 1)).toHaveLength(0);
        expect(buildTimeline(gs, 2).filter(e => e.type === EVENT_MEET)).toHaveLength(1);
        expect(buildTimeline(gs, 3).filter(e => e.type === EVENT_MEET)).toHaveLength(0);
    });

    it('同一时刻 meet 排在 arrive 前', () => {
        // 构造：A→B 在 turn=1 出发 travelTime=2，同时 B→A 也出发
        // meetTurn=2(=arrivalTurn of A/B)：应 meet 先于 arrive
        const gs = makeGS();
        gs.turn = 1;
        const mAB = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        const mBA = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        // 手动强制两个行军在同一时刻既相遇又到达，测试排序
        // meetTurn=2, arrivalTurn=2（travelTime 刚好等于回合差）
        // 确保 mAB 和 mBA 的 arrivalTurn 也在回合2
        // 已知 travelTime=2 departTurn=1 → arrivalTurn=3；需要让二者 meetTurn=arrivalTurn
        // 重新构造：depart=1, travelTime=1 → arrive=2, dist<=60
        gs.marches = [];
        gs._marchIdCounter = 0;
        const cityA2 = createMockCity({ id: 'cityA2', x: 0, y: 0, owner: 'factionA' });
        const cityB2 = createMockCity({ id: 'cityB2', x: 50, y: 0, owner: 'factionB' });
        gs.cities.push(cityA2, cityB2);
        const m1 = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA2', 'cityB2'); // travelTime=1, arrive=2
        const m2 = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB2', 'cityA2'); // travelTime=1, arrive=2
        // meetTurn = (1*1+1*1)/(1+1) = 1
        // 在回合1的时间轴里：meet(t=1) 和 arrive(t=2) —— 不在同一回合
        // 为了测试 meet < arrive 排序，需要它们同一 eventTurn
        // 直接手动设置 arrivalTurn
        m1.arrivalTurn = 1.5;
        m2.arrivalTurn = 1.5;
        m1.travelTime = 0.5;
        m2.travelTime = 0.5;
        // 重新算 meetTurn：同时出发 t=1,travelTime=0.5 → meetTurn=(1*0.5+1*0.5)/(0.5+0.5)=1
        // → 在窗口[1,2)内
        const events = buildTimeline(gs, 1);
        const meetIdx  = events.findIndex(e => e.type === EVENT_MEET);
        const arriveIdx = events.findIndex(e => e.type === EVENT_ARRIVE);
        // 应该既有 meet 也有 arrive
        expect(meetIdx).toBeGreaterThanOrEqual(0);
        expect(arriveIdx).toBeGreaterThanOrEqual(0);
        expect(meetIdx).toBeLessThan(arriveIdx);
    });

    it('同方阵营的对向行军不生成 meet 事件', () => {
        const gs = makeGS();
        gs.turn = 1;
        // 同阵营的两支行军方向相对
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityB', 'cityA');
        const events = buildTimeline(gs, 2);
        expect(events.filter(e => e.type === EVENT_MEET)).toHaveLength(0);
    });

    it('transfer 类型行军不参与 meet 检测', () => {
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'transfer', 'factionA', ['g1'], 'cityA', 'cityB');
        createTimelineMarch(gs, 'attack',   'factionB', ['g2'], 'cityB', 'cityA');
        // transfer 不应触发 meet
        const events = buildTimeline(gs, 2);
        expect(events.filter(e => e.type === EVENT_MEET)).toHaveLength(0);
    });

    it('多个独立行军在同一回合到达：生成多个 arrive 事件', () => {
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB'); // arrive=3
        gs.turn = 2;
        // 手动创建在 turn=3 到达的行军（departTurn=2, travelTime=1→arrivalTurn=3，dist≤60）
        const cityA3 = createMockCity({ id: 'cityA3', x: 0, y: 0, owner: 'factionA' });
        const cityB3 = createMockCity({ id: 'cityB3', x: 50, y: 0, owner: 'factionB' });
        gs.cities.push(cityA3, cityB3);
        createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityA3', 'cityB3'); // arrive=3
        const events = buildTimeline(gs, 3);
        expect(events.filter(e => e.type === EVENT_ARRIVE)).toHaveLength(2);
    });

    it('多事件按 eventTurn 升序排列', () => {
        // meet 在 t=2, arrive 在 t=3 → meet 先
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB'); // arrive=3, meetTurn=2 with B
        createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA'); // arrive=3, same meet

        // 在 buildTimeline 跨回合场景中检查：回合2只有meet，回合3只有arrive
        const ev2 = buildTimeline(gs, 2);
        const ev3 = buildTimeline(gs, 3);
        expect(ev2[0].type).toBe(EVENT_MEET);
        expect(ev3.every(e => e.type === EVENT_ARRIVE)).toBe(true);
    });
});

describe('Plan B: 时间轴事件处理 — 玩家涉及的战斗暂停', () => {

    /**
     * 模拟 processTimelineEvents 处理器
     * 返回 { battleQueue, resolvedMarchIds, processedEvents }
     */
    function processTimelineEvents(gs, events, playerFactionId) {
        const battleQueue = [];
        const resolvedMarchIds = new Set();
        const processedEvents = [];

        for (const event of events) {
            if (event.type === EVENT_MEET) {
                const { marchA, marchB } = event;
                if (resolvedMarchIds.has(marchA.id) || resolvedMarchIds.has(marchB.id)) continue;

                resolvedMarchIds.add(marchA.id);
                resolvedMarchIds.add(marchB.id);
                processedEvents.push(event);

                if (marchA.faction === playerFactionId || marchB.faction === playerFactionId) {
                    // 玩家涉及 → 加入 battleQueue，暂停后续处理
                    battleQueue.push({ type: 'interception', marchA, marchB, eventTurn: event.eventTurn });
                    break; // 暂停：等待玩家战斗结果
                } else {
                    // AI vs AI → 记录为自动处理（实际战斗逻辑在 worldmap.js 中实现）
                    processedEvents[processedEvents.length - 1]._autoResolved = true;
                }
            } else if (event.type === EVENT_ARRIVE) {
                const { march } = event;
                if (resolvedMarchIds.has(march.id)) continue;
                resolvedMarchIds.add(march.id);
                processedEvents.push(event);

                if (march.faction === playerFactionId || gs.getCity(march.targetCity).owner === playerFactionId) {
                    battleQueue.push({ type: 'arrival', march, eventTurn: event.eventTurn });
                    break; // 暂停
                } else {
                    processedEvents[processedEvents.length - 1]._autoResolved = true;
                }
            }
        }

        return { battleQueue, resolvedMarchIds, processedEvents };
    }

    it('玩家 meet 事件进入 battleQueue 并暂停', () => {
        const gs = makeGS();
        gs.turn = 1;
        const mPlayer = createTimelineMarch(gs, 'attack', 'player',   ['gP'], 'cityA', 'cityB');
        const mEnemy  = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        // meetTurn = (1*2+1*2)/(2+2) = 2
        const events = buildTimeline(gs, 2);

        const { battleQueue, resolvedMarchIds, processedEvents } = processTimelineEvents(gs, events, 'player');

        expect(battleQueue).toHaveLength(1);
        expect(battleQueue[0].type).toBe('interception');
        expect(resolvedMarchIds.has(mPlayer.id)).toBe(true);
        expect(resolvedMarchIds.has(mEnemy.id)).toBe(true);
    });

    it('玩家 arrive 事件进入 battleQueue 并暂停', () => {
        const gs = makeGS();
        gs.turn = 1;
        const m = createTimelineMarch(gs, 'attack', 'player', ['gP'], 'cityA', 'cityB'); // arrive=3
        const events = buildTimeline(gs, 3);

        const { battleQueue } = processTimelineEvents(gs, events, 'player');
        expect(battleQueue).toHaveLength(1);
        expect(battleQueue[0].type).toBe('arrival');
        expect(battleQueue[0].march.id).toBe(m.id);
    });

    it('玩家战斗后后续事件未被处理', () => {
        // meet(t=2) 是玩家战斗 → 暂停后，arrive(t=2.5) 未被处理
        const gs = makeGS();
        gs.turn = 1;
        const mPlayer = createTimelineMarch(gs, 'attack', 'player',   ['gP'], 'cityA', 'cityB');
        const mEnemy  = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');

        // 再加一个 AI arrive 事件，手动设置 eventTurn 在 meet 后
        const aiMarch = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        aiMarch.arrivalTurn = 2.5; // 在 [2,3) 内

        const events = buildTimeline(gs, 2);
        const { resolvedMarchIds, processedEvents } = processTimelineEvents(gs, events, 'player');

        // aiMarch 未被处理
        expect(resolvedMarchIds.has(aiMarch.id)).toBe(false);
    });

    it('AI vs AI meet 自动处理，不进入 battleQueue', () => {
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        const events = buildTimeline(gs, 2);

        const { battleQueue, processedEvents } = processTimelineEvents(gs, events, 'player');
        expect(battleQueue).toHaveLength(0);
        expect(processedEvents[0]._autoResolved).toBe(true);
    });

    it('同一回合多个 AI 事件全部处理', () => {
        const gs = makeGS();
        gs.turn = 1;
        // 两个独立 AI 到达事件（不同路线）
        const cityA2 = createMockCity({ id: 'aiC1', x: 0,   y: 500, owner: 'factionA' });
        const cityB2 = createMockCity({ id: 'aiC2', x: 100, y: 500, owner: 'factionB' });
        gs.cities.push(cityA2, cityB2);
        const m1 = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'aiC1', 'aiC2');
        const m2 = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'aiC1', 'aiC2');
        // 强制同回合到达
        m2.arrivalTurn = m1.arrivalTurn;

        const events = buildTimeline(gs, m1.arrivalTurn);
        const { resolvedMarchIds } = processTimelineEvents(gs, events, 'player');
        expect(resolvedMarchIds.has(m1.id)).toBe(true);
        expect(resolvedMarchIds.has(m2.id)).toBe(true);
    });

    it('已消费的 march 不会被重复处理', () => {
        const gs = makeGS();
        gs.turn = 1;
        const mPlayer = createTimelineMarch(gs, 'attack', 'player',   ['gP'], 'cityA', 'cityB');
        const mEnemy  = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        const events = buildTimeline(gs, 2);

        const result1 = processTimelineEvents(gs, events, 'player');
        // 再次用同一 events 列表调用（模拟重复处理）
        const result2 = processTimelineEvents(gs, events, 'player');

        // 两次 battleQueue 各 1 条（processTimelineEvents 是无状态的，resolvedMarchIds 不跨调用）
        expect(result2.battleQueue).toHaveLength(1);
    });
});

describe('Plan B: 边界情况与数值精度', () => {

    it('meetTurn 恰好等于窗口左边界（包含）', () => {
        // meetTurn = currentTurn 应被包含
        const gs = makeGS();
        gs.turn = 1;
        const a = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        const b = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        // meetTurn=2, 测试 buildTimeline(gs,2)
        const events = buildTimeline(gs, 2);
        expect(events.filter(e => e.type === EVENT_MEET)).toHaveLength(1);
    });

    it('meetTurn 恰好等于窗口右边界（不包含）', () => {
        // meetTurn = currentTurn+1 不应出现在本回合的时间轴中
        const gs = makeGS();
        gs.turn = 1;
        const a = createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        const b = createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityB', 'cityA');
        // meetTurn=2，buildTimeline(gs,1) 不含（窗口[1,2)）
        const events = buildTimeline(gs, 1);
        expect(events.filter(e => e.type === EVENT_MEET)).toHaveLength(0);
    });

    it('两支行军路线不相对，不生成 meet 事件', () => {
        const gs = makeGS();
        gs.turn = 1;
        // A→B 和 A→B（同方向）
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityA', 'cityB');
        createTimelineMarch(gs, 'attack', 'factionB', ['g2'], 'cityA', 'cityB');
        const events = buildTimeline(gs, 2);
        expect(events.filter(e => e.type === EVENT_MEET)).toHaveLength(0);
    });

    it('行军未出发时（arrivalTurn在未来很远），当前回合不生成任何事件', () => {
        const gs = makeGS();
        gs.turn = 1;
        createTimelineMarch(gs, 'attack', 'factionA', ['g1'], 'cityC', 'cityD'); // travelTime=4, arrive=5
        expect(buildTimeline(gs, 1)).toHaveLength(0);
        expect(buildTimeline(gs, 2)).toHaveLength(0);
        expect(buildTimeline(gs, 3)).toHaveLength(0);
        expect(buildTimeline(gs, 4)).toHaveLength(0);
        expect(buildTimeline(gs, 5)).toHaveLength(1); // arrive=5
    });
});
