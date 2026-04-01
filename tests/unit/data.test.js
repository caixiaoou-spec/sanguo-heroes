/**
 * data.test.js — 数据完整性测试
 * 验证 generals / skills / cities / factions 数据结构正确性
 * 这些测试防止手动编辑数据文件时引入拼写错误、缺字段等问题
 */

import SKILLS from '../../js/data/skills.js';
import generals from '../../js/data/generals.js';
import CITIES_DATA from '../../js/data/cities.js';
import { FACTIONS_DATA } from '../../js/data/factions.js';

// ─────────────────────────────────────────────
// skills.js
// ─────────────────────────────────────────────
describe('skills.js — 数据完整性', () => {
    test('导出非空数组', () => {
        expect(Array.isArray(SKILLS)).toBe(true);
        expect(SKILLS.length).toBeGreaterThan(0);
    });

    test('所有技能有唯一 id', () => {
        const ids = SKILLS.map(s => s.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    test('每个技能有必填字段', () => {
        const required = ['id', 'name', 'type', 'mpCost', 'cooldown', 'damage', 'effect', 'targetType', 'levelReq'];
        for (const skill of SKILLS) {
            for (const field of required) {
                expect(skill).toHaveProperty(field);
            }
        }
    });

    test('mpCost 和 cooldown 为正数', () => {
        for (const skill of SKILLS) {
            expect(skill.mpCost).toBeGreaterThan(0);
            expect(skill.cooldown).toBeGreaterThan(0);
        }
    });

    test('damage 倍率非负（buff/heal 类技能允许为 0）', () => {
        for (const skill of SKILLS) {
            expect(skill.damage).toBeGreaterThanOrEqual(0);
        }
    });

    test('type 只能是合法值', () => {
        const validTypes = new Set(['martial', 'strategist', 'support', 'bonus', 'exclusive']);
        for (const skill of SKILLS) {
            expect(validTypes.has(skill.type)).toBe(true);
        }
    });

    test('targetType 只能是合法值', () => {
        const valid = new Set(['single', 'area', 'ally', 'self']);
        for (const skill of SKILLS) {
            expect(valid.has(skill.targetType)).toBe(true);
        }
    });

    test('levelReq 在合理范围 1-50', () => {
        for (const skill of SKILLS) {
            expect(skill.levelReq).toBeGreaterThanOrEqual(1);
            expect(skill.levelReq).toBeLessThanOrEqual(50);
        }
    });
});

// ─────────────────────────────────────────────
// generals.js
// ─────────────────────────────────────────────
describe('generals.js — 数据完整性', () => {
    test('导出非空数组', () => {
        expect(Array.isArray(generals)).toBe(true);
        expect(generals.length).toBeGreaterThan(0);
    });

    test('所有武将有唯一 id', () => {
        const ids = generals.map(g => g.id);
        const seen = {};
        const duplicates = [];
        for (const id of ids) {
            seen[id] = (seen[id] || 0) + 1;
            if (seen[id] === 2) duplicates.push(id);
        }
        expect(duplicates).toEqual([]);
    });

    test('每个武将有必填字段', () => {
        const required = ['id', 'name', 'faction', 'level', 'unitType'];
        for (const g of generals) {
            for (const field of required) {
                expect(g).toHaveProperty(field);
            }
        }
    });

    test('unitType 只能是合法值', () => {
        const valid = new Set(['cavalry', 'infantry', 'spear', 'archer']);
        for (const g of generals) {
            expect(valid.has(g.unitType)).toBe(true);
        }
    });

    test('stats 字段值为正数（项羽等特殊武将允许超过100）', () => {
        for (const g of generals) {
            const stats = g.stats || g;
            const keys = ['war', 'int', 'lead', 'pol', 'cha'];
            for (const key of keys) {
                if (stats[key] !== undefined) {
                    expect(stats[key]).toBeGreaterThanOrEqual(1);
                }
            }
        }
    });

    test('level 在合理范围 1-50', () => {
        for (const g of generals) {
            expect(g.level).toBeGreaterThanOrEqual(1);
            expect(g.level).toBeLessThanOrEqual(50);
        }
    });
});

// ─────────────────────────────────────────────
// cities.js
// ─────────────────────────────────────────────
describe('cities.js — 数据完整性', () => {
    test('导出非空数组', () => {
        expect(Array.isArray(CITIES_DATA)).toBe(true);
        expect(CITIES_DATA.length).toBeGreaterThan(0);
    });

    test('所有城池有唯一 id', () => {
        const ids = CITIES_DATA.map(c => c.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    test('每个城池有必填字段', () => {
        const required = ['id', 'name', 'x', 'y', 'population', 'agriculture', 'commerce', 'defense'];
        for (const city of CITIES_DATA) {
            for (const field of required) {
                expect(city).toHaveProperty(field);
            }
        }
    });

    test('坐标 x/y 为正数', () => {
        for (const city of CITIES_DATA) {
            expect(city.x).toBeGreaterThan(0);
            expect(city.y).toBeGreaterThan(0);
        }
    });

    test('agriculture/commerce/defense 在 0-100 范围内', () => {
        for (const city of CITIES_DATA) {
            expect(city.agriculture).toBeGreaterThanOrEqual(0);
            expect(city.agriculture).toBeLessThanOrEqual(100);
            expect(city.commerce).toBeGreaterThanOrEqual(0);
            expect(city.commerce).toBeLessThanOrEqual(100);
            expect(city.defense).toBeGreaterThanOrEqual(0);
            expect(city.defense).toBeLessThanOrEqual(100);
        }
    });

    test('population 为正数', () => {
        for (const city of CITIES_DATA) {
            expect(city.population).toBeGreaterThan(0);
        }
    });

    test('neighbors 是字符串数组', () => {
        for (const city of CITIES_DATA) {
            if (city.neighbors) {
                expect(Array.isArray(city.neighbors)).toBe(true);
                for (const n of city.neighbors) {
                    expect(typeof n).toBe('string');
                }
            }
        }
    });

    test('neighbors 引用的城池 id 必须存在', () => {
        const cityIds = new Set(CITIES_DATA.map(c => c.id));
        for (const city of CITIES_DATA) {
            if (city.neighbors) {
                for (const n of city.neighbors) {
                    expect(cityIds.has(n)).toBe(true);
                }
            }
        }
    });
});

// ─────────────────────────────────────────────
// factions.js
// ─────────────────────────────────────────────
describe('factions.js — 数据完整性', () => {
    test('导出非空数组', () => {
        expect(Array.isArray(FACTIONS_DATA)).toBe(true);
        expect(FACTIONS_DATA.length).toBeGreaterThan(0);
    });

    test('所有势力有唯一 id', () => {
        const ids = FACTIONS_DATA.map(f => f.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    test('每个势力有必填字段', () => {
        const required = ['id', 'name', 'cities', 'generals'];
        for (const f of FACTIONS_DATA) {
            for (const field of required) {
                expect(f).toHaveProperty(field);
            }
        }
    });

    test('势力引用的城池 id 必须在 cities.js 中存在', () => {
        const cityIds = new Set(CITIES_DATA.map(c => c.id));
        for (const f of FACTIONS_DATA) {
            for (const cid of f.cities) {
                expect(cityIds.has(cid)).toBe(true);
            }
        }
    });

    test('势力引用的武将 id 必须在 generals.js 中存在', () => {
        const generalIds = new Set(generals.map(g => g.id));
        for (const f of FACTIONS_DATA) {
            for (const gid of f.generals) {
                expect(generalIds.has(gid)).toBe(true);
            }
        }
    });
});
