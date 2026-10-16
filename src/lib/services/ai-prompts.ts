import type { OpenRouterRequestOptions } from './ai_service';

// Shared task prompts for browser and server callers.

const TIMELINE_SYSTEM_PROMPT = `你是一个专业的创业公司复盘分析师，擅长从历史事件中提取洞察和规律。
你的任务是分析用户提供的时间线事件数据，生成有价值的复盘报告。

报告应包含以下部分：
1. 整体趋势分析（事件数量、成功率、时间分布等）
2. 关键洞察（重要模式、转折点、关联性等）
3. 改进建议（基于历史经验的实用建议）
4. 下一步行动（具体可执行的建议）

请用清晰、简洁、有洞察力的语言撰写报告。`;

export interface AnalyzeTimelineParams {
  events: Array<{
    title: string;
    startYear: number;
    startQuarter?: number;
    startMonth?: number;
    endYear?: number;
    endQuarter?: number;
    endMonth?: number;
    type: string;
    category: string;
    result?: string;
    notes?: string;
  }>;
  yearSummaries?: Array<{ year: number; text: string }>;
  startYear: number;
  endYear: number;
}

export function timelineCompletionRequest(params: AnalyzeTimelineParams): OpenRouterRequestOptions {
  const { events, yearSummaries, startYear, endYear } = params;

  const sortedEvents = [...events].sort((a, b) => {
    if (a.startYear !== b.startYear) return a.startYear - b.startYear;
    const aq = a.startQuarter ?? 1,
      bq = b.startQuarter ?? 1;
    if (aq !== bq) return aq - bq;
    const am = a.startMonth ?? 1,
      bm = b.startMonth ?? 1;
    return am - bm;
  });

  const eventsDescription = sortedEvents
    .map((e) => {
      const timeInfo =
        e.type === 'milestone'
          ? `${e.startYear}年${e.startMonth ? `${e.startMonth}月` : `Q${e.startQuarter || 1}`}`
          : `${e.startYear}年${e.startMonth ? `${e.startMonth}月` : `Q${e.startQuarter || 1}`} - ${e.endYear}年${e.endMonth ? `${e.endMonth}月` : `Q${e.endQuarter || 4}`}`;
      const resultEmoji =
        e.result === 'good' ? '算拿到还可以的结果' : e.result === 'bad' ? '没有拿到好结果' : '结果不好说';
      return `[结果情况: ${resultEmoji}] [${e.category}]: ${e.title} (${timeInfo})${e.notes ? `\n   备注: ${e.notes}` : ''}`;
    })
    .join('\n');

  const summariesDescription =
    yearSummaries && yearSummaries.length > 0
      ? '\n\n年度摘要：\n' + yearSummaries.map((s) => `${s.year}年: ${s.text}`).join('\n')
      : '';

  const userPrompt = `请分析以下时间线数据（${startYear}-${endYear}年）：

共有 ${events.length} 个事件：
${eventsDescription}
${summariesDescription}

请生成一份全面的复盘分析报告。`;

  return {
    messages: [
      { role: 'system', content: TIMELINE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 30000,
  };
}

// Project schedule adjustment.

const SCHEDULE_SYSTEM_PROMPT = `你是一个项目排期助手。用户会提供一段「项目排期」的类 Markdown 文本，以及一句修改需求。请只输出调整后的完整排期文本，不要解释说明。

排期文本格式规则：
- 每个任务以 "- " 开头（注意横杠后有一个空格）
- 任务名称前的感叹号表示优先级：无=普通，一个 ! =低，!! =高，!!! =极高
- 前置依赖用 "-->#数字" 表示，如 "-->#1" 表示依赖第 1 号任务
- 预计耗时天数："[数字d]"，如 "[3d]" 表示 3 天；"[0.5d]" 表示半天
- 预计人天："[数字md]"，如 "[5md]" 表示 5 人天
- 角色/参与方：用 "@xxx" 表示
- 备注：行内用 "> 备注内容"；多行备注在下一行用空格缩进后 "> 备注内容"

请严格保持上述格式，只输出修改后的完整文本。`;

export function scheduleCompletionRequest(currentMarkdown: string, userRequest: string): OpenRouterRequestOptions {
  const userPrompt = `当前排期计划：\n\n${currentMarkdown}\n\n用户的修改需求：${userRequest}\n\n请直接输出修改后的完整排期文本（不要包含任何解释或前后缀）：`;

  return {
    messages: [
      { role: 'system', content: SCHEDULE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 40000,
  };
}
