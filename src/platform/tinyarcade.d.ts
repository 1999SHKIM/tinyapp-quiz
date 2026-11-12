// [참고] SDK 원본을 수정하지 않고 window에 제공되는 함수의 타입만 선언한다.
export interface StartResponse {
  sessionId: string | null
  loggedIn: boolean
  testMode: boolean
}
export interface SubmitResponse {
  score: number
  verifyStatus: 'NORMAL' | 'PENDING' | null
  testMode: boolean
}
declare global {
  interface Window {
    TinyArcade?: {
      version: string
      start(): Promise<StartResponse>
      submitScore(score: number): Promise<SubmitResponse>
    }
  }
}
