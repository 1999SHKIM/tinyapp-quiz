import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  const cardRef = useRef<HTMLElement>(null)
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

  // [참고] 긴 코드만 글자를 줄여 문제 카드 안에 다 들어가게 한다.
  // - 문제마다 글자 크기를 적어 두지 않고, 화면에 그린 뒤 실제로 넘치는지 잰다. 문제를 고치거나 늘려도 따로 손댈 필요가 없다.
  // - useLayoutEffect는 브라우저가 화면에 그리기 직전에 실행된다. 큰 글자가 잠깐 보였다가 줄어드는 깜빡임이 없다.
  // - 시안 크기 19.2px에서 시작해 한 단계씩 줄이고, 12px에서 멈춘다. 그래도 넘치면 카드 안 스크롤이 남는다.
  // - D2Coding 글꼴이 늦게 도착하면 글자 폭이 달라지므로, 글꼴 준비가 끝난 뒤 한 번 더 잰다.
  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const sizes = [19.2, 18, 17, 16, 15, 14, 13, 12]
    function fit() {
      if (!card) return
      for (const size of sizes) {
        card.style.setProperty('--code-size', `${size}px`)
        if (card.scrollHeight <= card.clientHeight + 1) break
      }
    }
    fit()
    let current = true
    void document.fonts.ready.then(() => { if (current) fit() })
    return () => { current = false }
  }, [stage])

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
  // [참고] 시안 v10 배치: 위(제목·하트·점수) → 시간 막대 → 왼쪽 문제 카드 / 오른쪽 답 → 아래(진행·남은 시간)
  // - chosen: 방금 고른 답. 시안의 선택 강조(청록)로 보여 주고, 정답·오답은 화면 테두리 색으로 따로 보여 준다.
  const chosen = (value: boolean | number) => turn.feedback && turn.feedback.selectedAnswer === value ? 'chosen' : undefined
  return <section className={`screen game-screen ${turn.feedback ? (turn.feedback.correct ? 'feedback-correct' : 'feedback-wrong') : ''}`}>
    <header className="screen-header"><strong>{game.mode === 'practice' ? 'Java 연습 모드' : 'Java 개념 퀴즈'}</strong>
      <div className="game-status"><span className="hearts" aria-label={`하트 ${turn.hearts}개`}>{'♥'.repeat(turn.hearts)}<span className="empty-hearts">{'♡'.repeat(MAX_HEARTS - turn.hearts)}</span></span><strong>{turn.score.toLocaleString()}점</strong></div></header>
    <div className="timer-track" role="progressbar" aria-label="남은 시간" aria-valuemin={0} aria-valuemax={stage.limitMs / 1000} aria-valuenow={Number((displayedMs / 1000).toFixed(1))}><div style={{ width: `${100 * displayedMs / stage.limitMs}%` }} /></div>
    <div className="game-content">
      {/* 코드가 있으면 코드를 먼저 보여 주고 그 아래에 문장을 둔다(03_28 §4-1). "실행하면 ~" 같은 문장은 코드를 본 뒤 읽어야 자연스럽다. */}
      <section ref={cardRef} className={`question-card ${stage.kind}`}><small>{stage.kind === 'mc' ? 'SPECIAL · 객관식' : 'O / X'}</small>{stage.code && <pre><code>{stage.code}</code></pre>}<h2>{stage.question}</h2></section>
      <section className={stage.kind === 'ox' ? 'answers ox-answers' : 'answers mc-answers'} aria-label="답안">
        {stage.kind === 'ox' ? [true, false].map((value) => <button key={String(value)} className={chosen(value)} disabled={!!turn.feedback} onClick={() => answer(value)} aria-label={value ? 'O 맞다' : 'X 틀리다'}><span className="answer-key">{value ? 'O' : 'X'}</span><span>{value ? '맞다' : '틀리다'}</span></button>)
          : stage.options.map((option, i) => <button key={i} className={chosen(i)} disabled={!!turn.feedback} onClick={() => answer(i)}><span className="answer-key">{i + 1}</span><span>{option}</span></button>)}
      </section>
    </div>
    <footer className="screen-footer game-footer"><span>문제 {stage.number.toString().padStart(2, '0')} / {game.stages.length}</span>
      <span className="heart-chance">{stage.heartReward ? '♥ 정답 시 하트 +1' : ''}</span>
      <span>키보드 {stage.kind === 'ox' ? 'O / X' : '1 / 2 / 3 / 4'}</span><b>{(displayedMs / 1000).toFixed(1)}초</b></footer>
  </section>
}
