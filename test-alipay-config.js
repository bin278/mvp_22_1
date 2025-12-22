// 测试支付宝配置
console.log('=== 支付宝配置测试 ===');

try {
  // 检查环境变量
  console.log('ALIPAY_APP_ID:', process.env.ALIPAY_APP_ID ? '已设置' : '未设置');
  console.log('ALIPAY_PRIVATE_KEY:', process.env.ALIPAY_PRIVATE_KEY ? '已设置' : '未设置');
  console.log('ALIPAY_PUBLIC_KEY:', process.env.ALIPAY_PUBLIC_KEY ? '已设置' : '未设置');
  console.log('ALIPAY_GATEWAY_URL:', process.env.ALIPAY_GATEWAY_URL || '使用默认生产环境URL');

  // 检查AppID格式
  const appId = process.env.ALIPAY_APP_ID;
  if (appId) {
    if (appId.startsWith('9021')) {
      console.log('✅ AppID格式正确：沙箱环境');
    } else if (appId.length === 16) {
      console.log('✅ AppID格式正确：生产环境');
    } else {
      console.log('❌ AppID格式可能有误');
    }
  }

  // 检查网关URL
  const gatewayUrl = process.env.ALIPAY_GATEWAY_URL;
  if (gatewayUrl) {
    if (gatewayUrl.includes('sandbox')) {
      console.log('✅ 网关URL正确：沙箱环境');
    } else if (gatewayUrl.includes('alipay.com')) {
      console.log('✅ 网关URL正确：生产环境');
    } else {
      console.log('❌ 网关URL格式可能有误');
    }
  }

  console.log('\n=== 配置检查完成 ===');

} catch (error) {
  console.error('测试失败:', error.message);
}


