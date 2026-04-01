/**
 * event.test.js — EventSystem 事件逻辑测试
 */

import EventSystem from '../../js/systems/event.js';
import { createMockGameState, createMockFaction, createMockCity, createMockGeneral } from '../helpers/mockGameState.js';

function makeGs(eventOverrides = []) {
    const faction = createMockFaction({ id: 'player', isPlayer: true, gold: 5000, food: 8000, fame: 40 });
    const city = createMockCity({ id: 'c1', owner: 'player', morale: 70, population: 50000, agriculture: 60 });
    const general = createMockGeneral({ id: 'g1', faction: 'player', city: 'c1', loyalty: 80 });
    city.generals = ['g1'];
    const gs = createMockGameState({
        playerFaction: 'player',
        factions: [faction],
        cities: [city],
        generals: [general]
    });
    gs.events = [...eventOverrides];
    gs.turn = 5;
    return gs;
}

// ─────────────────────────────────────────────
// processEvents — story events
// ─────────────────────────────────────────────
describe('EventSystem.processEvents() — story events', () => {
    test('条件满足的 story event 被触发', () => {
        const storyEvent = {
            id: 'test_story',
            type: 'story',
            name: '测试事件',
            condition: { type: 'turn_range', params: { min: 1, max: 10 } },
            effects: []
        };
        const gs = makeGs([storyEvent]);
        const es = new EventSystem(gs);
        const triggered = es.processEvents();
        expect(triggered.some(e => e.id === 'test_story')).toBe(true);
    });

    test('同一 story event 不重复触发', () => {
        const storyEvent = {
            id: 'unique_story',
            type: 'story',
            name: '唯一事件',
            condition: { type: 'turn_range', params: { min: 1, max: 100 } },
            effects: []
        };
        const gs = makeGs([storyEvent]);
        const es = new EventSystem(gs);
        es.processEvents(); // first trigger
        const second = es.processEvents(); // should not trigger again
        expect(second.filter(e => e.id === 'unique_story').length).toBe(0);
    });

    test('条件不满足的 story event 不被触发', () => {
        const storyEvent = {
            id: 'future_story',
            type: 'story',
            name: '未来事件',
            condition: { type: 'turn_range', params: { min: 100, max: 200 } },
            effects: []
        };
        const gs = makeGs([storyEvent]);
        const es = new EventSystem(gs);
        const triggered = es.processEvents();
        expect(triggered.some(e => e.id === 'future_story')).toBe(false);
    });
});

// ─────────────────────────────────────────────
// _checkCondition
// ─────────────────────────────────────────────
describe('EventSystem._checkCondition()', () => {
    test('turn_range: 在范围内 → true', () => {
        const gs = makeGs();
        gs.turn = 5;
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'turn_range', params: { min: 1, max: 10 } })).toBe(true);
    });

    test('turn_range: 超出范围 → false', () => {
        const gs = makeGs();
        gs.turn = 50;
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'turn_range', params: { min: 1, max: 10 } })).toBe(false);
    });

    test('faction: 玩家势力匹配 → true', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'faction', params: { factionId: 'player' } })).toBe(true);
    });

    test('faction: 玩家势力不匹配 → false', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'faction', params: { factionId: 'other_faction' } })).toBe(false);
    });

    test('fame: 名声足够 → true', () => {
        const gs = makeGs();
        gs.getFaction('player').fame = 60;
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'fame', params: { min: 50 } })).toBe(true);
    });

    test('fame: 名声不足 → false', () => {
        const gs = makeGs();
        gs.getFaction('player').fame = 30;
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'fame', params: { min: 50 } })).toBe(false);
    });

    test('cities_count: 城市数足够 → true', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'cities_count', params: { min: 1 } })).toBe(true);
    });

    test('cities_count: 城市数不足 → false', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'cities_count', params: { min: 10 } })).toBe(false);
    });

    test('未知条件类型 → false', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({ type: 'unknown_type', params: {} })).toBe(false);
    });

    test('null 条件 → false', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition(null)).toBe(false);
    });
});

