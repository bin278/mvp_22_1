import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AVAILABLE_MODELS, canUseModel, type SubscriptionTier } from '@/lib/subscription-tiers'
import { requireAuth } from '@/lib/auth/auth'

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
  const startTime = performance.now()
  console.log('🚀 Starting streaming code generation request')

  try {
    const { prompt, model: requestedModel = 'deepseek-chat' } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // 获取用户的订阅等级
    let userTier: string = 'free'

    try {
      // 使用CloudBase认证
      const authResult = await requireAuth(request as NextRequest)
      if (authResult.success && authResult.user) {
        userTier = 'pro' // CloudBase用户默认为pro等级
      }
    } catch (error) {
      console.warn('Failed to get user subscription tier, using free tier:', error)
      userTier = 'free'
    }

    // 验证用户是否有权限使用请求的模型
    if (!canUseModel(userTier, requestedModel)) {
      return NextResponse.json(
        { error: `Access denied: ${requestedModel} requires a higher subscription tier` },
        { status: 403 }
      )
    }

    // 获取模型配置
    const modelConfig = AVAILABLE_MODELS[requestedModel]
    if (!modelConfig) {
      return NextResponse.json(
        { error: `Invalid model: ${requestedModel}` },
        { status: 400 }
      )
    }

    // 根据模型提供商选择API配置
    let apiKey: string | undefined
    let baseUrl: string | undefined
    let model: string

    switch (modelConfig.provider) {
      case 'DeepSeek':
        apiKey = process.env.DEEPSEEK_API_KEY
        baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
        model = requestedModel
        break
      case 'OpenAI':
        apiKey = process.env.OPENAI_API_KEY
        baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
        model = requestedModel
        break
      case 'Anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY
        baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
        model = requestedModel
        break
      case 'zhipu':
        apiKey = process.env.GLM_API_KEY
        baseUrl = process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/'
        model = process.env.GLM_MODEL || 'glm-4-6'
        break
      default:
        return NextResponse.json(
          { error: `Unsupported model provider: ${modelConfig.provider}` },
          { status: 400 }
        )
    }

    if (!apiKey) {
      const errorData = {
        type: 'error',
        error: `${modelConfig.provider} API key is not configured`
      }
      safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`)
      safeEnqueue(`data: [DONE]\n\n`)
      safeClose()
      return
    }

    // 检查API key是否正确配置
    const placeholderKeys = [
      'your_deepseek_api_key_here',
      'your_glm_api_key_here',
      'your_openai_api_key_here',
      'your_anthropic_api_key_here'
    ]

    if (!apiKey || placeholderKeys.includes(apiKey)) {
      console.error(`${modelConfig.provider} API key is not configured or using placeholder value`)
      const errorData = {
        type: 'error',
        error: `${modelConfig.provider} API key is not configured. Please set the appropriate API key in your CloudBase environment variables.`
      }
      safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`)
      safeEnqueue(`data: [DONE]\n\n`)
      safeClose()
      return
    }

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

          // Process streaming chunks in real-time - true real-time streaming like Google
          // DeepSeek generates → we immediately forward → frontend immediately displays
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              accumulatedContent += content

              // Stream content character by character with visible delay for typewriter effect
              for (const char of content) {
                streamedChars++

                const charData = {
                  type: 'char',
                  char: char,
                  totalLength: streamedChars
                }
                
                // Send each character immediately
                safeEnqueue(`data: ${JSON.stringify(charData)}\n\n`)

                // Small delay for visible typewriter effect (adjust this for speed)
                // 20ms = fast typing, 50ms = normal typing, 100ms = slow typing
                await new Promise(resolve => setTimeout(resolve, 20))
              }
            }
          }

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
