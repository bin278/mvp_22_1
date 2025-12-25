import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { getDatabase } from '@/lib/database/cloudbase'

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

    // 生成唯一TaskID
    const taskId = randomUUID()

    // 初始化CloudBase数据库
    console.log('🔗 初始化CloudBase数据库连接...')
    const db = getDatabase()
    if (!db) {
      console.error('❌ CloudBase数据库初始化失败')
      return NextResponse.json(
        { code: -1, msg: '数据库连接失败' },
        { status: 500 }
      )
    }
    console.log('✅ CloudBase数据库连接成功')

    const tasksCollection = db.collection('ai_code_tasks')
    console.log('📋 获取ai_code_tasks集合')

    // 写入数据库，初始状态pending
    console.log('💾 写入数据库任务记录...')
    try {
      await tasksCollection.add({
        taskId,
        openid,
        prompt,
        code: '', // 初始代码为空
        status: 'pending',
        createTime: new Date()
      })
      console.log('✅ 任务记录写入成功，taskId:', taskId)
    } catch (dbError) {
      console.error('❌ 数据库写入失败:', dbError)
      return NextResponse.json(
        { code: -1, msg: '数据库写入失败' },
        { status: 500 }
      )
    }

    // 调用云函数异步处理AI生成
    try {
      console.log('☁️ 调用云函数generateCodeTask...')

      // 获取CloudBase配置
      const tencentCloudConfig = {
        secretId: process.env.TENCENT_CLOUD_SECRET_ID,
        secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
        envId: process.env.TENCENT_CLOUD_ENV_ID || 'cloud1-3gn61ziydcfe6a57'
      }

      // 动态导入CloudBase SDK（避免在所有请求中加载）
      const { default: cloudbase } = await import('@cloudbase/node-sdk')

      const app = cloudbase.init(tencentCloudConfig)
      const functions = app.functions

      console.log('🚀 调用云函数，参数:', { taskId, prompt: prompt.substring(0, 50) + '...', openid })

      // 调用云函数
      const result = await functions.callFunction('generateCodeTask', {
        taskId,
        prompt,
        openid
      })

      console.log('☁️ 云函数调用结果:', result)

      if (result.code !== 0) {
        console.error('❌ 云函数执行失败:', result)
        // 更新任务状态为失败
        await tasksCollection.where({ taskId }).update({
          status: 'failed',
          code: '',
          finishTime: new Date(),
          errorMsg: result.msg || '云函数执行失败'
        })
      } else {
        console.log('✅ 云函数执行成功')
      }

    } catch (cloudFunctionError: any) {
      console.error('❌ 云函数调用失败:', cloudFunctionError)

      // 更新任务状态为失败
      await tasksCollection.where({ taskId }).update({
        status: 'failed',
        code: '',
        finishTime: new Date(),
        errorMsg: `云函数调用失败: ${cloudFunctionError.message}`
      })
    }

    // 同步返回TaskID（<1秒完成）
    return NextResponse.json({
      code: 0,
      msg: '任务已启动',
      data: { taskId }
    })

  } catch (err: any) {
    console.error('创建任务失败:', err)
    return NextResponse.json(
      { code: -1, msg: '创建任务失败', error: err.message },
      { status: 500 }
    )
  }
}

// AI代码生成函数（复用现有的AI调用逻辑）
async function generateCodeWithAI(prompt: string): Promise<string> {
  const model = 'deepseek-chat' // 默认使用deepseek

  // 获取API配置（复用generate-stream的逻辑）
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

    // 获取完整响应
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated from AI')
    }

    return content.trim()
  } catch (error: any) {
    console.error('AI生成失败:', error)
    throw new Error(`AI生成失败: ${error.message}`)
  }
}

// 将代码分割成片段（用于增量渲染）
function splitCodeIntoFragments(code: string): string[] {
  const lines = code.split('\n')
  const fragments: string[] = []

  for (let i = 0; i < lines.length; i += 2) { // 每2行作为一个片段
    const fragment = lines.slice(i, i + 2).join('\n') + '\n'
    fragments.push(fragment)
  }

  return fragments
}
