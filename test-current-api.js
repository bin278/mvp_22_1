// 测试当前API状态
async function testCurrentAPI() {
  console.log('=== 测试当前 generate-stream API ===\n');

  try {
    const response = await fetch('http://localhost:3000/api/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-123',
      },
      body: JSON.stringify({
        prompt: 'Create a simple React button component',
        model: 'glm-4.6'  // 测试GLM模型
      })
    });

    console.log(`响应状态: ${response.status}`);
    console.log(`响应成功: ${response.ok}`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('错误响应数据:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('无法解析错误响应为JSON');
        const text = await response.text();
        console.log('原始错误响应:', text);
      }
    } else {
      console.log('响应成功！');
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // 只显示前500字符
            if (buffer.length > 500) {
              console.log('响应内容预览:', buffer.substring(0, 500) + '...');
              break;
            }
          }
        } catch (e) {
          console.log('读取响应流时出错:', e.message);
        }
      }
    }
  } catch (error) {
    console.error('网络错误:', error.message);
  }
}

testCurrentAPI();


