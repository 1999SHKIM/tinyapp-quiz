import { recordNotice } from '../platform/sdk'
import type { RecordStatus } from '../platform/sdk'

// [참고] 기록 상태를 확인한 뒤 시작을 눌러야 문제 타이머가 시작된다.
export default function NoticeScreen({ status, onStart }: { status: RecordStatus; onStart: () => void }) {
  return <section className="screen notice-screen">
    <div className="eyebrow">READY / 본 게임</div><div className="notice-symbol" aria-hidden="true">&lt; / &gt;</div>
    <h1>{recordNotice(status)}</h1><p className="muted">준비됐나요? 시작을 누르면 첫 문제가 나타나요.</p>
    <button className="primary" onClick={onStart}>시작 →</button>
  </section>
}
