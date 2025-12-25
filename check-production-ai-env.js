// 检查生产环境AI相关环境变量配置
const https = require('https');

function checkProductionAIEnv() {
  console.log('🔍 检查生产环境AI相关环境变量...\n');

  // 检查AI相关的环境变量
  const options = {
    hostname: 'mornfront.mornscience.top',
    path: '/api/test-ai-env',
    method: 'GET',
    headers: {
      'User-Agent': 'CheckScript/1.0'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('📊 生产环境AI环境变量状态:');
        console.log('Status:', res.statusCode);
        console.log('Success:', result.success);

        if (result.envCheck) {
          console.log('\n🔑 AI环境变量状态:');
          Object.entries(result.envCheck).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
          });
        }

        if (result.error) {
          console.log('\n❌ 错误:', result.error);
        }

        console.log('\n💡 建议:');
        if (!result.success) {
          console.log('❌ AI环境变量配置有问题');
          console.log('请在CloudBase控制台检查以下变量：');
          console.log('- DEEPSEEK_API_KEY');
          console.log('- DEEPSEEK_BASE_URL');
          console.log('- DEEPSEEK_MAX_TOKENS');
          console.log('- DEEPSEEK_TEMPERATURE');
          console.log('- JWT_SECRET');
        } else {
          console.log('✅ AI环境变量配置正确');
          console.log('如果代码生成仍有问题，请检查API密钥是否有效');
        }

      } catch (e) {
        console.log('❌ 解析响应失败:', e.message);
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ 请求失败:', e.message);
  });

  req.setTimeout(10000, () => {
    console.log('⏰ 请求超时');
    req.abort();
  });

  req.end();
}

checkProductionAIEnv();

