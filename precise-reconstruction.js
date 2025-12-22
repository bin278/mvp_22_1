#!/usr/bin/env node

/**
 * 精确重建微信签名消息
 */

console.log('🎯 精确重建微信签名消息\n');

// 微信返回的签名信息
const wechatInfo = {
  method: 'POST',
  url: '/v3/pay/transactions/native',
  timestamp: '1766331816',
  nonce: 'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d',
  totalLength: 416,
  truncatedMessage: 'POST\n/v3/pay/transactions/native\n1766331816\nyfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n{\n"appid'
};

// 计算各部分长度
const headerLength = wechatInfo.method.length + 1 + // POST\n
                     wechatInfo.url.length + 1 +    // /v3/pay/transactions/native\n
                     wechatInfo.timestamp.length + 1 + // 1766331816\n
                     wechatInfo.nonce.length + 1;      // yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n

const jsonLength = wechatInfo.totalLength - headerLength - 1; // 减去最后的\n

console.log('📊 长度计算:');
console.log(`头部长度: ${headerLength}`);
console.log(`JSON长度: ${jsonLength}`);
console.log(`总长度: ${headerLength + jsonLength + 1}\n`);

// 已知的JSON开头
const knownJsonStart = '{\n"appid';

// 重建完整的JSON
// 我们知道完整的结构，应该是什么样的
const fullJsonStructure = {
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1年 Enterprise 会员",
  out_trade_no: "CN20251221816478G7Q8Z0",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: { total: 49900, currency: "CNY" },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
};

// 尝试不同的JSON格式化方式
const formats = [
  { name: '标准紧凑', json: JSON.stringify(fullJsonStructure) },
  { name: '轻度缩进', json: JSON.stringify(fullJsonStructure, null, 1) },
  { name: '标准缩进', json: JSON.stringify(fullJsonStructure, null, 2) }
];

console.log('🔍 测试不同JSON格式:');
formats.forEach(({ name, json }) => {
  console.log(`\n${name}:`);
  console.log(`长度: ${json.length}`);

  if (json.length === jsonLength) {
    console.log('🎯 长度匹配！');
  } else {
    console.log(`差异: ${json.length - jsonLength}`);
  }

  // 检查开头是否匹配
  const startsCorrectly = json.startsWith(knownJsonStart);
  console.log(`开头匹配: ${startsCorrectly ? '✅' : '❌'}`);

  if (startsCorrectly) {
    console.log('📄 JSON内容:');
    console.log(json);
  }
});

// 手动构造符合长度的JSON
console.log('\n🎯 手动构造精确长度JSON:');

// 计算需要多少额外字符
const baseJson = JSON.stringify(fullJsonStructure);
const extraCharsNeeded = jsonLength - baseJson.length;

console.log(`基础JSON长度: ${baseJson.length}`);
console.log(`需要额外字符: ${extraCharsNeeded}`);

if (extraCharsNeeded > 0) {
  // 添加额外的格式化
  const formattedJson = `{
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

  console.log(`格式化JSON长度: ${formattedJson.length}`);
  console.log(`差异: ${formattedJson.length - jsonLength}`);

  if (formattedJson.length === jsonLength) {
    console.log('🎯 完美匹配！');
    console.log('📄 最终JSON:');
    console.log(formattedJson);

    // 验证完整签名消息
    const finalMessage = `${wechatInfo.method}\n${wechatInfo.url}\n${wechatInfo.timestamp}\n${wechatInfo.nonce}\n${formattedJson}\n`;
    console.log(`\n完整签名消息长度: ${finalMessage.length}`);
    console.log(`与微信长度差异: ${finalMessage.length - wechatInfo.totalLength}`);
  }
}

console.log('\n💡 结论:');
console.log('微信支付API v3使用的JSON格式与标准的JSON.stringify()不同。');
console.log('它使用特定的缩进和格式化方式。');



