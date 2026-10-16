export const LOCAL_AI_KEY = 'vibetools:ai-settings:v1';
export const LEGACY_AI_KEY = 'direction-ai-settings:v1';
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
  const current = storage.getItem(LOCAL_AI_KEY);
  const raw = current ?? storage.getItem(LEGACY_AI_KEY);
  if (raw === null) return null;
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('本地 AI 配置无法读取，请重新保存。'); }
  const valid = validateAISettings(value);
  if (current === null) saveAISettings(storage, valid);
  return valid;
}
export function saveAISettings(storage: LocalStore, settings: LocalAISettings): LocalAISettings {
  const valid = validateAISettings(settings);
  // Deliberately separate from assessment data, reports, and backup exports.
  storage.setItem(LOCAL_AI_KEY, JSON.stringify(valid));
  storage.removeItem(LEGACY_AI_KEY);
  return valid;
}
export function clearAISettings(storage: LocalStore) {
  storage.removeItem(LOCAL_AI_KEY);
  storage.removeItem(LEGACY_AI_KEY);
}

