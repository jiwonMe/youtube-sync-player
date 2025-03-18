"use client"

import { Play, ListVideo, Users, Music, Clock, Plus, ChevronRight } from "lucide-react"
// import { useInView } from "react-intersection-observer"
import { useState, useEffect, useRef } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Features 섹션 컴포넌트
 * 앱의 주요 기능을 보여주는 섹션
 */
export function FeaturesSection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  // const { ref, inView } = useInView({
  //   triggerOnce: false,
  //   threshold: 0.1,
  // })
  const [inView, setInView] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 스크롤 이벤트를 감지하여 요소가 화면에 보이는지 확인
  useEffect(() => {
    if (!isMounted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [isMounted])

  const features = [
    {
      icon: <Play className="h-10 w-10" />,
      title: "Synchronized Playback",
      description: "Watch videos in perfect sync with everyone in the room. Play, pause, and seek together.",
      color: "from-red-500/80 to-rose-500/80"
    },
    {
      icon: <ListVideo className="h-10 w-10" />,
      title: "Shared Playlists",
      description: "Build a queue of videos together. Anyone can add videos to the playlist.",
      color: "from-rose-500/80 to-pink-500/80"
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Watch Together",
      description: "Invite friends with a simple link. No account required to join.",
      color: "from-pink-500/80 to-red-400/80"
    },
    {
      icon: <Music className="h-10 w-10" />,
      title: "Chat While Watching",
      description: "Built-in chat to discuss the video in real-time with other viewers.",
      color: "from-red-400/80 to-orange-500/80"
    },
    {
      icon: <Clock className="h-10 w-10" />,
      title: "No Time Limits",
      description: "Watch for as long as you want. No restrictions on session duration.",
      color: "from-orange-500/80 to-amber-500/80"
    },
    {
      icon: <Plus className="h-10 w-10" />,
      title: "Easy to Use",
      description: "Simple interface that anyone can use. No technical knowledge required.",
      color: "from-amber-500/80 to-red-500/80"
    }
  ]

  return (
    <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background/80 relative overflow-hidden">
      {/* Enhanced background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {isMounted && (
          <>
            <div className="absolute top-20 right-[10%] w-64 h-64 bg-red-500/40 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div 
              className="absolute bottom-20 left-[10%] w-64 h-64 bg-rose-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"
              style={{ animationDelay: "2s" }}
            ></div>
            <div 
              className="absolute top-1/3 left-1/4 w-48 h-48 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"
              style={{ animationDelay: "4s" }}
            ></div>
            <div 
              className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-orange-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"
              style={{ animationDelay: "3s" }}
            ></div>
          </>
        )}
      </div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div 
          ref={ref}
          className={cn(
            "flex flex-col items-center justify-center space-y-4 text-center mb-12 transition-all duration-700",
            inView && isMounted ? "opacity-100 translate-y-0" : "opacity-100 translate-y-0"
          )}
        >
          <div className="inline-flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="px-3 py-1 border-red-500/20 shadow-sm shadow-red-500/10 bg-background/80 transition-all duration-300 hover:shadow-red-500/20 hover:border-red-500/30"
            >
              <span className="text-red-500 font-medium">Features</span>
            </Badge>
            <span className="h-px w-12 bg-gradient-to-r from-red-500/50 to-red-500/10"></span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything You <span className="text-red-500 relative inline-block">
              Need
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500/50"></span>
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            A complete toolkit for the perfect shared viewing experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
              color={feature.color}
              isHovered={hoveredCard === index}
              onHover={() => setHoveredCard(index)}
              onLeave={() => setHoveredCard(null)}
              inView={inView}
              isMounted={isMounted}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Feature 카드 컴포넌트
 * @param icon - 기능을 나타내는 아이콘
 * @param title - 기능 제목
 * @param description - 기능 설명
 * @param index - 카드 인덱스 (애니메이션 지연에 사용)
 * @param color - 아이콘 배경 그라데이션 색상
 * @param isHovered - 호버 상태 여부
 * @param onHover - 호버 시작 핸들러
 * @param onLeave - 호버 종료 핸들러
 * @param inView - 뷰포트 내 표시 여부
 * @param isMounted - 클라이언트 사이드 마운트 여부
 */
function FeatureCard({
  icon,
  title,
  description,
  index,
  color,
  isHovered,
  onHover,
  onLeave,
  inView,
  isMounted
}: {
  icon: React.ReactNode
  title: string
  description: string
  index: number
  color: string
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  inView: boolean
  isMounted: boolean
}) {
  return (
    <Card 
      className={cn(
        "flex flex-col items-center text-center h-full border-red-500/5",
        "transition-property-[transform,border-color,box-shadow,opacity] transition-duration-500",
        "hover:border-red-500/20 hover:shadow-lg hover:-translate-y-1 hover:shadow-red-500/10",
        "data-[state=open]:shadow-lg",
        inView && isMounted
          ? `opacity-100 translate-y-0 transition-delay-[${index * 100}ms]` 
          : "opacity-100 translate-y-0"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <CardHeader>
        <div 
          className={cn(
            `p-3 rounded-full mb-4 transform transition-all duration-300 bg-gradient-to-br ${color} shadow-md shadow-red-500/5`,
            isHovered && "scale-110 rotate-3"
          )}
        >
          <div className="text-white">{icon}</div>
        </div>
        <CardTitle className={cn(
          "text-xl transition-all duration-300",
          isHovered && "text-red-500"
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
      <CardFooter className="pt-0 mt-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "text-red-500 p-0 h-auto group transition-all duration-300",
            isHovered ? "text-red-600" : "text-red-500/80"
          )}
        >
          <span className="relative">
            Learn more 
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 group-hover:w-full transition-all duration-300"></span>
          </span>
          <ChevronRight className={cn(
            "h-3 w-3 ml-1 transition-transform duration-300",
            isHovered && "translate-x-1"
          )} />
        </Button>
      </CardFooter>
    </Card>
  )
} 