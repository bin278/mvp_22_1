import { useState, useEffect } from 'react'
import { getPublicEnv, PublicEnv } from '@/lib/env-client'

/**
 * React Hook: 在客户端组件中获取环境变量
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { env, loading } = useEnv()
 *   
 *   if (loading) return <div>Loading...</div>
 *   
 *   return <div>Supabase URL: {env.NEXT_PUBLIC_SUPABASE_URL}</div>
 * }
 * ```
 */
export function useEnv() {
  const [env, setEnv] = useState<PublicEnv | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadEnv() {
      try {
        const publicEnv = await getPublicEnv()
        if (mounted) {
          setEnv(publicEnv)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load environment variables'))
          setLoading(false)
        }
      }
    }

    loadEnv()

    return () => {
      mounted = false
    }
  }, [])

  return { env, loading, error }
}






