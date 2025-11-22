"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface HeroSectionProps {
  language: "en" | "zh"
}

const translations = {
  en: {
    badge: "AI-Powered Code Generation",
    title: "Build apps from a single sentence",
    subtitle:
      "Describe your UI idea in plain language, and watch as AI generates production-ready frontend code instantly. Perfect for React and Next.js components.",
    placeholder: 'Describe your app idea... e.g., "Create a todo list with dark mode"',
    generate: "Generate App",
    generating: "Generating...",
    viewExample: "View Example",
  },
  zh: {
    badge: "AI 驱动的代码生成",
    title: "一句话生成完整应用",
    subtitle: "用自然语言描述你的界面想法，AI 将立即生成可用于生产环境的前端代码。完美支持 React 和 Next.js 组件。",
    placeholder: '描述你的应用想法... 例如："创建一个带深色模式的待办事项列表"',
    generate: "生成应用",
    generating: "生成中...",
    viewExample: "查看示例",
  },
}

export function HeroSection({ language }: HeroSectionProps) {
  const t = translations[language]
  const [prompt, setPrompt] = useState("")
  const router = useRouter()

  const handleGenerate = () => {
    if (!prompt.trim()) return
    router.push("/generate")
  }

  return (
    <section className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="container relative py-24 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">{t.badge}</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            <span className="gradient-text text-balance">{t.title}</span>
          </h1>

          <p className="mb-12 text-lg text-muted-foreground md:text-xl text-balance max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>

          <div className="mx-auto max-w-3xl">
            <div className="relative rounded-xl border border-border bg-card p-2 shadow-2xl">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.placeholder}
                className="min-h-[120px] resize-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  {t.viewExample}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  size="lg"
                  className="bg-accent hover:bg-accent/90"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t.generate}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2 text-sm text-accent">
            <Sparkles className="h-4 w-4" />
            {language === "en"
              ? "Frontend UI Generation Only - React, Next.js, Tailwind CSS"
              : "仅生成前端界面 - React、Next.js、Tailwind CSS"}
          </div>
        </div>
      </div>
    </section>
  )
}
