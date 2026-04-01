// Three Kingdoms Generals Data
// Stats: war(武力), int(智力), lead(统率), pol(政治), cha(魅力) - range 1-100
// Historical accuracy based on Romance of the Three Kingdoms traditions

const generals = [
  // ============================================================
  // 曹操方 (Cao Cao's Faction)
  // ============================================================
  {
    id: 'cao_cao',
    name: '曹操',
    faction: 'cao_cao',
    stats: { war: 72, int: 91, lead: 96, pol: 94, cha: 96 },
    level: 18,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'xiahou_dun',
    name: '夏侯惇',
    faction: 'cao_cao',
    stats: { war: 90, int: 52, lead: 80, pol: 40, cha: 72 },
    level: 15,
    exp: 0,
    loyalty: 98,
    unitType: 'spear',
    skills: ['feilongzaitian', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2b4a7a' }
  },
  {
    id: 'xiahou_yuan',
    name: '夏侯渊',
    faction: 'cao_cao',
    stats: { war: 88, int: 48, lead: 82, pol: 36, cha: 60 },
    level: 14,
    exp: 0,
    loyalty: 97,
    unitType: 'archer',
    skills: ['hengsaoqianjun', 'liehuozhan', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#2b4a7a' }
  },
  {
    id: 'cao_ren',
    name: '曹仁',
    faction: 'cao_cao',
    stats: { war: 82, int: 58, lead: 85, pol: 48, cha: 62 },
    level: 13,
    exp: 0,
    loyalty: 96,
    unitType: 'spear',
    skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'square', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'cao_hong',
    name: '曹洪',
    faction: 'cao_cao',
    stats: { war: 78, int: 42, lead: 72, pol: 35, cha: 55 },
    level: 11,
    exp: 0,
    loyalty: 95,
    unitType: 'cavalry',
    skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'round', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'xun_yu',
    name: '荀彧',
    faction: 'cao_cao',
    stats: { war: 29, int: 95, lead: 65, pol: 98, cha: 88 },
    level: 16,
    exp: 0,
    loyalty: 90,
    unitType: 'archer',
    skills: ['baofengxue', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#4a6fa5' }
  },
  {
    id: 'xun_you',
    name: '荀攸',
    faction: 'cao_cao',
    stats: { war: 25, int: 93, lead: 62, pol: 88, cha: 78 },
    level: 14,
    exp: 0,
    loyalty: 92,
    unitType: 'archer',
    skills: ['yunshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#4a6fa5' }
  },
  {
    id: 'guo_jia',
    name: '郭嘉',
    faction: 'cao_cao',
    stats: { war: 18, int: 97, lead: 64, pol: 82, cha: 85 },
    level: 15,
    exp: 0,
    loyalty: 93,
    unitType: 'archer',
    skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#5a7fba' }
  },
  {
    id: 'cheng_yu',
    name: '程昱',
    faction: 'cao_cao',
    stats: { war: 40, int: 90, lead: 60, pol: 85, cha: 56 },
    level: 13,
    exp: 0,
    loyalty: 91,
    unitType: 'archer',
    skills: ['yunshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#3a5a8a' }
  },
  {
    id: 'yu_jin',
    name: '于禁',
    faction: 'cao_cao',
    stats: { war: 78, int: 62, lead: 80, pol: 52, cha: 55 },
    level: 12,
    exp: 0,
    loyalty: 82,
    unitType: 'spear',
    skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2b4a7a' }
  },
  {
    id: 'yue_jin',
    name: '乐进',
    faction: 'cao_cao',
    stats: { war: 82, int: 50, lead: 75, pol: 38, cha: 58 },
    level: 11,
    exp: 0,
    loyalty: 93,
    unitType: 'spear',
    skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#2b4a7a' }
  },
  {
    id: 'li_dian',
    name: '李典',
    faction: 'cao_cao',
    stats: { war: 76, int: 68, lead: 74, pol: 62, cha: 66 },
    level: 11,
    exp: 0,
    loyalty: 92,
    unitType: 'archer',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#3a5a8a' }
  },
  {
    id: 'dian_wei',
    name: '典韦',
    faction: 'cao_cao',
    stats: { war: 97, int: 22, lead: 68, pol: 14, cha: 58 },
    level: 14,
    exp: 0,
    loyalty: 99,
    unitType: 'spear',
    skills: ['wuquzhijian', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#2a2a3a' }
  },
  {
    id: 'xu_chu',
    name: '许褚',
    faction: 'cao_cao',
    stats: { war: 96, int: 20, lead: 65, pol: 12, cha: 52 },
    level: 14,
    exp: 0,
    loyalty: 98,
    unitType: 'spear',
    skills: ['tianbengdilie', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#3a3a4a' }
  },
  {
    id: 'zhang_liao_cc',
    name: '张辽',
    faction: 'cao_cao',
    stats: { war: 92, int: 72, lead: 89, pol: 52, cha: 78 },
    level: 16,
    exp: 0,
    loyalty: 95,
    unitType: 'cavalry',
    skills: ['wuquzhijian', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'square', armor: 'heavy', color: '#1a3a6b' }
  },

  // ============================================================
  // 刘备方 (Liu Bei's Faction)
  // ============================================================
  {
    id: 'liu_bei',
    name: '刘备',
    faction: 'liu_bei',
    stats: { war: 65, int: 72, lead: 78, pol: 80, cha: 99 },
    level: 16,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['luoshi', 'guwu', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#6b8e23' }
  },
  {
    id: 'guan_yu',
    name: '关羽',
    faction: 'liu_bei',
    stats: { war: 97, int: 70, lead: 92, pol: 55, cha: 93 },
    level: 17,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['wushuangluanwu', 'pojunxing', 'xuanfengzhan'],
    portrait: { hair: 'long', face: 'long', armor: 'heavy', color: '#228b22' }
  },
  {
    id: 'zhang_fei',
    name: '张飞',
    faction: 'liu_bei',
    stats: { war: 98, int: 36, lead: 82, pol: 18, cha: 60 },
    level: 16,
    exp: 0,
    loyalty: 100,
    unitType: 'spear',
    skills: ['wushuangluanwu', 'leishenji', 'lianhuanzhan'],
    portrait: { hair: 'wild', face: 'round', armor: 'heavy', color: '#2e5a1e' }
  },
  {
    id: 'zhao_yun',
    name: '赵云',
    faction: 'liu_bei',
    stats: { war: 96, int: 68, lead: 88, pol: 58, cha: 85 },
    level: 16,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['tianbengdilie', 'hengsaoqianjun', 'liehuozhan'],
    portrait: { hair: 'bun', face: 'square', armor: 'heavy', color: '#c0c0c0' }
  },
  {
    id: 'zhuge_liang',
    name: '诸葛亮',
    faction: 'liu_bei',
    stats: { war: 32, int: 100, lead: 95, pol: 96, cha: 92 },
    level: 18,
    exp: 0,
    loyalty: 100,
    unitType: 'archer',
    skills: ['yunshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#f5f5dc' }
  },
  {
    id: 'huang_zhong',
    name: '黄忠',
    faction: 'liu_bei',
    stats: { war: 92, int: 42, lead: 74, pol: 32, cha: 62 },
    level: 14,
    exp: 0,
    loyalty: 90,
    unitType: 'archer',
    skills: ['tianbengdilie', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'bald', face: 'square', armor: 'heavy', color: '#8b7d3c' }
  },
  {
    id: 'ma_chao',
    name: '马超',
    faction: 'liu_bei',
    stats: { war: 96, int: 40, lead: 82, pol: 28, cha: 72 },
    level: 15,
    exp: 0,
    loyalty: 85,
    unitType: 'cavalry',
    skills: ['tianbengdilie', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'long', face: 'square', armor: 'heavy', color: '#e0e0e0' }
  },
  {
    id: 'wei_yan',
    name: '魏延',
    faction: 'liu_bei',
    stats: { war: 90, int: 52, lead: 78, pol: 28, cha: 42 },
    level: 13,
    exp: 0,
    loyalty: 80,
    unitType: 'spear',
    skills: ['tianbengdilie', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#4a6b3a' }
  },
  {
    id: 'pang_tong',
    name: '庞统',
    faction: 'liu_bei',
    stats: { war: 28, int: 96, lead: 80, pol: 82, cha: 52 },
    level: 15,
    exp: 0,
    loyalty: 92,
    unitType: 'archer',
    skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#8b6914' }
  },
  {
    id: 'fa_zheng',
    name: '法正',
    faction: 'liu_bei',
    stats: { war: 22, int: 92, lead: 58, pol: 88, cha: 60 },
    level: 13,
    exp: 0,
    loyalty: 90,
    unitType: 'archer',
    skills: ['qixinglianzhu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#6b8e23' }
  },
  {
    id: 'jiang_wan',
    name: '蒋琬',
    faction: 'liu_bei',
    stats: { war: 24, int: 78, lead: 62, pol: 90, cha: 80 },
    level: 10,
    exp: 0,
    loyalty: 93,
    unitType: 'infantry',
    skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#556b2f' }
  },
  {
    id: 'ma_su',
    name: '马谡',
    faction: 'liu_bei',
    stats: { war: 38, int: 75, lead: 42, pol: 68, cha: 55 },
    level: 8,
    exp: 0,
    loyalty: 88,
    unitType: 'infantry',
    skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'light', color: '#6b8e23' }
  },

  // ============================================================
  // 孙权方 (Sun Quan's Faction)
  // ============================================================
  {
    id: 'sun_quan',
    name: '孙权',
    faction: 'sun_quan',
    stats: { war: 62, int: 80, lead: 82, pol: 88, cha: 90 },
    level: 15,
    exp: 0,
    loyalty: 100,
    unitType: 'infantry',
    skills: ['shuilongjuan', 'luoshi', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'square', armor: 'medium', color: '#b22222' }
  },
  {
    id: 'zhou_yu_sq',
    name: '周瑜',
    faction: 'sun_quan',
    stats: { war: 68, int: 96, lead: 94, pol: 80, cha: 92 },
    level: 17,
    exp: 0,
    loyalty: 95,
    unitType: 'archer',
    skills: ['qixinglianzhu', 'huoji', 'huichunshu'],
    portrait: { hair: 'long', face: 'thin', armor: 'medium', color: '#c41e3a' }
  },
  {
    id: 'lu_su',
    name: '鲁肃',
    faction: 'sun_quan',
    stats: { war: 38, int: 88, lead: 72, pol: 92, cha: 85 },
    level: 14,
    exp: 0,
    loyalty: 94,
    unitType: 'archer',
    skills: ['huoji', 'bingdongshu', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#a52a2a' }
  },
  {
    id: 'lv_meng',
    name: '吕蒙',
    faction: 'sun_quan',
    stats: { war: 78, int: 82, lead: 84, pol: 62, cha: 68 },
    level: 14,
    exp: 0,
    loyalty: 95,
    unitType: 'infantry',
    skills: ['xuanfengzhan', 'bingdongshu', 'tiebi'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#b22222' }
  },
  {
    id: 'gan_ning',
    name: '甘宁',
    faction: 'sun_quan',
    stats: { war: 92, int: 42, lead: 76, pol: 22, cha: 55 },
    level: 13,
    exp: 0,
    loyalty: 85,
    unitType: 'spear',
    skills: ['feilongzaitian', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'wild', face: 'square', armor: 'medium', color: '#8b0000' }
  },
  {
    id: 'huang_gai',
    name: '黄盖',
    faction: 'sun_quan',
    stats: { war: 80, int: 58, lead: 72, pol: 42, cha: 65 },
    level: 12,
    exp: 0,
    loyalty: 96,
    unitType: 'spear',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'bald', face: 'square', armor: 'heavy', color: '#a52a2a' }
  },
  {
    id: 'cheng_pu',
    name: '程普',
    faction: 'sun_quan',
    stats: { war: 78, int: 55, lead: 74, pol: 48, cha: 68 },
    level: 12,
    exp: 0,
    loyalty: 95,
    unitType: 'infantry',
    skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'heavy', color: '#a52a2a' }
  },
  {
    id: 'zhou_tai',
    name: '周泰',
    faction: 'sun_quan',
    stats: { war: 88, int: 32, lead: 70, pol: 18, cha: 52 },
    level: 12,
    exp: 0,
    loyalty: 98,
    unitType: 'spear',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#8b0000' }
  },
  {
    id: 'taishi_ci',
    name: '太史慈',
    faction: 'sun_quan',
    stats: { war: 92, int: 48, lead: 78, pol: 32, cha: 72 },
    level: 14,
    exp: 0,
    loyalty: 90,
    unitType: 'archer',
    skills: ['wushuangluanwu', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'heavy', color: '#c41e3a' }
  },
  {
    id: 'ling_tong',
    name: '凌统',
    faction: 'sun_quan',
    stats: { war: 85, int: 48, lead: 72, pol: 35, cha: 60 },
    level: 11,
    exp: 0,
    loyalty: 92,
    unitType: 'spear',
    skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'long', face: 'thin', armor: 'medium', color: '#b22222' }
  },
  {
    id: 'xu_sheng',
    name: '徐盛',
    faction: 'sun_quan',
    stats: { war: 78, int: 58, lead: 72, pol: 40, cha: 55 },
    level: 10,
    exp: 0,
    loyalty: 90,
    unitType: 'archer',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#a52a2a' }
  },
  {
    id: 'ding_feng',
    name: '丁奉',
    faction: 'sun_quan',
    stats: { war: 82, int: 52, lead: 70, pol: 38, cha: 58 },
    level: 10,
    exp: 0,
    loyalty: 91,
    unitType: 'infantry',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#c41e3a' }
  },

  // ============================================================
  // 袁绍方 (Yuan Shao's Faction)
  // ============================================================
  {
    id: 'yuan_shao',
    name: '袁绍',
    faction: 'yuan_shao',
    stats: { war: 52, int: 62, lead: 72, pol: 70, cha: 85 },
    level: 15,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'],
    portrait: { hair: 'bun', face: 'round', armor: 'heavy', color: '#daa520' }
  },
  {
    id: 'yan_liang',
    name: '颜良',
    faction: 'yuan_shao',
    stats: { war: 93, int: 28, lead: 72, pol: 18, cha: 48 },
    level: 13,
    exp: 0,
    loyalty: 92,
    unitType: 'cavalry',
    skills: ['tianbengdilie', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#b8860b' }
  },
  {
    id: 'wen_chou',
    name: '文丑',
    faction: 'yuan_shao',
    stats: { war: 92, int: 26, lead: 70, pol: 16, cha: 45 },
    level: 13,
    exp: 0,
    loyalty: 92,
    unitType: 'cavalry',
    skills: ['tianbengdilie', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'wild', face: 'round', armor: 'heavy', color: '#b8860b' }
  },
  {
    id: 'gao_lan',
    name: '高览',
    faction: 'yuan_shao',
    stats: { war: 82, int: 40, lead: 72, pol: 28, cha: 48 },
    level: 11,
    exp: 0,
    loyalty: 80,
    unitType: 'spear',
    skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#cd950c' }
  },
  {
    id: 'ju_shou',
    name: '沮授',
    faction: 'yuan_shao',
    stats: { war: 32, int: 90, lead: 72, pol: 86, cha: 75 },
    level: 14,
    exp: 0,
    loyalty: 94,
    unitType: 'archer',
    skills: ['yunshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#c4a000' }
  },
  {
    id: 'tian_feng',
    name: '田丰',
    faction: 'yuan_shao',
    stats: { war: 28, int: 92, lead: 68, pol: 88, cha: 72 },
    level: 14,
    exp: 0,
    loyalty: 95,
    unitType: 'archer',
    skills: ['yunshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#c4a000' }
  },
  // ============================================================
  // 吕布方 (Lv Bu's Faction)
  // ============================================================
  {
    id: 'lv_bu',
    name: '吕布',
    faction: 'lv_bu',
    stats: { war: 100, int: 30, lead: 72, pol: 14, cha: 40 },
    level: 18,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['wuquzhijian', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'long', face: 'square', armor: 'heavy', color: '#800080' }
  },
  {
    id: 'chen_gong',
    name: '陈宫',
    faction: 'lv_bu',
    stats: { war: 32, int: 88, lead: 68, pol: 80, cha: 62 },
    level: 13,
    exp: 0,
    loyalty: 90,
    unitType: 'archer',
    skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#6a0dad' }
  },
  {
    id: 'gao_shun',
    name: '高顺',
    faction: 'lv_bu',
    stats: { war: 82, int: 58, lead: 85, pol: 42, cha: 60 },
    level: 13,
    exp: 0,
    loyalty: 98,
    unitType: 'spear',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#4b0082' }
  },

  // ============================================================
  // 董卓方 (Dong Zhuo's Faction)
  // ============================================================
  {
    id: 'dong_zhuo',
    name: '董卓',
    faction: 'dong_zhuo',
    stats: { war: 68, int: 42, lead: 62, pol: 30, cha: 20 },
    level: 14,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['longjuanfeng', 'menghuchong', 'huichunshu'],
    portrait: { hair: 'bald', face: 'round', armor: 'heavy', color: '#4a0000' }
  },
  {
    id: 'li_jue',
    name: '李傕',
    faction: 'dong_zhuo',
    stats: { war: 78, int: 38, lead: 62, pol: 18, cha: 16 },
    level: 10,
    exp: 0,
    loyalty: 88,
    unitType: 'cavalry',
    skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'thin', armor: 'medium', color: '#5c0000' }
  },
  {
    id: 'guo_si',
    name: '郭汜',
    faction: 'dong_zhuo',
    stats: { war: 76, int: 32, lead: 58, pol: 14, cha: 14 },
    level: 9,
    exp: 0,
    loyalty: 86,
    unitType: 'spear',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'thin', armor: 'medium', color: '#5c0000' }
  },
  {
    id: 'hua_xiong',
    name: '华雄',
    faction: 'dong_zhuo',
    stats: { war: 88, int: 28, lead: 65, pol: 15, cha: 32 },
    level: 12,
    exp: 0,
    loyalty: 90,
    unitType: 'cavalry',
    skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#4a0000' }
  },

  // ============================================================
  // 刘表方 (Liu Biao's Faction)
  // ============================================================
  {
    id: 'liu_biao',
    name: '刘表',
    faction: 'liu_biao',
    stats: { war: 38, int: 68, lead: 55, pol: 82, cha: 78 },
    level: 13,
    exp: 0,
    loyalty: 100,
    unitType: 'infantry',
    skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#2f4f4f' }
  },
  {
    id: 'cai_mao',
    name: '蔡瑁',
    faction: 'liu_biao',
    stats: { war: 55, int: 62, lead: 60, pol: 68, cha: 45 },
    level: 10,
    exp: 0,
    loyalty: 85,
    unitType: 'archer',
    skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#3a6b5a' }
  },
  {
    id: 'huang_zu',
    name: '黄祖',
    faction: 'liu_biao',
    stats: { war: 58, int: 42, lead: 55, pol: 45, cha: 38 },
    level: 9,
    exp: 0,
    loyalty: 88,
    unitType: 'archer',
    skills: ['menghuchong', 'huichunshu', 'luoshi'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#2f4f4f' }
  },
  {
    id: 'wen_pin',
    name: '文聘',
    faction: 'liu_biao',
    stats: { war: 80, int: 52, lead: 72, pol: 42, cha: 62 },
    level: 11,
    exp: 0,
    loyalty: 92,
    unitType: 'spear',
    skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#4a6b5a' }
  },
  {
    id: 'kuai_liang',
    name: '蒯良',
    faction: 'liu_biao',
    stats: { war: 22, int: 80, lead: 52, pol: 85, cha: 72 },
    level: 11,
    exp: 0,
    loyalty: 90,
    unitType: 'infantry',
    skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#3a6b5a' }
  },

  // ============================================================
  // 孙策方 (Sun Ce's Faction)
  // ============================================================
  {
    id: 'sun_ce',
    name: '孙策',
    faction: 'sun_ce',
    stats: { war: 92, int: 68, lead: 88, pol: 62, cha: 90 },
    level: 16,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['wushuangluanwu', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'long', face: 'square', armor: 'heavy', color: '#dc143c' }
  },
  {
    id: 'jiang_qin',
    name: '蒋钦',
    faction: 'sun_ce',
    stats: { war: 78, int: 42, lead: 68, pol: 32, cha: 52 },
    level: 10,
    exp: 0,
    loyalty: 92,
    unitType: 'archer',
    skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#b22222' }
  },
  {
    id: 'chen_wu',
    name: '陈武',
    faction: 'sun_ce',
    stats: { war: 80, int: 35, lead: 65, pol: 25, cha: 50 },
    level: 10,
    exp: 0,
    loyalty: 93,
    unitType: 'spear',
    skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#dc143c' }
  },

  // ============================================================
  // 在野 (Unaffiliated / Independent)
  // ============================================================
  {
    id: 'pang_de',
    name: '庞德',
    faction: 'ma_teng',
    stats: { war: 92, int: 38, lead: 72, pol: 22, cha: 55 },
    level: 13,
    exp: 0,
    loyalty: 0,
    unitType: 'cavalry',
    skills: ['feilongzaitian', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#696969' }
  },
  {
    id: 'zhang_ren',
    name: '张任',
    faction: 'liu_zhang',
    stats: { war: 82, int: 55, lead: 74, pol: 40, cha: 58 },
    level: 11,
    exp: 0,
    loyalty: 0,
    unitType: 'archer',
    skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#808080' }
  },
  {
    id: 'yan_yan',
    name: '严颜',
    faction: 'liu_zhang',
    stats: { war: 80, int: 52, lead: 70, pol: 45, cha: 68 },
    level: 11,
    exp: 0,
    loyalty: 0,
    unitType: 'spear',
    skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'bald', face: 'round', armor: 'heavy', color: '#708090' }
  },
  {
    id: 'lu_xun',
    name: '陆逊',
    faction: 'sun_quan',
    stats: { war: 58, int: 94, lead: 90, pol: 85, cha: 80 },
    level: 13,
    exp: 0,
    loyalty: 0,
    unitType: 'archer',
    skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'long', face: 'thin', armor: 'light', color: '#c0c0c0' }
  },
  // ============================================================
  // 项羽方 (Xiang Yu's Faction)
  // ============================================================
  {
    id: 'xiang_yu',
    name: '项羽',
    faction: 'xiang_yu',
    stats: { war: 101, int: 38, lead: 88, pol: 18, cha: 78 },
    level: 20,
    exp: 0,
    loyalty: 100,
    unitType: 'cavalry',
    skills: ['bawangxiejia', 'pofujinzhou', 'lishansqb'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#8b0000' }
  },
  {
    id: 'long_ju',
    name: '龙且',
    faction: 'xiang_yu',
    stats: { war: 92, int: 32, lead: 75, pol: 16, cha: 50 },
    level: 15,
    exp: 0,
    loyalty: 96,
    unitType: 'spear',
    skills: ['wushuangluanwu', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#a52a2a' }
  },
  {
    id: 'zhongli_mei',
    name: '钟离昧',
    faction: 'xiang_yu',
    stats: { war: 88, int: 45, lead: 78, pol: 30, cha: 55 },
    level: 14,
    exp: 0,
    loyalty: 94,
    unitType: 'spear',
    skills: ['leishenji', 'lianhuanzhan', 'jiasushu'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#8b4513' }
  },
  {
    id: 'fan_zeng',
    name: '范增',
    faction: 'xiang_yu',
    stats: { war: 28, int: 94, lead: 72, pol: 90, cha: 82 },
    level: 16,
    exp: 0,
    loyalty: 92,
    unitType: 'archer',
    skills: ['baofengxue', 'duwu', 'jiasushu'],
    portrait: { hair: 'bald', face: 'thin', armor: 'robe', color: '#4a3728' }
  },

  // ============================================================
  // 曹操方补充 (Cao Cao supplements)
  // ============================================================
  {
    id: 'jia_xu', name: '贾诩', faction: 'cao_cao',
    stats: { war: 30, int: 96, lead: 62, pol: 90, cha: 42 },
    level: 14, exp: 0, loyalty: 78, unitType: 'archer', skills: ['baofengxue', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#3a5070' }
  },
  {
    id: 'man_chong', name: '满宠', faction: 'cao_cao',
    stats: { war: 45, int: 82, lead: 70, pol: 85, cha: 60 },
    level: 11, exp: 0, loyalty: 93, unitType: 'infantry', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#3a5a8a' }
  },
  {
    id: 'cao_zhang', name: '曹彰', faction: 'cao_cao',
    stats: { war: 90, int: 32, lead: 72, pol: 22, cha: 55 },
    level: 10, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['bawangji', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'cao_pi', name: '曹丕', faction: 'cao_cao',
    stats: { war: 62, int: 80, lead: 75, pol: 88, cha: 72 },
    level: 12, exp: 0, loyalty: 96, unitType: 'infantry', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#2b4a7a' }
  },
  {
    id: 'xu_huang', name: '徐晃', faction: 'cao_cao',
    stats: { war: 90, int: 58, lead: 82, pol: 40, cha: 65 },
    level: 13, exp: 0, loyalty: 94, unitType: 'spear', skills: ['wuquzhijian', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2b4a7a' }
  },
  {
    id: 'zhang_he_cc', name: '张郃', faction: 'cao_cao',
    stats: { war: 86, int: 62, lead: 82, pol: 42, cha: 65 },
    level: 13, exp: 0, loyalty: 88, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'niu_jin', name: '牛金', faction: 'cao_cao',
    stats: { war: 76, int: 30, lead: 62, pol: 18, cha: 40 },
    level: 8, exp: 0, loyalty: 90, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'round', armor: 'heavy', color: '#2b4a7a' }
  },
  {
    id: 'zang_ba', name: '臧霸', faction: 'cao_cao',
    stats: { war: 80, int: 42, lead: 70, pol: 30, cha: 50 },
    level: 10, exp: 0, loyalty: 85, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'medium', color: '#3a5a8a' }
  },

  // ============================================================
  // 刘备方补充 (Liu Bei supplements)
  // ============================================================
  {
    id: 'guan_suo', name: '关索', faction: 'liu_bei',
    stats: { war: 82, int: 45, lead: 65, pol: 30, cha: 70 },
    level: 8, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'long', face: 'long', armor: 'heavy', color: '#228b22' }
  },
  {
    id: 'li_yan', name: '李严', faction: 'liu_bei',
    stats: { war: 68, int: 72, lead: 75, pol: 78, cha: 55 },
    level: 11, exp: 0, loyalty: 82, unitType: 'spear', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#556b2f' }
  },
  {
    id: 'ma_liang', name: '马良', faction: 'liu_bei',
    stats: { war: 22, int: 85, lead: 55, pol: 88, cha: 80 },
    level: 10, exp: 0, loyalty: 92, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#6b8e23' }
  },
  {
    id: 'fei_yi', name: '费祎', faction: 'liu_bei',
    stats: { war: 25, int: 82, lead: 60, pol: 90, cha: 82 },
    level: 10, exp: 0, loyalty: 93, unitType: 'infantry', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#556b2f' }
  },
  {
    id: 'wu_ban', name: '吴班', faction: 'liu_bei',
    stats: { war: 72, int: 40, lead: 62, pol: 30, cha: 48 },
    level: 8, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#4a6b3a' }
  },
  {
    id: 'mi_zhu', name: '糜竺', faction: 'liu_bei',
    stats: { war: 18, int: 62, lead: 42, pol: 85, cha: 78 },
    level: 9, exp: 0, loyalty: 95, unitType: 'infantry', skills: ['bingdongshu', 'shiqitisheng', 'huichunshu'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#6b8e23' }
  },

  // ============================================================
  // 孙权方补充 (Sun Quan supplements)
  // ============================================================
  {
    id: 'zhu_ran', name: '朱然', faction: 'sun_quan',
    stats: { war: 78, int: 62, lead: 75, pol: 48, cha: 60 },
    level: 10, exp: 0, loyalty: 92, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#b22222' }
  },
  {
    id: 'bu_zhi', name: '步骘', faction: 'sun_quan',
    stats: { war: 30, int: 78, lead: 58, pol: 85, cha: 72 },
    level: 10, exp: 0, loyalty: 90, unitType: 'infantry', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#a52a2a' }
  },
  {
    id: 'pan_zhang', name: '潘璋', faction: 'sun_quan',
    stats: { war: 80, int: 35, lead: 65, pol: 20, cha: 38 },
    level: 9, exp: 0, loyalty: 85, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#8b0000' }
  },
  {
    id: 'he_qi', name: '贺齐', faction: 'sun_quan',
    stats: { war: 78, int: 55, lead: 72, pol: 42, cha: 55 },
    level: 10, exp: 0, loyalty: 90, unitType: 'archer', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#c41e3a' }
  },
  {
    id: 'zhu_huan', name: '朱桓', faction: 'sun_quan',
    stats: { war: 82, int: 58, lead: 72, pol: 38, cha: 55 },
    level: 10, exp: 0, loyalty: 88, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#b22222' }
  },

  // ============================================================
  // 袁绍方补充 (Yuan Shao supplements)
  // ============================================================
  {
    id: 'chunyu_qiong', name: '淳于琼', faction: 'yuan_shao',
    stats: { war: 62, int: 28, lead: 52, pol: 22, cha: 30 },
    level: 9, exp: 0, loyalty: 85, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'bald', face: 'round', armor: 'medium', color: '#b8860b' }
  },
  {
    id: 'feng_ji', name: '逢纪', faction: 'yuan_shao',
    stats: { war: 20, int: 72, lead: 48, pol: 75, cha: 45 },
    level: 9, exp: 0, loyalty: 88, unitType: 'infantry', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#c4a000' }
  },
  {
    id: 'xin_ping', name: '辛评', faction: 'yuan_shao',
    stats: { war: 22, int: 70, lead: 45, pol: 72, cha: 50 },
    level: 8, exp: 0, loyalty: 86, unitType: 'infantry', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#daa520' }
  },
  {
    id: 'yuan_tan', name: '袁谭', faction: 'yuan_shao',
    stats: { war: 55, int: 48, lead: 52, pol: 45, cha: 50 },
    level: 8, exp: 0, loyalty: 90, unitType: 'cavalry', skills: ['menghuchong', 'huichunshu', 'luoshi'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#cd950c' }
  },

  // ============================================================
  // 董卓方补充 (Dong Zhuo supplements)
  // ============================================================
  {
    id: 'zhang_ji_dz', name: '张济', faction: 'dong_zhuo',
    stats: { war: 72, int: 35, lead: 58, pol: 20, cha: 28 },
    level: 9, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'thin', armor: 'medium', color: '#5c0000' }
  },
  {
    id: 'niu_fu', name: '牛辅', faction: 'dong_zhuo',
    stats: { war: 68, int: 25, lead: 50, pol: 12, cha: 18 },
    level: 8, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'round', armor: 'medium', color: '#4a0000' }
  },
  {
    id: 'xu_rong', name: '徐荣', faction: 'dong_zhuo',
    stats: { war: 78, int: 55, lead: 72, pol: 32, cha: 40 },
    level: 10, exp: 0, loyalty: 82, unitType: 'infantry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#5c0000' }
  },

  // ============================================================
  // 刘表方补充 (Liu Biao supplements)
  // ============================================================
  {
    id: 'liu_qi', name: '刘琦', faction: 'liu_biao',
    stats: { war: 35, int: 52, lead: 42, pol: 55, cha: 62 },
    level: 7, exp: 0, loyalty: 92, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'light', color: '#2f4f4f' }
  },
  {
    id: 'wang_wei', name: '王威', faction: 'liu_biao',
    stats: { war: 72, int: 50, lead: 62, pol: 38, cha: 45 },
    level: 9, exp: 0, loyalty: 88, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#4a6b5a' }
  },
  {
    id: 'yi_ji', name: '伊籍', faction: 'liu_biao',
    stats: { war: 18, int: 72, lead: 45, pol: 82, cha: 78 },
    level: 9, exp: 0, loyalty: 85, unitType: 'infantry', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#3a6b5a' }
  },

  // ============================================================
  // 孙策方补充 (Sun Ce supplements)
  // ============================================================
  {
    id: 'han_dang', name: '韩当', faction: 'sun_ce',
    stats: { war: 78, int: 48, lead: 70, pol: 35, cha: 55 },
    level: 11, exp: 0, loyalty: 93, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#dc143c' }
  },
  {
    id: 'zhu_zhi', name: '朱治', faction: 'sun_ce',
    stats: { war: 65, int: 62, lead: 68, pol: 72, cha: 65 },
    level: 10, exp: 0, loyalty: 92, unitType: 'infantry', skills: ['menghuchong', 'huichunshu', 'luoshi'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#b22222' }
  },
  {
    id: 'lv_fan', name: '吕范', faction: 'sun_ce',
    stats: { war: 52, int: 70, lead: 62, pol: 78, cha: 65 },
    level: 10, exp: 0, loyalty: 90, unitType: 'infantry', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#dc143c' }
  },

  // ============================================================
  // 马腾方 (Ma Teng's Faction)
  // ============================================================
  {
    id: 'ma_teng', name: '马腾', faction: 'ma_teng',
    stats: { war: 82, int: 52, lead: 78, pol: 55, cha: 72 },
    level: 14, exp: 0, loyalty: 100, unitType: 'cavalry', skills: ['pojunxing', 'xuanfengzhan', 'fangyuqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#8b6914' }
  },
  {
    id: 'ma_dai', name: '马岱', faction: 'ma_teng',
    stats: { war: 78, int: 45, lead: 65, pol: 32, cha: 55 },
    level: 10, exp: 0, loyalty: 92, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#a0824a' }
  },
  {
    id: 'ma_xiu', name: '马休', faction: 'ma_teng',
    stats: { war: 68, int: 35, lead: 55, pol: 25, cha: 48 },
    level: 8, exp: 0, loyalty: 90, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#a0824a' }
  },

  // ============================================================
  // 袁术方 (Yuan Shu's Faction)
  // ============================================================
  {
    id: 'yuan_shu', name: '袁术', faction: 'yuan_shu',
    stats: { war: 42, int: 55, lead: 50, pol: 62, cha: 58 },
    level: 12, exp: 0, loyalty: 100, unitType: 'infantry', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'bun', face: 'round', armor: 'heavy', color: '#6a3a8a' }
  },
  {
    id: 'ji_ling', name: '纪灵', faction: 'yuan_shu',
    stats: { war: 82, int: 32, lead: 62, pol: 18, cha: 35 },
    level: 11, exp: 0, loyalty: 90, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#7a4a9a' }
  },
  {
    id: 'zhang_xun_ys', name: '张勋', faction: 'yuan_shu',
    stats: { war: 72, int: 38, lead: 58, pol: 25, cha: 35 },
    level: 9, exp: 0, loyalty: 85, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#7a4a9a' }
  },
  {
    id: 'yang_feng', name: '杨奉', faction: 'yuan_shu',
    stats: { war: 70, int: 35, lead: 55, pol: 20, cha: 30 },
    level: 8, exp: 0, loyalty: 78, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'thin', armor: 'medium', color: '#6a3a8a' }
  },

  // ============================================================
  // 公孙瓒方 (Gongsun Zan's Faction)
  // ============================================================
  {
    id: 'gongsun_zan', name: '公孙瓒', faction: 'gongsun_zan',
    stats: { war: 78, int: 48, lead: 72, pol: 42, cha: 65 },
    level: 13, exp: 0, loyalty: 100, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'square', armor: 'heavy', color: '#c0c0c0' }
  },
  {
    id: 'tian_yu', name: '田豫', faction: 'gongsun_zan',
    stats: { war: 75, int: 62, lead: 72, pol: 55, cha: 58 },
    level: 10, exp: 0, loyalty: 88, unitType: 'infantry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#b0b0b0' }
  },
  {
    id: 'yan_gang', name: '严纲', faction: 'gongsun_zan',
    stats: { war: 72, int: 32, lead: 58, pol: 20, cha: 40 },
    level: 9, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#a0a0a0' }
  },

  // ============================================================
  // 刘璋方 (Liu Zhang's Faction)
  // ============================================================
  {
    id: 'liu_zhang', name: '刘璋', faction: 'liu_zhang',
    stats: { war: 28, int: 50, lead: 35, pol: 55, cha: 58 },
    level: 10, exp: 0, loyalty: 100, unitType: 'infantry', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#4a8a6a' }
  },
  {
    id: 'wu_yi', name: '吴懿', faction: 'liu_zhang',
    stats: { war: 72, int: 52, lead: 65, pol: 48, cha: 55 },
    level: 10, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#5a9a7a' }
  },
  {
    id: 'huang_quan', name: '黄权', faction: 'liu_zhang',
    stats: { war: 42, int: 78, lead: 68, pol: 80, cha: 65 },
    level: 11, exp: 0, loyalty: 88, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#4a8a6a' }
  },

  // ============================================================
  // 孟获方 (Meng Huo's Faction)
  // ============================================================
  {
    id: 'meng_huo', name: '孟获', faction: 'meng_huo',
    stats: { war: 88, int: 28, lead: 65, pol: 15, cha: 72 },
    level: 13, exp: 0, loyalty: 100, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#8b4513' }
  },
  {
    id: 'zhu_rong', name: '祝融', faction: 'meng_huo',
    stats: { war: 82, int: 42, lead: 58, pol: 20, cha: 78 },
    level: 11, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'long', face: 'round', armor: 'medium', color: '#cc5500' }
  },
  {
    id: 'dailai_dongzhu', name: '带来洞主', faction: 'meng_huo',
    stats: { war: 78, int: 22, lead: 52, pol: 10, cha: 35 },
    level: 9, exp: 0, loyalty: 85, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'round', armor: 'light', color: '#8b6914' }
  },
  {
    id: 'wu_tugu', name: '兀突骨', faction: 'meng_huo',
    stats: { war: 90, int: 15, lead: 48, pol: 5, cha: 30 },
    level: 10, exp: 0, loyalty: 82, unitType: 'spear', skills: ['bawangji', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#5a3a1a' }
  },

  // ============================================================
  // 新增在野 (New Unaffiliated)
  // ============================================================
  {
    id: 'sima_zhao', name: '司马昭', faction: 'none',
    stats: { war: 52, int: 88, lead: 78, pol: 90, cha: 55 },
    level: 11, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'luoyang',
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#5a5a7a' }
  },
  {
    id: 'zhuge_dan', name: '诸葛诞', faction: 'none',
    stats: { war: 68, int: 72, lead: 70, pol: 62, cha: 50 },
    level: 10, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'], homeCity: 'shouchun',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#6a6a8a' }
  },
  {
    id: 'wen_yang', name: '文鸯', faction: 'none',
    stats: { war: 90, int: 42, lead: 72, pol: 28, cha: 58 },
    level: 10, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['tianbengdilie', 'pojunxing', 'gongjiqianghua'], homeCity: 'shouchun',
    portrait: { hair: 'long', face: 'square', armor: 'heavy', color: '#808080' }
  },
  {
    id: 'zhuge_ke', name: '诸葛恪', faction: 'none',
    stats: { war: 52, int: 85, lead: 72, pol: 68, cha: 45 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'], homeCity: 'jianye',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#a0a0c0' }
  },
  {
    id: 'liu_feng', name: '刘封', faction: 'none',
    stats: { war: 78, int: 42, lead: 62, pol: 30, cha: 48 },
    level: 9, exp: 0, loyalty: 0, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'shangyong',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#5a8a5a' }
  },
  {
    id: 'chen_deng', name: '陈登', faction: 'none',
    stats: { war: 52, int: 82, lead: 68, pol: 78, cha: 65 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'xiapi',
    portrait: { hair: 'bun', face: 'thin', armor: 'light', color: '#808080' }
  },
  {
    id: 'tao_qian', name: '陶谦', faction: 'tao_qian',
    stats: { war: 32, int: 65, lead: 60, pol: 78, cha: 82 },
    level: 11, exp: 0, loyalty: 85, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#4a7788' }
  },
  {
    id: 'kong_rong', name: '孔融', faction: 'kong_rong',
    stats: { war: 18, int: 85, lead: 48, pol: 90, cha: 92 },
    level: 12, exp: 0, loyalty: 90, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#bb9922' }
  },
  {
    id: 'huangfu_song', name: '皇甫嵩', faction: 'none',
    stats: { war: 78, int: 72, lead: 85, pol: 65, cha: 72 },
    level: 13, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['lianhuanzhan', 'luoshi', 'shiqitisheng'], homeCity: 'changan',
    portrait: { hair: 'bun', face: 'square', armor: 'heavy', color: '#8a8a6a' }
  },
  {
    id: 'zhu_jun', name: '朱儁', faction: 'none',
    stats: { war: 72, int: 68, lead: 78, pol: 62, cha: 65 },
    level: 12, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'], homeCity: 'luoyang',
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#8a8a6a' }
  },
  {
    id: 'han_xuan', name: '韩玄', faction: 'none',
    stats: { war: 32, int: 42, lead: 38, pol: 52, cha: 35 },
    level: 7, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'], homeCity: 'changsha',
    portrait: { hair: 'bun', face: 'round', armor: 'light', color: '#808080' }
  },
  {
    id: 'shi_xie', name: '士燮', faction: 'shi_xie',
    stats: { war: 35, int: 80, lead: 68, pol: 85, cha: 82 },
    level: 13, exp: 0, loyalty: 88, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#338866' }
  },
  {
    id: 'han_sui', name: '韩遂', faction: 'han_sui',
    stats: { war: 65, int: 75, lead: 78, pol: 70, cha: 72 },
    level: 13, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#aa5522' }
  },

  // ============================================================
  // 曹操方 新增将领
  // ============================================================
  {
    id: 'wang_lang', name: '王朗', faction: 'cao_cao',
    stats: { war: 22, int: 82, lead: 55, pol: 88, cha: 78 },
    level: 12, exp: 0, loyalty: 88, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#4a6fa5' }
  },
  {
    id: 'chen_qun', name: '陈群', faction: 'cao_cao',
    stats: { war: 18, int: 88, lead: 52, pol: 95, cha: 82 },
    level: 12, exp: 0, loyalty: 90, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#3a5a8a' }
  },
  {
    id: 'hua_xin', name: '华歆', faction: 'cao_cao',
    stats: { war: 15, int: 85, lead: 48, pol: 92, cha: 80 },
    level: 13, exp: 0, loyalty: 85, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#5a6a9a' }
  },
  {
    id: 'cao_zhen', name: '曹真', faction: 'cao_cao',
    stats: { war: 80, int: 68, lead: 85, pol: 62, cha: 72 },
    level: 14, exp: 0, loyalty: 96, unitType: 'cavalry', skills: ['longjuanfeng', 'menghuchong', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'cao_xiu', name: '曹休', faction: 'cao_cao',
    stats: { war: 78, int: 62, lead: 80, pol: 55, cha: 68 },
    level: 13, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2a4a7a' }
  },
  {
    id: 'wang_chang', name: '王昶', faction: 'cao_cao',
    stats: { war: 72, int: 75, lead: 78, pol: 70, cha: 65 },
    level: 11, exp: 0, loyalty: 88, unitType: 'spear', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#3a5a8a' }
  },
  {
    id: 'guo_huai_cc', name: '郭淮', faction: 'cao_cao',
    stats: { war: 78, int: 80, lead: 82, pol: 65, cha: 62 },
    level: 13, exp: 0, loyalty: 90, unitType: 'archer', skills: ['lianhuanzhan', 'luoshi', 'shiqitisheng'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#2a4a7a' }
  },
  {
    id: 'xin_pi', name: '辛毗', faction: 'cao_cao',
    stats: { war: 32, int: 80, lead: 58, pol: 85, cha: 72 },
    level: 11, exp: 0, loyalty: 85, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#4a6fa5' }
  },
  {
    id: 'deng_ai', name: '邓艾', faction: 'cao_cao',
    stats: { war: 90, int: 88, lead: 92, pol: 72, cha: 65 },
    level: 15, exp: 0, loyalty: 90, unitType: 'infantry', skills: ['xuanfengzhan', 'bingdongshu', 'xunlei'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#1a3a6b' }
  },
  {
    id: 'zhong_hui', name: '钟会', faction: 'cao_cao',
    stats: { war: 72, int: 95, lead: 85, pol: 88, cha: 70 },
    level: 14, exp: 0, loyalty: 75, unitType: 'cavalry', skills: ['baofengxue', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#3a5a8a' }
  },
  {
    id: 'sima_yi_cc', name: '司马懿', faction: 'cao_cao',
    stats: { war: 58, int: 98, lead: 92, pol: 96, cha: 82 },
    level: 16, exp: 0, loyalty: 78, unitType: 'archer', skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#2a3a6a' }
  },

  // ============================================================
  // 刘备方 新增将领
  // ============================================================
  {
    id: 'chen_dao', name: '陈到', faction: 'liu_bei',
    stats: { war: 82, int: 55, lead: 78, pol: 38, cha: 60 },
    level: 12, exp: 0, loyalty: 98, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#3a7a3a' }
  },
  {
    id: 'huo_jun', name: '霍峻', faction: 'liu_bei',
    stats: { war: 75, int: 62, lead: 72, pol: 45, cha: 58 },
    level: 11, exp: 0, loyalty: 92, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#3a7a3a' }
  },
  {
    id: 'zhang_yi', name: '张嶷', faction: 'liu_bei',
    stats: { war: 80, int: 65, lead: 75, pol: 50, cha: 62 },
    level: 11, exp: 0, loyalty: 90, unitType: 'infantry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2a6a2a' }
  },
  {
    id: 'wang_ping', name: '王平', faction: 'liu_bei',
    stats: { war: 78, int: 70, lead: 80, pol: 55, cha: 65 },
    level: 12, exp: 0, loyalty: 95, unitType: 'infantry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#3a7a3a' }
  },
  {
    id: 'liao_hua', name: '廖化', faction: 'liu_bei',
    stats: { war: 72, int: 58, lead: 68, pol: 42, cha: 55 },
    level: 11, exp: 0, loyalty: 92, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'bun', face: 'square', armor: 'medium', color: '#2a6a2a' }
  },
  {
    id: 'xiang_chong', name: '向宠', faction: 'liu_bei',
    stats: { war: 75, int: 68, lead: 72, pol: 48, cha: 62 },
    level: 11, exp: 0, loyalty: 93, unitType: 'infantry', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#3a7a3a' }
  },
  {
    id: 'ju_fu', name: '句扶', faction: 'liu_bei',
    stats: { war: 82, int: 52, lead: 75, pol: 38, cha: 55 },
    level: 11, exp: 0, loyalty: 90, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2a6a2a' }
  },
  {
    id: 'zhang_wing', name: '张翼', faction: 'liu_bei',
    stats: { war: 75, int: 65, lead: 72, pol: 52, cha: 58 },
    level: 11, exp: 0, loyalty: 88, unitType: 'archer', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#3a7a3a' }
  },
  {
    id: 'jiang_wei', name: '姜维', faction: 'liu_bei',
    stats: { war: 92, int: 88, lead: 90, pol: 68, cha: 72 },
    level: 14, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['lianhuanzhan', 'luoshi', 'shiqitisheng'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#2a6a2a' }
  },
  {
    id: 'deng_zhi', name: '邓芝', faction: 'liu_bei',
    stats: { war: 55, int: 75, lead: 65, pol: 80, cha: 72 },
    level: 11, exp: 0, loyalty: 90, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#3a7a3a' }
  },

  // ============================================================
  // 孙权方 新增将领
  // ============================================================
  {
    id: 'zhuge_jin', name: '诸葛瑾', faction: 'sun_quan',
    stats: { war: 35, int: 82, lead: 65, pol: 88, cha: 82 },
    level: 12, exp: 0, loyalty: 90, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a3a3a' }
  },
  {
    id: 'gu_yong', name: '顾雍', faction: 'sun_quan',
    stats: { war: 18, int: 88, lead: 55, pol: 95, cha: 85 },
    level: 13, exp: 0, loyalty: 88, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#9a4a4a' }
  },
  {
    id: 'zhang_zhao', name: '张昭', faction: 'sun_quan',
    stats: { war: 22, int: 90, lead: 60, pol: 92, cha: 88 },
    level: 13, exp: 0, loyalty: 85, unitType: 'archer', skills: ['baofengxue', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#8a3a3a' }
  },
  {
    id: 'quan_cong', name: '全琮', faction: 'sun_quan',
    stats: { war: 75, int: 68, lead: 78, pol: 58, cha: 65 },
    level: 12, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['menghuchong', 'huichunshu', 'luoshi'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#aa4444' }
  },
  {
    id: 'lu_kai', name: '陆凯', faction: 'sun_quan',
    stats: { war: 68, int: 78, lead: 72, pol: 75, cha: 70 },
    level: 11, exp: 0, loyalty: 85, unitType: 'spear', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#9a4a4a' }
  },
  {
    id: 'lv_dai', name: '吕岱', faction: 'sun_quan',
    stats: { war: 72, int: 70, lead: 75, pol: 65, cha: 62 },
    level: 12, exp: 0, loyalty: 88, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#aa4444' }
  },
  {
    id: 'zhu_huan2', name: '朱异', faction: 'sun_quan',
    stats: { war: 70, int: 58, lead: 72, pol: 45, cha: 55 },
    level: 10, exp: 0, loyalty: 85, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#9a3a3a' }
  },
  {
    id: 'sun_shao', name: '孙邵', faction: 'sun_quan',
    stats: { war: 25, int: 80, lead: 55, pol: 88, cha: 78 },
    level: 11, exp: 0, loyalty: 85, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a3a3a' }
  },
  {
    id: 'cheng_bing', name: '程秉', faction: 'sun_quan',
    stats: { war: 20, int: 82, lead: 50, pol: 85, cha: 80 },
    level: 10, exp: 0, loyalty: 82, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a4a4a' }
  },
  {
    id: 'sun_yi', name: '孙翊', faction: 'sun_quan',
    stats: { war: 82, int: 52, lead: 70, pol: 42, cha: 65 },
    level: 11, exp: 0, loyalty: 90, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#aa4444' }
  },

  // ============================================================
  // 袁绍方 新增将领
  // ============================================================
  {
    id: 'yuan_shang', name: '袁尚', faction: 'yuan_shao',
    stats: { war: 62, int: 48, lead: 58, pol: 52, cha: 68 },
    level: 10, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#c8a840' }
  },
  {
    id: 'yuan_xi', name: '袁熙', faction: 'yuan_shao',
    stats: { war: 55, int: 52, lead: 55, pol: 50, cha: 60 },
    level: 9, exp: 0, loyalty: 90, unitType: 'cavalry', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#b89830' }
  },
  {
    id: 'gao_gan', name: '高干', faction: 'yuan_shao',
    stats: { war: 70, int: 58, lead: 68, pol: 55, cha: 60 },
    level: 11, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#c8a840' }
  },
  {
    id: 'qu_yi', name: '麹义', faction: 'yuan_shao',
    stats: { war: 85, int: 52, lead: 78, pol: 35, cha: 45 },
    level: 12, exp: 0, loyalty: 72, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#a88830' }
  },
  {
    id: 'shen_pei', name: '审配', faction: 'yuan_shao',
    stats: { war: 45, int: 80, lead: 68, pol: 82, cha: 65 },
    level: 12, exp: 0, loyalty: 90, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'square', armor: 'medium', color: '#b89830' }
  },
  {
    id: 'guo_tu', name: '郭图', faction: 'yuan_shao',
    stats: { war: 28, int: 72, lead: 52, pol: 78, cha: 58 },
    level: 10, exp: 0, loyalty: 78, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#c8a840' }
  },
  {
    id: 'zhang_he_ys2', name: '蒋奇', faction: 'yuan_shao',
    stats: { war: 72, int: 48, lead: 68, pol: 38, cha: 50 },
    level: 10, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#b89830' }
  },
  {
    id: 'han_meng', name: '韩猛', faction: 'yuan_shao',
    stats: { war: 78, int: 35, lead: 65, pol: 28, cha: 42 },
    level: 10, exp: 0, loyalty: 82, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#a88830' }
  },

  // ============================================================
  // 项羽方 新增将领
  // ============================================================
  {
    id: 'ji_bu', name: '季布', faction: 'xiang_yu',
    stats: { war: 88, int: 58, lead: 80, pol: 42, cha: 65 },
    level: 13, exp: 0, loyalty: 95, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a0000' }
  },
  {
    id: 'huan_chu', name: '桓楚', faction: 'xiang_yu',
    stats: { war: 85, int: 45, lead: 72, pol: 32, cha: 52 },
    level: 12, exp: 0, loyalty: 90, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#8b0000' }
  },
  {
    id: 'ying_bu', name: '英布', faction: 'xiang_yu',
    stats: { war: 92, int: 55, lead: 82, pol: 38, cha: 58 },
    level: 14, exp: 0, loyalty: 78, unitType: 'cavalry', skills: ['feilongzaitian', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a1010' }
  },
  {
    id: 'yu_ziqi', name: '虞子期', faction: 'xiang_yu',
    stats: { war: 82, int: 48, lead: 75, pol: 35, cha: 55 },
    level: 12, exp: 0, loyalty: 98, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#8b0000' }
  },
  {
    id: 'zhongli_mo', name: '钟离眛', faction: 'xiang_yu',
    stats: { war: 85, int: 62, lead: 80, pol: 45, cha: 60 },
    level: 13, exp: 0, loyalty: 95, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a0000' }
  },
  {
    id: 'zhou_yin', name: '周殷', faction: 'xiang_yu',
    stats: { war: 72, int: 65, lead: 70, pol: 55, cha: 58 },
    level: 11, exp: 0, loyalty: 80, unitType: 'cavalry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8b1010' }
  },
  {
    id: 'ding_gong', name: '丁公', faction: 'xiang_yu',
    stats: { war: 75, int: 42, lead: 68, pol: 32, cha: 45 },
    level: 11, exp: 0, loyalty: 72, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'heavy', color: '#7a0000' }
  },
  {
    id: 'xue_gong', name: '薛公', faction: 'xiang_yu',
    stats: { war: 55, int: 72, lead: 65, pol: 68, cha: 60 },
    level: 10, exp: 0, loyalty: 85, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#8b0000' }
  },

  // ============================================================
  // 吕布方 新增将领
  // ============================================================
  {
    id: 'wei_xu', name: '魏续', faction: 'lv_bu',
    stats: { war: 72, int: 35, lead: 60, pol: 28, cha: 42 },
    level: 9, exp: 0, loyalty: 65, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a3a9a' }
  },
  {
    id: 'song_xian', name: '宋宪', faction: 'lv_bu',
    stats: { war: 70, int: 32, lead: 58, pol: 25, cha: 38 },
    level: 9, exp: 0, loyalty: 62, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#8a4aaa' }
  },
  {
    id: 'hou_cheng', name: '侯成', faction: 'lv_bu',
    stats: { war: 68, int: 30, lead: 55, pol: 22, cha: 35 },
    level: 9, exp: 0, loyalty: 58, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#7a3a9a' }
  },
  {
    id: 'cao_xing', name: '曹性', faction: 'lv_bu',
    stats: { war: 75, int: 38, lead: 62, pol: 28, cha: 40 },
    level: 9, exp: 0, loyalty: 70, unitType: 'archer', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#8a3a9a' }
  },

  // ============================================================
  // 董卓方 新增将领
  // ============================================================
  {
    id: 'duan_wei', name: '段煨', faction: 'dong_zhuo',
    stats: { war: 70, int: 58, lead: 68, pol: 52, cha: 55 },
    level: 10, exp: 0, loyalty: 70, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#555555' }
  },
  {
    id: 'fan_chou', name: '樊稠', faction: 'dong_zhuo',
    stats: { war: 78, int: 38, lead: 65, pol: 30, cha: 40 },
    level: 10, exp: 0, loyalty: 68, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#444444' }
  },
  {
    id: 'hu_zhen', name: '胡轸', faction: 'dong_zhuo',
    stats: { war: 72, int: 40, lead: 62, pol: 28, cha: 38 },
    level: 10, exp: 0, loyalty: 65, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#555555' }
  },
  {
    id: 'zhang_xiu', name: '张绣', faction: 'dong_zhuo',
    stats: { war: 85, int: 55, lead: 78, pol: 45, cha: 62 },
    level: 12, exp: 0, loyalty: 72, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#444455' }
  },
  {
    id: 'dong_min', name: '董旻', faction: 'dong_zhuo',
    stats: { war: 65, int: 42, lead: 58, pol: 35, cha: 45 },
    level: 9, exp: 0, loyalty: 80, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#555555' }
  },

  // ============================================================
  // 刘表方 新增将领
  // ============================================================
  {
    id: 'liu_pan', name: '刘磐', faction: 'liu_biao',
    stats: { war: 78, int: 48, lead: 72, pol: 40, cha: 55 },
    level: 11, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2a8a8a' }
  },
  {
    id: 'kuai_yue', name: '蒯越', faction: 'liu_biao',
    stats: { war: 38, int: 82, lead: 65, pol: 85, cha: 72 },
    level: 12, exp: 0, loyalty: 82, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#3a9a9a' }
  },
  {
    id: 'huan_jie', name: '桓阶', faction: 'liu_biao',
    stats: { war: 28, int: 80, lead: 55, pol: 88, cha: 75 },
    level: 11, exp: 0, loyalty: 78, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#2a8a8a' }
  },
  {
    id: 'zhang_yun', name: '张允', faction: 'liu_biao',
    stats: { war: 58, int: 52, lead: 62, pol: 48, cha: 50 },
    level: 9, exp: 0, loyalty: 80, unitType: 'archer', skills: ['menghuchong', 'huichunshu', 'luoshi'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#3a8a8a' }
  },
  {
    id: 'liu_cong', name: '刘琮', faction: 'liu_biao',
    stats: { war: 18, int: 45, lead: 35, pol: 55, cha: 50 },
    level: 7, exp: 0, loyalty: 85, unitType: 'archer', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#2a8a8a' }
  },

  // ============================================================
  // 孙策方 新增将领
  // ============================================================
  {
    id: 'ling_cao', name: '凌操', faction: 'sun_ce',
    stats: { war: 80, int: 45, lead: 70, pol: 32, cha: 50 },
    level: 11, exp: 0, loyalty: 90, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#cc4422' }
  },
  {
    id: 'xu_kun', name: '徐琨', faction: 'sun_ce',
    stats: { war: 68, int: 55, lead: 65, pol: 50, cha: 58 },
    level: 10, exp: 0, loyalty: 88, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#dd5533' }
  },
  {
    id: 'sun_ben', name: '孙贲', faction: 'sun_ce',
    stats: { war: 72, int: 52, lead: 68, pol: 48, cha: 60 },
    level: 10, exp: 0, loyalty: 92, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#cc4422' }
  },

  // ============================================================
  // 马腾方 新增将领
  // ============================================================
  {
    id: 'yan_xing', name: '阎行', faction: 'ma_teng',
    stats: { war: 85, int: 58, lead: 75, pol: 42, cha: 55 },
    level: 12, exp: 0, loyalty: 78, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#aa6622' }
  },
  {
    id: 'cheng_yi', name: '成宜', faction: 'ma_teng',
    stats: { war: 75, int: 40, lead: 65, pol: 32, cha: 42 },
    level: 10, exp: 0, loyalty: 82, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#bb7733' }
  },
  {
    id: 'li_kan', name: '李堪', faction: 'ma_teng',
    stats: { war: 72, int: 38, lead: 62, pol: 28, cha: 40 },
    level: 9, exp: 0, loyalty: 80, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#aa6622' }
  },
  {
    id: 'yang_qiu', name: '杨秋', faction: 'ma_teng',
    stats: { war: 70, int: 45, lead: 65, pol: 38, cha: 45 },
    level: 10, exp: 0, loyalty: 75, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#bb7733' }
  },

  // ============================================================
  // 袁术方 新增将领
  // ============================================================
  {
    id: 'qiao_rui', name: '桥蕤', faction: 'yuan_shu',
    stats: { war: 72, int: 48, lead: 65, pol: 42, cha: 50 },
    level: 10, exp: 0, loyalty: 80, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#8855bb' }
  },
  {
    id: 'chen_lan', name: '陈兰', faction: 'yuan_shu',
    stats: { war: 70, int: 42, lead: 62, pol: 35, cha: 45 },
    level: 9, exp: 0, loyalty: 72, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#9966cc' }
  },
  {
    id: 'lei_bo', name: '雷薄', faction: 'yuan_shu',
    stats: { war: 68, int: 38, lead: 60, pol: 30, cha: 40 },
    level: 9, exp: 0, loyalty: 68, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#8855bb' }
  },
  {
    id: 'liu_xun_ys', name: '刘勋', faction: 'yuan_shu',
    stats: { war: 62, int: 55, lead: 60, pol: 52, cha: 48 },
    level: 9, exp: 0, loyalty: 70, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#9966cc' }
  },

  // ============================================================
  // 公孙瓒方 新增将领
  // ============================================================
  {
    id: 'dan_jing', name: '单经', faction: 'gongsun_zan',
    stats: { war: 65, int: 52, lead: 62, pol: 45, cha: 48 },
    level: 9, exp: 0, loyalty: 80, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#cccccc' }
  },
  {
    id: 'guan_jing', name: '关靖', faction: 'gongsun_zan',
    stats: { war: 45, int: 72, lead: 60, pol: 68, cha: 58 },
    level: 9, exp: 0, loyalty: 88, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#dddddd' }
  },
  {
    id: 'zou_dan', name: '邹丹', faction: 'gongsun_zan',
    stats: { war: 68, int: 40, lead: 60, pol: 32, cha: 42 },
    level: 9, exp: 0, loyalty: 82, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#cccccc' }
  },

  // ============================================================
  // 刘璋方 新增将领
  // ============================================================
  {
    id: 'fei_guan', name: '费观', faction: 'liu_zhang',
    stats: { war: 48, int: 72, lead: 62, pol: 78, cha: 68 },
    level: 10, exp: 0, loyalty: 80, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#55aa77' }
  },
  {
    id: 'dong_he', name: '董和', faction: 'liu_zhang',
    stats: { war: 35, int: 80, lead: 60, pol: 85, cha: 75 },
    level: 10, exp: 0, loyalty: 82, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#66aa88' }
  },
  {
    id: 'liu_xun', name: '刘循', faction: 'liu_zhang',
    stats: { war: 60, int: 50, lead: 58, pol: 52, cha: 55 },
    level: 9, exp: 0, loyalty: 90, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#55aa77' }
  },

  // ============================================================
  // 孟获方 新增将领
  // ============================================================
  {
    id: 'mulu_dawang', name: '木鹿大王', faction: 'meng_huo',
    stats: { war: 85, int: 28, lead: 72, pol: 22, cha: 45 },
    level: 11, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'long', face: 'square', armor: 'heavy', color: '#cc5500' }
  },
  {
    id: 'jin_huan_sanjie', name: '金环三结', faction: 'meng_huo',
    stats: { war: 80, int: 25, lead: 65, pol: 18, cha: 40 },
    level: 10, exp: 0, loyalty: 85, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'long', face: 'round', armor: 'heavy', color: '#dd6600' }
  },
  {
    id: 'a_hui_nan', name: '阿会喃', faction: 'meng_huo',
    stats: { war: 75, int: 30, lead: 65, pol: 20, cha: 38 },
    level: 10, exp: 0, loyalty: 85, unitType: 'infantry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'long', face: 'square', armor: 'medium', color: '#cc5500' }
  },
  {
    id: 'mang_ya_chang', name: '忙牙长', faction: 'meng_huo',
    stats: { war: 78, int: 22, lead: 62, pol: 15, cha: 35 },
    level: 9, exp: 0, loyalty: 82, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'long', face: 'round', armor: 'heavy', color: '#dd6600' }
  },

  // ============================================================
  // 在野将领（大幅扩充）
  // ============================================================
  {
    id: 'zhao_ang', name: '赵昂', faction: 'none',
    stats: { war: 65, int: 68, lead: 65, pol: 72, cha: 62 },
    level: 10, exp: 0, loyalty: 0, unitType: 'spear', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'], homeCity: 'tianshui',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a7a' }
  },
  {
    id: 'yang_hu', name: '羊祜', faction: 'none',
    stats: { war: 55, int: 90, lead: 82, pol: 92, cha: 88 },
    level: 14, exp: 0, loyalty: 0, unitType: 'archer', skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'xiangyang',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#9a9a8a' }
  },
  {
    id: 'wang_jun', name: '王濬', faction: 'none',
    stats: { war: 68, int: 85, lead: 88, pol: 78, cha: 72 },
    level: 13, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'yizhou',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a9a' }
  },
  {
    id: 'chen_tai', name: '陈泰', faction: 'none',
    stats: { war: 72, int: 82, lead: 80, pol: 75, cha: 68 },
    level: 12, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['luolei', 'duwu', 'jiasushu'], homeCity: 'tianshui',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#7a8a8a' }
  },
  {
    id: 'guanqiu_jian', name: '毌丘俭', faction: 'none',
    stats: { war: 78, int: 75, lead: 82, pol: 68, cha: 65 },
    level: 12, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['menghuchong', 'luolei', 'guwu'], homeCity: 'shouchun',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#8a8a7a' }
  },
  {
    id: 'wen_qin', name: '文钦', faction: 'none',
    stats: { war: 82, int: 48, lead: 72, pol: 38, cha: 50 },
    level: 11, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'shouchun',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a8a7a' }
  },
  {
    id: 'zu_mao', name: '祖茂', faction: 'none',
    stats: { war: 72, int: 38, lead: 62, pol: 28, cha: 45 },
    level: 9, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'chaisang',
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#6a7a6a' }
  },
  {
    id: 'liu_ye', name: '刘晔', faction: 'none',
    stats: { war: 35, int: 90, lead: 62, pol: 85, cha: 75 },
    level: 12, exp: 0, loyalty: 0, unitType: 'archer', skills: ['baofengxue', 'duwu', 'jiasushu'], homeCity: 'lujiang',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#7a8a9a' }
  },
  {
    id: 'fu_gan', name: '傅干', faction: 'none',
    stats: { war: 28, int: 82, lead: 55, pol: 88, cha: 78 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'wuwei',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a9a8a' }
  },
  {
    id: 'dong_yun', name: '董允', faction: 'none',
    stats: { war: 28, int: 85, lead: 58, pol: 90, cha: 82 },
    level: 11, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'], homeCity: 'chengdu',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#6a9a6a' }
  },
  {
    id: 'guan_xing', name: '关兴', faction: 'none',
    stats: { war: 85, int: 58, lead: 78, pol: 42, cha: 70 },
    level: 11, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'chengdu',
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#4a8a4a' }
  },
  {
    id: 'zhang_bao', name: '张苞', faction: 'none',
    stats: { war: 88, int: 45, lead: 75, pol: 32, cha: 62 },
    level: 11, exp: 0, loyalty: 0, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'], homeCity: 'chengdu',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#4a8a4a' }
  },
  {
    id: 'sun_hao', name: '孙皓', faction: 'none',
    stats: { war: 35, int: 55, lead: 48, pol: 62, cha: 40 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'], homeCity: 'jianye',
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#8a4a4a' }
  },
  {
    id: 'jiang_bin', name: '蒋斌', faction: 'none',
    stats: { war: 68, int: 65, lead: 68, pol: 58, cha: 60 },
    level: 10, exp: 0, loyalty: 0, unitType: 'spear', skills: ['menghuchong', 'huichunshu', 'luoshi'], homeCity: 'hanzhong',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#7a8a7a' }
  },
  {
    id: 'hua_tuo', name: '华佗', faction: 'none',
    stats: { war: 15, int: 95, lead: 42, pol: 85, cha: 92 },
    level: 12, exp: 0, loyalty: 0, unitType: 'archer', skills: ['yunshi', 'dilie', 'fangyuqianghua'], homeCity: 'xuchang',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#9a9a9a' }
  },
  {
    id: 'mi_heng', name: '祢衡', faction: 'none',
    stats: { war: 12, int: 88, lead: 35, pol: 72, cha: 85 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'xuchang',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#9a9a8a' }
  },
  {
    id: 'wang_yun', name: '王允', faction: 'none',
    stats: { war: 20, int: 85, lead: 55, pol: 92, cha: 80 },
    level: 12, exp: 0, loyalty: 0, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'luoyang',
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#8a8a9a' }
  },
  {
    id: 'lu_zhi', name: '卢植', faction: 'none',
    stats: { war: 65, int: 85, lead: 75, pol: 88, cha: 82 },
    level: 14, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['duwu', 'huifushu', 'huichunshu'], homeCity: 'luoyang',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a7a' }
  },
  {
    id: 'yan_baihu', name: '严白虎', faction: 'yan_baihu',
    stats: { war: 68, int: 42, lead: 65, pol: 48, cha: 52 },
    level: 10, exp: 0, loyalty: 85, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#aa6611' }
  },
  {
    id: 'pan_jun', name: '潘濬', faction: 'none',
    stats: { war: 55, int: 75, lead: 65, pol: 78, cha: 68 },
    level: 11, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'jiangling',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a9a' }
  },
  {
    id: 'luo_tong', name: '骆统', faction: 'none',
    stats: { war: 50, int: 80, lead: 62, pol: 82, cha: 75 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'jianye',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#9a8a8a' }
  },
  {
    id: 'xu_miao', name: '徐邈', faction: 'none',
    stats: { war: 38, int: 78, lead: 58, pol: 82, cha: 72 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'wuwei',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a9a9a' }
  },
  {
    id: 'sun_jian', name: '孙坚', faction: 'none',
    stats: { war: 92, int: 72, lead: 88, pol: 65, cha: 82 },
    level: 15, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['feilongzaitian', 'longjuanfeng', 'jiasushu'], homeCity: 'changsha',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#aa4444' }
  },
  {
    id: 'bo_fu', name: '伯符', faction: 'none',
    stats: { war: 88, int: 58, lead: 80, pol: 48, cha: 75 },
    level: 12, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'], homeCity: 'chaisang',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#cc4422' }
  },
  {
    id: 'zhang_jiao', name: '张角', faction: 'none',
    stats: { war: 62, int: 88, lead: 80, pol: 75, cha: 90 },
    level: 14, exp: 0, loyalty: 0, unitType: 'archer', skills: ['dilie', 'luolei', 'jiasushu'], homeCity: 'yecheng',
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#5a5a8a' }
  },
  {
    id: 'zhang_liang2', name: '张梁', faction: 'none',
    stats: { war: 78, int: 62, lead: 72, pol: 55, cha: 68 },
    level: 12, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'yecheng',
    portrait: { hair: 'long', face: 'square', armor: 'medium', color: '#5a5a8a' }
  },
  {
    id: 'he_jin', name: '何进', faction: 'none',
    stats: { war: 35, int: 52, lead: 55, pol: 78, cha: 65 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['menghuchong', 'huichunshu', 'luoshi'], homeCity: 'luoyang',
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#9a9a6a' }
  },
  {
    id: 'yuan_yi', name: '袁遗', faction: 'none',
    stats: { war: 45, int: 65, lead: 55, pol: 70, cha: 58 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'pingyuan',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#9a8a5a' }
  },
  {
    id: 'gongsun_du', name: '公孙度', faction: 'gongsun_du',
    stats: { war: 58, int: 72, lead: 75, pol: 78, cha: 68 },
    level: 12, exp: 0, loyalty: 88, unitType: 'cavalry', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#3366aa' }
  },
  {
    id: 'shi_huan', name: '是仪', faction: 'none',
    stats: { war: 22, int: 78, lead: 50, pol: 85, cha: 75 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'], homeCity: 'jianye',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a9a8a' }
  },
  {
    id: 'liu_xie', name: '刘协', faction: 'none',
    stats: { war: 12, int: 55, lead: 32, pol: 70, cha: 75 },
    level: 8, exp: 0, loyalty: 0, unitType: 'archer', skills: ['menghuchong', 'huichunshu', 'luoshi'], homeCity: 'luoyang',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#c8a850' }
  },
  {
    id: 'fu_wan', name: '伏完', faction: 'none',
    stats: { war: 18, int: 58, lead: 38, pol: 72, cha: 62 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'], homeCity: 'xuchang',
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#9a9a9a' }
  },
  {
    id: 'cai_yan', name: '蔡琰', faction: 'none',
    stats: { war: 8, int: 92, lead: 30, pol: 78, cha: 98 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['yehuo', 'shuilongjuan', 'gongjiqianghua'], homeCity: 'xuchang',
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#c88a8a' }
  },
  {
    id: 'sun_luban', name: '孙鲁班', faction: 'none',
    stats: { war: 12, int: 80, lead: 35, pol: 75, cha: 88 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'jianye',
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#cc8888' }
  },
  {
    id: 'ma_yunlu', name: '马云禄', faction: 'none',
    stats: { war: 78, int: 48, lead: 62, pol: 38, cha: 80 },
    level: 10, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'tianshui',
    portrait: { hair: 'long', face: 'thin', armor: 'medium', color: '#bb7733' }
  },
  {
    id: 'xiao_qiao', name: '小乔', faction: 'none',
    stats: { war: 10, int: 72, lead: 28, pol: 65, cha: 98 },
    level: 8, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'chaisang',
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#e8b0a0' }
  },
  {
    id: 'da_qiao', name: '大乔', faction: 'none',
    stats: { war: 8, int: 68, lead: 25, pol: 62, cha: 98 },
    level: 8, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'chaisang',
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#e8b0b0' }
  },
  {
    id: 'diao_chan', name: '貂蝉', faction: 'none',
    stats: { war: 10, int: 85, lead: 28, pol: 80, cha: 100 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'luoyang',
    portrait: { hair: 'long', face: 'thin', armor: 'robe', color: '#e8a8c0' }
  },
  {
    id: 'wu_guotai', name: '吴国太', faction: 'none',
    stats: { war: 15, int: 75, lead: 45, pol: 80, cha: 85 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'jianye',
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#cc8888' }
  },
  {
    id: 'lu_lingqi', name: '吕玲绮', faction: 'none',
    stats: { war: 80, int: 42, lead: 60, pol: 30, cha: 85 },
    level: 10, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'], homeCity: 'xiapi',
    portrait: { hair: 'long', face: 'thin', armor: 'medium', color: '#bb88aa' }
  },
  {
    id: 'sun_shangxiang', name: '孙尚香', faction: 'none',
    stats: { war: 78, int: 62, lead: 65, pol: 55, cha: 90 },
    level: 11, exp: 0, loyalty: 0, unitType: 'archer', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'], homeCity: 'chaisang',
    portrait: { hair: 'long', face: 'thin', armor: 'medium', color: '#dd6666' }
  },
  {
    id: 'wu_anguo', name: '武安国', faction: 'none',
    stats: { war: 80, int: 18, lead: 58, pol: 15, cha: 35 },
    level: 9, exp: 0, loyalty: 0, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'], homeCity: 'luoyang',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a8a5a' }
  },
  {
    id: 'xu_gong', name: '许贡', faction: 'none',
    stats: { war: 35, int: 55, lead: 48, pol: 65, cha: 50 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'], homeCity: 'wujun',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a8a' }
  },
  {
    id: 'liu_dai', name: '刘岱', faction: 'none',
    stats: { war: 58, int: 48, lead: 58, pol: 55, cha: 50 },
    level: 9, exp: 0, loyalty: 0, unitType: 'spear', skills: ['menghuchong', 'huichunshu', 'luoshi'], homeCity: 'puyang',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a7a' }
  },
  {
    id: 'wen_chou2', name: '鞠义', faction: 'none',
    stats: { war: 75, int: 45, lead: 68, pol: 35, cha: 42 },
    level: 10, exp: 0, loyalty: 0, unitType: 'spear', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'], homeCity: 'yecheng',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#9a8a5a' }
  },
  {
    id: 'wang_shuang', name: '王双', faction: 'none',
    stats: { war: 88, int: 28, lead: 68, pol: 22, cha: 38 },
    level: 11, exp: 0, loyalty: 0, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'], homeCity: 'tianshui',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a8a7a' }
  },
  {
    id: 'chen_qun2', name: '夏侯楙', faction: 'none',
    stats: { war: 42, int: 52, lead: 48, pol: 58, cha: 45 },
    level: 9, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'], homeCity: 'changan',
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#7a8a8a' }
  },
  {
    id: 'zhuge_zhan', name: '诸葛瞻', faction: 'none',
    stats: { war: 72, int: 82, lead: 75, pol: 78, cha: 80 },
    level: 11, exp: 0, loyalty: 0, unitType: 'infantry', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'chengdu',
    portrait: { hair: 'bun', face: 'thin', armor: 'medium', color: '#4a7a4a' }
  },
  {
    id: 'guan_ping', name: '关平', faction: 'none',
    stats: { war: 82, int: 52, lead: 72, pol: 38, cha: 68 },
    level: 11, exp: 0, loyalty: 0, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'], homeCity: 'jiangling',
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#4a8a4a' }
  },
  {
    id: 'zhang_song', name: '张松', faction: 'none',
    stats: { war: 12, int: 88, lead: 40, pol: 85, cha: 30 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'chengdu',
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#7a9a7a' }
  },
  {
    id: 'meng_da', name: '孟达', faction: 'none',
    stats: { war: 65, int: 72, lead: 65, pol: 68, cha: 55 },
    level: 10, exp: 0, loyalty: 0, unitType: 'archer', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'], homeCity: 'shangyong',
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#8a8a6a' }
  },
  {
    id: 'li_yan2', name: '李丰', faction: 'none',
    stats: { war: 52, int: 65, lead: 58, pol: 68, cha: 58 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'], homeCity: 'shouchun',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#8a9a7a' }
  },
  {
    id: 'xu_zhi', name: '许芝', faction: 'none',
    stats: { war: 15, int: 75, lead: 40, pol: 80, cha: 68 },
    level: 9, exp: 0, loyalty: 0, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'], homeCity: 'xuchang',
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#9a9a8a' }
  },
  {
    id: 'hao_zhao', name: '郝昭', faction: 'none',
    stats: { war: 82, int: 68, lead: 80, pol: 55, cha: 58 },
    level: 12, exp: 0, loyalty: 0, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'], homeCity: 'tianshui',
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#7a8a8a' }
  },

  // ============================================================
  // 新增 11 势力 武将
  // ============================================================

  // 张鲁方
  { id: 'zhang_lu', name: '张鲁', faction: 'zhang_lu',
    stats: { war: 38, int: 72, lead: 65, pol: 80, cha: 78 },
    level: 12, exp: 0, loyalty: 85, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#5a8a40' }
  },
  { id: 'yang_ren_zl', name: '杨任', faction: 'zhang_lu',
    stats: { war: 75, int: 55, lead: 70, pol: 40, cha: 48 },
    level: 10, exp: 0, loyalty: 88, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#5a8a40' }
  },
  { id: 'yang_ang', name: '杨昂', faction: 'zhang_lu',
    stats: { war: 72, int: 48, lead: 65, pol: 35, cha: 42 },
    level: 9, exp: 0, loyalty: 85, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#4a7a35' }
  },
  { id: 'yan_pu', name: '阎圃', faction: 'zhang_lu',
    stats: { war: 28, int: 78, lead: 52, pol: 82, cha: 72 },
    level: 10, exp: 0, loyalty: 90, unitType: 'archer', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#5a8a40' }
  },
  { id: 'zhang_wei_zl', name: '张卫', faction: 'zhang_lu',
    stats: { war: 68, int: 42, lead: 62, pol: 38, cha: 45 },
    level: 9, exp: 0, loyalty: 92, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#4a7a35' }
  },

  // 韩遂方
  { id: 'cheng_yin_hs', name: '程银', faction: 'han_sui',
    stats: { war: 70, int: 40, lead: 62, pol: 30, cha: 40 },
    level: 9, exp: 0, loyalty: 78, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#aa5522' }
  },
  { id: 'hou_xuan', name: '侯选', faction: 'han_sui',
    stats: { war: 68, int: 38, lead: 60, pol: 28, cha: 38 },
    level: 9, exp: 0, loyalty: 75, unitType: 'cavalry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#993311' }
  },
  { id: 'ma_wan', name: '马玩', faction: 'han_sui',
    stats: { war: 65, int: 35, lead: 58, pol: 25, cha: 35 },
    level: 8, exp: 0, loyalty: 72, unitType: 'cavalry', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#993311' }
  },
  { id: 'li_xian_hs', name: '李暹', faction: 'han_sui',
    stats: { war: 72, int: 42, lead: 65, pol: 32, cha: 42 },
    level: 9, exp: 0, loyalty: 76, unitType: 'cavalry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'long', armor: 'heavy', color: '#aa5522' }
  },

  // 陶谦方
  { id: 'cao_bao', name: '曹豹', faction: 'tao_qian',
    stats: { war: 55, int: 35, lead: 52, pol: 38, cha: 42 },
    level: 8, exp: 0, loyalty: 80, unitType: 'spear', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#4a7788' }
  },
  { id: 'xu_dan', name: '许耽', faction: 'tao_qian',
    stats: { war: 58, int: 42, lead: 55, pol: 40, cha: 45 },
    level: 8, exp: 0, loyalty: 78, unitType: 'spear', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#3a6678' }
  },

  // 孔融方
  { id: 'wang_xiu', name: '王修', faction: 'kong_rong',
    stats: { war: 22, int: 75, lead: 55, pol: 82, cha: 70 },
    level: 9, exp: 0, loyalty: 85, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#aa8811' }
  },

  // 张燕方
  { id: 'zhang_yan', name: '张燕', faction: 'zhang_yan',
    stats: { war: 80, int: 62, lead: 82, pol: 55, cha: 58 },
    level: 12, exp: 0, loyalty: 88, unitType: 'infantry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#556644' }
  },
  { id: 'chu_yan', name: '杜远', faction: 'zhang_yan',
    stats: { war: 68, int: 35, lead: 60, pol: 28, cha: 35 },
    level: 8, exp: 0, loyalty: 80, unitType: 'infantry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'wild', face: 'round', armor: 'medium', color: '#445533' }
  },
  { id: 'yang_feng_zy', name: '杨凤', faction: 'zhang_yan',
    stats: { war: 72, int: 40, lead: 65, pol: 32, cha: 40 },
    level: 9, exp: 0, loyalty: 82, unitType: 'infantry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'square', armor: 'medium', color: '#556644' }
  },
  { id: 'hu_cai', name: '胡才', faction: 'zhang_yan',
    stats: { war: 70, int: 38, lead: 62, pol: 30, cha: 38 },
    level: 8, exp: 0, loyalty: 78, unitType: 'infantry', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'wild', face: 'long', armor: 'medium', color: '#445533' }
  },

  // 公孙度方
  { id: 'gongsun_kang', name: '公孙康', faction: 'gongsun_du',
    stats: { war: 62, int: 65, lead: 68, pol: 72, cha: 62 },
    level: 10, exp: 0, loyalty: 92, unitType: 'cavalry', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#3366aa' }
  },
  { id: 'liu_yi_gsd', name: '柳毅', faction: 'gongsun_du',
    stats: { war: 75, int: 50, lead: 70, pol: 45, cha: 52 },
    level: 9, exp: 0, loyalty: 85, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2255aa' }
  },
  { id: 'bei_yan', name: '卑衍', faction: 'gongsun_du',
    stats: { war: 72, int: 45, lead: 65, pol: 35, cha: 42 },
    level: 9, exp: 0, loyalty: 82, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#2255aa' }
  },

  // 刘繇方
  { id: 'liu_yao', name: '刘繇', faction: 'liu_yao',
    stats: { war: 40, int: 68, lead: 62, pol: 75, cha: 72 },
    level: 11, exp: 0, loyalty: 85, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#886644' }
  },
  { id: 'xu_shao', name: '许劭', faction: 'liu_yao',
    stats: { war: 10, int: 82, lead: 35, pol: 88, cha: 90 },
    level: 10, exp: 0, loyalty: 80, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#886644' }
  },
  { id: 'zhang_ying', name: '张英', faction: 'liu_yao',
    stats: { war: 70, int: 45, lead: 65, pol: 38, cha: 45 },
    level: 9, exp: 0, loyalty: 82, unitType: 'spear', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#776633' }
  },
  { id: 'chen_heng', name: '陈横', faction: 'liu_yao',
    stats: { war: 65, int: 40, lead: 58, pol: 32, cha: 38 },
    level: 8, exp: 0, loyalty: 78, unitType: 'infantry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#776633' }
  },

  // 士燮方
  { id: 'shi_yi', name: '士壹', faction: 'shi_xie',
    stats: { war: 55, int: 60, lead: 58, pol: 65, cha: 62 },
    level: 9, exp: 0, loyalty: 90, unitType: 'spear', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#338866' }
  },
  { id: 'shi_wei', name: '士徽', faction: 'shi_xie',
    stats: { war: 52, int: 55, lead: 55, pol: 60, cha: 58 },
    level: 8, exp: 0, loyalty: 88, unitType: 'spear', skills: ['liehuozhan', 'gongjiqianghua', 'luolei'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#227755' }
  },
  { id: 'xu_jing_sx', name: '薛综', faction: 'shi_xie',
    stats: { war: 18, int: 78, lead: 45, pol: 80, cha: 75 },
    level: 9, exp: 0, loyalty: 82, unitType: 'archer', skills: ['bingdongshu', 'shuilongjuan', 'gongjiqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#338866' }
  },

  // 刘虞方
  { id: 'liu_yu', name: '刘虞', faction: 'liu_yu',
    stats: { war: 28, int: 72, lead: 65, pol: 88, cha: 90 },
    level: 12, exp: 0, loyalty: 90, unitType: 'archer', skills: ['luolei', 'duwu', 'jiasushu'],
    portrait: { hair: 'bun', face: 'long', armor: 'robe', color: '#5588bb' }
  },
  { id: 'wei_you', name: '魏攸', faction: 'liu_yu',
    stats: { war: 20, int: 70, lead: 50, pol: 75, cha: 68 },
    level: 9, exp: 0, loyalty: 88, unitType: 'archer', skills: ['luoshi', 'dilie', 'fangyuqianghua'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#4477aa' }
  },
  { id: 'tian_chou', name: '田畴', faction: 'liu_yu',
    stats: { war: 65, int: 75, lead: 70, pol: 72, cha: 70 },
    level: 10, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['huifushu', 'huoji', 'huichunshu'],
    portrait: { hair: 'short', face: 'long', armor: 'medium', color: '#5588bb' }
  },
  { id: 'qiu_li', name: '鲜于辅', faction: 'liu_yu',
    stats: { war: 70, int: 52, lead: 68, pol: 55, cha: 55 },
    level: 9, exp: 0, loyalty: 85, unitType: 'cavalry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#4477aa' }
  },

  // 严白虎方
  { id: 'yan_yu', name: '严舆', faction: 'yan_baihu',
    stats: { war: 62, int: 38, lead: 58, pol: 38, cha: 42 },
    level: 8, exp: 0, loyalty: 82, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#994400' }
  },
  { id: 'dong_ci', name: '董袭', faction: 'yan_baihu',
    stats: { war: 75, int: 48, lead: 68, pol: 38, cha: 50 },
    level: 9, exp: 0, loyalty: 78, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'short', face: 'square', armor: 'heavy', color: '#994400' }
  },

  // 刘度方
  { id: 'liu_du', name: '刘度', faction: 'liu_du',
    stats: { war: 30, int: 58, lead: 55, pol: 72, cha: 65 },
    level: 10, exp: 0, loyalty: 85, unitType: 'archer', skills: ['xuanfengzhan', 'fangyuqianghua', 'huifushu'],
    portrait: { hair: 'bun', face: 'round', armor: 'robe', color: '#774488' }
  },
  { id: 'xing_dao_rong', name: '邢道荣', faction: 'liu_du',
    stats: { war: 78, int: 22, lead: 62, pol: 20, cha: 30 },
    level: 9, exp: 0, loyalty: 82, unitType: 'spear', skills: ['lianhuanzhan', 'longjuanfeng', 'jiasushu'],
    portrait: { hair: 'wild', face: 'square', armor: 'heavy', color: '#774488' }
  },
  { id: 'bao_long', name: '鲍隆', faction: 'liu_du',
    stats: { war: 65, int: 30, lead: 58, pol: 25, cha: 35 },
    level: 8, exp: 0, loyalty: 80, unitType: 'infantry', skills: ['menghuchong', 'hengsaoqianjun', 'huichunshu'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#663377' }
  },
  { id: 'jin_xuan', name: '金旋', faction: 'liu_du',
    stats: { war: 45, int: 55, lead: 58, pol: 65, cha: 58 },
    level: 9, exp: 0, loyalty: 78, unitType: 'archer', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'bun', face: 'long', armor: 'medium', color: '#774488' }
  },

  // 孔融 额外
  { id: 'zong_bao', name: '宗宝', faction: 'kong_rong',
    stats: { war: 60, int: 40, lead: 55, pol: 35, cha: 40 },
    level: 8, exp: 0, loyalty: 82, unitType: 'spear', skills: ['liehuozhan', 'pojunxing', 'gongjiqianghua'],
    portrait: { hair: 'short', face: 'round', armor: 'medium', color: '#aa8811' }
  },
  { id: 'liu_kong', name: '刘孔慈', faction: 'kong_rong',
    stats: { war: 55, int: 45, lead: 50, pol: 48, cha: 50 },
    level: 7, exp: 0, loyalty: 80, unitType: 'infantry', skills: ['lianhuanzhan', 'jiasushu', 'bingdongshu'],
    portrait: { hair: 'bun', face: 'thin', armor: 'robe', color: '#bb9922' }
  },

  // 陶谦 额外
  { id: 'zhang_kai', name: '张闿', faction: 'tao_qian',
    stats: { war: 62, int: 30, lead: 55, pol: 28, cha: 30 },
    level: 8, exp: 0, loyalty: 45, unitType: 'infantry', skills: ['xuanfengzhan', 'leishenji', 'fangyuqianghua'],
    portrait: { hair: 'short', face: 'square', armor: 'medium', color: '#3a6678' }
  },
  { id: 'mi_fang_tq', name: '麋芳', faction: 'tao_qian',
    stats: { war: 48, int: 45, lead: 50, pol: 55, cha: 52 },
    level: 8, exp: 0, loyalty: 72, unitType: 'archer', skills: ['menghuchong', 'huichunshu', 'luoshi'],
    portrait: { hair: 'bun', face: 'round', armor: 'medium', color: '#4a7788' }
  },
];

export default generals;


