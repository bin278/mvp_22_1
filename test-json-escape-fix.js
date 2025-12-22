#!/usr/bin/env node

/**
 * 测试JSON转义修复
 */

console.log('🧪 测试JSON转义修复\n');

// 模拟修复前后的JSON格式
const testRequestBody = {
  appid: "wxf8ef6eb93c045731",
  mchid: "169478675",
  description: "1年 Enterprise 会员",
  out_trade_no: "CN20251221715164J13SJH",
  notify_url: "http://localhost:3000/api/payment/cn/wechat/notify",
  amount: { total: 49900, currency: "CNY" },
  attach: "{\"userId\":\"dev-user\",\"planType\":\"enterprise\",\"billingCycle\":\"yearly\"}"
};

// 修复前的格式（有问题的）
const brokenJson = `{
"appid":"${testRequestBody.appid}",
"mchid":"${testRequestBody.mchid}",
"description":"${testRequestBody.description}",
"out_trade_no":"${testRequestBody.out_trade_no}",
"notify_url":"${testRequestBody.notify_url}",
"amount":${JSON.stringify(testRequestBody.amount)},
"attach":"${testRequestBody.attach}"
}`;

console.log('❌ 修复前的JSON (有问题):');
console.log(brokenJson);
console.log();

// 修复后的格式
const fixedJson = `{
"appid":"${testRequestBody.appid}",
"mchid":"${testRequestBody.mchid}",
"description":"${testRequestBody.description}",
"out_trade_no":"${testRequestBody.out_trade_no}",
"notify_url":"${testRequestBody.notify_url}",
"amount":${JSON.stringify(testRequestBody.amount)},
"attach":${JSON.stringify(testRequestBody.attach)}
}`;

console.log('✅ 修复后的JSON:');
console.log(fixedJson);
console.log();

// 测试JSON解析
console.log('🔍 JSON解析测试:');

try {
  const parsedBroken = JSON.parse(brokenJson);
  console.log('❌ 修复前JSON解析成功 (意外)');
} catch (error) {
  console.log('✅ 修复前JSON解析失败 (预期):', error.message);
}

try {
  const parsedFixed = JSON.parse(fixedJson);
  console.log('✅ 修复后JSON解析成功');
  console.log('📋 解析结果:');
  console.log('  appid:', parsedFixed.appid);
  console.log('  mchid:', parsedFixed.mchid);
  console.log('  attach:', parsedFixed.attach);

  // 验证attach字段是否正确
  try {
    const attachParsed = JSON.parse(parsedFixed.attach);
    console.log('✅ attach字段JSON解析成功:', attachParsed);
  } catch (attachError) {
    console.log('❌ attach字段JSON解析失败:', attachError.message);
  }
} catch (error) {
  console.log('❌ 修复后JSON解析失败:', error.message);
}

console.log('\n💡 这个修复应该解决微信支付的JSON解析错误');



