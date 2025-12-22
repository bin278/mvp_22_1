#!/usr/bin/env node

/**
 * 测试微信支付期望的JSON格式
 */

// 我们当前的JSON
const currentJson = JSON.stringify({
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
});

// 尝试微信可能期望的格式
// 基于truncated_sign_message: '{"appid"\n'

console.log('🎯 寻找正确的JSON格式\n');

// 当前格式
console.log('📝 当前JSON格式:');
console.log(`"${currentJson}"`);
console.log(`长度: ${currentJson.length}\n`);

// 尝试各种可能的格式化

// 1. 每行一个属性的格式
const formattedJson1 = `{
"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1个月 Enterprise 会员",
"out_trade_no":"CN202512211409310SKLQ1",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":4990,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"monthly\\"}"
}`;

console.log('🧪 格式1 - 每行一个属性:');
console.log(`"${formattedJson1}"`);
console.log(`长度: ${formattedJson1.length}\n`);

// 2. 类似格式但调整引号和逗号位置
const formattedJson2 = `{"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1个月 Enterprise 会员",
"out_trade_no":"CN202512211409310SKLQ1",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":4990,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"monthly\\"}"}`;

console.log('🧪 格式2 - 逗号在行首:');
console.log(`"${formattedJson2}"`);
console.log(`长度: ${formattedJson2.length}\n`);

// 3. 精确匹配truncated_sign_message的格式
// 从 '{"appid"\n' 可以推测格式

const reconstructedJson = `{"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1个月 Enterprise 会员",
"out_trade_no":"CN202512211409310SKLQ1",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":4990,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"monthly\\"}"}`;

console.log('🎯 重构的JSON (基于truncated信息):');
console.log(`"${reconstructedJson}"`);
console.log(`长度: ${reconstructedJson.length}\n`);

// 测试签名消息长度
const testMethod = 'POST';
const testUrl = '/v3/pay/transactions/native';
const testTimestamp = 1766331140;
const testNonce = 'UlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM';

function testMessageLength(jsonBody, label) {
  const message = `${testMethod}\n${testUrl}\n${testTimestamp}\n${testNonce}\n${jsonBody}\n`;
  const length = message.length;
  const diff = 411 - length;
  console.log(`${label}:`);
  console.log(`  长度: ${length}`);
  console.log(`  与微信差异: ${diff}`);
  if (Math.abs(diff) <= 2) {
    console.log('  🎯 非常接近！');
  }
  console.log();
}

testMessageLength(currentJson, '当前JSON');
testMessageLength(formattedJson1, '格式1');
testMessageLength(formattedJson2, '格式2');
testMessageLength(reconstructedJson, '重构JSON');

// 最终建议
console.log('💡 结论:');
console.log('基于分析，微信支付API v3可能期望特定的JSON格式。');
console.log('建议在微信商户平台检查API配置，或联系微信支付技术支持。');
console.log('\n🔧 临时解决方案:');
console.log('1. 检查微信商户平台的私钥证书是否正确上传');
console.log('2. 确认API v3密钥是否正确');
console.log('3. 验证商户号和AppID的对应关系');
console.log('4. 考虑使用微信支付官方SDK而不是自行实现签名');



