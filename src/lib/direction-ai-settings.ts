import { parseGeneratedWeek, weekCompletionRequest, type WeekSource } from './direction-week';

export const LOCAL_AI_KEY = 'direction-ai-settings:v1';
export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export interface LocalAISettings { apiKey: string; model: string }
type LocalStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function validateAISettings(value: unknown): LocalAISettings {
  if (!value || typeof value !== 'object' || !('apiKey' in value) || !('model' in value)
    || typeof value.apiKey !== 'string' || typeof value.model !== 'string') {
    throw new Error('本地 AI 配置无法读取，请重新保存。');
  }
  const apiKey = value.apiKey.trim();
  const model = value.model.trim();
  if (!apiKey || apiKey.length > 4096 || /[\s\x00-\x1f\x7f]/.test(apiKey)) throw new Error('请填写有效的 OpenRouter API Key。');
  if (model.length > 200 || /\s/.test(model)) throw new Error('请填写有效的模型 ID，或留空使用账户默认模型。');
  return { apiKey, model };
}

export function readAISettings(storage: LocalStore): LocalAISettings | null {
  const raw = storage.getItem(LOCAL_AI_KEY);
  if (raw === null) return null;
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('本地 AI 配置无法读取，请重新保存。'); }
  return validateAISettings(value);
}
export function saveAISettings(storage: LocalStore, settings: LocalAISettings): LocalAISettings {
  const valid = validateAISettings(settings);
  // Deliberately separate from assessment data, reports, and backup exports.
  storage.setItem(LOCAL_AI_KEY, JSON.stringify(valid));
  return valid;
}
export function clearAISettings(storage: LocalStore) { storage.removeItem(LOCAL_AI_KEY); }

export async function generateBrowserWeek(settings: LocalAISettings, source: WeekSource, signal: AbortSignal): Promise<string[]> {
  const { apiKey, model } = validateAISettings(settings);
  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store',
      body: JSON.stringify({ ...weekCompletionRequest(source), ...(model ? { model } : {}), stream: false }),
      signal,
    });
  } catch {
    throw new Error('无法连接 OpenRouter，请检查网络连接后重试；也可以继续手动填写。');
  }
  // Never display raw upstream errors: they may contain credentials or account details.
  if (!response.ok) {
    const messages: Record<number, string> = {
      400: '请求未被接受，请检查模型 ID，或留空使用账户默认模型。',
      401: 'API Key 无效或已过期，请在 AI 设置中修改。',
      402: 'OpenRouter 可用额度不足，请在服务账户中检查余额或密钥限额。',
      403: 'OpenRouter 拒绝了请求，请检查密钥权限、账户状态或模型可用性。',
      404: '没有找到所填模型，请检查模型 ID。',
      429: 'AI 请求较多，请稍后重试。',
    };
    throw new Error(messages[response.status] || 'OpenRouter 暂时不可用，请稍后重试。');
  }
  const data = await response.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI 未返回一周安排，请检查模型设置后重试。');
  return parseGeneratedWeek(content);
}
