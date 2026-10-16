import { NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/services/ai_service_server';
import { parseGeneratedWeek, weekCompletionRequest } from '@/lib/direction-week';

export const runtime = 'edge';

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: '请求体必须是有效 JSON' }, { status: 400 }); }
  if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.length > 120 || typeof body.description !== 'string' || body.description.length > 2000) {
    return NextResponse.json({ error: '请填写方向名称（最多 120 字），描述最多 2000 字。' }, { status: 400 });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const cancel = () => controller.abort();
  request.signal.addEventListener('abort', cancel, { once: true });
  if (request.signal.aborted) controller.abort();
  try {
    const response = await chatCompletion(weekCompletionRequest(body), controller.signal);
    const text = response.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('AI 未返回一周安排，请重试。');
    return NextResponse.json({ week: parseGeneratedWeek(text) });
  } catch (error) {
    if (controller.signal.aborted) return NextResponse.json({ error: 'AI 生成超时或已取消，请稍后重试。' }, { status: 504 });
    if (error instanceof Error && error.message.includes('OPENROUTER_API_KEY')) return NextResponse.json({ error: 'AI 服务尚未配置，请先手动填写。' }, { status: 503 });
    if (error instanceof Error && /HTTP error! status: (401|402|403)\b/.test(error.message)) return NextResponse.json({ error: 'AI 服务暂不可用，请检查服务授权、额度或模型配置；你仍可手动填写。' }, { status: 503 });
    if (error instanceof Error && /HTTP error! status: 429\b/.test(error.message)) return NextResponse.json({ error: 'AI 请求较多，请稍后重试。' }, { status: 429 });
    const message = error instanceof Error && error.message.startsWith('AI ') ? error.message : 'AI 生成失败，请稍后重试；你仍可手动填写。';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener('abort', cancel);
  }
}
