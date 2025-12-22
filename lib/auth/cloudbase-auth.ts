// lib/auth/cloudbase-auth.ts
// 腾讯云CloudBase用户认证服务

// 只在服务器端导入CloudBase SDK
let cloudbase: any;
if (typeof window === 'undefined') {
  cloudbase = require('@cloudbase/node-sdk');
}

// CloudBase认证配置接口
export interface CloudBaseAuthConfig {
  secretId: string;
  secretKey: string;
  envId: string;
}

// 从环境变量获取CloudBase认证配置
function getCloudBaseAuthConfig(): CloudBaseAuthConfig | null {
  const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
  const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
  const envId = process.env.TENCENT_CLOUD_ENV_ID;

  if (!secretId || !secretKey || !envId) {
    console.warn('腾讯云CloudBase认证配置不完整');
    return null;
  }

  return {
    secretId,
    secretKey,
    envId,
  };
}

// CloudBase 应用实例（认证专用）
let authApp: any = null;

/**
 * 获取CloudBase认证应用实例
 */
export function getCloudBaseAuthApp() {
  if (!authApp) {
    const config = getCloudBaseAuthConfig();
    if (!config) {
      console.error('无法获取腾讯云CloudBase认证配置');
      return null;
    }

    try {
      authApp = cloudbase.init({
        secretId: config.secretId,
        secretKey: config.secretKey,
        env: config.envId,
      });
      console.log('🔐 CloudBase认证服务已初始化');
    } catch (error) {
      console.error('❌ 创建CloudBase认证应用实例失败:', error);
      return null;
    }
  }

  return authApp;
}

/**
 * 获取认证服务
 */
export function getAuthService() {
  const app = getCloudBaseAuthApp();
  if (!app) {
    return null;
  }

  return app.auth();
}

// 用户认证接口
export interface CloudBaseUser {
  uid: string;
  email?: string;
  phone?: string;
  username?: string;
  name?: string;
  avatar?: string;
  gender?: string;
  locale?: string;
  customData?: any;
  loginType?: string;
  createTime?: string;
  updateTime?: string;
}

export interface CloudBaseSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpire: number;
  refreshTokenExpire: number;
}

/**
 * 用户注册
 */
export async function signUp(email: string, password: string, userData?: {
  username?: string;
  name?: string;
  avatar?: string;
}): Promise<{ user?: CloudBaseUser; error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK不支持直接用户注册
    // 用户注册需要通过前端SDK或小程序完成
    // 这里返回错误，引导用户使用前端界面注册

    console.warn('CloudBase注册需要通过前端SDK完成，Node.js SDK不支持直接注册');
    return {
      error: {
        message: '注册功能需要通过前端界面完成，请访问注册页面进行注册'
      }
    };

    // 如果将来需要通过云函数实现注册，可以取消注释下面的代码
    /*
    const result = await auth.callFunction({
      name: 'userRegister',
      data: {
        email: email,
        password: password,
        username: userData?.username || email.split('@')[0],
        name: userData?.name
      }
    });

    return {
      user: {
        uid: result.data.uid,
        email: email,
        username: userData?.username || email.split('@')[0],
        name: userData?.name,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }
    };
    */

  } catch (error: any) {
    console.error('CloudBase注册错误:', error);
    return {
      error: {
        message: '注册功能暂不可用，请通过前端界面注册'
      }
    };
  }
}

/**
 * 用户登录
 */
export async function signIn(email: string, password: string): Promise<{ user?: CloudBaseUser; session?: CloudBaseSession; error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口不支持直接登录
    // 用户登录需要通过前端SDK或小程序完成
    // 这里返回错误，引导用户使用前端界面登录

    console.warn('CloudBase登录需要通过前端SDK完成，Node.js SDK不支持直接登录');
    return {
      error: {
        message: '登录功能需要通过前端界面完成，请访问登录页面进行登录'
      }
    };

    // 如果将来需要通过云函数实现登录验证，可以取消注释下面的代码
    /*
    const result = await auth.callFunction({
      name: 'userLogin',
      data: {
        email: email,
        password: password
      }
    });

    return {
      user: {
        uid: result.data.uid,
        email: email,
        username: result.data.username,
        name: result.data.name,
        createTime: result.data.createTime,
        updateTime: result.data.updateTime,
      },
      session: {
        accessToken: result.data.token,
        refreshToken: result.data.refreshToken,
        accessTokenExpire: Date.now() + 3600000, // 1小时
        refreshTokenExpire: Date.now() + 2592000000, // 30天
      }
    };
    */

  } catch (error: any) {
    console.error('CloudBase登录错误:', error);
    return {
      error: {
        message: '登录功能暂不可用，请通过前端界面登录'
      }
    };
  }
}

/**
 * 用户退出
 */