// ─────────────────────────────────────────────
// _applyEvent — effect types
// ─────────────────────────────────────────────
describe('EventSystem._applyEvent() — 事件效果', () => {
    test('gold 效果增加金钱', () => {
        const gs = makeGs();
        const faction = gs.getFaction('player');
        const before = faction.gold;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'gold', value: 1000 }] });
        expect(faction.gold).toBe(before + 1000);
    });

    test('gold 效果不会让金钱低于 0', () => {
        const gs = makeGs();
        gs.getFaction('player').gold = 100;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'gold', value: -9999 }] });
        expect(gs.getFaction('player').gold).toBeGreaterThanOrEqual(0);
    });

    test('food 效果修改粮食', () => {
        const gs = makeGs();
        const before = gs.getFaction('player').food;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'food', value: 2000 }] });
        expect(gs.getFaction('player').food).toBe(before + 2000);
    });

    test('morale 效果修改士气', () => {
        const gs = makeGs();
        const city = gs.getCity('c1');
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'morale', value: 10 }] });
        // morale 应在 0-100 范围内
        expect(city.morale).toBeGreaterThanOrEqual(0);
        expect(city.morale).toBeLessThanOrEqual(100);
    });

    test('fame 效果修改名声', () => {
        const gs = makeGs();
        const faction = gs.getFaction('player');
        faction.fame = 50;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'fame', value: 20 }] });
        expect(faction.fame).toBe(70);
    });

    test('fame 不超过 100', () => {
        const gs = makeGs();
        gs.getFaction('player').fame = 90;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'fame', value: 50 }] });
        expect(gs.getFaction('player').fame).toBeLessThanOrEqual(100);
    });

    test('loyalty 效果修改所有武将忠诚度', () => {
        const gs = makeGs();
        gs.getGeneral('g1').loyalty = 80;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'loyalty', value: -10 }] });
        expect(gs.getGeneral('g1').loyalty).toBe(70);
    });
});

// ─────────────────────────────────────────────
// processEvents — random events
// ─────────────────────────────────────────────
describe('EventSystem.processEvents() — random events', () => {
    test('random event 被触发时执行效果', () => {
        const randomEvent = {
            id: 'rand1',
            type: 'random',
            name: '随机事件',
            effects: [{ type: 'gold', value: 500 }]
        };
        const gs = makeGs([randomEvent]);
        const faction = gs.getFaction('player');
        const goldBefore = faction.gold;
        const es = new EventSystem(gs);

        // 强制 Math.random < 0.3 确保触发
        const orig = Math.random;
        Math.random = () => 0.1;
        es.processEvents();
        Math.random = orig;

        expect(faction.gold).toBeGreaterThan(goldBefore);
    });

    test('同一随机事件不在本局重复触发', () => {
        const randomEvent = {
            id: 'rand_unique',
            type: 'random',
            name: '唯一随机',
            effects: [{ type: 'gold', value: 100 }]
        };
        const gs = makeGs([randomEvent]);
        const es = new EventSystem(gs);

        const orig = Math.random;
        Math.random = () => 0.1; // 总是触发
        es.processEvents(); // 第一次触发
        const second = es.processEvents(); // 已触发过，应被过滤
        Math.random = orig;

        // 第二次触发列表中不应再包含该事件
        expect(second.filter(e => e.id === 'rand_unique').length).toBe(0);
    });

    test('Math.random >= 0.3 时 random event 不触发', () => {
        const randomEvent = {
            id: 'rand2',
            type: 'random',
            name: '随机事件2',
            effects: [{ type: 'gold', value: 9999 }]
        };
        const gs = makeGs([randomEvent]);
        const faction = gs.getFaction('player');
        const goldBefore = faction.gold;
        const es = new EventSystem(gs);

        const orig = Math.random;
        Math.random = () => 0.5; // > 0.3，不触发
        const triggered = es.processEvents();
        Math.random = orig;

        expect(faction.gold).toBe(goldBefore);
        expect(triggered.filter(e => e.id === 'rand2').length).toBe(0);
    });
});

