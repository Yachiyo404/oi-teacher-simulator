// ==================== 数据定义 ====================

const STUDENT_TEMPLATES = [
  { name: '陈锐', gender: '男', archetype: '神犇',
    algo: 65, math: 70, mental: 60, effort: 55, exp: 40, desc: '初三自学完C++，高一已有省二水平，是班里的标杆' },
  { name: '林小雨', gender: '女', archetype: '卷王',
    algo: 45, math: 60, mental: 45, effort: 80, exp: 25, desc: '天赋一般但极其努力，每天最后一个离开机房' },
  { name: '张浩宇', gender: '男', archetype: '天赋流',
    algo: 55, math: 80, mental: 70, effort: 30, exp: 35, desc: '脑子好使但爱摸鱼，经常在OJ上划水' },
  { name: '王思远', gender: '男', archetype: '学弱',
    algo: 30, math: 45, mental: 40, effort: 50, exp: 15, desc: '基础薄弱，被家长逼来的，需要特别关注' },
  { name: '赵欣然', gender: '女', archetype: '黑马',
    algo: 40, math: 65, mental: 75, effort: 65, exp: 20, desc: '心态极好，总能超常发挥，潜力未知' }
];

const WEEKLY_ACTIONS = [
  // 文化课
  { id: 'teach', name: '精心备课', icon: '📖', category: 'culture',
    cost: { energy: -15 }, effect: { teaching: 5 },
    studentBoost: { algo: [2,4], mental: [-2,0] },
    desc: '深入准备本周课程，提升教学质量' },
  { id: 'report', name: '写教学报告', icon: '📝', category: 'culture',
    cost: { energy: -10 }, effect: { '学校好感': 8 },
    desc: '向校领导汇报竞赛班进展，争取支持' },
  { id: 'buy_book', name: '购置竞赛书籍', icon: '📚', category: 'culture',
    cost: { budget: -10 }, effect: { teaching: 2 },
    studentBoost: { algo: [1,3], math: [1,3], mental: [1,3] },
    desc: '添置最新的OI参考书和学习资料' },
  { id: 'mental_care', name: '心理疏导', icon: '💬', category: 'culture',
    cost: { energy: -10 }, effect: { reputation: 2 },
    studentBoost: { mental: [5,12] },
    desc: '找学生们聊聊，缓解竞赛压力' },
  { id: 'rest', name: '休息调整', icon: '😴', category: 'culture',
    cost: {}, effect: { energy: 30 },
    studentBoost: { mental: [2,5] },
    desc: '给自己放个假，也给学生们喘口气' },
  // 竞赛
  { id: 'mock', name: '组织模拟赛', icon: '🏆', category: 'compete',
    cost: { energy: -20, budget: -5 }, effect: { teaching: 3, reputation: 3 },
    studentBoost: { algo: [3,6], exp: [2,4], mental: [-5,0] },
    desc: '举办一次内部模拟赛，锻炼实战能力' },
  { id: 'algorithm', name: '专题算法课', icon: '🧮', category: 'compete',
    cost: { energy: -20 }, effect: { teaching: 6 },
    studentBoost: { algo: [3,7], exp: [1,3], mental: [-3,0] },
    desc: '集中攻克某个高难度算法专题' },
  { id: 'cf_train', name: 'CF/ATC刷题', icon: '💻', category: 'compete',
    cost: { energy: -12 }, effect: { teaching: 2 },
    studentBoost: { algo: [2,5], effort: [3,6], mental: [-3,2] },
    desc: '带学生在线实战，培养手感' },
  { id: 'tutor', name: '个别辅导', icon: '🎯', category: 'compete',
    cost: { energy: -15 }, effect: { teaching: 2 },
    studentTarget: { algo: [8,15], mental: [3,8] },
    desc: '针对薄弱学生进行一对一辅导' },
  { id: 'outreach', name: '邀请外校交流', icon: '🤝', category: 'compete',
    cost: { energy: -15, budget: -8 }, effect: { reputation: 5, teaching: 3 },
    studentBoost: { algo: [2,5], exp: [3,6] },
    desc: '联系其他学校的竞赛教练，组织联合训练' },
  { id: 'lobby', name: '申请额外经费', icon: '💰', category: 'compete',
    cost: { energy: -10 }, effect: { budget: [10,20], '学校好感': [-5,3] },
    desc: '软磨硬泡向学校要钱，但可能惹恼领导' },
  { id: 'skip', name: '摆烂摸鱼', icon: '🦥', category: 'compete',
    cost: {}, effect: { energy: 15, '学校好感': -5 },
    studentBoost: { mental: [3,8], algo: [-3,0] },
    desc: '这周累了，大家一起摸了吧' },
];

let currentActionTab = 'culture';

