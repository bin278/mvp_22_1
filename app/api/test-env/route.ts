import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    ALIPAY_APP_ID: process.env.ALIPAY_APP_ID,
    ALIPAY_PRIVATE_KEY: process.env.ALIPAY_PRIVATE_KEY ? '已配置 (长度: ' + process.env.ALIPAY_PRIVATE_KEY.length + ')' : '未配置',
    ALIPAY_PUBLIC_KEY: process.env.ALIPAY_PUBLIC_KEY ? '已配置 (长度: ' + process.env.ALIPAY_PUBLIC_KEY.length + ')' : '未配置',
    ALIPAY_GATEWAY_URL: process.env.ALIPAY_GATEWAY_URL,
    ALIPAY_SANDBOX: process.env.ALIPAY_SANDBOX,
  };

  return NextResponse.json({
    message: '环境变量状态',
    envVars,
    timestamp: new Date().toISOString(),
  });
}