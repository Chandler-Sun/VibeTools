const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
function compile(relative, dependencies = {}) {
  const filename = path.resolve(relative);
  const m = new Module(filename, module);
  const originalRequire = m.require.bind(m);
  m.require = id => dependencies[id] ?? originalRequire(id);
  m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
  return m.exports;
}
const { validateWeek, parseGeneratedWeek, applyGeneratedWeek } = compile('src/lib/direction-week.ts');
const { newDirection } = compile('src/lib/direction-explorer.ts');
const week = ['研究数据源与清洗', '整理行业模型', '访谈潜在客户', '交付一次样例', '处理反馈与重复任务'];
function makeRoute(chatCompletion) {
  return compile('src/app/api/ai/simulate-week/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json' } }) } },
    '@/lib/services/ai_service_server': { chatCompletion },
    '@/lib/direction-week': { parseGeneratedWeek },
  }).POST;
}
function request(body) { return new Request('http://localhost/api/ai/simulate-week', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }); }

test('AI output accepts plain or fenced JSON and requires exactly five nonblank days', () => {
  const body = JSON.stringify({ week });
  assert.deepEqual(parseGeneratedWeek(body), week);
  assert.deepEqual(parseGeneratedWeek('```json\n' + body + '\n```'), week);
  for (const invalid of [[], week.slice(0, 4), [...week, '多一天'], [1, ...week.slice(1)], ['', ...week.slice(1)], ['x'.repeat(2001), ...week.slice(1)]]) assert.throws(() => validateWeek(invalid));
  assert.throws(() => parseGeneratedWeek('not JSON'));
  assert.throws(() => parseGeneratedWeek('{"days":[]}'));
});
test('default prefill preserves handwritten content, self-rating and all other fields', () => {
  const direction = newDirection('人才数据 API');
  direction.week = ['手写：亲自访谈', '', '  ', '手写：整理反馈', ''];
  direction.dailyScore = 4; direction.scores.excitement = 8;
  const source = { id: direction.id, name: direction.name, description: direction.description };
  const filled = applyGeneratedWeek(direction, source, week, 'empty');
  assert.deepEqual(filled.week, ['手写：亲自访谈', week[1], week[2], '手写：整理反馈', week[4]]);
  assert.equal(filled.dailyScore, 4);
  assert.deepEqual(filled.scores, { excitement: 8 });
  assert.deepEqual(direction.week, ['手写：亲自访谈', '', '  ', '手写：整理反馈', '']);
  assert.deepEqual(applyGeneratedWeek(direction, source, week, 'replace').week, week);
});
test('late AI responses never apply to a changed direction or description', () => {
  const direction = newDirection('AI 硬件');
  for (const source of [{ ...direction, id: 'other' }, { ...direction, name: '另一个方向' }, { ...direction, description: '新描述' }]) assert.equal(applyGeneratedWeek(direction, source, week, 'empty'), direction);
});
test('request validation rejects bad input before calling the AI provider', async () => {
  let calls = 0; const route = makeRoute(async () => { calls++; });
  for (const body of [null, {}, { name: '', description: '' }, { name: 'x'.repeat(121), description: '' }, { name: '方向', description: 5 }, { name: '方向', description: 'x'.repeat(2001) }]) assert.equal((await route(request(body))).status, 400);
  assert.equal((await route(new Request('http://localhost', { method: 'POST', body: 'not json' }))).status, 400);
  assert.equal(calls, 0);
});
test('AI receives only direction name/description and returns a validated five-day plan', async () => {
  const route = makeRoute(async (options, signal) => {
    assert.deepEqual(JSON.parse(options.messages[1].content), { name: '海外数据 API', description: '服务创业公司' });
    assert.ok(signal instanceof AbortSignal);
    return { choices: [{ message: { content: JSON.stringify({ week }) } }] };
  });
  const response = await route(request({ name: ' 海外数据 API ', description: '服务创业公司', scores: { excitement: 9 }, notes: '私人笔记' }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { week });
});
test('provider and format errors remain actionable without exposing upstream details', async () => {
  for (const content of ['', '{"week":["不完整"]}', 'unexpected text']) {
    const response = await makeRoute(async () => ({ choices: [{ message: { content } }] }))(request({ name: 'AI 硬件', description: '' }));
    assert.equal(response.status, 502);
  }
  const unavailable = await makeRoute(async () => { throw new Error('OPENROUTER_API_KEY 未配置'); })(request({ name: '方向', description: '' }));
  assert.equal(unavailable.status, 503);
  const failure = await makeRoute(async () => { throw new Error('provider-secret-detail'); })(request({ name: '方向', description: '' }));
  assert.equal(failure.status, 502);
  assert.equal((await failure.text()).includes('provider-secret-detail'), false);
  for (const status of [401, 402, 403, 429]) {
    const response = await makeRoute(async () => { throw new Error(`HTTP error! status: ${status}, body: provider-secret-detail`); })(request({ name: '方向', description: '' }));
    assert.equal(response.status, status === 429 ? 429 : 503);
    assert.equal((await response.text()).includes('provider-secret-detail'), false);
  }
});
test('cancelled requests propagate cancellation to the AI provider', async () => {
  const abort = new AbortController();
  const route = makeRoute(async (_options, signal) => { abort.abort(); assert.equal(signal.aborted, true); throw new Error('aborted'); });
  const response = await route(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: '方向', description: '' }), signal: abort.signal }));
  assert.equal(response.status, 504);
});