const RANDOM_EVENTS = [
  { id: 'parent_call', title: '家长来电',
    text: '王思远的妈妈打来电话："老师，我家孩子最近状态怎么样？他很努力吧？"',
    condition: s => true, weight: 8,
    choices: [
      { text: '如实汇报，建议多鼓励', effect: { '学校好感': 2 },
        studentFx: [{ name: '王思远', mental: 5, effort: 5 }] },
      { text: '打哈哈应付过去', effect: { '学校好感': -2 },
        studentFx: [{ name: '王思远', mental: -5 }] },
    ]
  },
  { id: 'student_burnout', title: '机房深夜的哭声',
    text: '你晚上路过机房，听到里面有人在小声啜泣。推门一看，林小雨趴在键盘上哭了。',
    condition: s => s.students.find(st => st.name === '林小雨')?.stats.mental < 35, weight: 12,
    choices: [
      { text: '带她去吃宵夜，聊聊', effect: { energy: -5 },
        studentFx: [{ name: '林小雨', mental: 15, effort: 5 }] },
      { text: '让她回家休息一天', effect: { energy: -3 },
        studentFx: [{ name: '林小雨', mental: 10, algo: -3 }] },
      { text: '"这点苦都吃不了怎么打OI"', effect: {},
        studentFx: [{ name: '林小雨', mental: -15, effort: 10 }] },
    ]
  },
  { id: 'prodigy_showoff', title: '凡尔赛现场',
    text: '陈锐在群里发了一条消息："这次CF又掉分了，只有2600…" 其他学生心态微妙。',
    condition: s => s.students.find(st => st.name === '陈锐')?.stats.algo > 55, weight: 10,
    choices: [
      { text: '私下提醒陈锐注意措辞', effect: { reputation: 1 },
        studentFx: [{ name: '陈锐', mental: -3 }, { name: '张浩宇', effort: 5 }] },
      { text: '无视，让学生自己消化', effect: {},
        studentFx: [{ name: '张浩宇', mental: -8 }, { name: '王思远', mental: -10 }] },
    ]
  },
  { id: 'school_inspect', title: '校领导突击检查',
    text: '副校长突然推门进机房："你们班最近成绩怎么样？马上要期中了，别光搞竞赛！"',
    condition: s => true, weight: 8,
    choices: [
      { text: '拿出最近的模拟赛成绩单', effect: { '学校好感': [5,10], reputation: 2 }, condition: s => s.teacher.teaching > 40 },
      { text: '承诺会抓紧文化课', effect: { '学校好感': 5 }, },
      { text: '硬刚："竞赛和文化课是两码事"', effect: { '学校好感': -15, reputation: 3 }, },
    ]
  },
  { id: 'secret_admirer', title: '神秘纸条',
    text: '你在机房捡到一张纸条："张浩宇好像喜欢赵欣然…要不要管管？"',
    condition: s => true, weight: 5,
    choices: [
      { text: '假装没看到', effect: {},
        studentFx: [{ name: '张浩宇', mental: 3, algo: -5 }, { name: '赵欣然', mental: 2, algo: -3 }] },
      { text: '找张浩宇聊聊，委婉提醒', effect: { energy: -5 },
        studentFx: [{ name: '张浩宇', mental: -5, algo: 5 }, { name: '赵欣然', mental: 3 }] },
    ]
  },
  { id: 'ccf_policy', title: 'CCF新政！',
    text: 'CCF宣布：今年的NOIP名额缩减30%。校方紧急开会，压力全部压到你身上了。',
    condition: s => s.week > 8, weight: 6,
    choices: [
      { text: '安抚学生，强调实力胜于名额', effect: {},
        get studentFx() { return game.students.map(st => ({ name: st.name, mental: -5, effort: 5 })); } },
      { text: '找关系打听情况（花费经费）', effect: { budget: -10, reputation: 5 }, condition: s => s.teacher.budget > 10,
        get studentFx() { return game.students.map(st => ({ name: st.name, mental: 2 })); } },
    ]
  },
  { id: 'machine_broke', title: '机房蓝屏！',
    text: '竞赛班的服务器突然崩了，OJ评测队列全挂。学生们面面相觑。',
    condition: s => true, weight: 7,
    choices: [
      { text: '自掏腰包紧急维修', effect: { budget: -12, teaching: 2 }, condition: s => s.teacher.budget > 12,
        get studentFx() { return game.students.map(st => ({ name: st.name, mental: 3 })); } },
      { text: '找校方报修（等一周）', effect: {},
        get studentFx() { return game.students.map(st => ({ name: st.name, algo: -5, mental: -3 })); } },
      { text: '让学生自己修（陈锐出手）', effect: {},
        studentFx: [{ name: '陈锐', algo: 5, exp: 5, mental: 3 }, { name: '张浩宇', algo: 3 }] },
    ]
  },
  { id: 'transfer_offer', title: '挖角电话',
    text: '某名校打电话来："陈锐很有天赋，转来我们学校吧，我们出全额奖学金。"',
    condition: s => s.students.find(st => st.name === '陈锐')?.stats.algo > 60, weight: 5,
    choices: [
      { text: '断然拒绝，这是我们的学生', effect: { reputation: 8 },
        studentFx: [{ name: '陈锐', mental: -5 }] },
      { text: '和学生家长商量', effect: { '学校好感': -5 },
        studentFx: [{ name: '陈锐', mental: 3 }] },
    ]
  },
  { id: 'oier_marathon', title: '通宵刷题马拉松',
    text: '几个学生自发组织周末通宵刷题。管还是不管？',
    condition: s => s.students.find(st => st.name === '林小雨')?.stats.effort > 70, weight: 8,
    choices: [
      { text: '陪他们通宵！', effect: { energy: -25, teaching: 3 },
        get studentFx() { return game.students.filter(st => st.stats.effort > 60).map(st => ({ name: st.name, algo: 5, mental: -8, effort: 3 })); } },
      { text: '强制解散，安排健康作息', effect: {},
        get studentFx() { return game.students.map(st => ({ name: st.name, mental: 5, effort: -3 })); } },
    ]
  },
  { id: 'award_ceremony', title: '校际表彰大会',
    text: '教育局举办年度竞赛表彰大会，你的学生在列。需要准备发言。',
    condition: s => s.teacher.reputation > 30, weight: 6,
    choices: [
      { text: '把功劳分给学生', effect: { reputation: 8, '学校好感': 5 },
        get studentFx() { return game.students.map(st => ({ name: st.name, mental: 5, effort: 5 })); } },
      { text: '强调自己的指导付出', effect: { reputation: 15, '学校好感': 3 },
        get studentFx() { return game.students.map(st => ({ name: st.name, mental: -3 })); } },
    ]
  },
  { id: 'cheating_rumor', title: '作弊风波',
    text: '有人在贴吧匿名发帖：竞赛班在内部模拟赛作弊。帖子已经传到校领导那里了。',
    condition: s => s.teacher.reputation > 25, weight: 5,
    choices: [
      { text: '公开所有模拟赛成绩和代码', effect: { reputation: -2, '学校好感': 5 } },
      { text: '冷处理，等风波过去', effect: { reputation: -10, '学校好感': -3 } },
    ]
  },
];

