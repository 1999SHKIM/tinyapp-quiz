import { useState } from 'react'
import { topicCounts } from '../bank'
import { stageCount } from '../game/setup'
import type { QuestionBank } from '../types'

// [참고] 선택한 문제 수로 진행 가능한 스테이지 수를 미리 보여 준다.
export default function TopicSelectScreen({ bank, onStart, onBack, error }: {
  bank: QuestionBank; onStart: (topics: string[]) => void; onBack: () => void; error: string
}) {
  const [selected, setSelected] = useState<string[]>([])
  const topics = topicCounts(bank)
  const picked = topics.filter((topic) => selected.includes(topic.id))
  const count = stageCount(picked.reduce((n, t) => n + t.oxCount, 0), picked.reduce((n, t) => n + t.mcCount, 0))
  return <section className="screen topics-screen">
    <div className="eyebrow">PRACTICE / 연습 모드</div>
    <h1>어떤 개념을 연습할까요?</h1>
    <p className="muted">주제를 하나 이상 골라 주세요. 연습 점수는 기록되지 않아요.</p>
    <div className="topic-list">{topics.map((topic) => <label className={selected.includes(topic.id) ? 'topic selected' : 'topic'} key={topic.id}>
      <input type="checkbox" checked={selected.includes(topic.id)} onChange={(e) => setSelected(
        e.target.checked ? [...selected, topic.id] : selected.filter((id) => id !== topic.id),
      )} /><span>{topic.name}</span><small>OX {topic.oxCount} · 객관식 {topic.mcCount}</small>
    </label>)}</div>
    <div className="screen-footer"><button className="quiet" onClick={onBack}>← 메뉴로</button>
      <span aria-live="polite">{count} 스테이지</span><button className="primary" disabled={count === 0} onClick={() => onStart(selected)}>연습 시작 →</button></div>
    <p className="message" role="status">{error || (selected.length > 0 && count === 0 ? '선택한 주제의 문제가 아직 준비되지 않았어요.' : '')}</p>
  </section>
}
