import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/auth'
import { add, update, query } from '@/lib/database/cloudbase'
import OpenAI from 'openai'

// 任务状态枚举
enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 任务接口
interface GenerationTask {
  _id?: string
  taskId: string
  userId: string
  conversationId?: string
  prompt: string
  model: string
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

// 全局任务队列（生产环境应该用Redis或数据库）
const taskQueue = new Map<string, GenerationTask>()

// AI客户端初始化
function getAIClient(model: string) {
  const isDeepSeek = model.includes('deepseek')

  if (isDeepSeek) {
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    })
  } else {
    // 其他模型的配置
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
}

// 格式化代码
function formatCodeString(code: string): string {
  const lineCount = (code.match(/\n/g) || []).length
  if (lineCount > 5) {
    return code
  }

  // 简单的代码格式化
  let formatted = code
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}')
    .replace(/\n\s*\n\s*\n/g, '\n\n')

  return formatted
}

// 创建项目结构
function createProjectFromCode(code: string) {
  return {
    files: {
      'src/App.tsx': code,
      'src/index.css': `body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
}

code {
  font-family: 'Monaco', 'Menlo', monospace;
}`,
      'package.json': JSON.stringify({
        "name": "generated-app",
        "version": "0.1.0",
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "react-scripts": "5.0.1"
        }
      }, null, 2)
    },
    projectName: 'smart-generated-app'
  }
}

// 异步代码生成
async function generateCodeAsync(
  prompt: string,
  model: string,
  onProgress: (progress: number) => void
): Promise<any> {
  const client = getAIClient(model)

  onProgress(10)

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: `Generate a complete React component. Return ONLY the React component code, no explanations, no markdown, no JSON structure.

Requirements:
1. Use proper code formatting with consistent indentation (2 spaces)
2. Include all necessary React imports
3. Create a functional component with proper JSX structure
4. Use Tailwind CSS classes for styling
5. Make it immediately runnable
6. Export as default

Example output:
import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Hello World</h1>
        <p className="text-gray-600">Welcome to my app!</p>
      </div>
    </div>
  );
}

export default App;`
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ],
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
    })

    onProgress(80)

    const generatedCode = completion.choices[0]?.message?.content || ''
    const formattedCode = formatCodeString(generatedCode)
    const project = createProjectFromCode(formattedCode)

    onProgress(100)

    return project

  } catch (error: any) {
    console.error('AI生成失败:', error)
    throw error
  }
}

// 开始异步生成任务
export async function POST(request: NextRequest) {
  try {
    // 认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user
    const { prompt, model, conversationId, existingContent } = await request.json()

    // 生成唯一任务ID
    const taskId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建任务
    const task: GenerationTask = {
      taskId,
      userId: user.id,
      conversationId,
      prompt: prompt.trim(),
      model: model || 'deepseek-chat',
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 存储到队列
    taskQueue.set(taskId, task)

    // 异步执行任务
    processAsyncTask(task, existingContent)

    return NextResponse.json({
      success: true,
      taskId,
      status: 'accepted',
      message: '异步任务已提交处理'
    })

  } catch (error: any) {
    console.error('创建异步任务失败:', error)
    return NextResponse.json(
      { error: '创建任务失败' },
      { status: 500 }
    )
  }
}

// 处理异步任务
async function processAsyncTask(task: GenerationTask, existingContent?: string) {
  try {
    // 更新状态为运行中
    task.status = TaskStatus.RUNNING
    task.startedAt = new Date().toISOString()
    task.progress = 10
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    // 如果有现有内容，从断点继续生成
    const fullPrompt = existingContent
      ? `Continue generating from this existing code:\n\n${existingContent}\n\nAdditional requirements: ${task.prompt}`
      : task.prompt

    // 生成代码
    const result = await generateCodeAsync(
      fullPrompt,
      task.model,
      (progress) => {
        task.progress = 10 + (progress * 0.8) // 10-90%
        task.updatedAt = new Date().toISOString()
        taskQueue.set(task.taskId, task)
      }
    )

    // 完成任务
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.result = result
    task.completedAt = new Date().toISOString()
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)

    console.log(`✅ 异步任务 ${task.taskId} 完成`)

  } catch (error: any) {
    console.error(`❌ 异步任务 ${task.taskId} 失败:`, error)

    // 任务失败
    task.status = TaskStatus.FAILED
    task.error = error.message || '生成失败'
    task.updatedAt = new Date().toISOString()
    taskQueue.set(task.taskId, task)
  }
}
