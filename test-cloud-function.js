// 测试云函数是否工作
const https = require('https');

function testCloudFunction() {
  console.log('🧪 测试云函数调用...\n');

  const options = {
    hostname: 'mornfront.mornscience.top',
    path: '/api/create-code-task',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwidHlwZSI6ImFjY2VzcyIsInJlZ2lvbiI6IkNOIiwiZXhwIjoxNzM1OTY5OTk5fQ.signature'
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
        console.log('📊 API响应:');
        console.log('Status:', res.statusCode);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.code === 0 && result.data?.taskId) {
          console.log('\n✅ 任务创建成功！');
          console.log('📝 TaskID:', result.data.taskId);
          console.log('💡 现在可以测试轮询来查看AI生成进度');
        } else {
          console.log('\n❌ 任务创建失败:', result.msg || '未知错误');
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

  // 发送测试数据
  const testData = JSON.stringify({
    prompt: '创建一个简单的Hello World React组件'
  });

  req.write(testData);
  req.end();
}

testCloudFunction();



