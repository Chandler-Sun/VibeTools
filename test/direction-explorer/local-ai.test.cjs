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
const weekModule = compile('src/lib/direction-week.ts');
const settingsModule = compile('src/lib/ai-settings.ts');
const { LOCAL_AI_KEY, LEGACY_AI_KEY, OPENROUTER_ENDPOINT, validateAISettings, readAISettings, saveAISettings, clearAISettings } = settingsModule;
const { browserChatCompletion } = compile('src/lib/services/ai-browser.ts', { '../ai-settings': settingsModule });
const prompts = compile('src/lib/services/ai-prompts.ts');
const service = compile('src/lib/services/ai_service.ts', { '../ai-settings': settingsModule, './ai-browser': { browserChatCompletion }, './ai-prompts': prompts });
const { generateBrowserWeek } = compile('src/lib/direction-week-client.ts', { './direction-week': weekModule, './services/ai_service': service });
const settings = { apiKey: 'test-local-only-key', model: 'example/model' };
const source = { id: 'test-direction', name: ' 人才数据 API ', description: ' 小团队 ', scores: { excitement: 10 }, notes: 'private notes' };
const week = ['周一访谈', '周二清洗数据', '周三销售', '周四交付', '周五处理反馈'];
function memoryStore() {
  const data = new Map([['direction-assessment:v1', 'assessment-data'], ['direction-explorer:v1', 'explorer-data']]);
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('local AI configuration persists independently of assessments and clears only its own key', () => {
  const storage = memoryStore();
  assert.equal(readAISettings(storage), null);
  assert.deepEqual(saveAISettings(storage, { apiKey: ' test-local-only-key ', model: ' example/model ' }), settings);
  assert.deepEqual(readAISettings(storage), settings);
  assert.equal(storage.data.get('direction-assessment:v1'), 'assessment-data');
  assert.equal(storage.data.get('direction-explorer:v1'), 'explorer-data');
  clearAISettings(storage);
  assert.equal(readAISettings(storage), null);
  assert.equal(storage.data.size, 2);
});
test('invalid or unavailable local storage fails without overwriting valid configuration', () => {
  const storage = memoryStore();
  saveAISettings(storage, settings);
  for (const invalid of [null, {}, { apiKey: '', model: '' }, { apiKey: 'key\ninvalid', model: '' }, { apiKey: 'x'.repeat(4097), model: '' }, { apiKey: 'key', model: 'model with spaces' }]) assert.throws(() => saveAISettings(storage, invalid));
  assert.deepEqual(readAISettings(storage), settings);
  assert.deepEqual(validateAISettings({ apiKey: 'key', model: '' }), { apiKey: 'key', model: '' });
  storage.setItem(LOCAL_AI_KEY, 'not JSON');
  assert.throws(() => readAISettings(storage), /重新保存/);
  const broken = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('blocked'); } };
  assert.throws(() => readAISettings(broken));
  assert.throws(() => saveAISettings(broken, settings));
  assert.throws(() => clearAISettings(broken));
});
test('browser calls OpenRouter directly and sends only name/description with no credentials in body or URL', async () => {
  const original = global.fetch;
  const abort = new AbortController();
  try {
    global.fetch = async (url, options) => {
      assert.equal(url, OPENROUTER_ENDPOINT);
      assert.equal(options.headers.Authorization, 'Bearer test-local-only-key');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.redirect, 'error');
      assert.equal(options.referrerPolicy, 'no-referrer');
      assert.equal(options.signal, abort.signal);
      const body = JSON.parse(options.body);
      assert.equal(body.model, settings.model);
      assert.equal(body.stream, false);
      assert.deepEqual(JSON.parse(body.messages[1].content), { name: '人才数据 API', description: '小团队' });
      assert.equal(options.body.includes(settings.apiKey), false);
      assert.equal(options.body.includes('private notes'), false);
      assert.equal(options.body.includes('excitement'), false);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ week }) } }] }));
    };
    assert.equal((await browserChatCompletion(settings, weekModule.weekCompletionRequest(source), abort.signal)).choices[0].message.content, JSON.stringify({ week }));
  } finally { global.fetch = original; }
});
test('optional model uses account default and provider errors never expose upstream details', async () => {
  const original = global.fetch;
  try {
    global.fetch = async (_url, options) => {
      assert.equal('model' in JSON.parse(options.body), false);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ week }) } }] }));
    };
    await browserChatCompletion({ ...settings, model: '' }, weekModule.weekCompletionRequest(source), new AbortController().signal);
    for (const status of [400, 401, 402, 403, 404, 429, 500]) {
      global.fetch = async () => new Response('provider-secret-details: ' + settings.apiKey, { status });
      await assert.rejects(browserChatCompletion(settings, weekModule.weekCompletionRequest(source), new AbortController().signal), error => !error.message.includes('provider-secret-details') && !error.message.includes(settings.apiKey));
    }
    global.fetch = async () => { throw new Error('provider-secret-details: ' + settings.apiKey); };
    await assert.rejects(browserChatCompletion(settings, weekModule.weekCompletionRequest(source), new AbortController().signal), /无法连接 OpenRouter/);
    global.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: 'provider-secret-details: ' + settings.apiKey } }] }));
    assert.throws(() => weekModule.parseGeneratedWeek('provider-secret-details: ' + settings.apiKey), /格式不正确/);
  } finally { global.fetch = original; }
});

