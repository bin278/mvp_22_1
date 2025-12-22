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

    // Create streaming response for real-time code modification
    const stream = new ReadableStream({
      async start(controller) {
        let controllerClosed = false

        const safeEnqueue = (data: string) => {
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
            stream: true,
          })

          let streamedChars = 0
          let accumulatedContent = ''

          // Stream code modifications in real-time
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              accumulatedContent += content

              // Stream each character for real-time display
              for (const char of content) {
                streamedChars++

                const charData = {
                  type: 'char',
                  char: char,
                  totalLength: streamedChars
                }
                
                safeEnqueue(`data: ${JSON.stringify(charData)}\n\n`)
                
                // Small delay for visible typewriter effect
                await new Promise(resolve => setTimeout(resolve, 20))
              }
            }
          }

          // Clean up the modified code
          let modifiedCode = accumulatedContent.trim()

          // Remove markdown code blocks if present
          const codeBlockRegex = /```(?:typescript|tsx|jsx|js|ts)?\s*([\s\S]*?)```/
          const match = modifiedCode.match(codeBlockRegex)
          if (match) {
            modifiedCode = match[1].trim()
          }

          // Send final complete response
          const finalData = {
            type: 'complete',
            code: modifiedCode
          }

          safeEnqueue(`data: ${JSON.stringify(finalData)}\n\n`)
          safeEnqueue(`data: [DONE]\n\n`)
          safeClose()

        } catch (error: any) {
          console.error('Error modifying code:', error)
          
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
    console.error('Error starting code modification:', error)
    return NextResponse.json(
      { error: 'Failed to start code modification' },
      { status: 500 }
    )
  }
}




















