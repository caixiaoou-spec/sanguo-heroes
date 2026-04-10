# 三国群英传 Web 复刻版 - 技术架构文档

> 版本：v2.1
> 更新日期：2026-04-10

---

## 1. 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│              <canvas> + <div#ui-layer>               │
└──────────────────────┬──────────────────────────────┘
                       │ ES Module Import
                       ▼
┌─────────────────────────────────────────────────────┐
│                   main.js (Game)                     │
│         主循环 · 场景管理 · 子系统协调                  │
└──┬──────┬──────┬──────┬──────┬──────┬───────────────┘
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
Engine  Engine  Engine Engine Engine Systems
Renderer Input  Audio  Save  GameState Combat/Event/
                                      Economy/Diplomacy
```

### 技术栈

| 层面 | 技术 |
|------|------|
| 语言 | Vanilla JavaScript (ES2020+) |
| 模块化 | ES Modules (import/export) |
| 渲染 | HTML5 Canvas 2D API |
| 音频 | Web Audio API (OscillatorNode + GainNode + BiquadFilterNode) |
| 存储 | localStorage |
| 构建工具 | 无 |
| 外部依赖 | 无 |
| 运行方式 | 任意 HTTP 静态文件服务器 (如 `python -m http.server`) |

---

## 2. 目录结构

```
sango-heroes/
├── index.html                     # 入口 HTML
├── css/
│   └── style.css                  # 全局样式（古风主题）
├── js/
│   ├── main.js                    # Game 类：主循环、场景管理
│   ├── engine/                    # 引擎层（与游戏逻辑无关的通用能力）
│   │   ├── renderer.js            # Canvas 2D 渲染引擎
│   │   ├── input.js               # 输入管理（鼠标/键盘/触屏）
│   │   ├── audio.js               # 音频管理（BGM + SFX）
│   │   ├── save.js                # 存档管理（localStorage）
│   │   └── game.js                # 游戏状态（数据模型）
│   ├── systems/                   # 系统层（游戏规则和逻辑）
│   │   ├── combat.js              # 战斗系统
│   │   ├── event.js               # 事件系统
│   │   ├── economy.js             # 经济系统
│   │   └── diplomacy.js           # 外交系统
│   ├── scenes/                    # 场景层（界面和交互）
│   │   ├── menu.js                # 主菜单场景
│   │   ├── factionSelect.js       # 势力选择场景
│   │   ├── worldmap.js            # 大地图场景外壳（约 1289 行）
│   │   ├── worldmap_logic.js      # 大地图纯逻辑层（660 行）
│   │   ├── worldmap_renderer.js   # 大地图渲染层（1714 行）
│   │   ├── battle.js              # 战斗场景外壳（947 行）
│   │   ├── battle_logic.js        # 战斗纯逻辑层（553 行）
│   │   └── battle_renderer.js     # 战斗渲染层（2595 行）
│   ├── utils/                     # 工具层（全局共享工具）
│   │   ├── constants.js           # 全局共享常量（NEW）
│   │   └── generalUtils.js        # 武将属性计算工具函数（NEW）
│   ├── data/                      # 数据层（静态配置）
│   │   ├── generals.js            # 283 名武将数据
│   │   ├── cities.js              # 55 座城池数据
│   │   ├── factions.js            # 14 个势力数据
│   │   ├── skills.js              # 40 个技能数据
│   │   ├── items.js               # 31 件装备数据
│   │   ├── events.js              # 26 个事件数据
│   │   └── duels.js               # 53 组历史决斗数据（NEW）
├── assets/
│   ├── portraits/                 # 77 张武将头像 PNG（128×128）
│   ├── audio/                     # 外部音频文件（可选，目录为空时使用程序化音频）
│   ├── sprites/                   # 精灵图（预留，当前程序化绘制）
│   └── tiles/                     # 地形贴图（预留，当前程序化绘制）
├── tools/
│   └── generate_portraits.html    # 头像批量生成工具
├── tests/
│   ├── helpers/
│   │   └── mockGameState.js       # 测试工厂函数（含 battleQueue/getGarrisonCount）
│   └── unit/
│       ├── combat.test.js         # CombatSystem 单元测试
│       ├── data.test.js           # 数据层完整性测试
│       ├── diplomacy.test.js      # DiplomacySystem 单元测试
│       ├── economy.test.js        # EconomySystem 单元测试
│       ├── event.test.js          # EventSystem 单元测试
│       ├── game.test.js           # GameState 单元测试
│       ├── generalUtils.test.js   # generalUtils 单元测试
│       ├── interception.test.js   # 行军拦截逻辑测试
│       ├── timeline.test.js       # 时间轴系统测试
│       ├── battle_logic.test.js   # BattleLogic 纯逻辑测试（NEW）
│       └── worldmap_logic.test.js # WorldMapLogic 纯逻辑测试（NEW）
└── docs/
    ├── requirements.md            # 需求功能文档
    ├── DEV_SPEC.md                # 开发者功能规格文档
    └── architecture.md            # 技术架构文档
