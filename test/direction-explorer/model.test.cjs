const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const filename = path.resolve('src/lib/direction-explorer.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleUnderTest = new Module(filename, module);
moduleUnderTest._compile(compiled, filename);
const { initialWorkspace, DIMENSIONS, INNER, REALITY, INDICES, indexScore, completion, parseWorkspace, exportCsv } = moduleUnderTest.exports;

test('all 16 directions start blank and each of 30 dimensions belongs to exactly one index', () => {
  const workspace = initialWorkspace();
  assert.equal(workspace.directions.length, 16);
  assert.equal(DIMENSIONS.length, 30);
  assert.equal(new Set(DIMENSIONS.map(d => d.id)).size, 30);
  assert.equal(INNER.length, 15);
  assert.equal(REALITY.length, 15);
  for (const d of workspace.directions) {
    assert.equal(completion(d), 0);
    for (const i of INDICES) assert.equal(indexScore(d, i.id).value, null);
  }
  assert.deepEqual(parseWorkspace(JSON.stringify(workspace)), workspace);
});
test('blank values never dilute averages and scores remain independent', () => {
  const d = initialWorkspace().directions[0];
  d.scores.excitement = 10;
  d.scores.attention = 2;
  d.scores.drudgery = 7;
  assert.equal(indexScore(d, 'desire').value, 6);
  assert.equal(indexScore(d, 'desire').answered, 2);
  assert.equal(indexScore(d, 'endurance').value, 7);
  assert.equal(indexScore(d, 'edge').value, null);
  assert.equal(completion(d), 3);
  delete d.scores.attention;
  assert.equal(indexScore(d, 'desire').value, 10);
});
test('a complete direction has the expected four scores', () => {
  const d = initialWorkspace().directions[0];
  const expected = { desire: 9, edge: 4, opportunity: 6, endurance: 3 };
  for (const dim of DIMENSIONS) d.scores[dim.id] = expected[dim.index];
  for (const i of INDICES) {
    const score = indexScore(d, i.id);
    assert.equal(score.value, expected[i.id]);
    assert.equal(score.answered, score.total);
  }
  assert.equal(completion(d), 30);
});
test('backups preserve text, scores, week and isolated history snapshots', () => {
  const w = initialWorkspace();
  w.directions[0].notes.attraction = '做出实体东西\n也喜欢全球销售';
  w.directions[0].week[0] = '谈模具报价';
  w.directions[0].dailyScore = 8;
  w.snapshots.push({ id: 's1', label: '第一轮', createdAt: new Date().toISOString(), directions: structuredClone(w.directions) });
  w.directions[0].week[0] = '访谈用户';
  const read = parseWorkspace(JSON.stringify(w));
  assert.deepEqual(read, w);
  assert.equal(read.snapshots[0].directions[0].week[0], '谈模具报价');
});
test('invalid backups fail before they can replace existing data', () => {
  for (const value of [0, 11, -2, 1.5, '9', null]) {
    const w = initialWorkspace(); w.directions[0].scores.excitement = value;
    assert.throws(() => parseWorkspace(JSON.stringify(w)));
  }
  const invalid = [
    w => { w.directions = []; },
    w => { w.directions[1].id = w.directions[0].id; },
    w => { w.directions[0].scores.unknown = 5; },
    w => { w.directions[0].notes.unknown = 'bad'; },
    w => { w.directions[0].week = []; },
    w => { w.directions[0].name = ''; },
    w => { w.directions[0].dailyScore = 11; },
    w => { w.snapshots = [{ id: 's1', label: 'bad', createdAt: 'bad date', directions: w.directions }]; },
  ];
  for (const mutate of invalid) { const w = initialWorkspace(); mutate(w); assert.throws(() => parseWorkspace(JSON.stringify(w))); }
});
test('CSV preserves Chinese, multiline notes and neutralizes formula injection', () => {
  const d = initialWorkspace().directions[0];
  d.name = '=HYPERLINK("unsafe")'; d.notes.attraction = '一行,另一行\n下一行';
  const csv = exportCsv([d]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes("\"'=HYPERLINK(\"\"unsafe\"\")\""));
  assert.ok(csv.includes('"一行,另一行\n下一行"'));
});
