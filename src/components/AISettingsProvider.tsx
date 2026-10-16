'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearAISettings, LEGACY_AI_KEY, LOCAL_AI_KEY, LocalAISettings, readAISettings, saveAISettings } from '@/lib/ai-settings';

interface AISettingsContext {
  settings: LocalAISettings | null;
  ready: boolean;
  error: string;
  save: (settings: LocalAISettings) => void;
  clear: () => void;
}
const Context = createContext<AISettingsContext | null>(null);

export function AISettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<LocalAISettings | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    try { setSettings(readAISettings(localStorage)); setError(''); }
    catch { setSettings(null); setError('无法读取本地 AI 配置，请重新保存；如果浏览器禁止保存，请先开启本地存储。'); }
    setReady(true);
  }, []);
  useEffect(() => {
    load();
    const sync = (event: StorageEvent) => { if (event.key === null || event.key === LOCAL_AI_KEY || event.key === LEGACY_AI_KEY) load(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [load]);

  const save = (value: LocalAISettings) => { const saved = saveAISettings(localStorage, value); setSettings(saved); setError(''); };
  const clear = () => { clearAISettings(localStorage); setSettings(null); setError(''); };
  return <Context.Provider value={{ settings, ready, error, save, clear }}>{children}</Context.Provider>;
}

export function useAISettings() {
  const value = useContext(Context);
  if (!value) throw new Error('AISettingsProvider is missing');
  return value;
}