const COMPETITIONS = [
  { id: 'noip_junior', name: 'NOIP入门组', week: 10, minWeek: 10,
    desc: '面向初中生的入门级比赛', baseReward: { reputation: 5 }, multiFactor: 0.3 },
  { id: 'noip_senior', name: 'NOIP提高组', week: 20, minWeek: 20,
    desc: '省一等奖是通往省选的敲门砖', baseReward: { reputation: 12 }, multiFactor: 0.5 },
  { id: 'provincial', name: '省队选拔', week: 30, minWeek: 30,
    desc: '选拔省队成员参加NOI', baseReward: { reputation: 20 }, multiFactor: 0.6 },
  { id: 'noi', name: 'NOI全国决赛', week: 40, minWeek: 40,
    desc: '梦想的舞台，金银铜牌在此一战', baseReward: { reputation: 35 }, multiFactor: 0.7 },
  { id: 'noip_senior2', name: 'NOIP提高组（第二年）', week: 50, minWeek: 50,
    desc: '第二年的提高组，学生们更成熟了', baseReward: { reputation: 15 }, multiFactor: 0.55 },
  { id: 'provincial2', name: '省队选拔（第二年）', week: 58, minWeek: 58,
    desc: '最后的冲刺机会', baseReward: { reputation: 25 }, multiFactor: 0.65 },
  { id: 'noi2', name: 'NOI全国决赛（第二年）', week: 64, minWeek: 64,
    desc: '终点。两年心血，在此一搏。', baseReward: { reputation: 40 }, multiFactor: 0.8, isFinal: true },
];

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_gold', name: '🥇 开门红', desc: '首次有学生在一场比赛中获得一等奖', check: (s, result) => result.students.some(r => r.result.includes('一等奖')) },
  { id: 'all_medal', name: '🏅 全员获奖', desc: '一场比赛中所有学生都获得奖项', check: (s, result) => result.students.every(r => r.result !== '❌ 未获奖') },
  { id: 'three_gold', name: '🌟 三金在手', desc: '一场比赛中有3人及以上获得一等奖', check: (s, result) => result.students.filter(r => r.result.includes('一等奖')).length >= 3 },
  { id: 'avg_algo_70', name: '💪 训练有素', desc: '全班平均算法水平达到70', check: (s) => s.students.reduce((a, st) => a + st.stats.algo, 0) / s.students.length >= 70 },
  { id: 'avg_algo_85', name: '🔥 传奇之师', desc: '全班平均算法水平达到85', check: (s) => s.students.reduce((a, st) => a + st.stats.algo, 0) / s.students.length >= 85 },
  { id: 'mental_all_70', name: '😊 快乐OI', desc: '全班心理状态均不低于70', check: (s) => s.students.every(st => st.stats.mental >= 70) },
  { id: 'mental_all_30', name: '💀 压力锅', desc: '全班心理状态均低于30', check: (s) => s.students.every(st => st.stats.mental < 30) },
  { id: 'budget_80', name: '💰 经费充足', desc: '经费达到80以上', check: (s) => s.teacher.budget >= 80 },
  { id: 'reputation_80', name: '👑 声名远扬', desc: '声望达到80以上', check: (s) => s.teacher.reputation >= 80 },
  { id: 'school_0', name: '⚡ 彻底决裂', desc: '校方好感降为0', check: (s) => s.teacher.schoolFavor <= 0 },
  { id: 'school_100', name: '🤝 校长亲信', desc: '校方好感达到100', check: (s) => s.teacher.schoolFavor >= 100 },
  { id: 'no_rest', name: '⚡ 永动机', desc: '连续8周没有选择休息调整', check: (s) => s._noRestStreak >= 8 || false },
  { id: 'all_skip', name: '🦥 摸鱼专家', desc: '一周之内三次全选摆烂', check: (s, result, context) => context && context.allSkip },
];

// ==================== 游戏引擎 ====================

const TOTAL_WEEKS = 64; // 2 years, 32 weeks each
const ACTIONS_PER_WEEK = 3;
const SEMESTER_NAMES = ['第一学年上学期', '第一学年下学期', '第二学年上学期', '第二学年下学期'];

let game = null;
let currentDifficulty = 'normal';

