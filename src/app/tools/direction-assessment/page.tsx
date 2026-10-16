'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Compass, Download, History, Plus, Save, X } from 'lucide-react';
import { Direction, indexScore, INDICES, initialWorkspace, newDirection, parseWorkspace, PLAN_FIELDS, REFLECTIONS } from '@/lib/direction-explorer';
import { ASSESSMENT_STEPS, ASSESSMENT_STORAGE_KEY, AssessmentState, assessmentObservations, canContinue, EXPLORER_STORAGE_KEY, finishAssessment, initialAssessment, mergeIntoExplorer, parseAssessment, RESULT_STEP } from '@/lib/direction-assessment';
import styles from './page.module.css';
import WeekAIPrefill from '@/components/WeekAIPrefill';
import { applyGeneratedWeek } from '@/lib/direction-week';

function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const WEEK = ['周一', '周二', '周三', '周四', '周五'];
const PHASES = ['定义方向', '内心吸引力', '现实适配度', '动机与日常', '验证计划', '评估结果'];
const MAIN_PLAN_IDS = ['resources', 'failure-reason', 'experiment'];

export default function DirectionAssessmentPage() {
  const [state, setState] = useState<AssessmentState | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [addedToPool, setAddedToPool] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const activeStep = state?.step;

  useEffect(() => {
    let next = initialAssessment();
    try {
      const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      if (raw) {
        next = parseAssessment(raw);
        if (next.direction.name.trim()) setMessage('已恢复上次填写的方向和进度，可以接着往下想。');
      }
    } catch {
      setSaveError(true);
      setMessage('无法读取原有记录，自动保存已暂停。请先导出原始记录，避免覆盖。');
    }
    setState(next);
  }, []);

  useEffect(() => {
    if (!state || saveError) return;
    try { localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(state)); setSaved(true); }
    catch { setSaveError(true); setSaved(false); setMessage('浏览器保存失败，请导出当前备份，避免关闭后丢失。'); }
  }, [state, saveError]);

  useEffect(() => {
    if (activeStep === undefined) return;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeStep]);

  function update(fn: (current: AssessmentState) => AssessmentState) {
    setSaved(false); setAddedToPool(false);
    setState(current => current ? { ...fn(current), updatedAt: new Date().toISOString() } : current);
  }
  function edit(changes: Partial<Direction>) { update(s => ({ ...s, direction: { ...s.direction, ...changes } })); }
  function goNext() {
    if (!state || !canContinue(state.direction, state.step)) return;
    if (!saveError) setMessage('');
    if (state.step === RESULT_STEP - 1) {
      try { update(finishAssessment); } catch (error) { setMessage(error instanceof Error ? error.message : '请完成评分。'); }
    } else update(s => ({ ...s, step: s.step + 1 }));
  }
  function startNew() {
    if (!state) return;
    if (state.step !== RESULT_STEP && (state.direction.name || Object.keys(state.direction.scores).length) && !window.confirm('开始新的方向会替换当前未完成的草稿。已完成的历史评估会保留，是否继续？')) return;
    update(s => ({ ...s, direction: newDirection(''), step: 0 })); setHistoryOpen(false); setMessage('');
  }
  function addToPool() {
    if (!state) return;
    try {
      const raw = localStorage.getItem(EXPLORER_STORAGE_KEY);
      const workspace = raw ? parseWorkspace(raw) : initialWorkspace();
      localStorage.setItem(EXPLORER_STORAGE_KEY, JSON.stringify(mergeIntoExplorer(workspace, state.direction)));
      setAddedToPool(true); setMessage('这份评估已加入方向池。可以在方向探索工作台中与其他方向对比。');
    } catch (error) { setMessage(error instanceof Error ? error.message : '加入失败，请先导出备份。'); }
  }
  function exportResult() {
    if (!state) return;
    download(JSON.stringify({ version: 1, directions: [state.direction], snapshots: [], updatedAt: state.updatedAt }, null, 2), '方向评估结果.json');
  }

  if (!state) return <main className={styles.loading}>正在打开方向评估向导…</main>;
  const { direction, step } = state;
  const current = ASSESSMENT_STEPS[step];
  const result = step === RESULT_STEP;
  const observations = result ? assessmentObservations(direction) : null;
  const progress = step / RESULT_STEP * 100;
  const answered = current.dimensions?.filter(d => direction.scores[d.id] !== undefined).length ?? 0;
  const optionalFilled = REFLECTIONS.filter(f => direction.notes[f.id]?.trim()).length + direction.week.filter(v => v.trim()).length;

  const noteFields = (fields: typeof REFLECTIONS) => fields.map(field => <label className={styles.textField} key={field.id}><span>{field.title}</span><textarea maxLength={10000} rows={2} value={direction.notes[field.id] ?? ''} placeholder={field.hint} onChange={e => edit({ notes: { ...direction.notes, [field.id]: e.target.value } })} /></label>);
  const renderScore = (id: string, title: string, value: number | null | undefined, onChange: (value: number) => void) => <fieldset className={styles.scoreFieldset}><legend className={styles.srOnly}>{title}评分</legend><div className={styles.scoreOptions}>{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <label key={n}><input type="radio" name={id} value={n} aria-label={`${title} ${n} 分`} checked={value === n} onChange={() => onChange(n)} /><span>{n}</span></label>)}</div><div className={styles.scoreEnds}><span>1 · 很低 / 不认同</span><span>10 · 很高 / 很认同</span></div></fieldset>;

  return <main className={styles.container}>
    <div className={styles.progressWrap} role="progressbar" aria-label="评估进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><span style={{ width: `${progress}%` }} /></div>
    <header className={styles.header}><Link href="/"><ArrowLeft size={16} /> 工具中心</Link><div><span className={styles.saved} role="status">{saveError ? '保存已暂停' : saved ? '已自动保存' : '正在保存…'}</span><button type="button" onClick={() => setHistoryOpen(v => !v)}><History size={16} /> 历史评估{state.reports.length ? ` · ${state.reports.length}` : ''}</button></div></header>
    <div className={`${styles.content} ${result ? styles.resultContent : ''}`}>
      {message && <div className={styles.notice} role="status"><span>{message}</span><button type="button" aria-label="关闭提示" onClick={() => setMessage('')}><X size={16} /></button></div>}
      {saveError && <div className={styles.recovery}><button type="button" onClick={() => download(JSON.stringify(state, null, 2), '方向评估草稿备份.json')}>导出当前备份</button><button type="button" onClick={() => { try { const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY); if (raw) download(raw, '方向评估原始记录.json'); else setMessage('没有可读取的原始记录，请导出当前备份。'); } catch { setMessage('无法读取本地存储，请导出当前备份。'); } }}>导出原始记录</button><button type="button" onClick={() => { if (window.confirm('用当前页面内容覆盖原有本地记录，恢复自动保存？')) setSaveError(false); }}>恢复保存</button></div>}
      {historyOpen && <section className={styles.history}><div className={styles.historyHeading}><h2>最近的评估</h2><button type="button" aria-label="关闭历史评估" onClick={() => setHistoryOpen(false)}><X size={18} /></button></div><p>保留最近 30 个已完成方向；修改后生成结果会更新同一份记录。</p>{!state.reports.length && <p className={styles.empty}>完成第一份评估后，它会出现在这里。</p>}{state.reports.map(report => <button type="button" className={styles.reportRow} key={report.direction.id} onClick={() => { if (step !== RESULT_STEP && (direction.name || Object.keys(direction.scores).length) && !window.confirm('查看历史评估会替换当前草稿，是否继续？')) return; update(s => ({ ...s, direction: structuredClone(report.direction), step: RESULT_STEP })); setHistoryOpen(false); setMessage(''); }}><span><strong>{report.direction.name}</strong><small>{new Date(report.completedAt).toLocaleString('zh-CN', { hour12: false })}</small></span><ArrowRight size={17} /></button>)}</section>}
      {!result && <>
        <div className={styles.kicker}><Compass size={18} /><span>方向评估向导</span><span>{step === 0 ? '一次只认真想一个方向' : `${direction.name} · ${step} / ${RESULT_STEP - 1}`}</span></div>
        <nav className={styles.phases} aria-label="评估阶段">{PHASES.map((phase, i) => <span key={phase} aria-current={current.phase === phase ? 'step' : undefined} className={PHASES.indexOf(current.phase) > i ? styles.phaseDone : current.phase === phase ? styles.phaseActive : ''}>{PHASES.indexOf(current.phase) > i ? <Check size={12} /> : <b>{i + 1}</b>}{phase}</span>)}</nav>
        <form onSubmit={e => { e.preventDefault(); goNext(); }} className={styles.form}>
          <section key={current.id} aria-labelledby="assessment-heading">
            <p className={styles.sectionLabel}>{step === 0 ? '开始之前' : current.phase}{current.optional && ' · 可选补充'}</p>
            <h1 id="assessment-heading" ref={heading} tabIndex={-1} className={styles.title}>{current.title}</h1>
            <p className={styles.hint}>{current.hint}</p>
            {step === 0 && <>
              <label className={styles.textField}><span>我想评估的方向 <em>必填</em></span><input autoComplete="off" maxLength={120} value={direction.name} placeholder="例如：面向海外创业公司的稀缺人才数据 API" onChange={e => edit({ name: e.target.value })} /></label>
              <label className={styles.textField}><span>为谁，解决什么问题？ <small>选填</small></span><textarea maxLength={2000} rows={3} value={direction.description} placeholder="尽量具体：谁会用？它帮对方完成什么？" onChange={e => edit({ description: e.target.value })} /></label>
              <div className={styles.introNote}><CheckCircle2 size={19} /><p>30 项评分，每步 3 题，约 8–12 分钟。<br />先填写感受，最后再一起看结果。进度自动保存在当前浏览器。</p></div>
              <Link className={styles.secondaryLink} href="/tools/direction-explorer">想同时比较多个方向？前往方向探索工作台 <ArrowRight size={14} /></Link>
            </>}
            {current.dimensions && <>
              {step === 6 && <div className={styles.transitionNote}>关于内心的 15 项评分已完成。接下来把资源、用户和商业假设带进来；结果会在最后统一呈现。</div>}
              {current.dimensions.map((dimension, i) => <article className={styles.questionCard} key={dimension.id}><div className={styles.questionTop}><span>{i + 1}</span><h2>{dimension.title}</h2>{dimension.focus && <small>重点观察</small>}<strong>{direction.scores[dimension.id] ?? '—'}<small> / 10</small></strong></div><p>{dimension.question}</p>{renderScore(dimension.id, dimension.title, direction.scores[dimension.id], n => edit({ scores: { ...direction.scores, [dimension.id]: n } }))}<details className={styles.evidence}><summary>记下一件真实发生的事{direction.notes[dimension.id] ? ' · 已填写' : '（选填）'}</summary><textarea aria-label={`${dimension.title}的评分依据`} maxLength={10000} rows={2} placeholder="是什么经历或证据，让你给出这个分数？" value={direction.notes[dimension.id] ?? ''} onChange={e => edit({ notes: { ...direction.notes, [dimension.id]: e.target.value } })} /></details></article>)}
              <p className={styles.stepHint} aria-live="polite">本步已填写 {answered} / {current.dimensions.length} 项{answered < current.dimensions.length ? '，全部选择后可继续。' : '，可以继续。'}</p>
            </>}
            {current.id === 'motivation' && <div className={styles.writingCard}>{noteFields(REFLECTIONS)}</div>}
            {current.id === 'daily' && <div className={styles.writingCard}><WeekAIPrefill source={direction} week={direction.week} onApply={(source, week, mode) => update(s => ({ ...s, direction: applyGeneratedWeek(s.direction, source, week, mode) }))} /><p className={styles.example}>例如，硬件的一周可能是找结构工程师、谈模具、拍素材、处理售后；数据产品可能是找数据源、清洗、建模和客户访谈。</p>{WEEK.map((day, i) => <label className={styles.dayRow} key={day}><span>{day}</span><textarea rows={2} maxLength={10000} aria-label={`${day}的日常工作`} placeholder="上午 10 点，我在做什么？" value={direction.week[i]} onChange={e => { const week = [...direction.week]; week[i] = e.target.value; edit({ week }); }} /></label>)}<h2 className={styles.dailyTitle}>我有多愿意长期过这样的生活？</h2>{renderScore('dailyScore', '日常生活意愿', direction.dailyScore, n => edit({ dailyScore: n }))}<p className={styles.stepHint}>这项分数单独呈现，不计入四项指数。</p></div>}
            {current.id === 'plan' && <div className={styles.writingCard}>{noteFields(PLAN_FIELDS.filter(f => MAIN_PLAN_IDS.includes(f.id)))}<details className={styles.morePlan}><summary>补充趋势、启动路径与真实反馈（选填）</summary>{noteFields(PLAN_FIELDS.filter(f => !MAIN_PLAN_IDS.includes(f.id)))}</details></div>}
          </section>
          <div className={styles.navigation}><button type="button" className={styles.previous} disabled={step === 0} onClick={() => update(s => ({ ...s, step: s.step - 1 }))}><ArrowLeft size={17} /> 上一步</button><div>{current.optional && <span>可以留空继续</span>}<button type="submit" className={styles.primary} disabled={!canContinue(direction, step)}>{step === 0 ? '开始评估' : step === RESULT_STEP - 1 ? '生成评估结果' : '下一步'}<ArrowRight size={17} /></button></div></div>
        </form>
      </>}
      {result && observations && <section aria-labelledby="assessment-heading" className={styles.results}>
        <div className={styles.resultIntro}><div className={styles.doneIcon}><CheckCircle2 size={30} /></div><p className={styles.sectionLabel}>这一次，我对自己的了解</p><h1 id="assessment-heading" ref={heading} tabIndex={-1} className={styles.resultTitle}>{direction.name}</h1>{direction.description && <p className={styles.resultDescription}>{direction.description}</p>}<span className={styles.resultBadge}>30 项评分已完成</span></div>
        <div className={styles.indexGrid}>{INDICES.map(index => { const score = indexScore(direction, index.id); return <article className={styles.indexCard} data-index={index.id} key={index.id}><p>{index.en}</p><strong>{score.value?.toFixed(1)}<small> / 10</small></strong><h2>{index.name}</h2><span>{score.total} 个维度等权平均</span></article>; })}</div>
        <div className={styles.observation}><p className={styles.sectionLabel}>根据你的自评分，值得留意</p><h2>{observations.title}</h2><ul>{observations.notes.map(note => <li key={note}>{note}</li>)}</ul><small>7 分及以上仅作为较强信号，低于 5 分仅提示值得验证。四项指数互相独立，不合成总分；它们不代表市场需求已经得到验证。</small></div>
        <div className={styles.signalGrid}><div className={styles.resultCard}><h2>较强的信号</h2>{observations.strengths.length ? observations.strengths.map(d => <p className={styles.signal} key={d.id}><span>{d.title}</span><strong>{direction.scores[d.id]} / 10</strong></p>) : <p className={styles.muted}>目前没有达到 7 分的维度，可以从一件愿意亲自试的小事开始。</p>}</div><div className={styles.resultCard}><h2>优先验证的疑虑</h2>{observations.questions.length ? observations.questions.map(d => <p className={styles.signal} key={d.id}><span>{d.title}</span><strong>{direction.scores[d.id]} / 10</strong></p>) : <p className={styles.muted}>目前没有低于 5 分的维度。仍需要让这些判断接触真实用户。</p>}</div></div>
        <div className={styles.resultCard}><div className={styles.cardHeading}><h2>动机与真实日常</h2><button type="button" onClick={() => update(s => ({ ...s, step: 11 }))}>补充 / 修改 <ArrowRight size={14} /></button></div>{!optionalFilled && <p className={styles.muted}>你暂时跳过了文字补充。之后可以回到动机与日常，继续完善。</p>}{REFLECTIONS.filter(f => direction.notes[f.id]?.trim()).map(f => <div className={styles.answer} key={f.id}><h3>{f.title}</h3><p>{direction.notes[f.id]}</p></div>)}{direction.week.some(v => v.trim()) && <div className={styles.weekAnswers}>{WEEK.map((day, i) => direction.week[i].trim() && <p key={day}><strong>{day}</strong><span>{direction.week[i]}</span></p>)}</div>}<p className={styles.dailyResult}>日常生活意愿：<strong>{direction.dailyScore === null ? '尚未填写' : `${direction.dailyScore} / 10`}</strong></p></div>
        <div className={styles.resultCard}><div className={styles.cardHeading}><h2>给自己的验证计划</h2><button type="button" onClick={() => update(s => ({ ...s, step: RESULT_STEP - 1 }))}>补充 / 修改 <ArrowRight size={14} /></button></div>{PLAN_FIELDS.map(f => <div className={styles.answer} key={f.id}><h3>{f.title}</h3><p className={direction.notes[f.id]?.trim() ? '' : styles.muted}>{direction.notes[f.id]?.trim() || '尚未填写，之后可以补充。'}</p></div>)}</div>
        <details className={styles.allScores}><summary>查看全部 30 项评分与依据</summary>{ASSESSMENT_STEPS.filter(s => s.dimensions).map((s, i) => <div key={s.id}><div className={styles.cardHeading}><h3>{s.title}</h3><button type="button" onClick={() => update(current => ({ ...current, step: i + 1 }))}>修改本组</button></div>{s.dimensions?.map(d => <div className={styles.scoreDetail} key={d.id}><p><span>{d.title}</span><strong>{direction.scores[d.id]} / 10</strong></p>{direction.notes[d.id]?.trim() && <small>{direction.notes[d.id]}</small>}</div>)}</div>)}</details>
        <div className={styles.resultActions}><button type="button" className={styles.primary} onClick={addToPool}>{addedToPool ? <Check size={17} /> : <Save size={17} />}{addedToPool ? '已加入方向池' : '加入方向池，继续对比'}</button><button type="button" className={styles.secondary} onClick={exportResult}><Download size={17} /> 导出结果</button><button type="button" className={styles.secondary} onClick={startNew}><Plus size={17} /> 评估另一个方向</button></div>
        <Link href="/tools/direction-explorer" className={styles.secondaryLink}>前往方向探索工作台 <ArrowRight size={15} /></Link>
      </section>}
      <footer className={styles.footer}><span>先诚实地回答，再允许答案改变。</span><span>评分与笔记保存在当前浏览器 · AI 预填仅发送方向名称与描述</span></footer>
    </div>
  </main>;
}
