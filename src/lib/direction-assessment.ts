import { completion, DIMENSIONS, Direction, indexScore, INNER, newDirection, parseWorkspace, REALITY, Workspace } from './direction-explorer';

export type AssessmentStep = { id: string; phase: string; title: string; hint: string; dimensions?: typeof INNER; optional?: boolean };
const innerTitles = ['我会主动靠近这个方向吗？', '我愿意投入，也愿意承受吗？', '拿掉光环，我还想做吗？', '它适合我想过的生活吗？', '我愿意为它学习、取舍吗？'];
const realityTitles = ['现在的我，有怎样的起点？', '能否尽早碰到真实需求？', '竞争之后，还能积累什么？', '能否触达用户、持续交付？', '这段路会把我带向哪里？'];
export const ASSESSMENT_STEPS: AssessmentStep[] = [
  { id: 'setup', phase: '定义方向', title: '这一次，你想认真看看哪个方向？', hint: '写下一个具体方向。一次只想一件事，让答案更接近你自己。' },
  ...Array.from({ length: 5 }, (_, i) => ({ id: `inner-${i}`, phase: '内心吸引力', title: innerTitles[i], hint: '暂时放下市场和资源，按自己的真实感受打分。', dimensions: INNER.slice(i * 3, i * 3 + 3) })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `reality-${i}`, phase: '现实适配度', title: realityTitles[i], hint: '越有优势、越容易启动、越难复制，分数越高。不确定时，把待验证的假设记下来。', dimensions: REALITY.slice(i * 3, i * 3 + 3) })),
  { id: 'motivation', phase: '动机与日常', title: '真正吸引你的，到底是什么？', hint: '喜欢方向，也可能是喜欢它带来的身份或生活。试着把两者分开。', optional: true },
  { id: 'daily', phase: '动机与日常', title: '想象一下，普通的一周。', hint: '把它翻译成具体工作，也写下琐碎、重复和不体面的部分。', optional: true },
  { id: 'plan', phase: '验证计划', title: '先不重投入，做一次小验证。', hint: '把最小资源、最可能的失败原因和两周实验写清楚。现在没想好，也可以留到之后补。', optional: true },
  { id: 'result', phase: '评估结果', title: '把这一次的判断，放在一起看。', hint: '这是一张当前感受与假设的地图，之后可以被真实经历修正。' },
];
export const RESULT_STEP = ASSESSMENT_STEPS.length - 1;
export const ASSESSMENT_STORAGE_KEY = 'direction-assessment:v1';
export const EXPLORER_STORAGE_KEY = 'direction-explorer:v1';
export type AssessmentReport = { direction: Direction; completedAt: string };
export type AssessmentState = { version: 1; direction: Direction; step: number; reports: AssessmentReport[]; updatedAt: string };
export function initialAssessment(): AssessmentState {
  return { version: 1, direction: newDirection(''), step: 0, reports: [], updatedAt: '' };
}
export function canContinue(direction: Direction, step: number) {
  if (step === 0) return !!direction.name.trim();
  const config = ASSESSMENT_STEPS[step];
  if (!config || step === RESULT_STEP) return false;
  return config.dimensions ? config.dimensions.every(d => direction.scores[d.id] !== undefined) : true;
}
export function firstIncompleteStep(direction: Direction) {
  if (!direction.name.trim()) return 0;
  const step = ASSESSMENT_STEPS.findIndex(s => s.dimensions?.some(d => direction.scores[d.id] === undefined));
  return step === -1 ? RESULT_STEP : step;
}
function validDate(date: unknown): date is string { return typeof date === 'string' && !Number.isNaN(Date.parse(date)); }
export function parseAssessment(raw: string): AssessmentState {
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !data.direction || typeof data.direction.name !== 'string' || data.direction.name.length > 120 || !Number.isInteger(data.step) || data.step < 0 || data.step > RESULT_STEP || !Array.isArray(data.reports) || data.reports.length > 30 || typeof data.updatedAt !== 'string') throw new Error('评估记录格式不正确。');
  // Drafts may have a blank name. The shared parser validates every other field.
  parseWorkspace(JSON.stringify({ version: 1, directions: [{ ...data.direction, name: data.direction.name.trim() || '尚未命名' }], snapshots: [], updatedAt: data.updatedAt }));
  const ids = new Set<string>();
  for (const report of data.reports) {
    if (!report?.direction || !validDate(report.completedAt) || ids.has(report.direction.id)) throw new Error('历史评估记录格式不正确。');
    parseWorkspace(JSON.stringify({ version: 1, directions: [report.direction], snapshots: [], updatedAt: report.completedAt }));
    if (completion(report.direction) !== DIMENSIONS.length) throw new Error('历史评估尚未完成全部评分。');
    ids.add(report.direction.id);
  }
  return { ...data, step: Math.min(data.step, firstIncompleteStep(data.direction)) };
}
export function finishAssessment(state: AssessmentState): AssessmentState {
  if (!state.direction.name.trim() || completion(state.direction) !== DIMENSIONS.length) throw new Error('请先完成方向名称和全部 30 项评分。');
  const completedAt = new Date().toISOString();
  const report = { direction: structuredClone(state.direction), completedAt };
  return { ...state, step: RESULT_STEP, updatedAt: completedAt, reports: [report, ...state.reports.filter(r => r.direction.id !== state.direction.id)].slice(0, 30) };
}
export function mergeIntoExplorer(workspace: Workspace, direction: Direction): Workspace {
  if (!direction.name.trim() || completion(direction) !== DIMENSIONS.length) throw new Error('完成评估后才能加入方向池。');
  const exists = workspace.directions.some(d => d.id === direction.id);
  if (!exists && workspace.directions.length >= 100) throw new Error('方向池已有 100 个方向，请先在工作台整理后再加入。');
  return { ...workspace, updatedAt: new Date().toISOString(), directions: exists ? workspace.directions.map(d => d.id === direction.id ? structuredClone(direction) : d) : [...workspace.directions, structuredClone(direction)] };
}
export function assessmentObservations(direction: Direction) {
  if (completion(direction) !== DIMENSIONS.length) return null;
  const desire = indexScore(direction, 'desire').value!;
  const edge = indexScore(direction, 'edge').value!;
  const endurance = indexScore(direction, 'endurance').value!;
  const opportunity = indexScore(direction, 'opportunity').value!;
  const title = desire >= 7
    ? edge >= 7 ? '想做，也有可以借力的起点。' : '很想做，值得用小实验补齐起点。'
    : edge >= 7 ? '做得来，再确认一下自己想不想。' : '先保留探索空间，暂缓重投入。';
  const notes = [desire >= 7 ? '内心想做的意愿较强，值得把注意力转为一次具体行动。' : '当前的内心吸引力还不算强。回看「钱相同」和「无人知晓」两项，分辨你更想要的是什么。'];
  if (endurance < 5) notes.push('长期承受这一项偏低。先亲自做几天最重复、最难受的工作，看看自己的感受会不会改变。');
  if (opportunity < 5) notes.push('对生意机会的判断还有较多疑虑。先访谈用户、试一次交付，优先验证最低分的假设。');
  if (direction.scores.action + 3 <= direction.scores.excitement) notes.push('兴奋感明显高于做事欲望。可以用一次真实交付，区分「喜欢研究」和「想要经营」。');
  if (direction.dailyScore !== null && direction.dailyScore < 5) notes.push('你对这类日常生活的意愿偏低。留意自己是否更喜欢做成以后的身份。');
  return { title, notes, strengths: DIMENSIONS.filter(d => direction.scores[d.id] >= 7).sort((a, b) => direction.scores[b.id] - direction.scores[a.id]).slice(0, 3), questions: DIMENSIONS.filter(d => direction.scores[d.id] <= 4).sort((a, b) => direction.scores[a.id] - direction.scores[b.id]).slice(0, 3) };
}
