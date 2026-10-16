'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Settings2, Sparkles, X } from 'lucide-react';
import { WeekApplyMode, WeekSource } from '@/lib/direction-week';
import { generateBrowserWeek } from '@/lib/direction-week-client';
import { useAISettings } from './AISettingsProvider';
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
  const { settings, ready } = useAISettings();
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const identity = JSON.stringify([source.id, source.name, source.description]);

  useEffect(() => {
    sequence.current += 1;
    controller.current?.abort();
    controller.current = null;
    setLoading(false); setError(''); setNotice(''); setProposal(null);
    return () => { sequence.current += 1; controller.current?.abort(); };
  }, [identity, settings]);

  async function generate() {
    if (controller.current) return;
    if (!source.name.trim()) { setError('请先填写方向名称。'); return; }
    if (!settings) { setError('请先前往公共 AI 设置，保存 API Key 后再生成这一周。'); return; }
    const requestId = ++sequence.current;
    const abort = new AbortController(); controller.current = abort;
    const capturedSource = { id: source.id, name: source.name, description: source.description };
    setLoading(true); setError(''); setNotice('');
    const timeout = setTimeout(() => abort.abort(), 55000);
    try {
      const generated = await generateBrowserWeek(capturedSource, abort.signal);
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

  return <div className={styles.panel}>
    <div className={styles.heading}><div><strong><Sparkles size={16} /> AI 帮我想象这一周</strong><p>根据方向名称和描述，生成包含琐碎与困难工作的日常示例。只发送这两项信息，评分和其他笔记保留在浏览器。</p></div><button type="button" className={styles.generate} onClick={generate} disabled={loading || !ready || !source.name.trim()}>{loading ? '正在生成…' : proposal ? '重新生成' : 'AI 预填一周'}</button></div>
    <div className={styles.settingsBar}><span>{settings ? '正在使用公共 AI 配置' : '尚未配置 AI'}</span><Link href="/settings/ai"><Settings2 size={14} /> 公共 AI 设置</Link></div>
    {loading && <div className={styles.status} role="status"><span>正在想象这个方向的真实日常，通常需要一些时间…</span><button type="button" onClick={cancel}><X size={14} /> 取消生成</button></div>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {proposal && <details className={styles.preview}><summary>查看 AI 示例 / 替换整周</summary><div>{proposal.week.map((day, i) => <p key={DAYS[i]}><strong>{DAYS[i]}</strong><span>{day}</span></p>)}</div><div className={styles.applyActions}><button type="button" disabled={loading || week.every(day => !!day.trim())} onClick={() => { onApply(proposal.source, proposal.week, 'empty'); setNotice('已补入仍然空白的日期，已有内容保留。'); }}>仅补空白项</button><button type="button" disabled={loading} onClick={() => { onApply(proposal.source, proposal.week, 'replace'); setNotice('已使用这份 AI 示例替换整周，仍可逐项修改。'); }}>用这份示例替换整周</button></div></details>}
  </div>;
}
