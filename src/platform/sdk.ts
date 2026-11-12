export type RecordStatus = 'RECORD' | 'PREVIEW' | 'GUEST' | 'OFFLINE' | 'PRACTICE'

// [참고] 로그인 여부는 앱에서 추측하지 않고 SDK 응답으로 판단한다.
export async function startPlatform(): Promise<RecordStatus> {
  try {
    if (!window.TinyArcade) return 'OFFLINE'
    const result = await window.TinyArcade.start()
    if (!result.loggedIn) return 'GUEST'
    return result.testMode ? 'PREVIEW' : 'RECORD'
  } catch { return 'OFFLINE' }
}

export function recordNotice(status: RecordStatus): string {
  switch (status) {
    case 'RECORD': return '기록됩니다'
    case 'PREVIEW': return '미리보기 · 기록 안 됨'
    case 'GUEST': return '로그인하면 기록됩니다.'
    case 'PRACTICE': return '연습 모드 · 기록 안 됨'
    case 'OFFLINE': return '기록되지 않는 플레이입니다.'
  }
}
export function canSubmit(status: RecordStatus): boolean {
  return status === 'RECORD' || status === 'PREVIEW'
}

export async function submitPlatform(score: number, status: RecordStatus): Promise<string> {
  if (!canSubmit(status)) return recordNotice(status)
  try {
    if (!Number.isInteger(score) || score < 0) throw new Error('점수 형식이 올바르지 않습니다.')
    if (!window.TinyArcade) throw new Error('플랫폼에 연결할 수 없습니다.')
    const result = await window.TinyArcade.submitScore(score)
    // - 미리보기 응답의 verifyStatus는 null이므로 testMode를 먼저 확인한다.
    if (result.testMode) return '미리보기 · 기록 안 됨'
    if (result.verifyStatus === 'PENDING') return '기록 완료 · 검증 중'
    if (result.verifyStatus === 'NORMAL') return '기록 완료'
    return '기록 실패: 제출 결과를 확인할 수 없습니다.'
  } catch (error) {
    const message = typeof error === 'object' && error !== null && 'message' in error
      && typeof error.message === 'string' ? error.message : '알 수 없는 오류입니다.'
    // - 문구로 반환하여 결과 통계를 유지한다. 재시도는 하지 않는다.
    return `기록 실패: ${message}`
  }
}
