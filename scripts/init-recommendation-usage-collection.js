#!/usr/bin/env node

/**
 * 初始化 recommendation_usage 集合
 * 在CloudBase中创建第一个记录来自动创建集合
 */

const cloudbase = require('@cloudbase/node-sdk');

// 初始化CloudBase
const app = cloudbase.init({
  secretId: process.env.TENCENT_CLOUD_SECRET_ID,
  secretKey: process.env.TENCENT_CLOUD_SECRET_KEY,
  env: process.env.TENCENT_CLOUD_ENV_ID,
});

async function initRecommendationUsageCollection() {
  try {
    console.log('🚀 开始初始化 recommendation_usage 集合...');

    // 获取数据库实例
    const db = app.database();

    console.log('📊 连接到CloudBase数据库成功');

    // 创建一个初始记录来自动创建集合
    // 使用一个虚拟的用户ID和时间，确保不会影响实际使用统计
    const initRecord = {
      user_id: 'system-init',
      usage_count: 0,
      created_at: new Date().toISOString(),
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
      is_init_record: true // 标记这是初始化记录
    };

    console.log('📝 正在创建初始化记录...');
    const result = await db.collection('recommendation_usage').add(initRecord);

    console.log('✅ 集合初始化成功！');
    console.log('📄 创建的记录ID:', result.id);

    // 可选：删除初始化记录，保留空集合
    console.log('🗑️ 正在清理初始化记录...');
    await db.collection('recommendation_usage').doc(result.id).remove();
    console.log('✅ 初始化记录已清理');

    console.log('');
    console.log('🎉 recommendation_usage 集合初始化完成！');
    console.log('');
    console.log('📋 集合信息：');
    console.log('  - 集合名称: recommendation_usage');
    console.log('  - 用途: 存储用户推荐功能使用统计');
    console.log('  - 字段: user_id, usage_count, created_at, period_start, period_end');

  } catch (error) {
    console.error('❌ 初始化集合失败:', error);

    // 如果是权限错误，给出具体指导
    if (error.code === 'PERMISSION_DENIED') {
      console.log('');
      console.log('🔒 权限错误解决方法:');
      console.log('1. 访问 CloudBase 控制台');
      console.log('2. 进入数据库 -> 权限设置');
      console.log('3. 为 recommendation_usage 集合添加读写权限');
    }

    console.log('');
    console.log('🔍 其他故障排除:');
    console.log('1. 检查环境变量 TENCENT_CLOUD_SECRET_ID 等是否正确');
    console.log('2. 确认环境ID有效');
    console.log('3. 验证腾讯云账户有足够权限');
  }
}

// 运行初始化
initRecommendationUsageCollection().catch(console.error);
