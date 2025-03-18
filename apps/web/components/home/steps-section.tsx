"use client"

import { PlusCircle, Users, Play, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Steps 섹션 컴포넌트
 * 앱 사용 방법을 단계별로 보여주는 섹션
 */
export function StepsSection() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const steps = [
    {
      number: "1",
      title: "Create a Room",
      description: "Set up a new room in seconds. Add a name and optional password.",
      icon: <PlusCircle className="h-8 w-8" />,
      color: "from-red-500 to-rose-500",
      link: "/create-room"
    },
    {
      number: "2",
      title: "Invite Friends",
      description: "Share your room ID with friends so they can join instantly.",
      icon: <Users className="h-8 w-8" />,
      color: "from-rose-500 to-pink-500",
      link: "/join-room"
    },
    {
      number: "3",
      title: "Watch Together",
      description: "Add videos to the playlist and enjoy synchronized playback.",
      icon: <Play className="h-8 w-8" />,
      color: "from-pink-500 to-red-400",
      link: "/"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-muted/50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-red-500/10 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-red-500/10 to-transparent"></div>
        {isMounted && (
          <>
            <div className="absolute top-1/4 right-[15%] w-56 h-56 bg-rose-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div 
              className="absolute bottom-1/4 left-[15%] w-56 h-56 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
          </>
        )}
      </div>
      
      <div className="container px-4 md:px-6 mx-auto relative z-10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="px-3 py-1 border-red-500/20 shadow-sm shadow-red-500/10 bg-background/80 transition-all duration-300 hover:shadow-red-500/20 hover:border-red-500/30"
            >
              <span className="text-red-500 font-medium">How It Works</span>
            </Badge>
            <span className="h-px w-12 bg-gradient-to-r from-red-500/50 to-red-500/10"></span>
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Simple Steps to <span className="text-red-500 relative inline-block">
              Get Started
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500/50"></span>
            </span>
          </h2>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Follow these easy steps to start watching videos with friends.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {steps.map((step, index) => (
            <StepCard
              key={index}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              color={step.color}
              link={step.link}
              isHovered={hoveredStep === index}
              onHover={() => setHoveredStep(index)}
              onLeave={() => setHoveredStep(null)}
              index={index}
              isMounted={isMounted}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Step 카드 컴포넌트
 * @param number - 단계 번호
 * @param title - 단계 제목
 * @param description - 단계 설명
 * @param icon - 단계 아이콘
 * @param color - 아이콘 배경 그라데이션 색상
 * @param link - 링크 URL
 * @param isHovered - 호버 상태 여부
 * @param onHover - 호버 시작 핸들러
 * @param onLeave - 호버 종료 핸들러
 * @param index - 카드 인덱스 (애니메이션 지연에 사용)
 * @param isMounted - 클라이언트 사이드 마운트 여부
 */
function StepCard({
  number,
  title,
  description,
  icon,
  color,
  link,
  isHovered,
  onHover,
  onLeave,
  index,
  isMounted
}: {
  number: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  link: string
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  index: number
  isMounted: boolean
}) {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-red-500/5 transition-all duration-300",
        "hover:border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-1",
        "data-[state=open]:shadow-lg"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ 
        animationDelay: isMounted ? `${index * 200}ms` : undefined,
      }}
    >
      <span className={cn(
        "absolute -top-6 -right-6 text-9xl font-bold opacity-10 text-red-500/20 transition-all duration-300",
        isHovered && "opacity-20 scale-110"
      )}>
        {number}
      </span>
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            `p-2 rounded-full text-white bg-gradient-to-br ${color} shadow-md shadow-red-500/10 transition-all duration-300`,
            isHovered && "scale-110 rotate-3"
          )}>
            {icon}
          </div>
          <CardTitle className={cn(
            "transition-all duration-300",
            isHovered && "text-red-500"
          )}>
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="relative z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 p-0 h-auto text-red-500 group transition-all duration-300" 
          asChild
        >
          <Link href={link}>
            <span className="relative">
              Learn more
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500/50 group-hover:w-full transition-all duration-300"></span>
            </span>
            <ChevronRight className={cn(
              "h-3 w-3 ml-1 transition-transform duration-300",
              isHovered && "translate-x-1"
            )} />
          </Link>
        </Button>
      </CardFooter>
      
      {/* Animated border effect on hover */}
      <div className={cn(
        "absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-red-500 to-transparent transition-property-[width] transition-duration-500",
        isHovered && "w-full"
      )} />
      <div className={cn(
        "absolute right-0 bottom-0 w-0.5 h-0 bg-gradient-to-t from-red-500 to-transparent transition-property-[height] transition-duration-500 transition-delay-150",
        isHovered && "h-full"
      )} />
      <div className={cn(
        "absolute top-0 right-0 w-0 h-0.5 bg-gradient-to-l from-red-500 to-transparent transition-property-[width] transition-duration-500 transition-delay-300",
        isHovered && "w-full"
      )} />
      <div className={cn(
        "absolute left-0 top-0 w-0.5 h-0 bg-gradient-to-b from-red-500 to-transparent transition-property-[height] transition-duration-500 transition-delay-450",
        isHovered && "h-full"
      )} />
    </Card>
  )
} 