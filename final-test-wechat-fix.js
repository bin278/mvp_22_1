#!/usr/bin/env node

/**
 * 最终测试微信支付签名修复
 */

// 测试数据 - 与实际错误日志完全一致
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

// 修复后的JSON格式
const fixedJson = `{
"appid":"${testRequestBody.appid}",
"mchid":"${testRequestBody.mchid}",
"description":"${testRequestBody.description}",
"out_trade_no":"${testRequestBody.out_trade_no}",
"notify_url":"${testRequestBody.notify_url}",
"amount":${JSON.stringify(testRequestBody.amount)},
"attach":"${testRequestBody.attach}"
}`;

console.log('🎯 最终测试微信支付签名修复\n');

// 显示修复后的JSON
console.log('📄 修复后的JSON格式:');
console.log(fixedJson);
console.log(`长度: ${fixedJson.length}\n`);

// 构造签名消息
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = 1766331140;
const nonce = 'UlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM';

const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${fixedJson}\n`;

console.log('🔐 签名消息:');
console.log(`"${signMessage}"`);
console.log(`消息长度: ${signMessage.length}`);
console.log(`微信期望长度: 411`);
console.log(`差异: ${signMessage.length - 411}`);

if (signMessage.length === 411) {
  console.log('\n✅ 完美匹配！签名长度问题已解决');
  console.log('\n🚀 现在可以重启服务器测试实际支付功能了');
} else {
  console.log(`\n❌ 仍然有 ${Math.abs(signMessage.length - 411)} 个字符的差异`);
}

// 显示JSON结构
console.log('\n📋 JSON结构验证:');
const lines = fixedJson.split('\n');
lines.forEach((line, index) => {
  console.log(`${String(index + 1).padStart(2)}: ${line}`);
});

console.log('\n💡 如果仍有签名错误，检查以下配置:');
console.log('1. 私钥是否与商户号对应');
console.log('2. API v3密钥是否正确');
console.log('3. 证书序列号是否匹配');
console.log('4. 微信商户平台配置是否正确');