```

---

## 3. 核心架构模式

### 3.1 分层架构

项目采用 **五层分离** 的架构设计：

```
┌──────────────────────────────────────────────────────────────────┐
│  Scene Shell (场景外壳)                                           │  状态机 + 输入处理 + 委托调用
│  worldmap.js, battle.js                                          │
├──────────────────────────────────────────────────────────────────┤
│  Logic Layer (逻辑层)                                             │  纯游戏逻辑，无 canvas 依赖
│  worldmap_logic.js, battle_logic.js                              │
├──────────────────────────────────────────────────────────────────┤
│  Renderer Layer (渲染层)                                          │  纯渲染，无逻辑副作用
│  worldmap_renderer.js, battle_renderer.js                        │
├──────────────────────────────────────────────────────────────────┤
│  System Layer (系统层)                                            │  游戏规则 + 业务逻辑
│  combat.js, event.js, economy.js                                 │
├──────────────────────────────────────────────────────────────────┤
│  Utils Layer (工具层)                                             │  全局常量 + 武将计算函数
│  js/utils/constants.js, js/utils/generalUtils.js                 │
├──────────────────────────────────────────────────────────────────┤
│  Engine Layer (引擎层)                                            │  通用能力 + 基础设施
│  renderer.js, input.js, audio.js                                 │
├──────────────────────────────────────────────────────────────────┤
│  Data Layer (数据层)                                              │  静态配置 + 状态存储
│  generals.js, cities.js, game.js                                 │
└──────────────────────────────────────────────────────────────────┘
```

**依赖规则：** 上层可以依赖下层，下层不依赖上层。系统层仅操作数据层，不直接操作渲染或输入。

### 3.2 场景管理模式

游戏使用 **场景状态机** 管理界面切换：

```
MenuScene ──→ FactionSelectScene ──→ WorldMapScene ←─→ BattleScene
    ↑                                      │
    └──────────── (退出/重新开始) ──────────┘
```

每个场景实现统一接口：
```javascript
class Scene {
    constructor(game) { ... }  // 初始化，持有 Game 引用
    update(dt) { ... }         // 逻辑更新（每帧调用）
    render() { ... }           // 画面渲染（每帧调用）
}
```

`Game.switchScene(name, ...args)` 负责场景实例化和切换，旧场景被 GC 回收。

### 3.3 主循环

```javascript
loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.currentScene.update(dt);
    this.currentScene.render();
    requestAnimationFrame(t => this.loop(t));
}
```

- 使用 `requestAnimationFrame` 驱动
- delta time 以秒为单位，上限 50ms（防止长帧卡顿导致跳帧）
- 每帧顺序执行：逻辑更新 → 画面渲染

---

## 4. 引擎层详细设计

### 4.1 渲染引擎 (renderer.js)

#### 类结构

```javascript
class Renderer {
    // 核心属性
    canvas, ctx          // Canvas 2D 上下文
    width = 960          // 逻辑宽度
    height = 640         // 逻辑高度
    dpr                  // 设备像素比 (HiDPI)
    camera = { x, y, zoom }  // 相机状态
    cameraStack = []     // 相机状态栈（push/pop）

    // 头像系统
    portraitImages = {}       // 已加载的图片缓存 { id: Image }
    portraitLoading = Set()   // 正在加载中的 ID 集合
    portraitFailed = Set()    // 加载失败的 ID 集合
}
```

#### 坐标系统

```
逻辑坐标 (960×640)
    ↕  dpr 缩放
物理像素 (canvas.width × canvas.height)
    ↕  camera 变换
世界坐标 (无限平面)
```

转换方法：
- `screenToWorld(sx, sy)` → `{ x, y }` — 屏幕逻辑坐标 → 世界坐标
- `worldToScreen(wx, wy)` → `{ x, y }` — 世界坐标 → 屏幕逻辑坐标

#### 头像渲染策略

```
getPortraitImage(generalId)
    ├── 缓存命中 → 返回 Image
    ├── 正在加载 / 已失败 → 返回 null
    └── 首次请求 → 异步加载 assets/portraits/{id}.png → 返回 null

