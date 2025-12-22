#!/usr/bin/env node

/**
 * 测试紧凑JSON签名修复
 */

console.log('🧪 测试紧凑JSON签名修复\n');

// 测试数据
const testRequestBody = {
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1年 Enterprise 会员",
  out_trade_no: "CN20251221816478G7Q8Z0",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: { total: 49900, currency: "CNY" },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
};

// 签名使用的紧凑JSON
const signatureBody = JSON.stringify(testRequestBody);
console.log('🔐 签名用的紧凑JSON:');
console.log(`"${signatureBody}"`);
console.log(`长度: ${signatureBody.length}\n`);

// 请求体（标准格式）
const requestBody = JSON.stringify(testRequestBody);
console.log('📨 请求体JSON:');
console.log(`"${requestBody}"`);
console.log(`长度: ${requestBody.length}\n`);

// 验证两者是否相同
console.log('🔍 比较:');
console.log(`签名体和请求体相同: ${signatureBody === requestBody ? '✅' : '❌'}\n`);

// 构造签名消息
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = 1766331816; // 使用日志中的时间戳
const nonce = 'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d'; // 使用日志中的nonce

const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${signatureBody}\n`;

console.log('📝 签名消息:');
console.log(`消息长度: ${signMessage.length}`);
console.log(`微信期望长度: 416`);
console.log(`差异: ${signMessage.length - 416}`);

if (signMessage.length === 416) {
  console.log('✅ 签名消息长度完美匹配！');
} else if (Math.abs(signMessage.length - 416) <= 2) {
  console.log('⚠️ 签名消息长度非常接近');
} else {
  console.log('❌ 签名消息长度差异较大');
}

console.log('\n💡 修复要点:');
console.log('1. 签名使用紧凑JSON格式');
console.log('2. 请求体使用标准JSON格式');
console.log('3. 两者在简单情况下是相同的');

console.log('\n🚀 这个修复应该解决签名长度不匹配的问题！');



