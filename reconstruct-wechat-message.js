#!/usr/bin/env node

/**
 * 重建微信的完整签名消息
 */

console.log('🔍 重建微信的完整签名消息\n');

// 从错误日志中提取的信息
const truncatedSignMessage = 'POST\n' +
  '/v3/pay/transactions/native\n' +
  '1766331816\n' +
  'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n' +
  '{\n' +
  '"appid';

console.log('📄 微信返回的截断签名消息:');
console.log(`"${truncatedSignMessage}"`);
console.log(`长度: ${truncatedSignMessage.length}\n`);

// 已知信息
const totalLength = 416; // sign_message_length
const truncatedLength = truncatedSignMessage.length; // 89
const remainingLength = totalLength - truncatedLength; // 327

console.log('📊 长度分析:');
console.log(`总长度: ${totalLength}`);
console.log(`截断长度: ${truncatedLength}`);
console.log(`剩余长度: ${remainingLength}\n`);

// 截断位置："appid 后面
// 完整的JSON应该是什么样的？

// 基于我们的请求体，重建可能的完整JSON
const possibleJson = `{
"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1年 Enterprise 会员",
"out_trade_no":"CN20251221816478G7Q8Z0",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":49900,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"yearly\\"}"
}`;

console.log('🔄 重建的完整签名消息:');
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = '1766331816';
const nonce = 'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d';

const reconstructedMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${possibleJson}\n`;

console.log(`"${reconstructedMessage}"`);
console.log(`长度: ${reconstructedMessage.length}`);
console.log(`与微信长度差异: ${reconstructedMessage.length - totalLength}\n`);

// 检查truncated部分是否匹配
const reconstructedTruncated = reconstructedMessage.substring(0, truncatedLength);
console.log('🔍 截断部分比较:');
console.log('微信截断:', `"${truncatedSignMessage}"`);
console.log('重建截断:', `"${reconstructedTruncated}"`);
console.log('是否匹配:', truncatedSignMessage === reconstructedTruncated ? '✅' : '❌');

// 尝试不同的JSON格式
const altJson = `{
"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1年 Enterprise 会员",
"out_trade_no":"CN20251221816478G7Q8Z0",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":49900,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"yearly\\"}"
}`;

const altMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${altJson}\n`;
console.log(`\n🔄 替代版本长度: ${altMessage.length}`);
console.log(`差异: ${altMessage.length - totalLength}`);

// 结论
console.log('\n💡 结论:');
console.log('微信使用的JSON格式与我们的标准JSON.stringify()结果不同。');
console.log('需要找出微信期望的确切JSON格式。');

console.log('\n🚀 可能的解决方案:');
console.log('1. 使用与微信服务器相同的JSON序列化逻辑');
console.log('2. 检查是否有特殊的字符编码或格式要求');
console.log('3. 尝试使用不同的JSON库或序列化选项');

console.log('\n⚠️ 建议:');
console.log('考虑查看微信支付官方SDK的实现，或者联系微信支付技术支持获取确切格式要求。');



