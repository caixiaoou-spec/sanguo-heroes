/**
 * constants.js — 全局共享常量
 * 集中管理跨文件使用的魔法数字，避免分散硬编码
 */

// 武将属性公式基础值
export const HP_BASE = 100;
export const MP_BASE = 50;

// 武将成长上限
export const MAX_GENERAL_LEVEL = 50;
export const EXP_PER_LEVEL = 100;  // 升级所需经验 = level * EXP_PER_LEVEL

// 城市驻守上限（每座城最多 N 名武将）
export const MAX_GARRISON = 12;

// 士兵相关
export const SOLDIER_RECOVERY_RATE = 0.30;   // 回合末士兵恢复比例
export const SOLDIER_CAP_MULTIPLIER = 40;    // 将领统兵上限 = lead * SOLDIER_CAP_MULTIPLIER

// 行军距离阈值（格）→ 行军回合数
export const MARCH_DIST = {
    T1: 60,   // ≤60  → 1回合
    T2: 120,  // ≤120 → 2回合
    T3: 200,  // ≤200 → 3回合
              // >200 → 4回合
};
