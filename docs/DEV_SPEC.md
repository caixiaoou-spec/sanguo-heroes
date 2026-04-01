# 三国英雄 — 开发者功能规格文档 (PRD)

> **版本**: v2.0
> **日期**: 2026-03-28
> **用途**: 研发参考文档，描述各系统的输入/前置条件/效果/约束/返回值
> **对应测试**: `tests/unit/` 下各 `.test.js` 文件

---

## 目录

1. [项目概览](#1-项目概览)
2. [数据规格](#2-数据规格)
3. [GameState — 游戏状态引擎](#3-gamestate--游戏状态引擎)
4. [EconomySystem — 内政系统](#4-economysystem--内政系统)
5. [DiplomacySystem — 外交系统](#5-diplomacysystem--外交系统)
6. [CombatSystem — 战斗系统](#6-combatsystem--战斗系统)
7. [EventSystem — 事件系统](#7-eventsystem--事件系统)
8. [全局约束与边界条件](#8-全局约束与边界条件)
9. [架构重构（v2.0）](#9-架构重构v20)

---

## 1. 项目概览

### 技术栈
| 项目 | 规格 |
|------|------|
| 语言 | 原生 JavaScript ES Modules |
| 渲染 | Canvas 2D API |
| 分辨率 | 1280×800（HiDPI 自适应） |
| 构建工具 | 无（浏览器直接加载） |
| 测试框架 | Jest 30 + Babel（@babel/preset-env） |
| 启动命令 | `bash start.sh` |

### 场景架构
```
menu.js → factionSelect.js → worldmap.js ←→ battle.js
```

### 游戏规模（当前数据）
| 数据类型 | 数量 |
|----------|------|
| 城池 | 55 座 |
| 武将 | 283 名 |
| 势力 | 14 个 |
| 技能 | 40 个 |
| 历史决斗 | 53 组 |

---

## 2. 数据规格

### 2.1 武将 (General)

```js
{
  id: string,           // 唯一标识符，如 'cao_cao'
  name: string,         // 显示名称
  faction: string,      // 所属势力 id
  city: string,         // 所在城池 id
  unitType: 'cavalry' | 'infantry' | 'spear' | 'archer',
  level: number,        // 范围 [1, 50]
  exp: number,          // 当前经验值
  war: number,          // 武力，范围 >= 1（项羽等特殊武将可超过100）
  int: number,          // 智力，范围 >= 1
  lead: number,         // 统帅，范围 >= 1
  pol: number,          // 政治，范围 >= 1
  cha: number,          // 魅力，范围 >= 1
  hp: number,           // 当前 HP（初始化时 = maxHp）
  maxHp: number,        // = 100 + war*2 + lead
  mp: number,           // 当前 MP（初始化时 = maxMp）
  maxMp: number,        // = 50 + int*2
  soldiers: number,     // 跟随兵力，上限 = lead * 40
  loyalty: number,      // 忠诚度 [0, 100]
  status: 'idle' | 'marching' | 'encamped' | 'dead' | 'captured',
  skills: string[],     // 技能 id 数组
}
```

**字段约束**
- `level` 必须在 `[1, 50]` 范围内
- `unitType` 只能取 `cavalry | infantry | spear | archer` 四个值
- `soldiers` 不能超过 `lead * 40`
- `hp` / `mp` 初始等于对应 max 值，不得为负数

---

### 2.2 城池 (City)

```js
{
  id: string,
  name: string,
  x: number,            // 地图 X 坐标，> 0
  y: number,            // 地图 Y 坐标，> 0
  owner: string,        // 所属势力 id
  population: number,   // 人口，> 0
  agriculture: number,  // 农业 [0, 100]
  commerce: number,     // 商业 [0, 100]
  defense: number,      // 防御 [0, 100]
  soldiers: number,     // 城市驻兵（不属于任何武将）
  morale: number,       // 士气 [0, 100]
  generals: string[],   // 驻守武将 id 数组
  neighbors: string[],  // 相邻城池 id 数组（必须在 cities.js 中存在）
}
```

**字段约束**
- `agriculture / commerce / defense` 均为 `[0, 100]`
- `neighbors` 中引用的 id 必须在城池列表中存在
- `x / y` 必须 > 0

---

### 2.3 势力 (Faction)

```js
{
  id: string,
  name: string,
  gold: number,         // 金钱，>= 0
  food: number,         // 粮草，>= 0
  fame: number,         // 名声 [0, 100]
  allies: string[],     // 同盟势力 id 列表
  enemies: string[],    // 敌对势力 id 列表
  cities: string[],     // 拥有城池 id 列表
  generals: string[],   // 所属武将 id 列表
  alive: boolean,       // false = 已灭亡
  isPlayer: boolean,    // 只有一个势力为 true
}
```

---

### 2.4 技能 (Skill)

```js
{
  id: string,
  name: string,
  type: 'martial' | 'strategist' | 'support' | 'bonus' | 'exclusive',
  mpCost: number,       // > 0
  cooldown: number,     // > 0（回合数）
  damage: number,       // >= 0（buff/heal 类可为 0）
  effect: string,       // 效果描述标识符
  targetType: 'single' | 'area' | 'ally' | 'self',
  levelReq: number,     // [1, 50]
}
```

---

## 3. GameState — 游戏状态引擎

**文件**: `js/engine/game.js`

### 3.1 回合阶段流程

```
player（玩家操作）
  → ai（AI 操作）
  → event（事件处理）
  → battle（战斗结算）
  → 回到 player，turn + 1
```

- 玩家每回合有 `maxActionPoints = 3` 行动点
- 每次内政操作（开发/征兵/修缮/招贤）消耗 1 个行动点

---

### 3.2 `initNewGame(factionId)`

**作用**: 初始化新游戏

**输入**
| 参数 | 类型 | 说明 |
|------|------|------|
| factionId | string | 玩家选择的势力 id |

**效果**
- `playerFaction = factionId`
- `turn = 1`
- `actionPoints = maxActionPoints = 3`
- `marches = []`
- 从 `CITIES_DATA` 加载所有城池，并根据 `FACTIONS_DATA` 设置初始 `owner`
- 从 `FACTIONS_DATA` 加载所有势力，玩家势力 `isPlayer = true`，其余为 `false`
- 从 `GENERALS_DATA` 加载所有武将，并初始化 `hp / maxHp / mp / maxMp`
- 初始兵力：归属势力城池 = `population * 8%`；中立城池 = `population * 5%`
- 对每名武将调用 `_assignSkills(general)`
- 玩家势力至少拥有 1 座城池

**约束**
- 城中武将的 `city` 字段必须指向一个存在的城池 id

---

### 3.3 `_assignSkills(general)`

**作用**: 根据武将特性分配技能

**规则**
- 项羽（`xiang_yu`）: 固定获得专属技能 `qianguwuer`（千古无二）
- 武力型武将 (`war > int`): 从 `martial` + `support` 类技能中随机选 2 个
- 智力型武将 (`int >= war`): 从 `strategist` + `support` 类技能中随机选 2 个
- 每名武将至少获得 2 个技能
- 分配的技能 id 必须存在于 `skills` 列表中

---

### 3.4 `createMarch(type, faction, generalIds, sourceCityId, targetCityId)`

**作用**: 创建行军任务

**输入**
| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | `'attack'` \| `'transfer'` |
| faction | string | 行军势力 id |
| generalIds | string[] | 参与行军的武将 id 列表 |
| sourceCityId | string | 出发城池 id |
| targetCityId | string | 目标城池 id |

**行军回合数计算**（基于欧氏距离）

| 距离 | 回合数 |
|------|--------|
| ≤ 60 | 1 |
| ≤ 120 | 2 |
| ≤ 200 | 3 |
| > 200 | 4 |

> 边界值：dist = 60 → 1 回合；dist = 61 → 2 回合

**返回值**
```js
{
  id: number,             // 自增，每次创建 +1
  type: string,
  faction: string,
  generalIds: string[],      // (was generalIds → correct)
  sourceCity: string,        // (was sourceCityId)
  targetCity: string,        // (was targetCityId)
  turnsTotal: number,
  turnsRemaining: number,
  travelTime: number,        // 实数行程（同 turnsTotal）
  departTurn: number,        // 出发回合（游戏回合数）
  arrivalTurn: number,       // 到达回合 = departTurn + travelTime
  progress: number,          // [0,1] 动画进度
}
```

---

### 3.5 `checkVictory()`

**返回值**

| 条件 | 返回 |
|------|------|
| 玩家势力是唯一存活势力 | `'victory'` |
| 玩家势力 `alive = false` | `'defeat'` |
| 其他存活势力超过 1 个 | `null` |

---

### 3.6 Getter 方法

| 方法 | 返回 | 说明 |
|------|------|------|
| `getCity(id)` | City \| undefined | 找不到返回 `undefined` |
| `getGeneral(id)` | General \| undefined | |
| `getFaction(id)` | Faction \| undefined | |
| `getCitiesOf(factionId)` | City[] | 过滤 `owner === factionId` |
| `getGeneralsOf(factionId)` | General[] | 排除 `status === 'dead'` |
| `getGeneralsInCity(cityId)` | General[] | 过滤 `g.city === cityId` |
| `getAliveFactions()` | Faction[] | 过滤 `alive === true` |
| `getGeneralMarch(genId)` | March \| null | 武将不在行军中返回 `null` |
| `getUnaffiliatedGenerals()` | General[] | `faction` 为空的武将 |

---

## 4. EconomySystem — 内政系统

**文件**: `js/systems/economy.js`
**类型**: 静态方法类

所有方法接收 `gameState` 作为第一参数，修改游戏状态，返回 `{ success: boolean, message: string }` 对象。

---

### 4.1 `develop(gameState, cityId, type)`

**前置条件**
- 城中存在至少 1 名武将
- `faction.gold >= 1000`

**输入**
| 参数 | 取值 |
|------|------|
| type | `'agriculture'` \| `'commerce'` |

**效果**
- `faction.gold -= 1000`
- 提升量 = `5 + general.pol / 10`（取城中政治值最高的武将）
- `city[type] = Math.min(100, city[type] + boost)`（上限 100）
- 消耗 1 行动点

**失败条件**
- 金钱不足：返回 `{ success: false, message: '金钱不足' }`
- 城中无武将：返回 `{ success: false, message: '需要武将' }`

---

### 4.2 `recruit(gameState, cityId)`

**前置条件**
- `faction.gold >= 2000`

**效果**
- `faction.gold -= 2000`
- 新增士兵 = `Math.min(population * 2%, maxRecruit)`
- `city.soldiers += 新增士兵`
- `city.morale -= 3`（征兵影响民心）

**约束**
- 消耗 1 行动点

**失败条件**
- 金钱不足：返回 `{ success: false }`

---

### 4.3 `fortify(gameState, cityId)`

**前置条件**
- `faction.gold >= 1500`

**效果**
- `faction.gold -= 1500`
- 提升量 = `3 + general.lead / 15`（取城中统帅值最高的武将）
- `city.defense = Math.min(100, city.defense + boost)`（上限 100）

**失败条件**
- 金钱不足：返回 `{ success: false }`

---

### 4.4 `search(gameState, cityId)`

**前置条件**
- 城中存在至少 1 名武将

**效果**
- 发现概率 = `0.3 + general.cha / 200`
- 若发现，招募概率 = `0.4 + general.cha / 150`
- 招募成功后武将加入己方：`loyalty = random(60, 80)`，初始 `soldiers = 500`

**约束**
- 消耗 1 行动点

---

### 4.5 `assignSoldiers(gameState, generalId, amount)`

**效果**
- 将城市驻兵转移给武将

**约束**
- 实际转移量 = `Math.min(amount, general.lead * 40 - general.soldiers, city.soldiers)`
- `city.soldiers -= 实际转移量`
- `general.soldiers += 实际转移量`

---

### 4.6 `checkLevelUp(general, gameState)`

**升级条件**: `general.exp >= general.level * 100`

**效果**
1. `general.exp -= general.level * 100`
2. `general.level += 1`
3. 重算 `maxHp = 100 + war*2 + lead`，`maxMp = 50 + int*2`
4. 满血满蓝恢复：`hp = maxHp`，`mp = maxMp`
5. 重新调用 `_assignSkills(general)` 分配技能

**约束**
- `level` 上限 50，达到后不再升级
- 返回 `true`（成功升级）或 `false`（未升级）

> **注意**: `checkLevelUp` 已提取至 `js/utils/generalUtils.js`，`EconomySystem.checkLevelUp` 委托调用该函数。`combat.js` 同样引用同一函数，避免重复实现。

---

### 4.7 `processTurnSettlement(gameState)`

**作用**: 每回合结束时的结算，由引擎自动调用

**结算顺序**（对每个存活势力的每座城池）

1. **金钱收入**: `gold += floor(commerce * population / 10000)`
2. **粮草收入**: `food += floor(agriculture * population / 1500)`
3. **粮草消耗**: `consumption = floor((city.soldiers + generalSoldiers) * 0.1)`
4. **粮草短缺处理**:
   - `food -= consumption`
   - 若 `food < 0`：`food = 0`，`city.morale = Math.max(10, morale - 5)`
5. **人口增长**: 若 `morale > 50`，`population *= 1.01`（+1%，受士气加权）

**返回值**: 报告数组 `Report[]`，每条记录本回合各势力的收支摘要

---

## 5. DiplomacySystem — 外交系统

**文件**: `js/systems/diplomacy.js`
**类型**: 静态方法类

所有变更操作返回 `{ success: boolean, message: string }`。

---

### 5.1 关系类型

| 关系 | 描述 |
|------|------|
| `neutral` | 无明确关系，可攻击 |
| `ally` | 同盟，不可攻击 |
| `enemy` | 敌对，可攻击 |

---

### 5.2 `getRelation(gameState, factionId1, factionId2)`

**返回**: `'ally'` \| `'enemy'` \| `'neutral'`

**逻辑**
- 若 `f1.allies.includes(factionId2)` → `'ally'`
- 若 `f1.enemies.includes(factionId2)` → `'enemy'`
- 否则 → `'neutral'`

---

### 5.3 `canAttack(gameState, attackerFactionId, defenderFactionId)`

**返回**: `boolean`

| 条件 | 结果 |
|------|------|
| 攻击自己（同一 id） | `false` |
| 双方为同盟关系 | `false` |
| 中立关系 | `true` |
| 敌对关系 | `true` |

---

### 5.4 `declareWar(gameState, factionId1, factionId2)`

**前置条件**: 两方不在 `enemies` 列表中

**效果**
- `f1.enemies.push(factionId2)`；`f2.enemies.push(factionId1)`
- 若双方曾为同盟：从各自 `allies` 中移除对方

**失败条件**
- 已是敌对关系：返回 `{ success: false }`

---

### 5.5 `ceasefire(gameState, factionId1, factionId2)`

**前置条件**: `f1.gold >= 5000`

**效果**
- `f1.gold -= 5000`
- 接受概率 = `0.3 + f1.fame / 200`
- 成功：从双方 `enemies` 中互相移除

**失败条件**
- 金钱不足：立即返回 `{ success: false }`
- 概率未通过：返回 `{ success: false, message: '对方拒绝停战' }`

---

### 5.6 `formAlliance(gameState, factionId1, factionId2)`

**前置条件**
- 双方不是同盟（`f1.allies` 不含 `factionId2`）
- 双方不在交战状态（`f1.enemies` 不含 `factionId2`）

**效果**
- 接受概率 = `0.3 + f2.fame / 200 + (f1.allies.length < f2.allies.length ? 0.2 : 0)`
- 成功：`f1.allies.push(factionId2)`；`f2.allies.push(factionId1)`

**失败条件**
- 已是同盟：返回 `{ success: false }`
- 正在交战：返回 `{ success: false }`
- 概率未通过：返回 `{ success: false, message: '对方拒绝结盟' }`

---

### 5.7 `persuadeSurrender(gameState, factionId1, factionId2)`

**前置条件**: 目标势力 `f2` 拥有城池数 ≤ 2

**效果**
- 接受概率 = `0.1 + (f1.fame - f2.fame) / 200`
- 成功：
  - `f2.alive = false`
  - `f2` 的所有城池 `owner` 改为 `factionId1`
  - `f2` 的所有武将转入 `factionId1`，`loyalty = random(40, 60)`

**失败条件**
- 目标城池 > 2：立即返回 `{ success: false }`
- 概率未通过：返回 `{ success: false }`

---

## 6. CombatSystem — 战斗系统

**文件**: `js/systems/combat.js`

---

### 6.1 战斗阶段状态机

```
init
  → pick（双方选将）
  → duel_intro（决斗开场，圆形阵型+10% HP）
  → dueling（计时60秒，普攻/技能循环）
  → duel_result（显示胜负）
  → pick（下一对）/ result（全部结束）
```

---

### 6.2 `createBattle(attackerGeneralIds, defenderCityId)`

**输入**
- `attackerGeneralIds`: 进攻方武将 id 列表（最多 3 人）
- `defenderCityId`: 目标城池 id

**返回**: Battle 对象

```js
{
  id: number,
  attackerFaction: string,
  defenderFaction: string,
  attackers: BattleUnit[],
  defenders: BattleUnit[],
  matchScore: { attacker: 0, defender: 0 },
  phase: 'init',
  result: null,           // 'attacker_wins' | 'defender_wins'
  currentDuel: null,
  ...
}
```

---

### 6.3 兵种克制关系（`_getUnitAdvantage`）

| 进攻方 | 防守方 | 倍率 |
|--------|--------|------|
| cavalry | infantry | 1.2× |
| spear | cavalry | 1.5× |
| infantry | archer | 1.3× |
| archer | cavalry | 1.2× |
| 其他组合 | — | 1.0× |

---

### 6.4 普通攻击 (`_normalAttack`)

**伤害公式**
```
baseDmg = attacker.war * 0.3 + attacker.lead * 0.15
defense = defender.lead * 0.3 + cityDefenseBonus * 20
dmg = max(1, baseDmg - defense + random(0, 6))
dmg *= soldierRatio      // 己方兵力 / 满编兵力，士兵越少伤害越低
dmg *= unitAdvantage     // 兵种克制倍率
```

**特殊兵种修正**
- 骑兵 `cavalry`：攻击间隔 1.5s，距离 > 200 时冲锋伤害 ×1.3
- 弓箭手 `archer`：攻击间隔 2.0s，基础伤害 ×0.6，攻击距离无限制
- 步兵 `infantry`：攻击间隔 1.5s，标准伤害
- 枪兵 `spear`：攻击间隔 1.5s，标准伤害

**效果**
- `defender.hp -= dmg`（不低于 0）
- 向 `battle.damageNumbers` 推入浮动数字
- HP 归零时：`defender.status = 'dead'`，`defender.hp = 0`

---

### 6.5 技能使用 (`_useSkill`)

**前置条件**
- `user.mp >= skill.mpCost`
- `skill` 的 `cooldown` 计数器归零

**效果**
- `user.mp -= skill.mpCost`
- `user.skillCooldowns[skill.id] = skill.cooldown`
- `user.state = 'skill'`
- 向 `battle.skillAnimations` 推入动画对象（`hitFired: false`，延迟施加伤害）

**技能伤害公式**
```
dmg = skill.damage * (user.war + user.int) / 2
```

**治疗技能**（`skill.targetType === 'ally'` 或 `effect === 'heal'`）
```
healAmt = skill.damage * (user.int * 0.5 + 20)
target.hp = min(target.maxHp, target.hp + healAmt)
```

---

### 6.6 阵型加成 (`startSequentialDuel`)

| 阵型 | 效果 |
|------|------|
| `circle` | 决斗开始时 HP +10% |
| `arrow` | 攻击伤害 +10% |
| `fish` | 受到伤害 -15% |

---

### 6.7 决斗超时规则

- 决斗计时器 60 秒
- 超时后按 HP 比例判定胜负（HP 百分比高者胜）

---

### 6.8 `checkBattleEnd(battle)`

**返回**: `boolean`（`true` = 战斗结束）

| 条件 | 结果 |
|------|------|
| 进攻方所有武将 dead | `battle.result = 'defender_wins'` |
| 防守方所有武将 dead | `battle.result = 'attacker_wins'` |
| 双方均有存活武将 | 返回 `false` |

---

### 6.9 `settleBattle(battle)`

**触发条件**: `battle.result` 不为 `null`

**进攻方胜利时**
- `city.owner` 改为进攻方势力 id
- `city.soldiers = 0`（城池兵力清零）
- 掠夺：进攻方 `gold += random(0, 5000)`；`food += random(0, 8000)`
- 防守方武将：40% + `fame/200` 概率被俘虏（`status = 'captured'`）；否则撤退
- 若防守势力所有城池丢失或主将被杀：`faction.alive = false`

**防守方胜利时**
- 进攻方武将后撤至源城池
- 城池所有权不变

**经验结算**（双方）
- 胜方武将：`exp += 50 + loser.generals.length * 20`
- 败方武将（未被俘）：`exp += 10`
- 自动触发 `checkLevelUp`

---

### 6.10 AI 行为 (`aiPickNextGeneral`)

- 从己方存活武将中选取 `war` 值最高者作为下一个出战武将
- 无存活武将时返回 `null`
- 自动使用技能：每帧 2% 概率触发可用技能（MP 足够且冷却归零）

---

## 7. EventSystem — 事件系统

**文件**: `js/systems/event.js`

---

### 7.1 事件类型

| 类型 | 触发方式 | 重复触发 |
|------|----------|----------|
| `story` | 条件满足时 | 否（每个 story event 只触发一次） |
| `random` | 每回合 30% 概率 | 否（同一随机事件本局只触发一次，由 `triggeredRandomEvents` Set 去重）|

> **注意**: `triggeredStoryEvents` 为内存 Set，不持久化到存档。重新加载游戏后 story events 可重新触发。

---

### 7.2 `processEvents()`

**调用时机**: 每回合结算阶段

**流程**
1. 遍历 `gameState.events` 中所有事件
2. Story events：检查 id 是否已在 `triggeredStoryEvents`，若在则跳过；否则调用 `_checkCondition`
3. Random events：以 30% 概率抽取；已触发过的随机事件（记录在 triggeredRandomEvents）跳过；从未触发列表随机选一个执行
4. 条件通过的事件调用 `_applyEvent(event)`
5. Story events 触发后加入 `triggeredStoryEvents`
6. 返回本回合触发的事件列表

---

### 7.3 `_checkCondition(condition)`

**返回**: `boolean`

| 条件类型 | 参数 | 判定逻辑 |
|----------|------|----------|
| `turn_range` | `{ min, max }` | `min <= gs.turn <= max` |
| `faction` | `{ factionId }` | `gs.playerFaction === factionId` |
| `fame` | `{ min }` | `playerFaction.fame >= min` |
| `cities_count` | `{ min }` | 玩家城池数 >= min |
| `generals_in_city` | `{ cityId, min }` | 指定城池武将数 >= min |
| 未知类型 | — | `false` |
| `null` | — | `false` |

---

### 7.4 `_applyEvent(event)`

遍历 `event.effects[]`，逐条执行：

| 效果类型 | 参数 | 行为 |
|----------|------|------|
| `gold` | `value` | `playerFaction.gold += value`；结果不低于 0 |
| `food` | `value` | `playerFaction.food += value` |
| `population` | `value` | 随机玩家城池 `population += value` |
| `agriculture` | `value` | 随机玩家城池 `agriculture = clamp(v+value, 0, 100)` |
| `morale` | `value` | 玩家所有城池 `morale = clamp(v+value, 0, 100)` |
| `loyalty` | `value` | 玩家所有武将 `loyalty += value` |
| `fame` | `value` | `playerFaction.fame = clamp(v+value, 0, 100)` |
| `general_join` | — | 随机无主武将加入玩家，loyalty 50-70，soldiers 500 |

---

### 7.5 `applyChoice(event, choiceIndex)`

**作用**: 玩家选择事件选项后应用效果

**行为**
- 若 `event.choices` 不存在，或 `choiceIndex` 超出范围：**静默返回，不抛错**
- 否则：对 `event.choices[choiceIndex]` 调用 `_applyEvent`

---

## 8. 全局约束与边界条件

### 8.1 数值边界汇总

| 字段 | 最小值 | 最大值 | 说明 |
|------|--------|--------|------|
| `level` | 1 | 50 | 武将等级 |
| `levelReq`（技能） | 1 | 50 | 技能等级要求 |
| `agriculture` | 0 | 100 | 城池农业 |
| `commerce` | 0 | 100 | 城池商业 |
| `defense` | 0 | 100 | 城池防御 |
| `morale` | 0 | 100 | 城池士气（粮草短缺最低降至 10） |
| `fame` | 0 | 100 | 势力名声 |
| `hp` | 0 | maxHp | 不可为负 |
| `mp` | 0 | maxMp | 不可为负 |
| `gold` | 0 | 无上限 | 事件不可使金钱低于 0 |
| `food` | 0 | 无上限 | 粮草不可为负 |
| `soldiers`（武将）| 0 | lead * 40 | 统帅上限 |
| `mpCost` | 1 | — | 技能 MP 消耗必须 > 0 |
| `cooldown` | 1 | — | 技能冷却必须 > 0 |
| `damage` | 0 | — | buff/heal 类技能可为 0 |

### 8.2 引用完整性约束

| 引用 | 被引用 | 验证时机 |
|------|--------|----------|
| `city.neighbors[]` | `cities.js` 中的 id | 数据加载时 |
| `faction.cities[]` | `cities.js` 中的 id | 数据加载时 |
| `faction.generals[]` | `generals.js` 中的 id | 数据加载时 |
| `general.skills[]` | `skills.js` 中的 id | 技能分配后 |
| `march.sourceCityId / targetCityId` | 已存在的城池 | 创建行军时 |

### 8.3 唯一性约束

以下字段在各自数据集内必须唯一：
- `skill.id`
- `general.id`
- `city.id`
- `faction.id`
- `item.id`

### 8.4 特殊武将规则

| 武将 | 特殊规则 |
|------|----------|
| 项羽（xiang_yu） | `war` 可超过 100；专属技能 `qianguwuer`（千古无二）|

---

## 9. 架构重构（v2.0）

### 9.1 神对象拆分

原 `worldmap.js`（2708 行）和 `battle.js`（3876 行）均为"神对象"，已按责任拆分为三层：

| 原文件 | 拆分后 | 描述 |
|--------|--------|------|
| worldmap.js（2708行） | worldmap.js（1289行）| 场景外壳：UI 状态、输入处理、委托调用 |
| | worldmap_logic.js（618行）| 纯逻辑层：AI、行军结算、时间轴、拦截 |
| | worldmap_renderer.js（1483行）| 纯渲染层：全部 _draw* 方法 |
| battle.js（3876行）| battle.js（925行）| 场景外壳：状态机、粒子系统、输入处理 |
| | battle_logic.js（464行）| 纯逻辑层：阵型、士兵、撤退结算 |
| | battle_renderer.js（2606行）| 纯渲染层：全部 _render*/_draw* 方法 |

### 9.2 共享工具层

新增 `js/utils/` 目录，消除跨文件重复：
- `constants.js`：全局魔法数字（`MAX_GARRISON`、`SOLDIER_CAP_MULTIPLIER` 等）
- `generalUtils.js`：武将属性纯函数（`calcMaxHp`、`calcMaxMp`、`calcMarchTurns`、`checkLevelUp`）

### 9.3 委托链模式

场景外壳通过 `this._logic` 和 `this._renderer_wm`（或 `this._renderer_bt`）持有子层引用：
```js
// 场景外壳中：
_processAI() { return this._logic._processAI(); }
_drawHUD(r, ctx) { return this._renderer_wm._drawHUD(r, ctx); }
```

`WorldMapLogic` 通过构造函数注入回调，与场景层完全解耦：
```js
new WorldMapLogic(gs, {
    onTurnReport:    (text, type) => ...,
    onMarchNote:     (text, timer) => ...,
    onBattleFlash:   (cityId, timer, text) => ...,
    startNextBattle: () => ...,
});
```

---

*文档由代码逆向生成，与 `tests/unit/` 下单元测试保持同步。如修改逻辑，请同步更新对应测试和此文档。*
