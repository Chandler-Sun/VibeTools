This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## ✨ Features

- 🎮 **数学游戏**: 100以内加减法练习
- 🚀 **太空字母射击**: 英文字母学习游戏
- ✍️ **中文书法练习**: 在线书法创作工具
- 📅 **时间线复盘工具**: 带 AI 智能分析的可视化复盘工具
- 🧭 **方向探索工作台**: `/tools/direction-explorer`，预置 16 个创业方向，支持 30 维自评、四项独立指数、动机追问、日常模拟、验证计划和方向对比。自动保存到当前浏览器，支持 JSON 备份 / 导入、CSV 导出及最多 30 个历史快照。跨设备需手动导入备份，未接入云端同步。

方向探索与评估向导的评分、进度恢复和备份校验测试：`node --test test/direction-explorer/*.test.cjs`。

方向评估向导：`/tools/direction-assessment`。先定义一个方向，按步骤完成 30 项评分，再补充动机、日常和验证计划，最后查看四项独立指数及观察建议。支持手机、自动恢复草稿、最近 30 个已完成评估、导出结果和加入方向探索工作台继续对比。记录保存在当前浏览器。

向导和工作台的「模拟真实的一周」支持 AI 预填：仅发送方向名称和描述，默认补齐空白日期并保留手写内容；可查看示例后明确选择替换整周。生活意愿分数由用户自行填写。复用现有服务端 AI 配置，接口为 `/api/ai/simulate-week`；支持取消、超时和服务不可用提示。

## 🤖 AI 功能

本项目集成了 OpenRouter AI 服务，为时间线复盘工具提供智能分析功能。

### 配置 AI 服务

1. 访问 [OpenRouter](https://openrouter.ai/) 获取 API Key
2. 在项目根目录创建 `.env.local` 文件
3. 添加配置：
```bash
NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
```

详细配置请参考 [AI_SERVICE_README.md](./AI_SERVICE_README.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 当前站点部署：Cloudflare Pages

当前线上站点为 https://kids.belloai.xyz，推送 `main` 后自动发布。

- Node.js 版本由 `.node-version` 固定；依赖按 `pnpm-lock.yaml` 安装。
- 构建命令可使用 `pnpm run build:pages`，输出目录为 `.vercel/output/static`。
- 已有的 `npx @cloudflare/next-on-pages@1` 命令也会使用项目内安装的兼容版本。
- 发布适配器、Wrangler、Workers 类型包与 Vercel CLI 均固定版本，避免临时安装的上游依赖冲突。更新它们时需一起验证 `build:pages`。

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
