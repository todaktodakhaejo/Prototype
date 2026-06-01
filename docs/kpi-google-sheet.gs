/*
 * 흘림/토닥 — KPI 수집기 (Google Apps Script 웹앱)
 * 프로토타입이 라운드 종료마다 보내는 KPI를 구글 시트에 한 줄씩 자동 적재한다.
 * (구글폼 응답이 시트에 쌓이는 것과 동일한 경험 — 맨 앞에 '받은시각' 타임스탬프 포함)
 *
 * ── 설치 (5분) ─────────────────────────────────────────────
 * 1) 구글 시트 새로 만들기 (sheets.new)
 * 2) 상단 메뉴 [확장 프로그램] > [Apps Script] → 기본 코드 지우고 이 파일 전체 붙여넣기 → 저장
 * 3) [배포] > [새 배포] > 유형 톱니 > "웹 앱"
 *      - 설명: KPI collector
 *      - 실행: 나(본인 계정)
 *      - 액세스 권한: "모든 사용자"   ← 중요(테스터가 로그인 없이 보낼 수 있어야 함)
 *    [배포] → 권한 승인 → "웹 앱 URL"(https://script.google.com/macros/s/.../exec) 복사
 * 4) 프로토타입 폴더에 .env.local 만들고:  VITE_KPI_ENDPOINT=<복사한 URL>
 *    그리고 dev 서버 재시작(npm run dev) 또는 재빌드. 끝.
 *
 * 코드를 수정/재배포하면 URL이 바뀔 수 있으니 [배포 관리]에서 같은 배포를 "수정"하면 URL 유지됨.
 */

var HEADERS = [
  '받은시각', 'uid', 'sessionId', 'roundIndex', 'roundType',
  'startedAt', 'endedAt', 'durationMs',
  'ballPlayActiveMs', 'ballPlayCount',
  'ritualId', 'isTextWritten', 'textLength',
  'moodPre', 'moodPost', 'moodDelta',
  'rituals_json', 'schema',
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // 동시 전송 시 행 꼬임 방지
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS); // 첫 행에 헤더

    var d = JSON.parse(e.postData.contents); // 본문은 JSON 문자열(text/plain로 전송됨)

    sheet.appendRow([
      new Date(),                                   // 받은시각(서버 타임스탬프)
      d.uid || '',
      d.sessionId || '',
      d.roundIndex,
      d.roundType || '',
      d.startedAt ? new Date(d.startedAt) : '',
      d.endedAt ? new Date(d.endedAt) : '',
      d.durationMs,
      d.ballPlayActiveMs,
      d.ballPlayCount,
      d.ritualId || '',
      d.isTextWritten,
      d.textLength,
      d.moodPre,
      d.moodPost,
      d.moodDelta,
      JSON.stringify(d.rituals || {}),              // 의식별 횟수/시간(중첩) — 한 칸에 JSON
      d.schema || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 브라우저로 URL을 직접 열었을 때 동작 확인용
function doGet() {
  return ContentService.createTextOutput('KPI collector is running.');
}
