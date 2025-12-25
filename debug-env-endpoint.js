// 直接测试 /api/env 端点的实现逻辑
console.log('=== 调试 /api/env 端点逻辑 ===\n');

// 模拟 /api/env 端点的逻辑
function simulateEnvEndpoint() {
  console.log('模拟环境变量读取...');

  const publicEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID,
    NEXT_PUBLIC_WECHAT_APP_ID: process.env.WECHAT_APP_ID,
    DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };

  console.log('读取到的环境变量:');
  console.log('- NEXT_PUBLIC_APP_URL:', publicEnv.NEXT_PUBLIC_APP_URL);
  console.log('- NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', publicEnv.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID);
  console.log('- NEXT_PUBLIC_WECHAT_APP_ID:', publicEnv.NEXT_PUBLIC_WECHAT_APP_ID);
  console.log('- DEPLOYMENT_REGION:', publicEnv.DEPLOYMENT_REGION);
  console.log('- NODE_ENV:', publicEnv.NODE_ENV);

  const response = {
    success: true,
    env: publicEnv,
    timestamp: new Date().toISOString()
  };

  console.log('\n模拟响应:');
  console.log(JSON.stringify(response, null, 2));

  return response;
}

// 检查是否有未定义的环境变量
function checkForUndefinedValues() {
  console.log('\n=== 检查未定义的环境变量 ===');

  const varsToCheck = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
    'WECHAT_APP_ID',
    'DEPLOYMENT_REGION',
    'NODE_ENV'
  ];

  varsToCheck.forEach(varName => {
    const value = process.env[varName];
    if (value === undefined) {
      console.log(`⚠️  ${varName} 未定义`);
    } else {
      console.log(`✅ ${varName}:`, value);
    }
  });
}

simulateEnvEndpoint();
checkForUndefinedValues();



