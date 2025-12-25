// 简单的环境变量检查
console.log('=== 环境变量检查 ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置');
console.log('GLM_API_KEY:', process.env.GLM_API_KEY ? '已设置' : '未设置');

// 检查开发环境判断逻辑
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
console.log('isDev (开发环境判断):', isDev);







