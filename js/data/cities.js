// 城池数据 - 三国时期主要城池（56城）
const CITIES_DATA = [
    // === 原有 28 城（更新邻居连接）===
    { id: 'luoyang', name: '洛阳', x: 480, y: 280, region: '中原', neighbors: ['changan', 'xuchang', 'hanzhong', 'yecheng', 'hongnong', 'henei', 'shangdang'], population: 80000, agriculture: 70, commerce: 80, defense: 90 },
    { id: 'changan', name: '长安', x: 350, y: 290, region: '关中', neighbors: ['luoyang', 'hanzhong', 'tianshui', 'hongnong', 'anding', 'taiyuan'], population: 70000, agriculture: 65, commerce: 70, defense: 85 },
    { id: 'xuchang', name: '许昌', x: 530, y: 310, region: '中原', neighbors: ['luoyang', 'yecheng', 'wancheng', 'runan', 'chenliu', 'yingchuan'], population: 65000, agriculture: 75, commerce: 75, defense: 80 },
    { id: 'yecheng', name: '邺城', x: 520, y: 220, region: '河北', neighbors: ['luoyang', 'xuchang', 'beiping', 'pingyuan', 'taiyuan', 'henei', 'puyang', 'shangdang'], population: 60000, agriculture: 70, commerce: 65, defense: 75 },
    { id: 'chengdu', name: '成都', x: 250, y: 400, region: '蜀', neighbors: ['hanzhong', 'jiangzhou', 'zitong', 'yuesui', 'yizhou'], population: 75000, agriculture: 80, commerce: 60, defense: 80 },
    { id: 'jianye', name: '建业', x: 620, y: 400, region: '江东', neighbors: ['lujiang', 'wujun', 'chaisang', 'guangling', 'poyang'], population: 70000, agriculture: 70, commerce: 85, defense: 75 },
    { id: 'xiangyang', name: '襄阳', x: 470, y: 370, region: '荆州', neighbors: ['wancheng', 'xinye', 'jiangling', 'changsha', 'shangyong'], population: 55000, agriculture: 65, commerce: 60, defense: 85 },
    { id: 'jiangling', name: '江陵', x: 440, y: 400, region: '荆州', neighbors: ['xiangyang', 'changsha', 'wuling', 'jiangzhou', 'nanjun'], population: 50000, agriculture: 60, commerce: 55, defense: 70 },
    { id: 'changsha', name: '长沙', x: 490, y: 450, region: '荆南', neighbors: ['xiangyang', 'jiangling', 'guiyang', 'wuling', 'nanjun', 'lingling', 'chaisang'], population: 45000, agriculture: 65, commerce: 50, defense: 60 },
    { id: 'beiping', name: '北平', x: 570, y: 150, region: '幽州', neighbors: ['yecheng', 'liaodong', 'pingyuan', 'youbeiping'], population: 40000, agriculture: 50, commerce: 45, defense: 70 },
    { id: 'hanzhong', name: '汉中', x: 330, y: 350, region: '汉中', neighbors: ['changan', 'luoyang', 'chengdu', 'zitong', 'shangyong'], population: 40000, agriculture: 60, commerce: 40, defense: 80 },
    { id: 'wancheng', name: '宛城', x: 490, y: 340, region: '南阳', neighbors: ['xuchang', 'xiangyang', 'xinye', 'yingchuan', 'shangyong'], population: 45000, agriculture: 60, commerce: 55, defense: 65 },
    { id: 'xinye', name: '新野', x: 480, y: 355, region: '南阳', neighbors: ['wancheng', 'xiangyang'], population: 25000, agriculture: 50, commerce: 35, defense: 45 },
    { id: 'runan', name: '汝南', x: 550, y: 340, region: '豫州', neighbors: ['xuchang', 'shouchun', 'lujiang', 'yingchuan'], population: 40000, agriculture: 60, commerce: 50, defense: 55 },
    { id: 'shouchun', name: '寿春', x: 590, y: 350, region: '淮南', neighbors: ['runan', 'lujiang', 'xiapi', 'guangling'], population: 45000, agriculture: 55, commerce: 55, defense: 70 },
    { id: 'lujiang', name: '庐江', x: 600, y: 380, region: '淮南', neighbors: ['shouchun', 'runan', 'jianye', 'chaisang'], population: 35000, agriculture: 55, commerce: 50, defense: 55 },
    { id: 'xiapi', name: '下邳', x: 600, y: 300, region: '徐州', neighbors: ['shouchun', 'pingyuan', 'chenliu', 'langya', 'guangling', 'beihai'], population: 45000, agriculture: 60, commerce: 55, defense: 65 },
    { id: 'pingyuan', name: '平原', x: 560, y: 240, region: '青州', neighbors: ['yecheng', 'beiping', 'xiapi', 'puyang', 'beihai', 'jibei'], population: 40000, agriculture: 60, commerce: 45, defense: 55 },
    { id: 'chenliu', name: '陈留', x: 530, y: 290, region: '兖州', neighbors: ['xuchang', 'xiapi', 'puyang'], population: 40000, agriculture: 60, commerce: 55, defense: 55 },
    { id: 'tianshui', name: '天水', x: 270, y: 300, region: '凉州', neighbors: ['changan', 'wuwei', 'jincheng', 'anding'], population: 30000, agriculture: 45, commerce: 35, defense: 60 },
    { id: 'jiangzhou', name: '江州', x: 310, y: 430, region: '巴蜀', neighbors: ['chengdu', 'jiangling', 'nanzhong', 'yizhou'], population: 30000, agriculture: 55, commerce: 35, defense: 55 },
    { id: 'zitong', name: '梓潼', x: 280, y: 370, region: '蜀', neighbors: ['chengdu', 'hanzhong'], population: 25000, agriculture: 50, commerce: 30, defense: 60 },
    { id: 'wujun', name: '吴郡', x: 650, y: 390, region: '江东', neighbors: ['jianye', 'kuaiji'], population: 45000, agriculture: 65, commerce: 70, defense: 55 },
    { id: 'kuaiji', name: '会稽', x: 670, y: 420, region: '江东', neighbors: ['wujun', 'poyang'], population: 35000, agriculture: 60, commerce: 50, defense: 50 },
    { id: 'chaisang', name: '柴桑', x: 570, y: 400, region: '江东', neighbors: ['jianye', 'lujiang', 'changsha', 'poyang', 'nanjun'], population: 35000, agriculture: 55, commerce: 50, defense: 60 },
    { id: 'guiyang', name: '桂阳', x: 500, y: 480, region: '荆南', neighbors: ['changsha', 'lingling', 'nanhai'], population: 25000, agriculture: 50, commerce: 35, defense: 45 },
    { id: 'wuling', name: '武陵', x: 420, y: 450, region: '荆南', neighbors: ['jiangling', 'changsha', 'lingling', 'cangwu'], population: 25000, agriculture: 50, commerce: 30, defense: 45 },
    { id: 'liaodong', name: '辽东', x: 630, y: 110, region: '幽州', neighbors: ['beiping', 'youbeiping', 'xuantu'], population: 25000, agriculture: 40, commerce: 30, defense: 55 },

    // === 新增 28 城 ===

    // 并州
    { id: 'taiyuan', name: '太原', x: 420, y: 190, region: '并州', neighbors: ['yecheng', 'changan', 'shangdang', 'henei'], population: 45000, agriculture: 55, commerce: 50, defense: 75 },
    { id: 'shangdang', name: '上党', x: 460, y: 220, region: '并州', neighbors: ['taiyuan', 'yecheng', 'luoyang', 'henei'], population: 35000, agriculture: 50, commerce: 40, defense: 70 },

    // 凉州/西域
    { id: 'wuwei', name: '武威', x: 180, y: 260, region: '凉州', neighbors: ['tianshui', 'xiyu', 'jincheng'], population: 30000, agriculture: 40, commerce: 35, defense: 65 },
    { id: 'jincheng', name: '金城', x: 230, y: 275, region: '凉州', neighbors: ['tianshui', 'wuwei', 'anding'], population: 25000, agriculture: 40, commerce: 30, defense: 60 },
    { id: 'anding', name: '安定', x: 290, y: 250, region: '凉州', neighbors: ['changan', 'tianshui', 'jincheng'], population: 25000, agriculture: 45, commerce: 30, defense: 55 },
    { id: 'xiyu', name: '西域', x: 140, y: 230, region: '西域', neighbors: ['wuwei'], population: 15000, agriculture: 25, commerce: 40, defense: 45 },

    // 幽州/辽东
    { id: 'xuantu', name: '玄菟', x: 680, y: 80, region: '幽州', neighbors: ['liaodong'], population: 15000, agriculture: 30, commerce: 20, defense: 50 },
    { id: 'youbeiping', name: '右北平', x: 610, y: 130, region: '幽州', neighbors: ['beiping', 'liaodong'], population: 25000, agriculture: 40, commerce: 30, defense: 60 },

    // 交州/南蛮
    { id: 'nanhai', name: '南海', x: 560, y: 540, region: '交州', neighbors: ['guiyang', 'cangwu', 'lingling'], population: 25000, agriculture: 50, commerce: 45, defense: 45 },
    { id: 'cangwu', name: '苍梧', x: 470, y: 530, region: '交州', neighbors: ['nanhai', 'wuling', 'jiaozhi', 'lingling'], population: 20000, agriculture: 45, commerce: 30, defense: 40 },
    { id: 'jiaozhi', name: '交趾', x: 430, y: 570, region: '交州', neighbors: ['cangwu', 'nanzhong'], population: 20000, agriculture: 50, commerce: 35, defense: 40 },
    { id: 'nanzhong', name: '南中', x: 300, y: 520, region: '南蛮', neighbors: ['jiangzhou', 'jiaozhi', 'yuesui', 'jianningfu'], population: 25000, agriculture: 45, commerce: 25, defense: 55 },
    { id: 'yuesui', name: '越嶲', x: 250, y: 480, region: '南蛮', neighbors: ['chengdu', 'nanzhong', 'jianningfu', 'yizhou'], population: 20000, agriculture: 40, commerce: 20, defense: 50 },
    { id: 'jianningfu', name: '建宁', x: 280, y: 540, region: '南蛮', neighbors: ['nanzhong', 'yuesui'], population: 20000, agriculture: 40, commerce: 20, defense: 50 },

    // 中部填充
    { id: 'puyang', name: '濮阳', x: 540, y: 260, region: '兖州', neighbors: ['chenliu', 'yecheng', 'pingyuan', 'jibei'], population: 35000, agriculture: 55, commerce: 45, defense: 55 },
    { id: 'beihai', name: '北海', x: 600, y: 230, region: '青州', neighbors: ['pingyuan', 'xiapi', 'langya', 'jibei'], population: 35000, agriculture: 55, commerce: 50, defense: 50 },
    { id: 'langya', name: '琅琊', x: 620, y: 270, region: '徐州', neighbors: ['beihai', 'xiapi', 'guangling'], population: 30000, agriculture: 50, commerce: 45, defense: 50 },
    { id: 'guangling', name: '广陵', x: 630, y: 330, region: '徐州', neighbors: ['xiapi', 'shouchun', 'jianye', 'langya'], population: 35000, agriculture: 55, commerce: 55, defense: 55 },
    { id: 'poyang', name: '鄱阳', x: 590, y: 430, region: '江东', neighbors: ['chaisang', 'jianye', 'kuaiji', 'nanjun'], population: 30000, agriculture: 55, commerce: 45, defense: 45 },
    { id: 'lingling', name: '零陵', x: 450, y: 480, region: '荆南', neighbors: ['wuling', 'guiyang', 'cangwu', 'changsha', 'nanhai'], population: 25000, agriculture: 50, commerce: 30, defense: 45 },
    { id: 'yizhou', name: '益州', x: 230, y: 440, region: '巴蜀', neighbors: ['chengdu', 'jiangzhou', 'yuesui'], population: 30000, agriculture: 55, commerce: 30, defense: 55 },
    { id: 'shangyong', name: '上庸', x: 390, y: 340, region: '汉中', neighbors: ['hanzhong', 'xiangyang', 'wancheng', 'hongnong'], population: 25000, agriculture: 45, commerce: 30, defense: 60 },
    { id: 'hongnong', name: '弘农', x: 420, y: 290, region: '关中', neighbors: ['luoyang', 'changan', 'shangyong'], population: 30000, agriculture: 50, commerce: 40, defense: 60 },
    { id: 'henei', name: '河内', x: 480, y: 240, region: '河北', neighbors: ['luoyang', 'yecheng', 'shangdang', 'taiyuan'], population: 35000, agriculture: 55, commerce: 45, defense: 55 },
    { id: 'nanjun', name: '南郡', x: 460, y: 415, region: '荆州', neighbors: ['jiangling', 'changsha', 'chaisang', 'poyang'], population: 30000, agriculture: 55, commerce: 45, defense: 50 },
    { id: 'yingchuan', name: '颍川', x: 510, y: 320, region: '豫州', neighbors: ['xuchang', 'runan', 'wancheng'], population: 40000, agriculture: 60, commerce: 55, defense: 55 },
    { id: 'jibei', name: '济北', x: 560, y: 270, region: '兖州', neighbors: ['puyang', 'pingyuan', 'beihai'], population: 30000, agriculture: 55, commerce: 40, defense: 50 },
];

export default CITIES_DATA;
