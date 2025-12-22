#!/usr/bin/env node

/**
 * 精确分析签名消息差异
 */

console.log('🔍 签名消息差异精确分析\n');

// 从日志中提取的数据
const ourMessage = "POST\n/v3/pay/transactions/native\n1766331140\nUlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM\n{\"appid\":\"wxf8ef6eb93c045731\",\"mchid\":\"169478675\",\"description\":\"1个月 Enterprise 会员\",\"out_trade_no\":\"CN202512211409310SKLQ1\",\"notify_url\":\"http://localhost:3000/api/payment/cn/wechat/notify\",\"amount\":{\"total\":4990,\"currency\":\"CNY\"},\"attach\":\"{\\\"userId\\\":\\\"dev-user\\\",\\\"planType\\\":\\\"enterprise\\\",\\\"billingCycle\\\":\\\"monthly\\\"}\"}\n";

// 微信返回的签名信息显示的格式
const wechatFormat = `POST
/v3/pay/transactions/native
1766331140
UlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM
{"appid"
`;

console.log('📝 我们的签名消息:');
console.log(`长度: ${ourMessage.length}`);
console.log(`内容: "${ourMessage}"\n`);

// 分析我们的JSON部分
const ourJsonStart = ourMessage.indexOf('{');
const ourJsonEnd = ourMessage.lastIndexOf('}');
const ourJson = ourMessage.substring(ourJsonStart, ourJsonEnd + 1);

console.log('🔍 我们的JSON部分:');
console.log(`"${ourJson}"`);
console.log(`JSON长度: ${ourJson.length}\n`);

// 尝试重建微信使用的消息
// 基于truncated_sign_message推测完整格式

// 方案1：微信使用标准JSON格式化（每行一个属性）
const wechatJson1 = `{
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

const wechatMessage1 = `POST\n/v3/pay/transactions/native\n1766331140\nUlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM\n${wechatJson1}\n`;

console.log('🧪 方案1 - 标准格式化JSON:');
console.log(`消息长度: ${wechatMessage1.length}`);
console.log(`与微信长度差异: ${411 - wechatMessage1.length}\n`);

// 方案2：最小化差异 - 只在某些地方加换行
// 从微信的truncated信息看，在"appid"之后有换行，可能是每个顶级属性一行

const wechatJson2 = `{"appid":"wxf8ef6eb93c045731",
"mchid":"169478675",
"description":"1个月 Enterprise 会员",
"out_trade_no":"CN202512211409310SKLQ1",
"notify_url":"http://localhost:3000/api/payment/cn/wechat/notify",
"amount":{"total":4990,"currency":"CNY"},
"attach":"{\\"userId\\":\\"dev-user\\",\\"planType\\":\\"enterprise\\",\\"billingCycle\\":\\"monthly\\"}"}`;

const wechatMessage2 = `POST\n/v3/pay/transactions/native\n1766331140\nUlnR03vdfCDmnxR0Pl89W0CQvqfTt3fM\n${wechatJson2}\n`;

console.log('🧪 方案2 - 每属性一行的JSON:');
console.log(`消息长度: ${wechatMessage2.length}`);
console.log(`与微信长度差异: ${411 - wechatMessage2.length}\n`);

// 方案3：检查是否有额外的空格或字符
// 我们知道差异是8个字符，可能是某些字段有额外格式

console.log('🔢 长度差异分析:');
console.log(`我们的消息长度: ${ourMessage.length}`);
console.log(`微信的消息长度: 411`);
console.log(`差异: ${411 - ourMessage.length} 个字符`);
console.log(`需要添加 ${411 - ourMessage.length} 个字符来匹配微信的长度\n`);

// 可能的解决方案
console.log('💡 可能的解决方案:');
console.log('1. 微信支付API可能对请求体有特定的格式要求');
console.log('2. 可能是HTTP传输过程中的编码差异');
console.log('3. 可能是Content-Type或其他HTTP头影响');
console.log('4. 可能是微信服务器端的预处理');

// 检查是否有已知的微信支付签名问题
console.log('\n⚠️ 常见微信支付签名问题:');
console.log('1. 私钥格式问题 (应为PKCS#8)');
console.log('2. 证书序列号不匹配');
console.log('3. API v3密钥错误');
console.log('4. 时间戳或随机串格式问题');
console.log('5. 请求体JSON格式不符合微信要求');

console.log('\n🔧 建议的调试步骤:');
console.log('1. 检查微信商户平台的API密钥配置');
console.log('2. 确认私钥与商户号的对应关系');
console.log('3. 验证证书序列号的正确性');
console.log('4. 尝试使用微信支付官方的调试工具');
console.log('5. 检查是否有网络代理或中间件影响请求');



