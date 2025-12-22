#!/usr/bin/env node

/**
 * 检查用户订阅状态的脚本
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动加载 .env.local 文件
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local 文件不存在');
      return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.log('❌ 读取 .env.local 文件失败:', error.message);
    return {};
  }
}

const env = loadEnvFile();

// 检查用户ID - 你需要在这里输入实际的用户ID
const userId = process.argv[2] || 'your-user-id-here';

console.log('🔍 检查用户订阅状态');
console.log('========================\n');

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('❌ Supabase配置不完整');
  console.log('请确保 .env.local 文件中包含正确的 Supabase 配置');
  process.exit(1);
}

async function checkUserSubscription() {
  try {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    console.log(`正在检查用户: ${userId}`);
    console.log('');

    // 检查用户订阅
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (subError) {
      console.log('❌ 查询订阅失败:', subError.message);
      return;
    }

    console.log('📊 用户订阅记录:');
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. 等级: ${sub.subscription_tier}`);
        console.log(`     状态: ${sub.status}`);
        console.log(`     开始时间: ${sub.current_period_start}`);
        console.log(`     结束时间: ${sub.current_period_end}`);
        console.log(`     创建时间: ${sub.created_at}`);
        console.log('');
      });

      // 检查是否有活跃订阅
      const activeSubscription = subscriptions.find(sub => sub.status === 'active');
      if (activeSubscription) {
        console.log('✅ 用户有活跃订阅:', activeSubscription.subscription_tier);
      } else {
        console.log('⚠️  用户没有活跃订阅，所有订阅都是非活跃状态');
      }
    } else {
      console.log('  ℹ️  未找到任何订阅记录');
    }

    // 检查用户使用统计
    const { data: usage, error: usageError } = await supabase
      .from('user_usage_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('\n📈 用户使用统计:');
    if (usage) {
      console.log(`  今日请求: ${usage.requests_today}`);
      console.log(`  本月请求: ${usage.requests_this_month}`);
      console.log(`  订阅等级: ${usage.subscription_tier}`);
      console.log(`  最后请求: ${usage.last_request_at}`);
    } else {
      console.log('  ℹ️  未找到使用统计记录');
    }

    // 检查支付记录
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('\n💳 最近支付记录:');
    if (payments && payments.length > 0) {
      payments.forEach((payment, index) => {
        console.log(`  ${index + 1}. 金额: ${payment.amount} ${payment.currency}`);
        console.log(`     状态: ${payment.status}`);
        console.log(`     方法: ${payment.payment_method}`);
        console.log(`     时间: ${payment.created_at}`);
        console.log('');
      });
    } else {
      console.log('  ℹ️  未找到支付记录');
    }

  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
}

// 如果没有提供用户ID，显示使用说明
if (userId === 'your-user-id-here') {
  console.log('❌ 请提供用户ID');
  console.log('');
  console.log('使用方法:');
  console.log('  node check-user-subscription.js <user-id>');
  console.log('');
  console.log('如何获取用户ID:');
  console.log('1. 登录到应用');
  console.log('2. 打开浏览器开发者工具 (F12)');
  console.log('3. 进入 Console 标签');
  console.log('4. 输入: console.log(auth.user.id) 并按回车');
  console.log('5. 复制输出的用户ID');
  process.exit(1);
}

checkUserSubscription();












