#!/usr/bin/env node

/**
 * 调试微信支付签名生成过程
 */

const crypto = require('crypto');

// 从环境变量读取配置
const appId = process.env.WECHAT_PAY_APPID;
const mchId = process.env.WECHAT_PAY_MCHID;
const privateKeyStr = process.env.WECHAT_PAY_PRIVATE_KEY;
const apiV3Key = process.env.WECHAT_PAY_API_V3_KEY;
const serialNo = process.env.WECHAT_PAY_SERIAL_NO;

console.log('🔍 微信支付签名调试\n');

// 检查配置
console.log('📋 配置检查:');
console.log(`  WECHAT_PAY_APPID: ${appId ? '已设置' : '未设置'}`);
console.log(`  WECHAT_PAY_MCHID: ${mchId ? '已设置' : '未设置'}`);
console.log(`  WECHAT_PAY_PRIVATE_KEY: ${privateKeyStr ? '已设置' : '未设置'}`);
console.log(`  WECHAT_PAY_API_V3_KEY: ${apiV3Key ? '已设置' : '未设置'}`);
console.log(`  WECHAT_PAY_SERIAL_NO: ${serialNo ? '已设置' : '未设置'}\n`);

if (!appId || !mchId || !privateKeyStr || !apiV3Key || !serialNo) {
  console.log('❌ 配置不完整，无法继续调试');
  process.exit(1);
}

// 处理私钥格式
const privateKey = privateKeyStr.replace(/\\n/g, '\n');
console.log('🔑 私钥格式处理:');
console.log(`  原始长度: ${privateKeyStr.length}`);
console.log(`  处理后长度: ${privateKey.length}`);
console.log(`  包含换行符: ${privateKey.includes('\n')}\n`);

// 测试签名生成
function generateTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function generateNonceStr() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSignature(method, url, timestamp, nonceStr, body) {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
  console.log('📝 签名消息:');
  console.log(`  ${JSON.stringify(message)}`);

  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    const signature = sign.sign(privateKey, 'base64');
    console.log('✅ 签名生成成功');
    return signature;
  } catch (error) {
    console.log('❌ 签名生成失败:', error.message);
    return null;
  }
}

function generateAuthHeader(method, url, body) {
  const timestamp = generateTimestamp();
  const nonceStr = generateNonceStr();
  const signature = generateSignature(method, url, timestamp, nonceStr, body);

  if (!signature) return null;

  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonceStr}",signature="${signature}",timestamp="${timestamp}",serial_no="${serialNo}"`;
}

// 测试数据（模拟真实的支付请求）
const testMethod = 'POST';
const testUrl = '/v3/pay/transactions/native';
const testBody = JSON.stringify({
  appid: appId,
  mchid: mchId,
  description: 'Pro会员 - 月度',
  out_trade_no: 'TEST123456789',
  notify_url: 'https://example.com/notify',
  amount: {
    total: 49900,
    currency: 'CNY'
  },
  attach: JSON.stringify({
    userId: 'dev-user',
    planType: 'pro',
    billingCycle: 'monthly'
  })
});

console.log('🧪 测试签名生成:');
console.log(`  Method: ${testMethod}`);
console.log(`  URL: ${testUrl}`);
console.log(`  Body: ${testBody}\n`);

const authHeader = generateAuthHeader(testMethod, testUrl, testBody);

if (authHeader) {
  console.log('✅ Authorization 头生成成功:');
  console.log(`  ${authHeader}\n`);

  // 验证私钥格式
  console.log('🔐 私钥验证:');
  try {
    const testSign = crypto.createSign('RSA-SHA256');
    testSign.update('test');
    const testSignature = testSign.sign(privateKey, 'base64');
    console.log('✅ 私钥格式正确');
  } catch (error) {
    console.log('❌ 私钥格式错误:', error.message);
  }
} else {
  console.log('❌ Authorization 头生成失败');
}

// 验证时间戳
console.log('\n⏰ 时间戳验证:');
const timestamp = generateTimestamp();
console.log(`  当前时间戳: ${timestamp}`);
console.log(`  北京时间: ${new Date(timestamp * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
console.log(`  UTC时间: ${new Date(timestamp * 1000).toISOString()}`);



