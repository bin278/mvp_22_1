import cloudbase from '@cloudbase/js-sdk';

// CloudBase应用实例
let app: any = null;
// CloudBase认证实例
let authInstance: any = null;

// 初始化CloudBase应用
export async function initializeCloudBase(): Promise<any> {
  if (!app && typeof window !== 'undefined') {
    try {
      // 从API异步获取环境变量
      const { getPublicEnv } = await import('./env-client');
      const env = await getPublicEnv();
      const envId = env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID;

      console.log('🔍 CloudBase初始化 - 环境变量检查:');
      console.log('   NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID:', envId);
      console.log('   NEXT_PUBLIC_APP_URL:', env.NEXT_PUBLIC_APP_URL);
      console.log('   WECHAT_APP_ID:', env.WECHAT_APP_ID);

      if (!envId || envId === 'your-env-id' || envId === 'your_environment_id_here') {
        console.error('❌ CloudBase环境ID未正确配置。请在腾讯云控制台设置 NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID 环境变量。');
        console.error('📖 配置步骤：');
        console.error('   1. 登录腾讯云控制台: https://console.cloud.tencent.com/tcb');
        console.error('   2. 进入 CloudBase 云托管服务');
        console.error('   3. 在环境变量中添加: NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID=cloud1-3gn61ziydcfe6a57');
        console.error('   4. 保存并重新部署服务');
        console.error('📖 详细指南：查看 CLOUDBASE_CLOUD_HOSTING_DEPLOYMENT.md');
        return null;
      }

      console.log('🔧 使用CloudBase环境ID:', envId);

      app = cloudbase.init({
        env: envId,
        region: 'ap-guangzhou', // 广州地域
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
export async function getCloudBaseApp(): Promise<any> {
  if (!app) {
    return await initializeCloudBase();
  }
  return app;
}

// 获取认证实例（确保只有一个实例）
export async function getAuth(): Promise<any> {
  if (!authInstance) {
    const app = await getCloudBaseApp();
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
export async function getDatabase(): Promise<any> {
  const app = await getCloudBaseApp();
  return app?.database();
}
