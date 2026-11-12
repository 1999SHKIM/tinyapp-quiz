import {
  HEART_STAGE_PROBS, MAX_STAGES, MC_LIMIT_MS, OX_LIMIT_MS, SPECIAL_EVERY,
} from '../config'
import type { GameMode, PreparedGame, QuestionBank, Stage } from '../types'

// [참고] 원본 배열을 보존하는 Fisher–Yates 섞기
// - 뒤에서부터 무작위 위치와 교환하므로 각 항목이 공평하게 배치된다.
export function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function isSpecial(stageNumber: number): boolean {
  return stageNumber > 0 && stageNumber % SPECIAL_EVERY === 0
}

// [참고] 보유 문제로 진행할 수 있는 가장 긴 게임
// - 객관식 주기를 유지한 채 OX와 객관식 수량을 모두 만족하는 길이를 찾는다.
export function stageCount(oxCount: number, mcCount: number): number {
  for (let n = MAX_STAGES; n > 0; n -= 1) {
    const specialCount = Math.floor(n / SPECIAL_EVERY)
    if (specialCount <= mcCount && n - specialCount <= oxCount) return n
  }
  return 0
}

export function pickHeartStages(count: number): number[] {
  const roll = Math.random()
  let cumulative = 0
  let rewardCount = 0
  for (let i = 0; i < HEART_STAGE_PROBS.length; i += 1) {
    cumulative += HEART_STAGE_PROBS[i]
    if (roll < cumulative) {
      rewardCount = i
      break
    }
  }

  // - 첫 문제와 마지막 문제는 제외한다. 짧은 연습에서는 후보 수만큼만 뽑는다.
  const candidates = Array.from({ length: Math.max(0, count - 2) }, (_, i) => i + 2)
  return shuffle(candidates).slice(0, rewardCount)
}

// [참고] 은행을 인자로 받아 화면이나 특정 언어 파일에 의존하지 않는다.
// - 본 게임은 전체 주제, 연습은 선택한 주제만 쓴다. 빈 선택은 빈 게임을 반환한다.
// - 본 게임의 문제 부족은 데이터 오류다. 20문제를 채울 수 없으면 시작을 막는다.
export function buildGame(
  bank: QuestionBank,
  mode: GameMode,
  selectedTopics: readonly string[] = [],
): PreparedGame {
  const topicIds = bank.topics
    .filter((topic) => mode === 'main' || selectedTopics.includes(topic.id))
    .map((topic) => topic.id)
  const oxPool = bank.ox.filter((q) => topicIds.includes(q.topic))
  const mcPool = bank.mc.filter((q) => topicIds.includes(q.topic))
  const ids = [...oxPool, ...mcPool].map((q) => q.id)
  if (new Set(ids).size !== ids.length) throw new Error('문제 ID가 중복되었습니다.')
  if (oxPool.some((q) => q.trues.length === 0 || q.falses.length === 0)) {
    throw new Error('OX 문제에는 참·거짓 문장이 각각 필요합니다.')
  }
  if (mcPool.some((q) => q.wrongs.length !== 3 || new Set([q.correct, ...q.wrongs]).size !== 4)) {
    throw new Error('객관식 문제에는 서로 다른 선택지 4개가 필요합니다.')
  }

  const count = stageCount(oxPool.length, mcPool.length)
  if (mode === 'main' && count < MAX_STAGES) {
    throw new Error('본 게임을 시작하기 위한 문제가 부족합니다.')
  }
  const specialCount = Math.floor(count / SPECIAL_EVERY)
  const oxQuestions = shuffle(oxPool).slice(0, count - specialCount)
  const mcQuestions = shuffle(mcPool).slice(0, specialCount)
  const heartStages = pickHeartStages(count)
  const stages: Stage[] = []
  let oxIndex = 0
  let mcIndex = 0

  for (let number = 1; number <= count; number += 1) {
    const heartReward = heartStages.includes(number)
    if (isSpecial(number)) {
      const q = mcQuestions[mcIndex++]
      const options = shuffle([q.correct, ...q.wrongs])
      stages.push({
        kind: 'mc', number, questionId: q.id, topic: q.topic,
        question: q.question, code: q.code, options,
        correctIndex: options.indexOf(q.correct), limitMs: MC_LIMIT_MS, heartReward,
      })
    } else {
      const q = oxQuestions[oxIndex++]
      const correct = Math.random() < 0.5
      const sentences = correct ? q.trues : q.falses
      stages.push({
        kind: 'ox', number, questionId: q.id, topic: q.topic,
        question: sentences[Math.floor(Math.random() * sentences.length)],
        code: q.code, correct, limitMs: OX_LIMIT_MS, heartReward,
      })
    }
  }
  return { mode, topicIds, stages }
}
