'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useAISettings } from '@/components/AISettingsProvider';

export default function AISettingsPage() {
  const { settings, ready, error, save, clear } = useAISettings();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [notice, setNotice] = useState<'saved' | 'cleared' | ''>('');
  const [formError, setFormError] = useState('');
  useEffect(() => { setApiKey(''); setModel(settings?.model ?? ''); }, [settings]);

  function saveConfig(event: React.FormEvent) {
    event.preventDefault(); setNotice(''); setFormError('');
    try { save({ apiKey: apiKey || settings?.apiKey || '', model }); setApiKey(''); setNotice('saved'); }
    catch (err) { setFormError(err instanceof Error && err.message.startsWith('请填写') ? err.message : '浏览器保存失败，请允许本地存储后再试。'); }
  }
  function clearConfig() {
    setNotice(''); setFormError('');
    try { clear(); setApiKey(''); setModel(''); setNotice('cleared'); }
    catch { setFormError('浏览器未能清除配置，请重试或在浏览器设置中清除本站数据。'); }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:py-14">
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3"><Settings2 className="text-cyan-700" size={25} /><h1 className="text-2xl font-semibold">公共 AI 设置</h1></div>
      <p className="mb-6 text-sm leading-7 text-slate-600">配置一次，供整个工具中心共用，包括方向评估、时间线复盘和项目排期。</p>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-label="浏览器本地 AI 配置">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">OpenRouter</h2><span className="text-sm text-slate-500">{!ready ? '正在读取…' : settings ? '本地密钥已配置' : '尚未配置'}</span></div>
        <p className="mb-6 text-sm leading-7 text-slate-600">密钥只保存在当前浏览器，不上传本站服务器，也不加入各工具的数据备份。使用 AI 时，浏览器直接连接 OpenRouter，发送当前功能需要处理的内容。换设备或清除浏览器数据后需重新配置。</p>
        <form onSubmit={saveConfig} className="space-y-5">
          <label className="block text-sm font-medium" htmlFor="public-ai-key">OpenRouter API Key<input id="public-ai-key" type="password" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={4096} disabled={!ready} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={settings ? '已保存；留空保留原密钥' : '粘贴你的 OpenRouter API Key'} className="mt-2 block min-h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-normal focus:outline-cyan-600" /></label>
          <label className="block text-sm font-medium" htmlFor="public-ai-model">模型 ID（选填）<input id="public-ai-model" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={200} disabled={!ready} value={model} onChange={e => setModel(e.target.value)} placeholder="留空使用 OpenRouter 账户默认模型" className="mt-2 block min-h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base font-normal focus:outline-cyan-600" /></label>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-cyan-700"><a className="inline-flex min-h-11 items-center underline underline-offset-4" href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">获取 / 管理密钥 ↗</a><a className="inline-flex min-h-11 items-center underline underline-offset-4" href="https://openrouter.ai/models" target="_blank" rel="noreferrer">查看模型 ID ↗</a></div>
          {(formError || error) && <p role="alert" className="text-sm leading-6 text-red-700">{formError || error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row"><button type="submit" disabled={!ready} className="min-h-12 rounded-lg bg-cyan-700 px-5 py-3 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50">保存到此浏览器</button><button type="button" disabled={!ready} onClick={clearConfig} className="min-h-12 rounded-lg border border-slate-300 px-5 py-3 text-sm hover:bg-slate-50 disabled:opacity-50">清除本地 AI 配置</button></div>
        </form>
        {((notice === 'saved' && settings) || (notice === 'cleared' && !settings)) && <p role="status" className="mt-5 text-sm leading-7 text-emerald-700">{notice === 'saved' ? '已保存。当前浏览器里的所有 AI 工具将共用这份配置。' : '已清除本地 AI 配置。各工具中已填写的内容仍然保留。'}</p>}
      </section>
      <nav aria-label="使用 AI 工具" className="mt-7 flex flex-wrap gap-x-6 gap-y-1 text-sm text-cyan-800"><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/tools/direction-assessment">方向评估向导</Link><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/tools/timeline-review">时间线复盘</Link><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/tools/project-schedule">项目排期</Link><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/tools/ai-test">测试 AI 连接</Link></nav>
    </div>
  </main>;
}
