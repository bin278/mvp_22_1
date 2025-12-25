// 测试 process.env 中的环境变量
console.log('=== 测试 process.env 中的环境变量 ===\n');

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[已设置]' : '未设置');
console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '未设置');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '未设置');
console.log('WECHAT_APP_ID:', process.env.WECHAT_APP_ID || '未设置');
console.log('NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '未设置');

console.log('\n=== 检查 .env 文件 ===');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('.env.local 文件存在');
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('文件内容:');
    console.log(content);
  } else {
    console.log('.env.local 文件不存在');
  }
} catch (error) {
  console.error('读取 .env.local 文件失败:', error.message);
}
