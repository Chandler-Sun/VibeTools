'use client';

import Link from 'next/link';
import { useState } from 'react';
import aiService from '@/lib/services/ai_service';

export default function AITestPage() {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 测试基础聊天（共用浏览器本地 AI 配置）
  const testBasicChat = async () => {
    setIsLoading(true);
    setTestResult('🔄 正在测试基础聊天功能...');

    try {
      const response = await aiService.chatCompletion({
        messages: [
          {
            role: 'user',
            content: '请用一句话介绍你自己'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const content = response.choices[0].message.content;
      setTestResult(`✅ 测试成功！\n\nAI 回复：\n${content}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setTestResult(`❌ 测试失败：\n${msg}\n\n请在公共 AI 设置中检查密钥、模型和账户额度。`);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试时间线分析
  const testTimelineAnalysis = async () => {
    setIsLoading(true);
    setTestResult('🔄 正在测试时间线分析功能...');

    try {
      const insights = await aiService.analyzeTimeline({
        events: [
          {
            title: '项目启动',
            startYear: 2023,
            startQuarter: 1,
            type: 'milestone',
            category: 'work',
            result: 'good',
            notes: '顺利启动新项目'
          },
          {
            title: '产品开发',
            startYear: 2023,
            startQuarter: 1,
            endYear: 2023,
            endQuarter: 3,
            type: 'duration',
            category: 'work',
            result: 'good',
            notes: '按时完成开发'
          },
          {
            title: '产品发布',
            startYear: 2023,
            startQuarter: 3,
            type: 'milestone',
            category: 'work',
            result: 'bad',
            notes: '用户反馈不佳'
          },
          {
            title: '产品优化',
            startYear: 2023,
            startQuarter: 4,
            endYear: 2024,
            endQuarter: 1,
            type: 'duration',
            category: 'work',
            result: 'good',
            notes: '大幅改进用户体验'
          }
        ],
        yearSummaries: [
          {
            year: 2023,
            text: '充满挑战的一年，从产品开发到发布，经历了失败和改进'
          }
        ],
        startYear: 2023,
        endYear: 2024
      });

      setTestResult(`✅ 测试成功！\n\n时间线分析结果：\n\n${insights}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setTestResult(`❌ 测试失败：\n${msg}\n\n请在公共 AI 设置中检查密钥、模型和账户额度。`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>🧪 AI 服务测试</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        所有工具共用浏览器本地 AI 配置，浏览器直接连接 OpenRouter。
      </p>

      {/* 测试按钮 */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={testBasicChat}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          💬 测试基础聊天
        </button>

        <button
          onClick={testTimelineAnalysis}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          📊 测试时间线分析
        </button>
      </div>

      {/* 测试结果 */}
      {testResult && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: 0 }}>测试结果：</h3>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            fontSize: '14px',
            lineHeight: '1.6',
            margin: 0
          }}>
            {testResult}
          </pre>
        </div>
      )}

      {/* 说明文档 */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #2196F3'
      }}>
        <h3 style={{ marginTop: 0 }}>📚 使用说明</h3>
        <ul style={{ marginBottom: 0, lineHeight: '1.8' }}>
          <li><strong>基础聊天测试</strong>：验证公共 AI 配置是否可用</li>
          <li><strong>时间线分析测试</strong>：测试时间线复盘功能（用于 /tools/timeline-review）</li>
        </ul>
        <p style={{ marginTop: '15px', marginBottom: 0, fontSize: '14px' }}>
          <Link href="/settings/ai" className="text-blue-700 underline">前往公共 AI 设置</Link>，保存当前浏览器使用的密钥与模型。
        </p>
      </div>
    </div>
  );
}

