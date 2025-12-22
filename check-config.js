#!/usr/bin/env node

/**
 * 环境变量和数据库配置检查脚本
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 mornFront 配置检查工具');
console.log('===========================\n');

// 检查环境变量
console.log('📋 环境变量状态:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'DEEPSEEK_API_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value && !value.includes('your_') && !value.includes('example') ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value ? '已设置' : '未设置'}`);
});

console.log('\n📊 Supabase 数据库连接测试:');

// 测试 Supabase 连接
async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
    console.log('❌ Supabase 未配置或使用占位符值');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('user_subscriptions').select('count').limit(1);

    if (error) {
      console.log('❌ 数据库连接失败:', error.message);
      console.log('   可能原因: 数据库表未创建');
      console.log('   解决方案: 运行 supabase-subscription-schema.sql');
    } else {
      console.log('✅ 数据库连接成功');
      console.log('✅ 订阅表存在');
    }
  } catch (error) {
    console.log('❌ 连接测试失败:', error.message);
  }
}

testSupabaseConnection().then(() => {
  console.log('\n🎯 后续步骤:');
  console.log('1. 如果环境变量未设置，请编辑 .env.local 文件');
  console.log('2. 如果数据库连接失败，请在 Supabase 中运行 SQL 脚本');
  console.log('3. 配置完成后重启开发服务器');
  console.log('4. 访问 http://localhost:3000/profile 测试订阅功能');
});