drawPortrait(x, y, size, portrait, generalId)
    ├── getPortraitImage(id) 返回 Image → drawImage 绘制
    └── 返回 null → 程序化像素画 fallback
        ├── 皮肤底色 + 脸型
        ├── 发型（6种：长发/发髻/狂野/光头/冠冕/短发）
        ├── 眼睛（白底+瞳孔+高光）
        ├── 眉毛/鼻子/嘴巴
        ├── 胡须（根据 face 类型）
        └── 铠甲（含高光/阴影/金边）
    最后: _drawPortraitFrame() 绘制金色边框 + 角落装饰
```

#### 精灵绘制系统

```
drawSprite(x, y, type, color, frame, dir, isAttacking)
    │
    ├── 基础缩放: 2.5x
    ├── 头盔（按兵种区分）:
    │   ├── infantry: 平顶方盔
    │   ├── cavalry: 尖顶盔
    │   ├── archer: 头巾
    │   └── spear: 全盔
    │
    ├── 铠甲细节（按兵种区分）:
    │   ├── infantry: 胸甲纹路
    │   ├── archer: 皮甲交叉带
    │   └── spear: 鳞甲
    │
    ├── 武器:
    │   ├── infantry: 剑
    │   ├── cavalry: 长矛 + 马匹（4阶段奔跑动画）
    │   ├── archer: 弓
    │   └── spear: 长枪
    │
    ├── 动画:
    │   ├── 腿部走路动画（frame 驱动）
    │   ├── 手臂摆动
    │   ├── 身体微颤
    │   └── 攻击闪光（isAttacking 时白色闪烁）
    │
    └── 方向: dir=1 朝右, dir=-1 朝左（scale 翻转）
```

### 4.2 输入管理器 (input.js)

```javascript
class InputManager {
    // 状态
    keys = {}              // 按键按下状态
    mouseX, mouseY         // 鼠标逻辑坐标
    clicked = false        // 左键点击
    rightClicked = false   // 右键点击
    scrollDelta = 0        // 滚轮增量
    dragStartX/Y           // 拖拽起始点
    isDragging = false     // 拖拽中

    // 消费式 API（读取后重置）
    getClick()             // → {x, y} | null
    getRightClick()        // → {x, y} | null
    consumeScroll()        // → number
    getDrag()              // → {dx, dy} | null
    isKeyDown(key)         // → boolean
}
```

**坐标映射：** 浏览器 clientX/Y → canvas 边界矩形 → 逻辑 960×640 坐标

**触屏支持：** touchstart/touchmove/touchend 映射为鼠标事件，支持单指拖拽。

### 4.3 音频管理器 (audio.js)

```
AudioManager
├── audioCtx (AudioContext)
├── bgmGain → destination     // BGM 总音量
├── sfxGain → destination     // SFX 总音量
│
├── playBGM(type)
│   ├── 尝试加载外部文件: assets/audio/bgm_{type}.mp3/.ogg
│   │   ├── 成功 → MediaElementSource → bgmBus → destination
│   │   └── 失败 → 标记 unavailable，走程序化路径
│   └── _playProceduralBGM(type)
│       ├── 'map'    → _playMapBGM()    // D大调五声音阶，古风
│       └── 'battle' → _playBattleBGM() // A小调，激昂
│
├── playSFX(type)
│   └── OscillatorNode → GainNode → sfxGain
│       支持: click, attack, skill, victory, defeat, recruit
│
├── stopBGM()
│   ├── clearInterval (停止音符定时器)
│   ├── 暂停 AudioElement (外部音频)
│   └── 断开 bgmBus (立即静音所有振荡器)
│
└── toggleMute()
```

**程序化 BGM 编曲结构：**

```
地图 BGM (D大调, 每音符 0.4s):
├── 主旋律层: triangle 波 (pluck 风格) - 类古筝
├── 和声层:   sine 波 (pad 风格) - 柔和衬托
├── 低音层:   sine 波 (bass 风格) - 浑厚底色
├── 轻鼓:     每 2 拍一次 soft 鼓
└── 强鼓:     每 8 拍一次 accent 鼓

战斗 BGM (A小调, 每音符 0.25s):
├── 主旋律层: sawtooth 波 (sharp 风格) - 锋利激昂
├── 力量和弦: square 波 (pad 风格) - 厚重
├── 低音层:   sawtooth 波 (bass 风格) - 推进感
├── 密集鼓点: 每拍一次 (heavy/accent/tick 交替)
└── 镲片:     每 4 拍白噪音 highpass
```

### 4.4 存档管理器 (save.js)

```javascript
class SaveManager {
    save(gameState)     // 序列化 → JSON → localStorage['sango_heroes_save']
    load()              // localStorage → JSON.parse → 返回数据对象
    hasSave()           // 检查是否有存档
    deleteSave()        // 清除存档
    saveSettings(obj)   // 保存设置（音量等）
    loadSettings()      // 读取设置
}
```

**序列化策略：** 只保存运行时可变状态（等级、经验、兵力、归属等），静态数据（技能基础参数、城池坐标等）从数据文件重新加载后合并。

### 4.5 游戏状态 (game.js)

```javascript
class GameState {
    // 回合状态
    turn = 0
    phase = 'player'      // player | ai | event | battle
    actionPoints = 3       // 每回合 3 点

