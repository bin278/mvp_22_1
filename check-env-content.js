#!/usr/bin/env node

/**
 * 检查 .env.local 文件内容和格式
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查 .env.local 文件内容\n');

// 检查文件是否存在
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local 文件不存在');
  process.exit(1);
}

// 读取文件内容
try {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  console.log('📄 .env.local 文件内容（关键部分）：\n');

  let lineNumber = 1;
  let wechatConfigFound = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    // 显示关键的微信支付配置行
    if (trimmed.includes('WECHAT_PAY_APPID') ||
        trimmed.includes('WECHAT_PAY_MCHID') ||
        trimmed.includes('WECHAT_PAY_PRIVATE_KEY')) {

      console.log(`${lineNumber.toString().padStart(3)}| ${line}`);
      wechatConfigFound = true;
    }

    // 显示77-93行的内容（您提到的范围）
    if (lineNumber >= 77 && lineNumber <= 93) {
      console.log(`${lineNumber.toString().padStart(3)}| ${line}`);
    }

    lineNumber++;
  });

  if (!wechatConfigFound) {
    console.log('\n❌ 未找到微信支付配置');
  }

  console.log('\n🔍 格式检查：');

  // 检查特定行是否有问题
  const appIdLine = lines.find(line => line.includes('WECHAT_PAY_APPID'));
  const mchIdLine = lines.find(line => line.includes('WECHAT_PAY_MCHID'));

  if (appIdLine) {
    console.log(`WECHAT_PAY_APPID: ${appIdLine}`);
    if (appIdLine.includes(' ') && !appIdLine.includes('=')) {
      console.log('❌ 格式错误：等号前后有空格');
    }
    if (appIdLine.includes('"') || appIdLine.includes("'")) {
      console.log('❌ 格式错误：包含引号');
    }
  }

  if (mchIdLine) {
    console.log(`WECHAT_PAY_MCHID: ${mchIdLine}`);
    if (mchIdLine.includes(' ') && !mchIdLine.includes('=')) {
      console.log('❌ 格式错误：等号前后有空格');
    }
    if (mchIdLine.includes('"') || mchIdLine.includes("'")) {
      console.log('❌ 格式错误：包含引号');
    }
  }

  console.log('\n💡 如果格式正确但仍显示"未设置"，请重启开发服务器');

} catch (error) {
  console.log('❌ 读取文件失败:', error.message);
}