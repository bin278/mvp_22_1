#!/usr/bin/env node

/**
 * 支付环境变量检查脚本
 * 检查微信支付和支付宝的环境变量配置
 */

console.log('🔍 检查支付环境变量配置...\n');

// 检查微信支付配置
console.log('📱 微信支付配置检查:');
const wechatConfig = {
  'WECHAT_PAY_APPID': process.env.WECHAT_PAY_APPID,
  'WECHAT_PAY_MCHID': process.env.WECHAT_PAY_MCHID,
  'WECHAT_PAY_SERIAL_NO': process.env.WECHAT_PAY_SERIAL_NO,
  'WECHAT_PAY_PRIVATE_KEY': process.env.WECHAT_PAY_PRIVATE_KEY,
  'WECHAT_PAY_API_V3_KEY': process.env.WECHAT_PAY_API_V3_KEY,
};

let wechatComplete = true;
Object.entries(wechatConfig).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (key.includes('PRIVATE_KEY') ? '[已设置]' : value.substring(0, 10) + '...') : '未设置';
  console.log(`  ${status} ${key}: ${displayValue}`);
  if (!value) wechatComplete = false;
});

console.log(wechatComplete ? '✅ 微信支付配置完整\n' : '❌ 微信支付配置不完整\n');

// 检查支付宝配置
console.log('💰 支付宝配置检查:');
const alipayConfig = {
  'ALIPAY_APP_ID': process.env.ALIPAY_APP_ID,
  'ALIPAY_PRIVATE_KEY': process.env.ALIPAY_PRIVATE_KEY,
  'ALIPAY_PUBLIC_KEY': process.env.ALIPAY_PUBLIC_KEY,
};

let alipayComplete = true;
Object.entries(alipayConfig).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (key.includes('KEY') ? '[已设置]' : value) : '未设置';
  console.log(`  ${status} ${key}: ${displayValue}`);
  if (!value) alipayComplete = false;
});

console.log(alipayComplete ? '✅ 支付宝配置完整\n' : '❌ 支付宝配置不完整\n');

// 检查必需的CloudBase配置
console.log('☁️  CloudBase配置检查:');
const cloudbaseConfig = {
  'NEXT_PUBLIC_WECHAT_CLOUDBASE_ID': process.env.NEXT_PUBLIC_WECHAT_CLOUDBASE_ID,
  'CLOUDBASE_SECRET_ID': process.env.CLOUDBASE_SECRET_ID,
  'CLOUDBASE_SECRET_KEY': process.env.CLOUDBASE_SECRET_KEY,
};

let cloudbaseComplete = true;
Object.entries(cloudbaseConfig).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (key.includes('SECRET') ? '[已设置]' : value) : '未设置';
  console.log(`  ${status} ${key}: ${displayValue}`);
  if (!value) cloudbaseComplete = false;
});

console.log(cloudbaseComplete ? '✅ CloudBase配置完整\n' : '❌ CloudBase配置不完整\n');

// 总结
console.log('📋 配置总结:');
console.log(`  微信支付: ${wechatComplete ? '✅ 可用' : '❌ 未配置'}`);
console.log(`  支付宝: ${alipayComplete ? '✅ 可用' : '❌ 未配置'}`);
console.log(`  CloudBase: ${cloudbaseComplete ? '✅ 可用' : '❌ 未配置'}`);

if (!wechatComplete && !alipayComplete) {
  console.log('\n⚠️  警告: 未配置任何支付方式，用户将无法购买订阅');
  console.log('💡 建议: 配置至少一种支付方式，或设置 PAYMENT_TEST_MODE=true 进行测试');
} else {
  console.log('\n🎉 支付功能已配置！可以开始接受用户支付了！');
}

// 检查测试模式
const testMode = process.env.PAYMENT_TEST_MODE === 'true';
console.log(`\n🧪 测试模式: ${testMode ? '✅ 已开启 (所有支付0.01元)' : '❌ 已关闭'}`);
if (testMode) {
  console.log('💡 测试模式下，所有支付金额将改为0.01元，方便测试流程');
}

console.log('\n📖 详细配置请参考: ENV_CONFIG_EXAMPLE.md');




