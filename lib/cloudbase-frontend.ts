import cloudbase from '@cloudbase/js-sdk';

// CloudBase应用实例
let app: any = null;
// CloudBase认证实例
let authInstance: any = null;

// 初始化CloudBase应用
export function initializeCloudBase() {
  if (!app && typeof window !== 'undefined') {
    // 检查环境变量
    const envId = process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID;

    if (!envId || envId === 'your-env-id' || envId === 'your_environment_id_here') {
      console.error('❌ CloudBase环境ID未正确配置。请检查 NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 环境变量。');
      console.error('📖 配置步骤：');
      console.error('   1. 复制 CLOUDBASE_ENV_EXAMPLE.env 到 .env.local');
      console.error('   2. 访问 https://console.cloud.tencent.com/tcb 获取环境ID');
      console.error('   3. 填入正确的环境ID并重启服务器');
      console.error('📖 详细指南：查看 CLOUDBASE_QUICK_SETUP.md');
      return null;
    }

    console.log('🔧 使用CloudBase环境ID:', envId);

    try {
      app = cloudbase.init({
        env: envId,
        region: 'ap-shanghai', // 根据实际情况设置地域
      });
      console.log('CloudBase前端SDK初始化成功，环境ID:', envId);
    } catch (error) {
      console.error('CloudBase初始化失败:', error);
      return null;
    }
  }
  return app;
}

// 获取CloudBase应用实例
export function getCloudBaseApp() {
  if (!app) {
    return initializeCloudBase();
  }
  return app;
}

// 获取认证实例（确保只有一个实例）
export function getAuth() {
  if (!authInstance) {
    const app = getCloudBaseApp();
    if (app) {
      authInstance = app.auth();
      console.log('CloudBase认证实例创建成功');
    } else {
      console.error('无法创建认证实例：CloudBase应用未初始化');
    }
  }
  return authInstance;
}

// 获取数据库实例
export function getDatabase() {
  const app = getCloudBaseApp();
  return app?.database();
}
