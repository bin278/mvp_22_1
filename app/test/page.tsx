'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TestResult {
  status: 'loading' | 'success' | 'error'
  message: string
  data?: any
}

export default function TestPage() {
  const [connectionTest, setConnectionTest] = useState<TestResult>({ status: 'loading', message: '测试中...' })
  const [authTest, setAuthTest] = useState<TestResult>({ status: 'loading', message: '测试中...' })
  const [dbTest, setDbTest] = useState<TestResult>({ status: 'loading', message: '测试中...' })
  const [envTest, setEnvTest] = useState<TestResult>({ status: 'loading', message: '测试中...' })

  useEffect(() => {
    testConnection()
    testAuth()
    testDatabase()
    testEnvironment()
  }, [])

  const testConnection = async () => {
    try {
      // 测试基本的连接
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })

      if (error) {
        setConnectionTest({
          status: 'error',
          message: `连接失败: ${error.message}`,
          data: error
        })
      } else {
        setConnectionTest({
          status: 'success',
          message: '数据库连接成功!',
          data: { connection: 'OK' }
        })
      }
    } catch (error: any) {
      setConnectionTest({
        status: 'error',
        message: `连接错误: ${error.message}`,
        data: error
      })
    }
  }

  const testAuth = async () => {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setAuthTest({
          status: 'error',
          message: `认证测试失败: ${error.message}`,
          data: error
        })
      } else {
        setAuthTest({
          status: 'success',
          message: `认证系统正常`,
          data: { session: data.session ? '已登录' : '未登录' }
        })
      }
    } catch (error: any) {
      setAuthTest({
        status: 'error',
        message: `认证错误: ${error.message}`,
        data: error
      })
    }
  }

  const testDatabase = async () => {
    try {
      // 尝试查询 profiles 表（如果存在的话）
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)

      if (error) {
        setDbTest({
          status: 'error',
          message: `数据库查询失败: ${error.message}`,
          data: error
        })
      } else {
        setDbTest({
          status: 'success',
          message: `数据库查询成功!`,
          data: { records: data?.length || 0 }
        })
      }
    } catch (error: any) {
      setDbTest({
        status: 'error',
        message: `数据库错误: ${error.message}`,
        data: error
      })
    }
  }

  const testEnvironment = async () => {
    try {
      const response = await fetch('/api/test')
      const data = await response.json()

      if (response.ok) {
        setEnvTest({
          status: 'success',
          message: '环境变量配置检查完成',
          data: data.environment
        })
      } else {
        setEnvTest({
          status: 'error',
          message: '环境变量检查失败',
          data: data
        })
      }
    } catch (error: any) {
      setEnvTest({
        status: 'error',
        message: `环境变量检查错误: ${error.message}`,
        data: error
      })
    }
  }

  const TestResult = ({ title, result }: { title: string, result: TestResult }) => (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className={`text-sm ${
        result.status === 'success' ? 'text-green-600' :
        result.status === 'error' ? 'text-red-600' :
        'text-blue-600'
      }`}>
        <p>{result.message}</p>
        {result.data && (
          <details className="mt-2">
            <summary className="cursor-pointer">查看详情</summary>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">系统配置测试</h1>

        <div className="space-y-6">
          <TestResult title="🔧 环境变量配置测试" result={envTest} />
          <TestResult title="🔗 Supabase 数据库连接测试" result={connectionTest} />
          <TestResult title="🔐 Supabase 认证系统测试" result={authTest} />
          <TestResult title="📊 Supabase 数据库查询测试" result={dbTest} />
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold mb-2">📝 测试说明</h2>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>连接测试</strong>: 验证是否能连接到 Supabase 数据库</li>
            <li>• <strong>认证测试</strong>: 检查认证系统是否正常工作</li>
            <li>• <strong>数据库查询测试</strong>: 尝试查询 profiles 表（需要先运行 SQL 脚本）</li>
          </ul>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              如果测试失败，请确保：
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside mt-1">
              <li>.env.local 文件中的环境变量已正确填写</li>
              <li>Supabase 项目已创建并运行中</li>
              <li>数据库表已通过 supabase-schema.sql 创建</li>
            </ol>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
