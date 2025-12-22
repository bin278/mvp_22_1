"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function GitHubSetupPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const setupSteps = [
    {
      title: "1. 创建 GitHub OAuth App",
      description: "在 GitHub 上创建 OAuth 应用程序",
      content: (
        <div className="space-y-4">
          <p>访问 <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub Developer Settings</a></p>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">应用配置：</h4>
            <ul className="space-y-2 text-sm">
              <li><strong>Application name:</strong> mornFront</li>
              <li><strong>Homepage URL:</strong> http://localhost:3000</li>
              <li><strong>Authorization callback URL:</strong> http://localhost:3000/api/github/callback</li>
            </ul>
          </div>

          <Button asChild>
            <a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              前往 GitHub 创建应用
            </a>
          </Button>
        </div>
      )
    },
    {
      title: "2. 获取应用凭据",
      description: "复制 Client ID 和 Client Secret",
      content: (
        <div className="space-y-4">
          <p>创建应用后，复制以下信息：</p>

          <div className="space-y-2">
            <Label>Client ID</Label>
            <div className="flex gap-2">
              <Input value="your_github_client_id_here" readOnly className="font-mono text-sm" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard("your_github_client_id_here", "Client ID")}
              >
                {copied === "Client ID" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client Secret</Label>
            <div className="flex gap-2">
              <Input value="your_github_client_secret_here" readOnly className="font-mono text-sm" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard("your_github_client_secret_here", "Client Secret")}
              >
                {copied === "Client Secret" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "3. 配置环境变量",
      description: "在项目中设置环境变量",
      content: (
        <div className="space-y-4">
          <p>在项目根目录创建或编辑 <code className="bg-gray-100 px-1 rounded">.env.local</code> 文件：</p>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <pre>{`# GitHub OAuth 配置
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
          </div>

          <Button
            variant="outline"
            onClick={() => copyToClipboard(`# GitHub OAuth 配置
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000`, "env config")}
          >
            {copied === "env config" ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            复制配置
          </Button>
        </div>
      )
    },
    {
      title: "4. 重启开发服务器",
      description: "应用新的环境变量配置",
      content: (
        <div className="space-y-4">
          <p>保存环境变量文件后，重启开发服务器：</p>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
            <pre>{`# 停止当前服务器 (Ctrl+C)
# 然后重新启动
pnpm dev`}</pre>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              重要：每次修改环境变量后都需要重启服务器。
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: "5. 测试连接",
      description: "验证 GitHub 集成是否正常工作",
      content: (
        <div className="space-y-4">
          <p>配置完成后，测试 GitHub 连接：</p>

          <div className="space-y-2">
            <Link href="/debug" target="_blank">
              <Button variant="outline" className="w-full">
                🐛 打开调试页面
              </Button>
            </Link>

            <Link href="/generate" target="_blank">
              <Button variant="outline" className="w-full">
                🔍 测试 GitHub 连接
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            在生成页面点击 "Connect GitHub" 按钮测试连接。
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">GitHub OAuth 设置指南</h1>
          <p className="text-muted-foreground">
            按照以下步骤配置 GitHub 集成，一键推送代码到仓库
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>注意：</strong> GitHub OAuth 功能是可选的。如果不需要推送到 GitHub，可以跳过此配置。
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {setupSteps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </span>
                  {step.title}
                </CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {step.content}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>故障排除</CardTitle>
            <CardDescription>常见问题和解决方案</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">问题：点击 "Connect GitHub" 后无反应</h4>
              <p className="text-sm text-muted-foreground mb-2">解决方案：</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 检查环境变量是否正确设置</li>
                <li>• 确认开发服务器已重启</li>
                <li>• 访问 <Link href="/debug" className="text-blue-600 hover:underline">调试页面</Link> 检查配置</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">问题：GitHub OAuth 回调失败</h4>
              <p className="text-sm text-muted-foreground mb-2">解决方案：</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 确保回调 URL 与 GitHub App 配置一致</li>
                <li>• 检查 NEXT_PUBLIC_APP_URL 是否正确</li>
                <li>• 验证 Supabase 数据库表是否已创建</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">问题：推送代码到 GitHub 失败</h4>
              <p className="text-sm text-muted-foreground mb-2">解决方案：</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• 运行 supabase-github-schema.sql 创建数据库表</li>
                <li>• 确保用户已连接 GitHub 账户</li>
                <li>• 检查仓库名称是否已存在</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/generate">
            <Button size="lg">
              完成设置，返回生成页面
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}




























