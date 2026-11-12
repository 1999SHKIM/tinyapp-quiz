import {
  HEART_BONUS, MAX_HEARTS, MAX_STAGES, MC_POINTS, OX_POINTS,
  SPECIAL_EVERY, TIME_BONUS_MAX,
} from '../config'

// [참고] 남은 초를 먼저 올림한 뒤 계산한 점수의 소수 부분을 버린다.
export function timeBonus(remainingMs: number, limitMs: number): number {
  if (limitMs <= 0) return 0
  const limitSeconds = limitMs / 1000
  const remainingSeconds = Math.min(limitSeconds, Math.ceil(Math.max(0, remainingMs) / 1000))
  return Math.floor(TIME_BONUS_MAX * remainingSeconds / limitSeconds)
}

export function stagePoints(
  correct: boolean,
  special: boolean,
  remainingMs: number,
  limitMs: number,
): number {
  // - 마감 시각과 같거나 늦은 입력은 시간 초과이므로 정답으로 전달되어도 점수를 주지 않는다.
  if (!correct || remainingMs <= 0 || limitMs <= 0) return 0
  return (special ? MC_POINTS : OX_POINTS) + timeBonus(remainingMs, limitMs)
}

export function heartBonus(hearts: number): number {
  return Math.max(0, Math.min(MAX_HEARTS, Math.floor(hearts))) * HEART_BONUS
}

export function total(stageScore: number, hearts: number): number {
  return stageScore + heartBonus(hearts)
}

// [참고] 설정이 바뀌어도 등록용 최대 점수를 같은 규칙으로 계산한다.
export function maxScore(): number {
  const mcCount = Math.floor(MAX_STAGES / SPECIAL_EVERY)
  const oxCount = MAX_STAGES - mcCount
  return oxCount * (OX_POINTS + TIME_BONUS_MAX)
    + mcCount * (MC_POINTS + TIME_BONUS_MAX)
    + heartBonus(MAX_HEARTS)
}
