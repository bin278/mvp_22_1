import { NextResponse } from 'next/server';

/**
 * 获取前端可访问的环境变量
 * 注意：只返回安全的、非敏感的环境变量
 */
export async function GET() {
  // 只返回前端需要但无法直接访问的环境变量
  const publicEnv = {
    // 应用配置
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
    NEXT_PUBLIC_WECHAT_APP_ID: process.env.WECHAT_APP_ID, // 微信登录需要的前端变量

    // 部署环境信息
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
    NODE_ENV: process.env.NODE_ENV || 'development',

    // 功能开关（如果有的话）
    // ENABLE_XXX_FEATURE: process.env.ENABLE_XXX_FEATURE === 'true',
  };

  return NextResponse.json({
    success: true,
    env: publicEnv,
    timestamp: new Date().toISOString()
  });
}