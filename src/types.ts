// [참고] 저장된 문제와 실제 출제된 문제를 구분한다.
// - 은행에는 여러 문장이 있지만, 스테이지에는 이번 판에 고른 문장만 담는다.
export interface Topic {
  id: string
  name: string
}

interface BankQuestion {
  id: string
  topic: string
  code?: string
}

export interface OxQuestion extends BankQuestion {
  trues: string[]
  falses: string[]
}

export interface McQuestion extends BankQuestion {
  question: string
  correct: string
  wrongs: string[]
}

export interface QuestionBank {
  language: string
  topics: Topic[]
  ox: OxQuestion[]
  mc: McQuestion[]
}

export type GameMode = 'main' | 'practice'

interface StageBase {
  number: number
  questionId: string
  topic: string
  question: string
  code?: string
  limitMs: number
  heartReward: boolean
}

export interface OxStage extends StageBase {
  kind: 'ox'
  correct: boolean
}

export interface McStage extends StageBase {
  kind: 'mc'
  options: string[]
  correctIndex: number
}

// - kind를 확인하면 OX의 참/거짓 또는 객관식의 정답 위치를 안전하게 읽을 수 있다.
export type Stage = OxStage | McStage

export interface PreparedGame {
  mode: GameMode
  topicIds: string[]
  stages: Stage[]
}

// [참고] 결과 화면에 필요한 기록
// - 시간 초과는 답이 없으므로 null로 저장한다. 모든 기록은 메모리에만 둔다.
export interface AnswerRecord {
  stage: Stage
  selectedAnswer: boolean | number | null
  correct: boolean
  timedOut: boolean
  elapsedMs: number
  points: number
}

export interface GameResult {
  outcome: 'complete' | 'game_over'
  mode: GameMode
  topicIds: string[]
  records: AnswerRecord[]
  remainingHearts: number
  stageScore: number
  heartBonus: number
  totalScore: number
}
