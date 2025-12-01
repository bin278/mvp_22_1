"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download, ArrowLeft, Check, Eye, Code2, Keyboard, X } from "lucide-react"
import Link from "next/link"
import { downloadAsProperZip } from "@/lib/download-helper"
import type { GeneratedProject } from "@/lib/code-generator"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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
  },
}

export default function GeneratePage() {
  const [language, setLanguage] = useState<"en" | "zh">("en")
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<"code" | "preview">("code")
  const [selectedFile, setSelectedFile] = useState<string>("src/App.tsx")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [showTips, setShowTips] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const t = translations[language]

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to generate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isGenerating) {
        e.preventDefault()
        handleGenerate()
      }
      // Ctrl/Cmd + Shift + P to toggle preview
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        if (generatedProject) {
          setViewMode(viewMode === "code" ? "preview" : "code")
        }
      }
      // Ctrl/Cmd + C to copy when code view is active
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && viewMode === "code" && generatedProject) {
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
  }, [isGenerating, viewMode, generatedProject, previewUrl])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)

    // Add user message to conversation history
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate code')
      }

      const data = await response.json()
      setGeneratedProject(data.project)
      setSelectedFile('src/App.tsx')
      setViewMode('code')

      // Add AI response to conversation history
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Generated ${Object.keys(data.project.files).length} files for your request: "${prompt.trim()}"`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])

      // Clear the input after successful generation
      setPrompt("")
    } catch (error) {
      console.error('Error generating code:', error)
      alert('Failed to generate code. Please try again.')
    } finally {
      setIsGenerating(false)
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

  const handlePreview = async () => {
    if (!prompt.trim()) return

    try {
      const response = await fetch('/api/preview-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (response.ok) {
        const previewHtml = await response.text()
        console.log('Preview HTML length:', previewHtml.length)

        // Create a blob URL for the preview
        const blob = new Blob([previewHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setViewMode('preview')

        console.log('Preview created successfully')
      } else {
        const errorText = await response.text()
        console.error('Preview API error:', response.status, errorText)
        throw new Error(`Preview generation failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error creating preview:', error)
      alert('Failed to create preview. Please try again or download the ZIP file to run locally.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="w-full px-4 flex h-16 items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
          </Link>
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
            <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
              {language === "en" ? "中文" : "English"}
            </Button>
          </div>
        </div>
      </header>

      <main className="py-12">
        <div className="w-full">
          <div className="mb-8 text-center">
            <p className="text-lg text-muted-foreground">{t.subtitle}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent">
              <Sparkles className="h-4 w-4" />
              {t.note}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Conversation History and Input */}
            <div className="lg:col-span-1 space-y-4">
              {/* Conversation History */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-lg h-[33vh]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {language === "en" ? "Conversation History" : "对话记录"}
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
                  <div className="space-y-4 h-[calc(33vh-80px)] overflow-y-auto">
                  {messages.length > 0 ? (
                    <>
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-50" />
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

              {/* Input Section */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-lg h-[33vh] flex flex-col">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-1 resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    size="lg"
                    className="bg-accent hover:bg-accent/90"
                  >
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {t.generating}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t.generate}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isGenerating && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Generating your app...</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full animate-pulse" style={{ width: '65%' }} />
                        </div>
                        <span className="text-sm font-medium text-accent">65%</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                          <div className="w-full bg-accent/20 rounded-full h-1">
                            <div className="bg-accent h-1 rounded-full w-full"></div>
                          </div>
                          <p className="text-xs text-muted-foreground">Analyzing</p>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-accent/20 rounded-full h-1">
                            <div className="bg-accent h-1 rounded-full w-3/4"></div>
                          </div>
                          <p className="text-xs text-muted-foreground">Generating</p>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-accent/20 rounded-full h-1">
                            <div className="bg-accent h-1 rounded-full w-1/2"></div>
                          </div>
                          <p className="text-xs text-muted-foreground">Optimizing</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Creating components and styling...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Output Section - 只保留这一个 */}
            <div className="space-y-4 lg:col-span-2">
              {generatedProject ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold">{t.generatedCode}</h2>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {Object.keys(generatedProject.files).length} {t.fileCount}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
                      >
                        <Eye className="h-4 w-4" />
                        {language === "en" ? "Live Preview" : "实时预览"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "code" ? "preview" : "code")}
                        className="gap-2"
                      >
                        {viewMode === "code" ? (
                          <>
                            <Code2 className="h-4 w-4" />
                            {t.viewCode}
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            {t.viewPreview}
                          </>
                        )}
                      </Button>
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
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card overflow-hidden h-[66vh]">
                    {viewMode === "code" ? (
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
                              {generatedProject.files[selectedFile]}
                            </code>
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col">
                        {previewUrl ? (
                          <div className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-200">
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600 ml-2">Live Preview</span>
                              </div>
                              <button
                                onClick={() => setPreviewUrl("")}
                                className="text-gray-400 hover:text-gray-600 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                            <iframe
                              src={previewUrl}
                              className="w-full h-[66vh] border-0"
                              title="Live Preview"
                              sandbox="allow-scripts allow-same-origin"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8">
                            <div className="bg-secondary/50 rounded-lg p-4 mb-4 max-w-md">
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Project Information:</strong>
                              </p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div><strong>Project Name:</strong> {generatedProject.projectName}</div>
                                <div><strong>Files Generated:</strong> {Object.keys(generatedProject.files).length}</div>
                                <div><strong>Template Type:</strong> {generatedProject.files['src/App.tsx']?.includes('useState') ? 'Interactive' : 'Static'}</div>
                              </div>
                            </div>

                            <Sparkles className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                            <p className="text-gray-600 text-center mb-6 max-w-md">
                              {language === "en"
                                ? "Click 'Live Preview' to see your app running instantly in the browser!"
                                : "点击'实时预览'按钮，在浏览器中即时查看您的应用运行效果！"}
                            </p>
                            <button
                              onClick={handlePreview}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              {language === "en" ? "Live Preview" : "实时预览"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-[66vh] items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
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
    </div>
  )
}