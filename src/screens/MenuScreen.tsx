import { MAX_STAGES, SPECIAL_EVERY, START_HEARTS } from '../config'

// [참고] 메뉴는 선택을 전달하고, 세션 생성과 화면 전환은 App이 담당한다.
// - 화면 모양은 시안 v10: 제목을 네온 상자(.neon)로 강조하고, 본 게임·연습 모드 버튼을 나란히 둔다.
export default function MenuScreen({ onMain, onPractice, error }: {
  onMain: () => void; onPractice: () => void; error: string
}) {
  return <section className="screen menu-screen">
    <header className="screen-header"><strong>Java</strong></header>
    <div className="menu-hero neon"><h1>개념 퀴즈</h1><p>생각은 빠르게. 개념은 정확하게.</p></div>
    <div className="rules-row"><span>{MAX_STAGES} 스테이지</span><span>{SPECIAL_EVERY}단계마다 스페셜</span><span>♥ 하트 {START_HEARTS}개</span></div>
    <div className="modes"><button className="primary" onClick={onMain}><strong>본 게임</strong><span>전체 주제에 도전하기 →</span></button>
      <button onClick={onPractice}><strong>연습 모드</strong><span>원하는 주제부터 익히기 →</span></button></div>
    <p className="message" role="status">{error || '빠르고 정확하게 풀수록 더 높은 점수를 얻어요.'}</p>
  </section>
}
