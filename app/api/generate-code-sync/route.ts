import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
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

    console.log('🔄 开始同步AI代码生成...')

    try {
      // 直接调用AI生成代码（同步等待）
      const generatedCode = await generateCodeWithAI(prompt.trim())

      console.log('✅ 同步代码生成完成')

      // 保存生成记录到数据库（可选，用于统计）
      try {
        await add('code_generation_history', {
          openid,
          prompt: prompt.trim(),
          code: generatedCode,
          codeLength: generatedCode.length,
          createdAt: new Date(),
          method: 'sync'
        })
        console.log('📊 生成历史已保存到数据库')
      } catch (dbError: any) {
        console.warn('⚠️ 保存生成历史失败，但不影响代码生成:', dbError.message)
        // 不抛出错误，继续返回生成结果
      }

      return NextResponse.json({
        code: 0,
        msg: '代码生成成功',
        data: {
          code: generatedCode,
          codeLength: generatedCode.length
        }
      })

    } catch (error: any) {
      console.error('❌ 同步代码生成失败:', error)
      return NextResponse.json({
        code: -1,
        msg: '代码生成失败',
        error: error.message
      }, { status: 500 })
    }

  } catch (err: any) {
    console.error('同步生成请求失败:', err)
    return NextResponse.json(
      { code: -1, msg: '请求处理失败', error: err.message },
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