    // 数据集合
    factions = []          // 14 个势力对象
    cities = []            // 55 座城池对象
    generals = []          // 283 名武将对象
    skills = []            // 40 个技能对象
    items = []             // 31 件装备对象
    events = []            // 26 个事件数据
    duels = []             // 53 组历史决斗

    // 运行时
    playerFaction = null
    notifications = []
    battleQueue = []       // AI 攻击玩家的待处理战斗队列
    marches = []           // 行军队列

    // 初始化
    initNewGame(factionId)  // 从数据文件构建完整初始状态
    loadFromSave(saveData)  // 从存档恢复状态

    // 查询 API
    getCity(id), getFaction(id), getGeneral(id)
    getCitiesOf(factionId), getGeneralsOf(factionId)
    getGeneralsInCity(cityId)
    getUnaffiliatedGenerals()
    getAliveFactions()
    checkVictory()          // → 'victory' | 'defeat' | null
}
```

**武将初始化公式：**
```
HP = 100 + war × 2 + lead
MP = 50 + int × 2
初始兵力 = 1000 ~ 3000 (随机)
带兵上限 = lead × 40   (SOLDIER_CAP_MULTIPLIER = 40)
```

---

## 5. 系统层详细设计

### 5.1 战斗系统 (combat.js)

#### 战斗数据结构

```javascript
BattleUnit = {
    general: GeneralObject,
    hp, maxHp, mp, maxMp,
    soldiers, maxSoldiers,
    skills: [{ ...skill, cooldown: 0 }],
    x, y,                    // 战场位置
    state: 'advance' | 'fight' | 'skill' | 'retreat' | 'dead',
    animFrame: 0,
    target: null,
    effects: [],             // 浮动伤害数字等
    projectiles: []          // 飞行中的技能投射物
}
```

#### 战斗更新循环 (updateBattle)

```
每帧 (dt):
├── 遍历所有存活单位
│   ├── state: advance
│   │   ├── 寻找最近敌方单位
│   │   ├── 距离 > 攻击范围 → 向目标移动（骑兵120，其他80）
│   │   └── 距离 ≤ 攻击范围 → 切换到 fight
│   │
│   ├── state: fight
│   │   ├── 计算伤害 = 基础攻击 × 兵种克制 × 城防加成 × 兵力比
│   │   ├── 扣除目标 HP 和士兵
│   │   ├── 2% 概率检查是否释放技能
│   │   └── 目标死亡 → 回到 advance 寻找新目标
│   │
│   ├── state: skill
│   │   ├── 播放技能动画
│   │   ├── 应用技能效果（伤害/治疗/增益/控制）
│   │   └── 动画结束 → 回到 fight
│   │
│   └── state: dead
│       └── 不再更新
│
├── MP 回复: +2/秒
├── 更新投射物和效果
└── 检查战斗结束（一方全灭或 60s 超时）
```

#### 伤害公式

```
基础伤害 = (攻方 war + 攻方 lead/2) × (1 + 攻方士兵/1000)
减伤 = 守方 lead × 0.3 + 城防加成
兵种倍率 = 克制表[攻方兵种][守方兵种]
最终伤害 = max(1, (基础伤害 - 减伤) × 兵种倍率)
士兵损失 = max(1, 最终伤害 / 10)
```

#### 战斗结算 (settleBattle)

```
胜方:
├── 武将 +50 经验
├── 检查升级（阈值 = level × 100）
└── 攻方胜 → 城池归属变更、缴获金钱/粮草

败方:
├── 武将 +20 经验
├── 40% + (胜方声望/200) 概率被俘获
└── 未被俘 → 撤退至同势力其他城池（无城可退则被俘）

