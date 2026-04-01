// =============================================================================
// events.js - Three Kingdoms Strategy RPG - Event Data
// =============================================================================

const EVENTS = [
  // =========================================================================
  //  STORY EVENTS (剧情事件)
  // =========================================================================
  {
    id: 'story_001',
    name: '桃园结义',
    type: 'story',
    description: '刘备、关羽、张飞三人在张飞庄后的桃园中焚香祭拜天地，结为异姓兄弟，誓言"不求同年同月同日生，但求同年同月同日死"。',
    condition: { type: 'turn_range', params: { min: 1, max: 5 } },
    effects: [
      { type: 'loyalty', value: 30, target: 'general' },
      { type: 'fame', value: 20, target: 'player' }
    ],
    choices: [
      {
        text: '参与结义，共举大事',
        effects: [
          { type: 'loyalty', value: 30, target: 'general' },
          { type: 'fame', value: 20, target: 'player' },
          { type: 'general_join', value: 1, target: 'player' }
        ]
      },
      {
        text: '旁观不语，静待时机',
        effects: [
          { type: 'fame', value: 5, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'story_002',
    name: '三顾茅庐',
    type: 'story',
    description: '刘备听闻卧龙诸葛亮隐居南阳，三次亲往隆中拜访。前两次未得相见，第三次终于在草庐中见到诸葛亮，促膝长谈天下大势，是为"隆中对"。',
    condition: { type: 'fame', params: { min: 50 } },
    effects: [
      { type: 'general_join', value: 1, target: 'player' },
      { type: 'fame', value: 30, target: 'player' }
    ],
    choices: [
      {
        text: '诚心三顾，礼贤下士',
        effects: [
          { type: 'general_join', value: 1, target: 'player' },
          { type: 'fame', value: 30, target: 'player' },
          { type: 'loyalty', value: 50, target: 'general' }
        ]
      },
      {
        text: '仅派使者传话',
        effects: [
          { type: 'fame', value: -10, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'story_003',
    name: '连环计',
    type: 'story',
    description: '司徒王允巧施连环计，先将貂蝉许与吕布，后又献于董卓，令二人反目成仇。最终吕布持方天画戟刺杀董卓于城门之下。',
    condition: { type: 'turn_range', params: { min: 10, max: 25 } },
    effects: [
      { type: 'fame', value: 25, target: 'player' }
    ],
    choices: [
      {
        text: '暗中协助王允施计',
        effects: [
          { type: 'fame', value: 25, target: 'player' },
          { type: 'gold', value: -500, target: 'player' }
        ]
      },
      {
        text: '置身事外，静观其变',
        effects: [
          { type: 'fame', value: 5, target: 'player' }
        ]
      },
      {
        text: '向董卓告密以求赏赐',
        effects: [
          { type: 'gold', value: 2000, target: 'player' },
          { type: 'fame', value: -30, target: 'player' },
          { type: 'loyalty', value: -20, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'story_004',
    name: '火烧赤壁',
    type: 'story',
    description: '曹操率八十万大军南下，孙刘联军于赤壁以火攻之计大破曹军。黄盖诈降、庞统献连环、诸葛借东风，一场大火奠定三分天下之势。',
    condition: { type: 'turn_range', params: { min: 30, max: 50 } },
    effects: [
      { type: 'fame', value: 50, target: 'player' }
    ],
    choices: [
      {
        text: '联合盟军，火攻破敌',
        effects: [
          { type: 'fame', value: 50, target: 'player' },
          { type: 'gold', value: 3000, target: 'player' },
          { type: 'food', value: 5000, target: 'player' }
        ]
      },
      {
        text: '趁乱偷袭敌方后方城池',
        effects: [
          { type: 'fame', value: 20, target: 'player' },
          { type: 'gold', value: 5000, target: 'player' }
        ]
      },
      {
        text: '按兵不动，保存实力',
        effects: [
          { type: 'food', value: 2000, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'story_005',
    name: '官渡之战',
    type: 'story',
    description: '曹操以少胜多的经典战役。袁绍拥兵十万进逼官渡，曹操奇袭乌巢粮仓，一举焚毁袁军粮草，袁绍大军不战自溃，北方统一由此奠基。',
    condition: { type: 'turn_range', params: { min: 20, max: 40 } },
    effects: [
      { type: 'fame', value: 40, target: 'player' }
    ],
    choices: [
      {
        text: '奇袭敌军粮仓',
        effects: [
          { type: 'fame', value: 40, target: 'player' },
          { type: 'food', value: 8000, target: 'player' },
          { type: 'gold', value: 2000, target: 'player' }
        ]
      },
      {
        text: '正面强攻，以勇取胜',
        effects: [
          { type: 'fame', value: 20, target: 'player' },
          { type: 'loyalty', value: -10, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'story_006',
    name: '空城计',
    type: 'story',
    description: '街亭失守后，司马懿大军逼近西城。诸葛亮兵力空虚，遂大开城门，独坐城楼抚琴。司马懿疑有伏兵，下令退军，一场心理博弈化险为夷。',
    condition: { type: 'generals_in_city', params: { max: 2 } },
    effects: [
      { type: 'fame', value: 35, target: 'player' }
    ],
    choices: [
      {
        text: '效仿孔明，施展空城之计',
        effects: [
          { type: 'fame', value: 35, target: 'player' },
          { type: 'loyalty', value: 10, target: 'general' }
        ]
      },
      {
        text: '弃城撤退，保存兵力',
        effects: [
          { type: 'fame', value: -10, target: 'player' },
          { type: 'loyalty', value: -5, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'story_007',
    name: '七擒孟获',
    type: 'story',
    description: '诸葛亮南征南蛮，七次擒获蛮王孟获又七次释放，终于令孟获心悦诚服，永不再反。以德服人，攻心为上。',
    condition: { type: 'turn_range', params: { min: 40, max: 60 } },
    effects: [
      { type: 'fame', value: 30, target: 'player' }
    ],
    choices: [
      {
        text: '以德服人，七擒七纵',
        effects: [
          { type: 'fame', value: 30, target: 'player' },
          { type: 'loyalty', value: 20, target: 'general' },
          { type: 'population', value: 500, target: 'city' }
        ]
      },
      {
        text: '一战擒获，就地斩杀',
        effects: [
          { type: 'fame', value: -15, target: 'player' },
          { type: 'loyalty', value: -10, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'story_008',
    name: '千里走单骑',
    type: 'story',
    description: '关羽得知刘备下落，挂印封金辞别曹操，千里护送二位嫂嫂，过五关斩六将，终与刘备重逢于古城。忠义之名震动天下。',
    condition: { type: 'faction', params: { faction: 'shu' } },
    effects: [
      { type: 'fame', value: 25, target: 'player' },
      { type: 'loyalty', value: 20, target: 'general' }
    ],
    choices: [
      {
        text: '赞扬忠义，厚加赏赐',
        effects: [
          { type: 'fame', value: 25, target: 'player' },
          { type: 'loyalty', value: 20, target: 'general' },
          { type: 'gold', value: -1000, target: 'player' }
        ]
      },
      {
        text: '低调处理，不做声张',
        effects: [
          { type: 'loyalty', value: 5, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'story_009',
    name: '舌战群儒',
    type: 'story',
    description: '诸葛亮只身前往东吴，在朝堂之上以三寸不烂之舌驳倒张昭等一众文臣，最终说服孙权联刘抗曹，促成孙刘联盟。',
    condition: { type: 'fame', params: { min: 40 } },
    effects: [
      { type: 'fame', value: 20, target: 'player' }
    ],
    choices: [
      {
        text: '派遣智谋之士前往游说',
        effects: [
          { type: 'fame', value: 20, target: 'player' },
          { type: 'gold', value: 1000, target: 'player' }
        ]
      },
      {
        text: '放弃外交，独自抗敌',
        effects: [
          { type: 'fame', value: -5, target: 'player' }
        ]
      }
    ]
  },

  // =========================================================================
  //  RANDOM EVENTS (随机事件)
  // =========================================================================
  {
    id: 'random_001',
    name: '丰收',
    type: 'random',
    description: '今年风调雨顺，五谷丰登，百姓安居乐业，粮仓满溢。',
    condition: { type: 'turn_range', params: { min: 1, max: 999 } },
    effects: [
      { type: 'food', value: 3000, target: 'city' },
      { type: 'population', value: 200, target: 'city' }
    ],
    choices: [
      {
        text: '开仓放粮，与民同庆',
        effects: [
          { type: 'food', value: 1500, target: 'city' },
          { type: 'loyalty', value: 15, target: 'general' },
          { type: 'population', value: 300, target: 'city' }
        ]
      },
      {
        text: '囤积粮草，以备不时之需',
        effects: [
          { type: 'food', value: 5000, target: 'city' }
        ]
      }
    ]
  },
  {
    id: 'random_002',
    name: '蝗灾',
    type: 'random',
    description: '漫天蝗虫铺天盖地而来，所过之处庄稼尽毁，颗粒无收，百姓哀鸿遍野。',
    condition: { type: 'turn_range', params: { min: 5, max: 999 } },
    effects: [
      { type: 'food', value: -3000, target: 'city' },
      { type: 'agriculture', value: -20, target: 'city' }
    ],
    choices: [
      {
        text: '组织百姓灭蝗，拨款赈灾',
        effects: [
          { type: 'food', value: -1500, target: 'city' },
          { type: 'gold', value: -800, target: 'player' },
          { type: 'agriculture', value: -10, target: 'city' },
          { type: 'loyalty', value: 10, target: 'general' }
        ]
      },
      {
        text: '听天由命，任其发展',
        effects: [
          { type: 'food', value: -4000, target: 'city' },
          { type: 'agriculture', value: -30, target: 'city' },
          { type: 'population', value: -300, target: 'city' }
        ]
      }
    ]
  },
  {
    id: 'random_003',
    name: '瘟疫',
    type: 'random',
    description: '城中突发疫病，百姓纷纷染病，街市萧条，人心惶惶。若不及时控制，恐将蔓延全境。',
    condition: { type: 'turn_range', params: { min: 10, max: 999 } },
    effects: [
      { type: 'population', value: -500, target: 'city' },
      { type: 'loyalty', value: -10, target: 'general' }
    ],
    choices: [
      {
        text: '延请名医，拨银救治',
        effects: [
          { type: 'gold', value: -1500, target: 'player' },
          { type: 'population', value: -200, target: 'city' },
          { type: 'loyalty', value: 10, target: 'general' },
          { type: 'fame', value: 10, target: 'player' }
        ]
      },
      {
        text: '封锁城门，隔离病患',
        effects: [
          { type: 'population', value: -400, target: 'city' },
          { type: 'loyalty', value: -5, target: 'general' }
        ]
      },
      {
        text: '不加干涉',
        effects: [
          { type: 'population', value: -800, target: 'city' },
          { type: 'loyalty', value: -20, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_004',
    name: '旱灾',
    type: 'random',
    description: '烈日炎炎，数月滴雨未降，河川干涸，庄稼枯萎，旱情日益严重。',
    condition: { type: 'turn_range', params: { min: 1, max: 999 } },
    effects: [
      { type: 'food', value: -2000, target: 'city' },
      { type: 'agriculture', value: -15, target: 'city' }
    ],
    choices: [
      {
        text: '开渠引水，兴修水利',
        effects: [
          { type: 'gold', value: -1000, target: 'player' },
          { type: 'food', value: -500, target: 'city' },
          { type: 'agriculture', value: 10, target: 'city' },
          { type: 'fame', value: 10, target: 'player' }
        ]
      },
      {
        text: '开仓放粮，救济灾民',
        effects: [
          { type: 'food', value: -2500, target: 'city' },
          { type: 'loyalty', value: 10, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_005',
    name: '水灾',
    type: 'random',
    description: '连日暴雨导致江河泛滥，洪水冲毁农田房屋，百姓流离失所。',
    condition: { type: 'turn_range', params: { min: 1, max: 999 } },
    effects: [
      { type: 'food', value: -2500, target: 'city' },
      { type: 'population', value: -300, target: 'city' },
      { type: 'agriculture', value: -15, target: 'city' }
    ],
    choices: [
      {
        text: '紧急救灾，修筑堤坝',
        effects: [
          { type: 'gold', value: -1200, target: 'player' },
          { type: 'food', value: -1000, target: 'city' },
          { type: 'population', value: -100, target: 'city' },
          { type: 'fame', value: 15, target: 'player' }
        ]
      },
      {
        text: '迁移百姓至高处安置',
        effects: [
          { type: 'gold', value: -500, target: 'player' },
          { type: 'population', value: -200, target: 'city' }
        ]
      }
    ]
  },
  {
    id: 'random_006',
    name: '流民',
    type: 'random',
    description: '一大批流离失所的百姓涌入城中，恳求收容。他们中有农夫、工匠，也有少数身怀武艺之人。',
    condition: { type: 'turn_range', params: { min: 3, max: 999 } },
    effects: [
      { type: 'population', value: 500, target: 'city' }
    ],
    choices: [
      {
        text: '开城收容，分配田地',
        effects: [
          { type: 'population', value: 800, target: 'city' },
          { type: 'food', value: -1000, target: 'city' },
          { type: 'gold', value: -500, target: 'player' },
          { type: 'fame', value: 15, target: 'player' }
        ]
      },
      {
        text: '选拔精壮编入军中',
        effects: [
          { type: 'population', value: 300, target: 'city' },
          { type: 'food', value: -500, target: 'city' }
        ]
      },
      {
        text: '关闭城门，拒之门外',
        effects: [
          { type: 'fame', value: -10, target: 'player' },
          { type: 'loyalty', value: -5, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_007',
    name: '发现宝物',
    type: 'random',
    description: '城郊农夫耕地时挖出一个古旧的铜箱，内藏珍贵宝物，献于太守。',
    condition: { type: 'turn_range', params: { min: 1, max: 999 } },
    effects: [
      { type: 'gold', value: 1000, target: 'player' }
    ],
    choices: [
      {
        text: '收入府库，赏赐农夫',
        effects: [
          { type: 'gold', value: 800, target: 'player' },
          { type: 'fame', value: 5, target: 'player' },
          { type: 'loyalty', value: 5, target: 'general' }
        ]
      },
      {
        text: '赠予麾下猛将',
        effects: [
          { type: 'loyalty', value: 20, target: 'general' },
          { type: 'fame', value: 5, target: 'player' }
        ]
      },
      {
        text: '高价卖出，充实军费',
        effects: [
          { type: 'gold', value: 2000, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'random_008',
    name: '武将叛变',
    type: 'random',
    description: '城中传来急报，一名将领心怀不满，暗中联络敌军，图谋叛变！',
    condition: { type: 'turn_range', params: { min: 15, max: 999 } },
    effects: [
      { type: 'loyalty', value: -20, target: 'general' },
      { type: 'gold', value: -500, target: 'player' }
    ],
    choices: [
      {
        text: '当机立断，擒拿叛将',
        effects: [
          { type: 'loyalty', value: -10, target: 'general' },
          { type: 'fame', value: 10, target: 'player' }
        ]
      },
      {
        text: '好言安抚，许以厚禄',
        effects: [
          { type: 'gold', value: -1500, target: 'player' },
          { type: 'loyalty', value: 10, target: 'general' }
        ]
      },
      {
        text: '暗中监视，伺机而动',
        effects: [
          { type: 'loyalty', value: -5, target: 'general' },
          { type: 'gold', value: -200, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'random_009',
    name: '商旅经过',
    type: 'random',
    description: '一支来自西域的商队途经此地，携带大量珍奇货物，希望在此交易歇脚。',
    condition: { type: 'turn_range', params: { min: 1, max: 999 } },
    effects: [
      { type: 'gold', value: 500, target: 'player' }
    ],
    choices: [
      {
        text: '盛情款待，开放市场',
        effects: [
          { type: 'gold', value: 1500, target: 'player' },
          { type: 'fame', value: 5, target: 'player' },
          { type: 'food', value: -300, target: 'city' }
        ]
      },
      {
        text: '征收重税后放行',
        effects: [
          { type: 'gold', value: 2000, target: 'player' },
          { type: 'fame', value: -5, target: 'player' }
        ]
      },
      {
        text: '扣押商队，充公财物',
        effects: [
          { type: 'gold', value: 3000, target: 'player' },
          { type: 'fame', value: -20, target: 'player' },
          { type: 'loyalty', value: -10, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_010',
    name: '民心安定',
    type: 'random',
    description: '城中百姓安居乐业，对太守治理甚为满意，纷纷传颂太守仁政，四方流民闻之来投。',
    condition: { type: 'fame', params: { min: 30 } },
    effects: [
      { type: 'population', value: 300, target: 'city' },
      { type: 'loyalty', value: 10, target: 'general' }
    ],
    choices: [
      {
        text: '趁势兴修学堂，教化百姓',
        effects: [
          { type: 'gold', value: -800, target: 'player' },
          { type: 'population', value: 500, target: 'city' },
          { type: 'fame', value: 15, target: 'player' }
        ]
      },
      {
        text: '继续励精图治',
        effects: [
          { type: 'population', value: 300, target: 'city' },
          { type: 'loyalty', value: 10, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_011',
    name: '山贼出没',
    type: 'random',
    description: '城外山林中盘踞着一伙山贼，屡屡劫掠过往商旅和村民，百姓苦不堪言。',
    condition: { type: 'turn_range', params: { min: 5, max: 999 } },
    effects: [
      { type: 'gold', value: -300, target: 'player' },
      { type: 'population', value: -100, target: 'city' }
    ],
    choices: [
      {
        text: '派兵剿灭山贼',
        effects: [
          { type: 'fame', value: 10, target: 'player' },
          { type: 'gold', value: 500, target: 'player' },
          { type: 'population', value: 100, target: 'city' }
        ]
      },
      {
        text: '招安山贼，编入军中',
        effects: [
          { type: 'gold', value: -500, target: 'player' },
          { type: 'population', value: 200, target: 'city' }
        ]
      },
      {
        text: '加强城防，不予理会',
        effects: [
          { type: 'gold', value: -200, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'random_012',
    name: '名士来访',
    type: 'random',
    description: '一位闻名遐迩的名士慕名前来拜访，愿意在此讲学授道，传播学问。',
    condition: { type: 'fame', params: { min: 20 } },
    effects: [
      { type: 'fame', value: 10, target: 'player' }
    ],
    choices: [
      {
        text: '隆重接待，拜为军师',
        effects: [
          { type: 'fame', value: 15, target: 'player' },
          { type: 'gold', value: -1000, target: 'player' },
          { type: 'general_join', value: 1, target: 'player' }
        ]
      },
      {
        text: '礼遇有加，请其讲学',
        effects: [
          { type: 'fame', value: 10, target: 'player' },
          { type: 'gold', value: -300, target: 'player' },
          { type: 'loyalty', value: 5, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_013',
    name: '铁矿发现',
    type: 'random',
    description: '探矿队在城郊山区发现了一处品质上乘的铁矿脉，储量丰富，可大幅提升军备生产。',
    condition: { type: 'turn_range', params: { min: 8, max: 999 } },
    effects: [
      { type: 'gold', value: 800, target: 'player' }
    ],
    choices: [
      {
        text: '立即开采，锻造兵器',
        effects: [
          { type: 'gold', value: 2000, target: 'player' },
          { type: 'population', value: -100, target: 'city' }
        ]
      },
      {
        text: '有序开发，长期经营',
        effects: [
          { type: 'gold', value: 800, target: 'player' },
          { type: 'agriculture', value: 5, target: 'city' }
        ]
      }
    ]
  },
  {
    id: 'random_014',
    name: '天降祥瑞',
    type: 'random',
    description: '城中出现祥瑞之兆——据百姓报告，有五色祥云笼罩城池上空，众人皆以为吉兆。',
    condition: { type: 'turn_range', params: { min: 1, max: 999 } },
    effects: [
      { type: 'fame', value: 15, target: 'player' },
      { type: 'loyalty', value: 10, target: 'general' }
    ],
    choices: [
      {
        text: '昭告天下，大宴群臣',
        effects: [
          { type: 'fame', value: 20, target: 'player' },
          { type: 'loyalty', value: 15, target: 'general' },
          { type: 'gold', value: -500, target: 'player' },
          { type: 'food', value: -500, target: 'city' }
        ]
      },
      {
        text: '低调处理，心中暗喜',
        effects: [
          { type: 'fame', value: 10, target: 'player' },
          { type: 'loyalty', value: 5, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_015',
    name: '敌军细作',
    type: 'random',
    description: '巡城卫兵抓获一名行迹可疑之人，经审讯发现乃是敌军派来的细作，已窃取部分军事机密。',
    condition: { type: 'turn_range', params: { min: 10, max: 999 } },
    effects: [
      { type: 'loyalty', value: -5, target: 'general' }
    ],
    choices: [
      {
        text: '严刑拷问，反向利用',
        effects: [
          { type: 'fame', value: 10, target: 'player' },
          { type: 'gold', value: 500, target: 'player' }
        ]
      },
      {
        text: '斩首示众，以儆效尤',
        effects: [
          { type: 'fame', value: 5, target: 'player' },
          { type: 'loyalty', value: 5, target: 'general' }
        ]
      },
      {
        text: '释放细作，传递假情报',
        effects: [
          { type: 'fame', value: 15, target: 'player' }
        ]
      }
    ]
  },
  {
    id: 'random_016',
    name: '义士投奔',
    type: 'random',
    description: '一位武艺高强的江湖义士听闻太守仁义之名，特来投奔，愿效犬马之劳。',
    condition: { type: 'fame', params: { min: 25 } },
    effects: [
      { type: 'general_join', value: 1, target: 'player' }
    ],
    choices: [
      {
        text: '欣然接纳，委以重任',
        effects: [
          { type: 'general_join', value: 1, target: 'player' },
          { type: 'loyalty', value: 15, target: 'general' },
          { type: 'gold', value: -300, target: 'player' }
        ]
      },
      {
        text: '先行考察，再做定夺',
        effects: [
          { type: 'general_join', value: 1, target: 'player' },
          { type: 'loyalty', value: 5, target: 'general' }
        ]
      }
    ]
  },
  {
    id: 'random_017',
    name: '粮草被劫',
    type: 'random',
    description: '运粮队在途中遭到敌军伏击，大批粮草被劫，押运将士死伤惨重。',
    condition: { type: 'turn_range', params: { min: 10, max: 999 } },
    effects: [
      { type: 'food', value: -3000, target: 'city' }
    ],
    choices: [
      {
        text: '派精兵追击，夺回粮草',
        effects: [
          { type: 'food', value: -1000, target: 'city' },
          { type: 'fame', value: 10, target: 'player' }
        ]
      },
      {
        text: '加强护卫，以防再犯',
        effects: [
          { type: 'food', value: -3000, target: 'city' },
          { type: 'gold', value: -500, target: 'player' }
        ]
      }
    ]
  }
];

export default EVENTS;
