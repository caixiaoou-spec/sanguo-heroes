/**
 * generalUtils.js — 武将相关纯函数工具
 * 这些函数在 game.js / economy.js / combat.js 中都有各自的内联副本，
 * 统一到这里后各处只需 import 使用。
 */

import { HP_BASE, MP_BASE, MAX_GENERAL_LEVEL, EXP_PER_LEVEL, MARCH_DIST } from './constants.js';

/**
 * 计算武将最大 HP
 * @param {number} war  武力值
 * @param {number} lead 统率值
 */
export function calcMaxHp(war, lead) {
    return HP_BASE + war * 2 + lead;
}

/**
 * 计算武将最大 MP
 * @param {number} int 智力值
 */
export function calcMaxMp(int) {
    return MP_BASE + int * 2;
}

/**
 * 根据地图距离计算行军所需回合数
 * @param {number} dist 欧氏距离（数据坐标系）
 * @returns {1|2|3|4}
 */
export function calcMarchTurns(dist) {
    if (dist <= MARCH_DIST.T1) return 1;
    if (dist <= MARCH_DIST.T2) return 2;
    if (dist <= MARCH_DIST.T3) return 3;
    return 4;
}

/**
 * 检查武将是否可以升级，并执行升级（可连续升多级）
 * 同时重算 maxHp/maxMp 并调用 gameState._assignSkills。
 *
 * 合并了 economy.js 的 static checkLevelUp 和
 * combat.js 底部的孤立函数 EconomySystem_checkLevelUp。
 *
 * @param {object} general   武将对象（需有 exp, level, war, int, lead, hp, mp, maxHp, maxMp）
 * @param {object} gameState 游戏状态（需有 _assignSkills 方法），可为 null（测试时）
 * @returns {boolean} 是否发生了升级
 */
export function checkLevelUp(general, gameState) {
    let leveled = false;
    while (general.exp >= general.level * EXP_PER_LEVEL && general.level < MAX_GENERAL_LEVEL) {
        const expNeeded = general.level * EXP_PER_LEVEL;
        general.level++;
        general.exp -= expNeeded;
        general.maxHp = calcMaxHp(general.war, general.lead);
        general.maxMp = calcMaxMp(general.int);
        general.hp = general.maxHp;
        general.mp = general.maxMp;
        leveled = true;
    }
    if (leveled && gameState) {
        gameState._assignSkills(general);
    }
    return leveled;
}
