'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Settings2, Sparkles, X } from 'lucide-react';
import { WeekApplyMode, WeekSource } from '@/lib/direction-week';
import { clearAISettings, generateBrowserWeek, LOCAL_AI_KEY, LocalAISettings, readAISettings, saveAISettings } from '@/lib/direction-ai-settings';
import styles from './WeekAIPrefill.module.css';

interface Props {
  source: WeekSource;
  week: string[];
  onApply: (source: WeekSource, week: string[], mode: WeekApplyMode) => void;
}
const DAYS = ['周一', '周二', '周三', '周四', '周五'];

export default function WeekAIPrefill({ source, week, onApply }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [proposal, setProposal] = useState<{ source: WeekSource; week: string[] } | null>(null);
  const [settings, setSettings] = useState<LocalAISettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftKey, setDraftKey] = useState('');
  const [draftModel, setDraftModel] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const settingsId = useId();
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const identity = JSON.stringify([source.id, source.name, source.description]);

  useEffect(() => {
    function load() {
      try {
        const saved = readAISettings(localStorage);
        setSettings(saved); setDraftKey(''); setDraftModel(saved?.model ?? ''); setSettingsError('');
      } catch {
        setSettings(null); setSettingsOpen(true);
        setSettingsError('无法读取本地 AI 配置，请重新保存；如果浏览器禁止保存，请先开启本地存储。');
      }
    }
    function sync(event: StorageEvent) {
      if (event.key !== LOCAL_AI_KEY && event.key !== null) return;
      sequence.current += 1; controller.current?.abort(); controller.current = null; setLoading(false);
      setNotice(''); setError('');
      load();
    }
    load(); window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    sequence.current += 1;
    controller.current?.abort();
    controller.current = null;
    setLoading(false); setError(''); setNotice(''); setProposal(null);
    return () => { sequence.current += 1; controller.current?.abort(); };
  }, [identity]);

  async function generate() {
    if (controller.current) return;
    if (!source.name.trim()) { setError('请先填写方向名称。'); return; }
    if (!settings) { setSettingsOpen(true); setError('请先保存本地 API Key，再生成这一周。'); return; }
    const requestId = ++sequence.current;
    const abort = new AbortController(); controller.current = abort;
    const capturedSource = { id: source.id, name: source.name, description: source.description };
    setLoading(true); setError(''); setNotice('');
    const timeout = setTimeout(() => abort.abort(), 55000);
    try {
      const generated = await generateBrowserWeek(settings, capturedSource, abort.signal);
      if (sequence.current !== requestId) return;
      setProposal({ source: capturedSource, week: generated });
      onApply(capturedSource, generated, 'empty');
      setNotice('AI 示例已生成；只补空白项，不改动已写内容，你可以继续修改。');
    } catch (err) {
      if (sequence.current !== requestId) return;
      setError(abort.signal.aborted ? '生成等待超时，请重试，或继续手动填写。' : err instanceof Error ? err.message : '生成失败，请稍后重试。');
    } finally {
      clearTimeout(timeout);
      if (sequence.current === requestId) { setLoading(false); controller.current = null; }
    }
  }
  function cancel() {
    sequence.current += 1; controller.current?.abort(); controller.current = null;
    setLoading(false); setNotice('已取消生成，可继续手动填写。');
  }

  function saveSettings() {
    setSettingsError('');
    try {
      const saved = saveAISettings(localStorage, { apiKey: draftKey || settings?.apiKey || '', model: draftModel });
      setSettings(saved); setDraftKey(''); setDraftModel(saved.model); setSettingsOpen(false); setError('');
      setNotice('AI 配置已保存在当前浏览器，可以开始预填了。');
    } catch (err) {
      setSettingsError(err instanceof Error && err.message.startsWith('请填写') ? err.message : '浏览器保存失败，请允许本地存储后再试。');
    }
  }
  function clearSettings() {
    try {
      clearAISettings(localStorage);
      cancel(); setSettings(null); setDraftKey(''); setDraftModel(''); setSettingsError(''); setError('');
      setNotice('已清除当前浏览器的 AI 配置。评估内容仍然保留。');
    } catch { setSettingsError('浏览器未能清除配置，请重试或在浏览器设置中清除本站数据。'); }
  }

  return <div className={styles.panel}>
    <div className={styles.heading}><div><strong><Sparkles size={16} /> AI 帮我想象这一周</strong><p>根据方向名称和描述，生成包含琐碎与困难工作的日常示例。只发送这两项信息，评分和其他笔记保留在浏览器。</p></div><button type="button" className={styles.generate} onClick={generate} disabled={loading || !source.name.trim()}>{loading ? '正在生成…' : proposal ? '重新生成' : 'AI 预填一周'}</button></div>
    <div className={styles.settingsBar}><span>{settings ? 'OpenRouter · 本地密钥已配置' : 'OpenRouter · 尚未配置'}</span><button type="button" aria-expanded={settingsOpen} aria-controls={settingsId} disabled={loading} onClick={() => { setSettingsOpen(!settingsOpen); setDraftKey(''); setSettingsError(''); }}><Settings2 size={14} /> {settingsOpen ? '收起设置' : 'AI 设置'}</button></div>
    {settingsOpen && <div id={settingsId} className={styles.settings}>
      <p>密钥仅保存在当前浏览器，不会加入评估备份。生成时，浏览器直接连接 OpenRouter，不经过本站服务器。换设备或清除浏览器数据后需重新配置。</p>
      <label htmlFor={`${settingsId}-key`}>OpenRouter API Key<input id={`${settingsId}-key`} type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={4096} value={draftKey} disabled={loading} placeholder={settings ? '已保存；留空保留原密钥' : '粘贴你的 OpenRouter API Key'} onChange={e => setDraftKey(e.target.value)} /></label>
      <label htmlFor={`${settingsId}-model`}>模型 ID（选填）<input id={`${settingsId}-model`} type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={200} value={draftModel} disabled={loading} placeholder="留空使用 OpenRouter 账户默认模型" onChange={e => setDraftModel(e.target.value)} /></label>
      <div className={styles.settingsLinks}><a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">获取 / 管理密钥 ↗</a><a href="https://openrouter.ai/models" target="_blank" rel="noreferrer">查看模型 ID ↗</a></div>
      {settingsError && <p className={styles.error} role="alert">{settingsError}</p>}
      <div className={styles.applyActions}><button type="button" disabled={loading} onClick={saveSettings}>保存到此浏览器</button><button type="button" disabled={loading} onClick={clearSettings}>清除本地 AI 配置</button></div>
    </div>}
    {loading && <div className={styles.status} role="status"><span>正在想象这个方向的真实日常，通常需要一些时间…</span><button type="button" onClick={cancel}><X size={14} /> 取消生成</button></div>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {proposal && <details className={styles.preview}><summary>查看 AI 示例 / 替换整周</summary><div>{proposal.week.map((day, i) => <p key={DAYS[i]}><strong>{DAYS[i]}</strong><span>{day}</span></p>)}</div><div className={styles.applyActions}><button type="button" disabled={loading || week.every(day => !!day.trim())} onClick={() => { onApply(proposal.source, proposal.week, 'empty'); setNotice('已补入仍然空白的日期，已有内容保留。'); }}>仅补空白项</button><button type="button" disabled={loading} onClick={() => { onApply(proposal.source, proposal.week, 'replace'); setNotice('已使用这份 AI 示例替换整周，仍可逐项修改。'); }}>用这份示例替换整周</button></div></details>}
  </div>;
}
