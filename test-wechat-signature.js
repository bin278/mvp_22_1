#!/usr/bin/env node

/**
 * 测试修复后的微信支付签名生成
 */

const crypto = require('crypto');

// 模拟微信支付适配器中的签名生成逻辑
function formatPrivateKey(key) {
  if (!key) return "";

  // 移除包围的引号（如果有）
  let processedKey = key;
  if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
    processedKey = processedKey.slice(1, -1);
  }

  // 处理转义的换行符
  let formattedKey = processedKey.replace(/\\n/g, "\n");

  // 检测原始格式类型
  const isPKCS1 = formattedKey.includes("RSA PRIVATE KEY");
  const hasPKCS8Header = formattedKey.includes("BEGIN PRIVATE KEY");

  // 如果已经有正确的 PEM 格式，直接返回（只需处理换行）
  if (hasPKCS8Header || isPKCS1) {
    return formattedKey.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  // 移除所有空白字符（纯 base64 内容）
  const cleanKey = formattedKey.replace(/\s/g, "");

  // 每 64 个字符换行
  const lines = [];
  for (let i = 0; i < cleanKey.length; i += 64) {
    lines.push(cleanKey.substring(i, i + 64));
  }

  // 默认使用 PKCS#8 格式
  const header = "-----BEGIN PRIVATE KEY-----";
  const footer = "-----END PRIVATE KEY-----";

  return `${header}\n${lines.join("\n")}\n${footer}`;
}

function generateSignature(privateKey, method, url, timestamp, nonceStr, body) {
  const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;

  console.log('🔐 签名消息 (完整):');
  console.log(`"${message}"`);
  console.log(`长度: ${message.length}`);

  try {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(message, 'utf8');
    const signature = sign.sign(privateKey, "base64");

    console.log('✅ 签名生成成功:');
    console.log(`${signature}`);
    console.log(`长度: ${signature.length}`);

    return signature;
  } catch (error) {
    console.error('❌ 签名生成失败:', error.message);
    return null;
  }
}

// 测试数据 - 模拟实际环境变量
const testPrivateKey = process.env.WECHAT_PAY_PRIVATE_KEY;
const testAppId = process.env.WECHAT_PAY_APPID;
const testMchId = process.env.WECHAT_PAY_MCHID;

if (!testPrivateKey || !testAppId || !testMchId) {
  console.log('❌ 环境变量未设置，无法测试');
  console.log('请确保设置了 WECHAT_PAY_PRIVATE_KEY, WECHAT_PAY_APPID, WECHAT_PAY_MCHID');
  process.exit(1);
}

console.log('🧪 测试修复后的微信支付签名生成\n');

// 处理私钥
console.log('🔑 处理私钥...');
const processedPrivateKey = formatPrivateKey(testPrivateKey);
console.log(`原始长度: ${testPrivateKey.length}`);
console.log(`处理后长度: ${processedPrivateKey.length}`);
console.log(`格式正确: ${processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----') && processedPrivateKey.includes('-----END PRIVATE KEY-----')}`);

// 测试签名生成
console.log('\n📝 测试签名生成...');
const testMethod = 'POST';
const testUrl = '/v3/pay/transactions/native';
const testTimestamp = Math.floor(Date.now() / 1000);
const testNonceStr = crypto.randomBytes(16).toString('hex');
const testBody = JSON.stringify({
  appid: testAppId,
  mchid: testMchId,
  description: 'Test Order',
  out_trade_no: 'TEST' + Date.now(),
  notify_url: 'http://localhost:3000/notify',
  amount: { total: 100, currency: 'CNY' },
  attach: JSON.stringify({ userId: 'test', planType: 'pro', billingCycle: 'monthly' })
});

console.log(`Method: ${testMethod}`);
console.log(`URL: ${testUrl}`);
console.log(`Timestamp: ${testTimestamp}`);
console.log(`Nonce: ${testNonceStr}`);
console.log(`Body: ${testBody}`);

const signature = generateSignature(processedPrivateKey, testMethod, testUrl, testTimestamp, testNonceStr, testBody);

if (signature) {
  console.log('\n✅ 签名生成测试通过！');
  console.log('\n💡 现在可以重启服务器测试实际支付功能了');
} else {
  console.log('\n❌ 签名生成测试失败');
}