势力消灭:
└── 失去全部城池的势力从存活列表移除
```

### 5.2 经济系统 (economy.js)

```
回合结算 processTurn(gameState):
├── 遍历每个势力的每座城池
│   ├── 金钱收入 = commerce × population / 10000
│   ├── 粮草收入 = agriculture × population / 8000
│   ├── 粮草消耗 = (城池驻军 + Σ武将兵力) × 0.5
│   ├── 人口增长 (morale > 50 时)
│   └── 缺粮 → morale 下降
│
├── 城池内政操作:
│   ├── develop(city, type) → agriculture 或 commerce + (5 + pol/10)
│   ├── recruit(city)       → 获得 population × 2% 兵力
│   ├── fortify(city, gen)  → defense + (3 + lead/15)
│   ├── searchGeneral()     → charisma 概率招募在野武将
│   ├── assignSoldiers()    → 分配城池驻军给武将
│   └── transfer(gen, city) → 武将调遣至相邻己方城池（WorldMapScene 内处理）
```

### 5.3 事件系统 (event.js)

```
processEvents(gameState):
├── 遍历 story events
│   ├── 检查触发条件:
│   │   ├── turn_range: [min, max]
│   │   ├── faction: 指定势力
│   │   ├── fame: ≥ 阈值
│   │   ├── cities_count: ≥ 数量
│   │   └── generals_in_city: 指定城有指定武将
│   └── 条件满足且未触发过 → 触发
│
├── 30% 概率触发随机事件
│   └── 随机选取一个随机事件
│
└── 触发的事件:
    ├── 显示描述文本
    ├── 提供 2-3 个选择
    └── 应用选择的效果:
        gold, food, population, agriculture,
        morale, loyalty, fame, general_join
```

### 5.4 外交系统 (diplomacy.js)

```
formAlliance(factionA, factionB):
├── 成功率 = 50 + (factionA.fame - factionB.fame) / 2
├── 成功 → 互加 allies, 从 enemies 移除
└── 失败 → 返回失败消息

declareWar(factionA, factionB):
├── 互加 enemies
├── 从 allies 移除
└── 必定成功

ceasefire(factionA, factionB):
├── 花费 5000 金
├── 成功率 = 40 + fame 差 / 3
└── 成功 → 从 enemies 互相移除

persuadeSurrender(factionA, factionB):
├── 条件: factionB 城池数 ≤ 2
├── 成功率 = (fame差) / 2
└── 成功 → factionB 全部城池和武将归入 factionA
```

---

## 6. 场景层详细设计

### 6.1 世界地图场景 (worldmap.js) — 最复杂

> **重构说明 (v2.0)**: `WorldMapScene` 已拆分为三层：
> - `WorldMapScene` (worldmap.js)：场景外壳，持有全部 UI 状态，处理输入，委托逻辑和渲染
> - `WorldMapLogic` (worldmap_logic.js)：纯逻辑层，通过回调注入 `onTurnReport` / `onMarchNote` / `onBattleFlash` / `startNextBattle` 与场景解耦
> - `WorldMapRenderer` (worldmap_renderer.js)：纯渲染层，通过 `this._s` 引用场景状态，无逻辑副作用

```
WorldMapScene
├── 状态管理
│   ├── selectedCity         // 当前选中城池
│   ├── showPanel            // 显示面板类型
│   ├── attackTarget         // 出征目标
│   ├── selectedGenerals     // 出征选中武将
│   ├── transferTarget       // 调遣目标城池
│   ├── selectedTransfers    // 调遣选中武将
│   ├── _pendingBattleAlert  // 待确认的防守战斗（敌军来袭弹窗）
│   └── battleReturnTimer    // 防守战斗返回计时器
│
├── update(dt)
│   ├── 处理输入（点击城池、按钮、面板交互）
│   ├── 处理敌军来袭警告弹窗
│   ├── 更新地图动画（旗帜、河流、云朵）
│   ├── 更新通知动画
│   └── 处理战斗返回队列
│
├── render()
│   ├── 清屏 + 地形背景（山脉、河流、区域标注、云朵）
│   ├── 固定视角绘制（无相机变换）
│   │   ├── 城池道路连线（古地图虚线风格）
│   │   ├── 城池城墙图标 + 名称 + 势力旗帜
│   │   └── 领地光晕 + 悬停/选中高亮
│   ├── UI 层
│   │   ├── 顶部 HUD
│   │   ├── 底部按钮栏
│   │   ├── 城池信息面板 / 武将详情 / 武将列表 / 外交面板
│   │   ├── 出征选择面板 / 调遣选择面板
│   │   ├── 敌军来袭警告面板
│   │   └── 事件对话框 / 回合报告
│   └── 通知弹出层
│
├── _endTurn()
│   ├── economy.processTurn()     // 经济结算
│   ├── eventSystem.process()      // 事件处理
│   ├── _processAI()               // AI 行动
│   ├── 检查 battleQueue           // AI 攻击玩家 → 弹出警告面板
│   └── _finishEndTurn()           // 完成回合
│
├── _startNextQueuedBattle()
│   └── 设置 _pendingBattleAlert → 显示敌军来袭面板
│       └── 玩家点击"迎战" → game.startDefenseBattle()
│
├── _openTransferSelect(city)
│   └── 查找相邻己方城池 → 打开调遣选择面板
│       └── 确认 → 武将.city = 目标城池, 行动点 -1
│
└── _processAI()
    └── 遍历每个 AI 势力
        ├── 城池开发（随机农业/商业）
        ├── 征兵
        ├── 分配兵力给武将
        └── 评估攻防兵力比 → 决定是否进攻
            ├── 攻击 AI → 自动结算
            └── 攻击玩家 → 加入 battleQueue
