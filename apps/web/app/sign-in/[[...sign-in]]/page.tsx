import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        routing="path"
        path="/sign-in/"
        signUpUrl="/sign-up/"
        redirectUrl="/"
      />
      <div className="mt-8 text-sm text-muted-foreground">
        <Link 
          href="/privacy-policy" 
          className="underline underline-offset-4 hover:text-foreground"
        >
          개인정보처리방침
        </Link>
      </div>
    </div>
  )
}

