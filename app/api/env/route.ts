import { NextResponse } from 'next/server'

/**
 * API 路由：返回前端需要的环境变量
 * 在腾讯云部署时，前端无法直接访问环境变量，需要通过此 API 获取
 */
export async function GET() {
  try {
    // 只返回前端需要的、安全的公共环境变量
    // 不返回敏感信息（如 SECRET_KEY、SERVICE_ROLE_KEY 等）
    const publicEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
    }

    // 设置缓存头，减少请求频率
    return NextResponse.json(publicEnv, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error fetching environment variables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch environment variables' },
      { status: 500 }
    )
  }
}






