// 测试 /api/env 端点
async function testEnvAPI() {
  console.log('=== 测试 /api/env 端点 ===\n');

  try {
    const response = await fetch('http://localhost:3001/api/env', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`响应状态: ${response.status}`);
    console.log(`响应成功: ${response.ok}`);
    console.log(`响应头:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.log('响应不成功，尝试获取错误信息...');
      try {
        const errorText = await response.text();
        console.log('错误响应文本:', errorText);
      } catch (e) {
        console.log('无法读取错误响应');
      }
      return;
    }

    const data = await response.json();
    console.log('成功响应数据:', JSON.stringify(data, null, 2));

    // 检查数据结构
    if (data.success === false) {
      console.log('❌ API 返回了 success: false');
      console.log('错误信息:', data.error);
    } else if (data.success === true) {
      console.log('✅ API 返回了 success: true');
      console.log('环境变量:', data.env);
    } else {
      console.log('⚠️ API 响应格式异常，缺少 success 字段');
      console.log('完整响应:', data);
    }

  } catch (error) {
    console.error('网络错误:', error.message);
  }
}

testEnvAPI();


