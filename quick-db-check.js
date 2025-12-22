#!/usr/bin/env node

/**
 * 快速数据库检查脚本
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return {};

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
    return {};
  }
}

async function checkDB() {
  const env = loadEnv();

  console.log('🔍 快速数据库检查\n');

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('❌ Supabase 未配置');
    console.log('请检查 .env.local 文件');
    return;
  }

  try {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 检查表是否存在
    const { data: tables, error: tableError } = await supabase
      .rpc('get_table_count', { table_name: 'user_subscriptions' })
      .select();

    if (tableError) {
      console.log('❌ 数据库表检查失败');
      console.log('请确保已运行 supabase-subscription-schema.sql');
    } else {
      console.log('✅ 数据库表存在');

      // 检查是否有活跃订阅（这里无法获取用户ID，所以只是检查表结构）
      const { data: count } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 订阅记录总数: ${count || 0}`);
    }

  } catch (error) {
    console.log('❌ 数据库连接失败');
    console.log('错误:', error.message);
  }
}

checkDB();












