#!/usr/bin/env node

/**
 * 使用实际请求数据调试微信支付签名
 */

const crypto = require('crypto');

// 从环境变量读取配置
const appId = process.env.WECHAT_PAY_APPID;
const mchId = process.env.WECHAT_PAY_MCHID;
const privateKeyStr = process.env.WECHAT_PAY_PRIVATE_KEY;
const apiV3Key = process.env.WECHAT_PAY_API_V3_KEY;
const serialNo = process.env.WECHAT_PAY_SERIAL_NO;

console.log('🔍 微信支付实际签名调试\n');

// 检查配置
console.log('📋 配置检查:');
console.log(`  WECHAT_PAY_APPID: ${appId ? '已设置' : '❌ 未设置'}`);
console.log(`  WECHAT_PAY_MCHID: ${mchId ? '已设置' : '❌ 未设置'}`);
console.log(`  WECHAT_PAY_PRIVATE_KEY: ${privateKeyStr ? '已设置' : '❌ 未设置'}`);
console.log(`  WECHAT_PAY_API_V3_KEY: ${apiV3Key ? '已设置' : '❌ 未设置'}`);
console.log(`  WECHAT_PAY_SERIAL_NO: ${serialNo ? '已设置' : '❌ 未设置'}\n`);

if (!appId || !mchId || !privateKeyStr || !apiV3Key || !serialNo) {
  console.log('❌ 配置不完整，无法继续调试');
  process.exit(1);
}

// 处理私钥格式 - 移除引号和处理换行符
let privateKey = privateKeyStr;
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, '\n');

console.log('🔑 私钥处理:');
console.log(`  原始长度: ${privateKeyStr.length}`);
console.log(`  处理后长度: ${privateKey.length}`);
console.log(`  以-----BEGIN开头: ${privateKey.startsWith('-----BEGIN')}`);
console.log(`  以-----END结尾: ${privateKey.endsWith('-----END')}\n`);

// 模拟实际请求的参数（从错误日志中提取）
const actualParams = {
  method: 'POST',
  url: '/v3/pay/transactions/native',
  timestamp: 1766330890,  // 从错误日志中提取
  nonceStr: 'Iqp6boZkWfRNIJLQtHowXrsERWqBxnRr',  // 从错误日志中提取
  body: JSON.stringify({
    appid: appId,
    mchid: mchId,
    description: 'Enterprise会员 - 年度',
    out_trade_no: 'CN20241221192930xxx', // 模拟订单号
    notify_url: 'http://localhost:3000/api/payment/cn/wechat/notify',
    amount: {
      total: 49900,  // 499元 = 49900分
      currency: 'CNY'
    },
    attach: JSON.stringify({
      userId: 'dev-user',
      planType: 'enterprise',
      billingCycle: 'yearly'
    })
  })
};

console.log('📝 实际请求参数:');
console.log(`  Method: ${actualParams.method}`);
console.log(`  URL: ${actualParams.url}`);
console.log(`  Timestamp: ${actualParams.timestamp}`);
console.log(`  Nonce: ${actualParams.nonceStr}`);
console.log(`  Body: ${actualParams.body}\n`);

// 生成签名消息
const signMessage = `${actualParams.method}\n${actualParams.url}\n${actualParams.timestamp}\n${actualParams.nonceStr}\n${actualParams.body}\n`;

console.log('🔐 签名消息 (完整):');
console.log(`  "${signMessage}"`);
console.log(`  长度: ${signMessage.length}\n`);

// 生成签名
try {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signMessage, 'utf8');
  const signature = sign.sign(privateKey, 'base64');

  console.log('✅ 签名生成成功:');
  console.log(`  ${signature}`);
  console.log(`  长度: ${signature.length}\n`);

  // 生成Authorization头
  const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${actualParams.nonceStr}",signature="${signature}",timestamp="${actualParams.timestamp}",serial_no="${serialNo}"`;

  console.log('🔒 Authorization 头:');
  console.log(`  ${authHeader}\n`);

  // 验证私钥
  console.log('🔍 私钥验证:');
  try {
    const testSign = crypto.createSign('RSA-SHA256');
    testSign.update('test message', 'utf8');
    const testSig = testSign.sign(privateKey, 'base64');
    console.log('✅ 私钥格式正确，可以正常签名');
  } catch (error) {
    console.log('❌ 私钥格式错误:', error.message);
  }

  // 检查时间戳
  console.log('\n⏰ 时间戳检查:');
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.abs(now - actualParams.timestamp);
  console.log(`  当前时间戳: ${now}`);
  console.log(`  请求时间戳: ${actualParams.timestamp}`);
  console.log(`  时间差: ${diff}秒`);

  if (diff > 300) { // 5分钟
    console.log('⚠️  时间戳差异较大，可能导致签名验证失败');
  } else {
    console.log('✅ 时间戳在合理范围内');
  }

} catch (error) {
  console.log('❌ 签名生成失败:', error.message);
  console.log('🔍 错误详情:', error);
}

// 验证JSON格式
console.log('\n📄 JSON格式验证:');
try {
  const parsed = JSON.parse(actualParams.body);
  console.log('✅ 请求体JSON格式正确');
  console.log('  appid:', parsed.appid);
  console.log('  mchid:', parsed.mchid);
  console.log('  amount.total:', parsed.amount.total);
} catch (error) {
  console.log('❌ 请求体JSON格式错误:', error.message);
}



