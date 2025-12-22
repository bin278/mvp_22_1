// 检查CloudBase环境变量配置
console.log('🔍 检查CloudBase环境变量配置...\n');

// 检查环境变量
const envVars = {
  'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID': process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
  'TENCENT_CLOUD_SECRET_ID': process.env.TENCENT_CLOUD_SECRET_ID,
  'TENCENT_CLOUD_SECRET_KEY': process.env.TENCENT_CLOUD_SECRET_KEY,
  'AUTH_PROVIDER': process.env.AUTH_PROVIDER,
  'DATABASE_PROVIDER': process.env.DATABASE_PROVIDER,
};

console.log('📋 当前环境变量:');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value && value !== 'your-env-id' && value !== 'your_environment_id_here' && value !== 'your_secret_id_here' && value !== 'your_secret_key_here'
    ? '✅ 已配置'
    : '❌ 未配置或使用默认值';

  console.log(`   ${key}: ${status}`);
  if (value) {
    console.log(`      值: ${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
  }
});

console.log('\n🔧 必需的配置:');
const requiredConfigs = [
  'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
  'AUTH_PROVIDER=cloudbase',
  'DATABASE_PROVIDER=cloudbase'
];

requiredConfigs.forEach(config => {
  const [key, expectedValue] = config.split('=');
  const actualValue = envVars[key];
  const isValid = expectedValue ? actualValue === expectedValue : (actualValue && actualValue !== 'your-env-id');

  console.log(`   ${isValid ? '✅' : '❌'} ${key}${expectedValue ? `=${expectedValue}` : ''}`);
});

console.log('\n📖 配置指南:');
console.log('1. 复制 CLOUDBASE_ENV_EXAMPLE.env 到 .env.local');
console.log('2. 访问 https://console.cloud.tencent.com/tcb 获取配置信息');
console.log('3. 重启开发服务器');

console.log('\n🎯 常见问题排查:');
console.log('- 确保 .env.local 文件存在且格式正确');
console.log('- 检查环境变量名是否拼写正确');
console.log('- 确认 CloudBase 环境已创建且状态正常');
console.log('- 验证访问密钥是否有效');




