import { useCallback, useEffect, useRef, useState } from 'react'
import { COUNTDOWN_INTERVAL_MS } from '../config'

// [참고] 갱신 횟수가 아니라 실제 경과 시간으로 계산한다.
// - 화면이 멈췄다가 돌아와도 남은 시간을 늘려 주지 않는다.
export function remainingTime(startedAt: number, limitMs: number, now = performance.now()): number {
  return Math.max(0, Math.min(limitMs, startedAt + limitMs - now))
}

export function useCountdown(
  startedAt: number | null,
  limitMs: number,
  active: boolean,
  onTimeout: () => void,
) {
  const [sample, setSample] = useState({ startedAt, limitMs, remainingMs: limitMs })
  const timeoutCallback = useRef(onTimeout)
  const expiration = useRef({ startedAt, limitMs, notified: false })

  // - 콜백이 바뀌어도 시계를 재시작하지 않도록 최신 함수만 따로 기억한다.
  useEffect(() => { timeoutCallback.current = onTimeout }, [onTimeout])

  const readRemainingMs = useCallback(() => (
    startedAt === null ? limitMs : remainingTime(startedAt, limitMs)
  ), [startedAt, limitMs])

  useEffect(() => {
    if (startedAt === null || !active) return
    if (expiration.current.startedAt !== startedAt || expiration.current.limitMs !== limitMs) {
      expiration.current = { startedAt, limitMs, notified: false }
    }

    function tick() {
      const remainingMs = readRemainingMs()
      setSample({ startedAt, limitMs, remainingMs })
      if (remainingMs === 0) {
        window.clearInterval(interval)
        document.removeEventListener('visibilitychange', tick)
        // - StrictMode의 effect 재실행과 연속 이벤트에서도 한 문제의 시간 초과는 한 번만 알린다.
        if (!expiration.current.notified) {
          expiration.current.notified = true
          timeoutCallback.current()
        }
      }
    }

    const interval = window.setInterval(tick, COUNTDOWN_INTERVAL_MS)
    document.addEventListener('visibilitychange', tick)
    tick()
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [startedAt, limitMs, active, readRemainingMs])

  // - 다음 문제의 첫 렌더에서 이전 문제의 0초가 잠깐 표시되지 않게 한다.
  const remainingMs = sample.startedAt === startedAt && sample.limitMs === limitMs
    ? sample.remainingMs : readRemainingMs()

  // - 답 클릭 시에는 표시값 대신 readRemainingMs()로 즉시 다시 계산한다.
  // - 정오답 연출 동안 active를 false로 바꾸면 타이머와 이벤트가 해제된다.
  return { remainingMs, readRemainingMs }
}
