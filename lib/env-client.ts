/**
 * 客户端环境变量获取工具
 * 在腾讯云CloudBase部署时，通过 API 获取环境变量而不是直接访问 process.env
 */

interface PublicEnv {
  // 应用配置
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID?: string
  NEXT_PUBLIC_WECHAT_APP_ID?: string

  // 部署环境信息
  DEPLOYMENT_REGION?: string
  NODE_ENV?: string
}

let envCache: PublicEnv | null = null
let envPromise: Promise<PublicEnv> | null = null

/**
 * 从 API 获取环境变量
 */
async function fetchEnvFromAPI(): Promise<PublicEnv> {
  try {
    const response = await fetch('/api/env', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 使用浏览器缓存，避免每次都请求
      cache: 'force-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch env: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'API returned error')
    }

    return data.env as PublicEnv
  } catch (error) {
    console.error('Failed to fetch environment variables from API:', error)
    // 如果 API 失败，使用开发环境回退值
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: process.env.NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID || '',
      NEXT_PUBLIC_WECHAT_APP_ID: process.env.NEXT_PUBLIC_WECHAT_APP_ID || '',
      DEPLOYMENT_REGION: process.env.DEPLOYMENT_REGION || 'cn',
      NODE_ENV: process.env.NODE_ENV || 'development',
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
    // 如果缓存未初始化，返回开发环境默认值
    console.warn('Environment variables not initialized. Call getPublicEnv() first.')
    return {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID: '',
      NEXT_PUBLIC_WECHAT_APP_ID: '',
      DEPLOYMENT_REGION: 'cn',
      NODE_ENV: 'development',
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






