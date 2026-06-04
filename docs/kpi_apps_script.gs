/**
 * 흘림 / 토닥갤럭시 — KPI 자동 수집 (Google Apps Script Web App)
 * ---------------------------------------------------------------
 * 앱이 라운드 종료 시 JSON(text/plain)을 이 웹앱으로 POST → 시트에 한 줄씩 적재.
 * 스키마: heulim.kpi.round.v2  (moodDelta = moodPost - moodPre, 양수 = 기분 좋아짐/개선)
 *
 * ▶ 설치 (5분)
 *  1) 구글 시트 새로 만들기 (예: "흘림 KPI")
 *  2) 상단 메뉴 [확장 프로그램] > [Apps Script]
 *  3) 기본 코드 지우고 이 파일 내용 전체 붙여넣기 → 저장(💾)
 *  4) [배포] > [새 배포] > 유형 톱니바퀴 > "웹 앱"
 *       - 설명: heulim kpi
 *       - 실행 계정: 나
 *       - 액세스 권한: "모든 사용자"   ← 꼭 이걸로(앱에서 익명 POST)
 *     [배포] → 권한 승인 → 끝나면 "웹 앱 URL"(……/exec) 복사
 *  5) Vercel > 프로젝트 > Settings > Environment Variables
 *       - Name:  VITE_KPI_ENDPOINT
 *       - Value: (방금 복사한 …/exec URL)
 *       - 저장 후 [Redeploy] (env는 빌드 시점에 박히므로 재배포 필요!)
 *  6) 끝. 이제 라운드가 끝날 때마다 시트 'rounds' 탭에 자동으로 줄이 쌓입니다.
 *
 * ▶ 점검
 *  - 브라우저에서 …/exec 를 그냥 열면 "heulim KPI endpoint OK" 가 보이면 배포 정상.
 *  - 앱 콘솔에서 window.__heulimKPI.info() 로 endpoint가 잡혔는지 확인 가능.
 */

var SHEET_NAME = 'rounds'
var HEADERS = [
  '받은시각',          // 서버 수신 시각(자동)
  'uid',              // 기기별 익명 고유 ID (같은 사람 묶기)
  'sessionId',        // 앱 1회 오픈
  'roundIndex',       // 세션 내 라운드 순번(0부터)
  'roundType',        // full / write_only / ball_only / abandoned
  'startedAt',        // 라운드 시작
  'endedAt',          // 라운드 종료
  'durationMs',       // 총 소요(ms)
  'ballPlayActiveMs', // 공놀이 활성시간(ms, idle 제외)
  'ballPlayCount',    // 공 누름 횟수
  'ritualCount',      // 라운드에서 완료한 환기(의식) 수  ← '더 하기' 루프 지표
  'ritualSequence',   // 환기 순서 (예: burn > plane)
  'rituals_json',     // 의식별 {횟수,시간(ms)} JSON
  'ritualId',         // 마지막으로 한 의식
  'isTextWritten',    // 글 작성 여부
  'textLength',       // 글자 수(내용 미저장)
  'moodPre',          // 시작 전 기분(0~10, 높을수록 좋음)
  'moodPost',         // 활동 직후 기분(0~10)
  'moodDelta',        // moodPost - moodPre (양수 = 좋아짐/개선)
  'schema',
]

function doPost(e) {
  var lock = LockService.getScriptLock()
  try {
    lock.waitLock(5000)
  } catch (lockErr) {
    // 잠금 실패해도 적재는 시도
  }
  try {
    var data = JSON.parse(e.postData.contents)
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sh = ss.getSheetByName(SHEET_NAME)
    if (!sh) sh = ss.insertSheet(SHEET_NAME)
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS)

    sh.appendRow([
      new Date(),
      data.uid || '',
      data.sessionId || '',
      data.roundIndex,
      data.roundType || '',
      data.startedAt ? new Date(data.startedAt) : '',
      data.endedAt ? new Date(data.endedAt) : '',
      data.durationMs,
      data.ballPlayActiveMs,
      data.ballPlayCount,
      data.ritualCount,
      (data.ritualSequence || []).join(' > '),
      JSON.stringify(data.rituals || {}),
      data.ritualId || '',
      data.isTextWritten,
      data.textLength,
      data.moodPre,
      data.moodPost,
      data.moodDelta,
      data.schema || '',
    ])
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON)
  } finally {
    try {
      lock.releaseLock()
    } catch (e2) {}
  }
}

// 배포 확인용 — 브라우저로 …/exec 열면 보임
function doGet() {
  return ContentService.createTextOutput('heulim KPI endpoint OK')
}
