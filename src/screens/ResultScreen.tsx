import { useEffect, useRef, useState } from 'react'
import { canSubmit, recordNotice, submitPlatform } from '../platform/sdk'
import type { RecordStatus } from '../platform/sdk'
import type { AnswerRecord, GameResult } from '../types'

function timeRecord(record: AnswerRecord | undefined): string {
  return record ? `${record.stage.number}번 · ${record.stage.question} (${(record.elapsedMs / 1000).toFixed(2)}초)` : '기록 없음'
}

// [참고] 제출 Promise를 보관하여 StrictMode에서도 SDK 호출은 한 번만 한다.
// - effect가 다시 연결되면 같은 Promise의 결과를 받아 화면에 표시한다.
export default function ResultScreen({ result, status, onRetry, onMenu }: {
  result: GameResult; status: RecordStatus; onRetry: () => void; onMenu: () => void
}) {
  const submission = useRef<Promise<string> | null>(null)
  const [record, setRecord] = useState({ pending: canSubmit(status), text: canSubmit(status) ? '기록 중…' : recordNotice(status) })
  useEffect(() => {
    if (!submission.current) submission.current = submitPlatform(result.totalScore, status)
    let current = true
    void submission.current.then((text) => { if (current) setRecord({ pending: false, text }) })
    return () => { current = false }
  }, [result.totalScore, status])
  const corrects = result.records.filter((r) => r.correct).sort((a, b) => a.elapsedMs - b.elapsedMs)
  const wrongs = result.records.filter((r) => !r.correct)
  return <section className="screen result-screen">
    <header className="result-header"><div><div className="eyebrow">JAVA QUIZ / RESULT</div>
      <h1>{result.outcome === 'complete' ? '게임 컴플릿' : '게임오버'}</h1></div><div className="total-score"><small>최종 점수</small><strong>{result.totalScore.toLocaleString()}<span>점</span></strong></div></header>
    <div className="result-columns"><div className="result-stats">
      <div className="stat-row"><span>도달 스테이지</span><strong>{result.records.at(-1)?.stage.number ?? 0}</strong></div>
      <div className="stat-row"><span>정답 / 오답</span><strong>{corrects.length} / {wrongs.length}</strong></div>
      <div className="stat-row"><span>스테이지 점수</span><strong>{result.stageScore.toLocaleString()}</strong></div>
      <div className="stat-row"><span>하트 보너스 · ♥ {result.remainingHearts}</span><strong>+{result.heartBonus}</strong></div>
      <div className="time-stat"><small>가장 빨리 푼 문제</small><p>{timeRecord(corrects[0])}</p></div>
      <div className="time-stat"><small>가장 오래 걸린 문제</small><p>{timeRecord(corrects.at(-1))}</p></div>
    </div><div className="review-panel"><h2>오답 확인 <span>{wrongs.length}</span></h2>
      <div className="review-list" tabIndex={0} aria-label="틀린 문제와 정답">{wrongs.length === 0 ? <p className="muted">틀린 문제가 없어요!</p> : wrongs.map(({ stage, timedOut }) => <article key={stage.questionId}>
        <small>{stage.number}번 · {timedOut ? '시간 초과' : '오답'}</small>
        {stage.code && <pre><code>{stage.code}</code></pre>}<p>{stage.question}</p>
        <strong>정답: {stage.kind === 'ox' ? (stage.correct ? 'O' : 'X') : stage.options[stage.correctIndex]}</strong>
      </article>)}</div></div></div>
    <p className="record-message" role="status">플랫폼 기록 · {record.text}</p>
    <div className="screen-footer"><button className="quiet" disabled={record.pending} onClick={onMenu}>← 메뉴로</button>
      <button className="primary" disabled={record.pending} onClick={onRetry}>다시 하기 →</button></div>
  </section>
}
