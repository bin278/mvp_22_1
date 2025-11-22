import { NextResponse } from 'next/server'
import { generateFrontendCode } from '@/lib/code-generator'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const generatedProject = generateFrontendCode(prompt.trim())
    
    return NextResponse.json({
      success: true,
      project: generatedProject
    })
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}

