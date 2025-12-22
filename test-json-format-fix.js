#!/usr/bin/env node

/**
 * 测试JSON格式化修复
 */

// 精确模拟微信支付适配器中的formatJsonForWechat方法
function formatJsonForWechat(obj) {
  const lines = [];
  lines.push('{');

  // 必须按照特定顺序格式化每个属性，每行一个
  lines.push(`"appid":"${obj.appid}",`);
  lines.push(`"mchid":"${obj.mchid}",`);
  lines.push(`"description":"${obj.description}",`);
  lines.push(`"out_trade_no":"${obj.out_trade_no}",`);
  lines.push(`"notify_url":"${obj.notify_url}",`);
  lines.push(`"amount":${JSON.stringify(obj.amount)},`);
  lines.push(`"attach":"${obj.attach}"`);

  lines.push('}');
  return lines.join('\n');
}

// 测试数据
const testRequestBody = {
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

console.log('🧪 测试JSON格式化修复\n');

// 原格式
const originalJson = JSON.stringify(testRequestBody);
console.log('📝 原始JSON:');
console.log(`"${originalJson}"`);
console.log(`长度: ${originalJson.length}\n`);

// 新格式
const formattedJson = formatJsonForWechat(testRequestBody);
console.log('🎯 微信格式JSON:');
console.log(`"${formattedJson}"`);
console.log(`长度: ${formattedJson.length}\n`);

// 验证签名消息长度
const testMethod = 'POST';
const testUrl = '/v3/pay/transactions/native';
const testTimestamp = 1766331140;
const testNonce = 'UlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM';

const originalMessage = `${testMethod}\n${testUrl}\n${testTimestamp}\n${testNonce}\n${originalJson}\n`;
const formattedMessage = `${testMethod}\n${testUrl}\n${testTimestamp}\n${testNonce}\n${formattedJson}\n`;

console.log('📊 签名消息长度对比:');
console.log(`原始消息长度: ${originalMessage.length}`);
console.log(`格式化消息长度: ${formattedMessage.length}`);
console.log(`微信期望长度: 411`);
console.log(`原始差异: ${411 - originalMessage.length}`);
console.log(`格式化差异: ${411 - formattedMessage.length}`);

if (formattedMessage.length === 411) {
  console.log('\n✅ 完美匹配！这应该能解决签名错误问题。');
} else {
  console.log(`\n⚠️ 仍然有 ${Math.abs(411 - formattedMessage.length)} 个字符的差异`);
}

// 显示格式化后的JSON结构
console.log('\n📋 格式化JSON结构:');
const lines = formattedJson.split('\n');
lines.forEach((line, index) => {
  console.log(`${index + 1}: ${line}`);
});
