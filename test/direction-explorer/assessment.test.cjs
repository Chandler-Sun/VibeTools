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
const model = compile('src/lib/direction-explorer.ts');
const wizard = compile('src/lib/direction-assessment.ts', { './direction-explorer': model });
const { ASSESSMENT_STEPS, RESULT_STEP, initialAssessment, canContinue, firstIncompleteStep, parseAssessment, finishAssessment, mergeIntoExplorer, assessmentObservations } = wizard;
function complete(name = '测试方向') {
  const state = initialAssessment(); state.direction.name = name;
  for (const dim of model.DIMENSIONS) state.direction.scores[dim.id] = 8;
  return state;
}

test('wizard presents every scoring dimension once and keeps blank drafts resumable', () => {
  const ids = ASSESSMENT_STEPS.flatMap(s => s.dimensions?.map(d => d.id) ?? []);
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
  assert.deepEqual([...ids].sort(), model.DIMENSIONS.map(d => d.id).sort());
  const draft = initialAssessment();
  assert.equal(canContinue(draft.direction, 0), false);
  assert.deepEqual(parseAssessment(JSON.stringify(draft)), draft);
});
test('all three answers are required to advance and refresh cannot bypass incomplete steps', () => {
  const state = initialAssessment(); state.direction.name = '海外数据 API';
  assert.equal(canContinue(state.direction, 0), true);
  for (const dim of ASSESSMENT_STEPS[1].dimensions.slice(0, 2)) state.direction.scores[dim.id] = 7;
  assert.equal(canContinue(state.direction, 1), false);
  state.step = RESULT_STEP;
  assert.equal(parseAssessment(JSON.stringify(state)).step, 1);
  state.direction.scores[ASSESSMENT_STEPS[1].dimensions[2].id] = 7;
  assert.equal(canContinue(state.direction, 1), true);
  assert.equal(firstIncompleteStep(state.direction), 2);
  assert.throws(() => finishAssessment(state));
});
test('finishing stores an independent report and revisions update the same report', () => {
  let state = finishAssessment(complete());
  assert.equal(state.step, RESULT_STEP);
  assert.equal(state.reports.length, 1);
  state.direction.scores.excitement = 3;
  assert.equal(state.reports[0].direction.scores.excitement, 8);
  state = finishAssessment(state);
  assert.equal(state.reports.length, 1);
  assert.equal(state.reports[0].direction.scores.excitement, 3);
  assert.deepEqual(parseAssessment(JSON.stringify(state)), state);
});
test('corrupt records never become completed results', () => {
  for (const mutate of [
    s => { s.direction.scores.excitement = 0; },
    s => { s.direction.week = []; },
    s => { s.step = -1; },
    s => { s.direction.name = 'x'.repeat(121); },
    s => { s.reports = [{ direction: { ...s.direction, scores: {} }, completedAt: new Date().toISOString() }]; },
  ]) {
    const state = complete(); mutate(state);
    assert.throws(() => parseAssessment(JSON.stringify(state)));
  }
});
test('adding to direction pool preserves existing directions and updates by identity', () => {
  const original = model.initialWorkspace(); const d = complete().direction;
  const merged = mergeIntoExplorer(original, d);
  assert.equal(original.directions.length, 16);
  assert.equal(merged.directions.length, 17);
  assert.deepEqual(merged.directions.slice(0, 16), original.directions);
  d.scores.excitement = 2;
  assert.equal(merged.directions[16].scores.excitement, 8);
  const updated = mergeIntoExplorer(merged, d);
  assert.equal(updated.directions.length, 17);
  assert.equal(updated.directions[16].scores.excitement, 2);
  assert.throws(() => mergeIntoExplorer(original, initialAssessment().direction));
});
test('observations require complete scores and flag excitement/action and daily-life mismatch', () => {
  assert.equal(assessmentObservations(initialAssessment().direction), null);
  const state = complete();
  state.direction.scores.excitement = 10; state.direction.scores.action = 2; state.direction.dailyScore = 3;
  const result = assessmentObservations(state.direction);
  assert.ok(result.notes.some(n => n.includes('兴奋感明显高于')));
  assert.ok(result.notes.some(n => n.includes('日常生活的意愿偏低')));
  assert.ok(result.questions.some(d => d.id === 'action'));
});
