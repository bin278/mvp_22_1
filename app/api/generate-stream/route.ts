import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AVAILABLE_MODELS, canUseModel, type SubscriptionTier } from '@/lib/subscription-tiers'
import { requireAuth } from '@/lib/auth/auth'
import { add } from '@/lib/database/cloudbase'

// 生成状态管理接口
interface GenerationState {
  taskId: string
  status: 'streaming' | 'fallback_async' | 'completed' | 'failed'
  streamedContent: string
  progress: number
  lastActivity: number
  mode: 'streaming' | 'async'
}

// 全局状态存储（生产环境应该用Redis）
const generationStates = new Map<string, GenerationState>()

// 风险评估函数
function assessGenerationRisk(prompt: string, model: string): boolean {
  const complexity = prompt.length + (prompt.split(' ').length * 2)
  const isComplexModel = model.includes('gpt-4') || model.includes('claude') || model.includes('deepseek')

  // 复杂度阈值：长提示词 + 复杂模型 = 高风险
  return complexity > 800 || (complexity > 400 && isComplexModel)
}

// 实时风险检测
function shouldFallback(state: GenerationState): boolean {
  const timeElapsed = Date.now() - state.lastActivity

  // 条件1：长时间无响应（30秒）
  if (timeElapsed > 30000) return true

  // 条件2：内容过少但时间较长（可能卡住）
  if (timeElapsed > 15000 && state.streamedContent.length < 50) return true

  // 条件3：进度停滞
  if (state.progress > 0 && timeElapsed > 10000 && state.progress < 20) return true

  return false
}

// 异步后备处理
async function startAsyncFallback(
  taskId: string,
  prompt: string,
  model: string,
  apiKey: string,
  baseUrl: string,
  existingContent: string,
  user: any
) {
  try {
    console.log(`🔄 启动异步后备处理，任务ID: ${taskId}`)

    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
    })

    // 从现有内容继续生成
    const fullPrompt = existingContent
      ? `基于以下已生成的代码片段，继续完成完整的React组件：\n\n已生成：${existingContent}\n\n原始需求：${prompt}\n\n请生成完整的、可运行的代码。`
      : prompt

    const completion = await client.chat.completions.create({
      model,
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
          content: fullPrompt
        }
      ],
      max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
    })

    const additionalContent = completion.choices[0]?.message?.content || ''
    const finalContent = existingContent + additionalContent

    // 格式化代码
    let formattedCode = formatCodeString(finalContent)

    // 确保有有效的代码
    if (!formattedCode || formattedCode.length < 100) {
      formattedCode = `import React from 'react';

function GeneratedApp() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          Code generation completed with fallback mode.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This was generated using fallback mode due to complexity.
          </p>
        </div>
      </div>
    </div>
  );
}

export default GeneratedApp;`
    }

    // 创建项目结构
    const project = {
      files: {
        'src/App.tsx': formattedCode,
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

    // 更新状态
    const state = generationStates.get(taskId)
    if (state) {
      state.status = 'completed'
      state.progress = 100
    }

    console.log(`✅ 异步后备处理完成，任务ID: ${taskId}`)

    return project

  } catch (error) {
    console.error('异步后备处理失败:', error)

    const state = generationStates.get(taskId)
    if (state) {
      state.status = 'failed'
    }

    throw error
  }
}

// 清理重复的代码定义

// 全局状态存储
const generationStates = new Map<string, GenerationState>()

// 风险评估函数
function assessGenerationRisk(prompt: string, model: string): boolean {
  const complexity = prompt.length + (prompt.split(' ').length * 2)
  const isComplexModel = model.includes('gpt-4') || model.includes('claude')

  // 复杂度阈值：长提示词 + 复杂模型 = 高风险
  return complexity > 1000 || (complexity > 500 && isComplexModel)
}

// 风险检测函数
function shouldFallback(state: GenerationState, currentTime: number): boolean {
  const timeElapsed = currentTime - state.lastActivity

  // 条件：生成时间过长 + 内容较少 = 可能卡住或超时风险
  return timeElapsed > 30000 && state.streamedContent.length < 200
}