const DIFFICULTIES = {
  easy: {
    name: '佛系带班', icon: '🌱',
    actionsPerWeek: 4,
    studentStatMul: 1.3,
    energyCostMul: 0.8,
    compThresholdMul: 0.85,
    eventChance: 0.28,
    teacherBonus: { energy: 20, budget: 15, schoolFavor: 10 },
    studentBonus: { algo: 8, math: 5, mental: 10, effort: 5, exp: 5 },
  },
  normal: {
    name: '正常带班', icon: '📋',
    actionsPerWeek: 3,
    studentStatMul: 1.0,
    energyCostMul: 1.0,
    compThresholdMul: 1.0,
    eventChance: 0.35,
    teacherBonus: {},
    studentBonus: {},
  },
  hardish: {
    name: '内卷先锋', icon: '⚔️',
    actionsPerWeek: 3,
    studentStatMul: 0.9,
    energyCostMul: 1.1,
    compThresholdMul: 1.1,
    eventChance: 0.38,
    teacherBonus: { energy: -5, budget: -5, schoolFavor: -5 },
    studentBonus: { algo: -3, math: -2, mental: -3, effort: -2, exp: -2 },
  },
  hard: {
    name: '死亡冲锋', icon: '🔥',
    actionsPerWeek: 2,
    studentStatMul: 0.75,
    energyCostMul: 1.25,
    compThresholdMul: 1.2,
    eventChance: 0.45,
    teacherBonus: { energy: -15, budget: -10, schoolFavor: -10 },
    studentBonus: { algo: -8, math: -5, mental: -8, effort: -5, exp: -5 },
  },
  hell: {
    name: '地狱炼狱', icon: '💀',
    actionsPerWeek: 2,
    studentStatMul: 0.6,
    energyCostMul: 1.5,
    compThresholdMul: 1.4,
    eventChance: 0.55,
    teacherBonus: { energy: -25, budget: -15, schoolFavor: -20 },
    studentBonus: { algo: -15, math: -10, mental: -15, effort: -10, exp: -8 },
  },
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function randRange(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }

function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function initGame() {
  const diff = DIFFICULTIES[currentDifficulty];
  const teacher = { teaching: 50, reputation: 20, energy: 100, budget: 30, schoolFavor: 50 };
  for (const [k, v] of Object.entries(diff.teacherBonus)) {
    teacher[k] = clamp((teacher[k] || 0) + v, 0, 100);
  }
  const students = STUDENT_TEMPLATES.map(t => {
    const stats = { algo: t.algo, math: t.math, mental: t.mental, effort: t.effort, exp: t.exp };
    for (const [k, v] of Object.entries(diff.studentBonus)) {
      stats[k] = clamp(stats[k] + v, 0, 100);
    }
    return { name: t.name, archetype: t.archetype, desc: t.desc, stats };
  });
  game = {
    week: 1,
    semester: 1,
    difficulty: currentDifficulty,
    actionsLeft: diff.actionsPerWeek,
    ended: false,
    endingType: null,
    teacher,
    students,
    history: [],
    achievements: [],
    competitionsDone: [],
    eventsSeen: [],
    weeklyLog: [],
    _noRestStreak: 0,
    _skipCount: 0,
  };
}

function startGame() {
  showScreen('difficulty-screen');
  checkSaveExists();
}

function selectDifficulty(diff) {
  currentDifficulty = diff;
  initGame();
  showScreen('intro-screen');
}

function beginGame() {
  showScreen('game-screen');
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  addLog('system', `${diff.icon} 难度：${diff.name} | 每周${diff.actionsPerWeek}次行动`);
  renderAll();
  saveGame();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function renderAll() {
  if (game.ended) { showEnding(); return; }
  renderStats();
  renderStudents();
  renderActions();
  renderLog();
  renderInfo();
  renderAchievements();
}

function renderStats() {
  const t = game.teacher;
  const setStat = (id, val, max) => {
    document.getElementById('v-' + id).textContent = Math.round(val);
    document.getElementById('b-' + id).style.width = Math.min(val / max * 100, 100) + '%';
  };
  setStat('teaching', t.teaching, 100);
  setStat('reputation', t.reputation, 100);
  setStat('energy', t.energy, 100);
  setStat('budget', t.budget, 100);
  setStat('school', t.schoolFavor, 100);
  document.getElementById('v-actions').textContent = game.actionsLeft;
}

function renderInfo() {
  document.getElementById('info-semester').textContent = SEMESTER_NAMES[game.semester - 1];
  document.getElementById('info-week').textContent = '第' + game.week + '周';
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  document.getElementById('info-action').textContent = '剩余行动：' + game.actionsLeft + '/' + diff.actionsPerWeek;
}

function renderAchievements() {
  const container = document.getElementById('achievements-list');
  if (game.achievements.length === 0) {
    container.innerHTML = '<span style="font-size:0.75em;color:#555">暂无成就</span>';
  } else {
    container.innerHTML = game.achievements.map(a =>
      `<span class="achievement-badge" title="${a.desc}">${a.name}</span>`
    ).join('');
  }
}

function getMoodIcon(mental) {
  if (mental >= 75) return '😄'; if (mental >= 55) return '🙂';
  if (mental >= 35) return '😐'; if (mental >= 20) return '😟';
  return '😭';
}

function renderStudents() {
  const list = document.getElementById('students-list');
  list.innerHTML = game.students.map(s => {
    const st = s.stats;
    const stressClass = st.mental < 30 ? 'stress-high' : '';
    return `<div class="student-card">
      <span class="s-name">${s.name}</span>
      <span class="s-stats">
        <span>🧠算法<span class="${st.algo >= 80 ? 'score-high' : ''}">${st.algo}</span></span>
        <span>📐数学${st.math}</span>
        <span>💪努力${st.effort}</span>
        <span>🏅经验${st.exp}</span>
      </span>
      <span class="s-mood ${stressClass}" title="心理状态: ${st.mental}">${getMoodIcon(st.mental)}</span>
    </div>`;
  }).join('');
}

function switchActionTab(tab) {
  currentActionTab = tab;
  document.getElementById('tab-culture').classList.toggle('active', tab === 'culture');
  document.getElementById('tab-compete').classList.toggle('active', tab === 'compete');
  renderActions();
}

function renderActions() {
  const grid = document.getElementById('actions-grid');
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  document.getElementById('actions-header').textContent = `📋 本周行动（选择${diff.actionsPerWeek}项）`;
  const available = game.actionsLeft > 0;
  const filtered = WEEKLY_ACTIONS.filter(a => a.category === currentActionTab);
  grid.innerHTML = filtered.map(a => {
    const canAfford = checkActionCost(a);
    const disabled = !available || !canAfford;
    return `<button class="action-btn" ${disabled ? 'disabled' : ''}
      onclick="doAction('${a.id}')">
      <div class="action-name">${a.icon} ${a.name}</div>
      <div class="action-cost">${a.desc}</div>
    </button>`;
  }).join('');
}

function checkActionCost(action) {
  const t = game.teacher;
  const cost = action.cost;
  if (cost.energy && t.energy + cost.energy < 0) return false;
  if (cost.budget && t.budget + cost.budget < 0) return false;
  return true;
}

function doAction(actionId) {
  if (game.actionsLeft <= 0 || game.ended) return;
  const action = WEEKLY_ACTIONS.find(a => a.id === actionId);
  if (!action) return;

  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  // Apply teacher effects
  applyEffects(game.teacher, action.effect);
  // Apply energy cost with difficulty multiplier
  const scaledCost = {};
  for (const [k, v] of Object.entries(action.cost)) {
    scaledCost[k] = k === 'energy' ? Math.round(v * diff.energyCostMul) : v;
  }
  applyEffects(game.teacher, scaledCost);

  // Apply student effects (scaled by difficulty)
  if (action.studentBoost) {
    for (const st of game.students) {
      for (const [key, range] of Object.entries(action.studentBoost)) {
        const raw = randRange(range[0], range[1]);
        const scaled = Math.round(raw * diff.studentStatMul);
        st.stats[key] = clamp(st.stats[key] + scaled, 0, 100);
      }
    }
  }
  if (action.studentTarget) {
    // Target lowest-algo student and lowest-mental student
    const byAlgo = [...game.students].sort((a,b) => a.stats.algo - b.stats.algo);
    const byMental = [...game.students].sort((a,b) => a.stats.mental - b.stats.mental);
    const targets = [byAlgo[0]];
    if (byMental[0].name !== byAlgo[0].name) targets.push(byMental[0]);
    for (const tgt of targets) {
      for (const [key, range] of Object.entries(action.studentTarget)) {
        const raw = randRange(range[0], range[1]);
        const scaled = Math.round(raw * diff.studentStatMul);
        tgt.stats[key] = clamp(tgt.stats[key] + scaled, 0, 100);
      }
    }
  }

  // Track no-rest streak and skip count
  if (actionId === 'rest') {
    game._noRestStreak = 0;
  } else {
    game._noRestStreak = (game._noRestStreak || 0) + 1;
  }
  if (actionId === 'skip') {
    game._skipCount = (game._skipCount || 0) + 1;
  } else if (actionId !== 'skip') {
    game._skipCount = 0;
  }

  // Clamp all
  game.teacher.teaching = clamp(game.teacher.teaching, 0, 100);
  game.teacher.reputation = clamp(game.teacher.reputation, 0, 100);
  game.teacher.energy = clamp(game.teacher.energy, 0, 100);
  game.teacher.budget = clamp(game.teacher.budget, 0, 100);
  game.teacher.schoolFavor = clamp(game.teacher.schoolFavor, 0, 100);

  addLog('system', `${action.icon} 你选择了：${action.name}`);

  game.actionsLeft--;

  // Check achievements mid-week
  checkAchievements(null, null);

  if (game.actionsLeft <= 0) {
    // End of week — check all-skip achievement
    if (game._skipCount >= 3) {
      checkAchievements(null, { allSkip: true });
    }
    game._skipCount = 0;

    // Save after week ends
    saveGame();
    setTimeout(() => endWeek(), 300);
  }

  renderAll();
}

function showWeekTransition() {
  const sem = SEMESTER_NAMES[game.semester - 1];
  const el = document.getElementById('week-transition');
  document.getElementById('wt-week').textContent = '📅 第 ' + game.week + ' 周';
  document.getElementById('wt-sub').textContent = sem;
  el.classList.remove('active');
  void el.offsetWidth; // reflow
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 1300);
}

function endWeek() {
  // Check competitions
  const comp = COMPETITIONS.find(c => c.week === game.week && !game.competitionsDone.includes(c.id));
  if (comp) {
    triggerCompetition(comp);
    return;
  }

  // Random event (chance scaled by difficulty)
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  const availEvents = RANDOM_EVENTS.filter(e =>
    !game.eventsSeen.includes(e.id + '_' + game.week) &&
    e.condition(game) &&
    Math.random() < diff.eventChance
  );
  if (availEvents.length > 0) {
    triggerEvent(randPick(availEvents));
    return;
  }

  advanceWeek();
}

function triggerCompetition(comp) {
  game.competitionsDone.push(comp.id);
  const results = evaluateCompetition(comp);

  // Build competition display in modal
  let html = `<h2>🏆 ${comp.name}</h2>`;
  html += `<p class="desc">第${game.week}周 — ${comp.desc}</p>`;
  html += `<div style="margin-bottom:8px">${results.students.map(r =>
    `<div class="comp-result">
      ${r.name}：<b style="color:${r.color}">${r.result}</b>
      <span style="font-size:0.75em;color:#8899aa">(估值${Math.round(r.score)})</span>
    </div>`
  ).join('')}</div>`;
  html += `<div class="comp-summary">📊 ${results.description}</div>`;

  // Apply competition effects
  for (const r of results.students) {
    const st = game.students.find(s => s.name === r.name);
    if (st) {
      st.stats.algo = clamp(st.stats.algo + r.algoGain, 0, 100);
      st.stats.exp = clamp(st.stats.exp + r.expGain, 0, 100);
      st.stats.mental = clamp(st.stats.mental + r.mentalChange, 0, 100);
    }
  }

  const repGain = results.baseRep * (1 + results.topPerf * comp.multiFactor);
  game.teacher.reputation = clamp(game.teacher.reputation + Math.round(repGain), 0, 100);
  addLog('competition', `🏆 ${comp.name}：${results.description}`);

  // Check achievements
  checkAchievements(results, null);

  // Show competition as a modal with "继续" button
  html += `<div style="margin-top:16px;text-align:center">
    <button class="btn primary" onclick="closeCompModal('${comp.id}')">继续</button>
  </div>`;
  document.getElementById('event-content').innerHTML = html;
  document.getElementById('event-modal').classList.add('active');

  // Store comp data for closing handler
  game._pendingComp = comp;
}

function closeCompModal(compId) {
  document.getElementById('event-modal').classList.remove('active');
  const comp = game._pendingComp;
  game._pendingComp = null;

  if (comp && comp.isFinal) {
    setTimeout(() => determineEnding(), 300);
    return;
  }

  advanceWeek();
}

function evaluateCompetition(comp) {
  const diff = DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
  const thMul = diff.compThresholdMul;
  const students = game.students.map(s => {
    const st = s.stats;
    const score = st.algo * 0.5 + st.math * 0.15 + st.exp * 0.2 + st.effort * 0.1 + st.mental * 0.05;
    const luck = randRange(-10, 10);
    const total = score + luck;
    let result, color, algoGain, expGain, mentalChange;
    if (total >= Math.round(70 * thMul)) { result = '🥇 一等奖/金牌'; color = '#ffcc00'; algoGain = randRange(5, 10); expGain = randRange(5, 10); mentalChange = randRange(5, 15); }
    else if (total >= Math.round(55 * thMul)) { result = '🥈 二等奖/银牌'; color = '#c0c0c0'; algoGain = randRange(3, 7); expGain = randRange(3, 7); mentalChange = randRange(0, 10); }
    else if (total >= Math.round(40 * thMul)) { result = '🥉 三等奖/铜牌'; color = '#cd7f32'; algoGain = randRange(1, 4); expGain = randRange(1, 4); mentalChange = randRange(-5, 5); }
    else { result = '❌ 未获奖'; color = '#ff5a5a'; algoGain = randRange(0, 2); expGain = randRange(0, 2); mentalChange = randRange(-15, -5); }
    return { name: s.name, result, color, algo: st.algo, exp: st.exp, mental: st.mental, algoGain, expGain, mentalChange, score: total };
  });

  const topPerf = students.filter(s => s.score >= 70).length;
  const medaled = students.filter(s => s.score >= 40).length;
  return {
    students,
    topPerf,
    medaled,
    baseRep: comp.baseReward.reputation,
    description: `${medaled}/${students.length}人获奖，${topPerf}人高分`,
  };
}

function triggerEvent(event) {
  game.eventsSeen.push(event.id + '_' + game.week);
  const modal = document.getElementById('event-modal');
  const content = document.getElementById('event-content');
  let html = `<h2>📢 ${event.title}</h2>`;
  html += `<p class="desc">${event.text}</p>`;
  html += `<div class="choices">`;
  event.choices.forEach((ch, i) => {
    const fxDesc = describeChoiceEffects(ch);
    const disabled = ch.condition && !ch.condition(game) ? 'disabled' : '';
    html += `<button class="choice-btn" ${disabled} onclick="resolveEvent('${event.id}', ${i})">
      <div class="c-title">${ch.text}</div>
      <div class="c-effect">${fxDesc}</div>
    </button>`;
  });
  html += `</div>`;
  content.innerHTML = html;
  modal.classList.add('active');
}

function describeChoiceEffects(ch) {
  const parts = [];
  if (ch.effect) {
    for (const [k, v] of Object.entries(ch.effect)) {
      if (Array.isArray(v)) parts.push(`${k}${v[0] >= 0 ? '+' : ''}${v[0]}~${v[1]}`);
      else parts.push(`${k}${v > 0 ? '+' : ''}${v}`);
    }
  }
  if (ch.studentFx) {
    const fx = typeof ch.studentFx === 'function' ? ch.studentFx(game) : ch.studentFx;
    if (fx && fx.length > 0) {
      parts.push(fx.map(s => s.name).join('、') + '受影响');
    }
  }
  return parts.join(' · ') || '无显著影响';
}

function resolveEvent(eventId, choiceIndex) {
  const event = RANDOM_EVENTS.find(e => e.id === eventId);
  const choice = event.choices[choiceIndex];
  if (choice.condition && !choice.condition(game)) return;

  // Apply effects
  if (choice.effect) applyEffects(game.teacher, choice.effect);

  // Resolve studentFx — supports both arrays and getter functions
  const fx = typeof choice.studentFx === 'function' ? choice.studentFx() : choice.studentFx;
  if (fx) {
    for (const f of fx) {
      const st = game.students.find(s => s.name === f.name);
      if (!st) continue;
      for (const [k, v] of Object.entries(f)) {
        if (k === 'name') continue;
        st.stats[k] = clamp(st.stats[k] + v, 0, 100);
      }
    }
  }

  // Clamp
  game.teacher.teaching = clamp(game.teacher.teaching, 0, 100);
  game.teacher.reputation = clamp(game.teacher.reputation, 0, 100);
  game.teacher.energy = clamp(game.teacher.energy, 0, 100);
  game.teacher.budget = clamp(game.teacher.budget, 0, 100);
  game.teacher.schoolFavor = clamp(game.teacher.schoolFavor, 0, 100);

  addLog('event', `📢 ${event.title} — ${choice.text}`);
  document.getElementById('event-modal').classList.remove('active');

  // Check achievements after event resolution
  checkAchievements(null, null);
  saveGame();

  setTimeout(() => advanceWeek(), 300);
}

function advanceWeek() {
  game.actionsLeft = (DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal).actionsPerWeek;
  game.week++;

  if (game.week > TOTAL_WEEKS) {
    determineEnding();
    return;
  }

  updateSemester();
  renderAll();
  showWeekTransition();
}

function updateSemester() {
  if (game.week <= 16) game.semester = 1;
  else if (game.week <= 32) game.semester = 2;
  else if (game.week <= 48) game.semester = 3;
  else game.semester = 4;
}

function applyEffects(target, effects) {
  if (!effects) return;
  const keyMap = { '学校好感': 'schoolFavor' };
  for (const [key, value] of Object.entries(effects)) {
    const mapped = keyMap[key] || key;
    if (Array.isArray(value)) {
      target[mapped] = (target[mapped] || 0) + randRange(value[0], value[1]);
    } else {
      target[mapped] = (target[mapped] || 0) + value;
    }
  }
}

function checkAchievements(compResult, context) {
  if (!game) return;
  let gained = false;
  for (const ach of ACHIEVEMENTS) {
    if (game.achievements.some(a => a.id === ach.id)) continue; // already earned
    let pass = false;
    if (ach.id === 'all_skip') {
      pass = context && context.allSkip;
    } else if (compResult) {
      pass = ach.check(game, compResult, context);
    } else {
      // Skip competition-dependent achievements when no compResult
      try {
        pass = ach.check(game, null, context);
      } catch(e) {
        pass = false;
      }
    }
    if (pass) {
      game.achievements.push({ id: ach.id, name: ach.name, desc: ach.desc });
      addLog('achievement', `🏅 获得成就：${ach.name}`);
      gained = true;
      savePersistentAchievement(ach.id);
    }
  }
  if (gained) renderAchievements();
}

// Persistent achievement storage (across games)
function getPersistentAchievements() {
  try {
    return JSON.parse(localStorage.getItem('oi_teacher_achievements') || '[]');
  } catch(e) { return []; }
}

function savePersistentAchievement(achId) {
  const all = getPersistentAchievements();
  if (!all.includes(achId)) {
    all.push(achId);
    try { localStorage.setItem('oi_teacher_achievements', JSON.stringify(all)); } catch(e) {}
  }
}

let _achReturnTo = 'title';

function showAchievements(from) {
  _achReturnTo = from || 'title';
  const unlocked = getPersistentAchievements();
  const total = ACHIEVEMENTS.length;
  const unlockedCount = unlocked.length;
  document.getElementById('ach-counter').textContent = `已解锁 ${unlockedCount} / ${total}`;
  const grid = document.getElementById('ach-grid');
  grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlocked.includes(ach.id);
    const cls = isUnlocked ? 'unlocked' : 'locked';
    const icon = isUnlocked ? ach.name.split(' ')[0] : '🔒';
    const name = isUnlocked ? ach.name : '???';
    const desc = isUnlocked ? ach.desc : '尚未解锁';
    const statusText = isUnlocked ? '✅ 已解锁' : '🔒 未解锁';
    const statusCls = isUnlocked ? 'done' : 'lock';
    return `<div class="ach-item ${cls}">
      <div class="ach-icon">${icon}</div>
      <div class="ach-info">
        <div class="ach-name">${name}</div>

        <div class="ach-desc">${desc}</div>
      </div>
      <div class="ach-status ${statusCls}">${statusText}</div>
    </div>`;
  }).join('');
  showScreen('achievements-screen');
}

