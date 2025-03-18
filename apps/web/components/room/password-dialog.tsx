import React, { useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

/**
 * 비밀번호 입력 대화상자 Props
 */
interface PasswordDialogProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (password: string) => Promise<boolean>
  roomName: string
}

/**
 * 비밀번호 보호된 방에 입장할 때 사용하는 대화상자 컴포넌트
 */
export function PasswordDialog({ isOpen, onClose, onVerify, roomName }: PasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * 비밀번호 확인 핸들러
   */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError("비밀번호를 입력해주세요")
      return
    }
    
    setIsVerifying(true)
    setError(null)
    
    try {
      const success = await onVerify(password)
      
      if (!success) {
        setError("비밀번호가 일치하지 않습니다")
      }
    } catch (err) {
      setError("비밀번호 확인 중 오류가 발생했습니다")
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2 text-amber-500" />
            비밀번호 보호된 방
          </DialogTitle>
          <DialogDescription>
            &quot;{roomName}&quot; 방은 비밀번호로 보호되어 있습니다.
            입장하려면 비밀번호를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleVerify}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="방 비밀번호 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isVerifying}
                className={error ? "border-red-500" : ""}
                autoFocus
              />
              {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isVerifying}>
              취소
            </Button>
            <Button type="submit" disabled={isVerifying}>
              {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isVerifying ? "확인 중..." : "입장하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 