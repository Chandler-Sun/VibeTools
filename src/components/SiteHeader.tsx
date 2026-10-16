'use client';

import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import { useAISettings } from './AISettingsProvider';

export default function SiteHeader() {
  const { settings, ready } = useAISettings();
  return <header className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 text-sm text-slate-600 sm:px-6" aria-label="工具中心公共导航">
    <Link href="/" className="inline-flex min-h-11 items-center font-medium hover:text-cyan-700">小工具中心</Link>
    <Link href="/settings/ai" className="inline-flex min-h-11 items-center gap-2 rounded px-2 hover:text-cyan-700 focus-visible:outline-cyan-600"><Settings2 size={16} /><span>AI 设置</span>{ready && settings && <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="已配置本地 AI" />}</Link>
  </header>;
}
