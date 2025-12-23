"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { initializeCloudBase, getAuth } from './cloudbase-frontend'
import {
  signUpWithEmail,
  signInWithEmail,
  signOut as signOutFromCloudBase,
  resetPassword,
  signInWithWechat,
  setupAuthStateListener
} from './cloudbase-auth-frontend'
// CloudBase认证API调用函数
async function apiCall(endpoint: string, data?: any) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'API调用失败');
  }

  return result;
}

// CloudBase用户类型
interface CloudBaseUser {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  createTime?: string;
  updateTime?: string;
}

interface CloudBaseSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpire: number;
  refreshTokenExpire: number;
}

// CloudBase类型定义（用于类型兼容）
interface CloudBaseUser {
  uid: string;
  email?: string;
  username?: string;
  name?: string;
  avatar?: string;
  createTime?: string;
  updateTime?: string;
}

interface CloudBaseSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpire: number;
  refreshTokenExpire: number;
}

interface AuthContextType {
  user: CloudBaseUser | null
  session: CloudBaseSession | null
  loading: boolean
  signUp: (email: string, password: string, userData?: { full_name?: string; username?: string }) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

// 获取认证提供商
function getAuthProvider(): 'supabase' | 'cloudbase' | 'mock' {
  // 在服务器端可以直接访问环境变量
  if (typeof window === 'undefined') {
    const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'cloudbase';
    return provider as 'supabase' | 'cloudbase' | 'mock';
  }

  // 在客户端，CloudBase环境默认使用cloudbase
  // 如果需要动态获取，可以通过API调用
  return 'cloudbase';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CloudBaseUser | null>(null)
  const [session, setSession] = useState<CloudBaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // CloudBase已在layout中初始化，这里不再重复初始化

      // CloudBase文档数据库模式下，从localStorage恢复认证状态
      if (mounted) {
        const savedUser = localStorage.getItem('cloudbase_user');
        const savedSession = localStorage.getItem('cloudbase_session');

        if (savedUser && savedSession) {
          try {
            const userData = JSON.parse(savedUser);
            const sessionData = JSON.parse(savedSession);

            // 检查session是否过期
            const now = Date.now();
            if (sessionData.accessTokenExpire > now) {
              console.log('从localStorage恢复用户认证状态');
              setUser(userData);
              setSession(sessionData);
            } else {
              console.log('Session已过期，清除本地存储');
              localStorage.removeItem('cloudbase_user');
              localStorage.removeItem('cloudbase_session');
              setUser(null);
              setSession(null);
            }
          } catch (parseError) {
            console.error('解析本地存储数据失败:', parseError);
            localStorage.removeItem('cloudbase_user');
            localStorage.removeItem('cloudbase_session');
            setUser(null);
            setSession(null);
          }
        } else {
          setUser(null);
          setSession(null);
        }

        setLoading(false);
      }
    } catch (error) {
      console.error('CloudBase初始化失败:', error);
      if (mounted) {
        setUser(null);
        setSession(null);
        setLoading(false);
      }
    }

    // 设置认证状态监听器（CloudBase模式下返回null）
    const unsubscribe = setupAuthStateListener((user) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, [])


  const signUp = async (email: string, password: string, userData?: { full_name?: string; username?: string }) => {
    console.log('auth-context signUp called with:', { email, userData });
    const result = await signUpWithEmail(email, password, userData);
    console.log('signUpWithEmail result:', result);
    if (result.success && result.user) {
      setUser(result.user);
      return { success: true, user: result.user };
    } else {
      console.log('signUp returning error:', result.error);
      return { success: false, error: result.error };
    }
  }

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    if (result.success && result.user) {
      setUser(result.user);
      setSession(result.session);

      // 保存到localStorage以实现持久化登录状态
      try {
        localStorage.setItem('cloudbase_user', JSON.stringify(result.user));
        if (result.session) {
          localStorage.setItem('cloudbase_session', JSON.stringify(result.session));
        }
        console.log('用户认证状态已保存到localStorage');
      } catch (storageError) {
        console.error('保存认证状态到localStorage失败:', storageError);
      }

      return { error: null };
    } else {
      return { error: { message: result.error } };
    }
  }

  const signOut = async () => {
    const result = await signOutFromCloudBase();
    if (result.success) {
      setUser(null);
      setSession(null);

      // 清除localStorage中的认证状态
      try {
        localStorage.removeItem('cloudbase_user');
        localStorage.removeItem('cloudbase_session');
        console.log('用户认证状态已从localStorage清除');
      } catch (storageError) {
        console.error('清除localStorage认证状态失败:', storageError);
      }
    }
  }

  const resetPassword = async (email: string) => {
    const result = await resetPassword(email);
    if (result.success) {
      return { error: null };
    } else {
      return { error: { message: result.error } };
    }
  }


  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}