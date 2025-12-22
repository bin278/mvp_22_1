// 检查支付宝环境变量配置
// 在项目根目录运行: node check-env.js

console.log('🔍 支付宝环境变量检查');
console.log('========================');
console.log('当前工作目录:', process.cwd());
console.log('Node.js版本:', process.version);
console.log('');

const envVars = [
  'ALIPAY_APP_ID',
  'ALIPAY_PRIVATE_KEY',
  'ALIPAY_PUBLIC_KEY',
  'ALIPAY_SANDBOX',
  'ALIPAY_TEST_MODE',
  'NODE_ENV'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const hasValue = !!value;
  const isTrue = value === 'true';
  const length = value ? value.length : 0;

  console.log(`${varName}: ${hasValue ? '✅' : '❌'} ${isTrue ? '(true)' : ''} ${length ? `(${length}字符)` : ''}`);
  if (hasValue && length > 20) {
    console.log(`  预览: ${value.substring(0, 20)}...`);
  } else if (hasValue) {
    console.log(`  值: ${value}`);
  }
});

console.log('\n🎯 分析结果:');

// 测试模式检查
const isTestMode = process.env.ALIPAY_TEST_MODE === 'true';
const hasAppId = !!process.env.ALIPAY_APP_ID;
const hasPrivateKey = !!process.env.ALIPAY_PRIVATE_KEY;

if (isTestMode) {
  console.log('🧪 当前使用: 测试模式（模拟支付）');
  console.log('💡 如果想使用真实支付宝API，请删除 ALIPAY_TEST_MODE 或设置为 false');
} else if (hasAppId && hasPrivateKey) {
  console.log('✅ 当前使用: 真实支付宝API');
  console.log(`🏦 环境: ${process.env.ALIPAY_SANDBOX !== 'false' ? '沙盒环境' : '生产环境'}`);
} else {
  console.log('❌ 配置不完整: 缺少必要的环境变量');
  console.log('💡 请在 .env.local 中配置 ALIPAY_APP_ID 和 ALIPAY_PRIVATE_KEY');
}

console.log('\n📋 推荐配置 (.env.local):');
console.log('ALIPAY_APP_ID=你的沙盒应用ID');
console.log('ALIPAY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n你的私钥\n-----END PRIVATE KEY-----');
console.log('ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\n支付宝公钥\n-----END PUBLIC KEY-----');
console.log('ALIPAY_SANDBOX=true');
console.log('# ALIPAY_TEST_MODE=true  # 只有需要测试模式时才设置');
