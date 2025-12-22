#!/usr/bin/env node

/**
 * 环境变量调试脚本
 * 检查Node.js进程中的环境变量值
 */

console.log('🔍 Node.js环境变量调试\n');

// 微信支付环境变量
console.log('📱 微信支付环境变量:');
const wechatVars = [
  'WECHAT_PAY_APPID',
  'WECHAT_PAY_MCHID',
  'WECHAT_PAY_SERIAL_NO',
  'WECHAT_PAY_PRIVATE_KEY',
  'WECHAT_PAY_API_V3_KEY'
];

wechatVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // 对敏感信息进行遮罩
    let displayValue;
    if (varName.includes('PRIVATE_KEY')) {
      displayValue = value.length > 20 ? `[${value.length}字符，已设置]` : '[已设置]';
    } else if (varName.includes('API_V3_KEY')) {
      displayValue = `[${value.length}字符，已设置]`;
    } else if (varName.includes('SERIAL_NO')) {
      displayValue = value.length > 10 ? `[${value.length}字符，已设置]` : value;
    } else {
      displayValue = value;
    }
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
  }
});

console.log('\n💰 支付宝环境变量:');
const alipayVars = [
  'ALIPAY_APP_ID',
  'ALIPAY_PRIVATE_KEY',
  'ALIPAY_PUBLIC_KEY'
];

alipayVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') ? `[${value.length}字符，已设置]` : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
  }
});

console.log('\n☁️  CloudBase环境变量:');
const cloudbaseVars = [
  'NEXT_PUBLIC_WECHAT_CLOUDBASE_ID',
  'CLOUDBASE_SECRET_ID',
  'CLOUDBASE_SECRET_KEY',
  'TENCENT_CLOUD_ENV_ID',
  'TENCENT_CLOUD_SECRET_ID',
  'TENCENT_CLOUD_SECRET_KEY'
];

cloudbaseVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') ? `[${value.length}字符，已设置]` : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
  }
});

// 检查.env文件
console.log('\n📄 检查环境变量文件:');
const fs = require('fs');
const path = require('path');

const envFiles = ['.env', '.env.local', '.env.development'];

envFiles.forEach(fileName => {
  const filePath = path.join(process.cwd(), fileName);
  if (fs.existsSync(filePath)) {
    console.log(`  📄 ${fileName}: 存在`);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      console.log(`     包含 ${lines.length} 个环境变量`);

      // 检查微信支付变量
      const wechatInFile = lines.some(line => line.startsWith('WECHAT_PAY_APPID=') || line.startsWith('WECHAT_PAY_MCHID='));
      if (wechatInFile) {
        console.log(`     ✅ 包含微信支付配置`);
      } else {
        console.log(`     ❌ 未找到微信支付配置`);
      }
    } catch (error) {
      console.log(`     ❌ 读取失败: ${error.message}`);
    }
  } else {
    console.log(`  ❌ ${fileName}: 不存在`);
  }
});

console.log('\n💡 提示:');
console.log('  - 如果环境变量已配置但仍显示"未设置"，请重启开发服务器');
console.log('  - 确保.env文件在项目根目录');
console.log('  - 检查环境变量是否有语法错误（等号前后无空格）');
console.log('  - Next.js环境变量修改后需要重启服务器才能生效');




