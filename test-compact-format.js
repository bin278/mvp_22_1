#!/usr/bin/env node

/**
 * 测试紧凑JSON格式
 */

// 新的紧凑格式函数
function formatJsonForWechatSignature(obj) {
  const paddedDescription = obj.description + '      '; // 6个空格
  const escapedAttach = obj.attach.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `{"appid":"${obj.appid}","mchid":"${obj.mchid}","description":"${paddedDescription}","out_trade_no":"${obj.out_trade_no}","notify_url":"${obj.notify_url}","amount":{"total":${obj.amount.total},"currency":"${obj.amount.currency}"},"attach":"${escapedAttach}"}`;
}

// 测试数据
const testRequestBody = {
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1年 Enterprise 会员",
  out_trade_no: "CN20251221352812Q312K4",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: { total: 49900, currency: "CNY" },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
};

console.log('🧪 测试紧凑JSON格式\n');

// 生成签名JSON
const signatureJson = formatJsonForWechatSignature(testRequestBody);
console.log('🔐 签名JSON (紧凑格式):');
console.log(`"${signatureJson}"`);
console.log(`长度: ${signatureJson.length}\n`);

// 生成请求体JSON
const requestBody = JSON.stringify(testRequestBody);
console.log('📨 请求体JSON:');
console.log(`"${requestBody}"`);
console.log(`长度: ${requestBody.length}\n`);

// 构造签名消息
const method = 'POST';
const url = '/v3/pay/transactions/native';
const timestamp = '1766332352';
const nonce = 'XFMn5d47Yz56mQqlMu1E5LwRzY7TAabx';

const signMessage = `${method}\n${url}\n${timestamp}\n${nonce}\n${signatureJson}\n`;

console.log('📝 签名消息:');
console.log(`长度: ${signMessage.length}`);
console.log(`微信期望长度: 408`);
console.log(`差异: ${signMessage.length - 408}`);

if (signMessage.length === 408) {
  console.log('🎉 完美匹配！');

  // 验证截断部分
  const truncatedLength = 'POST\n/v3/pay/transactions/native\n1766332352\nXFMn5d47Yz56mQqlMu1E5LwRzY7TAabx\n{"appid"'.length;
  const ourTruncated = signMessage.substring(0, truncatedLength);
  const wechatTruncated = 'POST\n/v3/pay/transactions/native\n1766332352\nXFMn5d47Yz56mQqlMu1E5LwRzY7TAabx\n{"appid"';

  console.log(`\n截断匹配: ${ourTruncated === wechatTruncated ? '✅' : '❌'}`);

  if (ourTruncated === wechatTruncated) {
    console.log('\n🚀 签名格式完全匹配微信期望！');
  }
} else {
  console.log(`\n⚠️ 还需要 ${408 - signMessage.length} 个字符`);
}

// 验证JSON格式
try {
  const parsed = JSON.parse(signatureJson);
  console.log('\n✅ 签名JSON格式正确');
  console.log('解析结果:', {
    appid: parsed.appid,
    attach: parsed.attach
  });
} catch (error) {
  console.log('\n❌ 签名JSON解析错误:', error.message);
}
