/**
 * 客户端环境变量获取工具
 * 在腾讯云部署时，通过 API 获取环境变量而不是直接访问 process.env
 */

interface PublicEnv {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  NEXT_PUBLIC_APP_URL: string
}

let envCache: PublicEnv | null = null
let envPromise: Promise<PublicEnv> | null = null

/**
 * 从 API 获取环境变量
 */
async function fetchEnvFromAPI(): Promise<PublicEnv> {
  try {
    const response = await fetch('/api/env', {
      cache: 'force-cache', // 使用浏览器缓存
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch env: ${response.statusText}`)
    }

    const env = await response.json()
    return env as PublicEnv
  } catch (error) {
    console.error('Failed to fetch environment variables from API:', error)
    // 如果 API 失败，尝试使用 process.env（开发环境）
    if (typeof window === 'undefined') {
      // 服务器端回退
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
      }
    }
    // 客户端回退
    return {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_APP_URL: '',
    }
  }
}

/**
 * 获取环境变量（带缓存）
 * 首次调用会从 API 获取，后续调用直接返回缓存
 */
export async function getPublicEnv(): Promise<PublicEnv> {
  // 如果已有缓存，直接返回
  if (envCache) {
    return envCache
  }

  // 如果正在请求中，等待该请求完成
  if (envPromise) {
    return envPromise
  }

  // 创建新的请求
  envPromise = fetchEnvFromAPI()
  envCache = await envPromise
  envPromise = null

  return envCache
}

/**
 * 同步获取环境变量（仅在客户端使用）
 * 注意：此方法需要在组件挂载后调用，确保 envCache 已初始化
 */
export function getPublicEnvSync(): PublicEnv {
  if (!envCache) {
    // 如果缓存未初始化，尝试从 process.env 获取（开发环境回退）
    if (typeof window !== 'undefined') {
      // 客户端：如果缓存未初始化，返回空值（应该先调用 getPublicEnv）
      console.warn('Environment variables not initialized. Call getPublicEnv() first.')
      return {
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
        NEXT_PUBLIC_APP_URL: '',
      }
    } else {
      // 服务器端：直接使用 process.env
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '',
      }
    }
  }
  return envCache
}

/**
 * 清除环境变量缓存（用于测试或强制刷新）
 */
export function clearEnvCache(): void {
  envCache = null
  envPromise = null
}






