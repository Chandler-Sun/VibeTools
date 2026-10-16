import { readAISettings } from '../ai-settings';
import { browserChatCompletion } from './ai-browser';
import { timelineCompletionRequest, scheduleCompletionRequest, type AnalyzeTimelineParams } from './ai-prompts';

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterRequestOptions {
  temperature?: number;
  max_tokens?: number;
  model?: string;
  stream?: boolean;
  messages: OpenRouterMessage[];
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }[];
}

/** All browser AI features share the same local credentials and direct provider connection. */
export async function chatCompletion(options: OpenRouterRequestOptions, signal?: AbortSignal): Promise<OpenRouterResponse> {
  let settings;
  try { settings = readAISettings(localStorage); }
  catch { throw new Error('无法读取公共 AI 配置，请前往 AI 设置重新保存。'); }
  if (!settings) throw new Error('请先在公共 AI 设置中保存 OpenRouter API Key。');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(cancel, 120000);
  try { return await browserChatCompletion(settings, options, controller.signal); }
  catch (error) {
    if (controller.signal.aborted) throw new Error('AI 请求超时或已取消，请稍后重试。');
    throw error;
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); }
}

export async function analyzeTimeline(params: AnalyzeTimelineParams): Promise<string> {
  const response = await chatCompletion(timelineCompletionRequest(params));
  return response.choices[0].message.content;
}

export async function adjustSchedulePlan(currentMarkdown: string, userRequest: string): Promise<string> {
  const response = await chatCompletion(scheduleCompletionRequest(currentMarkdown, userRequest));
  return response.choices[0].message.content.trim();
}

export type { AnalyzeTimelineParams } from './ai-prompts';
const aiService = { chatCompletion, analyzeTimeline, adjustSchedulePlan };
export default aiService;
