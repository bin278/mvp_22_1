import { NextRequest, NextResponse } from 'next/server'
import { add, query, update } from '@/lib/database/cloudbase'

/**
 * Handle GitHub OAuth callback
 * GET /api/github/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=${encodeURIComponent(error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=missing_parameters`
    )
  }

  try {
    // Decode state to get userId
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const userId = stateData.userId

    if (!userId) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for access token
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth not configured')
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received')
    }

    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user info')
    }

    const githubUser = await userResponse.json()

    // Store GitHub token in CloudBase
    try {
      // 检查是否已存在GitHub token记录
      const existingToken = await query('user_github_tokens', {
        where: { user_id: userId },
        limit: 1
      })

      if (existingToken.data && existingToken.data.length > 0) {
        // 更新现有记录
        await update('user_github_tokens', existingToken.data[0]._id, {
          github_token: accessToken,
          github_username: githubUser.login,
          updated_at: new Date().toISOString(),
        })
        console.log('Updated existing GitHub token for user:', userId)
      } else {
        // 创建新记录
        await add('user_github_tokens', {
          user_id: userId,
          github_token: accessToken,
          github_username: githubUser.login,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        console.log('Created new GitHub token for user:', userId)
      }
    } catch (dbError: any) {
      console.error('Error storing GitHub token in CloudBase:', dbError)
      // 如果集合不存在或其他错误，重定向并显示警告
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}&github_warning=db_error`
      )
    }

    // Redirect back to generate page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_connected=true&github_username=${githubUser.login}`
    )
  } catch (error: any) {
    console.error('Error handling GitHub callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/generate?github_error=${encodeURIComponent(error.message)}`
    )
  }
}

