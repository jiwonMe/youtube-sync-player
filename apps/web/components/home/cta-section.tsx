"use client"

import { Plus, LogIn, Youtube } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useTrackEvent } from "@/hooks/use-track-event"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * CTA 섹션 컴포넌트
 * 사용자에게 행동을 유도하는 Call-to-Action 섹션
 */
export function CTASection() {
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Mixpanel 이벤트 추적 초기화
  const analytics = useTrackEvent('HomeCTA')
  
  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    setIsMounted(true)
    
    // CTA 섹션 노출 이벤트 추적
    analytics.trackFeatureUsed('cta_section_viewed')
  }, [analytics])
  
  // 히어로 섹션으로 스크롤 처리
  const handleScrollToHero = () => {
    document.getElementById('hero-section')?.scrollIntoView({ behavior: 'smooth' })
    
    // CTA 방 생성 버튼 클릭 이벤트 추적
    analytics.trackButtonClick('cta_create_room')
  }
  
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-red-500/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {isMounted && (
          <>
            <div 
              className="absolute top-1/3 left-[10%] w-64 h-64 bg-red-500/30 rounded-full mix-blend-multiply filter blur-xl"
              style={{
                animation: "moveBlob 15s ease-in-out infinite alternate"
              }}
            />
            <div 
              className="absolute bottom-1/3 right-[10%] w-64 h-64 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl"
              style={{
                animation: "moveBlob 15s ease-in-out infinite alternate-reverse",
                animationDelay: "5s"
              }}
            />
          </>
        )}
      </div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4 md:w-1/2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to <span className="text-red-500 relative inline-block">
                Watch Together
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500/50"></span>
              </span>?
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Create a room and invite your friends with a simple link. Start enjoying videos together in perfect sync.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={handleScrollToHero}
                size="lg" 
                className="gap-2 bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 border-none transition-all duration-300 hover:-translate-y-1 group"
              >
                <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                Create a Room Now
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                asChild
                className="gap-2 border-red-500/20 shadow-md hover:bg-red-500/5 transition-all duration-300 hover:-translate-y-1 group"
              >
                <Link 
                  href="/join-room"
                  onClick={() => analytics.trackButtonClick('cta_join_room')}
                >
                  <LogIn className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  Join Existing Room
                </Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center md:justify-end">
            <div 
              className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden shadow-xl shadow-red-500/10 transition-all duration-500"
              onMouseEnter={() => {
                setIsHovered(true)
                analytics.trackFeatureUsed('cta_illustration_hovered')
              }}
              onMouseLeave={() => setIsHovered(false)}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-tr from-red-500/20 to-pink-500/20 z-10 transition-all duration-500",
                isHovered && "from-red-500/30 to-pink-500/30"
              )}></div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className={cn(
                  "bg-background/90 backdrop-blur-sm p-4 rounded-lg shadow-lg shadow-red-500/10 flex items-center gap-3 border border-red-500/10 transition-all duration-500",
                  isHovered && "shadow-red-500/20 border-red-500/20 scale-105"
                )}>
                  <Youtube className={cn(
                    "h-8 w-8 text-red-600 transition-all duration-500",
                    isHovered && "scale-110 rotate-3"
                  )} />
                  <div className="text-left">
                    <p className="font-medium">YouTube Sync Player</p>
                    <p className="text-xs text-muted-foreground">Watch together, anywhere</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-background/0 to-background/80 z-0"></div>
              
              {/* Animated particles */}
              <div className="absolute inset-0 z-5 overflow-hidden">
                {isMounted ? (
                  Array.from({ length: 10 }).map((_, i) => {
                    // Use Math.random only on client side
                    const top = `${Math.random() * 100}%`;
                    const left = `${Math.random() * 100}%`;
                    const scale = Math.random() + 0.5;
                    const duration = 1 + Math.random() * 2;
                    
                    return (
                      <div 
                        key={i}
                        className="absolute w-1 h-1 bg-red-500/50 rounded-full"
                        style={{
                          top,
                          left,
                          opacity: isHovered ? 0.5 : 0,
                          transform: `scale(${isHovered ? scale : 0})`,
                          transition: `all ${duration}s ease-out ${i * 0.1}s`
                        }}
                      />
                    );
                  })
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated wave effect at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-8 overflow-hidden">
        {isMounted ? (
          <div 
            className="absolute bottom-0 left-0 w-[200%] h-8 bg-red-500/5"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' opacity='.25' class='shape-fill'%3E%3C/path%3E%3Cpath d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' opacity='.5' class='shape-fill'%3E%3C/path%3E%3Cpath d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' class='shape-fill'%3E%3C/path%3E%3C/svg%3E\")",
              backgroundSize: "100% 100%",
              animation: "waveAnimation 25s linear infinite",
            }}
          />
        ) : (
          <div className="absolute bottom-0 left-0 w-[200%] h-8 bg-red-500/5" />
        )}
      </div>
    </section>
  )
}

// CSS 애니메이션 정의
// tailwind.config.js에 다음 내용 추가 필요:
// keyframes: {
//   moveBlob: {
//     "0%": { transform: "translate(0px, 0px) scale(1)" },
//     "33%": { transform: "translate(30px, -50px) scale(1.1)" },
//     "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
//     "100%": { transform: "translate(0px, 0px) scale(1)" }
//   },
//   waveAnimation: {
//     "0%": { transform: "translateX(0)" },
//     "50%": { transform: "translateX(-50%)" },
//     "100%": { transform: "translateX(0)" }
//   }
// } 