```

### 6.2 战斗场景 (battle.js) — 最核心

> **重构说明 (v2.0)**: `BattleScene` 已拆分为三层：
> - `BattleScene` (battle.js)：场景外壳，持有相位状态机、粒子系统、输入处理
> - `BattleLogic` (battle_logic.js)：纯逻辑方法（阵型、士兵更新、撤退结算等）
> - `BattleRenderer` (battle_renderer.js)：纯渲染方法（战场绘制、HUD、特效等）

```
BattleScene
├── 构造参数
│   ├── attackerGeneralIds    // 攻方武将 ID 列表
│   ├── defenderCityId        // 防守城池 ID
│   └── playerSide            // 'attacker' | 'defender'
│
├── 状态管理
│   ├── battle                // CombatSystem 创建的战斗数据
│   ├── selectedUnit          // 当前选中单位
│   ├── autoMode              // 自动战斗开关
│   ├── speedMultiplier       // 速度倍率 (1/2/3)
│   ├── particles = []        // 粒子效果数组
│   ├── screenShake = 0       // 屏幕震动强度
│   └── battleResult          // 战斗结果（null / 结算数据）
│
├── update(dt)
│   ├── dt × speedMultiplier  // 应用速度倍率
│   ├── combat.updateBattle() // 战斗逻辑更新
│   ├── 更新粒子生命周期
│   ├── 更新屏幕震动衰减
│   ├── 处理输入（选中单位、释放技能、UI按钮）
│   └── 检查战斗结束 → 触发结算
│
├── render()
│   ├── 背景（天空渐变 + 山脉 + 云朵）
│   ├── pushCamera → 战场内容
│   │   ├── 地面瓦片
│   │   ├── 装饰树木
│   │   ├── 武将单位（精灵 + 小兵 × 8）
│   │   ├── HP/MP 条
│   │   ├── 技能特效动画
│   │   ├── 投射物
│   │   ├── 浮动伤害数字
│   │   └── 粒子效果
│   ├── popCamera → UI 层
│   │   ├── 选中武将 HUD（头像 + 属性 + 技能栏）
│   │   ├── 双方军队标签
│   │   ├── 倒计时
│   │   ├── 自动/速度按钮
│   │   └── 战斗结果面板（胜负 + 战报 + 返回按钮）
│   └── 屏幕震动偏移
│
└── _drawGeneralUnits(unit)
    ├── 武将精灵
    │   ├── 武将型 (war ≥ int): 铠甲 + 兵器
    │   ├── 谋士型 (int > war): 文士袍 + 羽扇
    │   └── 高武力 (war ≥ 90): 放大至 2.8x
    └── 小兵精灵 × 8
        └── renderer.drawSprite() × 8