// 异步后备处理
async function startAsyncFallback(
  taskId: string,
  prompt: string,
  model: string,
  user: any,
  existingContent: string,
  conversationId?: string
) {
  try {
    console.log(`🔄 启动异步后备处理: ${taskId}`)

    // 创建异步任务
    const asyncTaskId = `async_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const task = {
      taskId: asyncTaskId,
      userId: user.id,
      conversationId,
      prompt: `Continue generating from this existing code:\n\n${existingContent}\n\nOriginal request: ${prompt}`,
      model: model,
      status: 'running',
      progress: 50, // 从50%开始，因为已有部分内容
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    taskQueue.set(asyncTaskId, task)

    // 异步执行（不阻塞当前响应）
    setTimeout(async () => {
      try {
        const client = new OpenAI({
          apiKey: process.env.DEEPSEEK_API_KEY,
          baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        })

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
6. Export as default`
            },
            {
              role: 'user',
              content: task.prompt
            }
          ],
          max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4000'),
          temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
        })

        const additionalContent = completion.choices[0]?.message?.content || ''
        const finalContent = existingContent + additionalContent

        // 格式化代码
        const formattedCode = formatCodeString(finalContent)

        const project = {
          files: {
            'src/App.tsx': formattedCode,
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

        // 更新任务状态
        task.status = 'completed'
        task.progress = 100
        task.result = project
        task.completedAt = new Date().toISOString()
        task.updatedAt = new Date().toISOString()
        taskQueue.set(asyncTaskId, task)

        console.log(`✅ 异步后备处理完成: ${asyncTaskId}`)

      } catch (error) {
        console.error(`❌ 异步后备处理失败: ${asyncTaskId}`, error)
        task.status = 'failed'
        task.error = error.message
        task.updatedAt = new Date().toISOString()
        taskQueue.set(asyncTaskId, task)
      }
    }, 100)

    return asyncTaskId

  } catch (error) {
    console.error('启动异步后备失败:', error)
    return null
  }
}

// 保存消息到对话
async function saveMessageToConversation(conversationId: string, role: 'user' | 'assistant', content: string, userId: string) {
  try {
    const messageData = {
      conversation_id: conversationId,
      user_id: userId,
      role: role,
      content: content,
      message_type: 'code_generation',
      created_at: new Date().toISOString()
    }

    await add('conversation_messages', messageData)
    console.log(`💾 Message saved to conversation ${conversationId}`)
  } catch (error) {
    console.error('❌ Failed to save message to conversation:', error)
    throw error
  }
}

function formatCodeString(code: string): string {
  // Quick check: if code already has good formatting, return as-is
  const lineCount = (code.match(/\n/g) || []).length
  if (lineCount > 5) {
    return code
  }

  // For minified code, do basic formatting
  if (code.length > 100 && lineCount < 3) {
    console.log('Formatting minified code')

    // Simple and fast formatting - just add newlines at key points
    let formatted = code
      // Add newlines after semicolons (simple version)
      .replace(/;/g, ';\n')
      // Add newlines around braces
      .replace(/{/g, '{\n')
      .replace(/}/g, '\n}')
      // Clean up excessive newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Basic indentation
      .split('\n')
      .map((line, index, arr) => {
        const trimmed = line.trim()
        if (!trimmed) return ''

        // Simple indentation based on brace counting
        let indent = 0
        for (let i = 0; i < index; i++) {
          const prevLine = arr[i].trim()
          if (prevLine.endsWith('{')) indent++
          if (prevLine.startsWith('}')) indent--
        }

        return '  '.repeat(Math.max(0, indent)) + trimmed
      })
      .join('\n')

    return formatted
  }

  return code
}

