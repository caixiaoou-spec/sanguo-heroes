// =============================================================================
// items.js - Three Kingdoms Strategy RPG - Item Data
// =============================================================================

const ITEMS = [
  // =========================================================================
  //  WEAPONS (武器)
  // =========================================================================
  {
    id: 'weapon_001',
    name: '青龙偃月刀',
    type: 'weapon',
    rarity: 'legendary',
    stats: { war: 12, speed: -1, defense: 3 },
    description: '关羽的传世神兵，重八十二斤，刀身镶有青龙纹饰，挥动时犹如青龙出海，威震华夏。'
  },
  {
    id: 'weapon_002',
    name: '方天画戟',
    type: 'weapon',
    rarity: 'legendary',
    stats: { war: 14, speed: -2, defense: 1 },
    description: '吕布专属神兵，戟身绘有精美花纹，三国第一猛将手持此戟，天下无人敢缨其锋。'
  },
  {
    id: 'weapon_003',
    name: '丈八蛇矛',
    type: 'weapon',
    rarity: 'legendary',
    stats: { war: 11, speed: 2, defense: 0 },
    description: '张飞的贴身兵器，矛头弯曲如蛇，长一丈八尺，长坂坡上一声怒吼，吓退曹军百万。'
  },
  {
    id: 'weapon_004',
    name: '雌雄双股剑',
    type: 'weapon',
    rarity: 'epic',
    stats: { war: 8, int: 3, speed: 3 },
    description: '刘备的佩剑，雌雄一对，暗含阴阳相生之理，剑法轻灵飘逸，兼具仁者之风。'
  },
  {
    id: 'weapon_005',
    name: '古锭刀',
    type: 'weapon',
    rarity: 'epic',
    stats: { war: 9, speed: 1, defense: 1 },
    description: '孙坚所佩之刀，刀身古朴厚重，曾在汜水关前斩杀华雄，威名赫赫。'
  },
  {
    id: 'weapon_006',
    name: '七星宝刀',
    type: 'weapon',
    rarity: 'epic',
    stats: { war: 7, int: 2, speed: 4 },
    description: '司徒王允赠予曹操的宝刀，刀身镶嵌七颗宝石，锋利无比，曾用于刺杀董卓之计。'
  },
  {
    id: 'weapon_007',
    name: '倚天剑',
    type: 'weapon',
    rarity: 'legendary',
    stats: { war: 10, int: 5, defense: 2 },
    description: '曹操随身宝剑，剑身削铁如泥，号称"倚天不出，谁与争锋"，王者气概尽显。'
  },
  {
    id: 'weapon_008',
    name: '诸葛连弩',
    type: 'weapon',
    rarity: 'legendary',
    stats: { war: 6, int: 10, speed: 5 },
    description: '诸葛亮发明的连射弩机，一次可发十矢，巧夺天工之作，改变了战场攻守之势。'
  },
  {
    id: 'weapon_009',
    name: '铁脊蛇矛',
    type: 'weapon',
    rarity: 'rare',
    stats: { war: 6, speed: 2 },
    description: '精铁锻造的蛇形长矛，矛身坚韧不易折断，是军中将领常用的上等兵器。'
  },
  {
    id: 'weapon_010',
    name: '鹅毛大刀',
    type: 'weapon',
    rarity: 'common',
    stats: { war: 3, speed: 1 },
    description: '寻常军中制式大刀，虽不及名刀宝剑，但锋利耐用，是步兵将校的标配武器。'
  },
  {
    id: 'weapon_011',
    name: '三尖两刃刀',
    type: 'weapon',
    rarity: 'rare',
    stats: { war: 7, speed: 0, defense: 2 },
    description: '纪灵所使兵器，刀头三尖如叉，攻守兼备，重量惊人，非力大之人不能驾驭。'
  },
  {
    id: 'weapon_012',
    name: '铁枪',
    type: 'weapon',
    rarity: 'common',
    stats: { war: 4, speed: 1 },
    description: '军中常见的制式长枪，铁杆铁尖，结实耐用，是骑兵冲锋的基本装备。'
  },

  // =========================================================================
  //  ARMOR (防具)
  // =========================================================================
  {
    id: 'armor_001',
    name: '锁子甲',
    type: 'armor',
    rarity: 'epic',
    stats: { defense: 10, hp: 200, speed: -1 },
    description: '以细密铁环相互勾连而成的铠甲，刀枪难入，柔韧贴身，是将帅护身的上佳之选。'
  },
  {
    id: 'armor_002',
    name: '明光铠',
    type: 'armor',
    rarity: 'legendary',
    stats: { defense: 14, hp: 300, speed: -2, war: 2 },
    description: '铠甲前后各嵌圆形护心镜，日光照射下明亮如镜，防御力极强，唯有名将方可配备。'
  },
  {
    id: 'armor_003',
    name: '白银甲',
    type: 'armor',
    rarity: 'epic',
    stats: { defense: 11, hp: 250, speed: -1 },
    description: '以白银合金锻造的精甲，通体银白，轻便坚固，兼具华丽外观与卓越防护。'
  },
  {
    id: 'armor_004',
    name: '虎贲铠',
    type: 'armor',
    rarity: 'epic',
    stats: { defense: 12, hp: 280, war: 3, speed: -2 },
    description: '虎贲军精锐专属铠甲，甲面刻有猛虎纹样，穿戴后勇猛倍增，敌人望之丧胆。'
  },
  {
    id: 'armor_005',
    name: '藤甲',
    type: 'armor',
    rarity: 'rare',
    stats: { defense: 8, hp: 150, speed: 2 },
    description: '南蛮部落以油浸藤条编制的轻甲，入水不沉、刀箭不入，但惧火攻。'
  },
  {
    id: 'armor_006',
    name: '皮甲',
    type: 'armor',
    rarity: 'common',
    stats: { defense: 4, hp: 80 },
    description: '牛皮硝制而成的简易护甲，轻便灵活，适合轻骑斥候使用。'
  },
  {
    id: 'armor_007',
    name: '铁甲',
    type: 'armor',
    rarity: 'rare',
    stats: { defense: 7, hp: 120, speed: -1 },
    description: '精铁锻造的标准铠甲，防护可靠，是军中中坚将领的常规装备。'
  },

  // =========================================================================
  //  MOUNTS (坐骑)
  // =========================================================================
  {
    id: 'mount_001',
    name: '赤兔马',
    type: 'mount',
    rarity: 'legendary',
    stats: { speed: 12, war: 3, defense: 1 },
    description: '浑身赤红如火的绝世宝马，日行千里，夜行八百。先随吕布，后归关羽，人中吕布马中赤兔。'
  },
  {
    id: 'mount_002',
    name: '的卢马',
    type: 'mount',
    rarity: 'legendary',
    stats: { speed: 10, defense: 3, hp: 100 },
    description: '刘备的坐骑，额上有白斑，妨主之相却救主于檀溪，一跃三丈，忠义之马。'
  },
  {
    id: 'mount_003',
    name: '绝影',
    type: 'mount',
    rarity: 'epic',
    stats: { speed: 9, war: 2 },
    description: '曹操的爱马，奔跑时影子都跟不上故名绝影，宛城之战中为护主而亡，令曹操痛惜不已。'
  },
  {
    id: 'mount_004',
    name: '爪黄飞电',
    type: 'mount',
    rarity: 'epic',
    stats: { speed: 8, int: 2, defense: 2 },
    description: '曹操的仪仗坐骑，通体黄色，四蹄雪白，奔腾如飞电掣空，气度非凡，彰显王者威仪。'
  },
  {
    id: 'mount_005',
    name: '大宛良驹',
    type: 'mount',
    rarity: 'rare',
    stats: { speed: 6, war: 1 },
    description: '产自西域大宛国的骏马，体型高大，耐力出众，是军中难得的良驹。'
  },
  {
    id: 'mount_006',
    name: '乌骓马',
    type: 'mount',
    rarity: 'rare',
    stats: { speed: 5, defense: 1 },
    description: '通体乌黑的战马，皮毛如墨，性情刚烈，善于夜战奔袭。'
  },

  // =========================================================================
  //  ITEMS (道具/书籍)
  // =========================================================================
  {
    id: 'item_001',
    name: '太平要术',
    type: 'item',
    rarity: 'legendary',
    stats: { int: 12, mp: 200 },
    description: '张角所得天书，据传由南华老仙所授，内含呼风唤雨之术，黄巾起义之根源。'
  },
  {
    id: 'item_002',
    name: '兵法二十四篇',
    type: 'item',
    rarity: 'legendary',
    stats: { int: 15, war: 5 },
    description: '诸葛亮毕生心血所著兵书，涵盖治军、用兵、安民、外交等策略，智慧结晶传世不朽。'
  },
  {
    id: 'item_003',
    name: '孟德新书',
    type: 'item',
    rarity: 'epic',
    stats: { int: 8, war: 4 },
    description: '曹操所著兵法，又名《魏武注孙子》，融合孙子兵法与自身实战经验，言简意赅。'
  },
  {
    id: 'item_004',
    name: '恢复药',
    type: 'item',
    rarity: 'common',
    stats: { hp: 200 },
    description: '军医配制的常见药物，能快速恢复士兵体力，是行军作战的必备物资。'
  },
  {
    id: 'item_005',
    name: '大恢复药',
    type: 'item',
    rarity: 'rare',
    stats: { hp: 500, mp: 100 },
    description: '精心熬制的上等药剂，药效远超寻常药物，能令重伤之人迅速恢复元气。'
  },
  {
    id: 'item_006',
    name: '万能药',
    type: 'item',
    rarity: 'epic',
    stats: { hp: 999, mp: 300 },
    description: '传说中的灵丹妙药，能治百病解百毒，据说需集齐数十种珍稀药材方可炼制。'
  },
  {
    id: 'item_007',
    name: '铁矿石',
    type: 'item',
    rarity: 'common',
    stats: {},
    description: '品质尚可的铁矿原石，可用于锻造兵器或修缮铠甲，是军备生产的基础材料。'
  },
  {
    id: 'item_008',
    name: '玉石',
    type: 'item',
    rarity: 'rare',
    stats: { int: 2 },
    description: '温润细腻的上等美玉，可雕琢为玉佩装饰，亦可作为外交礼物赠予他国使臣。'
  },
  {
    id: 'item_009',
    name: '孙子兵法',
    type: 'item',
    rarity: 'epic',
    stats: { int: 10, war: 3 },
    description: '兵圣孙武所著旷世兵书，十三篇论述用兵之道，千古流传，兵家必读之经典。'
  },
  {
    id: 'item_010',
    name: '传国玉玺',
    type: 'item',
    rarity: 'legendary',
    stats: { int: 5, war: 5, defense: 5 },
    description: '秦始皇以和氏璧雕成的玉玺，上刻"受命于天，既寿永昌"，得之者可号令天下。'
  },
  {
    id: 'item_011',
    name: '铜雀春深锁',
    type: 'item',
    rarity: 'rare',
    stats: { int: 4, defense: 2 },
    description: '铜雀台上的精美锁饰，工艺精湛，象征着曹魏的强盛国力与文化底蕴。'
  },
  {
    id: 'item_012',
    name: '华佗医典',
    type: 'item',
    rarity: 'epic',
    stats: { int: 6, hp: 300, mp: 150 },
    description: '神医华佗所遗医书残卷，记载麻沸散及五禽戏等独门医术，弥足珍贵。'
  }
];

export default ITEMS;
