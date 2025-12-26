import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { add } from '@/lib/database/cloudbase'


interface JWTPayload {
  userId?: string
  openid?: string  // 兼容旧格式
  exp: number
}

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: -1, msg: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

    // 验证JWT并解析openid
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
      console.log('JWT验证成功:', decoded)
    } catch (err) {
      console.error('JWT验证失败:', err.message)
      return NextResponse.json(
        { code: -1, msg: 'Token无效' },
        { status: 401 }
      )
    }

    // 支持userId和openid两种格式（向后兼容）
    const openid = decoded.userId || decoded.openid
    if (!openid) {
      return NextResponse.json(
        { code: -1, msg: 'Token缺少用户标识' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { code: -1, msg: 'prompt参数无效' },
        { status: 400 }
      )
    }

    // 生成任务ID
    const taskId = randomUUID()
    console.log('🔄 开始AI代码生成，任务ID:', taskId)

    // 创建任务记录到数据库
    try {
      await add('code_generation_tasks', {
        taskId,
        openid,
        prompt: prompt.trim(),
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('📝 任务记录已创建:', taskId)
    } catch (dbError: any) {
      console.warn('⚠️ 创建任务记录失败:', dbError.message)
    }

    // 异步执行代码生成（不等待结果）
    generateCodeWithAI(prompt.trim()).then(async (generatedCode) => {
      console.log('✅ 异步代码生成完成，任务ID:', taskId)

      try {
        // 更新任务状态为完成
        const db = getDatabase()
        await db.collection('code_generation_tasks').doc(taskId).update({
          status: 'completed',
          code: generatedCode,
          codeLength: generatedCode.length,
          completedAt: new Date(),
          updatedAt: new Date()
        })

        // 保存生成记录到历史表
        await add('code_generation_history', {
          taskId,
          openid,
          prompt: prompt.trim(),
          code: generatedCode,
          codeLength: generatedCode.length,
          createdAt: new Date(),
          method: 'async'
        })

        console.log('📊 任务完成并保存到数据库:', taskId)
      } catch (dbError: any) {
        console.error('❌ 保存生成结果失败:', dbError)
      }
    }).catch(async (error) => {
      console.error('❌ 异步代码生成失败，任务ID:', taskId, error)

      try {
        // 更新任务状态为失败
        const db = getDatabase()
        await db.collection('code_generation_tasks').doc(taskId).update({
          status: 'failed',
          error: error.message,
          failedAt: new Date(),
          updatedAt: new Date()
        })
        console.log('📊 任务失败状态已更新:', taskId)
      } catch (dbError: any) {
        console.error('❌ 更新任务失败状态失败:', dbError)
      }
    })

    // 立即返回任务ID给前端
    return NextResponse.json({
      code: 0,
      msg: '代码生成任务已启动',
      data: {
        taskId,
        status: 'processing',
        message: 'AI正在生成代码，请稍候...'
      }
    })

  } catch (err: any) {
    console.error('同步生成请求失败:', err)
    return NextResponse.json(
      { code: -1, msg: '请求处理失败', error: err.message },
      { status: 500 }
    )
  }
}

// AI代码生成函数（让AI完全生成完毕后再返回）
async function generateCodeWithAI(prompt: string): Promise<string> {
  const model = 'deepseek-chat' // 默认使用deepseek

  // 获取API配置
  let apiKey: string
  let baseUrl: string
  let client: any

  // 获取DeepSeek配置
  apiKey = process.env.DEEPSEEK_API_KEY!
  baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

  // 创建OpenAI兼容客户端
  const OpenAI = require('openai')
  client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  try {
    console.log('🚀 开始AI代码生成，让AI完全生成完毕...')

    // 直接调用AI，不设置主动超时，让CloudBase平台自然处理60秒超时
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
7. Take your time to generate comprehensive, well-structured code

Example output:
import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Load data
    fetchData();
  }, []);

  const fetchData = async () => {
    // Implementation
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        {/* Content */}
      </div>
    </div>
  );
}

export default Dashboard;`
        },
        {
          role: 'user',
          content: prompt.trim()
        }
      ],
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'), // 增加token限制
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'), // 保持创造性
    })

    console.log('✅ AI代码生成完成')

    // 获取完整响应
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from AI')
    }

    return content.trim()
  } catch (error: any) {
    console.error('AI生成失败:', error)

    // 如果是网络超时或其他错误，给出相应提示
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error('网络请求超时，请稍后重试')
    }

    throw new Error(`AI生成失败: ${error.message}`)
  }
}

