import { FC, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

/**
 * ColorMap
 * 자주 사용되는 색상 이름을 RGB 값으로 매핑
 */
const COLOR_MAP: Record<string, string> = {
  "red": "239,68,68",        // red-500
  "blue": "59,130,246",      // blue-500
  "green": "34,197,94",      // green-500
  "yellow": "234,179,8",     // yellow-500
  "purple": "168,85,247",    // purple-500
  "pink": "236,72,153",      // pink-500
  "indigo": "99,102,241",    // indigo-500
  "gray": "107,114,128",     // gray-500
  "white": "255,255,255",    // white
  "black": "0,0,0",          // black
}

/**
 * WaveProps
 * Wave 컴포넌트의 프로퍼티
 */
export interface WaveProps {
  /**
   * Wave container의 height
   */
  height?: number;
  /**
   * Wave 색상 (미리 정의된 색상 이름 또는 RGB 형식: "239,68,68" for red-500)
   */
  color?: string;
  /**
   * Wave opacity (0-100)
   */
  opacity?: number;
  /**
   * 애니메이션 duration (seconds)
   */
  animationDuration?: number;
  /**
   * 마운트시 fade-in 여부
   */
  fadeIn?: boolean;
  /**
   * Wave가 absolute position으로 표시됨
   */
  absolute?: boolean;
  /**
   * 추가 클래스 이름
   */
  className?: string;
}

/**
 * Wave 컴포넌트
 * 웹사이트 하단에 물결 효과 애니메이션 표시
 * @param props - Wave 컴포넌트의 프로퍼티
 * @returns Wave 컴포넌트
 */
export const Wave: FC<WaveProps> = ({
  height = 8,
  color = "red",
  opacity = 5,
  animationDuration = 25,
  fadeIn = true,
  absolute = true,
  className,
}) => {
  const [isMounted, setIsMounted] = useState(!fadeIn)

  // 클라이언트 사이드에서만 마운트 상태 업데이트
  useEffect(() => {
    if (fadeIn) {
      const timer = setTimeout(() => {
        setIsMounted(true)
      }, 50)
      
      return () => clearTimeout(timer)
    }
  }, [fadeIn])

  // RGB 값 처리
  const rgbColor = COLOR_MAP[color] || color

  const baseWaveContainerClass = "w-full overflow-hidden pointer-events-none"
  
  const containerClasses = cn(
    baseWaveContainerClass,
    absolute && "absolute bottom-0 left-0",
    fadeIn && !isMounted && "opacity-0",
    fadeIn && isMounted && "opacity-100 transition-opacity duration-600 ease-out",
    className
  )
  
  // Create SVG with dynamic color - improved version
  const svgWave = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120' preserveAspectRatio='none'>
      <path d='M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z' fill='rgba(${rgbColor}, ${opacity / 100 * 0.25})' />
      <path d='M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z' fill='rgba(${rgbColor}, ${opacity / 100 * 0.5})' />
      <path d='M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z' fill='rgba(${rgbColor}, ${opacity / 100})' />
    </svg>
  `.trim().replace(/\n\s+/g, '');

  // Convert SVG to base64 data URL for better browser compatibility
  const encodedSvg = typeof window !== 'undefined' ? 
    encodeURIComponent(svgWave).replace(/%20/g, ' ') : 
    encodeURIComponent(svgWave);
    
  const dataUrl = `data:image/svg+xml,${encodedSvg}`;

  return (
    <div className={containerClasses} style={{ height: `${height}px` }}>
      <div 
        style={{
          position: absolute ? 'absolute' : 'relative',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '100%',
          backgroundImage: `url("${dataUrl}")`,
          backgroundSize: "100% 100%",
          animation: `waveAnimation ${animationDuration}s linear infinite`,
        }}
      />
    </div>
  )
}

export default Wave 