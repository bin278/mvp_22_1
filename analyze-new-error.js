#!/usr/bin/env node

/**
 * 分析新的签名错误
 */

console.log('🔍 分析新的签名错误\n');

// 新错误信息
const newError = {
  our_sign_length: 416,
  wechat_sign_length: 408,
  truncated_sign_message: 'POST\n/v3/pay/transactions/native\n1766332352\nXFMn5d47Yz56mQqlMu1E5LwRzY7TAabx\n{"appid"'
};

// 计算头部长度
const headerParts = [
  'POST',
  '/v3/pay/transactions/native',
  '1766332352',
  'XFMn5d47Yz56mQqlMu1E5LwRzY7TAabx',
  ''  // 最后的空行
];

let headerLength = 0;
headerParts.forEach((part, index) => {
  const partLength = part.length + (index < headerParts.length - 1 ? 1 : 0);
  headerLength += partLength;
  console.log(`头部部分 ${index + 1}: "${part}" = ${partLength} 字符`);
});

console.log(`\n总头部长度: ${headerLength}`);
console.log(`微信签名总长度: ${newError.wechat_sign_length}`);
console.log(`微信JSON长度: ${newError.wechat_sign_length - headerLength}`);

const wechatJsonLength = newError.wechat_sign_length - headerLength;
console.log(`\n📊 新分析:`);
console.log(`我们签名总长度: ${newError.our_sign_length}`);
console.log(`微信签名总长度: ${newError.wechat_sign_length}`);
console.log(`差异: ${newError.our_sign_length - newError.wechat_sign_length} 个字符`);

console.log(`\n我们当前的JSON长度: 338`);
console.log(`微信期望的JSON长度: ${wechatJsonLength}`);
console.log(`JSON长度差异: ${338 - wechatJsonLength} 个字符`);

// 检查truncated部分
console.log(`\n🔍 截断部分比较:`);
const ourTruncated = 'POST\n/v3/pay/transactions/native\n1766332352\nXFMn5d47Yz56mQqlMu1E5LwRzY7TAabx\n{\n"appid"';
const wechatTruncated = newError.truncated_sign_message;

console.log(`微信截断: "${wechatTruncated}"`);
console.log(`我们的截断: "${ourTruncated}"`);
console.log(`匹配: ${wechatTruncated === ourTruncated ? '✅' : '❌'}`);

if (wechatTruncated !== ourTruncated) {
  console.log('\n❌ 截断不匹配，头部构造有问题');
} else {
  console.log('\n✅ 截断匹配，头部构造正确');
  console.log('问题在于JSON格式或长度');
}

// 可能的解决方案
console.log('\n💡 解决方案:');
console.log('微信期望的JSON长度是331字符，我们的是338字符');
console.log('需要减少7个字符');

console.log('\n🎯 调整方案:');
console.log('1. 移除description中的6个空格（保留1个用于精确长度）');
console.log('2. 或者调整其他字段的格式');

// 计算需要的调整
const currentJsonLength = 338;
const targetJsonLength = wechatJsonLength;
const adjustmentNeeded = currentJsonLength - targetJsonLength;

console.log(`\n需要减少 ${adjustmentNeeded} 个字符`);



