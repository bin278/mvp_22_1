#!/usr/bin/env node

/**
 * 检查现有数据库表的脚本
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

console.log('🔍 检查现有数据库表');
console.log('========================\n');

// 检查配置
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('❌ Supabase 配置不完整');
  console.log('请确保 .env.local 文件包含正确的配置\n');
  process.exit(1);
}

async function checkExistingTables() {
  try {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    console.log('正在检查现有表...\n');

    // 检查可能存在的旧表
    const possibleTables = [
      'subscriptions',
      'user_subscriptions',
      'user_usage_stats',
      'payments',
      'user_github_tokens',
      'user_payment_methods'
    ];

    for (const tableName of possibleTables) {
      try {
        // 尝试查询表
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ ${tableName}: 表不存在`);
          } else {
            console.log(`⚠️  ${tableName}: ${error.message}`);
          }
        } else {
          console.log(`✅ ${tableName}: 存在 (${count || 0} 条记录)`);

          // 如果有数据，显示表结构
          if (count && count > 0) {
            try {
              const { data: sampleData, error: sampleError } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

              if (!sampleError && sampleData && sampleData.length > 0) {
                console.log(`   示例数据:`, JSON.stringify(sampleData[0], null, 2).substring(0, 200) + '...');
              }
            } catch (e) {
              // 忽略获取示例数据的错误
            }
          }
        }
      } catch (e) {
        console.log(`❓ ${tableName}: 无法检查 (${e.message})`);
      }
    }

    console.log('\n📋 迁移建议:');
    console.log('================');

    // 检查是否需要迁移
    const hasOldTables = await checkForOldTables(supabase);
    if (hasOldTables) {
      console.log('\n🔄 发现旧表，需要数据迁移');
      console.log('建议步骤:');
      console.log('1. 备份现有数据');
      console.log('2. 创建新表结构');
      console.log('3. 迁移数据');
      console.log('4. 删除旧表');
    } else {
      console.log('\n✅ 没有发现需要迁移的旧表');
      console.log('可以直接创建新的订阅表结构');
    }

  } catch (error) {
    console.log('❌ 检查失败:', error.message);
  }
}

async function checkForOldTables(supabase) {
  try {
    // 检查旧的 subscriptions 表
    const { data: oldSubs, error: oldSubsError } = await supabase
      .from('subscriptions')
      .select('count', { count: 'exact', head: true });

    if (!oldSubsError && oldSubs !== null) {
      console.log(`\n⚠️  发现旧的 subscriptions 表 (${oldSubs} 条记录)`);
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

checkExistingTables();












