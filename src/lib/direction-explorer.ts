export type IndexKey = 'desire' | 'edge' | 'opportunity' | 'endurance';
export type Dimension = { id: string; title: string; question: string; index: IndexKey; focus?: boolean };
export const INNER: Dimension[] = [
  { id: 'excitement', title: '兴奋感', question: '一想到这个方向，我会不会明显兴奋、想继续研究？', index: 'desire' },
  { id: 'attention', title: '主动关注度', question: '没人要求时，我会不会自然去搜相关产品、公司、新闻？', index: 'desire', focus: true },
  { id: 'curiosity', title: '长期好奇心', question: '连续研究 3–5 年，我还能觉得有意思吗？', index: 'desire' },
  { id: 'action', title: '做事欲望', question: '我真的想做 demo、找用户、卖东西，还是只喜欢聊？', index: 'desire' },
  { id: 'drudgery', title: '苦活接受度', question: '最脏、最累、最无聊的工作，我有多愿意亲自做？', index: 'endurance', focus: true },
  { id: 'failure', title: '失败容忍度', question: '即使做两年没成功，我仍会觉得这两年值得吗？', index: 'endurance' },
  { id: 'identity', title: '身份认同', question: '五年后别人用这个领域定义我，我喜欢吗？', index: 'desire' },
  { id: 'envy', title: '嫉妒信号', question: '看到别人做成，我会多强烈地觉得「我本来也想做这个」？', index: 'desire', focus: true },
  { id: 'anonymous', title: '无人知晓测试', question: '如果不能带来名气、身份和羡慕，我还想做吗？', index: 'desire' },
  { id: 'same-money', title: '钱相同测试', question: '假设所有方向赚的钱一样，我有多想选它？', index: 'desire' },
  { id: 'freedom', title: '自由度匹配', question: '它的工作与生活方式，和我想过的生活有多匹配？', index: 'endurance' },
  { id: 'flow', title: '心流匹配', question: '它的日常核心工作，能让我容易进入心流吗？', index: 'endurance' },
  { id: 'learning', title: '学习欲', question: '为了做好它，我真的想补齐需要的那些能力吗？', index: 'desire' },
  { id: 'sacrifice', title: '牺牲意愿', question: '为它放弃其他机会，我有多觉得值得？', index: 'endurance' },
  { id: 'regret', title: '遗憾值', question: '未来五年完全没碰这个方向，我会有多后悔？', index: 'desire', focus: true },
];
export const REALITY: Dimension[] = [
  { id: 'ability', title: '现有能力匹配', question: '我现在的技术、产品和行业能力能直接复用多少？', index: 'edge' },
  { id: 'advantage', title: '不对称优势', question: '我有多少别人难以获得的资源、数据、经验与网络？', index: 'edge' },
  { id: 'cost', title: '启动轻量度', question: '能否用可承担的资金，由 1–3 人启动？越轻越高分。', index: 'opportunity' },
  { id: 'speed', title: '验证速度', question: '能否在 30 天内拿到真实行为或付费信号？越快越高分。', index: 'opportunity' },
  { id: 'first-sale', title: '首单可达性', question: '我能否找到第一个真正付费的客户？越容易越高分。', index: 'opportunity' },
  { id: 'market', title: '市场成长性', question: '未来 3–5 年，真实需求有多大扩张空间？', index: 'opportunity' },
  { id: 'competition', title: '竞争空间', question: '是否存在还没被充分满足的细分场景？竞争压力越小越高分。', index: 'opportunity' },
  { id: 'copy', title: '抗 AI 复制能力', question: '别人用 AI 复刻 80% 后，我还剩多少独有价值？越难复制越高分。', index: 'opportunity' },
  { id: 'moat', title: '壁垒形成速度', question: '做半年后，数据、关系、品牌或履约能力能积累多少？', index: 'opportunity' },
  { id: 'distribution', title: '分发匹配', question: '我有多少能触达目标用户的现成渠道？', index: 'edge' },
  { id: 'revenue', title: '收入质量', question: '毛利、复购、客单价与现金流的质量如何？', index: 'opportunity' },
  { id: 'scale', title: '扩张性', question: '收入增长能否明显快于人力和交付成本增长？', index: 'opportunity' },
  { id: 'global', title: '全球化潜力', question: '产品是否能自然服务全球用户并收款交付？', index: 'opportunity' },
  { id: 'growth', title: '个人成长价值', question: '即使失败，能给我留下多少可迁移的能力？', index: 'edge' },
  { id: 'option', title: '下一个机会价值', question: '做完后，能打开多少新的客户、行业与合作机会？', index: 'edge' },
];
export const DIMENSIONS = [...INNER, ...REALITY];
export const INDICES: { id: IndexKey; name: string; en: string; description: string }[] = [
  { id: 'desire', name: '内心想做', en: 'Desire', description: '兴奋、好奇、行动欲与长期认同' },
  { id: 'edge', name: '个人优势', en: 'Edge', description: '现有能力、独有资源、分发与成长空间' },
  { id: 'opportunity', name: '生意机会', en: 'Opportunity', description: '启动、验证、需求、收入与壁垒' },
  { id: 'endurance', name: '长期承受', en: 'Endurance', description: '苦活、失败、生活方式与机会成本' },
];
export const REFLECTIONS = [
  { id: 'attraction', title: '最吸引我的，到底是什么？', hint: '实体创造的满足感、探索陌生行业、全球销售、离开熟悉的领域……' },
  { id: 'remove', title: '拿掉这个因素，我还想做吗？', hint: '拿掉 AI 光环、全球化故事或成功身份后，剩下什么？' },
  { id: 'alternative', title: '其他方向，也能满足同一种欲望吗？', hint: '写出替代路径，看看吸引你的是领域还是某种体验。' },
  { id: 'story', title: '我喜欢产品本身，还是创业故事？', hint: '哪一项具体工作让我想立刻开始？' },
  { id: 'self', title: '我喜欢每天做它，还是做成以后的自己？', hint: '想象明天上午 10 点，我实际在做什么。' },
];
export const PLAN_FIELDS = [
  { id: 'why-now', title: '为什么现在可能成立？', hint: '发生了什么新变化？哪些判断还只是猜测？' },
  { id: 'resources', title: '最小资源', hint: '必须具备的人、钱、数据、渠道；已有资源与最大缺口。' },
  { id: 'failure-reason', title: '最可能的失败原因', hint: '只选最致命的 1–3 条；什么证据会推翻你的想法？' },
  { id: 'hacking', title: '最省力的启动路径', hint: '人工 + AI + 现成工具，如何先交付一次结果？' },
  { id: 'experiment', title: '未来两周的验证实验', hint: '给谁、做什么、预算和截止日；成功阈值与停止条件。' },
  { id: 'evidence', title: '真实反馈与下一步', hint: '记录付费、重复使用、拒绝原因及日期；决定继续、调整或暂停。' },
];
export type Direction = { id: string; name: string; description: string; scores: Record<string, number>; notes: Record<string, string>; week: string[]; dailyScore: number | null };
export type Snapshot = { id: string; createdAt: string; label: string; directions: Direction[] };
export type Workspace = { version: 1; directions: Direction[]; snapshots: Snapshot[]; updatedAt: string };
const SEEDS = [
  ['智能硬件 / AI 硬件', 'ESP32、陪伴玩具、小屏设备与情绪价值配件。'],
  ['AI × 人才 × 物理世界', '从真实工作行为，构建有证据的技能图谱。'],
  ['垂类数据产品', '人才库、Talent Graph、数据 API 与垂直情报。'],
  ['高精尖人才 Mapping', '核聚变、量子计算、商业航天等稀缺人才发现。'],
  ['招聘结果服务', 'Agent + 人工交付，按 shortlist、面试或结果收费。'],
  ['全球化招聘服务', '跨平台寻访、海外人才服务与全托管交付。'],
  ['AI 职业转型 / 再就业', '学习、项目、能力验证到就业的结果闭环。'],
  ['个性化 AI 教育', '动态课程、多模态导师与真实能力提升。'],
  ['专家 AI / 专家智库', '专家方法论产品化，复杂问题升级真人。'],
  ['专业能力大众化', '降低专业门槛，重新设计高价值服务流程。'],
  ['Agent 决策基础设施', 'Decision Model、路由、评分、验证与决策 API。'],
  ['大平台插件 / 工具', '借助 ChatGPT、MCP、浏览器等平台完成分发。'],
  ['Headless / Agent-native SaaS', '从供人操作的软件，转向供 Agent 调用的能力。'],
  ['Agent 数据 / 工具基础设施', 'People API、Expert API、搜索与 Physical I/O。'],
  ['器件套利型全球硬件', '新器件整合、消费产品定义与 Kickstarter 验证。'],
  ['AI 内容 / 知识产品', '把隐性知识变成知识包、导师和可交付工作流。'],
];
export function newDirection(name: string, description = ''): Direction {
  return { id: crypto.randomUUID(), name, description, scores: {}, notes: {}, week: ['', '', '', '', ''], dailyScore: null };
}
export function initialWorkspace(): Workspace {
  return { version: 1, directions: SEEDS.map(([name, desc], i) => ({ ...newDirection(name, desc), id: `seed-${i}` })), snapshots: [], updatedAt: '' };
}
export function indexScore(direction: Direction, index: IndexKey) {
  const dimensions = DIMENSIONS.filter(d => d.index === index);
  const values = dimensions.map(d => direction.scores[d.id]).filter((n): n is number => n !== undefined);
  return { value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null, answered: values.length, total: dimensions.length };
}
export function completion(direction: Direction) { return DIMENSIONS.filter(d => direction.scores[d.id] !== undefined).length; }
const noteIds = new Set([...DIMENSIONS.map(d => d.id), ...REFLECTIONS.map(d => d.id), ...PLAN_FIELDS.map(d => d.id)]);
function record(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v); }
function validDirections(value: unknown): value is Direction[] {
  if (!Array.isArray(value) || !value.length || value.length > 100) return false;
  const ids = new Set<string>();
  return value.every(d => {
    if (!record(d) || typeof d.id !== 'string' || !d.id || ids.has(d.id)) return false;
    ids.add(d.id);
    return typeof d.name === 'string' && !!d.name.trim() && d.name.length <= 120 && typeof d.description === 'string' && d.description.length <= 2000 &&
      record(d.scores) && Object.entries(d.scores).every(([key, n]) => DIMENSIONS.some(m => m.id === key) && typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 10) &&
      record(d.notes) && Object.entries(d.notes).every(([key, n]) => noteIds.has(key) && typeof n === 'string' && n.length <= 10000) &&
      Array.isArray(d.week) && d.week.length === 5 && d.week.every(n => typeof n === 'string' && n.length <= 10000) &&
      (d.dailyScore === null || typeof d.dailyScore === 'number' && Number.isInteger(d.dailyScore) && d.dailyScore >= 1 && d.dailyScore <= 10);
  });
}
export function parseWorkspace(text: string): Workspace {
  const data: unknown = JSON.parse(text);
  if (!record(data) || data.version !== 1 || !validDirections(data.directions) || typeof data.updatedAt !== 'string' || !Array.isArray(data.snapshots) || data.snapshots.length > 30) throw new Error('备份格式不正确，或分数超出了 1–10 的范围。');
  const ids = new Set<string>();
  if (!data.snapshots.every(s => {
    if (!record(s) || typeof s.id !== 'string' || !s.id || ids.has(s.id)) return false;
    ids.add(s.id);
    return typeof s.label === 'string' && s.label.length <= 120 && typeof s.createdAt === 'string' && !Number.isNaN(Date.parse(s.createdAt)) && validDirections(s.directions);
  })) throw new Error('历史快照格式不正确。');
  return data as unknown as Workspace;
}
export function exportCsv(directions: Direction[]): string {
  // Quote every field and neutralize spreadsheet formulas in user-authored text.
  const cell = (v: string | number) => `"${String(v).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
  const rows: (string | number)[][] = [
    ['方向', '描述', ...INDICES.map(i => i.en), '已评维度', ...DIMENSIONS.map(d => d.title), ...DIMENSIONS.map(d => `${d.title}·依据`), ...REFLECTIONS.map(r => r.title), ...['周一', '周二', '周三', '周四', '周五'], '日常生活意愿', ...PLAN_FIELDS.map(r => r.title)],
    ...directions.map(d => [d.name, d.description, ...INDICES.map(i => indexScore(d, i.id).value?.toFixed(2) ?? ''), `${completion(d)}/30`, ...DIMENSIONS.map(m => d.scores[m.id] ?? ''), ...DIMENSIONS.map(m => d.notes[m.id] ?? ''), ...REFLECTIONS.map(r => d.notes[r.id] ?? ''), ...d.week, d.dailyScore ?? '', ...PLAN_FIELDS.map(r => d.notes[r.id] ?? '')]),
  ];
  return '\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n');
}
