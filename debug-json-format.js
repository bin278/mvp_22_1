#!/usr/bin/env node

/**
 * 调试JSON格式化差异
 */

// 我们的请求体
const ourRequestBody = {
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1个月 Enterprise 会员",
  out_trade_no: "CN202512211409310SKLQ1",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: {
    total: 4990,
    currency: "CNY"
  },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"monthly\"}"
};

console.log('🔍 JSON格式化差异分析\n');

// 标准JSON.stringify (我们当前使用的)
const standardJson = JSON.stringify(ourRequestBody);
console.log('📝 标准JSON (当前使用):');
console.log(`"${standardJson}"`);
console.log(`长度: ${standardJson.length}\n`);

// 微信返回的似乎是格式化的JSON
// 尝试不同的格式化方式

// 带缩进的JSON
const indentedJson = JSON.stringify(ourRequestBody, null, 2);
console.log('📝 带缩进的JSON:');
console.log(`"${indentedJson}"`);
console.log(`长度: ${indentedJson.length}\n`);

// 不转义Unicode的JSON
const unescapedJson = JSON.stringify(ourRequestBody, null, 0);
console.log('📝 不转义Unicode的JSON:');
console.log(`"${unescapedJson}"`);
console.log(`长度: ${unescapedJson.length}\n`);

// 手动构建看起来像微信返回格式的JSON
const manualJson = `{
  "appid": "wxf8ef6eb93c045731",
  "mchid": "169478675",
  "description": "1个月 Enterprise 会员",
  "out_trade_no": "CN202512211409310SKLQ1",
  "notify_url": "http://localhost:3000/api/payment/cn/wechat/notify",
  "amount": {
    "total": 4990,
    "currency": "CNY"
  },
  "attach": "{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"monthly\\"}"
}`;

console.log('📝 手动构建的JSON (类似微信格式):');
console.log(`"${manualJson}"`);
console.log(`长度: ${manualJson.length}\n`);

// 计算微信返回的长度应该是多少
console.log('🔢 长度分析:');
console.log(`我们的消息长度: 403`);
console.log(`微信消息长度: 411`);
console.log(`差异: ${411 - 403} = 8 个字符\n`);

console.log('💡 可能的解决方案:');
console.log('1. 微信可能期望不同的JSON格式化');
console.log('2. 可能需要特定的字符编码');
console.log('3. 可能有隐藏字符或空格');

const testMethod = 'POST';
const testUrl = '/v3/pay/transactions/native';
const testTimestamp = 1766331140;
const testNonce = 'UlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM';

// 测试不同的JSON格式
const testBodies = [
  { name: '标准JSON', body: standardJson },
  { name: '带缩进JSON', body: indentedJson },
  { name: '手动JSON', body: manualJson }
];

testBodies.forEach(({ name, body }) => {
  const message = `${testMethod}\n${testUrl}\n${testTimestamp}\n${testNonce}\n${body}\n`;
  console.log(`\n🧪 ${name}:`);
  console.log(`消息长度: ${message.length}`);
  if (message.length === 411) {
    console.log('🎯 长度匹配！这可能是正确的格式');
  }
});



