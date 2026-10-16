import { OPENROUTER_ENDPOINT, validateAISettings, type LocalAISettings } from '../ai-settings';
import type { OpenRouterRequestOptions, OpenRouterResponse } from './ai_service';

export async function browserChatCompletion(settings: LocalAISettings, options: OpenRouterRequestOptions, signal?: AbortSignal): Promise<OpenRouterResponse> {
  const { apiKey, model } = validateAISettings(settings);
  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store',
      body: JSON.stringify({ ...options, ...(model ? { model } : {}), stream: false }),
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
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI 未返回内容，请检查模型设置后重试。');
  return data as OpenRouterResponse;
}