function closeAchievements() {
  if (_achReturnTo === 'game' && game && !game.ended) {
    showScreen('game-screen');
  } else {
    showScreen('title-screen');
    checkSaveExists();
  }
}

function getStudent(name) { return game.students.find(s => s.name === name); }

function addLog(type, msg) {
  game.history.push({ week: game.week, type, msg });
  // Keep history bounded
  if (game.history.length > 200) {
    game.history = game.history.slice(-150);
  }
  if (game.weeklyLog.length >= 50) game.weeklyLog.shift();
  game.weeklyLog.push({ week: game.week, type, msg });
  renderLog();
}

function renderLog() {
  const area = document.getElementById('log-area');
  if (game.weeklyLog.length === 0) {
    area.innerHTML = '<div style="color:#666;text-align:center;padding:40px">📋 事件日志将显示在这里</div>';
    return;
  }
  area.innerHTML = game.weeklyLog.slice().reverse().map(e =>
    `<div class="log-entry ${e.type}">
      <span class="time">[第${e.week}周]</span>${e.msg}
    </div>`
  ).join('');
  // Auto-scroll to top (newest first, so top)
  area.scrollTop = 0;
}

// ==================== 结局系统 ====================

function determineEnding() {
  game.ended = true;
  const t = game.teacher;
  const bestStudent = [...game.students].sort((a, b) => b.stats.algo - a.stats.algo)[0];
  const avgAlgo = Math.round(game.students.reduce((s, st) => s + st.stats.algo, 0) / game.students.length);
  const avgMental = Math.round(game.students.reduce((s, st) => s + st.stats.mental, 0) / game.students.length);

  let ending;
  if (bestStudent.stats.algo >= 90 && t.reputation >= 70) {
    ending = { id: 'legend', title: '🌟 传奇教练',
      desc: `你的班级成为全省标杆。${bestStudent.name}拿下NOI金牌，保送清华。其他学生也各有斩获。校长亲自给你涨了工资，你成为了OI圈内人人敬仰的传奇教练。` };
  } else if (bestStudent.stats.algo >= 75 && t.reputation >= 50) {
    ending = { id: 'good', title: '🏅 金牌教练',
      desc: `在你的带领下，${bestStudent.name}拿下NOI银牌，多名学生获得省一等奖。班级整体实力在全省名列前茅。虽然不是完美结局，但这两年你问心无愧。` };
  } else if (t.reputation >= 60 && t.schoolFavor >= 50) {
    ending = { id: 'stable', title: '📋 稳定收官',
      desc: `学生成绩中规中矩，但你维护好了和校方的关系，拿到了稳定的经费。竞赛班得以延续，下一届还有机会。平平淡淡才是真。` };
  } else if (bestStudent.stats.algo >= 70 && t.schoolFavor < 30) {
    ending = { id: 'fired', title: '🔥 燃烧殆尽',
      desc: `你的学生确实进步很大，${bestStudent.name}甚至拿了NOI铜牌。但你不惜代价和校方对抗，最终被调离竞赛班。"人走了，但成绩留下了。"——你是这样安慰自己的。` };
  } else if (avgMental < 30) {
    ending = { id: 'burnout', title: '😭 全员崩溃',
      desc: `过度压榨让学生们集体崩溃。机房再也没有人来刷题了。你看着空荡荡的教室，想起那些曾经眼中有光的孩子。教育不是这样的。` };
  } else if (t.budget < 5 && avgAlgo < 40) {
    ending = { id: 'poor', title: '💸 一穷二白',
      desc: `经费被砍光，没有参考书，没有OJ会员，没有机房维护。两年过去了，学生们的主要成就大概是学会了在纸上写代码。竞赛班被校长无限期停办。` };
  } else if (t.energy < 20 && t.teaching < 30) {
    ending = { id: 'exhausted', title: '🛌 摆烂之王',
      desc: `你太累了。这两年来你几乎没认真教过一天书。学生们自生自灭，有人放弃了OI，有人靠自学勉强维持。你开始反思：当初为什么要接这个班？` };
  } else {
    ending = { id: 'mid', title: '🙂 还行吧',
      desc: `两年结束，班级成绩不好不坏。有几个省二，没有省一。校方不太满意但也懒得换人。下学期你可能还在这个位置上，也可能不在了。生活还在继续。` };
  }

  game.endingType = ending;
  game.history.push({ week: game.week, type: 'system', msg: '🏁 游戏结束：' + ending.title });
  showEnding();
}

