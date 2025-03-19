"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { 
  User, 
  Settings, 
  Clock, 
  Share2, 
  Youtube, 
  LogOut,
  Star,
  MessagesSquare
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatDuration } from "@/lib/utils"

/**
 * 사용자 통계 인터페이스
 */
interface UserStats {
  roomsCreated: number;
  roomsJoined: number;
  totalWatchTime: string;
  favoriteCategory: string;
}

/**
 * 최근 방 인터페이스
 */
interface RecentRoom {
  id: string;
  name: string;
  host_username: string;
  host_avatar_url: string | null;
  user_count: number;
  last_joined: string;
}

/**
 * Profile 페이지 컴포넌트
 * 사용자의 프로필 정보 및 활동을 표시합니다.
 */
export default function ProfilePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in")
      return
    } 
    
    if (isLoaded && isSignedIn) {
      // 사용자 데이터 가져오기
      fetchUserData()
    }
  }, [isLoaded, isSignedIn, router])

  /**
   * 사용자 데이터를 가져오는 함수
   */
  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      
      // 사용자 통계 가져오기
      const statsResponse = await fetch('/api/profile/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch user stats')
      }
      const statsData = await statsResponse.json()
      
      // 통계 데이터 파싱 및 포맷팅
      setStats({
        roomsCreated: statsData.roomsCreated || 0,
        roomsJoined: statsData.roomsJoined || 0,
        totalWatchTime: formatDuration(statsData.totalWatchSeconds || 0),
        favoriteCategory: statsData.favoriteCategory || 'None'
      })
      
      // 최근 방 기록 가져오기
      const roomsResponse = await fetch('/api/profile/recent-rooms')
      if (!roomsResponse.ok) {
        throw new Error('Failed to fetch recent rooms')
      }
      const roomsData = await roomsResponse.json()
      setRecentRooms(roomsData.rooms || [])
      
    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while clerk loads
  if (!isLoaded) {
    return <ProfileSkeleton />
  }

  // User is not signed in
  if (!isSignedIn) {
    return null // This will redirect via the useEffect hook
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95 items-center">
      {/* Decorative elements with reduced opacity */}
      <div className="fixed top-20 right-0 w-96 h-96 bg-primary/3 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-blue-500/3 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -z-10 animate-pulse" style={{ animationDelay: "2s" }}></div>
      
      <div className="container max-w-5xl px-4 py-10 space-y-8 animate-in fade-in-50 duration-500">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center p-6 md:p-8 rounded-xl bg-background/90 backdrop-blur-sm border border-border shadow-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/40 to-blue-500/40 rounded-full opacity-70 blur-sm group-hover:opacity-100 transition duration-300"></div>
            {user?.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || "Profile"} 
                className="w-24 h-24 rounded-full object-cover border-2 border-background relative z-10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center relative z-10">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Decorative stars with softer color */}
            <div className="absolute -top-2 -right-1 transform rotate-12 text-amber-400 opacity-0 group-hover:opacity-70 transition-opacity z-20 duration-500">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="absolute -bottom-1 -left-2 transform -rotate-12 text-amber-400 opacity-0 group-hover:opacity-70 transition-opacity z-20 duration-500" style={{ transitionDelay: "150ms" }}>
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{user?.fullName || "User"}</h1>
            <p className="text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-1.5 transition-all duration-300 hover:shadow-sm" onClick={() => openUserProfile()}>
                <Settings className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive transition-all duration-300 hover:shadow-sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Tabs section with improved styling */}
        <div className="rounded-xl bg-background/90 backdrop-blur-sm border border-border shadow-md p-6 md:p-8">
          <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:w-[400px] mx-auto border border-border bg-background/50 p-1">
              <TabsTrigger value="overview" className="relative overflow-hidden group data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
                Overview
                <span className={`absolute inset-x-0 -bottom-px h-px bg-primary transition-all duration-300 ${activeTab === 'overview' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="relative overflow-hidden group data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
                Activity
                <span className={`absolute inset-x-0 -bottom-px h-px bg-primary transition-all duration-300 ${activeTab === 'activity' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="relative overflow-hidden group data-[state=active]:bg-primary/10 data-[state=active]:text-foreground">
                Settings
                <span className={`absolute inset-x-0 -bottom-px h-px bg-primary transition-all duration-300 ${activeTab === 'settings' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 slide-in-from-left-5 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stats Cards with improved styling */}
                <Card className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Youtube className="h-4 w-4 text-primary" />
                      Rooms Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.roomsCreated || 0}</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Share2 className="h-4 w-4 text-primary" />
                      Rooms Joined
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.roomsJoined || 0}</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      Watch Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalWatchTime || '0h 0m'}</p>
                  </CardContent>
                </Card>

                <Card className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <CardHeader className="pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      Favorite Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : stats?.favoriteCategory || 'None'}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-30"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <MessagesSquare className="h-5 w-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your recent viewing activity and room participation</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentRooms.length > 0 ? (
                    <div className="space-y-4">
                      {recentRooms.slice(0, 3).map((room) => (
                        <div key={room.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                          <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Youtube className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{room.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Hosted by {room.host_username} • {new Date(room.last_joined).toLocaleDateString()}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="ml-auto"
                            onClick={() => router.push(`/room/${room.id}`)}
                          >
                            Join
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-6">
                      <p>No recent activities to display</p>
                      <Button variant="link" className="mt-2 text-primary hover:text-primary/80" asChild>
                        <a href="/create-room">Create a new room</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 slide-in-from-left-5 duration-300">
              <Card className="border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-30"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="h-5 w-5 text-primary" />
                    Room History
                  </CardTitle>
                  <CardDescription>Rooms you've created or participated in</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Skeleton className="h-12 w-12 rounded-md" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentRooms.length > 0 ? (
                    <div className="space-y-4">
                      {recentRooms.map((room) => (
                        <div key={room.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/5 transition-colors">
                          <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Youtube className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{room.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Hosted by {room.host_username} • {new Date(room.last_joined).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {room.user_count} {room.user_count === 1 ? 'user' : 'users'}
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => router.push(`/room/${room.id}`)}
                            >
                              Join
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-center py-6">
                      <p>No room history available</p>
                      <Button variant="link" className="mt-2 text-primary hover:text-primary/80" asChild>
                        <a href="/join-room">Join a room</a>
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center border-t border-border pt-6 relative z-10">
                  <Button 
                    variant="outline"
                    className="transition-all duration-300 hover:shadow-sm"
                    disabled={isLoading || recentRooms.length === 0}
                    onClick={() => fetchUserData()}
                  >
                    Refresh
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 slide-in-from-left-5 duration-300">
              <Card className="border-border bg-background/60 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-30"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Profile Settings
                  </CardTitle>
                  <CardDescription>Manage your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="account-settings">Account Settings</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-300 hover:shadow-sm"
                        onClick={() => openUserProfile()}
                      >
                        Manage
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Update your profile information, email, and password
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="preferences">Notification Preferences</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-300 hover:shadow-sm"
                        disabled={isLoading}
                      >
                        Configure
                      </Button>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Choose when and how you'd like to be notified
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-border pt-6 relative z-10">
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:text-destructive transition-all duration-300 hover:shadow-sm"
                    disabled={isLoading}
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-300"
                    disabled={isLoading}
                  >
                    Save Changes
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

/**
 * 프로필 페이지 로딩 상태 컴포넌트
 */
function ProfileSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-background/95 items-center">
      <div className="container max-w-5xl px-4 py-10 space-y-8">
        {/* Profile header skeleton */}
        <div className="p-6 md:p-8 rounded-xl bg-background/90 backdrop-blur-sm border border-border shadow-md">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-[100px]" />
                <Skeleton className="h-9 w-[100px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and content skeleton */}
        <div className="rounded-xl bg-background/90 backdrop-blur-sm border border-border shadow-md p-6 md:p-8">
          <div className="space-y-8">
            <Skeleton className="h-10 w-[400px] mx-auto" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
              ))}
            </div>

            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
} 