test('legacy direction configuration migrates into the site-wide settings without touching tool data', () => {
  const storage = memoryStore();
  storage.setItem(LEGACY_AI_KEY, JSON.stringify(settings));
  assert.deepEqual(readAISettings(storage), settings);
  assert.equal(storage.getItem(LEGACY_AI_KEY), null);
  assert.deepEqual(JSON.parse(storage.getItem(LOCAL_AI_KEY)), settings);
  storage.setItem(LEGACY_AI_KEY, JSON.stringify({ apiKey: 'stale', model: '' }));
  assert.deepEqual(readAISettings(storage), settings);
  clearAISettings(storage);
  assert.equal(storage.getItem(LOCAL_AI_KEY), null);
  assert.equal(storage.getItem(LEGACY_AI_KEY), null);
  assert.equal(storage.data.size, 2);
});
test('week, timeline, schedule, and chat all use the same local credentials and configured model', async () => {
  const originalFetch = global.fetch;
  const originalStorage = global.localStorage;
  const storage = memoryStore();
  global.localStorage = storage;
  const requests = [];
  try {
    saveAISettings(storage, settings);
    global.fetch = async (url, options) => {
      assert.equal(url, OPENROUTER_ENDPOINT);
      assert.equal(options.headers.Authorization, 'Bearer test-local-only-key');
      const body = JSON.parse(options.body);
      requests.push(body);
      assert.equal(body.model, 'example/model');
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ week }) } }] }));
    };
    assert.deepEqual(await generateBrowserWeek(source, new AbortController().signal), week);
    await service.analyzeTimeline({ events: [{ title: 'sample event', startYear: 2026, type: 'milestone', category: 'work' }], startYear: 2026, endYear: 2026 });
    await service.adjustSchedulePlan('- sample task [3d]', 'delay a day');
    await service.chatCompletion({ messages: [{ role: 'user', content: 'hello' }], model: 'ignored/model' });
    assert.equal(requests.length, 4);
    assert.deepEqual(JSON.parse(requests[0].messages[1].content), { name: '人才数据 API', description: '小团队' });
    assert.match(requests[1].messages[1].content, /sample event/);
    assert.match(requests[2].messages[1].content, /sample task/);
    clearAISettings(storage);
    await assert.rejects(service.chatCompletion({ messages: [] }), /公共 AI 设置/);
    assert.equal(requests.length, 4);
  } finally { global.fetch = originalFetch; global.localStorage = originalStorage; }
});