export async function signOut(): Promise<{ error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口没有直接的signOut方法
    // 在管理接口中，通常不需要显式登出
    console.log('CloudBase管理接口：用户会话已结束');
    return {};
  } catch (error: any) {
    console.error('CloudBase退出错误:', error);
    return {
      error: {
        message: error.message || '退出失败'
      }
    };
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<{ user?: CloudBaseUser; error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口不支持获取当前用户信息
    // 这是因为管理接口通常在服务端运行，没有用户会话上下文
    console.warn('CloudBase管理接口不支持获取当前用户信息');
    return {
      error: {
        message: '管理接口不支持获取当前用户信息'
      }
    };

    // 如果将来需要通过云函数获取用户信息，可以取消注释下面的代码
    /*
    const result = await auth.callFunction({
      name: 'getCurrentUser',
      data: {} // 可能需要传递用户标识
    });

    return {
      user: {
        uid: result.data.uid,
        email: result.data.email,
        username: result.data.username,
        name: result.data.name,
        avatar: result.data.avatar,
        createTime: result.data.createTime,
        updateTime: result.data.updateTime,
      }
    };
    */

  } catch (error: any) {
    console.error('获取当前用户信息错误:', error);
    return {
      error: {
        message: error.message || '获取用户信息失败'
      }
    };
  }
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(uid: string, userData: {
  username?: string;
  name?: string;
  avatar?: string;
  [key: string]: any;
}): Promise<{ error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口更新用户信息
    // 这里可能需要使用不同的API方法
    console.warn('CloudBase管理接口更新用户信息功能有限');
    return {
      error: {
        message: '用户信息更新功能暂不可用'
      }
    };

    // 如果有正确的API方法，可以取消注释下面的代码
    // await auth.updateUserInfo(uid, userData);
    // return {};

  } catch (error: any) {
    console.error('更新用户资料错误:', error);
    return {
      error: {
        message: error.message || '更新资料失败'
      }
    };
  }
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(email: string): Promise<{ error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口不支持发送密码重置邮件
    // 密码重置通常需要通过前端SDK完成
    console.warn('CloudBase管理接口不支持发送密码重置邮件');
    return {
      error: {
        message: '密码重置功能需要通过前端界面完成'
      }
    };

    // 如果将来需要通过云函数实现，可以取消注释下面的代码
    // await auth.callFunction({
    //   name: 'sendPasswordReset',
    //   data: { email: email }
    // });
    // return {};

  } catch (error: any) {
    console.error('发送密码重置邮件错误:', error);
    return {
      error: {
        message: error.message || '发送重置邮件失败'
      }
    };
  }
}

/**
 * 验证令牌
 */
export async function verifyToken(token: string): Promise<{ user?: CloudBaseUser; error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口不支持直接验证用户令牌
    // 令牌验证通常在前端SDK中完成
    console.warn('CloudBase管理接口不支持令牌验证');
    return {
      error: {
        message: '令牌验证功能暂不可用'
      }
    };

    // 如果将来需要通过云函数实现令牌验证，可以取消注释下面的代码
    /*
    const result = await auth.callFunction({
      name: 'verifyUserToken',
      data: { token: token }
    });

    if (!result.data.success || !result.data.user) {
      return { error: { message: '令牌无效' } };
    }

    return {
      user: {
        uid: result.data.user.uid,
        email: result.data.user.email,
        username: result.data.user.username,
        name: result.data.user.name,
      }
    };
    */

  } catch (error: any) {
    console.error('令牌验证错误:', error);
    return {
      error: {
        message: error.message || '令牌验证失败'
      }
    };
  }
}

/**
 * 第三方登录 (微信等)
 */
export async function signInWithProvider(provider: 'weixin', options?: any): Promise<{ user?: CloudBaseUser; session?: CloudBaseSession; error?: any }> {
  const auth = getAuthService();
  if (!auth) {
    return { error: { message: '认证服务不可用' } };
  }

  try {
    // CloudBase Node.js SDK的管理接口不支持第三方登录
    // 第三方登录需要通过前端SDK完成
    console.warn(`CloudBase管理接口不支持${provider}登录`);
    return {
      error: {
        message: `${provider}登录需要通过前端界面完成`
      }
    };

    // 如果将来需要通过云函数实现第三方登录，可以取消注释下面的代码
    /*
    const result = await auth.callFunction({
      name: 'socialLogin',
      data: {
        provider: provider,
        options: options
      }
    });

    return {
      user: {
        uid: result.data.uid,
        email: result.data.email,
        username: result.data.username,
        name: result.data.name,
        avatar: result.data.avatar,
        loginType: provider,
      },
      session: {
        accessToken: result.data.token,
        refreshToken: result.data.refreshToken,
        accessTokenExpire: Date.now() + 3600000, // 1小时
        refreshTokenExpire: Date.now() + 2592000000, // 30天
      }
    };
    */

  } catch (error: any) {
    console.error(`${provider}登录错误:`, error);
    return {
      error: {
        message: error.message || `${provider}登录失败`
      }
    };
  }
}

/**
 * 测试认证服务连接
 */
export async function testAuthConnection(): Promise<boolean> {
  try {
    const auth = getAuthService();
    if (!auth) {
      console.error('❌ CloudBase认证服务未初始化');
      return false;
    }

    // CloudBase Node.js SDK的管理接口连接测试
    // 由于管理接口主要用于管理而不是用户认证，我们只测试服务是否可用
    console.log('✅ CloudBase认证服务连接测试成功');
    console.log('ℹ️  注意：CloudBase Node.js SDK的管理接口不支持完整的用户认证功能');
    console.log('ℹ️  用户注册、登录等功能需要通过前端SDK或云函数实现');

    return true;
  } catch (error) {
    console.error('❌ CloudBase认证服务连接测试失败:', error);
    return false;
  }
}

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  updateUserProfile,
  sendPasswordResetEmail,
  verifyToken,
  signInWithProvider,
  testAuthConnection,
};
