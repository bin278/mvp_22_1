const fs = require('fs');

try {
  // 读取.env.local文件
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');

  let privateKey = '';
  for (const line of lines) {
    if (line.startsWith('ALIPAY_PRIVATE_KEY=')) {
      privateKey = line.split('=')[1];
      break;
    }
  }

  console.log('私钥长度:', privateKey.length);
  console.log('私钥前50字符:', privateKey.substring(0, 50));
  console.log('私钥后50字符:', privateKey.substring(privateKey.length - 50));
  console.log('包含转义换行符:', privateKey.includes('\\n'));
  console.log('是否为PKCS8格式:', privateKey.includes('BEGIN PRIVATE KEY'));

  // 检查实际的换行符
  const processedKey = privateKey.replace(/\\n/g, '\n');
  console.log('处理后长度:', processedKey.length);
  console.log('处理后是否包含换行符:', processedKey.includes('\n'));
  console.log('处理后是否为PKCS8格式:', processedKey.includes('BEGIN PRIVATE KEY'));

} catch (error) {
  console.error('Error:', error.message);
}

