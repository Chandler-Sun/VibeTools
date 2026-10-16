import { parseGeneratedWeek, weekCompletionRequest, type WeekSource } from './direction-week';
import { chatCompletion } from './services/ai_service';

export async function generateBrowserWeek(source: WeekSource, signal: AbortSignal): Promise<string[]> {
  const response = await chatCompletion(weekCompletionRequest(source), signal);
  return parseGeneratedWeek(response.choices[0].message.content);
}
