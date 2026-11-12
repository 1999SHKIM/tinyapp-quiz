import java from './java.json'
import type { QuestionBank } from '../types'

// [참고] 검수용 표와 같은 Java 문제 은행을 게임에 연결한다.
// - 개발 서버와 build:java는 java 모드를 사용한다.
if (import.meta.env.MODE !== 'java') throw new Error('지원하지 않는 문제 은행입니다.')
export const questionBank: QuestionBank = java

export function topicCounts(bank: QuestionBank) {
  return bank.topics.map((topic) => ({
    ...topic,
    oxCount: bank.ox.filter((q) => q.topic === topic.id).length,
    mcCount: bank.mc.filter((q) => q.topic === topic.id).length,
  }))
}
