"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Copy, Download, ArrowLeft, Check, Eye, Code2 } from "lucide-react"
import Link from "next/link"
import { downloadAsProperZip } from "@/lib/download-helper"
import type { GeneratedProject } from "@/lib/code-generator"

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

  const t = translations[language]

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)

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
      const response = await fetch('/api/preview-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (response.ok) {
        const previewHtml = await response.text()
        console.log('Preview HTML length:', previewHtml.length)
        console.log('Preview HTML preview:', previewHtml.substring(0, 200))
        
        const previewWindow = window.open('', '_blank', 'width=1000,height=700,scrollbars=yes')
        if (previewWindow) {
          previewWindow.document.write(previewHtml)
          previewWindow.document.close()
          previewWindow.focus()
          console.log('Preview window opened successfully')
        } else {
          alert('Please allow popups for this site to see the preview.')
        }
      } else {
        const errorText = await response.text()
        console.error('Preview API error:', response.status, errorText)
        throw new Error(`Preview generation failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error opening preview:', error)
      alert('Failed to open preview. Please try again or download the ZIP file to run locally.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setLanguage(language === "en" ? "zh" : "en")}>
            {language === "en" ? "中文" : "English"}
          </Button>
        </div>
      </header>

      <main className="container py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">{t.title}</h1>
            <p className="text-lg text-muted-foreground">{t.subtitle}</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent">
              <Sparkles className="h-4 w-4" />
              {t.note}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t.placeholder}
                  className="min-h-[200px] resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
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
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full w-1/3 rounded-full bg-accent animate-pulse" />
                      </div>
                      <span className="text-sm text-muted-foreground">33%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Analyzing your requirements...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Output Section */}
            <div className="space-y-4">
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
                        Live Preview
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

                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {viewMode === "code" ? (
                      <div className="grid grid-cols-[200px_1fr]">
                        {/* File Browser */}
                        <div className="border-r border-border bg-secondary/20 p-2 max-h-[500px] overflow-y-auto">
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
                        <div className="max-h-[500px] overflow-auto">
                          <pre className="p-6 text-sm">
                            <code className="text-foreground">
                              {generatedProject.files[selectedFile]}
                            </code>
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Project Information:</strong>
                          </p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div><strong>Project Name:</strong> {generatedProject.projectName}</div>
                            <div><strong>Files Generated:</strong> {Object.keys(generatedProject.files).length}</div>
                            <div><strong>Template Type:</strong> {generatedProject.files['src/App.tsx']?.includes('useState') ? 'Interactive' : 'Static'}</div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <p className="text-sm text-green-800 mb-2">
                            <strong>✅ New Features Available:</strong>
                          </p>
                          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                            <li>Click <strong>"Live Preview"</strong> to see your app running instantly</li>
                            <li>Click <strong>"Download ZIP"</strong> to get all files in a proper project structure</li>
                            <li>Extract the ZIP and run <code className="bg-green-100 px-1 py-0.5 rounded">npm install && npm run dev</code></li>
                          </ul>
                        </div>
                        
                        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                          <Sparkles className="mx-auto mb-4 h-12 w-12 text-accent" />
                          <p className="text-muted-foreground mb-4">
                            {language === "en" 
                              ? "Your project is ready! Use the buttons above to preview or download."
                              : "您的项目已准备就绪！使用上方按钮预览或下载。"}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                              onClick={handlePreview}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                            >
                              🚀 Open Live Preview
                            </button>
                            <button
                              onClick={handleDownload}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              📦 Download ZIP
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-card/50">
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
