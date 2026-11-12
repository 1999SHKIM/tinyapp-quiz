import { useCallback, useEffect, useRef, useState } from 'react'
import { FEEDBACK_MS, MAX_HEARTS, START_HEARTS } from '../config'
import { heartBonus, stagePoints, total } from '../game/score'
import { useCountdown } from '../game/useCountdown'
import type { AnswerRecord, GameResult, PreparedGame } from '../types'

// [참고] ref로 입력을 즉시 잠가 state 반영 전의 연속 클릭도 한 번만 판정한다.
export default function GameScreen({ game, onFinish }: {
  game: PreparedGame; onFinish: (result: GameResult) => void
}) {
  const [turn, setTurn] = useState(() => ({
    index: 0, startedAt: performance.now(), hearts: START_HEARTS, score: 0,
    records: [] as AnswerRecord[], feedback: null as AnswerRecord | null, feedbackUntil: 0,
  }))
  const locked = useRef(false)
  const stage = game.stages[turn.index]
  const { remainingMs, readRemainingMs } = useCountdown(
    turn.startedAt, stage.limitMs, !turn.feedback, () => answer(null),
  )
  const answer = useCallback((choice: boolean | number | null) => {
    if (locked.current) return
    locked.current = true
    const remaining = readRemainingMs()
    const timedOut = remaining <= 0 || choice === null
    const correct = !timedOut && (stage.kind === 'ox' ? choice === stage.correct : choice === stage.correctIndex)
    const points = stagePoints(correct, stage.kind === 'mc', remaining, stage.limitMs)
    const hearts = correct ? Math.min(MAX_HEARTS, turn.hearts + (stage.heartReward ? 1 : 0)) : turn.hearts - 1
    const record: AnswerRecord = {
      stage, selectedAnswer: timedOut ? null : choice, correct, timedOut,
      elapsedMs: stage.limitMs - remaining, points,
    }
    setTurn({ ...turn, hearts, score: turn.score + points, records: [...turn.records, record],
      feedback: record, feedbackUntil: performance.now() + FEEDBACK_MS })
  }, [readRemainingMs, stage, turn])

  useEffect(() => {
    if (!turn.feedback) return
    let advanced = false
    function advance() {
      if (advanced || performance.now() < turn.feedbackUntil) return
      advanced = true
      if (turn.hearts === 0 || turn.index === game.stages.length - 1) {
        onFinish({
          outcome: turn.hearts === 0 ? 'game_over' : 'complete', mode: game.mode, topicIds: game.topicIds,
          records: turn.records, remainingHearts: turn.hearts, stageScore: turn.score,
          heartBonus: heartBonus(turn.hearts), totalScore: total(turn.score, turn.hearts),
        })
      } else {
        locked.current = false
        setTurn({ ...turn, index: turn.index + 1, startedAt: performance.now(), feedback: null })
      }
    }
    // - 실제 연출 종료 시각을 확인한다. 탭 복귀와 타이머가 겹쳐도 한 번만 진행한다.
    const timer = window.setInterval(advance, 20)
    document.addEventListener('visibilitychange', advance)
    advance()
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', advance) }
  }, [turn, game, onFinish])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return
      const key = event.key.toLowerCase()
      if (stage.kind === 'ox' && (key === 'o' || key === 'x')) {
        event.preventDefault(); answer(key === 'o')
      } else if (stage.kind === 'mc' && /^[1-4]$/.test(key)) {
        event.preventDefault(); answer(Number(key) - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage.kind, answer])

  const displayedMs = turn.feedback ? stage.limitMs - turn.feedback.elapsedMs : remainingMs
  return <section className={`screen game-screen ${turn.feedback ? (turn.feedback.correct ? 'feedback-correct' : 'feedback-wrong') : ''}`}>
    <header className="game-header"><div><span className="eyebrow">{game.mode === 'practice' ? 'PRACTICE' : 'JAVA QUIZ'}</span>
      <h1>STAGE {stage.number.toString().padStart(2, '0')} <small>/ {game.stages.length}</small></h1></div>
      <div className="game-score"><span className="hearts" aria-label={`하트 ${turn.hearts}개`}>{'♥'.repeat(turn.hearts)}<span className="empty-hearts">{'♡'.repeat(MAX_HEARTS - turn.hearts)}</span></span><strong>{turn.score.toLocaleString()} <small>점</small></strong></div></header>
    <div className="time-row"><span>{stage.kind === 'mc' ? 'SPECIAL · 객관식' : 'O / X'}</span>
      <span className="heart-chance">{stage.heartReward ? '♥ 정답 시 하트 +1' : ''}</span><strong>{(displayedMs / 1000).toFixed(1)}초</strong></div>
    <div className="timer-track" role="progressbar" aria-label="남은 시간" aria-valuemin={0} aria-valuemax={stage.limitMs / 1000} aria-valuenow={Number((displayedMs / 1000).toFixed(1))}><div style={{ width: `${100 * displayedMs / stage.limitMs}%` }} /></div>
    {/* 코드가 있으면 코드를 먼저 보여 주고 그 아래에 문장을 둔다(03_28 §4-1). "실행하면 ~" 같은 문장은 코드를 본 뒤 읽어야 자연스럽다. */}
    <div className={`question-area ${stage.kind}`}>{stage.code && <pre><code>{stage.code}</code></pre>}<h2>{stage.question}</h2></div>
    <div className={stage.kind === 'ox' ? 'answers ox-answers' : 'answers mc-answers'}>
      {stage.kind === 'ox' ? [true, false].map((value) => <button key={String(value)} disabled={!!turn.feedback} onClick={() => answer(value)} aria-label={value ? 'O 맞다' : 'X 틀리다'}>{value ? 'O' : 'X'}<span>{value ? '맞다' : '틀리다'}</span></button>)
        : stage.options.map((option, i) => <button key={i} disabled={!!turn.feedback} onClick={() => answer(i)}><span className="option-number">{i + 1}</span><span>{option}</span></button>)}
    </div><p className="input-hint">버튼을 눌러 선택 · 키보드 {stage.kind === 'ox' ? 'O / X' : '1 / 2 / 3 / 4'}</p>
  </section>
}
