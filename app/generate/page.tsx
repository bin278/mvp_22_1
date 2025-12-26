"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download, ArrowLeft, Check, Eye, Code2, Keyboard, X, RefreshCw, AlertCircle, Zap, Github } from "lucide-react"
import Link from "next/link"
import { downloadAsProperZip } from "@/lib/download-helper"
import { ProtectedRoute } from "@/components/protected-route"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import type { GeneratedProject } from "@/lib/code-generator"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ConversationSidebar } from "@/components/conversation-sidebar"
import { ModelSelector } from "@/components/model-selector"
import { SUBSCRIPTION_TIERS, getDefaultModel, AVAILABLE_MODELS, canUseModel, type SubscriptionTier } from "@/lib/subscription-tiers"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// 异步任务状态接口
interface TaskStatus {
  taskId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  result?: any
  error?: string
}

const translations = {
  en: {
    back: "Back to Home",
    title: "Generate Frontend UI",
    subtitle: "Describe your UI idea and get production-ready React code instantly",
    placeholder: 'Describe your UI... e.g., "A modern pricing page with 3 tiers and a dark theme"',
    generate: "Generate UI Code",
    generating: "Generating...",
    generatedCode: "Generated Code",
    preview: "Preview",
    copy: "Copy Main File",
    copied: "Copied!",
    download: "Download Project",
    downloadAll: "Download All Files",
    note: "Note: This platform generates frontend UI code only (React/Next.js components)",
    fileCount: "files generated",
    viewCode: "View Code",
    viewPreview: "View Preview",
    connectGithub: "Connect GitHub",
    pushToGithub: "Push to GitHub",
    githubConnected: "GitHub Connected",
    githubNotConnected: "GitHub Not Connected",
    repoName: "Repository Name",
    repoDescription: "Description (optional)",
    isPrivate: "Private Repository",
    pushSuccess: "Successfully pushed to GitHub!",
    pushError: "Failed to push to GitHub",
  },
  zh: {
    back: "返回首页",
    title: "生成前端界面",
    subtitle: "描述你的界面想法，立即获得可用于生产环境的 React 代码",
    placeholder: '描述你的界面... 例如："一个现代化的定价页面，包含3个等级和深色主题"',
    generate: "生成界面代码",
    generating: "生成中...",
    generatedCode: "生成的代码",
    preview: "预览",
    copy: "复制主文件",
    copied: "已复制！",
    download: "下载项目",
    downloadAll: "下载所有文件",
    note: "注意：本平台仅生成前端界面代码（React/Next.js 组件）",
    fileCount: "个文件已生成",
    viewCode: "查看代码",
    viewPreview: "查看预览",
    connectGithub: "连接 GitHub",
    pushToGithub: "推送到 GitHub",
    githubConnected: "GitHub 已连接",
    githubNotConnected: "GitHub 未连接",
    repoName: "仓库名称",
    repoDescription: "描述（可选）",
    isPrivate: "私有仓库",
    pushSuccess: "成功推送到 GitHub！",
    pushError: "推送到 GitHub 失败",
  },
}

export default function GeneratePage() {
  return (
    <ProtectedRoute>
      <GeneratePageContent />
    </ProtectedRoute>
  )
}

