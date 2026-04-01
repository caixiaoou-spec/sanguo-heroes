// 势力初始数据（25势力）
const FACTIONS_DATA = [
    {
        id: 'cao_cao', name: '曹操', color: '#4488cc', colorLight: '#6699dd',
        title: '魏公', description: '挟天子以令诸侯，雄踞北方',
        // 5城：中原核心（许昌+陈留+洛阳+颍川+宛城）
        cities: ['xuchang', 'chenliu', 'luoyang', 'yingchuan', 'wancheng'],
        gold: 55000, food: 85000, fame: 85,
        generals: ['cao_cao', 'xiahou_dun', 'xiahou_yuan', 'cao_ren', 'cao_hong', 'xun_yu', 'xun_you', 'guo_jia', 'cheng_yu', 'yu_jin', 'yue_jin', 'li_dian', 'dian_wei', 'xu_chu', 'zhang_liao_cc', 'jia_xu', 'man_chong', 'cao_zhang', 'cao_pi', 'xu_huang', 'zhang_he_cc', 'niu_jin', 'zang_ba', 'wang_lang', 'chen_qun', 'hua_xin', 'cao_zhen', 'cao_xiu', 'wang_chang', 'guo_huai_cc', 'zhang_liao', 'xin_pi', 'deng_ai', 'zhong_hui', 'sima_yi_cc']
    },
    {
        id: 'liu_bei', name: '刘备', color: '#44aa44', colorLight: '#66cc66',
        title: '汉中王', description: '仁德之主，志在兴复汉室',
        // 5城：益州全境（成都+汉中+梓潼+江州+越嶲）
        cities: ['chengdu', 'hanzhong', 'zitong', 'jiangzhou', 'yuesui'],
        gold: 38000, food: 65000, fame: 80,
        generals: ['liu_bei', 'guan_yu', 'zhang_fei', 'zhao_yun', 'zhuge_liang', 'huang_zhong', 'ma_chao', 'wei_yan', 'pang_tong', 'fa_zheng', 'jiang_wan', 'ma_su', 'guan_suo', 'li_yan', 'ma_liang', 'fei_yi', 'wu_ban', 'mi_zhu', 'chen_dao', 'huo_jun', 'zhang_yi', 'wang_ping', 'liao_hua', 'xiang_chong', 'ju_fu', 'zhang_wing', 'jiang_wei', 'deng_zhi']
    },
    {
        id: 'sun_quan', name: '孙权', color: '#cc4444', colorLight: '#dd6666',
        title: '吴侯', description: '承父兄基业，据守江东',
        // 4城：江东核心（建业+吴郡+会稽+柴桑）
        cities: ['jianye', 'wujun', 'kuaiji', 'chaisang'],
        gold: 48000, food: 72000, fame: 75,
        generals: ['sun_quan', 'zhou_yu_sq', 'lu_su', 'lv_meng', 'gan_ning', 'huang_gai', 'cheng_pu', 'zhou_tai', 'taishi_ci', 'ling_tong', 'xu_sheng', 'ding_feng', 'zhu_ran', 'bu_zhi', 'pan_zhang', 'he_qi', 'zhu_huan', 'lu_xun', 'zhuge_jin', 'gu_yong', 'zhang_zhao', 'quan_cong', 'lu_kai', 'lv_dai', 'zhu_huan2', 'sun_shao', 'cheng_bing', 'sun_yi']
    },
    {
        id: 'yuan_shao', name: '袁绍', color: '#ccaa44', colorLight: '#ddbb66',
        title: '大将军', description: '四世三公，兵多将广',
        // 2城：青兖交界（平原+濮阳）
        cities: ['pingyuan', 'puyang'],
        gold: 42000, food: 68000, fame: 70,
        generals: ['yuan_shao', 'yan_liang', 'wen_chou', 'zhang_he_ys', 'gao_lan', 'ju_shou', 'tian_feng', 'shen_pei', 'chunyu_qiong', 'feng_ji', 'xin_ping', 'yuan_tan', 'yuan_shang', 'yuan_xi', 'gao_gan', 'qu_yi', 'guo_tu', 'zhang_he_ys2', 'han_meng']
    },
    {
        id: 'lv_bu', name: '吕布', color: '#aa44aa', colorLight: '#cc66cc',
        title: '温侯', description: '天下第一武将，有勇无谋',
        // 1城：下邳，四面受敌
        cities: ['xiapi'],
        gold: 20000, food: 30000, fame: 60,
        generals: ['lv_bu', 'chen_gong', 'gao_shun', 'wei_xu', 'song_xian', 'hou_cheng', 'cao_xing']
    },
    {
        id: 'dong_zhuo', name: '董卓', color: '#666666', colorLight: '#888888',
        title: '太师', description: '把持朝政，骄横跋扈',
        // 2城：关中核心（长安+天水）
        cities: ['changan', 'tianshui'],
        gold: 42000, food: 52000, fame: 30,
        generals: ['dong_zhuo', 'li_jue', 'guo_si', 'hua_xiong', 'zhang_ji_dz', 'niu_fu', 'xu_rong', 'duan_wei', 'fan_chou', 'hu_zhen', 'zhang_xiu', 'dong_min']
    },
    {
        id: 'liu_biao', name: '刘表', color: '#44aaaa', colorLight: '#66cccc',
        title: '荆州牧', description: '坐守荆州，守成之主',
        // 4城：荆州核心（襄阳+江陵+新野+南郡）
        cities: ['xiangyang', 'jiangling', 'xinye', 'nanjun'],
        gold: 38000, food: 58000, fame: 65,
        generals: ['liu_biao', 'cai_mao', 'huang_zu', 'wen_pin', 'kuai_liang', 'liu_qi', 'wang_wei', 'yi_ji', 'liu_pan', 'kuai_yue', 'huan_jie', 'zhang_yun', 'liu_cong']
    },
    {
        id: 'sun_ce', name: '孙策', color: '#ee6644', colorLight: '#ff8866',
        title: '小霸王', description: '江东猛虎之子，锐不可当',
        // 1城：庐江（广陵给陶谦）
        cities: ['lujiang'],
        gold: 25000, food: 40000, fame: 70,
        generals: ['sun_ce', 'jiang_qin', 'chen_wu', 'han_dang', 'zhu_zhi', 'lv_fan', 'jiang_qin2', 'ling_cao', 'xu_kun', 'sun_ben']
    },
    {
        id: 'xiang_yu', name: '项羽', color: '#8b0000', colorLight: '#b22222',
        title: '西楚霸王', description: '力拔山兮气盖世，千古无二霸王',
        // 3城：冀州核心（邺城+太原+上党）
        cities: ['yecheng', 'taiyuan', 'shangdang'],
        gold: 60000, food: 90000, fame: 90,
        generals: ['xiang_yu', 'long_ju', 'zhongli_mei', 'fan_zeng', 'ji_bu', 'huan_chu', 'ying_bu', 'yu_ziqi', 'zhongli_mo', 'zhou_yin', 'ding_gong', 'xue_gong']
    },
    // === 原有 5 势力 ===
    {
        id: 'ma_teng', name: '马腾', color: '#bb7733', colorLight: '#cc9955',
        title: '征西将军', description: '西凉铁骑，纵横边塞',
        // 2城：凉州（武威+西域）
        cities: ['wuwei', 'xiyu'],
        gold: 27000, food: 42000, fame: 55,
        generals: ['ma_teng', 'pang_de', 'ma_dai', 'ma_xiu', 'yan_xing', 'cheng_yi', 'li_kan', 'yang_qiu']
    },
    {
        id: 'yuan_shu', name: '袁术', color: '#9966cc', colorLight: '#bb88ee',
        title: '仲家帝', description: '四世三公，妄称帝号',
        // 2城：淮南（寿春+汝南）
        cities: ['shouchun', 'runan'],
        gold: 35000, food: 50000, fame: 40,
        generals: ['yuan_shu', 'ji_ling', 'zhang_xun_ys', 'yang_feng', 'qiao_rui', 'chen_lan', 'lei_bo', 'liu_xun_ys']
    },
    {
        id: 'gongsun_zan', name: '公孙瓒', color: '#dddddd', colorLight: '#ffffff',
        title: '奋武将军', description: '白马义从，威震北疆',
        // 1城：右北平
        cities: ['youbeiping'],
        gold: 20000, food: 35000, fame: 50,
        generals: ['gongsun_zan', 'tian_yu', 'yan_gang', 'dan_jing', 'guan_jing', 'zou_dan']
    },
    {
        id: 'liu_zhang', name: '刘璋', color: '#66aa88', colorLight: '#88ccaa',
        title: '益州牧', description: '蜀中暗弱，难御外敌',
        // 2城：益州南部（益州郡+建宁）
        cities: ['yizhou', 'jianningfu'],
        gold: 30000, food: 45000, fame: 35,
        generals: ['liu_zhang', 'zhang_ren', 'yan_yan', 'wu_yi', 'huang_quan', 'fei_guan', 'dong_he', 'liu_xun']
    },
    {
        id: 'meng_huo', name: '孟获', color: '#dd6600', colorLight: '#ff8822',
        title: '南蛮王', description: '蛮荒之王，百战不屈',
        // 2城：南中+交趾（苍梧给士燮）
        cities: ['nanzhong', 'jiaozhi'],
        gold: 20000, food: 35000, fame: 45,
        generals: ['meng_huo', 'zhu_rong', 'dailai_dongzhu', 'wu_tugu', 'mulu_dawang', 'jin_huan_sanjie', 'a_hui_nan', 'mang_ya_chang']
    },
    // === 新增 11 势力 ===
    {
        id: 'zhang_lu', name: '张鲁', color: '#7aaa55', colorLight: '#99cc77',
        title: '师君', description: '汉中道主，五斗米道政教合一',
        // 2城：弘农+上庸（汉中交通要道）
        cities: ['hongnong', 'shangyong'],
        gold: 28000, food: 48000, fame: 50,
        generals: ['zhang_lu', 'yang_ren_zl', 'yang_ang', 'yan_pu', 'zhang_wei_zl']
    },
    {
        id: 'han_sui', name: '韩遂', color: '#cc7744', colorLight: '#ee9966',
        title: '征西将军', description: '西凉枭雄，与马腾争霸凉州',
        // 2城：金城+安定
        cities: ['jincheng', 'anding'],
        gold: 24000, food: 38000, fame: 48,
        generals: ['han_sui', 'cheng_yin_hs', 'hou_xuan', 'ma_wan', 'li_xian_hs']
    },
    {
        id: 'tao_qian', name: '陶谦', color: '#6699aa', colorLight: '#88bbcc',
        title: '徐州牧', description: '仁厚长者，以德守土',
        // 2城：琅琊+广陵（徐州两翼）
        cities: ['langya', 'guangling'],
        gold: 30000, food: 45000, fame: 58,
        generals: ['tao_qian', 'cao_bao', 'zhang_kai', 'xu_dan', 'mi_fang_tq']
    },
    {
        id: 'kong_rong', name: '孔融', color: '#ddcc66', colorLight: '#eedd88',
        title: '北海相', description: '汉末大儒，仁政名士',
        // 2城：北海+济北
        cities: ['beihai', 'jibei'],
        gold: 22000, food: 35000, fame: 62,
        generals: ['kong_rong', 'tai_shici_kr', 'wang_xiu', 'zong_bao', 'liu_kong']
    },
    {
        id: 'zhang_yan', name: '张燕', color: '#778866', colorLight: '#99aa88',
        title: '平难中郎将', description: '百万黑山军，割据河内太行',
        // 2城：河内+上党（太行山区）
        cities: ['henei'],
        gold: 18000, food: 40000, fame: 42,
        generals: ['zhang_yan', 'chu_yan', 'yang_feng_zy', 'hu_cai']
    },
    {
        id: 'gongsun_du', name: '公孙度', color: '#5588aa', colorLight: '#77aacc',
        title: '辽东太守', description: '割据东北，称王辽土',
        // 2城：辽东+玄菟
        cities: ['liaodong', 'xuantu'],
        gold: 22000, food: 32000, fame: 45,
        generals: ['gongsun_du', 'gongsun_kang', 'liu_yi_gsd', 'bei_yan']
    },
    {
        id: 'liu_yao', name: '刘繇', color: '#aa8855', colorLight: '#cc9966',
        title: '扬州刺史', description: '江东旧主，被孙策所逐',
        // 1城：鄱阳（最后的据点）
        cities: ['poyang'],
        gold: 18000, food: 28000, fame: 40,
        generals: ['liu_yao', 'xu_shao', 'zhang_ying', 'chen_heng']
    },
    {
        id: 'shi_xie', name: '士燮', color: '#55aa88', colorLight: '#77ccaa',
        title: '交州牧', description: '岭南霸主，百越归附',
        // 2城：苍梧+南海
        cities: ['cangwu', 'nanhai'],
        gold: 20000, food: 30000, fame: 48,
        generals: ['shi_xie', 'shi_yi', 'shi_wei', 'xu_jing_sx']
    },
    {
        id: 'liu_yu', name: '刘虞', color: '#88bbdd', colorLight: '#aaddff',
        title: '幽州牧', description: '仁政北疆，威服乌桓',
        // 1城：北平（幽州中心）
        cities: ['beiping'],
        gold: 25000, food: 38000, fame: 55,
        generals: ['liu_yu', 'wei_you', 'tian_chou', 'qiu_li']
    },
    {
        id: 'yan_baihu', name: '严白虎', color: '#cc8833', colorLight: '#ee9944',
        title: '东吴德王', description: '会稽豪强，据守荆南',
        // 2城：武陵+桂阳
        cities: ['wuling', 'guiyang'],
        gold: 16000, food: 28000, fame: 35,
        generals: ['yan_baihu', 'yan_yu', 'wang_lang_ybh', 'dong_ci']
    },
    {
        id: 'liu_du', name: '刘度', color: '#aa66aa', colorLight: '#cc88cc',
        title: '荆南太守', description: '偏安荆南，坐拥两郡',
        // 2城：零陵+长沙
        cities: ['lingling', 'changsha'],
        gold: 18000, food: 32000, fame: 38,
        generals: ['liu_du', 'xing_dao_rong', 'bao_long', 'jin_xuan']
    },
];

// 中立/未占领城池（25势力全部分配后暂无中立城）
const NEUTRAL_CITIES = [];

export { FACTIONS_DATA, NEUTRAL_CITIES };
