"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { ExamplesSection } from "@/components/examples-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  const [language, setLanguage] = useState<"en" | "zh">("en")

  return (
    <div className="min-h-screen bg-background">
      <Header language={language} setLanguage={setLanguage} />
      <main>
        <HeroSection language={language} />
        <FeaturesSection language={language} />
        <ExamplesSection language={language} />
      </main>
      <Footer language={language} />
    </div>
  )
}
