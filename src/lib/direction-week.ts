import type { Direction } from './direction-explorer';

export type WeekSource = Pick<Direction, 'id' | 'name' | 'description'>;
export type WeekApplyMode = 'empty' | 'replace';
export function validateWeek(value: unknown): string[] {
  if (!Array.isArray(value) || value.length !== 5 || !value.every(day => typeof day === 'string' && !!day.trim() && day.length <= 2000)) {
    throw new Error('AI 未返回完整的周一到周五安排，请重试。');
  }
  return value.map(day => day.trim());
}
export function parseGeneratedWeek(text: string): string[] {
  const fenced = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  let data: unknown;
  try { data = JSON.parse(fenced ? fenced[1] : text); }
  catch { throw new Error('AI 返回的安排格式不正确，请重试。'); }
  if (!data || typeof data !== 'object' || !('week' in data)) throw new Error('AI 未返回一周安排，请重试。');
  return validateWeek(data.week);
}
export function applyGeneratedWeek(direction: Direction, source: WeekSource, proposal: string[], mode: WeekApplyMode): Direction {
  if (direction.id !== source.id || direction.name !== source.name || direction.description !== source.description) return direction;
  const week = validateWeek(proposal);
  return { ...direction, week: week.map((day, i) => mode === 'empty' && direction.week[i].trim() ? direction.week[i] : day) };
}
