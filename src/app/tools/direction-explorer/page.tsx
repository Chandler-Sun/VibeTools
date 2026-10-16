'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Compass, Download, History, Plus, Upload, X } from 'lucide-react';
import { completion, DIMENSIONS, Direction, exportCsv, indexScore, IndexKey, INDICES, initialWorkspace, INNER, newDirection, parseWorkspace, PLAN_FIELDS, REALITY, REFLECTIONS, Workspace } from '@/lib/direction-explorer';
import styles from './page.module.css';
import WeekAIPrefill from '@/components/WeekAIPrefill';
import { applyGeneratedWeek } from '@/lib/direction-week';

const STORAGE_KEY = 'direction-explorer:v1';
const TABS = ['内心吸引力', '现实适配度', '动机与日常', '验证计划', '方向对比'] as const;
const WEEK = ['周一', '周二', '周三', '周四', '周五'];
function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function displayDate(value: string) { return new Date(value).toLocaleString('zh-CN', { hour12: false }); }

export default function DirectionExplorer() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selectedId, setSelectedId] = useState('seed-0');
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [message, setMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [historyName, setHistoryName] = useState('');
  const [sort, setSort] = useState('original');
  const [realityVisible, setRealityVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState<Workspace | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let state = initialWorkspace();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) state = parseWorkspace(raw);
    } catch {
      setStorageBlocked(true);
      setMessage('无法读取原有数据。为保护原记录，自动保存已暂停。请先导出原始数据，或导入有效备份。');
    }
    setWorkspace(state); setSelectedId(state.directions[0].id);
  }, []);

  useEffect(() => {
    if (!workspace || storageBlocked) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); setSaved(true); }
    catch { setSaved(false); setStorageBlocked(true); setMessage('浏览器保存失败。请导出 JSON 备份，避免关闭页面后丢失。'); }
  }, [workspace, storageBlocked]);

  function update(change: (current: Workspace) => Workspace) {
    setSaved(false);
    setWorkspace(current => current ? { ...change(current), updatedAt: new Date().toISOString() } : current);
  }
  function editDirection(change: Partial<Direction>) {
    update(w => ({ ...w, directions: w.directions.map(d => d.id === selectedId ? { ...d, ...change } : d) }));
  }
  function setScore(id: string, value?: number) {
    if (!direction) return;
    const scores = { ...direction.scores };
    if (value === undefined) delete scores[id]; else scores[id] = value;
    editDirection({ scores });
  }
  function note(id: string, value: string) { if (direction) editDirection({ notes: { ...direction.notes, [id]: value } }); }
  function addDirection(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim() || !workspace || workspace.directions.length >= 100) return;
    const d = newDirection(newName.trim());
    update(w => ({ ...w, directions: [...w.directions, d] }));
    setSelectedId(d.id); setShowAdd(false); setNewName(''); setTab(0);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('备份超过 10 MB，请选择较小的文件。');
      setPendingImport(parseWorkspace(await file.text()));
    } catch (error) { setMessage(error instanceof Error ? error.message : '无法导入该文件。'); }
    if (fileInput.current) fileInput.current.value = '';
  }
  function snapshot() {
    if (!workspace || workspace.snapshots.length >= 30) { setMessage('已保存 30 个快照。请先导出备份，再删除不需要的快照。'); return; }
    update(w => ({ ...w, snapshots: [{ id: crypto.randomUUID(), label: historyName.trim() || '阶段复评', createdAt: new Date().toISOString(), directions: JSON.parse(JSON.stringify(w.directions)) }, ...w.snapshots] }));
    setHistoryName(''); setMessage('已保存这一刻的评分与笔记，可在历史中查看或恢复。');
  }
  const direction = workspace?.directions.find(d => d.id === selectedId) ?? workspace?.directions[0];
  if (!workspace || !direction) return <main className={styles.loading}>正在打开你的方向工作台…</main>;
  const filled = completion(direction);
  const innerFilled = INNER.filter(d => direction.scores[d.id] !== undefined).length;
  const realityFilled = REALITY.filter(d => direction.scores[d.id] !== undefined).length;
  const dimensions = tab === 0 ? INNER : REALITY;
  const ranked = [...workspace.directions].sort((a, b) => sort === 'original' ? 0 : (indexScore(b, sort as IndexKey).value ?? -1) - (indexScore(a, sort as IndexKey).value ?? -1));
  const plotted = workspace.directions.filter(d => { const x = indexScore(d, 'edge'), y = indexScore(d, 'desire'); return x.answered === x.total && y.answered === y.total; });

  const scoreButtons = (value: number | undefined | null, onChange: (v: number) => void, title: string) => (
    <div className={styles.scoreButtons} role="group" aria-label={`${title}评分`}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button type="button" key={n} aria-label={`${title} ${n} 分`} aria-pressed={value === n} className={value === n ? styles.chosenScore : ''} onClick={() => onChange(n)}>{n}</button>)}
    </div>
  );
  const textFields = (fields: typeof REFLECTIONS) => fields.map((field, i) => <label className={styles.textField} key={field.id}><span><b>{String(i + 1).padStart(2, '0')}</b>{field.title}</span><textarea maxLength={10000} rows={3} placeholder={field.hint} value={direction.notes[field.id] ?? ''} onChange={e => note(field.id, e.target.value)} /></label>);

  return <main className={styles.app}>
    <header className={styles.topbar}>
      <Link href="/" className={styles.back}><ArrowLeft size={16} /> 工具中心</Link>
      <span className={styles.brand}><Compass size={20} /> 方向探索 <span> / PERSONAL LAB</span></span>
      <span className={`${styles.saveState} ${storageBlocked ? styles.errorText : ''}`} role="status"><span />{storageBlocked ? '自动保存已暂停' : saved ? '已保存到此浏览器' : '正在保存…'}</span>
    </header>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}>A LITTLE CLOSER TO WHAT YOU WANT</p><h1>下一步，想走向哪里<span>？</span></h1><p className={styles.heroText}>把「想做」和「适合做」分别看清。给每个方向一点诚实的时间。</p></div>
        <div className={styles.actions}>
          <Link href="/tools/direction-assessment" className={styles.wizardLink}><Compass size={16} /> 逐步评估一个方向</Link>
          <button onClick={() => setShowHistory(v => !v)}><History size={16} /> 历史快照{workspace.snapshots.length > 0 && ` · ${workspace.snapshots.length}`}</button>
          <button onClick={() => fileInput.current?.click()}><Upload size={16} /> 导入</button>
          <button onClick={() => download(JSON.stringify(workspace, null, 2), '方向探索备份.json', 'application/json')}><Download size={16} /> 备份</button>
          <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={e => importFile(e.target.files?.[0])} />
        </div>
      </section>
      {message && <div className={styles.notice} role="status"><span>{message}</span><button aria-label="关闭提示" onClick={() => setMessage('')}><X size={16} /></button></div>}
      {storageBlocked && <div className={styles.notice}><span>你仍可填写并导出备份。恢复浏览器保存会覆盖原有本地记录。</span><button onClick={() => { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) download(raw, '方向探索原始数据.json', 'application/json'); else setMessage('没有可导出的原始记录，请导出当前备份。'); } catch { setMessage('浏览器不允许读取本地存储，请导出当前备份。'); } }}>导出原始数据</button><button onClick={() => { if (window.confirm('用当前页面的数据覆盖原有本地记录，并恢复自动保存？')) setStorageBlocked(false); }}>恢复保存</button></div>}
      {pendingImport && <section className={styles.importConfirm} aria-label="确认导入"><div><strong>即将导入 {pendingImport.directions.length} 个方向和 {pendingImport.snapshots.length} 个快照</strong><p>导入会替换当前记录。建议先点击右上角「备份」保存现有内容。</p></div><button onClick={() => setPendingImport(null)}>取消</button><button className={styles.primary} onClick={() => { update(() => pendingImport); setSelectedId(pendingImport.directions[0].id); setPendingImport(null); setStorageBlocked(false); setMessage('已导入备份。'); }}>确认替换并导入</button></section>}
      {showHistory && <section className={styles.historyPanel}>
        <div className={styles.sectionHeading}><div><h2>给现在的判断，留一个时间坐标</h2><p>快照包含所有方向、评分和笔记；最多保留 30 份。恢复前会提示备份。</p></div><button aria-label="关闭历史" onClick={() => setShowHistory(false)}><X size={18} /></button></div>
        <form className={styles.inlineForm} onSubmit={e => { e.preventDefault(); snapshot(); }}><input aria-label="快照名称" placeholder="例如：访谈 3 位客户之后" maxLength={120} value={historyName} onChange={e => setHistoryName(e.target.value)} /><button className={styles.primary}>保存当前快照</button></form>
        {!workspace.snapshots.length && <p className={styles.muted}>还没有快照。完成第一轮评分后，留下一份记录。</p>}
        {workspace.snapshots.map(s => <div className={styles.historyRow} key={s.id}><div><strong>{s.label}</strong><small>{displayDate(s.createdAt)} · {s.directions.length} 个方向</small></div><button onClick={() => download(JSON.stringify({ version: 1, directions: s.directions, snapshots: [], updatedAt: s.createdAt }), `${s.label}.json`, 'application/json')}>导出</button><button onClick={() => { if (window.confirm(`恢复「${s.label}」会覆盖当前评分与笔记。请确认已导出当前备份。`)) { update(w => ({ ...w, directions: JSON.parse(JSON.stringify(s.directions)) })); setSelectedId(s.directions[0].id); setMessage('已恢复快照。'); } }}>恢复</button><button aria-label={`删除快照 ${s.label}`} onClick={() => { if (window.confirm('删除这个历史快照？')) update(w => ({ ...w, snapshots: w.snapshots.filter(item => item.id !== s.id) })); }}><X size={15} /></button></div>)}
      </section>}
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <div className={styles.sideHeading}><h2>我的方向池 <span>{workspace.directions.length}</span></h2><button aria-label="添加方向" onClick={() => setShowAdd(v => !v)} disabled={workspace.directions.length >= 100}><Plus size={18} /></button></div>
          {showAdd && <form className={styles.addForm} onSubmit={addDirection}><input autoFocus required aria-label="新方向名称" placeholder="给新方向一个名字" maxLength={120} value={newName} onChange={e => setNewName(e.target.value)} /><button className={styles.primary}>添加方向</button></form>}
          <nav className={styles.directionList} aria-label="方向池">{workspace.directions.map((d, i) => <button key={d.id} className={d.id === direction.id ? styles.selectedDirection : ''} onClick={() => setSelectedId(d.id)}><span className={styles.directionNumber}>{String(i + 1).padStart(2, '0')}</span><span className={styles.directionName}>{d.name}<small>{completion(d) === 0 ? '还没开始，慢慢来' : `${completion(d)} / 30 项已评`}</small></span>{completion(d) === 30 && <Check size={14} />}</button>)}</nav>
          <div className={styles.sideNote}><Compass size={20} /><p>全球化可以是一种分发方式，<br />抗 AI 复制是一项共同约束。<br />方向之间允许重叠。</p></div>
        </aside>
        <div className={styles.content}>
          <section className={styles.directionHeader}>
            <div className={styles.directionMeta}><span className={styles.pill}>EXPLORING · 探索中</span><span>{filled} / 30 评分维度</span></div>
            <div className={styles.titleRow}><h2>{direction.name}</h2><details className={styles.editMenu}><summary aria-label="编辑方向"><ChevronDown size={18} /></summary><div><label>方向名称<input value={direction.name} maxLength={120} onChange={e => { if (e.target.value.trim()) editDirection({ name: e.target.value }); }} /></label><label>一句话描述<textarea value={direction.description} maxLength={2000} onChange={e => editDirection({ description: e.target.value })} /></label><button disabled={workspace.directions.length <= 1} className={styles.deleteButton} onClick={() => { if (window.confirm(`删除「${direction.name}」以及它的评分与笔记？`)) { const remaining = workspace.directions.filter(d => d.id !== direction.id); update(w => ({ ...w, directions: remaining })); setSelectedId(remaining[0].id); } }}>删除此方向</button></div></details></div>
            <p>{direction.description || '写下一句话，描述你想为谁做什么。可通过右侧菜单编辑。'}</p>
            <div className={styles.progressTrack}><span style={{ width: `${filled / 30 * 100}%` }} /></div>
          </section>
          <div className={styles.indexGrid}>{INDICES.map(index => { const score = indexScore(direction, index.id); const hidden = !realityVisible && (index.id === 'edge' || index.id === 'opportunity'); return <div className={styles.indexCard} key={index.id} data-index={index.id}><span>{index.en}</span><strong>{hidden ? '···' : score.value?.toFixed(1) ?? '—'}<small>{!hidden && score.value !== null ? ' / 10' : ''}</small></strong><p>{index.name}</p><small>{hidden ? '先听听自己的内心' : `${score.answered} / ${score.total} 项${score.answered < score.total && score.answered > 0 ? ' · 暂定均分' : ''}`}</small></div>; })}</div>
          <nav className={styles.tabs} aria-label="评估步骤">{TABS.map((title, i) => <button key={title} aria-current={tab === i ? 'step' : undefined} className={tab === i ? styles.activeTab : ''} onClick={() => { setTab(i); if (i === 1) setRealityVisible(true); }}><span>{String(i + 1).padStart(2, '0')}</span>{title}</button>)}</nav>
          {(tab === 0 || tab === 1) && <section className={styles.panel}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>{tab === 0 ? 'LISTEN TO YOURSELF' : 'GROUND IT IN REALITY'}</p><h3>{tab === 0 ? '先不想能不能，只问想不想。' : '让想法，接触一点真实世界。'}</h3><p>{tab === 0 ? '1 = 完全不认同，10 = 非常认同。先按直觉填写，再用事实校准。' : '所有维度均为正向：越有优势、越容易启动、越难复制，分数越高。'}</p></div><span className={styles.count}>{tab === 0 ? innerFilled : realityFilled} / 15</span></div>
            {tab === 0 && <div className={styles.tip}><span>✳</span> 多留意主动关注度、苦活接受度、嫉妒信号和遗憾值。它们值得你用真实经历核对。</div>}
            {dimensions.map((dimension, i) => <article className={styles.question} key={dimension.id}>
              <div className={styles.questionTop}><span className={styles.questionNumber}>{String(i + 1).padStart(2, '0')}</span><div><h4>{dimension.title}{dimension.focus && <span>重点观察</span>}</h4><p>{dimension.question}</p></div><span className={styles.scoreValue}>{direction.scores[dimension.id] ?? '—'}<small>/ 10</small></span></div>
              {scoreButtons(direction.scores[dimension.id], n => setScore(dimension.id, n), dimension.title)}
              <div className={styles.scaleCaption}><span>1 · 很低 / 不认同</span><button disabled={direction.scores[dimension.id] === undefined} onClick={() => setScore(dimension.id)}>清除评分</button><span>10 · 很高 / 很认同</span></div>
              <details className={styles.evidence}><summary>写下评分依据{direction.notes[dimension.id] ? ' · 已填写' : '（可选）'}</summary><textarea aria-label={`${dimension.title}的评分依据`} maxLength={10000} rows={2} placeholder="哪件真实发生的事，让你打出这个分数？" value={direction.notes[dimension.id] ?? ''} onChange={e => note(dimension.id, e.target.value)} /></details>
            </article>)}
            <div className={styles.panelFooter}><p>未填项保持空白，不计作 0 分。分数只帮助观察自己。</p><button className={styles.primary} onClick={() => { setTab(tab + 1); if (tab === 0) setRealityVisible(true); }}>继续：{TABS[tab + 1]} <ArrowRight size={16} /></button></div>
          </section>}
          {tab === 2 && <section className={styles.panel}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE LIFE BEHIND THE IDEA</p><h3>你想过的，是哪一种日常？</h3><p>把方向带来的光环拿开，看看剩下的工作和生活。</p></div></div>{textFields(REFLECTIONS)}<div className={styles.weekSection}><h3>模拟真实的一周</h3><WeekAIPrefill source={direction} week={direction.week} onApply={(source, week, mode) => update(w => ({ ...w, directions: w.directions.map(d => applyGeneratedWeek(d, source, week, mode)) }))} /><p>填写你实际会做的事，包括最琐碎的部分。硬件可能是谈模具和处理售后；数据可能是清洗、建模和客户访谈。</p>{WEEK.map((day, i) => <label className={styles.dayRow} key={day}><span>{day}</span><textarea aria-label={`${day}的日常工作`} rows={2} maxLength={10000} placeholder="上午 10 点，我在做什么？" value={direction.week[i]} onChange={e => { const week = [...direction.week]; week[i] = e.target.value; editDirection({ week }); }} /></label>)}<h4>这样的生活，我愿意过多久？</h4><p>1 = 一点也不想，10 = 很愿意长期过。单独记录，不混入四项指数。</p>{scoreButtons(direction.dailyScore, n => editDirection({ dailyScore: n }), '日常生活意愿')}<button className={styles.textButton} disabled={direction.dailyScore === null} onClick={() => editDirection({ dailyScore: null })}>清除日常评分</button></div><div className={styles.panelFooter}><p>喜欢「做成以后的自己」，也值得诚实地记下来。</p><button className={styles.primary} onClick={() => setTab(3)}>继续：验证计划 <ArrowRight size={16} /></button></div></section>}
          {tab === 3 && <section className={styles.panel}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>SMALL BETS, REAL SIGNALS</p><h3>下一步，做一个最小实验。</h3><p>先找可能推翻想法的证据，再决定投入多少时间和资源。</p></div></div>{textFields(PLAN_FIELDS)}<div className={styles.panelFooter}><p>真实付费、重复使用与实际行为，比口头兴趣更有信息量。</p><button className={styles.primary} onClick={() => setTab(4)}>查看方向对比 <ArrowRight size={16} /></button></div></section>}
          {tab === 4 && <section className={styles.panel}>
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>PATTERNS, NOT A WINNER</p><h3>看见差异，给选择留一点空间。</h3><p>四项指数各自独立，不加权、不合成总分。每项按所属已填维度等权平均。</p></div></div>
            {!realityVisible ? <div className={styles.reveal}><h4>先完成内心评分，再看看现实。</h4><p>展示对比将同时显示个人优势与生意机会。你可以现在揭晓，也可以回去继续填写。</p><button className={styles.primary} onClick={() => setRealityVisible(true)}>显示完整对比</button></div> : <>
              <div className={styles.mapHeader}><h4>想做 × 有优势</h4><span>仅绘制 Desire 与 Edge 均填完整的方向 · {plotted.length} 个</span></div>
              <div className={styles.map}>
                <div className={styles.quadrantLabels}><span>想做的新世界<br /><small>高 Desire · 低 Edge</small></span><span>值得拿小实验验证<br /><small>高 Desire · 高 Edge</small></span><span>可以暂时放下<br /><small>低 Desire · 低 Edge</small></span><span>熟悉，但未必向往<br /><small>低 Desire · 高 Edge</small></span></div>
                <div className={styles.horizontalLine} /><div className={styles.verticalLine} />
                {plotted.map(d => { const x = indexScore(d, 'edge').value!, y = indexScore(d, 'desire').value!; const i = workspace.directions.indexOf(d); return <button key={d.id} aria-label={`选择${d.name}，Desire ${y.toFixed(1)}，Edge ${x.toFixed(1)}`} title={`${d.name} · Desire ${y.toFixed(1)} / Edge ${x.toFixed(1)}`} className={`${styles.dot} ${direction.id === d.id ? styles.activeDot : ''}`} style={{ left: `${5 + (x - 1) / 9 * 90}%`, bottom: `${5 + (y - 1) / 9 * 90}%`, transform: `translate(calc(-50% + ${(i % 3 - 1) * 5}px), calc(50% + ${(Math.floor(i / 3) % 3 - 1) * 5}px))` }} onClick={() => setSelectedId(d.id)}>{i + 1}</button>; })}
                {!plotted.length && <div className={styles.mapEmpty}>完成一个方向的内心想做与个人优势评分，<br />让它出现在这张地图上。</div>}
              </div><div className={styles.mapAxes}><span>↑ Desire · 内心想做（1–10）</span><span>Edge · 个人优势（1–10）→</span></div>
            </>}
            <div className={styles.tableActions}><label>排列方式 <select aria-label="排列方式" value={sort} onChange={e => setSort(e.target.value)}><option value="original">方向池顺序</option>{INDICES.filter(i => realityVisible || i.id === 'desire' || i.id === 'endurance').map(i => <option key={i.id} value={i.id}>{i.en} 从高到低</option>)}</select></label><button onClick={() => download(exportCsv(workspace.directions), '方向探索评分.csv', 'text/csv;charset=utf-8')}><Download size={15} /> 导出 CSV</button></div>
            <div className={styles.tableScroll}><table className={styles.comparisonTable}><caption className={styles.srOnly}>方向独立指数对比</caption><thead><tr><th>方向</th>{INDICES.map(i => <th key={i.id}>{i.en}<small>{i.name}</small></th>)}<th>日常意愿</th></tr></thead><tbody>{ranked.map(d => <tr key={d.id} className={d.id === direction.id ? styles.currentRow : ''}><th><button onClick={() => { setSelectedId(d.id); setTab(0); }}>{String(workspace.directions.indexOf(d) + 1).padStart(2, '0')} · {d.name}</button><small>{completion(d)} / 30 项</small></th>{INDICES.map(i => { const s = indexScore(d, i.id); return <td key={i.id}>{!realityVisible && (i.id === 'edge' || i.id === 'opportunity') ? '待揭晓' : <><strong>{s.value?.toFixed(1) ?? '—'}</strong><small>{s.answered} / {s.total}{s.answered > 0 && s.answered < s.total ? ' · 暂定' : ''}</small></>}</td>; })}<td>{d.dailyScore ?? '—'}</td></tr>)}</tbody></table></div>
            <details className={styles.formula}><summary>四项指数如何计算？</summary><p>以下是工具的分类方式，可用于回看评分来源。没有预填你的个人分数。</p>{INDICES.map(i => <p key={i.id}><strong>{i.en}：</strong>{DIMENSIONS.filter(d => d.index === i.id).map(d => d.title).join('、')}。</p>)}<p>未填项不计入均分；未完整的指数显示「暂定」，不适合与完整评分直接排序比较。地图中线为 5.5，象限文字只作观察提示。</p></details>
          </section>}
        </div>
      </div>
      <footer className={styles.footer}><span>一份可以不断修改的答案，而不是一次必须正确的决定。</span><span>仅保存在当前浏览器 · 跨设备请导出 / 导入 JSON 备份</span></footer>
    </div>
  </main>;
}
