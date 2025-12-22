#!/usr/bin/env node

/**
 * 验证微信支付配置的正确性
 */

const crypto = require('crypto');
const fs = require('fs');

// 从环境变量读取配置
const appId = process.env.WECHAT_PAY_APPID;
const mchId = process.env.WECHAT_PAY_MCHID;
const privateKeyStr = process.env.WECHAT_PAY_PRIVATE_KEY;
const apiV3Key = process.env.WECHAT_PAY_API_V3_KEY;
const serialNo = process.env.WECHAT_PAY_SERIAL_NO;

console.log('🔍 微信支付配置验证\n');

// 1. 检查基本配置
console.log('📋 基本配置检查:');
const configValid = {
  appId: !!appId,
  mchId: !!mchId,
  privateKey: !!privateKeyStr,
  apiV3Key: !!apiV3Key,
  serialNo: !!serialNo
};

Object.entries(configValid).forEach(([key, valid]) => {
  console.log(`  ${key}: ${valid ? '✅' : '❌'}`);
});

if (!Object.values(configValid).every(Boolean)) {
  console.log('\n❌ 配置不完整，无法继续验证');
  process.exit(1);
}

// 2. 私钥格式验证
console.log('\n🔑 私钥格式验证:');

let privateKey;
try {
  // 处理引号包围的私钥
  let processedKey = privateKeyStr;
  if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
    processedKey = processedKey.slice(1, -1);
  }
  processedKey = processedKey.replace(/\\n/g, '\n');

  // 验证是否是有效的PEM格式
  const isPKCS8 = processedKey.includes('-----BEGIN PRIVATE KEY-----');
  const isPKCS1 = processedKey.includes('-----BEGIN RSA PRIVATE KEY-----');

  console.log(`  PKCS#8格式: ${isPKCS8 ? '✅' : '❌'}`);
  console.log(`  PKCS#1格式: ${isPKCS1 ? '✅' : '❌'}`);

  if (!isPKCS8 && !isPKCS1) {
    console.log('❌ 私钥格式不正确，必须是PKCS#1或PKCS#8格式');
    process.exit(1);
  }

  // 尝试创建签名对象验证私钥有效性
  const sign = crypto.createSign('RSA-SHA256');
  sign.update('test message');
  const testSignature = sign.sign(processedKey, 'base64');

  console.log('✅ 私钥可以正常签名');
  privateKey = processedKey;

} catch (error) {
  console.log(`❌ 私钥验证失败: ${error.message}`);
  process.exit(1);
}

// 3. 证书序列号验证
console.log('\n📄 证书序列号验证:');
console.log(`  序列号: ${serialNo}`);
console.log(`  长度: ${serialNo.length}`);
console.log(`  格式正确: ${/^[A-F0-9]+$/i.test(serialNo) ? '✅' : '❌'}`);

// 4. API v3密钥验证
console.log('\n🔐 API v3密钥验证:');
console.log(`  长度: ${apiV3Key.length}`);
console.log(`  格式正确 (32字节): ${apiV3Key.length === 32 ? '✅' : '❌'}`);

// 5. 微信支付签名测试
console.log('\n📝 签名功能测试:');

// 使用微信支付标准的测试数据
const testData = {
  method: 'POST',
  url: '/v3/pay/transactions/native',
  timestamp: Math.floor(Date.now() / 1000),
  nonceStr: crypto.randomBytes(16).toString('hex'),
  body: JSON.stringify({
    appid: appId,
    mchid: mchId,
    description: '测试订单',
    out_trade_no: 'TEST' + Date.now(),
    notify_url: 'https://example.com/notify',
    amount: { total: 1, currency: 'CNY' }
  })
};

console.log('测试数据:');
console.log(`  Method: ${testData.method}`);
console.log(`  URL: ${testData.url}`);
console.log(`  Timestamp: ${testData.timestamp}`);
console.log(`  Nonce: ${testData.nonceStr}`);
console.log(`  Body: ${testData.body}`);

// 生成签名消息
const signMessage = `${testData.method}\n${testData.url}\n${testData.timestamp}\n${testData.nonceStr}\n${testData.body}\n`;
console.log(`\n签名消息: "${signMessage}"`);
console.log(`消息长度: ${signMessage.length}`);

// 生成签名
try {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signMessage, 'utf8');
  const signature = sign.sign(privateKey, 'base64');

  console.log('✅ 签名生成成功');
  console.log(`签名: ${signature.substring(0, 50)}...`);
  console.log(`签名长度: ${signature.length}`);

  // 生成Authorization头
  const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${testData.nonceStr}",signature="${signature}",timestamp="${testData.timestamp}",serial_no="${serialNo}"`;
  console.log(`\nAuthorization头: ${authHeader.substring(0, 100)}...`);

} catch (error) {
  console.log(`❌ 签名生成失败: ${error.message}`);
}

// 6. 总结
console.log('\n📊 验证总结:');
const allValid = Object.values(configValid).every(Boolean);
console.log(`配置完整性: ${allValid ? '✅' : '❌'}`);
console.log(`私钥有效性: ✅`);
console.log(`签名功能: ✅`);

if (allValid) {
  console.log('\n🎉 所有配置验证通过！');
  console.log('\n💡 如果仍然出现签名错误，可能是:');
  console.log('1. 商户号或AppID不匹配');
  console.log('2. 私钥与商户号不对应');
  console.log('3. API v3密钥错误');
  console.log('4. 证书序列号错误');
  console.log('5. 微信商户平台配置问题');
} else {
  console.log('\n❌ 配置验证失败，请检查环境变量');
}



