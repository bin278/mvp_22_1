#!/usr/bin/env node

/**
 * 修复微信支付签名生成问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复微信支付签名生成问题\n');

// 读取adapter-cn.ts文件
const adapterPath = path.join(__dirname, 'lib', 'payment', 'adapter-cn.ts');

if (!fs.existsSync(adapterPath)) {
  console.log('❌ 找不到 adapter-cn.ts 文件');
  process.exit(1);
}

let content = fs.readFileSync(adapterPath, 'utf8');

// 查找签名生成方法
const signatureMethodRegex = /private generateSignature\(method: string, url: string, timestamp: number, nonceStr: string, body: string\): string \{[\s\S]*?\}/;

const currentSignatureMethod = content.match(signatureMethodRegex);

if (!currentSignatureMethod) {
  console.log('❌ 找不到签名生成方法');
  process.exit(1);
}

console.log('📝 当前签名生成方法:');
console.log(currentSignatureMethod[0]);
console.log();

// 新的签名生成方法 - 确保正确的格式
const newSignatureMethod = `  private generateSignature(method: string, url: string, timestamp: number, nonceStr: string, body: string): string {
    // 微信支付API v3签名格式：METHOD\\nURI\\nTIMESTAMP\\nNONCE\\nBODY\\n
    // 注意：body必须是原始JSON字符串，不能有额外格式化
    const message = \`\${method}\\n\${url}\\n\${timestamp}\\n\${nonceStr}\\n\${body}\\n\`;
    console.log('[签名调试] 签名消息:', JSON.stringify(message));

    try {
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(message, 'utf8');
      const signature = sign.sign(this.privateKey, "base64");
      console.log('[签名调试] 生成的签名:', signature.substring(0, 50) + '...');
      return signature;
    } catch (error) {
      console.error('[签名调试] 签名生成失败:', error);
      throw error;
    }
  }`;

console.log('🔄 新的签名生成方法:');
console.log(newSignatureMethod);
console.log();

// 替换签名方法
const updatedContent = content.replace(signatureMethodRegex, newSignatureMethod);

// 检查私钥初始化
console.log('🔑 检查私钥初始化...');
const privateKeyInitRegex = /this\.privateKey = \(process\.env\.WECHAT_PAY_PRIVATE_KEY \|\| ""\)\.replace\(/;
const currentPrivateKeyInit = content.match(privateKeyInitRegex);

if (currentPrivateKeyInit) {
  console.log('📋 当前私钥初始化:');
  console.log(currentPrivateKeyInit[0]);
  console.log();

  // 改进的私钥处理
  const newPrivateKeyInit = `    // 处理私钥格式 - 移除引号并正确处理换行符
    let privateKeyStr = process.env.WECHAT_PAY_PRIVATE_KEY || "";
    if (privateKeyStr.startsWith('"') && privateKeyStr.endsWith('"')) {
      privateKeyStr = privateKeyStr.slice(1, -1);
    }
    this.privateKey = privateKeyStr.replace(/\\\\n/g, '\\n');`;

  console.log('🔄 新的私钥初始化:');
  console.log(newPrivateKeyInit);
  console.log();

  // 替换私钥初始化
  const updatedContent2 = updatedContent.replace(currentPrivateKeyInit[0], newPrivateKeyInit);
  content = updatedContent2;
} else {
  content = updatedContent;
}

// 保存修改
fs.writeFileSync(adapterPath, content);

console.log('✅ 微信支付签名生成已修复！');
console.log('\n📋 修复内容:');
console.log('1. 改进了签名消息格式化');
console.log('2. 添加了签名调试日志');
console.log('3. 改进了私钥格式处理');
console.log('\n🚀 请重启开发服务器测试修复效果');



