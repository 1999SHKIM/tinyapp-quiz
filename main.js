// TinyArcade 11번 확인용 임시 스크립트 (28번 퀴즈 개발 때 교체)
// 이 문구가 바뀌면 index.html이 상대 경로로 JS를 잘 불러왔다는 뜻이다.
document.getElementById('status').textContent = 'JS 로드 성공 ✅'

let count = 0
document.getElementById('btn').addEventListener('click', () => {
  count += 1
  document.getElementById('count').textContent = String(count)
})
