#!/usr/bin/env node

/**
 * 精确计算需要的JSON长度
 */

console.log('🎯 精确计算需要的JSON长度\n');

// 从微信错误信息中提取的数据
const wechatData = {
  sign_message_length: 416,
  truncated_sign_message: 'POST\n/v3/pay/transactions/native\n1766332108\nlHgSHLyMfs0Twygsb0W4lpxqeRNYsIvc\n{\n"appid'
};

// 计算各部分长度
const headerParts = [
  'POST',
  '/v3/pay/transactions/native',
  '1766332108',
  'lHgSHLyMfs0Twygsb0W4lpxqeRNYsIvc',
  ''  // 最后的空行（签名消息末尾的\n）
];

let headerLength = 0;
headerParts.forEach((part, index) => {
  const partLength = part.length + (index < headerParts.length - 1 ? 1 : 0); // +1 for \n except last
  headerLength += partLength;
  console.log(`头部部分 ${index + 1}: "${part}" = ${partLength} 字符`);
});

console.log(`\n总头部长度: ${headerLength}`);
console.log(`截断消息长度: ${wechatData.truncated_sign_message.length}`);
console.log(`预期总长度: ${wechatData.sign_message_length}`);
console.log(`JSON部分长度: ${wechatData.sign_message_length - headerLength}`);

const expectedJsonLength = wechatData.sign_message_length - headerLength;
console.log(`\n📊 计算结果:`);
console.log(`微信期望的JSON长度: ${expectedJsonLength}`);

// 我们的当前实现
const ourSignatureJson = `{
"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1年 Enterprise 会员",
"out_trade_no":"CN20251221108059R4DYTC",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":49900,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"yearly\\"}"
}`;

console.log(`\n我们的JSON长度: ${ourSignatureJson.length}`);
console.log(`差异: ${expectedJsonLength - ourSignatureJson.length}`);

if (expectedJsonLength - ourSignatureJson.length > 0) {
  console.log(`需要添加 ${expectedJsonLength - ourSignatureJson.length} 个字符`);
} else {
  console.log(`需要移除 ${Math.abs(expectedJsonLength - ourSignatureJson.length)} 个字符`);
}

// 验证truncated部分匹配
const ourTruncated = `POST\n/v3/pay/transactions/native\n1766332108\nlHgSHLyMfs0Twygsb0W4lpxqeRNYsIvc\n{\n"appid`;
const wechatTruncated = wechatData.truncated_sign_message;

console.log(`\n🔍 截断部分比较:`);
console.log(`微信截断: "${wechatTruncated}"`);
console.log(`我们的截断: "${ourTruncated}"`);
console.log(`匹配: ${wechatTruncated === ourTruncated ? '✅' : '❌'}`);

if (wechatTruncated === ourTruncated) {
  console.log('\n✅ 截断部分匹配，头部构造正确');
} else {
  console.log('\n❌ 截断部分不匹配，需要检查头部构造');
}