function showEnding() {
  const ending = game.endingType;
  const achievementsHTML = game.achievements.length > 0
    ? '<div style="margin-top:12px">' + game.achievements.map(a =>
        `<span class="achievement-badge">${a.name}</span>`).join(' ') + '</div>'
    : '';
  document.getElementById('ending-screen').innerHTML = `
    <h2>🏁 两年期满</h2>
    <div class="ending-title">${ending.title}</div>
    <div class="ending-desc">${ending.desc}</div>
    <div class="stats-summary">
      难度：${DIFFICULTIES[game.difficulty || 'normal'].icon} ${DIFFICULTIES[game.difficulty || 'normal'].name}<br>
      教学水平: ${Math.round(game.teacher.teaching)} | 声望: ${Math.round(game.teacher.reputation)}<br>
      校方好感: ${Math.round(game.teacher.schoolFavor)} | 剩余经费: ${Math.round(game.teacher.budget)}<br>
      学生榜: ${game.students.map(s => `${s.name}(算法${s.stats.algo})`).join(' · ')}
    </div>
    ${achievementsHTML}
    <button class="btn primary" onclick="startGame()">再来一次</button>
  `;
  showScreen('ending-screen');
}

// ==================== 存档系统 ====================

function saveGame() {
  if (!game || game.ended) return;
  try {
    const toSave = JSON.parse(JSON.stringify(game));
    // Clean up runtime-only fields
    delete toSave._pendingComp;
    delete toSave._skipCount;
    localStorage.setItem('oi_teacher_save', JSON.stringify(toSave));
  } catch(e) { /* quota exceeded, silent fail */ }
}