function GeneratePageContent() {
  // Initialize with "en" to ensure SSR/CSR consistency
  const [language, setLanguage] = useState<"en" | "zh">("en")
  const [isMounted, setIsMounted] = useState(false)

  // Load language preference from localStorage after mount
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      try {
        const savedLanguage = localStorage.getItem('language') as "en" | "zh" | null
        if (savedLanguage === "en" || savedLanguage === "zh") {
          setLanguage(savedLanguage)
        }

        // 获取保存的模型选择
        const savedModel = localStorage.getItem('selectedModel')
        if (savedModel && savedModel in AVAILABLE_MODELS) {
          setSelectedModel(savedModel)
        }

        // 从后端API获取用户的实际订阅等级
        fetchUserSubscriptionTier()
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  // 获取用户订阅等级
  const fetchUserSubscriptionTier = async () => {
    try {
      if (authSession?.accessToken) {
        console.log('🔍 Fetching user subscription tier...');
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${authSession.accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('📊 Subscription status response:', data);
          if (data.success && data.subscription?.planType) {
            const serverTier = data.subscription.planType;
            console.log(`👤 User tier updated: ${userSubscriptionTier} -> ${serverTier}`);
            setUserSubscriptionTier(serverTier)
            // 如果当前选择的模型不适用于新等级，则切换到默认模型
            if (!canUseModel(serverTier, selectedModel)) {
              const newModel = getDefaultModel(serverTier);
              console.log(`🔄 Model switched due to tier change: ${selectedModel} -> ${newModel}`);
              setSelectedModel(newModel)
            }
          } else {
            console.log('⚠️ Invalid subscription response format:', data);
          }
        } else {
          console.log('❌ Failed to fetch subscription status:', response.status);
        }
      } else {
        console.log('⚠️ No auth token available for subscription check');
      }
    } catch (error) {
      console.error('Failed to fetch user subscription tier:', error)
      // 出错时保持默认的free等级
    }
  }


  const handleLanguageChange = (newLanguage: "en" | "zh") => {
    setLanguage(newLanguage)
    // Save language preference to localStorage when user changes it
    if (isMounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('language', newLanguage)
      } catch (error) {
        console.error('Error saving language to localStorage:', error)
      }
    }
  }
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string>("src/App.tsx")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [showTips, setShowTips] = useState(false)

  // 分段生成状态
  const [currentSegment, setCurrentSegment] = useState<number>(0)
  const [totalSegments, setTotalSegments] = useState<number>(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [previewPrompt, setPreviewPrompt] = useState<string>("")
  const [generationWarning, setGenerationWarning] = useState<string>("")
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [modifyInstruction, setModifyInstruction] = useState("")
  const [modifyingCode, setModifyingCode] = useState("")
  const [isModifying, setIsModifying] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  // 异步任务相关状态
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [asyncTaskId, setAsyncTaskId] = useState<string | null>(null)
  const [generationMode, setGenerationMode] = useState<'streaming' | 'async' | 'hybrid'>('streaming')
  const [asyncProgress, setAsyncProgress] = useState<number>(0)

  // 模型选择和订阅状态
  const [selectedModel, setSelectedModel] = useState<string>(getDefaultModel('free'))
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<SubscriptionTier>('free')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewScale, setPreviewScale] = useState(1)
  const [isLivePreviewEnabled, setIsLivePreviewEnabled] = useState(true)
  const [lastPreviewCode, setLastPreviewCode] = useState<string>('')
  const [streamingCode, setStreamingCode] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previewRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualRefreshRef = useRef<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sseRef = useRef<EventSource | null>(null)

  // 解析markdown链接的函数
  const renderContentWithLinks = (content: string) => {
    // 匹配markdown链接格式 [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      // 添加链接
      const [fullMatch, text, url] = match
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          {text}
        </a>
      )

      lastIndex = match.index + fullMatch.length
    }

    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    // 如果没有链接，返回原始内容
    return parts.length > 0 ? parts : content
  }

  // GitHub integration state
  const { session: authSession } = useAuth()
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [showPushDialog, setShowPushDialog] = useState(false)
  const [repoName, setRepoName] = useState("")
  const [repoDescription, setRepoDescription] = useState("")
  const [repoNameError, setRepoNameError] = useState("")
  const [isPrivateRepo, setIsPrivateRepo] = useState(false)
  const [isPushing, setIsPushing] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)

  // 当用户登录状态改变时，获取订阅等级
  useEffect(() => {
    if (authSession?.accessToken) {
      fetchUserSubscriptionTier()
    } else {
      setUserSubscriptionTier('free')
      // 未登录时，如果当前模型不适用于free等级，则切换
      if (!canUseModel('free', selectedModel)) {
        setSelectedModel(getDefaultModel('free'))
      }
    }
  }, [authSession?.accessToken])
  
  // Conversation management
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const t = translations[language]

  // 验证 GitHub 仓库名称格式
  const validateRepoName = (name: string): string => {
    if (!name.trim()) {
      return language === 'en' ? 'Repository name is required' : '仓库名称不能为空'
    }

    const trimmedName = name.trim()

    // 检查长度
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return language === 'en'
        ? 'Repository name must be between 1 and 100 characters'
        : '仓库名称长度必须在1-100个字符之间'
    }

    // 检查字符格式：只允许字母、数字、连字符、下划线、点
    const validPattern = /^[a-zA-Z0-9._-]+$/
    if (!validPattern.test(trimmedName)) {
      return language === 'en'
        ? 'Repository name can only contain letters, numbers, hyphens (-), underscores (_), and dots (.)'
        : '仓库名称只能包含字母、数字、连字符（-）、下划线（_）和点（.）'
    }

    // 检查不能以连字符开头或结尾
    if (trimmedName.startsWith('-') || trimmedName.endsWith('-')) {
      return language === 'en'
        ? 'Repository name cannot start or end with a hyphen'
        : '仓库名称不能以连字符开头或结尾'
    }

    // 检查是否包含连续的连字符
    if (trimmedName.includes('--')) {
      return language === 'en'
        ? 'Repository name cannot contain consecutive hyphens'
        : '仓库名称不能包含连续的连字符'
    }

    return ''
  }

  // 保存消息到数据库
  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!currentConversationId || !authSession?.accessToken) return

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.accessToken}`,
        },
        body: JSON.stringify({ role, content }),
      })

      if (!response.ok) {
        console.error("Failed to save message")
      }
    } catch (error) {
      console.error("Error saving message:", error)
    }
  }

  const saveMessageToConversation = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    if (!conversationId || !authSession?.accessToken) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.accessToken}`,
        },
        body: JSON.stringify({ role, content }),
      })

      if (!response.ok) {
        console.error("Failed to save message to conversation")
      } else {
        console.log(`✅ Saved ${role} message to conversation ${conversationId}`)
      }
    } catch (error) {
      console.error("Error saving message to conversation:", error)
    }
  }

  // 保存文件到数据库
  const saveFiles = async (files: Record<string, string>) => {
    if (!currentConversationId || !authSession?.accessToken || !files) return

    try {
      const fileArray = Object.entries(files).map(([file_path, file_content]) => ({
        file_path,
        file_content,
      }))

      const response = await fetch(`/api/conversations/${currentConversationId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.accessToken}`,
        },
        body: JSON.stringify({ files: fileArray }),
      })

      if (!response.ok) {
        console.error("Failed to save files")
      }
    } catch (error) {
      console.error("Error saving files:", error)
    }
  }

  const saveFilesToConversation = async (conversationId: string, files: Record<string, string>) => {
    if (!conversationId || !authSession?.accessToken || !files) return

    try {
      const fileArray = Object.entries(files).map(([file_path, file_content]) => ({
        file_path,
        file_content,
      }))

      const response = await fetch(`/api/conversations/${conversationId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession.accessToken}`,
        },
        body: JSON.stringify({ files: fileArray }),
      })

      if (!response.ok) {
        console.error("Failed to save files to conversation")
      } else {
        console.log(`✅ Saved ${fileArray.length} files to conversation ${conversationId}`)
      }
    } catch (error) {
      console.error("Error saving files to conversation:", error)
    }
  }

  // 加载对话
  const loadConversation = async (conversationId: string | null) => {
    if (!conversationId || !authSession?.accessToken) {
      // 清空当前对话
      setMessages([])
      setGeneratedProject(null)
      setPrompt("")
      setModifyInstruction("")
      setPreviewUrl("")
      setCurrentConversationId(null)
      return
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${authSession.accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // 加载消息
        const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(loadedMessages)

        // 加载文件
        if (data.files && data.files.length > 0) {
          const files: Record<string, string> = {}
          data.files.forEach((file: any) => {
            files[file.file_path] = file.file_content
          })
          
          setGeneratedProject({
            projectName: data.conversation.title || "Loaded Project",
            files,
          })
          setSelectedFile(Object.keys(files)[0] || "src/App.tsx")
        } else {
          setGeneratedProject(null)
        }

        setCurrentConversationId(conversationId)
      } else {
        console.error("Failed to load conversation")
      }
    } catch (error) {
      console.error("Error loading conversation:", error)
    }
  }

  // 处理选择对话
  const handleSelectConversation = async (conversationId: string | null) => {
    await loadConversation(conversationId)
  }

  const suggestedPrompts = language === "en" ? [
    "Create a modern todo list with dark mode toggle",
    "Build a weather app with city search and forecast",
    "Design a responsive landing page for a SaaS product",
    "Make an e-commerce product card with add to cart",
    "Create a user dashboard with charts and metrics",
    "Build a contact form with validation",
    "Design a blog post layout with author info",
    "Create a photo gallery with lightbox modal",
    "Build a pricing comparison table",
    "Make a responsive navigation menu"
  ] : [
    "创建一个现代化的待办事项列表，带深色模式切换",
    "构建一个带城市搜索和天气预报的应用",
    "设计一个 SaaS 产品的响应式落地页",
    "制作一个电商产品卡片，带添加到购物车功能",
    "创建一个用户仪表板，带图表和指标",
    "构建一个带验证的联系表单",
    "设计一个博客文章布局，带作者信息",
    "创建一个带灯箱模态框的图片画廊",
    "制作一个定价对比表格",
    "创建一个响应式的导航菜单"
  ]

  // Load prefilled prompt from localStorage
  useEffect(() => {
    const prefillPrompt = localStorage.getItem('prefillPrompt')
    if (prefillPrompt) {
      setPrompt(prefillPrompt)
      localStorage.removeItem('prefillPrompt') // Clear it after use
    }
  }, [])

  // Session is now handled by auth context

  // Check GitHub connection status
  useEffect(() => {
    const checkGithubStatus = async () => {
      if (!authSession?.accessToken) return

      try {
        const response = await fetch('/api/github/status', {
          headers: {
            'Authorization': `Bearer ${authSession.accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setGithubConnected(data.connected)
          setGithubUsername(data.username || null)
        } else {
          // If status check fails, assume GitHub is not configured
          setGithubConnected(false)
          setGithubUsername(null)
        }
      } catch (error) {
        console.error('Error checking GitHub status:', error)
        setGithubConnected(false)
        setGithubUsername(null)
      }
    }

    checkGithubStatus()

    // Check URL parameters for GitHub OAuth callback
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('github_connected') === 'true') {
      const username = urlParams.get('github_username')
      const warning = urlParams.get('github_warning')

      if (username) {
        setGithubConnected(true)
        setGithubUsername(username)

        // Show warning if token storage failed
        if (warning) {
          const message = warning === 'token_not_stored'
            ? language === 'en'
              ? 'GitHub connected but token not stored. Some features may not work.'
              : 'GitHub 已连接但 token 未存储。某些功能可能无法工作。'
            : language === 'en'
              ? 'GitHub connected but there was an issue storing your token.'
              : 'GitHub 已连接但存储 token 时出现问题。'

          // Add warning message to conversation
          const warningMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⚠️ ${message}`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, warningMessage])
        }
      }
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [authSession, language])

  // Set default repo name when project is generated
  useEffect(() => {
    if (generatedProject && !repoName) {
      setRepoName(generatedProject.projectName)
    }
  }, [generatedProject])

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time preview: Auto-refresh when code changes or file switches
  useEffect(() => {
    // Skip if manual refresh is in progress
    if (isManualRefreshRef.current) {
      return
    }

    if (!isLivePreviewEnabled || !generatedProject || !previewUrl) {
      return
    }

    const currentCode = generatedProject.files[selectedFile] || ''
    
    // If no code available, don't refresh
    if (!currentCode.trim()) {
      return
    }

    // Clear existing timeout
    if (previewRefreshTimeoutRef.current) {
      clearTimeout(previewRefreshTimeoutRef.current)
    }

    // Check if code actually changed
    const codeChanged = currentCode !== lastPreviewCode
    const shouldRefresh = codeChanged && currentCode.trim() && lastPreviewCode !== ''

    if (shouldRefresh) {
      // Debounce: Wait 1.5 seconds after code stops changing
      previewRefreshTimeoutRef.current = setTimeout(() => {
        if (isLivePreviewEnabled && previewUrl && generatedProject && !isManualRefreshRef.current) {
          const finalCode = generatedProject.files[selectedFile] || ''
          // Double check code changed before refreshing
          if (finalCode !== lastPreviewCode && finalCode.trim() && lastPreviewCode !== '') {
            console.log('Auto-refreshing preview due to code change or file switch...')
            isManualRefreshRef.current = true
            handleRefreshPreview()
          }
        }
      }, 1500)
    }

    return () => {
      if (previewRefreshTimeoutRef.current) {
        clearTimeout(previewRefreshTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedProject?.files[selectedFile], selectedFile, isLivePreviewEnabled, previewUrl, lastPreviewCode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating) {
        e.preventDefault()
        handleGenerate()
      }
      // Ctrl/Cmd + Shift + P to toggle preview
      // Ctrl/Cmd + C to copy when viewing code
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && generatedProject && !previewUrl) {
        e.preventDefault()
        handleCopy()
      }
      // Escape to close preview
      if (e.key === 'Escape' && previewUrl) {
        setPreviewUrl("")
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isGenerating, generatedProject, previewUrl])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    // Validate prompt length
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt.length > 1000) {
      alert('Prompt is too long. Please keep it under 1000 characters for faster generation.')
      return
    }

    // Create abort controller for cancellation
    const controller = new AbortController()
    setAbortController(controller)
    setIsGenerating(true)
    setGeneratedProject(null)

    // 确保有对话ID，如果没有则创建新对话
    let conversationIdToUse = currentConversationId
    if (!conversationIdToUse && authSession?.accessToken) {
      try {
        console.log('📝 Creating new conversation...')
        const response = await fetch("/api/conversations/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.accessToken}`,
          },
          body: JSON.stringify({
            title: trimmedPrompt.substring(0, 50) || (language === "en" ? "New Conversation" : "新建对话"),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          conversationIdToUse = data.conversation.id
          setCurrentConversationId(conversationIdToUse)
          console.log('✅ Created conversation:', conversationIdToUse)
        } else {
          console.error('❌ Failed to create conversation:', response.status)
          throw new Error('Failed to create conversation')
        }
      } catch (error) {
        console.error("Error creating conversation:", error)
        throw error
      }
    }

    // 确保有对话ID才继续
    if (!conversationIdToUse) {
      throw new Error('No conversation ID available')
    }

    // Add user message to conversation history
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // 保存用户消息到数据库
    console.log('💾 Saving user message to conversation:', conversationIdToUse)
    await saveMessageToConversation(conversationIdToUse, 'user', trimmedPrompt)

    // 直接生成代码并前端打字机效果
    await startDirectGeneration(trimmedPrompt, conversationIdToUse)

    try {
      // 先使用测试API检查连接
      console.log('🧪 Testing API connectivity...')
      const testResponse = await fetch('/api/test-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'hello' })
      })

      if (!testResponse.ok) {
        throw new Error(`API connectivity test failed: ${testResponse.status}`)
      }

      const testResult = await testResponse.json()
      console.log('✅ API connectivity test passed:', testResult)

      // 然后使用调试API检查请求
      console.log('🔍 Sending debug request first...')
      const debugResponse = await fetch('/api/debug-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel
        }),
      })

      const debugResult = await debugResponse.json()
      console.log('🔍 Debug response:', debugResult)

      if (!debugResult.success) {
        throw new Error(`Validation failed: ${debugResult.error}`)
      }

      console.log('🚀 Sending generate request:', {
        prompt: prompt.trim(),
        model: selectedModel,
        userTier: userSubscriptionTier,
        hasAuth: !!authSession?.accessToken
      });

      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession?.accessToken || ''}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          conversationId: conversationIdToUse
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        // Try to parse error response
        try {
          const errorData = await response.json()
          const errorMessage = errorData.error || 'Failed to generate code'
          const error = new Error(errorMessage)
          ;(error as any).details = errorData.details || errorMessage
          ;(error as any).statusCode = response.status
          throw error
        } catch (parseError) {
          // If we can't parse the error response, use a generic message
          throw new Error(`Failed to generate code (${response.status})`)
        }
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let streamingCodeBuffer = ''
      let lastDataTime = Date.now()
      let reconnectAttempts = 0
      const MAX_RECONNECT = 3
      const CONNECTION_TIMEOUT = 30000 // 30秒无数据视为连接断开
      let connectionCheckInterval: NodeJS.Timeout | null = null

      if (!reader) {
        throw new Error('No response body reader available')
      }

      // 连接检测定时器 - 防止生产环境连接中断
      connectionCheckInterval = setInterval(() => {
        const timeSinceLastData = Date.now() - lastDataTime
        if (timeSinceLastData > CONNECTION_TIMEOUT) {
          console.warn(`⚠️ 生产环境连接检测: ${Math.round(timeSinceLastData/1000)}秒无数据，可能是网络代理中断`)

          if (reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++
            console.log(`🔄 生产环境自动重连 (${reconnectAttempts}/${MAX_RECONNECT})`)

            // 取消当前流式请求
            controller.abort()
            if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }

            // 显示重连提示
            setError(`网络连接不稳定，正在重连 (${reconnectAttempts}/${MAX_RECONNECT})...`)

            // 重连失败，设置错误状态
            setTimeout(() => {
              setError('网络连接失败，请检查网络后重试')
              setIsStreaming(false)
              setIsGenerating(false)
            }, 2000)
          } else {
            console.error('❌ 生产环境重连失败次数过多')
            setError('网络连接失败，请检查网络后重试')
            setIsStreaming(false)
            setIsGenerating(false)
            if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }
          }
        }
      }, 5000) // 每5秒检查一次连接

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              break
            }

            try {
              const parsedData = JSON.parse(data)

              if (parsedData.type === 'chars') {
                // 优化: 批量处理字符，更高效
                streamingCodeBuffer += parsedData.chars
                setStreamingCode(streamingCodeBuffer)

                // 更新最后数据时间（用于连接检测）
                lastDataTime = Date.now()
              } else if (parsedData.type === 'char') {
                // 兼容旧的单字符模式
                streamingCodeBuffer += parsedData.char
                setStreamingCode(streamingCodeBuffer)

                // 更新最后数据时间
                lastDataTime = Date.now()
              } else if (parsedData.type === 'heartbeat') {
                // 收到心跳包，更新连接状态
                lastDataTime = Date.now()
                console.log('❤️ 收到心跳包，连接正常')
                continue
              } else if (parsedData.type === 'mode_switch') {
                // 智能切换模式
                console.log(`🔄 后端要求切换到 ${parsedData.mode} 模式: ${parsedData.reason}`)
                setGenerationMode(parsedData.mode)

                if (parsedData.mode === 'async') {
                  // 切换到异步模式
                  setIsStreaming(false)
                  setAsyncProgress(0)
                  setCurrentTaskId(parsedData.taskId)
                }
                continue
              } else if (parsedData.type === 'async_task_ready') {
                // 异步任务已准备就绪
                console.log(`✅ 异步任务准备就绪: ${parsedData.asyncTaskId}`)
                setAsyncTaskId(parsedData.asyncTaskId)
                continue
              }

              // Auto-scroll to bottom (只在有实际内容时滚动)
              if (parsedData.type === 'chars' || parsedData.type === 'char') {
                setTimeout(() => {
                  const codeContainer = document.querySelector('.overflow-auto')
                  if (codeContainer) {
                    codeContainer.scrollTop = codeContainer.scrollHeight
                  }
                }, 0)
              } else if (parsedData.type === 'complete') {
                // Final project data received
                const project = parsedData.project

                setGeneratedProject(project)
                setSelectedFile('src/App.tsx')
                setPreviewPrompt(prompt.trim())
                setStreamingCode('')
                setIsStreaming(false)

                // Add AI response to conversation history
                const aiMessageContent = language === 'en'
                  ? `✅ Generated ${Object.keys(project.files).length} files successfully!`
                  : `✅ 成功生成 ${Object.keys(project.files).length} 个文件！`
                
                const aiMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: aiMessageContent,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, aiMessage])
                
                // 保存AI消息和文件到数据库
                if (conversationIdToUse) {
                  console.log('💾 Saving AI response to conversation:', conversationIdToUse)
                  await saveMessageToConversation(conversationIdToUse, 'assistant', aiMessageContent)
                  await saveFilesToConversation(conversationIdToUse, project.files)
                }

                // Auto-open preview if live preview is enabled
                if (isLivePreviewEnabled && project?.files?.['src/App.tsx']) {
                  setTimeout(async () => {
                    const currentCode = project.files['src/App.tsx'] || ''
                    if (currentCode) {
                      setIsPreviewLoading(true)
                      setPreviewError(null)
                      
                      try {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl)
                          setPreviewUrl('')
                        }
                        
                        const previewResponse = await fetch('/api/preview-code', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            code: currentCode,
                            files: project.files,
                          }),
                        })
                        
                        if (previewResponse.ok) {
                          const previewHtml = await previewResponse.text()
                          const blob = new Blob([previewHtml], { type: 'text/html' })
                          const url = URL.createObjectURL(blob)
                          setPreviewUrl(url)
                        }
                      } catch (error: any) {
                        console.error('Auto-preview error:', error)
                      } finally {
                        setIsPreviewLoading(false)
                      }
                    }
                  }, 500)
                }

                // Keep the input after successful generation for further modifications
                // setPrompt("")

              } else if (parsedData.type === 'error') {
                const errorMsg = parsedData.error || 'Generation error occurred'
                const errorDetails = parsedData.details || errorMsg
                const statusCode = parsedData.statusCode
                
                // Create a more detailed error object
                const detailedError = new Error(errorMsg)
                ;(detailedError as any).details = errorDetails
                ;(detailedError as any).statusCode = statusCode
                
                throw detailedError
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError)
            }
          }
        }
      }

    } catch (error: any) {

      if (error.name === 'AbortError') {
        console.log('Generation cancelled by user')
        return
      }
      console.error('Error generating code:', error)
      
      // Determine error message based on error type
      let errorMessage = error.message || 'Failed to generate code'
      let errorDetails = error.details || errorMessage
      let alertMessage = ''
      
      if (error.statusCode === 402) {
        errorMessage = language === 'en' 
          ? 'Insufficient API Balance'
          : 'API 余额不足'
        errorDetails = language === 'en'
          ? 'Your API account has insufficient balance. Please top up your account to continue using the service.'
          : '您的 API 账户余额不足。请充值后继续使用服务。'
        alertMessage = language === 'en'
          ? 'Insufficient API Balance. Please top up your account.'
          : 'API 余额不足，请充值账户。'
      } else if (error.statusCode === 401) {
        errorMessage = language === 'en'
          ? 'Invalid API Key'
          : 'API 密钥无效'
        errorDetails = language === 'en'
          ? 'The API key is invalid or expired. Please check your API configuration.'
          : 'API 密钥无效或已过期。请检查您的 API 配置。'
        alertMessage = language === 'en'
          ? 'Invalid API Key. Please check your configuration.'
          : 'API 密钥无效，请检查配置。'
      } else if (error.statusCode === 403) {
        errorMessage = language === 'en'
          ? 'Access Denied'
          : '访问被拒绝'
        errorDetails = language === 'en'
          ? 'You do not have permission to use the selected model. Please upgrade your subscription.'
          : '您没有权限使用所选模型。请升级您的订阅。'
        alertMessage = language === 'en'
          ? 'Access denied. Please upgrade your subscription to use this model.'
          : '访问被拒绝，请升级订阅以使用此模型。'
      } else if (error.statusCode === 429) {
        errorMessage = language === 'en'
          ? 'Rate Limit Exceeded'
          : '请求频率超限'
        errorDetails = language === 'en'
          ? 'Too many requests. Please wait a moment and try again.'
          : '请求过于频繁。请稍候再试。'
        alertMessage = language === 'en'
          ? 'Rate limit exceeded. Please wait and try again.'
          : '请求频率超限，请稍候再试。'
      } else {
        alertMessage = language === 'en'
          ? `Failed to generate code: ${errorMessage}`
          : `生成代码失败：${errorMessage}`
      }
      
      // Add error message to conversation
      const errorContent = language === 'en'
        ? `❌ ${errorMessage}\n\n${errorDetails}`
        : `❌ ${errorMessage}\n\n${errorDetails}`
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
      
      // 保存错误消息到数据库
      if (currentConversationId) {
        await saveMessage('assistant', errorContent)
      }
      
      alert(alertMessage || (language === 'en' 
        ? 'Failed to generate code. Please try again.'
        : '生成代码失败，请重试。'))
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
      setAbortController(null)
    setCurrentSegment(0)
    setTotalSegments(0)
    }
  }

  const handleCopy = () => {
    if (generatedProject && selectedFile) {
      navigator.clipboard.writeText(generatedProject.files[selectedFile])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = async () => {
    if (generatedProject) {
      await downloadAsProperZip(generatedProject)
    }
  }


  const handleConnectGithub = async () => {
    if (!authSession?.accessToken) {
      alert(language === 'en' ? 'Please log in first' : '请先登录')
      return
    }

    try {
      console.log('Attempting GitHub connection with token:', authSession.accessToken.substring(0, 50) + '...')

      const response = await fetch('/api/github/auth', {
        headers: {
          'Authorization': `Bearer ${authSession.accessToken}`,
        },
      })

      console.log('GitHub auth response:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('GitHub auth data:', data)

        if (data.authUrl) {
          console.log('Redirecting to GitHub OAuth:', data.authUrl)
          // Use window.open instead of window.location.href to avoid breaking the current page
          window.open(data.authUrl, '_blank')
        } else {
          console.error('No authUrl in response:', data)
          alert(language === 'en' ? 'Invalid response from server' : '服务器响应无效')
        }
      } else {
        let errorMessage = language === 'en' ? 'Failed to connect GitHub' : '连接 GitHub 失败'

        try {
          // Check if response has content before trying to parse JSON
          const contentType = response.headers.get('content-type')
          const text = await response.text()
          
          if (contentType?.includes('application/json') && text) {
            const errorData = JSON.parse(text)
            console.error('GitHub auth error:', errorData)

            if (errorData.setupUrl) {
              // GitHub OAuth not configured
              const setupNow = confirm(
                language === 'en'
                  ? `GitHub OAuth is not configured yet.\n\n${errorData.message}\n\nWould you like to set it up now?`
                  : `GitHub OAuth 尚未配置。\n\n${errorData.message}\n\n是否现在进行设置？`
              )
              if (setupNow) {
                window.open(errorData.setupUrl, '_blank')
              }
              return
            }

            errorMessage = errorData.error || errorData.message || errorMessage
          } else if (text) {
            // Response is not JSON but has text content
            errorMessage = text
          } else {
            // No content, use status text
            errorMessage = response.statusText || errorMessage
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          // Use status text as fallback
          errorMessage = response.statusText || errorMessage
        }

        alert(`${errorMessage} (${response.status})`)
      }
    } catch (error: any) {
      console.error('Error connecting GitHub:', error)
      alert(language === 'en' ? `Failed to connect GitHub: ${error.message}` : `连接 GitHub 失败: ${error.message}`)
    }
  }

  const handlePushToGithub = async () => {
    if (!generatedProject || !authSession?.accessToken) {
      return
    }

    // 最终验证仓库名称
    const validationError = validateRepoName(repoName)
    if (validationError) {
      setPushError(validationError)
      return
    }

    setIsPushing(true)
    setPushError(null)

    try {
      const response = await fetch('/api/github/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.accessToken}`,
        },
        body: JSON.stringify({
          project: generatedProject,
          repoName: repoName.trim(),
          description: repoDescription.trim() || undefined,
          isPrivate: isPrivateRepo,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setShowPushDialog(false)
        setRepoName("")
        setRepoDescription("")
        setIsPrivateRepo(false)
        
        // Add success message to conversation
        const successContent = language === 'en'
          ? `✅ ${data.message}\n\nRepository: [${data.repoName}](${data.repoUrl})`
          : `✅ ${data.message}\n\n仓库: [${data.repoName}](${data.repoUrl})`
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: successContent,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        // 保存成功消息到数据库
        if (currentConversationId) {
          await saveMessage('assistant', successContent)
        }

        // Open the repository in a new tab
        window.open(data.repoUrl, '_blank')
      } else {
        setPushError(data.error || (language === 'en' ? 'Failed to push to GitHub' : '推送到 GitHub 失败'))
      }
    } catch (error: any) {
      console.error('Error pushing to GitHub:', error)
      setPushError(error.message || (language === 'en' ? 'Failed to push to GitHub' : '推送到 GitHub 失败'))
    } finally {
      setIsPushing(false)
    }
  }

  const handleModifyCode = async () => {
    if (!modifyInstruction.trim() || !generatedProject) return

    const currentCode = generatedProject.files[selectedFile] || ''
    if (!currentCode) {
      alert('No code to modify')
      return
    }

    // Add user message to conversation history
    const userMessageContent = language === 'en' ? `Modify code: ${modifyInstruction.trim()}` : `修改代码: ${modifyInstruction.trim()}`
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    // 保存用户消息到数据库
    if (currentConversationId) {
      await saveMessage('user', userMessageContent)
    }

    // Add AI message indicating modification started
    const aiStartContent = language === 'en' ? '🔧 Modifying your code...' : '🔧 正在修改代码...'
    const aiStartMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiStartContent,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, aiStartMessage])
    
    // 保存AI开始消息到数据库
    if (currentConversationId) {
      await saveMessage('assistant', aiStartContent)
    }

    setIsModifying(true)

    try {
      console.log('🔧 调用同步代码修改API...')
      const response = await fetch('/api/modify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: currentCode,
          instruction: modifyInstruction.trim()
        })
        // 移除signal以避免意外取消
      })

      console.log(`📤 修改API响应状态: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ API调用失败响应: ${errorText}`)
        throw new Error(`API调用失败: ${response.status}`)
      }

      const result = await response.json()
      console.log(`📋 修改API响应: ${JSON.stringify(result)}`)

      if (result.code !== 0) {
        console.log(`❌ 业务失败: ${result.msg}`)
        const detailedError = new Error(result.msg || '代码修改失败')
        ;(detailedError as any).details = result.details || result.error
        ;(detailedError as any).statusCode = 500
        throw detailedError
      }

      const { code: modifiedCode, codeLength } = result.data
      console.log(`✅ 代码修改成功，长度: ${codeLength}字符`)

      // Update the project with modified code
      setGeneratedProject(prev => {
        if (!prev) return null
        const updatedFiles = {
          ...prev.files,
          [selectedFile]: modifiedCode
        }

        // 保存修改后的文件到数据库
        if (currentConversationId) {
          saveFiles(updatedFiles)
        }

        return {
          ...prev,
          files: updatedFiles
        }
      })

      // Reset lastPreviewCode to trigger auto-refresh if live preview is enabled
      // The useEffect hook will detect the change and auto-refresh
      if (isLivePreviewEnabled && previewUrl) {
        setLastPreviewCode('') // Reset to trigger refresh
      }

      // Update the last AI message with success status
      const successMessage = language === 'en'
        ? `✅ Code has been modified successfully${isLivePreviewEnabled && previewUrl ? ' • Preview will refresh automatically' : ''}`
        : `✅ 代码已根据要求修改完成${isLivePreviewEnabled && previewUrl ? ' • 预览将自动刷新' : ''}`

      setMessages(prev => {
        const newMessages = [...prev]
        // Find the last AI message and update it
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = {
              ...newMessages[i],
              content: successMessage,
              timestamp: new Date()
            }
            break
          }
        }
        return newMessages
      })

      // 保存AI消息到数据库
      if (currentConversationId) {
        await saveMessage('assistant', successMessage)
      }

      // Clear modification input and code display
      setModifyInstruction('')
      setModifyingCode('')

      console.log('🎉 修改完成！')
    } catch (error: any) {
      console.error('Error modifying code:', error)

      // Determine error message based on error type
      let errorMessage = error.message || 'Failed to modify code'
      let errorDetails = error.details || errorMessage
      let alertMessage = ''

      if (error.statusCode === 402) {
        errorMessage = language === 'en' 
          ? 'Insufficient API Balance'
          : 'API 余额不足'
        errorDetails = language === 'en'
          ? 'Your API account has insufficient balance. Please top up your account to continue using the service.'
          : '您的 API 账户余额不足。请充值后继续使用服务。'
        alertMessage = language === 'en'
          ? 'Insufficient API Balance. Please top up your account.'
          : 'API 余额不足，请充值账户。'
      } else if (error.statusCode === 401) {
        errorMessage = language === 'en'
          ? 'Invalid API Key'
          : 'API 密钥无效'
        errorDetails = language === 'en'
          ? 'The API key is invalid or expired. Please check your API configuration.'
          : 'API 密钥无效或已过期。请检查您的 API 配置。'
        alertMessage = language === 'en'
          ? 'Invalid API Key. Please check your configuration.'
          : 'API 密钥无效，请检查配置。'
      } else if (error.statusCode === 403) {
        errorMessage = language === 'en'
          ? 'Access Denied'
          : '访问被拒绝'
        errorDetails = language === 'en'
          ? 'You do not have permission to use the selected model. Please upgrade your subscription.'
          : '您没有权限使用所选模型。请升级您的订阅。'
        alertMessage = language === 'en'
          ? 'Access denied. Please upgrade your subscription to use this model.'
          : '访问被拒绝，请升级订阅以使用此模型。'
      } else if (error.statusCode === 429) {
        errorMessage = language === 'en'
          ? 'Rate Limit Exceeded'
          : '请求频率超限'
        errorDetails = language === 'en'
          ? 'Too many requests. Please wait a moment and try again.'
          : '请求过于频繁。请稍候再试。'
        alertMessage = language === 'en'
          ? 'Rate limit exceeded. Please wait and try again.'
          : '请求频率超限，请稍候再试。'
      } else {
        alertMessage = language === 'en'
          ? `Failed to modify code: ${errorMessage}`
          : `修改代码失败：${errorMessage}`
      }

      // Update the last AI message with error status
      const errorContent = language === 'en'
        ? `❌ ${errorMessage}\n\n${errorDetails}`
        : `❌ ${errorMessage}\n\n${errorDetails}`
      
      setMessages(prev => {
        const newMessages = [...prev]
        // Find the last AI message and update it with error
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === 'assistant') {
            newMessages[i] = {
              ...newMessages[i],
              content: errorContent,
              timestamp: new Date()
            }
            break
          }
        }
        return newMessages
      })
      
      // 保存错误消息到数据库
      if (currentConversationId) {
        await saveMessage('assistant', errorContent)
      }

      alert(alertMessage || (language === 'en' ? 'Failed to modify code. Please try again.' : '修改代码失败，请重试。'))
    } finally {
      setIsModifying(false)
    }
  }

  const handlePreview = async () => {
    if (!generatedProject) {
      setPreviewError('No generated project available')
      return
    }

    const currentCode = generatedProject.files[selectedFile] || ''
    if (!currentCode || currentCode.trim().length === 0) {
      setPreviewError('No code available to preview')
      return
    }

    setIsPreviewLoading(true)
    setPreviewError(null)

    try {
      // Clear previous preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
      }

      const response = await fetch('/api/preview-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: currentCode,
          files: generatedProject.files,
          device: previewDevice, // Pass device info to API
        }),
      })

      if (response.ok) {
        const previewHtml = await response.text()
        console.log('Preview HTML generated, length:', previewHtml.length)
        console.log('Preview HTML content (first 500 chars):', previewHtml.substring(0, 500))

        // Create a blob URL for the preview
        const blob = new Blob([previewHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        console.log('Preview URL set:', url)

        // Update lastPreviewCode immediately to prevent auto-refresh loop
        setLastPreviewCode(currentCode)
        isManualRefreshRef.current = false

        // Add success message to conversation
        const previewSuccessContent = language === 'en'
          ? `✅ Preview loaded successfully! You can now interact with your generated component.`
          : `✅ 预览加载成功！您现在可以与生成的组件进行交互。`
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: previewSuccessContent,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])
        
        // 保存成功消息到数据库
        if (currentConversationId) {
          await saveMessage('assistant', previewSuccessContent)
        }

        console.log('Preview created successfully')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.error || `Preview generation failed: ${response.status}`
        console.error('Preview API error:', response.status, errorMessage)
        setPreviewError(language === 'en' ? errorMessage : `预览生成失败：${errorMessage}`)
        
        // Add error message to conversation
        const previewErrorContent = language === 'en'
          ? `❌ Preview failed: ${errorMessage}`
          : `❌ 预览失败：${errorMessage}`
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: previewErrorContent,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMsg])
        
        // 保存错误消息到数据库
        if (currentConversationId) {
          await saveMessage('assistant', previewErrorContent)
        }
        
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Error creating preview:', error)
      const errorMessage = error.message || 'Failed to create preview. Please try again or download the ZIP file to run locally.'
      setPreviewError(errorMessage)
      
      // Add error message to conversation
      const previewErrorContent2 = language === 'en'
        ? `❌ Preview error: ${errorMessage}`
        : `❌ 预览错误：${errorMessage}`
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: previewErrorContent2,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
      
      // 保存错误消息到数据库
      if (currentConversationId) {
        await saveMessage('assistant', previewErrorContent2)
      }
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleRefreshPreview = () => {
    isManualRefreshRef.current = true
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    // Small delay to ensure state is cleared before refreshing
    setTimeout(() => {
      handlePreview()
    }, 100)
  }

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')
    }
    setPreviewError(null)
    // Clear any pending refresh
    if (previewRefreshTimeoutRef.current) {
      clearTimeout(previewRefreshTimeoutRef.current)
      previewRefreshTimeoutRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewRefreshTimeoutRef.current) {
        clearTimeout(previewRefreshTimeoutRef.current)
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const deviceSizes = {
    desktop: { width: '100%', height: '100%', minHeight: '600px' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' }
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-background flex w-full">
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          language={language}
        />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="border-b border-border/40">
            <div className="w-full px-4 flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Link href="/" className="inline-block">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.back}
                  </Button>
                </Link>
              </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTips(!showTips)} className="relative">
              <Keyboard className="w-4 h-4" />
              {showTips && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px] z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
                    <button onClick={() => setShowTips(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd> Generate</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+Shift+P</kbd> Toggle Preview</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl+C</kbd> Copy Code</div>
                    <div><kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> Close Preview</div>
                  </div>
                </div>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleLanguageChange(language === "en" ? "zh" : "en")}>
              {language === "en" ? "中文" : "English"}
            </Button>
          </div>
            </div>
          </header>

          <main className="py-12 flex-1 overflow-auto">
        <div className="w-full">
          <div className="mb-8 text-center">
            <p className="text-lg text-muted-foreground mb-6">{t.subtitle}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent">
              <Sparkles className="h-4 w-4" />
              {t.note}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Unified Control Panel */}
            <div className="lg:col-span-1 space-y-4">
              {/* Unified Control Panel */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-lg h-[76vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {language === "en" ? "Control Panel" : "控制面板"}
                  </h3>
                  {messages.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessages([])}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {language === "en" ? "Clear" : "清除"}
                    </Button>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                  {/* Conversation History */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-3">
                      {messages.length > 0 ? (
                        <>
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[90%] rounded-lg px-3 py-2 ${
                                  message.role === 'user'
                                    ? 'bg-accent text-accent-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                                }`}
                              >
                                <p className="text-sm">
                                  {typeof renderContentWithLinks(message.content) === 'string'
                                    ? message.content
                                    : renderContentWithLinks(message.content)
                                  }
                                </p>
                                <p className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* Progress bar in conversation when generating */}
                          {isGenerating && (
                            <div className="flex justify-start">
                              <div className="max-w-[90%] bg-secondary text-secondary-foreground rounded-lg px-3 py-2">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-medium">
                                      {totalSegments > 0
                                        ? `Generating segment ${currentSegment}/${totalSegments}...`
                                        : "Generating your app..."
                                      }
                                    </h4>
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                      <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">
                                      This may take 30-60 seconds. Please wait...
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (abortController) {
                                          abortController.abort()
                                          setAbortController(null)
                                          setIsGenerating(false)
                                        }
                                      }}
                                      className="text-xs h-6 px-2"
                                    >
                                      Cancel
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="h-2 flex-1 rounded-full bg-secondary-foreground/20 overflow-hidden">
                                        <div className="h-full bg-accent rounded-full animate-pulse" style={{ width: '65%' }} />
                                      </div>
                                      <span className="text-xs font-medium text-accent">65%</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div className="space-y-1">
                                        <div className="w-full bg-accent/20 rounded-full h-0.5">
                                          <div className="bg-accent h-0.5 rounded-full w-full"></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Analyzing</p>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="w-full bg-accent/20 rounded-full h-0.5">
                                          <div className="bg-accent h-0.5 rounded-full w-3/4"></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Generating</p>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="w-full bg-accent/20 rounded-full h-0.5">
                                          <div className="bg-accent h-0.5 rounded-full w-1/2"></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Optimizing</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Sparkles className="w-3 h-3 animate-spin" />
                                      <span>Creating components and styling...</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div ref={messagesEndRef} />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-24 text-muted-foreground">
                          <div className="text-center">
                            <Sparkles className="mx-auto mb-2 h-5 w-5 opacity-50" />
                            <p className="text-sm">
                              {language === "en" ? "No conversations yet" : "暂无对话记录"}
                            </p>
                            <p className="text-xs mt-1 opacity-70">
                              {language === "en" ? "Start by describing your UI idea below" : "在下方描述您的界面想法开始"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unified Input Section */}
                  <div className="space-y-4 border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      {generatedProject ? (
                        <>
                          <Code2 className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">
                            {language === "en" ? "Modify Code" : "修改代码"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 text-accent" />
                          <span className="text-sm font-medium">
                            {language === "en" ? "Generate Code" : "生成代码"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Model Selector */}
                    {!generatedProject && (
                      <div className="border-b border-border pb-3">
                        <ModelSelector
                          currentModel={selectedModel}
                          userTier={userSubscriptionTier}
                          onModelChange={(modelId) => {
                            setSelectedModel(modelId)
                            try {
                              localStorage.setItem('selectedModel', modelId)
                            } catch (error) {
                              console.error('Error saving model to localStorage:', error)
                            }
                          }}
                          language={language}
                          disabled={isGenerating}
                        />
                      </div>
                    )}
                    <Textarea
                      value={generatedProject ? modifyInstruction : prompt}
                      onChange={(e) => {
                        if (generatedProject) {
                          setModifyInstruction(e.target.value)
                        } else {
                          setPrompt(e.target.value)
                        }
                      }}
                      placeholder={
                        generatedProject
                          ? (language === "en" ? "Describe your modification... e.g., Add a dark mode toggle, change colors..." : "描述您的修改... 例如：添加深色模式切换、更改颜色...")
                          : t.placeholder
                      }
                      className="resize-none border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                      rows={3}
                      disabled={isGenerating || isModifying}
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {generatedProject ? `${modifyInstruction.length}/500` : `${prompt.length}/1000`}
                      </div>
                      {generatedProject ? (
                        <Button
                          onClick={handleModifyCode}
                          disabled={isModifying || !modifyInstruction.trim()}
                          size="sm"
                          className="bg-accent hover:bg-accent/90"
                        >
                          {isModifying ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              {language === "en" ? "Modifying..." : "修改中..."}
                            </>
                          ) : (
                            <>
                              <Code2 className="mr-2 h-3 w-3" />
                              {language === "en" ? "Modify" : "修改"}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleGenerate}
                          disabled={!prompt.trim() || isGenerating}
                          size="sm"
                          className="bg-accent hover:bg-accent/90"
                        >
                          {isGenerating ? (
                            <>
                              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              {t.generating}
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-3 w-3" />
                              {t.generate}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Output Section - 只保留这一个 */}
            <div className="space-y-4 lg:col-span-2">
              {isStreaming && streamingCode ? (
                <>
                  {/* Streaming Code Display */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h2 className="text-lg font-semibold">
                          {language === "en" ? "Generating Code..." : "正在生成代码..."}
                        </h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          abortController?.abort()
                          setIsStreaming(false)
                          setStreamingCode('')
                        }}
                        className="text-xs"
                      >
                        {language === "en" ? "Cancel" : "取消"}
                      </Button>
                    </div>
                    <div className="overflow-auto max-h-[76vh] bg-[#1e1e1e]">
                      <pre className="p-6 text-sm">
                        <code className="text-green-400 font-mono">
                          {streamingCode}
                          <span className="animate-pulse text-green-500">▊</span>
                        </code>
                      </pre>
                    </div>
                  </div>
                </>
              ) : isGenerating ? (
                <>
                  {/* Polling/Async Generation Display */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <h2 className="text-lg font-semibold">
                          {language === "en" ? "Generating Code..." : "正在生成代码..."}
                        </h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('🛑 用户取消生成')
                          // 取消生成
                          if (asyncTaskId) {
                            cancelAsyncGeneration()
                          } else {
                            // 设置状态并取消
                            setIsGenerating(false)
                            setError('用户已取消生成')
                            // 创建新的abortController并立即取消
                            const controller = new AbortController()
                            controller.abort()
                            setAbortController(controller)
                          }
                        }}
                        className="text-xs"
                      >
                        {language === "en" ? "Cancel" : "取消"}
                      </Button>
                    </div>
                    <div className="flex items-center justify-center h-[60vh] bg-[#1e1e1e]">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-muted-foreground">
                          {asyncTaskId
                            ? (language === "en" ? "Processing complex code generation..." : "正在处理复杂的代码生成...")
                            : (language === "en" ? "Generating code in background..." : "正在后台生成代码...")
                          }
                        </p>
                        {asyncProgress > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {language === "en" ? `Progress: ${asyncProgress}%` : `进度: ${asyncProgress}%`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : generatedProject ? (
                <>
                  {/* Warning Banner */}
                  {generationWarning && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-amber-800">
                            {language === "en" ? "Code Generation Warning" : "代码生成警告"}
                          </h3>
                          <p className="text-sm text-amber-700 mt-1">
                            {generationWarning}
                          </p>
                          <p className="text-xs text-amber-600 mt-2">
                            {language === "en"
                              ? "Tip: Try simplifying your request or regenerate with more specific requirements."
                              : "提示：尝试简化您的需求描述，或使用更具体的描述重新生成。"}
                          </p>
                        </div>
                        <button
                          onClick={() => setGenerationWarning("")}
                          className="flex-shrink-0 text-amber-400 hover:text-amber-600"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{t.generatedCode}</h2>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {Object.keys(generatedProject.files).length} {t.fileCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Live Preview Toggle */}
                      {previewUrl && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-md border border-border">
                          <Zap className={`h-3.5 w-3.5 ${isLivePreviewEnabled ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                          <Label htmlFor="live-preview-toggle" className="text-xs cursor-pointer">
                            {language === "en" ? "Auto-refresh" : "自动刷新"}
                          </Label>
                          <Switch
                            id="live-preview-toggle"
                            checked={isLivePreviewEnabled}
                            onCheckedChange={setIsLivePreviewEnabled}
                            className="scale-75"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreview}
                          disabled={isPreviewLoading || !generatedProject || !generatedProject.files[selectedFile]}
                          className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600 disabled:opacity-50"
                        >
                          {isPreviewLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              {language === "en" ? "Loading..." : "加载中..."}
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              {language === "en" ? "Live Preview" : "实时预览"}
                            </>
                          )}
                        </Button>
                      </div>
                      {previewUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            URL.revokeObjectURL(previewUrl)
                            setPreviewUrl("")
                            setPreviewError(null)
                          }}
                          className="gap-2"
                        >
                          <Code2 className="h-4 w-4" />
                          {language === "en" ? "View Code" : "查看代码"}
                        </Button>
                      )}
                      {previewUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreview}
                          className="gap-2"
                          title={language === "en" ? "Refresh Preview" : "刷新预览"}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            {t.copied}
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            {t.copy}
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDownload}
                        className="gap-2 bg-accent hover:bg-accent/90"
                      >
                        <Download className="h-4 w-4" />
                        Download ZIP
                      </Button>
                      {githubConnected ? (
                        <Button
                          size="sm"
                          onClick={() => setShowPushDialog(true)}
                          className="gap-2 bg-[#24292e] hover:bg-[#2f363d] text-white"
                          disabled={!generatedProject}
                        >
                          <Github className="h-4 w-4" />
                          {t.pushToGithub}
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() => window.open('/github-setup', '_blank')}
                            variant="outline"
                            className="gap-2 mr-2"
                            title={language === 'en' ? 'GitHub setup guide' : 'GitHub 设置指南'}
                          >
                            ⚙️ Setup
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleConnectGithub}
                            variant="outline"
                            className="gap-2"
                            title={language === 'en' ? 'Connect your GitHub account' : '连接您的 GitHub 账户'}
                          >
                            <Github className="h-4 w-4" />
                            {t.connectGithub}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* GitHub Status Badge */}
                  {githubConnected && githubUsername && (
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Github className="h-4 w-4 text-green-500" />
                      <span>
                        {language === 'en'
                          ? `Connected as ${githubUsername}`
                          : `已连接为 ${githubUsername}`}
                      </span>
                    </div>
                  )}

                  {!githubConnected && (
                    <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-800">
                        <Github className="h-4 w-4 text-blue-600" />
                        <span>
                          {generatedProject
                            ? (language === 'en'
                                ? '💡 Connect GitHub to push your generated code to a repository!'
                                : '💡 连接 GitHub 可以将生成的代码推送到仓库！')
                            : (language === 'en'
                                ? '💡 Generate code first, then connect GitHub to push to repository!'
                                : '💡 先生成代码，然后连接 GitHub 推送到仓库！')
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Push to GitHub Dialog */}
                  <Dialog open={showPushDialog} onOpenChange={setShowPushDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t.pushToGithub}</DialogTitle>
                        <DialogDescription>
                          {language === 'en'
                            ? 'Create a new GitHub repository and push your generated code'
                            : '创建新的 GitHub 仓库并推送生成的代码'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="repo-name">{t.repoName}</Label>
                          <Input
                            id="repo-name"
                            value={repoName}
                            onChange={(e) => {
                              const value = e.target.value
                              setRepoName(value)
                              // 实时验证
                              const error = validateRepoName(value)
                              setRepoNameError(error)
                            }}
                            placeholder={language === 'en' ? 'my-awesome-app' : 'my-awesome-app'}
                            disabled={isPushing}
                            className={repoNameError ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          {repoNameError && (
                            <p className="text-sm text-red-600 mt-1">{repoNameError}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="repo-description">{t.repoDescription}</Label>
                          <Input
                            id="repo-description"
                            value={repoDescription}
                            onChange={(e) => setRepoDescription(e.target.value)}
                            placeholder={language === 'en' ? 'A beautiful app generated by mornFront' : '由 mornFront 生成的精美应用'}
                            disabled={isPushing}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="private-repo"
                            checked={isPrivateRepo}
                            onCheckedChange={setIsPrivateRepo}
                            disabled={isPushing}
                          />
                          <Label htmlFor="private-repo" className="cursor-pointer">
                            {t.isPrivate}
                          </Label>
                        </div>
                        {pushError && (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {pushError}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPushDialog(false)
                            setPushError(null)
                          }}
                          disabled={isPushing}
                        >
                          {language === 'en' ? 'Cancel' : '取消'}
                        </Button>
                        <Button
                          onClick={handlePushToGithub}
                          disabled={isPushing || !repoName.trim() || !!repoNameError}
                          className="bg-[#24292e] hover:bg-[#2f363d] text-white"
                        >
                          {isPushing ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              {language === 'en' ? 'Pushing...' : '推送中...'}
                            </>
                          ) : (
                            <>
                              <Github className="mr-2 h-4 w-4" />
                              {t.pushToGithub}
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <div className="rounded-xl border border-border bg-card overflow-hidden h-[76vh]">
                    {previewError && !previewUrl ? (
                      <div className="h-full flex items-center justify-center p-8">
                        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-red-900 mb-2">
                                {language === "en" ? "Preview Error" : "预览错误"}
                              </h3>
                              <p className="text-sm text-red-700 mb-4">{previewError}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewError(null)
                                  handlePreview()
                                }}
                                className="w-full"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {language === "en" ? "Try Again" : "重试"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : previewUrl ? (
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200 relative min-h-0" style={{ marginLeft: previewDevice === 'desktop' ? '0' : undefined }}>
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600 ml-2 font-medium">
                                {language === "en" ? "Live Preview" : "实时预览"}
                              </span>
                              {isLivePreviewEnabled && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                  {language === "en" ? "Auto-refresh" : "自动刷新"}
                                </span>
                              )}
                              {previewError && (
                                <span className="text-xs text-amber-600 ml-2 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {language === "en" ? "Warning" : "警告"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Device Size Toggle */}
                              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                                <button
                                  onClick={() => setPreviewDevice('mobile')}
                                  className={`px-2 py-1 text-xs rounded ${
                                    previewDevice === 'mobile'
                                      ? 'bg-white shadow-sm text-gray-900'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                  title={language === "en" ? "Mobile View" : "移动端视图"}
                                >
                                  📱
                                </button>
                                <button
                                  onClick={() => setPreviewDevice('tablet')}
                                  className={`px-2 py-1 text-xs rounded ${
                                    previewDevice === 'tablet'
                                      ? 'bg-white shadow-sm text-gray-900'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                  title={language === "en" ? "Tablet View" : "平板视图"}
                                >
                                  📱
                                </button>
                                <button
                                  onClick={() => setPreviewDevice('desktop')}
                                  className={`px-2 py-1 text-xs rounded ${
                                    previewDevice === 'desktop'
                                      ? 'bg-white shadow-sm text-gray-900'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                  title={language === "en" ? "Desktop View" : "桌面视图"}
                                >
                                  💻
                                </button>
                              </div>
                              {/* Zoom Controls */}
                              <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
                                <button
                                  onClick={() => setPreviewScale(Math.max(0.5, previewScale - 0.1))}
                                  className="text-gray-600 hover:text-gray-900 text-xs"
                                  disabled={previewScale <= 0.5}
                                >
                                  −
                                </button>
                                <span className="text-xs text-gray-600 min-w-[3ch] text-center">
                                  {Math.round(previewScale * 100)}%
                                </span>
                                <button
                                  onClick={() => setPreviewScale(Math.min(2, previewScale + 0.1))}
                                  className="text-gray-600 hover:text-gray-900 text-xs"
                                  disabled={previewScale >= 2}
                                >
                                  +
                                </button>
                              </div>
                              {/* Live Preview Toggle */}
                              <button
                                onClick={() => setIsLivePreviewEnabled(!isLivePreviewEnabled)}
                                className={`text-sm p-1.5 rounded transition-colors ${
                                  isLivePreviewEnabled
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={language === "en" 
                                  ? (isLivePreviewEnabled ? "Disable auto-refresh" : "Enable auto-refresh")
                                  : (isLivePreviewEnabled ? "禁用自动刷新" : "启用自动刷新")
                                }
                              >
                                <div className="flex items-center gap-1">
                                  {isLivePreviewEnabled ? (
                                    <>
                                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                      <span className="text-xs">⚡</span>
                                    </>
                                  ) : (
                                    <span className="text-xs">⚡</span>
                                  )}
                                </div>
                              </button>
                              <button
                                onClick={handleRefreshPreview}
                                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded hover:bg-gray-100"
                                title={language === "en" ? "Refresh Preview" : "刷新预览"}
                                disabled={isPreviewLoading}
                              >
                                <RefreshCw className={`w-4 h-4 ${isPreviewLoading ? 'animate-spin' : ''}`} />
                              </button>
                              <button
                                onClick={handleClosePreview}
                                className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded hover:bg-gray-100"
                                title={language === "en" ? "Close Preview" : "关闭预览"}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div
                            className={`flex-1 overflow-hidden bg-gray-100 ${previewDevice === 'desktop' ? 'flex items-stretch' : 'flex items-center justify-center'}`}
                            style={{
                              minHeight: previewDevice === 'mobile' ? '667px' : previewDevice === 'tablet' ? '1024px' : 'calc(66vh - 80px)',
                              height: previewDevice === 'desktop' ? 'calc(66vh - 80px)' : 'auto',
                              maxHeight: previewDevice === 'desktop' ? undefined : 'calc(100vh - 200px)',
                              padding: previewDevice === 'desktop' ? '0' : '1rem'
                            }}
                          >
                            <div
                              style={{
                                width: deviceSizes[previewDevice].width,
                                height: previewDevice === 'desktop' ? '100%' : deviceSizes[previewDevice].height,
                                minHeight: previewDevice === 'desktop' ? '100%' : deviceSizes[previewDevice].height,
                                transform: previewDevice === 'desktop' ? 'none' : `scale(${previewScale})`,
                                transformOrigin: previewDevice === 'desktop' ? 'center center' : 'center top',
                                transition: 'transform 0.2s ease',
                                border: previewDevice !== 'desktop' ? '8px solid #1f2937' : 'none',
                                borderRadius: previewDevice !== 'desktop' ? '12px' : '0',
                                boxShadow: previewDevice !== 'desktop' ? '0 20px 60px rgba(0,0,0,0.3)' : 'none',
                                overflow: previewDevice === 'desktop' ? 'hidden' : 'auto',
                                backgroundColor: '#fff',
                                display: 'flex',
                                flexDirection: 'column',
                                flex: previewDevice === 'desktop' ? '1' : 'none',
                                position: previewDevice === 'desktop' ? 'relative' : 'static'
                              }}
                            >
                              <iframe
                                src={previewUrl}
                                className="w-full h-full border-0"
                                title="Live Preview"
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                                onLoad={() => {
                                  console.log('Preview iframe loaded successfully')
                                  setPreviewError(null)
                                  setIsPreviewLoading(false)

                                  // Check if iframe has content
                                  setTimeout(() => {
                                    try {
                                      const iframe = document.querySelector('iframe[title="Live Preview"]') as HTMLIFrameElement
                                      if (iframe && iframe.contentWindow) {
                                        console.log('Iframe content loaded, checking for App component...')
                                        // Try to access iframe content
                                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
                                        if (iframeDoc) {
                                          const rootEl = iframeDoc.getElementById('root')
                                          const loadingEl = iframeDoc.getElementById('loading')
                                          console.log('Iframe root element:', rootEl, 'loading element:', loadingEl)
                                          if (rootEl && loadingEl && loadingEl.style.display === 'none') {
                                            console.log('Preview appears to be working correctly')
                                          } else {
                                            console.log('Preview may not be displaying correctly')
                                          }
                                        }
                                      }
                                    } catch (e) {
                                      console.error('Error checking iframe content:', e)
                                    }
                                  }, 2000) // Wait 2 seconds for rendering to complete
                                }}
                                onError={() => {
                                  console.error('Preview iframe failed to load')
                                  setPreviewError(language === "en" ? "Failed to load preview" : "加载预览失败")
                                  setIsPreviewLoading(false)
                                }}
                              />
                            </div>
                          </div>
                          {isPreviewLoading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                              <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                <p className="text-sm text-gray-600">
                                  {language === "en" ? "Loading preview..." : "加载预览中..."}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-[200px_1fr] h-full">
                        {/* File Browser */}
                        <div className="border-r border-border bg-secondary/20 p-2 overflow-y-auto">
                          <div className="space-y-1">
                            {Object.keys(generatedProject.files).map((filePath) => (
                              <button
                                key={filePath}
                                onClick={() => setSelectedFile(filePath)}
                                className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-secondary transition-colors ${
                                  selectedFile === filePath
                                    ? "bg-secondary font-medium"
                                    : ""
                                }`}
                              >
                                {filePath}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Code Display */}
                        <div className="overflow-auto">
                          <pre className="p-6 text-sm">
                            <code className="text-foreground">
                              {isStreaming && streamingCode ? (
                                <>
                                  {streamingCode}
                                  <span className="animate-pulse">▊</span>
                                </>
                              ) : isModifying && modifyingCode ? (
                                <>
                                  {modifyingCode}
                                  <span className="animate-pulse">▊</span>
                                </>
                              ) : (
                                generatedProject.files[selectedFile]
                              )}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-[76vh] items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
                  <div className="text-center">
                    <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {language === "en" ? "Your generated code will appear here" : "生成的代码将显示在这里"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
        </SidebarInset>
    </div>
    </SidebarProvider>
  )

  // 异步任务相关函数
  // SSE监听异步任务状态
  const startSSEListening = (taskId: string) => {
    console.log(`🔄 建立SSE连接监听任务: ${taskId}`)
    setIsGenerating(true)
    setGenerationMode('async')

    // 关闭之前的SSE连接
    if (sseRef.current) {
      sseRef.current.close()
    }

    // 创建EventSource连接
    const eventSource = new EventSource(`/api/generate-async/${taskId}/stream`)

    eventSource.onopen = () => {
      console.log('📡 SSE连接已建立')
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 收到SSE消息:', data)

        switch (data.type) {
          case 'connected':
            console.log('✅ SSE连接确认')
            break

          case 'status_update':
            setAsyncProgress(data.progress || 0)
            console.log(`📊 任务状态: ${data.message}`)
            break

          case 'progress_update':
            setAsyncProgress(data.progress || 0)
            console.log(`📈 进度更新: ${data.message}`)
            break

          case 'completed':
            console.log(`✅ 异步任务完成: ${taskId}`)
            eventSource.close()
            handleAsyncTaskCompleted({ ...data, taskId, status: 'completed', content: JSON.stringify(data.result) })
            break

          case 'failed':
            console.error(`❌ 异步任务失败: ${taskId}`, data.error)
            eventSource.close()
            setError(data.message || '生成失败，请重试')
            setIsGenerating(false)
            setGenerationMode('streaming')
            setCurrentTaskId(null)
            setAsyncTaskId(null)
            break
        }
      } catch (error) {
        console.error('解析SSE消息失败:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error)
      eventSource.close()

      // SSE连接失败，设置错误状态
      setError('网络连接失败，请重试')
      setIsGenerating(false)
    }

    // 存储EventSource引用
    sseRef.current = eventSource
  }

  // 停止SSE监听
  const stopSSEListening = () => {
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }
  }


  const handleAsyncTaskCompleted = (status: TaskStatus) => {
    if (status.result) {
      console.log('📦 处理异步任务结果')

      setGeneratedProject(status.result)
      setSelectedFile('src/App.tsx')
      setIsGenerating(false)
      setGenerationMode('streaming') // 重置为流式模式
      setCurrentTaskId(null)
      setAsyncTaskId(null)
      setAsyncProgress(0)

      // 显示成功消息
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ 代码生成完成！使用了智能异步模式以确保稳定性。`,
        timestamp: new Date()
      }])

      // 自动打开预览
      if (status.result?.files?.['src/App.tsx']) {
        setTimeout(() => {
          setPreviewPrompt(prompt.trim())
          setIsPreviewLoading(true)
        }, 1000)
      }
    }
  }

  const cancelAsyncGeneration = async () => {
    if (!asyncTaskId) return

    try {
      console.log(`🛑 取消异步任务: ${asyncTaskId}`)

      await fetch(`/api/generate-async/${asyncTaskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authSession?.accessToken || ''}`,
        },
      })

      setIsGenerating(false)
      setGenerationMode('streaming')
      setCurrentTaskId(null)
      setAsyncTaskId(null)
      setAsyncProgress(0)
      setError('异步生成已取消')

    } catch (error) {
      console.error('取消异步任务失败:', error)
    }
  }

  // 复杂度评估函数
  const assessPromptComplexity = (prompt: string): number => {
    let complexity = prompt.length

    // 关键词权重
    const keywords = [
      'dashboard', 'complex', 'multiple', 'advanced', 'full-featured',
      '完整的', '复杂的', '多组件', '高级', '完整功能'
    ]
    keywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword.toLowerCase())) {
        complexity += 200
      }
    })

    // 组件数量估算
    const componentIndicators = ['component', 'page', 'screen', 'modal', 'form', '组件', '页面', '界面', '弹窗']
    componentIndicators.forEach(indicator => {
      const matches = prompt.toLowerCase().match(new RegExp(indicator.toLowerCase(), 'g'))
      if (matches) {
        complexity += matches.length * 100
      }
    })

    return complexity
  }

  // 智能生成处理
  const startSmartGeneration = async () => {
    if (!prompt.trim()) return

    // 重置状态
    setIsGenerating(true)
    setIsStreaming(true)
    setStreamingCode('')
    setGeneratedProject(null)
    setGenerationMode('streaming')
    setCurrentTaskId(null)
    setAsyncTaskId(null)
    setAsyncProgress(0)
    setError(null)

    // 复杂度评估
    const complexity = assessPromptComplexity(prompt.trim())
    console.log(`📊 提示复杂度评估: ${complexity}`)

    // 如果复杂度很高，直接使用异步模式
    if (complexity > 1200) {
      console.log('🚨 复杂度过高，直接使用异步模式')
      setGenerationMode('async')
      setIsStreaming(false)
      await startAsyncGeneration()
      return
    }

    // 否则使用智能流式模式（可能会自动切换）
    console.log('🎯 使用智能流式模式')
    await startSmartStreaming()
  }

  // 直接异步生成（供复杂度评估调用）
  const startAsyncGeneration = async () => {
    try {
      console.log('🚀 启动异步生成模式')

      const response = await fetch('/api/generate-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession?.accessToken || ''}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          conversationId: currentConversationId
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      const taskId = result.taskId

      console.log(`📋 异步任务已提交: ${taskId}`)
      setCurrentTaskId(taskId)
      setAsyncTaskId(taskId)

      // 建立SSE连接监听任务状态
      startSSEListening(taskId)

    } catch (error) {
      console.error('启动异步生成失败:', error)
      setError('启动异步生成失败，请重试')
      setIsGenerating(false)
      setGenerationMode('streaming')
    }
  }



  // 智能流式生成
  const startSmartStreaming = async () => {
    console.log('🎯 启动智能流式生成')

    try {
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession?.accessToken || ''}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          conversationId: currentConversationId
        }),
        signal: abortController?.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      await processSmartStreaming(response)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('用户取消生成')
        return
      }

      console.error('智能流式生成失败:', error)

      // 如果是网络错误或超时，自动切换到异步模式
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('timeout')) {
        console.log('🔄 检测到网络问题，自动切换到异步模式')
        setGenerationMode('async')
        setIsStreaming(false)
        await startAsyncGeneration()
      } else {
        setError(error.message || '生成失败，请重试')
        setIsGenerating(false)
        setIsStreaming(false)
      }
    }
  }

  // 处理智能流式响应
  const processSmartStreaming = async (response: Response) => {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let streamingCodeBuffer = ''
    let lastDataTime = Date.now()
    let connectionCheckInterval: NodeJS.Timeout | null = null

    if (!reader) {
      throw new Error('No response body reader available')
    }

    // 连接检测定时器
    connectionCheckInterval = setInterval(() => {
      const timeSinceLastData = Date.now() - lastDataTime
      if (timeSinceLastData > 30000) {
        console.warn(`⚠️ 流式连接检测: ${Math.round(timeSinceLastData/1000)}秒无数据，可能需要切换模式`)

        if (streamingCodeBuffer.length > 50) {
          // 有足够内容，切换到异步模式继续
          console.log('🔄 自动切换到异步模式继续生成')
          setGenerationMode('async')
          setIsStreaming(false)
          startAsyncGeneration()
          if (connectionCheckInterval) {
            if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }
          }
        }
      }
    }, 5000)

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              break
            }

            try {
              const parsedData = JSON.parse(data)

              if (parsedData.type === 'chars') {
                streamingCodeBuffer += parsedData.chars
                setStreamingCode(streamingCodeBuffer)
                lastDataTime = Date.now()

                // 自动滚动
                setTimeout(() => {
                  const codeContainer = document.querySelector('.overflow-auto')
                  if (codeContainer) {
                    codeContainer.scrollTop = codeContainer.scrollHeight
                  }
                }, 0)

              } else if (parsedData.type === 'segment_start') {
                console.log(`📝 开始生成第 ${parsedData.segment}/${parsedData.total} 部分`)
                setCurrentSegment(parsedData.segment)
                setTotalSegments(parsedData.total)
                lastDataTime = Date.now()

              } else if (parsedData.type === 'segment_complete') {
                console.log(`✅ 完成第 ${parsedData.segment}/${parsedData.total} 部分`)
                setCurrentSegment(parsedData.segment)
                lastDataTime = Date.now()

              } else if (parsedData.type === 'heartbeat') {
                lastDataTime = Date.now()
                console.log('❤️ 收到心跳包，流式连接正常')

              } else if (parsedData.type === 'mode_switch') {
                console.log(`🔄 后端要求切换到 ${parsedData.mode} 模式: ${parsedData.reason}`)
                setGenerationMode(parsedData.mode)

                if (parsedData.mode === 'async') {
                  setIsStreaming(false)

                  if (parsedData.asyncTaskId) {
                    setAsyncTaskId(parsedData.asyncTaskId)
                  }
                }
                if (connectionCheckInterval) {
                  clearInterval(connectionCheckInterval)
                }
                return // 退出流式处理

              } else if (parsedData.type === 'complete') {
                const project = parsedData.project
                setGeneratedProject(project)
                setSelectedFile('src/App.tsx')
                setIsGenerating(false)
                setIsStreaming(false)


                if (connectionCheckInterval) {
                  clearInterval(connectionCheckInterval)
                }
                return
              }

            } catch (parseError) {
              console.warn('解析流式数据失败:', parseError)
            }
          }
        }
      }

    } finally {
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval)
      }
    }
  }

  // 同步生成代码，直接等待完成后再显示
  async function startDirectGeneration(prompt: string, conversationId: string) {
    console.log('🎯 启动异步AI代码生成')

    try {
      // 调用异步API生成代码（立即返回任务ID）
      console.log('🚀 调用异步代码生成API...')
      const response = await fetch('/api/generate-code-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession?.accessToken}`,
        },
        body: JSON.stringify({ prompt }),
        signal: abortController?.signal
      })

      console.log(`📤 API响应状态: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`❌ API调用失败响应: ${errorText}`)
        throw new Error(`API调用失败: ${response.status}`)
      }

      const result = await response.json()
      console.log(`📋 API响应: ${JSON.stringify(result)}`)

      if (result.code !== 0) {
        console.log(`❌ 业务失败: ${result.msg}`)
        throw new Error(result.msg || '代码生成失败')
      }

      const { taskId } = result.data
      console.log(`📝 任务已创建，ID: ${taskId}`)

      // 开始轮询任务状态
      await pollTaskStatus(taskId, prompt, conversationId)

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('用户取消生成')
        return
      }

      console.error('生成失败:', error)
      setError(error.message || '生成失败，请重试')
      setIsGenerating(false)
      setIsStreaming(false)
      setAbortController(null)
    }
  }

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, originalPrompt: string, conversationId: string) => {
    console.log('🔄 开始轮询任务状态:', taskId)

    const pollInterval = 2000 // 2秒轮询一次
    const maxAttempts = 300 // 最多轮询10分钟 (300 * 2秒)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔍 第${attempt}次轮询任务状态...`)

        const response = await fetch(`/api/generate-code-task?taskId=${taskId}`)
        const result = await response.json()

        if (result.code !== 0) {
          throw new Error(result.msg || '查询任务状态失败')
        }

        const { status, code: generatedCode, codeLength, error: taskError } = result.data

        if (status === 'completed' && generatedCode) {
          console.log(`✅ 任务完成，代码长度: ${codeLength}字符`)

          // 设置最终结果状态
          setGeneratedProject({
            files: {
              'src/App.tsx': generatedCode
            },
            projectName: 'GeneratedApp'
          })
          setSelectedFile('src/App.tsx')
          setIsGenerating(false)
          setIsStreaming(false)
          setAbortController(null)

          // 添加成功消息到对话
          const aiMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: '✅ 代码生成完成！',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])

          // 保存到数据库
          if (conversationId) {
            await saveMessageToConversation(conversationId, 'assistant', '代码生成完成！')
          }

          console.log('🎉 生成完成！')
          return // 任务完成，停止轮询

        } else if (status === 'failed') {
          console.error('❌ 任务失败:', taskError)
          throw new Error(taskError || '代码生成失败')

        } else if (status === 'processing') {
          console.log(`⏳ 任务仍在处理中... (${attempt}/${maxAttempts})`)

          // 更新对话显示进度
          const progressMessage = `⏳ AI正在生成代码... (${Math.round(attempt * 2)}秒)`
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage?.role === 'assistant' && lastMessage.content.startsWith('⏳')) {
              // 更新最后一条进度消息
              return prev.map(msg =>
                msg.id === lastMessage.id
                  ? { ...msg, content: progressMessage, timestamp: new Date() }
                  : msg
              )
            } else {
              // 添加新的进度消息
              const progressAiMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: progressMessage,
                timestamp: new Date()
              }
              return [...prev, progressAiMessage]
            }
          })

          // 等待后继续轮询
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        } else {
          console.warn('⚠️ 未知任务状态:', status)
          await new Promise(resolve => setTimeout(resolve, pollInterval))
        }

      } catch (error: any) {
        console.error('轮询任务状态失败:', error)
        setIsGenerating(false)
        setIsStreaming(false)
        setAbortController(null)

        const errorMessage = `生成失败: ${error.message}`
        setError(errorMessage)

        const errorAiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `❌ ${errorMessage}`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorAiMessage])

        if (conversationId) {
          await saveMessageToConversation(conversationId, `❌ ${errorMessage}`)
        }
        return
      }
    }

    // 轮询超时
    console.error('❌ 轮询超时，任务可能仍在后台处理')
    setIsGenerating(false)
    setIsStreaming(false)
    setAbortController(null)

    const timeoutMessage = '生成超时：任务已在后台启动，请稍后刷新页面查看结果'
    setError(timeoutMessage)

    const timeoutAiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `⏰ ${timeoutMessage}`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, timeoutAiMessage])

    if (conversationId) {
      await saveMessageToConversation(conversationId, timeoutMessage)
    }
  }


}