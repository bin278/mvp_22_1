import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cloudbase } from '@/lib/cloudbase'

interface JWTPayload {
  openid: string
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

    const { openid } = decoded
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { code: -1, msg: 'taskId参数缺失' },
        { status: 400 }
      )
    }

    // 初始化CloudBase数据库
    const db = cloudbase.database()
    const tasksCollection = db.collection('ai_code_tasks')

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
