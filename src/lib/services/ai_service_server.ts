import { timelineCompletionRequest, scheduleCompletionRequest, type AnalyzeTimelineParams } from './ai-prompts';
export type { AnalyzeTimelineParams } from './ai-prompts';

/**
 * 服务端专用 AI 请求：从服务器环境读取密钥，浏览器调用使用独立的公共本地配置。
 * 仅可在 Server Components、API Routes、Server Actions 中引用。
 */

interface OpenRouterMessage {
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

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
  return key;
}

function getBaseUrl(): string {
  return process.env.OPENAI_COMPATIBLE_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_BASE_URL || 'https://openrouter.ai/api/v1';
}

function getQueryString(): string {
  const q = process.env.OPENAI_COMPATIBLE_URL_QUERY_STRING || process.env.NEXT_PUBLIC_OPENAI_COMPATIBLE_URL_QUERY_STRING || '';
  if (!q) return '';
  return q.startsWith('?') ? q : '?' + q;
}

function getDefaultModel(): string {
  return process.env.OPENROUTER_DEFAULT_MODEL || process.env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL || 'moonshotai/kimi-k2-thinking';
}

function getChatCompletionsEndpoint(): string {
  return getBaseUrl() + '/chat/completions' + getQueryString();
}

export async function chatCompletion(options: OpenRouterRequestOptions, signal?: AbortSignal): Promise<OpenRouterResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY 未配置');
  }

  const defaultOptions = {
    temperature: 0.7,
    max_tokens: 4000,
    model: getDefaultModel(),
    stream: false,
  };

  const requestOptions = {
    ...defaultOptions,
    ...options,
  };

  const response = await fetch(getChatCompletionsEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://gamesforkids.app',
      'X-Title': 'GamesForKids',
    },
    body: JSON.stringify(requestOptions),
    signal,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
  }

  return (await response.json()) as OpenRouterResponse;
}

export async function analyzeTimeline(params: AnalyzeTimelineParams): Promise<string> {
  const response = await chatCompletion(timelineCompletionRequest(params));
  const content = response.choices[0]?.message?.content || '';
  if (!content) throw new Error('AI 返回了空的响应');
  return content;
}

export async function adjustSchedulePlan(currentMarkdown: string, userRequest: string): Promise<string> {
  const response = await chatCompletion(scheduleCompletionRequest(currentMarkdown, userRequest));
  const content = response.choices[0]?.message?.content?.trim() ?? '';
  if (!content) throw new Error('AI 返回了空的排期文本');
  return content;
}
