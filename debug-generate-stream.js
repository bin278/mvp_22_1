// 调试generate-stream API的具体错误
async function debugGenerateStream() {
  console.log('=== 调试 generate-stream API ===\n');

  const testCases = [
    { prompt: 'Create a simple React component', model: 'deepseek-chat' },
    { prompt: 'Create a simple React component', model: 'glm-4.6' },
    { prompt: 'Create a simple React component', model: 'invalid-model' },
  ];

  for (const testCase of testCases) {
    console.log(`\n--- 测试: ${testCase.model} ---`);

    try {
      const response = await fetch('http://localhost:3000/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token-123',
        },
        body: JSON.stringify({
          prompt: testCase.prompt,
          model: testCase.model
        })
      });

      console.log(`状态码: ${response.status}`);
      console.log(`成功: ${response.ok}`);

      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log('错误详情:', JSON.stringify(errorData, null, 2));
        } catch (e) {
          console.log('无法解析错误响应');
          const text = await response.text();
          console.log('原始响应:', text);
        }
      } else {
        console.log('请求成功！');
      }
    } catch (error) {
      console.error('网络错误:', error.message);
    }
  }
}

debugGenerateStream();





