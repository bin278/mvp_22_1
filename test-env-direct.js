// 直接在 Next.js API 上下文中测试环境变量
// 这个脚本模拟 API 路由的行为

// 模拟 Next.js 的环境变量加载
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('=== 在模拟 Next.js 环境中测试环境变量 ===\n');

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[已设置]' : '未设置');
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '未设置');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '未设置');
console.log('WECHAT_APP_ID:', process.env.WECHAT_APP_ID || '未设置');
console.log('NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '未设置');

// 测试我们的 env-client 逻辑
console.log('\n=== 测试 env-client 逻辑 ===');
const { getPublicEnv } = require('./lib/env-client');

async function testEnvClient() {
  try {
    const env = await getPublicEnv();
    console.log('getPublicEnv() 返回:', env);
  } catch (error) {
    console.error('getPublicEnv() 错误:', error.message);
  }
}

testEnvClient();