```

---

## 7. 数据模型

### 7.1 武将 (General)

```javascript
{
    id: 'guanyu',               // 唯一标识
    name: '关羽',               // 显示名
    faction: 'liu_bei',         // 初始势力
    war: 97, int: 70,           // 武力、智力
    lead: 95, pol: 60,          // 统率、政治
    cha: 85,                    // 魅力
    level: 16,                  // 等级
    loyalty: 100,               // 忠诚度
    unitType: 'cavalry',        // 兵种
    portrait: {                 // 头像参数（程序化绘制用）
        hair: 'long', face: 'beard',
        armor: 'heavy', color: '#cc0000'
    },
    // 运行时属性 (initNewGame 计算)
    hp, maxHp, mp, maxMp,
    soldiers, maxSoldiers,
    exp, skills: [], equipment: {},
    city: 'xinye',              // 当前所在城池
    status: 'normal'            // normal | captured | dead
}
```

### 7.2 城池 (City)

```javascript
{
    id: 'luoyang',
    name: '洛阳',
    region: '中原',
    x: 420, y: 280,              // 地图坐标
    neighbors: ['xuchang', 'changan', ...],  // 相邻城池
    population: 80000,
    agriculture: 75,
    commerce: 80,
    defense: 70,
    soldiers: 5000,              // 城池驻军
    morale: 80,
    owner: 'cao_cao'             // 所属势力
}
```

### 7.3 势力 (Faction)

```javascript
{
    id: 'cao_cao',
    name: '曹操',
    title: '丞相',
    color: '#4488ff',
    description: '挟天子以令诸侯...',
    cities: ['xuchang', 'luoyang', 'yecheng'],
    generals: ['caocao', 'xiahouyuan', ...],
    gold: 50000, food: 80000,
    fame: 85,
    allies: [], enemies: []
}
```

### 7.4 技能 (Skill)

```javascript
{
    id: 'sweep',
    name: '横扫千军',
    type: 'warrior',            // warrior | strategist | support
    mpCost: 20,
    cooldown: 8,
    damage: 2.0,                // 伤害倍率
    effect: 'damage',           // damage | heal | buff | stun | fire | ice | lightning
    range: 150,
    target: 'area',             // single | area | ally | self
    animation: 'spin',          // 动画类型
    levelReq: 5,
    description: '...'
}
```

### 7.5 装备 (Item)

```javascript
{
    id: 'green_dragon',
    name: '青龙偃月刀',
    type: 'weapon',             // weapon | armor | mount | item
    rarity: 'legendary',
    effects: { war: 12, speed: 3 },
    description: '...'
}
```

---

## 8. 关键技术实现

### 8.1 HiDPI 渲染

```javascript
constructor(canvas) {
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = this.width * this.dpr;
    canvas.height = this.height * this.dpr;
    canvas.style.width = this.width + 'px';
    canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
}
```

Canvas 物理尺寸 = 逻辑尺寸 × dpr，通过 ctx.scale 统一逻辑坐标，所有绘制代码无需关心 dpr。

### 8.2 相机系统

```javascript
pushCamera() {
    this.ctx.save();
    this.cameraStack.push({ ...this.camera });
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
}

popCamera() {
    this.ctx.restore();
    this.cameraStack.pop();
}
```

所有世界内容在 push/pop 之间绘制，UI 在 pop 之后绘制（屏幕坐标）。

### 8.3 战斗队列与敌军来袭警告（跨场景状态）

```
WorldMapScene._endTurn()
    → _processAI() 将 AI→玩家 攻击加入 gameState.battleQueue
    → _startNextQueuedBattle()
        → 从队列取出第一个
        → 设置 _pendingBattleAlert（显示敌军来袭面板）
        → 玩家点击"迎战！"
            → game.startDefenseBattle(attackerIds, cityId)
                → 切换到 BattleScene(playerSide='defender')

BattleScene 结束 → game.switchScene('worldmap')

WorldMapScene 构造函数检查 battleQueue
    → 有剩余 → 延迟 1s 后 _startNextQueuedBattle() → 再次弹出警告面板
    → 队列清空 → _finishEndTurn() 完成回合
```

**敌军来袭面板**：红色主题警告弹窗，展示攻方势力、来犯武将（头像+属性+兵力）、守方信息，玩家确认后进入战斗。面板渲染期间阻止所有其他输入。

状态存储在 `GameState.battleQueue`（跨场景持久），而非 `WorldMapScene`（每次切换会重建）。

### 8.4 武将调遣系统

```
_openTransferSelect(city)
    → 过滤 city.neighbors 中 owner === playerFaction 的城池
    → 打开调遣选择面板（蓝色主题，类似出征面板）
    → 玩家选择目标城池 + 勾选武将
    → 确认：
        → 遍历选中武将，gen.city = transferTarget
        → actionPoints--
```

调遣不涉及战斗，纯数据操作。武将连同所带兵力一起移动。

### 8.5 程序化音频合成

**音符播放基础单元：**
```javascript
_playTone(bus, oscType, freq, start, dur, vol, style)
// style 决定包络:
// 'pluck' → 快起快衰（模拟拨弦）
// 'pad'   → 慢起慢衰（柔和背景）
// 'bass'  → 平直饱满
// 'sharp' → 快起中衰（锋利感）
```

**鼓声合成：** OscillatorNode → BiquadFilter(lowpass) → GainNode，通过频率快速下滑（80→30Hz）模拟鼓膜振动。

**镲片合成：** 白噪音 AudioBuffer → BiquadFilter(highpass, 5000Hz) → GainNode，快速衰减。

### 8.6 粒子系统

```javascript
// 生成
_spawnImpactParticles(x, y, color) {
    for (let i = 0; i < 6; i++) {
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 120,  // 随机方向
            vy: -Math.random() * 80 - 20,       // 向上喷射
            life: 0.3 + Math.random() * 0.3,    // 生命周期
            color, size: 2 + Math.random() * 3
        });
    }
}

