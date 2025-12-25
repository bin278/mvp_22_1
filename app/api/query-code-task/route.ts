import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getDatabase } from '@/lib/database/cloudbase'

interface JWTPayload {
  userId?: string
  openid?: string  // 兼容旧格式
  exp: number
}

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: -1, msg: '未授权访问' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

    // 验证JWT并解析openid
    let decoded: JWTPayload
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (err) {
      return NextResponse.json(
        { code: -1, msg: 'Token无效' },
        { status: 401 }
      )
    }

    // 支持userId和openid两种格式（向后兼容）
    const openid = decoded.userId || decoded.openid
    if (!openid) {
      return NextResponse.json(
        { code: -1, msg: 'Token缺少用户标识' },
        { status: 401 }
      )
    }
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { code: -1, msg: 'taskId参数缺失' },
        { status: 400 }
      )
    }

    // 初始化CloudBase数据库
    console.log('🔗 初始化CloudBase数据库连接...')
    const db = getDatabase()
    if (!db) {
      console.error('❌ CloudBase数据库初始化失败')
      return NextResponse.json(
        { code: -1, msg: '数据库连接失败' },
        { status: 500 }
      )
    }
    console.log('✅ CloudBase数据库连接成功')

    const tasksCollection = db.collection('ai_code_tasks')
    console.log('📋 获取ai_code_tasks集合')

    // 核心：按taskId+openid过滤，实现数据隔离
    const taskRes = await tasksCollection
      .where({ taskId, openid })
      .field({ code: true, status: true, errorMsg: true, finishTime: true })
      .get()

    if (taskRes.data.length === 0) {
      return NextResponse.json({
        code: -1,
        msg: '任务不存在或无权限访问'
      })
    }

    const task = taskRes.data[0]

    return NextResponse.json({
      code: 0,
      data: {
        code: task.code,
        status: task.status,
        errorMsg: task.errorMsg,
        finishTime: task.finishTime
      }
    })

  } catch (err: any) {
    console.error('查询任务失败:', err)
    return NextResponse.json(
      { code: -1, msg: '查询任务失败', error: err.message },
      { status: 500 }
    )
  }
}
