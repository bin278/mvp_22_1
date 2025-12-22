// 检查CloudBase配置是否正确
console.log('🔍 检查CloudBase配置...\n');

// 1. 检查环境变量
console.log('📋 环境变量检查:');
const requiredEnvVars = [
  'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
  'AUTH_PROVIDER',
  'DATABASE_PROVIDER'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  console.log(`   ${status} ${varName}: ${value || '未设置'}`);
});

console.log('\n📋 CloudBase控制台配置检查:');
console.log('请确保在CloudBase控制台完成以下配置:');
console.log('1. ✅ 环境ID正确: cloud1-5gkes99x7b41ee3f');
console.log('2. ✅ 邮箱登录已启用 (用户管理 → 登录设置)');
console.log('3. ✅ 邮件模板已配置 (可选)');

console.log('\n🔧 如果仍然收不到邮件，请检查:');
console.log('1. 邮箱地址是否正确');
console.log('2. 邮箱服务是否正常');
console.log('3. CloudBase环境是否有发送邮件的权限');
console.log('4. 检查邮箱垃圾邮件文件夹');

console.log('\n📧 测试发送验证码:');
console.log('运行以下命令测试验证码发送:');
console.log('node -e "');
console.log('const { sendEmailVerification } = require(\'./lib/cloudbase-auth-frontend.ts\');');
console.log('sendEmailVerification(\'test@example.com\').then(console.log);"');

console.log('\n🚀 现在可以测试注册功能了！');