// 更新 (每帧)
particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt;  // 重力
    p.life -= dt;
});
particles = particles.filter(p => p.life > 0);
```

---

## 9. 性能考量

| 措施 | 说明 |
|------|------|
| 帧时间上限 | dt 限制在 50ms，防止长帧导致物理跳帧 |
| 懒加载头像 | 首次需要时才发起图片请求，缓存已加载/失败状态 |
| 程序化渲染 | 无需加载大量图片资源，减少网络请求 |
| 消费式输入 | 点击/滚轮读取后立即重置，避免事件堆积 |
| 相机剔除 | 世界地图仅绘制相机可视范围内的城池和道路 |
| BGM Bus 断开 | stopBGM 时断开 GainNode，所有已调度的 OscillatorNode 立即静音 |
| 粒子池回收 | 粒子生命耗尽后从数组过滤移除 |

---

## 10. 扩展点

| 方向 | 实现思路 |
|------|----------|
| 外部 BGM | 将 MP3/OGG 放入 `assets/audio/bgm_{type}.mp3`，系统自动优先使用 |
| 外部精灵图 | `assets/sprites/` 目录预留，可扩展 Renderer 支持精灵表 |
| 网络对战 | GameState 序列化已完善，可通过 WebSocket 同步 |
| 更多势力/武将 | 在 data/*.js 中追加数据即可，系统自动适配 |
| 自定义事件 | 在 events.js 中按格式添加，事件引擎自动识别 |
| 多语言 | 所有文本集中在场景和数据文件中，可提取为 i18n |

---

## 11. 工具层 (utils/)

### 11.1 constants.js

集中管理全局魔法数字，所有系统文件通过 import 引用，避免硬编码分散：

```js
HP_BASE = 100          // 武将最大HP基础值
MP_BASE = 50           // 武将最大MP基础值
MAX_GENERAL_LEVEL = 50 // 武将等级上限
EXP_PER_LEVEL = 100    // 升级所需经验 = level × EXP_PER_LEVEL
MAX_GARRISON = 12      // 每城驻守武将上限
SOLDIER_CAP_MULTIPLIER = 40  // 统兵上限 = lead × 40
SOLDIER_RECOVERY_RATE = 0.30 // 回合末士兵恢复比例
MARCH_DIST = { T1: 60, T2: 120, T3: 200 }  // 行军距离阈值
```

### 11.2 generalUtils.js

武将属性计算纯函数，被 game.js / economy.js / combat.js 共同引用：

```js
calcMaxHp(war, lead)   → HP_BASE + war*2 + lead
calcMaxMp(int)         → MP_BASE + int*2
calcMarchTurns(dist)   → 1/2/3/4 基于距离阈值
checkLevelUp(general, gameState)  → 合并自 economy.js 和 combat.js 的重复实现
```

---

## 12. 测试覆盖

运行方式：`npm test`（Jest 30 + Babel）

| 测试文件 | 覆盖目标 | 主要用例 |
|----------|----------|----------|
| `game.test.js` | `engine/game.js` | initNewGame、createMarch、checkVictory、Getter 方法 |
| `economy.test.js` | `systems/economy.js` | develop/recruit/fortify/search/assignSoldiers/processTurn |
| `diplomacy.test.js` | `systems/diplomacy.js` | formAlliance/declareWar/ceasefire/persuadeSurrender |
| `combat.test.js` | `systems/combat.js` | 兵种克制、伤害公式、技能、结算、AI 拾将 |
| `event.test.js` | `systems/event.js` | 事件条件判断、效果应用、choiceIndex 边界 |
| `generalUtils.test.js` | `utils/generalUtils.js` | calcMaxHp/Mp、calcMarchTurns、checkLevelUp |
| `data.test.js` | `data/*.js` | 城池/武将/势力/技能字段完整性与引用一致性 |
| `interception.test.js` | 行军拦截逻辑 | _checkMarchInterceptions、_resolveInterception |
| `timeline.test.js` | 时间轴系统 | _buildTimeline 事件顺序、meet/arrive 边界 |
| `battle_logic.test.js` | `scenes/battle_logic.js` | 阵型位置、撤退条件/副作用、拦截战结算、士兵生成 |
| `worldmap_logic.test.js` | `scenes/worldmap_logic.js` | 时间轴窗口、自动结算攻城/野战、_enterCity、行军到达、实时事件检测 |

**不覆盖（依赖 Canvas/DOM）**：`renderer.js`、`audio.js`、`input.js`、`pinchzoom.js`、`save.js`、所有 `*_renderer.js`、`worldmap.js`、`battle.js`、`menu.js`、`factionSelect.js`、`main.js`。

**mock 工厂**：`tests/helpers/mockGameState.js` 提供 `createMockGameState`（含 `battleQueue`、`getGarrisonCount`）、`createMockGeneral`、`createMockCity`、`createMockFaction`、`createMockBattle`、`createMockBattleUnit`。
