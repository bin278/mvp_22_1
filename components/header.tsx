"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, Globe } from "lucide-react"

interface HeaderProps {
  language: "en" | "zh"
  setLanguage: (lang: "en" | "zh") => void
}

const translations = {
  en: {
    pricing: "Pricing",
    docs: "Docs",
    examples: "Examples",
    signIn: "Sign In",
    getStarted: "Get Started",
  },
  zh: {
    pricing: "价格",
    docs: "文档",
    examples: "示例",
    signIn: "登录",
    getStarted: "开始使用",
  },
}

export function Header({ language, setLanguage }: HeaderProps) {
  const t = translations[language]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold">CodeGen AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.docs}
            </a>
            <a href="#examples" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.examples}
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.pricing}
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "en" ? "zh" : "en")}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{language === "en" ? "中文" : "English"}</span>
          </Button>
          <Button variant="ghost" size="sm">
            {t.signIn}
          </Button>
          <Button size="sm" className="bg-accent hover:bg-accent/90">
            {t.getStarted}
          </Button>
        </div>
      </div>
    </header>
  )
}
