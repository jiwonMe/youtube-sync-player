"use client"

import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { StepsSection } from "@/components/home/steps-section"
import { CTASection } from "@/components/home/cta-section"
import { FooterSection } from "@/components/home/footer-section"

/**
 * HomePage 컴포넌트
 * 웹사이트의 메인 페이지
 */
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}