function loadGame() {
  const raw = localStorage.getItem('oi_teacher_save');
  if (!raw) return;
  try {
    game = JSON.parse(raw);
    game._noRestStreak = game._noRestStreak || 0;
    game._skipCount = 0;
    // Backward compatibility: old saves default to normal
    if (!game.difficulty) game.difficulty = 'normal';
    if (!DIFFICULTIES[game.difficulty]) game.difficulty = 'normal';
    currentDifficulty = game.difficulty;
    // Don't load finished games
    if (game.ended) {
      alert('这个存档已经通关了，请开始新游戏');
      localStorage.removeItem('oi_teacher_save');
      game = null;
      checkSaveExists();
      return;
    }
    showScreen('game-screen');
    renderAll();
    addLog('system', '📂 存档已加载');
  } catch (e) { alert('存档损坏'); }
}

function resetGame() {
  if (confirm('确定要重新开始吗？当前进度将丢失。')) {
    localStorage.removeItem('oi_teacher_save');
    initGame();
    showScreen('title-screen');
    checkSaveExists();
  }
}

function checkSaveExists() {
  const raw = localStorage.getItem('oi_teacher_save');
  const has = !!raw;
  document.getElementById('btn-load').disabled = !has;
  if (has) {
    try {
      const save = JSON.parse(raw);
      const diffName = DIFFICULTIES[save.difficulty || 'normal']?.name || '正常带班';
      document.getElementById('btn-load').textContent = '继续游戏（' + diffName + '）';
    } catch(e) {
      document.getElementById('btn-load').textContent = '继续游戏';
    }
  }
}

// Init
checkSaveExists();

// Auto-save on beforeunload
window.addEventListener('beforeunload', () => { if (game && !game.ended) saveGame(); });
