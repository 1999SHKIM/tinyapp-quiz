// TinyArcade 11·13번 확인용 임시 스크립트 (28번 퀴즈 개발 때 교체)
// 이 문구가 바뀌면 index.html이 상대 경로로 JS를 잘 불러왔다는 뜻이다.
document.getElementById('status').textContent = 'JS 로드 성공 ✅ (SDK v' + TinyArcade.version + ')'

const log = (label, value) => {
  const el = document.getElementById('log')
  el.textContent = label + ' ' + JSON.stringify(value) + '\n' + el.textContent
}

// ① 한 판 시작: 플랫폼이 세션을 연다 (비로그인이면 loggedIn:false)
document.getElementById('start').addEventListener('click', async () => {
  try {
    log('STARTED', await TinyArcade.start())
  } catch (e) {
    log('ERROR', e)
  }
})

// ② 한 판 끝: 점수 제출 (실패하면 { code, message })
document.getElementById('submit').addEventListener('click', async () => {
  const score = Number(document.getElementById('score').value)
  try {
    log('SUBMITTED', await TinyArcade.submitScore(score))
  } catch (e) {
    log('ERROR', e)
  }
})
