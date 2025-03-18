import { FC } from "react"
import Link from "next/link"

/**
 * PrivacyPolicyPage Component
 * 
 * @returns 개인정보처리방침 페이지 컴포넌트
 */
const PrivacyPolicyPage: FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">개인정보처리방침</h1>
      
      <div className="prose prose-lg">
        <p className="mb-4">
          rtB Sync(이하 "서비스")는 사용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하고 있습니다.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. 수집하는 개인정보</h2>
        <p>
          서비스는 다음과 같은 개인정보를 수집할 수 있습니다:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>이메일 주소</li>
          <li>이름 또는 닉네임</li>
          <li>프로필 사진</li>
          <li>IP 주소 및 사용 기록</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. 개인정보의 수집 및 이용목적</h2>
        <p>
          수집한 개인정보는 다음 목적을 위해 활용됩니다:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>서비스 제공 및 계정 관리</li>
          <li>사용자 인증 및 본인확인</li>
          <li>서비스 품질 개선</li>
          <li>불법 이용 방지 및 보안</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. 개인정보의 보유 및 파기</h2>
        <p>
          사용자의 개인정보는 서비스 이용 기간 동안에만 보유하며, 목적 달성 후 또는 서비스 탈퇴 시 즉시 파기합니다.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. 개인정보의 제3자 제공</h2>
        <p>
          서비스는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 근거하거나 사용자의 동의가 있는 경우에는 예외적으로 제3자에게 제공할 수 있습니다.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. 개인정보 보호 조치</h2>
        <p>
          서비스는 사용자의 개인정보 보호를 위해 기술적, 관리적 조치를 취하고 있습니다.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. 개인정보 관련 문의</h2>
        <p>
          개인정보 관련 문의는 아래 연락처로 가능합니다:
        </p>
        <p>이메일: park@jiwon.me</p>

        <div className="mt-12 mb-8">
          <p>마지막 업데이트: {new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>
      
      <div className="mt-12">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage 