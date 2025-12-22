import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/auth"
import { query, add, update } from "@/lib/database/cloudbase"

// POST: 添加消息到对话
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 使用CloudBase认证
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user

    const { id } = await params
    const conversationId = id
    const body = await request.json()
    const { role, content } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      )
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // 验证对话属于当前用户
    const conversationResult = await query("conversations", {
      where: {
        _id: conversationId,
        user_id: user.id
      },
      limit: 1
    })

    if (!conversationResult.data || conversationResult.data.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    // 添加消息
    const messageData = {
      conversation_id: conversationId,
      role,
      content,
      created_at: new Date().toISOString()
    }

    const messageResult = await add("conversation_messages", messageData)

    const message = {
      id: messageResult.id,
      ...messageData
    }

    // 更新对话的 updated_at
    const conversationDocId = conversationResult.data[0]._id
    await update("conversations", conversationDocId, {
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message,
    })
  } catch (error: any) {
    console.error("Add message error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

