import { NextResponse } from 'next/server'

export async function GET() {
  const envStatus = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '✅ 已配置' : '❌ 未配置',
    DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL || '默认值',
    DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || '默认值',
    DEEPSEEK_MAX_TOKENS: process.env.DEEPSEEK_MAX_TOKENS || '默认值',
    DEEPSEEK_TEMPERATURE: process.env.DEEPSEEK_TEMPERATURE || '默认值',
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已配置' : '❌ 未配置',
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置',
  }

  return NextResponse.json({
    status: '配置检查',
    environment: envStatus,
    timestamp: new Date().toISOString()
  })
}
