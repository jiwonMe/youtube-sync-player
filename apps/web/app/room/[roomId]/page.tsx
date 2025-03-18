import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import RoomClient from "@/components/room-client"

/**
 * Room 페이지 props 타입 정의
 */
interface RoomPageProps {
  params: Promise<{ roomId: string }> | { roomId: string }
}

/**
 * 특정 룸 ID를 위한 동적 페이지
 * 
 * @param params - URL에서 추출된 roomId 매개변수
 */
export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params
  
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomClient roomId={roomId} />
    </Suspense>
  )
}

function RoomSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Room info bar skeleton */}
      <div className="bg-muted p-2 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-16 ml-2" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>

      {/* Main content skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video player skeleton */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="relative bg-black aspect-video">
            <Skeleton className="h-full w-full" />
          </div>

          {/* Controls skeleton */}
          <div className="p-2 bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        {/* Sidebar skeleton - desktop only */}
        <div className="hidden md:block w-80 border-l bg-card flex-shrink-0">
          <div className="h-10 bg-muted flex items-center px-2">
            <Skeleton className="h-6 w-full" />
          </div>
          <div className="p-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex p-2 border-b gap-2 mb-2">
                  <Skeleton className="h-16 w-28 rounded-md" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

