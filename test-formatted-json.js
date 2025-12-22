#!/usr/bin/env node

/**
 * 测试格式化JSON签名匹配
 */

console.log('🧪 测试格式化JSON签名匹配\n');

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

// 测试不同的JSON格式化方式
const compactJson = JSON.stringify(testRequestBody);
const formattedJson1 = JSON.stringify(testRequestBody, null, 1);
const formattedJson2 = JSON.stringify(testRequestBody, null, 2);

console.log('📄 不同JSON格式:');
console.log('紧凑格式:');
console.log(`"${compactJson}"`);
console.log(`长度: ${compactJson.length}\n`);

console.log('轻度格式化 (null, 1):');
console.log(`"${formattedJson1}"`);
console.log(`长度: ${formattedJson1.length}\n`);

console.log('标准格式化 (null, 2):');
console.log(`"${formattedJson2}"`);
console.log(`长度: ${formattedJson2.length}\n`);

// 构造签名消息并测试长度
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = 1766331816;
const nonce = 'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d';

function testSignatureLength(jsonBody, label) {
  const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${jsonBody}\n`;
  const length = signMessage.length;
  const diff = 416 - length;

  console.log(`${label}:`);
  console.log(`  长度: ${length}`);
  console.log(`  与微信期望差异: ${diff}`);

  if (length === 416) {
    console.log('  🎯 完美匹配！');
  } else if (Math.abs(diff) <= 2) {
    console.log('  ⚠️  非常接近');
  } else {
    console.log('  ❌ 差异较大');
  }
  console.log();
}

testSignatureLength(compactJson, '紧凑JSON');
testSignatureLength(formattedJson1, '轻度格式化');
testSignatureLength(formattedJson2, '标准格式化');

console.log('💡 分析:');
console.log('从微信的truncated_sign_message看，期望的JSON格式应该以 {\\n"appid 开头');
console.log('这意味着微信使用的是某种格式化的JSON');

// 手动构造符合微信格式的JSON
const wechatStyleJson = `{
 "appid": "wxf8ef6eb93c045731",
 "mchid": "169478675",
 "description": "1年 Enterprise 会员",
 "out_trade_no": "CN20251221816478G7Q8Z0",
 "notify_url": "http://localhost:3000/api/payment/cn/wechat/notify",
 "amount": {
  "total": 49900,
  "currency": "CNY"
 },
 "attach": "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
}`;

console.log('\n🎯 手动构造的微信风格JSON:');
console.log(`"${wechatStyleJson}"`);
console.log(`长度: ${wechatStyleJson.length}`);

testSignatureLength(wechatStyleJson, '微信风格JSON');

console.log('\n🚀 建议使用轻度格式化的JSON (null, 1)，这最有可能匹配微信的期望格式。');



