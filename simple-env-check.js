// 检查环境变量的简单脚本
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');

  console.log('📄 .env.local 文件内容 (第70-100行):');
  console.log('=' + '='.repeat(50));

  lines.slice(70, 100).forEach((line, index) => {
    const lineNum = index + 71; // 因为slice从70开始，行号从71开始
    console.log(`${lineNum.toString().padStart(3)}: ${line}`);
  });

  console.log('=' + '='.repeat(50));
  console.log('\n🔍 分析微信支付配置:');

  let appId = null;
  let mchId = null;

  lines.forEach(line => {
    if (line.includes('WECHAT_PAY_APPID=')) {
      appId = line.split('=')[1];
    }
    if (line.includes('WECHAT_PAY_MCHID=')) {
      mchId = line.split('=')[1];
    }
  });

  console.log(`WECHAT_PAY_APPID: "${appId}"`);
  console.log(`WECHAT_PAY_MCHID: "${mchId}"`);

  if (!appId || !mchId) {
    console.log('\n❌ 发现问题:');
    if (!appId) console.log('   - WECHAT_PAY_APPID 未找到或为空');
    if (!mchId) console.log('   - WECHAT_PAY_MCHID 未找到或为空');
  } else {
    console.log('\n✅ 配置存在，现在检查是否被正确加载...');
  }

} catch (error) {
  console.error('❌ 读取文件失败:', error.message);
}
