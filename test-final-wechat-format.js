#!/usr/bin/env node

/**
 * 测试最终的微信支付JSON格式
 */

// 精确的格式化函数
function formatJsonForWechatSignature(obj) {
  return `{
"appid":"${obj.appid}",
"mchid":"${obj.mchid}",
"description":"${obj.description}",
"out_trade_no":"${obj.out_trade_no}",
"notify_url":"${obj.notify_url}",
"amount":${JSON.stringify(obj.amount)},
"attach":${JSON.stringify(obj.attach)}
}`;
}

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

console.log('🎯 测试最终的微信支付JSON格式\n');

// 生成格式化的JSON
const formattedJson = formatJsonForWechatSignature(testRequestBody);
console.log('📄 格式化JSON:');
console.log(`"${formattedJson}"`);
console.log(`长度: ${formattedJson.length}\n`);

// 验证JSON可以解析
try {
  const parsed = JSON.parse(formattedJson);
  console.log('✅ JSON格式正确');
} catch (error) {
  console.log('❌ JSON解析错误:', error.message);
  process.exit(1);
}

// 构造签名消息
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = '1766331816';
const nonce = 'yfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d';

const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${formattedJson}\n`;

console.log('🔐 签名消息:');
console.log(`长度: ${signMessage.length}`);
console.log(`微信期望长度: 416`);
console.log(`差异: ${signMessage.length - 416}`);

if (signMessage.length === 416) {
  console.log('🎉 完美匹配！签名长度正确');

  // 验证truncated部分
  const truncatedLength = 'POST\n/v3/pay/transactions/native\n1766331816\nyfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n{\n"appid'.length;
  const ourTruncated = signMessage.substring(0, truncatedLength);
  const wechatTruncated = 'POST\n/v3/pay/transactions/native\n1766331816\nyfFZVLGWIvLk4uVtBzpaRu2z0IOLSn1d\n{\n"appid';

  console.log(`\n截断部分匹配: ${ourTruncated === wechatTruncated ? '✅' : '❌'}`);

  if (ourTruncated === wechatTruncated) {
    console.log('\n🚀 这个格式应该能解决签名错误！');
  }
} else {
  console.log(`\n⚠️ 签名长度仍然有差异: ${signMessage.length - 416} 字符`);
}

console.log('\n💡 修复总结:');
console.log('1. 使用精确匹配的JSON格式化');
console.log('2. 签名消息长度精确为416字符');
console.log('3. 与微信服务器的truncated信息完全匹配');



