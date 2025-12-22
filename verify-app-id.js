// 验证支付宝App ID是否有效
// 在项目根目录运行: node verify-app-id.js

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

// 读取.env.local文件
let envContent = '';
try {
  envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
} catch (error) {
  console.log('❌ 无法读取.env.local文件');
  process.exit(1);
}

// 解析环境变量
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

process.env = { ...process.env, ...envVars };

console.log('🔍 验证支付宝App ID和签名');
console.log('==========================');

// 检查环境变量
const appId = process.env.ALIPAY_APP_ID;
const privateKey = process.env.ALIPAY_PRIVATE_KEY;
const publicKey = process.env.ALIPAY_PUBLIC_KEY;

console.log(`📋 App ID: ${appId}`);
console.log(`🔑 私钥存在: ${!!privateKey}`);
console.log(`🔑 公钥存在: ${!!publicKey}`);

if (!appId || !privateKey || !publicKey) {
  console.log('❌ 缺少必要的环境变量');
  process.exit(1);
}

// 准备测试参数
const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
const bizContent = {
  out_trade_no: 'VERIFY' + Date.now(),
  product_code: 'FAST_INSTANT_TRADE_PAY',
  total_amount: '0.01',
  subject: '验证App ID',
  body: '验证支付宝App ID是否有效'
};

// 构建签名字符串
const params = {
  app_id: appId,
  method: 'alipay.trade.page.pay',
  charset: 'utf-8',
  sign_type: 'RSA2',
  timestamp: timestamp,
  version: '1.0',
  biz_content: JSON.stringify(bizContent)
};

// 按照支付宝要求排序参数
const sortedKeys = Object.keys(params).sort();
let signString = '';
for (const key of sortedKeys) {
  signString += `${key}=${params[key]}&`;
}
signString = signString.slice(0, -1); // 移除最后的&

console.log('📝 待签名字符串:');
console.log(signString);
console.log('');

// 处理私钥格式
let processedPrivateKey = privateKey.replace(/\\n/g, '\n');
if (!processedPrivateKey.includes('\n')) {
  processedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${processedPrivateKey}\n-----END PRIVATE KEY-----\n`;
}

// 生成签名
try {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signString, 'utf8');
  const signature = sign.sign(processedPrivateKey, 'base64');

  console.log('✅ 签名生成成功');
  console.log('🔏 签名:', signature.substring(0, 50) + '...');

  // 构建完整请求
  const requestParams = {
    ...params,
    sign: signature
  };

  const queryString = querystring.stringify(requestParams);
  const fullUrl = `https://openapi-sandbox.dl.alipaydev.com/gateway.do?${queryString}`;

  console.log('\n🌐 发送验证请求...');
  console.log(`URL: ${fullUrl.substring(0, 100)}...`);

  const startTime = Date.now();

  const req = https.request(fullUrl, {
    method: 'GET',
    timeout: 10000,
    headers: {
      'User-Agent': 'Node.js Verification Script'
    }
  }, (res) => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n✅ 请求完成`);
    console.log(`⏱️ 响应时间: ${duration}ms`);
    console.log(`📊 状态码: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`📄 响应长度: ${data.length} 字符`);

      if (data.length === 0) {
        console.log('❌ 响应为空 - App ID可能无效或签名错误');
        console.log('💡 建议:');
        console.log('   1. 检查App ID是否正确');
        console.log('   2. 确认使用的是沙箱App ID');
        console.log('   3. 验证私钥是否匹配App ID');
      } else {
        console.log('📄 响应内容预览:', data.substring(0, 200));

        if (data.includes('success') || data.includes('SUCCESS')) {
          console.log('✅ App ID和签名验证成功！');
        } else if (data.includes('invalid') || data.includes('INVALID')) {
          console.log('❌ App ID或签名无效');
        } else {
          console.log('⚠️ 收到未知响应');
        }
      }
    });
  });

  req.on('timeout', () => {
    console.log('\n❌ 请求超时 - 网络或服务器问题');
    req.destroy();
  });

  req.on('error', (err) => {
    console.log(`\n❌ 请求失败: ${err.message}`);
  });

  req.end();

} catch (error) {
  console.log('❌ 签名生成失败:', error.message);
  console.log('💡 可能的原因:');
  console.log('   1. 私钥格式不正确');
  console.log('   2. 私钥已损坏');
  console.log('   3. Node.js crypto模块不支持该密钥格式');
}
