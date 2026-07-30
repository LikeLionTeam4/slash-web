import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { homePathForSession, setLoggedIn } from '../../lib/auth'
import { Mail } from 'lucide-react'

type Step = 'email' | 'sent' | 'code'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.87 2.69-6.64z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.85.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.34z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStep('sent')
  }

  const handleCodeSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    completeLogin()
  }

  // TODO: 백엔드 연동 시 실제 인증으로 교체한다. 지금은 로그인 여부 플래그만 세운다.
  const completeLogin = () => {
    setLoggedIn()
    navigate('/new')
  }

  return (
    <div className="flex h-screen w-full bg-canvas font-sans text-foreground">
      <div className="flex w-full flex-col px-10 py-8 lg:w-1/2">
        <button
          type="button"
          onClick={() => navigate(homePathForSession())}
          className="-mx-2 flex w-fit items-center gap-2 rounded-[8px] px-2 py-1 text-[15px] font-semibold transition-colors hover:bg-surface"
        >
          <img src="/logo.png" alt="" className="h-7 w-7 rounded-[7px]" />
          Slash
        </button>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold tracking-tight">무엇이든 물어보세요</h1>
            <p className="mt-3 text-muted">파일·웹 검색, 생성형 AI, PC 제어까지 한 번에.</p>

            <div className="mt-8 rounded-2xl border border-hairline bg-surface p-6 text-left">
              {step === 'email' && (
                <>
                  <button
                    type="button"
                    onClick={completeLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
                  >
                    <GoogleIcon />
                    Google로 계속하기
                  </button>

                  <div className="my-4 flex items-center gap-3 text-xs text-muted">
                    <div className="h-px flex-1 bg-hairline" />
                    또는
                    <div className="h-px flex-1 bg-hairline" />
                  </div>

                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      className="w-full rounded-full border border-hairline bg-canvas px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-foreground px-4 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                    >
                      이메일로 계속하기
                    </button>
                  </form>
                </>
              )}

              {step === 'sent' && (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <Mail className="text-accent-blue" size={28} />
                  <p className="text-sm text-foreground">
                    계속하려면 다음 주소로 전송된 링크를 클릭하세요
                    <br />
                    <span className="font-medium">{email}</span>
                  </p>
                  <div className="flex flex-col gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('code')}
                      className="text-muted underline-offset-2 hover:text-foreground hover:underline"
                    >
                      인증 코드 입력
                    </button>
                    <button
                      type="button"
                      className="text-muted underline-offset-2 hover:text-foreground hover:underline"
                    >
                      이메일 재전송
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-muted underline-offset-2 hover:text-foreground hover:underline"
                    >
                      다른 이메일 사용
                    </button>
                  </div>
                </div>
              )}

              {step === 'code' && (
                <>
                  <p className="text-sm text-foreground">
                    다음 주소로 전송된 인증 코드를 입력하세요
                    <br />
                    <span className="font-medium">{email}</span>
                  </p>
                  <form onSubmit={handleCodeSubmit} className="mt-4 flex flex-col gap-3">
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="인증 코드 입력"
                      className="w-full rounded-full border border-hairline bg-canvas px-4 py-3 text-center text-sm text-foreground placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-foreground px-4 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
                    >
                      이메일 주소 인증
                    </button>
                  </form>
                  <p className="mt-4 text-center text-xs text-muted">
                    받은 편지함에서 이메일을 찾을 수 없나요?{' '}
                    <button type="button" className="text-foreground underline-offset-2 hover:underline">
                      다시 보내기
                    </button>
                    <br />
                    이메일이 잘못되었나요?{' '}
                    <button
                      type="button"
                      onClick={() => setStep('email')}
                      className="text-foreground underline-offset-2 hover:underline"
                    >
                      이메일 주소 변경
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden flex-1 items-stretch p-3 lg:flex">
        <div className="flex w-full items-center justify-center rounded-3xl border border-hairline bg-surface-raised">
          <span className="text-sm text-muted">이미지 영역 (와이어프레임 placeholder)</span>
        </div>
      </div>
    </div>
  )
}
