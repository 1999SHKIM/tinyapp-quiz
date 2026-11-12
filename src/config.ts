// [참고] 게임 규칙을 조정하는 곳
// - 시간은 밀리초로 통일하여 화면 표시와 정답 판정이 같은 기준을 쓰게 한다.
export const MAX_STAGES = 20
export const SPECIAL_EVERY = 5
export const OX_LIMIT_MS = 5000
export const MC_LIMIT_MS = 15000
export const OX_POINTS = 100
export const MC_POINTS = 200
export const TIME_BONUS_MAX = 50
export const HEART_BONUS = 50
export const START_HEARTS = 3
export const MAX_HEARTS = 3

// - 배열의 위치가 획득 기회 개수다: 0개 30%, 1개 50%, 2개 20%.
export const HEART_STAGE_PROBS = [0.3, 0.5, 0.2] as const
export const FEEDBACK_MS = 300
export const COUNTDOWN_INTERVAL_MS = 100
