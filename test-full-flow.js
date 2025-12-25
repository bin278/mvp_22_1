// 测试完整的AI代码生成流程
const https = require('https');

async function testFullFlow() {
  console.log('🧪 测试完整的AI代码生成流程...\n');

  try {
    // 第一步：创建代码生成任务
    console.log('📝 第一步：创建代码生成任务...');
    const createResponse = await makeRequest('/api/create-code-task', {
      method: 'POST',
      body: JSON.stringify({
        prompt: '创建一个简单的React计数器组件，包含增加和减少按钮'
      })
    });

    if (!createResponse.success) {
      throw new Error(`创建任务失败: ${createResponse.error}`);
    }

    const { taskId } = createResponse.data;
    console.log('✅ 任务创建成功，TaskID:', taskId);

    // 第二步：轮询查询任务状态
    console.log('\n🔄 第二步：开始轮询查询任务状态...');

    let attempts = 0;
    const maxAttempts = 60; // 最多轮询60次（约30秒）

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`📊 第${attempts}次轮询...`);

      const queryResponse = await makeRequest(`/api/query-code-task?taskId=${taskId}`, {
        method: 'GET'
      });

      if (!queryResponse.success) {
        console.log('❌ 查询失败:', queryResponse.error);
        await sleep(1000);
        continue;
      }

      const { status, code, errorMsg } = queryResponse.data;
      console.log(`📋 任务状态: ${status}, 代码长度: ${code.length}`);

      if (status === 'success') {
        console.log('\n🎉 任务完成！');
        console.log('📝 生成的代码长度:', code.length);
        console.log('📄 代码预览 (前200字符):');
        console.log(code.substring(0, 200) + (code.length > 200 ? '...' : ''));
        return;
      }

      if (status === 'failed') {
        console.log('\n❌ 任务失败!');
        console.log('🔍 错误信息:', errorMsg);
        return;
      }

      // 继续轮询
      await sleep(1000);
    }

    console.log('\n⏰ 轮询超时，任务可能仍在处理中...');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

function makeRequest(path, options) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'mornfront.mornscience.top',
      path: path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          resolve({
            success: false,
            error: `解析响应失败: ${e.message}`,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: `请求失败: ${error.message}`
      });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.setTimeout(10000, () => {
      req.abort();
      resolve({
        success: false,
        error: '请求超时'
      });
    });

    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行测试
testFullFlow();