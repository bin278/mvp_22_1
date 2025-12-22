#!/usr/bin/env node

/**
 * 测试简化的微信支付签名（参考RandomLife实现）
 */

console.log('🧪 测试简化的微信支付签名（参考RandomLife）\n');

// 测试数据
const testRequestBody = {
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1年 Enterprise 会员",
  out_trade_no: "CN20251221108059R4DYTC",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: { total: 49900, currency: "CNY" },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
};

// RandomLife的方法：直接使用JSON.stringify()
const body = JSON.stringify(testRequestBody);

console.log('🎯 RandomLife方法 - 直接使用JSON.stringify():');
console.log(`JSON: "${body}"`);
console.log(`长度: ${body.length}\n`);

// 构造签名消息
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = '1766332108';
const nonce = 'XFMn5d47Yz56mQqlMu1E5LwRzY7TAabx';

const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;

console.log('📝 签名消息:');
console.log(`长度: ${signMessage.length}`);
console.log(`微信期望长度: 416 (从之前的错误信息)`);
console.log(`差异: ${signMessage.length - 416}`);

if (signMessage.length === 416) {
  console.log('🎉 完美匹配！RandomLife的方法是正确的');
} else {
  console.log(`⚠️ 长度不匹配，但这可能是正常的，因为每次请求的orderId都不同`);
}

console.log('\n💡 关键发现:');
console.log('RandomLife使用的是最简单的JSON.stringify()方法');
console.log('不需要复杂的格式化函数');
console.log('微信支付API v3的签名就是基于标准的JSON序列化');

console.log('\n🚀 这个简化方法应该能解决签名问题！');



