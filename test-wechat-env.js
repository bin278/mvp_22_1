// 测试微信登录环境变量
console.log('=== 微信登录环境变量检查 ===');
console.log('NEXT_PUBLIC_WECHAT_APP_ID:', process.env.NEXT_PUBLIC_WECHAT_APP_ID || '未设置');
console.log('WECHAT_APP_ID:', process.env.WECHAT_APP_ID || '未设置');
console.log('WECHAT_APP_SECRET:', process.env.WECHAT_APP_SECRET ? '已设置' : '未设置');
console.log('=== 检查完成 ===');
