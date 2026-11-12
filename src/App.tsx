import { useCallback, useEffect, useRef, useState } from 'react'
import { questionBank } from './bank'
import { buildGame } from './game/setup'
import { startPlatform } from './platform/sdk'
import type { RecordStatus } from './platform/sdk'
import type { GameMode, GameResult, PreparedGame, QuestionBank } from './types'
import MenuScreen from './screens/MenuScreen'
import TopicSelectScreen from './screens/TopicSelectScreen'
import NoticeScreen from './screens/NoticeScreen'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'
import './styles.css'

type Screen = { kind: 'menu' | 'topics' | 'connecting' }
  | { kind: 'notice' | 'game'; game: PreparedGame; status: RecordStatus }
  | { kind: 'result'; result: GameResult; status: RecordStatus }

// [참고] 라우터 없이 화면 상태 하나로 전환하여 sandbox의 주소 변경 제한을 피한다.
export default function App({ bank = questionBank }: { bank?: QuestionBank }) {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' })
  const [error, setError] = useState('')
  const [scale, setScale] = useState(() => Math.min(window.innerWidth / 800, window.innerHeight / 500))
  const starting = useRef(false)
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 800, window.innerHeight / 500))
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  useEffect(() => { document.getElementById('stage')?.focus() }, [screen.kind])

  async function start(mode: GameMode, topics: string[] = []) {
    if (starting.current) return
    starting.current = true
    setError('')
    try {
      const game = buildGame(bank, mode, topics)
      if (game.stages.length === 0) throw new Error('진행할 수 있는 문제가 없습니다.')
      if (mode === 'practice') setScreen({ kind: 'game', game, status: 'PRACTICE' })
      else {
        setScreen({ kind: 'connecting' })
        const status = await startPlatform()
        setScreen({ kind: 'notice', game, status })
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '게임을 시작할 수 없습니다.')
      setScreen({ kind: mode === 'main' ? 'menu' : 'topics' })
    } finally { starting.current = false }
  }
  const finish = useCallback((result: GameResult) => {
    setScreen((current) => current.kind === 'game' ? { kind: 'result', result, status: current.status } : current)
  }, [])
  const menu = () => { setError(''); setScreen({ kind: 'menu' }) }

  return <main id="stage" tabIndex={-1} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
    {screen.kind === 'menu' && <MenuScreen error={error} onMain={() => void start('main')} onPractice={() => { setError(''); setScreen({ kind: 'topics' }) }} />}
    {screen.kind === 'topics' && <TopicSelectScreen bank={bank} error={error} onBack={menu} onStart={(topics) => void start('practice', topics)} />}
    {screen.kind === 'connecting' && <section className="screen notice-screen" aria-busy="true"><div className="eyebrow">CONNECTING</div><h1 role="status">플랫폼 연결 중…</h1></section>}
    {screen.kind === 'notice' && <NoticeScreen status={screen.status} onStart={() => setScreen({ ...screen, kind: 'game' })} />}
    {screen.kind === 'game' && <GameScreen game={screen.game} onFinish={finish} />}
    {screen.kind === 'result' && <ResultScreen result={screen.result} status={screen.status} onMenu={menu} onRetry={() => void start(screen.result.mode, screen.result.topicIds)} />}
  </main>
}