// ─────────────────────────────────────────────
// _checkCondition — generals_in_city
// ─────────────────────────────────────────────
describe('EventSystem._checkCondition() — generals_in_city', () => {
    test('所有武将都在城中 → true', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({
            type: 'generals_in_city',
            params: { cityId: 'c1', generalIds: ['g1'] }
        })).toBe(true);
    });

    test('有武将不在城中 → false', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({
            type: 'generals_in_city',
            params: { cityId: 'c1', generalIds: ['g1', 'missing_general'] }
        })).toBe(false);
    });

    test('城池不存在 → false', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(es._checkCondition({
            type: 'generals_in_city',
            params: { cityId: 'nonexistent', generalIds: ['g1'] }
        })).toBe(false);
    });
});

// ─────────────────────────────────────────────
// _applyEvent — population / agriculture / general_join
// ─────────────────────────────────────────────
describe('EventSystem._applyEvent() — 更多效果类型', () => {
    test('population 效果修改城市人口', () => {
        const gs = makeGs();
        const city = gs.getCity('c1');
        const before = city.population;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'population', value: 5000 }] });
        expect(city.population).toBe(before + 5000);
    });

    test('population 不低于 1000', () => {
        const gs = makeGs();
        const city = gs.getCity('c1');
        city.population = 500;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'population', value: -99999 }] });
        expect(city.population).toBeGreaterThanOrEqual(1000);
    });

    test('agriculture 效果修改农业值', () => {
        const gs = makeGs();
        const city = gs.getCity('c1');
        const before = city.agriculture;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'agriculture', value: 10 }] });
        expect(city.agriculture).toBe(Math.min(100, before + 10));
    });

    test('agriculture 在 0-100 范围内', () => {
        const gs = makeGs();
        gs.getCity('c1').agriculture = 95;
        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'agriculture', value: 20 }] });
        expect(gs.getCity('c1').agriculture).toBeLessThanOrEqual(100);
    });

    test('general_join 在野武将加入玩家势力', () => {
        const gs = makeGs();
        const stranger = createMockGeneral({ id: 'stranger', faction: null, city: null, status: null, loyalty: 0 });
        gs.generals.push(stranger);
        gs.getUnaffiliatedGenerals = () => [stranger];

        const es = new EventSystem(gs);
        es._applyEvent({ effects: [{ type: 'general_join' }] });

        expect(stranger.faction).toBe('player');
        expect(stranger.loyalty).toBe(70);
        expect(stranger.status).toBe('idle');
    });

    test('general_join 无在野武将时不报错', () => {
        const gs = makeGs();
        gs.getUnaffiliatedGenerals = () => [];
        const es = new EventSystem(gs);
        expect(() => es._applyEvent({ effects: [{ type: 'general_join' }] })).not.toThrow();
    });
});

describe('EventSystem.applyChoice()', () => {
    test('选择有效 choice 时效果被应用', () => {
        const gs = makeGs();
        const faction = gs.getFaction('player');
        const goldBefore = faction.gold;
        const es = new EventSystem(gs);
        const event = {
            choices: [
                { effects: [{ type: 'gold', value: 500 }] },
                { effects: [{ type: 'food', value: 500 }] }
            ]
        };
        es.applyChoice(event, 0);
        expect(faction.gold).toBe(goldBefore + 500);
    });

    test('choiceIndex 超出范围时不报错', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        const event = { choices: [] };
        expect(() => es.applyChoice(event, 5)).not.toThrow();
    });

    test('event 无 choices 时不报错', () => {
        const gs = makeGs();
        const es = new EventSystem(gs);
        expect(() => es.applyChoice({}, 0)).not.toThrow();
    });
});
