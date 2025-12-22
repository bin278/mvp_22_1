// CloudBase前端认证功能
import { getAuth, getDatabase } from './cloudbase-frontend';

// 邮箱格式验证
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 用户注册（通过API路由处理）
export const signUpWithEmail = async (email: string, password: string, userData?: { full_name?: string }) => {
  console.log('开始注册流程，邮箱:', email);

  // 验证邮箱格式
  if (!validateEmail(email)) {
    return {
      success: false,
      error: '邮箱格式不正确，请输入有效的邮箱地址'
    };
  }

  // 验证密码长度
  if (!password || password.length < 6) {
    return {
      success: false,
      error: '密码长度至少6位'
    };
  }

  try {
    // 通过API路由处理注册，避免前端直接访问数据库
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        fullName: userData?.full_name || ''
      }),
    });

    const result = await response.json();
    console.log('API响应状态:', response.status, '响应数据:', result);

    if (!response.ok) {
      console.log('API响应失败:', response.status, result);
      return {
        success: false,
        error: result.error || '注册失败'
      };
    }

    console.log('用户注册成功');
    return {
      success: true,
      user: result.user
    };

  } catch (error: any) {
    console.error('注册失败:', error);

    let errorMessage = '注册失败，请稍后重试';

    if (error && typeof error === 'object') {
      errorMessage = error.message || error.msg || error.error || error.code || error.toString() || errorMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// 用户登录（验证邮箱和密码）
export const signInWithEmail = async (email: string, password: string) => {
  console.log('开始登录流程，邮箱:', email);

  // 验证邮箱格式
  if (!validateEmail(email)) {
    return {
      success: false,
      error: '邮箱格式不正确，请输入有效的邮箱地址'
    };
  }

  // 验证密码
  if (!password) {
    return {
      success: false,
      error: '请输入密码'
    };
  }

  try {
    // 通过API路由处理登录，避免前端直接访问数据库
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || '登录失败'
      };
    }

    console.log('登录成功');
    return {
      success: true,
      user: result.user,
      session: result.session
    };

  } catch (error: any) {
    console.error('登录失败:', error);

    let errorMessage = '登录失败，请稍后重试';

    if (error && typeof error === 'object') {
      errorMessage = error.message || error.msg || error.error || error.code || error.toString() || errorMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// 用户登出（简化版）
export const signOut = async () => {
  console.log('用户登出');
  return { success: true };
};

// 监听认证状态变化（简化版）
export const setupAuthStateListener = (callback: (user: any) => void) => {
  // CloudBase文档数据库模式下，我们不使用自动状态监听
  // 用户状态通过手动登录/登出管理
  console.log('CloudBase文档数据库模式，不支持自动状态监听');
  return null;
};