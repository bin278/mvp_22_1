import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { code, instruction } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

    if (!apiKey || apiKey === 'your_actual_api_key_here') {
      return NextResponse.json(
        { error: 'DeepSeek API key is not configured' },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    })

    console.log('🔄 开始同步AI代码修改...')

    try {
      const completion = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a code modification assistant. Modify the given React/TypeScript code according to the user's instruction. Return ONLY the modified code, no explanations, no markdown, no JSON structure.

Requirements:
1. Keep the same code structure and formatting style
2. Only modify what the user asks for
3. Ensure the code remains functional
4. Use proper indentation (2 spaces)
5. Return the complete modified code

Example:
User code: "function App() { return <div>Hello</div>; }"
Instruction: "Add a button"
Response: "function App() { return <div><div>Hello</div><button>Click me</button></div>; }"`
          },
          {
            role: 'user',
            content: `Current code:\n\`\`\`typescript\n${code}\n\`\`\`\n\nInstruction: ${instruction}\n\nReturn only the modified code:`
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

      // Clean up the modified code
      let modifiedCode = content.trim()

      // Remove markdown code blocks if present
      const codeBlockRegex = /```(?:typescript|tsx|jsx|js|ts)?\s*([\s\S]*?)```/
      const match = modifiedCode.match(codeBlockRegex)
      if (match) {
        modifiedCode = match[1].trim()
      }

      console.log('✅ 同步代码修改完成')

      return NextResponse.json({
        code: 0,
        msg: '代码修改成功',
        data: {
          code: modifiedCode,
          codeLength: modifiedCode.length
        }
      })

    } catch (error: any) {
      console.error('❌ 同步代码修改失败:', error)

      // Handle specific error types
      let errorMessage = 'Failed to modify code'
      let errorDetails = ''

      if (error?.status === 402 || error?.response?.status === 402) {
        errorMessage = 'Insufficient API Balance'
        errorDetails = 'Your API account has insufficient balance. Please top up your account to continue using the service.'
      } else if (error?.status === 401 || error?.response?.status === 401) {
        errorMessage = 'Invalid API Key'
        errorDetails = 'The API key is invalid or expired. Please check your API configuration.'
      } else if (error?.status === 429 || error?.response?.status === 429) {
        errorMessage = 'Rate Limit Exceeded'
        errorDetails = 'Too many requests. Please wait a moment and try again.'
      } else if (error?.message) {
        errorMessage = error.message
        errorDetails = error.message
      }

      return NextResponse.json({
        code: -1,
        msg: '代码修改失败',
        error: errorMessage,
        details: errorDetails
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error starting code modification:', error)
    return NextResponse.json(
      { code: -1, msg: '请求处理失败', error: error.message },
      { status: 500 }
    )
  }
}




















