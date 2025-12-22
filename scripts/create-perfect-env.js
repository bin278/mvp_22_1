// 创建完美的.env.local配置
const fs = require('fs');
const path = require('path');

function createPerfectEnv() {
  console.log('🎯 创建完美的 .env.local 配置...\n');

  const perfectConfig = `# 支付宝配置
ALIPAY_APP_ID=9021000158655354
ALIPAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCjJK1Ucz6eMkS68Mr+YcbCm2d9YrgXKIj4JtelmhFVAIMyutBmiBe5vc8Y3n3Om9ElzzMKtdXKurVDbf2YlElD6wrfW+t0inr+KJnOqfZz0x5YA5zuJ5N77yWWVVZbmelIaPh1Y07Cms7ZJ8/4q2XltKwf15blYMRQCSbaQwXiKX6glhDHC7cpb45ohktT/rmt4bWUSMrfmBQl7WfdQfm0ekKRIwkVHHrW92x25TswbfTNYubohP56kpWWIT5dKRHwzAd7Kz1rEe0wq5+hDQ9UBV9APQXCol/Cm9+4pdCqVhAgy0SjUN9R/igUSxWxxNfludISNKk0VEEf2cHKvTO9AgMBAAECggEAM43VkEhS018DRSfunfB8BOdjDsZxcjAHCJQNtXE4ZOoii5dpX91F0hZfKXa1vuKSdyZA9PN9OfFCcqqBZwQFGwddijPb9hoEv+hIonwnO3bNsfaCUugCvTlXYWhaP9wlUhKJ4V6edvTAxPLFz8kqDCrJ8c4JCzdHEhuyQWrIoy0EQPs83pFGdB1g+PBpkRWWed3YVsaQy6KCCedrd9yXAKa6dkOYf5MaUDgzcM5xkVyzo75EE0y8xBYsztfwFs/U1Uc9oK9om0p9borc/S7vcI0LgOizwhiJMe27czvLHuSA4POBJovPBy695pZOIRtL7+1oEb+cuzr8UY/AdgPggQKBgQDZvayTAFaHrHpnwd4S59SL4IMSKCA24/TY+FE5cqah5OIv3XxZwfkyvm5Aitu4qNkSxrSIIGgOtWkv1vZNCecKANTSN5EVkkW3n7WZbI/fJlhL/g1U3j8rL27yWlQgJPOGcsCZyHMMa7Pv+7rdGTGgsQSQV0jKvqTRL92Bn5HA7QKBgQC/zx2h8onopDGuvl+axjbK8bt34PXgt/ssMPqg48uKefWI1m9MH8tezKG/8nERNGmIQPPw8hTgVU5e/CYJP0iDPR+LMyx4p9V4oBAQC0DIpcVzZ4O2ynmQKl2v+IvoA6WJyRVL+EyJKk3QsM0UI0ZKn15O6ulRD+gn6hm+gLR0EQKBgQDGm23IACztP/O+pGTtlayXkce8TgFkT/VL2uQrpFo9nUp7ImmEbZviHzTthjr4anrl131gFT8U+3/gdRDgIEIvK6bzwF+D75HL9c9tDEsG3jD3z9lVKgswVum6AY5ua4X9groPC3l1QOA168T8WzibPBvPlO3+kHpBnIlM7MHD2QKBgH4bXhArtiAOU9vfrlvEFiI37FlUvlOQosLbMOy22AujQ5tD4Mjb3onlYDMi4tO88eVzTu8LOk6Dx5MLlLZftP0UIrkSXBq3vdIg6m6h92X0F21YkXCMjoAKWq5naxSP0TZVznq0NR25go/CrhKfXoeRYB/isqNpIemcMHDfjcUBAoGBANCwiOdSmbsZJoBrcRMHfUsi+SY38H8f3T2yShoLc7CPHEHlC6jfCxBOtIquGWgJUlg/H8JxO+RcI+m3KFGPUql1q4fWLe28bQ4e7TAt4yZV9Tcf5Z0018WLQ/TAlCFyXinZXliqbFixsvpgK8BnhmBh9ocELbc1ZAuOq0haTf05
-----END PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwGeshoSg5mduZMCGj1LpKXsFK8nJmF3ohLffElnBj9GhXkNcA8ta12WQxYfRvUa9HANNIFnBWfvhAnPLkn9dijwf7kSQpbI/ksbGcr7/nE7BGGWTXFCVrd4K2chTAUuhjfsAjwS3SUYnY+I9rEfWnPmURvggHF3X+rEd3J0EZuUGgtszi+N22yaSbxq0cbrnRa360ZYXrATVbk5ckuH/t/9u97mtC6BRMXvJGGZv8CYurEBAX6QBwDJ+AO6MAgoqms7OEfyzsMxWISeGKdf0ljoeIbMQn5Uep+zL7AWirrt8Qv+7LVHs7x+ipHAsMVAcsoLB3/2tjREmrOlOpjF0NQIDAQAB
-----END PUBLIC KEY-----"
ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
ALIPAY_SANDBOX=false

# ============================================================================
# CloudBase 腾讯云配置
# ============================================================================

# CloudBase环境ID (必需)
# 在CloudBase控制台获取: https://console.cloud.tencent.com/tcb
NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57

# CloudBase密钥ID (后端API使用)
TENCENT_CLOUD_SECRET_ID=AKIDjPyPhv45xhJk7SdeXN6f2UvIZijcO7kF

# CloudBase密钥Key (后端API使用)
TENCENT_CLOUD_SECRET_KEY=So3A80aTWSH0Z1JQM6f7RaXn5mNrGWeg

# CloudBase环境ID (后端API使用，与上面的相同)
TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57
# ============================================================================
# 认证配置
# ============================================================================

# 认证提供商 (cloudbase 或 supabase)
AUTH_PROVIDER=cloudbase
NEXT_PUBLIC_AUTH_PROVIDER=cloudbase

# ============================================================================
# 数据库配置
# ============================================================================

# 数据库提供商 (cloudbase 或 supabase 或 tencent_cloud)
DATABASE_PROVIDER=cloudbase

# ============================================================================
# 其他配置
# ============================================================================

# Next.js应用URL (用于回调)
NEXTAUTH_URL=http://localhost:3000

# 应用URL (支付回调使用)
APP_URL=http://localhost:3000

# ============================================================================
# 如何获取CloudBase配置
# ============================================================================

DEEPSEEK_API_KEY=sk-599211ff7b6c47b786c03c1c7c4dfbf6
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7
# GitHub OAuth 配置
GITHUB_CLIENT_ID=Ov23liDuz6AQKWbhZr8x
GITHUB_CLIENT_SECRET=aa312942ffb48aa9e369c365be8a0458f5aada4b
NEXT_PUBLIC_APP_URL=http://localhost:3000  # 开发环 ?# NEXT_PUBLIC_APP_URL=https://yourdomain.com  # 生产环境`;

  const envFilePath = path.join(process.cwd(), '.env.local');

  try {
    // 写入完美配置
    fs.writeFileSync(envFilePath, perfectConfig, 'utf8');
    console.log('✅ 已成功写入完美的 .env.local 配置！');

    console.log('\n📋 写入的支付宝配置包含:');
    console.log('• ALIPAY_APP_ID: ✅ 已设置');
    console.log('• ALIPAY_PRIVATE_KEY: ✅ 正确格式 (多行PEM)');
    console.log('• ALIPAY_PUBLIC_KEY: ✅ 正确格式 (多行PEM)');
    console.log('• ALIPAY_GATEWAY_URL: ✅ 已设置');
    console.log('• ALIPAY_SANDBOX: ✅ 已设置');

    console.log('\n🚀 接下来的步骤:');
    console.log('1. 重启开发服务器: npm run dev');
    console.log('2. 测试配置: node scripts/verify-alipay-setup.js');
    console.log('3. 如果成功，可以测试支付功能');

    console.log('\n🎉 配置写入成功！现在重启服务器就能正常使用了！');

  } catch (error) {
    console.log('❌ 写入配置文件失败:', error.message);
    console.log('\n💡 请手动复制以下配置到 .env.local 文件中:');
    console.log('='.repeat(80));
    console.log(perfectConfig);
    console.log('='.repeat(80));
  }
}

// 运行创建
createPerfectEnv();


