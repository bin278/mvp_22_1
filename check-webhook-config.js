/**
 * 检查webhook配置状态
 */

const { createClient } = require('@supabase/supabase-js');

// 检查环境变量配置
function checkEnvironmentVariables() {
  console.log('🔍 检查环境变量配置...\n');

  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = [];
  const presentVars = [];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
      // 不要显示敏感信息，只显示前几位
      const value = process.env[varName];
      const masked = varName.includes('SECRET') || varName.includes('KEY')
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName}: 未配置`);
    }
  });

  console.log(`\n📊 配置状态: ${presentVars.length}/${requiredVars.length} 个变量已配置`);

  if (missingVars.length > 0) {
    console.log(`\n⚠️  缺少的环境变量: ${missingVars.join(', ')}`);
  }

  return missingVars.length === 0;
}

// 生成webhook配置信息
function generateWebhookConfig() {
  console.log('\n🔧 Webhook配置信息:');

  // 本地开发环境
  const localUrl = 'http://localhost:3000';
  console.log(`\n📍 本地开发环境:`);
  console.log(`   Stripe Webhook URL: ${localUrl}/api/payment/webhook/stripe`);
  console.log(`   PayPal Webhook URL: ${localUrl}/api/payment/webhook/paypal`);

  // 生产环境（需要替换为实际域名）
  const prodUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';
  console.log(`\n🌐 生产环境:`);
  console.log(`   Stripe Webhook URL: ${prodUrl}/api/payment/webhook/stripe`);
  console.log(`   PayPal Webhook URL: ${prodUrl}/api/payment/webhook/paypal`);

  console.log('\n📋 Stripe Webhook事件:');
  console.log('   - checkout.session.completed');
  console.log('   - invoice.payment_succeeded');
  console.log('   - invoice.payment_failed');

  console.log('\n📋 PayPal Webhook事件:');
  console.log('   - PAYMENT.CAPTURE.COMPLETED');
  console.log('   - PAYMENT.CAPTURE.DENIED');
}

// 检查数据库连接
async function checkDatabaseConnection() {
  console.log('\n🔗 检查数据库连接...');

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ 数据库连接失败:', error.message);
      return false;
    }

    console.log('✅ 数据库连接正常');
    return true;
  } catch (error) {
    console.log('❌ 数据库连接错误:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 Webhook配置检查工具\n');

  // 加载环境变量
  require('dotenv').config({ path: '.env.local' });

  const envOk = checkEnvironmentVariables();
  const dbOk = await checkDatabaseConnection();

  generateWebhookConfig();

  console.log('\n📝 配置步骤:');

  if (!envOk) {
    console.log('\n1. 🔧 修复环境变量配置');
    console.log('   - 在 .env.local 文件中添加缺失的环境变量');
    console.log('   - 从 Stripe/PayPal 控制台获取相应的密钥');
  } else {
    console.log('\n1. ✅ 环境变量配置完成');
  }

  if (!dbOk) {
    console.log('\n2. 🔧 修复数据库连接');
    console.log('   - 检查 Supabase 连接信息');
    console.log('   - 确保数据库表已创建');
  } else {
    console.log('\n2. ✅ 数据库连接正常');
  }

  console.log('\n3. 🌐 配置Stripe Webhook');
  console.log('   - 登录 Stripe 控制台 (https://dashboard.stripe.com/)');
  console.log('   - 进入 Webhooks 页面');
  console.log('   - 添加新的 webhook endpoint');
  console.log('   - 选择事件: checkout.session.completed, invoice.payment_succeeded');
  console.log('   - 复制 webhook secret 到环境变量 STRIPE_WEBHOOK_SECRET');

  console.log('\n4. 🌐 配置PayPal Webhook');
  console.log('   - 登录 PayPal 开发者控制台');
  console.log('   - 创建或配置 webhook');
  console.log('   - 选择事件: PAYMENT.CAPTURE.COMPLETED');
  console.log('   - 复制 webhook ID 到环境变量 PAYPAL_WEBHOOK_ID');

  console.log('\n5. 🧪 测试webhook');
  console.log('   - 使用 Stripe CLI 测试: stripe listen --forward-to localhost:3000/api/payment/webhook/stripe');
  console.log('   - 使用个人资料页面的"支付升级测试"功能验证逻辑');

  console.log('\n✨ 配置完成后，真实支付应该能正常升级订阅等级！');
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkEnvironmentVariables, generateWebhookConfig, checkDatabaseConnection };












