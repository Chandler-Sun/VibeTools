import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '方向评估向导 · 小工具中心',
  description: '一次评估一个方向，逐步梳理内心吸引力、现实适配、真实日常与验证计划。',
};
export default function DirectionAssessmentLayout({ children }: { children: React.ReactNode }) {
  return <div lang="zh-CN">{children}</div>;
}
