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
import { createSupabaseClient } from "@/lib/supabase"
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

// 寮傛浠诲姟鐘舵€佹帴鍙?
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
    back: "杩斿洖棣栭〉",
    title: "鐢熸垚鍓嶇鐣岄潰",
    subtitle: "鎻忚堪浣犵殑鐣岄潰鎯虫硶锛岀珛鍗宠幏寰楀彲鐢ㄤ簬鐢熶骇鐜鐨?React 浠ｇ爜",
    placeholder: '鎻忚堪浣犵殑鐣岄潰... 渚嬪锛?涓€涓幇浠ｅ寲鐨勫畾浠烽〉闈紝鍖呭惈3涓瓑绾у拰娣辫壊涓婚"',
    generate: "鐢熸垚鐣岄潰浠ｇ爜",
    generating: "鐢熸垚涓?..",
    generatedCode: "鐢熸垚鐨勪唬鐮?,
    preview: "棰勮",
    copy: "澶嶅埗涓绘枃浠?,
    copied: "宸插鍒讹紒",
    download: "涓嬭浇椤圭洰",
    downloadAll: "涓嬭浇鎵€鏈夋枃浠?,
    note: "娉ㄦ剰锛氭湰骞冲彴浠呯敓鎴愬墠绔晫闈唬鐮侊紙React/Next.js 缁勪欢锛?,
    fileCount: "涓枃浠跺凡鐢熸垚",
    viewCode: "鏌ョ湅浠ｇ爜",
    viewPreview: "鏌ョ湅棰勮",
    connectGithub: "杩炴帴 GitHub",
    pushToGithub: "鎺ㄩ€佸埌 GitHub",
    githubConnected: "GitHub 宸茶繛鎺?,
    githubNotConnected: "GitHub 鏈繛鎺?,
    repoName: "浠撳簱鍚嶇О",
    repoDescription: "鎻忚堪锛堝彲閫夛級",
    isPrivate: "绉佹湁浠撳簱",
    pushSuccess: "鎴愬姛鎺ㄩ€佸埌 GitHub锛?,
    pushError: "鎺ㄩ€佸埌 GitHub 澶辫触",
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

        // 鑾峰彇淇濆瓨鐨勬ā鍨嬮€夋嫨
        const savedModel = localStorage.getItem('selectedModel')
        if (savedModel && savedModel in AVAILABLE_MODELS) {
          setSelectedModel(savedModel)
        }

        // 浠庡悗绔疉PI鑾峰彇鐢ㄦ埛鐨勫疄闄呰闃呯瓑绾?
        fetchUserSubscriptionTier()
      } catch (error) {
        console.error('Error reading from localStorage:', error)
      }
    }
  }, [])

  // 鑾峰彇鐢ㄦ埛璁㈤槄绛夌骇
  const fetchUserSubscriptionTier = async () => {
    try {
      if (authSession?.accessToken) {
        console.log('馃攳 Fetching user subscription tier...');
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${authSession.accessToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('馃搳 Subscription status response:', data);
          if (data.success && data.subscription?.planType) {
            const serverTier = data.subscription.planType;
            console.log(`馃懁 User tier updated: ${userSubscriptionTier} -> ${serverTier}`);
            setUserSubscriptionTier(serverTier)
            // 濡傛灉褰撳墠閫夋嫨鐨勬ā鍨嬩笉閫傜敤浜庢柊绛夌骇锛屽垯鍒囨崲鍒伴粯璁ゆā鍨?
            if (!canUseModel(serverTier, selectedModel)) {
              const newModel = getDefaultModel(serverTier);
              console.log(`馃攧 Model switched due to tier change: ${selectedModel} -> ${newModel}`);
              setSelectedModel(newModel)
            }
          } else {
            console.log('鈿狅笍 Invalid subscription response format:', data);
          }
        } else {
          console.log('鉂?Failed to fetch subscription status:', response.status);
        }
      } else {
        console.log('鈿狅笍 No auth token available for subscription check');
      }
    } catch (error) {
      console.error('Failed to fetch user subscription tier:', error)
      // 鍑洪敊鏃朵繚鎸侀粯璁ょ殑free绛夌骇
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

  // 鍒嗘鐢熸垚鐘舵€?
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

  // 寮傛浠诲姟鐩稿叧鐘舵€?
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [asyncTaskId, setAsyncTaskId] = useState<string | null>(null)
  const [generationMode, setGenerationMode] = useState<'streaming' | 'async' | 'hybrid'>('streaming')
  const [asyncProgress, setAsyncProgress] = useState<number>(0)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // 妯″瀷閫夋嫨鍜岃闃呯姸鎬?
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

  // 瑙ｆ瀽markdown閾炬帴鐨勫嚱鏁?
  const renderContentWithLinks = (content: string) => {
    // 鍖归厤markdown閾炬帴鏍煎紡 [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      // 娣诲姞鍖归厤鍓嶇殑鏂囨湰
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      // 娣诲姞閾炬帴
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

    // 娣诲姞鍓╀綑鐨勬枃鏈?
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    // 濡傛灉娌℃湁閾炬帴锛岃繑鍥炲師濮嬪唴瀹?
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

  // 褰撶敤鎴风櫥褰曠姸鎬佹敼鍙樻椂锛岃幏鍙栬闃呯瓑绾?
  useEffect(() => {
    if (authSession?.accessToken) {
      fetchUserSubscriptionTier()
    } else {
      setUserSubscriptionTier('free')
      // 鏈櫥褰曟椂锛屽鏋滃綋鍓嶆ā鍨嬩笉閫傜敤浜巉ree绛夌骇锛屽垯鍒囨崲
      if (!canUseModel('free', selectedModel)) {
        setSelectedModel(getDefaultModel('free'))
      }
    }
  }, [authSession?.accessToken])
  
  // Conversation management
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const t = translations[language]

  // 楠岃瘉 GitHub 浠撳簱鍚嶇О鏍煎紡
  const validateRepoName = (name: string): string => {
    if (!name.trim()) {
      return language === 'en' ? 'Repository name is required' : '浠撳簱鍚嶇О涓嶈兘涓虹┖'
    }

    const trimmedName = name.trim()

    // 妫€鏌ラ暱搴?
    if (trimmedName.length < 1 || trimmedName.length > 100) {
      return language === 'en'
        ? 'Repository name must be between 1 and 100 characters'
        : '浠撳簱鍚嶇О闀垮害蹇呴』鍦?-100涓瓧绗︿箣闂?
    }

    // 妫€鏌ュ瓧绗︽牸寮忥細鍙厑璁稿瓧姣嶃€佹暟瀛椼€佽繛瀛楃銆佷笅鍒掔嚎銆佺偣
    const validPattern = /^[a-zA-Z0-9._-]+$/
    if (!validPattern.test(trimmedName)) {
      return language === 'en'
        ? 'Repository name can only contain letters, numbers, hyphens (-), underscores (_), and dots (.)'
        : '浠撳簱鍚嶇О鍙兘鍖呭惈瀛楁瘝銆佹暟瀛椼€佽繛瀛楃锛?锛夈€佷笅鍒掔嚎锛坃锛夊拰鐐癸紙.锛?
    }

    // 妫€鏌ヤ笉鑳戒互杩炲瓧绗﹀紑澶存垨缁撳熬
    if (trimmedName.startsWith('-') || trimmedName.endsWith('-')) {
      return language === 'en'
        ? 'Repository name cannot start or end with a hyphen'
        : '浠撳簱鍚嶇О涓嶈兘浠ヨ繛瀛楃寮€澶存垨缁撳熬'
    }

    // 妫€鏌ユ槸鍚﹀寘鍚繛缁殑杩炲瓧绗?
    if (trimmedName.includes('--')) {
      return language === 'en'
        ? 'Repository name cannot contain consecutive hyphens'
        : '浠撳簱鍚嶇О涓嶈兘鍖呭惈杩炵画鐨勮繛瀛楃'
    }

    return ''
  }

  // 淇濆瓨娑堟伅鍒版暟鎹簱
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
        console.log(`鉁?Saved ${role} message to conversation ${conversationId}`)
      }
    } catch (error) {
      console.error("Error saving message to conversation:", error)
    }
  }

  // 淇濆瓨鏂囦欢鍒版暟鎹簱
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
        console.log(`鉁?Saved ${fileArray.length} files to conversation ${conversationId}`)
      }
    } catch (error) {
      console.error("Error saving files to conversation:", error)
    }
  }

  // 鍔犺浇瀵硅瘽
  const loadConversation = async (conversationId: string | null) => {
    if (!conversationId || !authSession?.accessToken) {
      // 娓呯┖褰撳墠瀵硅瘽
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
        
        // 鍔犺浇娑堟伅
        const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(loadedMessages)

        // 鍔犺浇鏂囦欢
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

  // 澶勭悊閫夋嫨瀵硅瘽
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
    "鍒涘缓涓€涓幇浠ｅ寲鐨勫緟鍔炰簨椤瑰垪琛紝甯︽繁鑹叉ā寮忓垏鎹?,
    "鏋勫缓涓€涓甫鍩庡競鎼滅储鍜屽ぉ姘旈鎶ョ殑搴旂敤",
    "璁捐涓€涓?SaaS 浜у搧鐨勫搷搴斿紡钀藉湴椤?,
    "鍒朵綔涓€涓數鍟嗕骇鍝佸崱鐗囷紝甯︽坊鍔犲埌璐墿杞﹀姛鑳?,
    "鍒涘缓涓€涓敤鎴蜂华琛ㄦ澘锛屽甫鍥捐〃鍜屾寚鏍?,
    "鏋勫缓涓€涓甫楠岃瘉鐨勮仈绯昏〃鍗?,
    "璁捐涓€涓崥瀹㈡枃绔犲竷灞€锛屽甫浣滆€呬俊鎭?,
    "鍒涘缓涓€涓甫鐏妯℃€佹鐨勫浘鐗囩敾寤?,
    "鍒朵綔涓€涓畾浠峰姣旇〃鏍?,
    "鍒涘缓涓€涓搷搴斿紡鐨勫鑸彍鍗?
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
              : 'GitHub 宸茶繛鎺ヤ絾 token 鏈瓨鍌ㄣ€傛煇浜涘姛鑳藉彲鑳芥棤娉曞伐浣溿€?
            : language === 'en'
              ? 'GitHub connected but there was an issue storing your token.'
              : 'GitHub 宸茶繛鎺ヤ絾瀛樺偍 token 鏃跺嚭鐜伴棶棰樸€?

          // Add warning message to conversation
          const warningMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `鈿狅笍 ${message}`,
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
    setIsStreaming(true)
    setStreamingCode('')
    setGeneratedProject(null)
    setCurrentSegment(0)
    setTotalSegments(0)

    // 纭繚鏈夊璇滻D锛屽鏋滄病鏈夊垯鍒涘缓鏂板璇?
    let conversationIdToUse = currentConversationId
    if (!conversationIdToUse && authSession?.accessToken) {
      try {
        console.log('馃摑 Creating new conversation...')
        const response = await fetch("/api/conversations/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.accessToken}`,
          },
          body: JSON.stringify({
            title: trimmedPrompt.substring(0, 50) || (language === "en" ? "New Conversation" : "鏂板缓瀵硅瘽"),
          }),
        })

        if (response.ok) {
          const data = await response.json()
          conversationIdToUse = data.conversation.id
          setCurrentConversationId(conversationIdToUse)
          console.log('鉁?Created conversation:', conversationIdToUse)
        } else {
          console.error('鉂?Failed to create conversation:', response.status)
          throw new Error('Failed to create conversation')
        }
      } catch (error) {
        console.error("Error creating conversation:", error)
        throw error
      }
    }

    // 纭繚鏈夊璇滻D鎵嶇户缁?
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
    
    // 淇濆瓨鐢ㄦ埛娑堟伅鍒版暟鎹簱
    console.log('馃捑 Saving user message to conversation:', conversationIdToUse)
    await saveMessageToConversation(conversationIdToUse, 'user', trimmedPrompt)

    // 鐩存帴鐢熸垚浠ｇ爜骞跺墠绔墦瀛楁満鏁堟灉
    await startDirectGeneration(trimmedPrompt, conversationIdToUse)
  } catch (error: any) { if (error.name === 'AbortError') { console.log('用户取消生成') return } console.error('生成失败:', error) setError(error.message || '生成失败，请重试') setIsGenerating(false) setIsStreaming(false) setAbortController(null) } }