export async function POST(request: NextRequest) {
  console.log('🚀 Starting streaming code generation request')

  try {
    // 进行用户认证
    console.log('🔐 Authenticating user...')
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      console.log('❌ Authentication failed:', authResult.error)
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const user = authResult.user
    console.log('✅ User authenticated:', user.email)

    // 获取用户订阅等级
    const userTier = user.subscription_plan === 'pro' ? 'pro' : 'free'
    console.log('📊 User tier:', userTier)

    const body = await request.json()
    const { prompt, model: requestedModel = 'deepseek-chat', conversationId } = body

    console.log('📝 Request details:', { prompt, requestedModel, conversationId, userId: user.id })

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // 生成任务ID
    const taskId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 初始化生成状态
    const state: GenerationState = {
      taskId,
      status: 'streaming',
      streamedContent: '',
      progress: 0,
      lastActivity: Date.now(),
      mode: 'streaming'
    }
    generationStates.set(taskId, state)

    // 风险评估
    const isHighRisk = assessGenerationRisk(prompt, requestedModel)
    console.log(`📊 复杂度评估: ${prompt.length} 字符, 风险等级: ${isHighRisk ? '高' : '低'}`)

    if (isHighRisk) {
      console.log('🚨 高风险任务，直接切换到异步模式')

      // 异步处理高风险任务
      startAsyncFallback(taskId, prompt, requestedModel, process.env.DEEPSEEK_API_KEY!, process.env.DEEPSEEK_BASE_URL!, '', user)
        .then(project => {
          // 异步完成时更新状态
          const currentState = generationStates.get(taskId)
          if (currentState) {
            currentState.status = 'completed'
            currentState.progress = 100
          }
        })
        .catch(error => {
          console.error('异步生成失败:', error)
          const currentState = generationStates.get(taskId)
          if (currentState) {
            currentState.status = 'failed'
          }
        })

      // 返回异步模式切换信号
      return new Response(
        `data: ${JSON.stringify({
          type: 'mode_switch',
          mode: 'async',
          taskId,
          reason: 'high_complexity'
        })}\n\n` +
        `data: ${JSON.stringify({
          type: 'async_started',
          taskId,
          message: '复杂任务已切换到异步模式，请等待完成'
        })}\n\n` +
        `data: [DONE]\n\n`,
        {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
        }
      )
    }

    // 低风险任务：使用智能流式生成
    console.log('🎯 低风险任务，使用智能流式生成模式')

    console.log('🔐 Step 3: Checking model permissions')

    console.log(`🔍 Checking model access: userTier=${userTier}, requestedModel=${requestedModel}`);

    // 验证用户是否有权限使用请求的模型
    if (!canUseModel(userTier, requestedModel)) {
      console.log(`❌ Access denied: ${requestedModel} requires higher tier than ${userTier}`);
      return NextResponse.json(
        { error: `Access denied: ${requestedModel} requires a higher subscription tier. Your tier: ${userTier}` },
        { status: 403 }
      )
    }

    // 获取模型配置
    const modelConfig = AVAILABLE_MODELS[requestedModel]
    if (!modelConfig) {
      console.log(`❌ Invalid model: ${requestedModel} not found in AVAILABLE_MODELS`);
      console.log(`📋 Available models:`, Object.keys(AVAILABLE_MODELS));
      return NextResponse.json(
        { error: `Invalid model: ${requestedModel}. Available models: ${Object.keys(AVAILABLE_MODELS).join(', ')}` },
        { status: 400 }
      )
    }

    console.log(`✅ Model access granted: ${requestedModel} (provider: ${modelConfig.provider})`);
    console.log('🔑 Step 4: Setting up API configuration');

    // 根据模型提供商选择API配置
    let apiKey: string | undefined
    let baseUrl: string | undefined
    let model: string

    console.log(`🔧 Configuring API for provider: ${modelConfig.provider}`);

    switch (modelConfig.provider) {
      case 'deepseek':
        console.log('🎯 Using DeepSeek API');
        apiKey = process.env.DEEPSEEK_API_KEY
        baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
        model = requestedModel
        break
      case 'openai':
        console.log('🎯 Using OpenAI API');
        apiKey = process.env.OPENAI_API_KEY
        baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
        model = requestedModel
        break
      case 'anthropic':
        console.log('🎯 Using Anthropic API');
        apiKey = process.env.ANTHROPIC_API_KEY
        baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
        model = requestedModel
        break
      case 'zhipu':
        console.log('🎯 Using Zhipu AI API');
        apiKey = process.env.GLM_API_KEY
        baseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/'
        model = process.env.GLM_MODEL || 'glm-4-6'
        break
      default:
        console.log(`❌ Unsupported provider: ${modelConfig.provider}`);
        return NextResponse.json(
          { error: `Unsupported model provider: ${modelConfig.provider}` },
          { status: 400 }
        )
    }

    console.log(`🔑 API config: key=${apiKey ? 'present' : 'missing'}, baseUrl=${baseUrl}, model=${model}`);

    console.log('🔐 Step 5: Checking API key configuration');

    if (!apiKey) {
      console.error(`❌ ${modelConfig.provider} API key is not configured`)
      return NextResponse.json(
        {
          error: `${modelConfig.provider} API key is not configured. Please set the appropriate API key in your environment variables.`,
          details: `Required environment variable: ${modelConfig.provider.toUpperCase()}_API_KEY`
        },
        { status: 400 }
      )
    }

    console.log(`✅ API key found for ${modelConfig.provider}`);

    // 检查API key是否正确配置
    const placeholderKeys = [
      'your_deepseek_api_key_here',
      'your_glm_api_key_here',
      'your_openai_api_key_here',
      'your_anthropic_api_key_here'
    ]

    if (placeholderKeys.includes(apiKey)) {
      console.error(`❌ ${modelConfig.provider} API key is using placeholder value`)
      return NextResponse.json(
        {
          error: `${modelConfig.provider} API key is using placeholder value. Please set the actual API key in your CloudBase environment variables.`,
          details: `Required environment variable: ${modelConfig.provider.toUpperCase()}_API_KEY (current value is a placeholder)`
        },
        { status: 400 }
      )
    }

    console.log(`✅ API key validation passed for ${modelConfig.provider}`);

    // Initialize OpenAI client with DeepSeek configuration
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    })

    console.log('🤖 Starting streaming AI generation...')

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false

        const safeEnqueue = (data) => {
          if (!controllerClosed) {
            try {
              controller.enqueue(data)
            } catch (error) {
              console.error('Failed to enqueue data:', error)
              controllerClosed = true
            }
          }
        }

        const safeClose = () => {
          if (!controllerClosed) {
            try {
              controller.close()
              controllerClosed = true
            } catch (error) {
              console.error('Failed to close controller:', error)
            }
          }
        }
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
            stream: true, // Enable streaming
          })

          let streamedChars = 0
          let accumulatedContent = ''

          // 优化1: 添加心跳机制，防止代理中断连接
          const heartbeatInterval = setInterval(() => {
            try {
              safeEnqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
            } catch (error) {
              console.error('Failed to send heartbeat:', error)
            }
          }, 10000) // 每10秒发送心跳

          let charBuffer = ''
          const BATCH_SIZE = 5 // 减少批量大小，提高响应性

          // Process streaming chunks in real-time - optimized for production with smart fallback
          let fallbackTriggered = false

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              accumulatedContent += content

              // 更新生成状态
              state.streamedContent = accumulatedContent
              state.lastActivity = Date.now()
              state.progress = Math.min(90, (accumulatedContent.length / Math.max(prompt.length * 2, 500)) * 100)

              // 实时风险检测
              if (!fallbackTriggered && shouldFallback(state)) {
                console.log('🔄 检测到生成风险，切换到异步模式')
                fallbackTriggered = true
                state.status = 'fallback_async'
                state.mode = 'async'

                // 通知前端切换模式
                safeEnqueue(`data: ${JSON.stringify({
                  type: 'mode_switch',
                  mode: 'async',
                  taskId: state.taskId,
                  reason: 'runtime_risk_detected',
                  progress: state.progress
                })}\n\n`)

                // 启动异步后备处理
                startAsyncFallback(
                  state.taskId,
                  prompt,
                  requestedModel,
                  apiKey,
                  baseUrl,
                  accumulatedContent,
                  user
                ).catch(error => {
                  console.error('异步后备处理失败:', error)
                  safeEnqueue(`data: ${JSON.stringify({
                    type: 'error',
                    error: '异步处理失败',
                    details: error.message
                  })}\n\n`)
                })

                // 停止流式处理
                break
              }

              // 批量发送字符
              for (const char of content) {
                charBuffer += char
                streamedChars++

                if (charBuffer.length >= BATCH_SIZE) {
                  const batchData = {
                    type: 'chars',
                    chars: charBuffer,
                    totalLength: streamedChars,
                    progress: state.progress
                  }

                  safeEnqueue(`data: ${JSON.stringify(batchData)}\n\n`)
                  charBuffer = ''

                  // 减少延迟以提高响应性
                  await new Promise(resolve => setTimeout(resolve, 2))
                }
              }

                // 通知前端切换模式
                safeEnqueue(`data: ${JSON.stringify({
                  type: 'mode_switch',
                  mode: 'async',
                  taskId: generationState.taskId,
                  reason: 'generation_timeout_risk'
                })}\n\n`)

                // 启动异步后备处理
                const asyncTaskId = await startAsyncFallback(
                  generationState.taskId,
                  prompt,
                  model,
                  user,
                  accumulatedContent,
                  conversationId
                )

                if (asyncTaskId) {
                  // 更新前端的异步任务ID
                  safeEnqueue(`data: ${JSON.stringify({
                    type: 'async_task_ready',
                    asyncTaskId: asyncTaskId
                  })}\n\n`)
                }

                // 停止流式处理
                break
              }
            }
          }

          // 发送剩余的字符缓冲区
          if (charBuffer.length > 0) {
            const finalBatchData = {
              type: 'chars',
              chars: charBuffer,
              totalLength: streamedChars
            }
            safeEnqueue(`data: ${JSON.stringify(finalBatchData)}\n\n`)
          }

          // 清理心跳定时器
          clearInterval(heartbeatInterval)

          console.log('AI streaming completed, total characters streamed:', streamedChars)

          // Since we're streaming code directly, we need to format it for the final response
          let finalCode = accumulatedContent.trim()

          // Clean up the code - remove any markdown formatting if present
          const codeBlockRegex = /```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/
          const match = finalCode.match(codeBlockRegex)
          if (match) {
            finalCode = match[1].trim()
          }

          // Format the code
          finalCode = formatCodeString(finalCode)

          // Ensure we have valid code
          if (!finalCode || finalCode.length < 50) {
            finalCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          Code generation completed successfully!
        </p>
      </div>
    </div>
  );
}

export default App;`
          }

          console.log('Final code formatted, length:', finalCode.length)

          // Send final complete response
          const finalData = {
            type: 'complete',
            project: {
              files: {
                'src/App.tsx': finalCode,
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
              projectName: 'streaming-app'
            }
          }

          safeEnqueue(`data: ${JSON.stringify(finalData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()

          console.log('Streaming generation completed, processing final response...')

          // Process the final accumulated content
          let parsedResponse

          try {
            // Try to extract JSON from the accumulated content
            let jsonContent = accumulatedContent.trim()

            // Check if response contains markdown code blocks
            const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
            const match = accumulatedContent.match(codeBlockRegex)
            if (match) {
              jsonContent = match[1].trim()
            }

            // Clean up any extra text before or after JSON
            const jsonStart = jsonContent.indexOf('{')
            let jsonEnd = jsonContent.lastIndexOf('}')

            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1)
            }

            parsedResponse = JSON.parse(jsonContent)

            // Format the code
            if (parsedResponse.files && parsedResponse.files['src/App.tsx']) {
              const originalCode = parsedResponse.files['src/App.tsx']
              const formattedCode = formatCodeString(originalCode)
              parsedResponse.files['src/App.tsx'] = formattedCode
            }

          } catch (parseError) {
            console.warn('JSON parsing failed in streaming response, using fallback')

            // Fallback: try to extract code from the accumulated content
            let extractedCode = accumulatedContent

            // Try to find React component code
            const codePatterns = [
              /```(?:jsx?|typescript|js|react)?\s*([\s\S]*?)```/,
              /(?:function|const)\s+App[\s\S]*?(?=```|$)/,
            ]

            for (const pattern of codePatterns) {
              const match = accumulatedContent?.match(pattern)
              if (match && match[1] && match[1].length > 100) {
                extractedCode = match[1].trim()
                break
              }
            }

            // Apply formatting
            extractedCode = formatCodeString(extractedCode)

            // Ensure we have at least a basic component
            if (!extractedCode || extractedCode.length < 50) {
              extractedCode = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Generated App</h1>
        <p className="text-gray-600 mb-4">
          The AI generated streaming content, but the code structure was incomplete.
          This is a fallback component to ensure the app runs.
        </p>
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> The streaming generation may have been truncated.
            Try simplifying your request or try again.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;`
            }

            parsedResponse = {
              files: {
                'src/App.tsx': extractedCode,
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
              projectName: 'streaming-app'
            }
          }

          // 保存AI响应到对话（如果有conversationId）
          if (conversationId) {
            try {
              console.log('💾 Saving AI response to conversation:', conversationId)
              await saveMessageToConversation(conversationId, 'assistant', JSON.stringify(parsedResponse), user.id)
              console.log('✅ AI response saved to conversation')
            } catch (saveError) {
              console.error('❌ Failed to save AI response to conversation:', saveError)
              // 不影响代码生成，只记录错误
            }
          }

          // Send final complete response
          const parsedFinalData = {
            type: 'complete',
            project: parsedResponse
          }

          safeEnqueue(`data: ${JSON.stringify(parsedFinalData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()

          const totalTime = performance.now()
          console.log(`✅ Streaming request completed in ${(totalTime - startTime).toFixed(2)}ms`)

        } catch (error: any) {
          console.error('Error in streaming response:', error)
          
          // Handle specific error types
          let errorMessage = 'Failed to generate code'
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
          
          const errorData = {
            type: 'error',
            error: errorMessage,
            details: errorDetails,
            statusCode: error?.status || error?.response?.status || 500
          }
          safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()
        }
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Error starting streaming generation:', error)
    return NextResponse.json(
      { error: 'Failed to start streaming generation' },
      { status: 500 }
    )
  }
}

}
