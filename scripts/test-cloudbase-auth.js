// 使用Node.js内置的fetch (Node.js 18+)
const fetch = global.fetch;

// 测试CloudBase认证和对话API
async function testAuthAndConversations() {
  console.log('🧪 开始测试CloudBase认证和对话API...');

  try {
    // 1. 测试注册
    console.log('\n1. 测试用户注册...');
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User'
      })
    });

    const registerData = await registerResponse.json();
    console.log('注册响应:', registerData);

    // 2. 测试登录
    console.log('\n2. 测试用户登录...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData);

    if (loginData.success && loginData.session) {
      const token = loginData.session.accessToken;
      console.log('获取到访问令牌:', token);

      // 3. 测试创建对话
      console.log('\n3. 测试创建对话...');
      const createConvResponse = await fetch('http://localhost:3000/api/conversations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: '测试对话'
        })
      });

      const createConvData = await createConvResponse.json();
      console.log('创建对话响应:', createConvData);

      if (createConvData.success && createConvData.conversation) {
        const conversationId = createConvData.conversation.id;

        // 4. 测试获取对话列表
        console.log('\n4. 测试获取对话列表...');
        const listConvResponse = await fetch('http://localhost:3000/api/conversations/list', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const listConvData = await listConvResponse.json();
        console.log('对话列表响应:', listConvData);

        // 5. 测试添加消息
        console.log('\n5. 测试添加消息...');
        const addMessageResponse = await fetch(`http://localhost:3000/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            role: 'user',
            content: 'Hello, this is a test message'
          })
        });

        const addMessageData = await addMessageResponse.json();
        console.log('添加消息响应:', addMessageData);

        console.log('\n✅ 所有测试完成！');
      } else {
        console.log('❌ 创建对话失败，跳过后续测试');
      }
    } else {
      console.log('❌ 登录失败，无法进行后续测试');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testAuthAndConversations();