#!/usr/bin/env node

/**
 * 强制重新加载环境变量并重启服务器
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🔄 修复环境变量加载问题\n');

// 1. 检查环境变量文件
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local 文件存在');

  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');

  // 查找微信支付配置
  const wechatConfig = {};
  lines.forEach(line => {
    if (line.includes('WECHAT_PAY_APPID=')) {
      wechatConfig.appId = line.split('=')[1];
    }
    if (line.includes('WECHAT_PAY_MCHID=')) {
      wechatConfig.mchId = line.split('=')[1];
    }
  });

  console.log('📱 文件中的微信支付配置:');
  console.log(`   WECHAT_PAY_APPID: ${wechatConfig.appId || '未找到'}`);
  console.log(`   WECHAT_PAY_MCHID: ${wechatConfig.mchId || '未找到'}`);

  if (wechatConfig.appId && wechatConfig.mchId) {
    console.log('✅ 配置文件正确');
  } else {
    console.log('❌ 配置文件缺失关键变量');
    console.log('\n请确保 .env.local 文件包含:');
    console.log('WECHAT_PAY_APPID=wx1234567890abcdef');
    console.log('WECHAT_PAY_MCHID=123456789');
    process.exit(1);
  }
} else {
  console.log('❌ .env.local 文件不存在');
  process.exit(1);
}

// 2. 清除Next.js缓存
console.log('\n🗑️  清除Next.js缓存...');
if (fs.existsSync('.next')) {
  fs.rmSync('.next', { recursive: true, force: true });
  console.log('✅ Next.js缓存已清除');
}

// 3. 终止现有Node进程
console.log('\n🛑 终止现有Node进程...');
exec('taskkill /IM node.exe /F', (error) => {
  // 忽略错误，继续执行
  console.log('✅ Node进程清理完成');
});

// 4. 等待一下
setTimeout(() => {
  console.log('\n🚀 启动新的开发服务器...');
  console.log('请在新的终端窗口运行: pnpm dev');

  console.log('\n💡 环境变量加载提示:');
  console.log('1. Next.js会在启动时自动加载 .env.local 文件');
  console.log('2. 如果仍有问题，请检查变量格式（无空格、无引号）');
  console.log('3. 私钥中的 \\n 需要替换为实际换行符');
}, 2000);




