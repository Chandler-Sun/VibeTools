import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '方向探索工作台 · 小工具中心',
  description: '分别评估内心吸引力与现实适配度，记录创业方向的动机、日常与验证实验。',
};

export default function DirectionExplorerLayout({ children }: { children: React.ReactNode }) {
  return <div lang="zh-CN">{children}</div>;
}
