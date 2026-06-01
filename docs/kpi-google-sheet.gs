/*
 * 흘림/토닥 — KPI 수집기 (Google Apps Script 웹앱)
 * 프로토타입이 라운드 종료마다 보내는 KPI를 구글 시트에 한 줄씩 자동 적재한다.
 * (구글폼 응답이 시트에 쌓이는 것과 동일한 경험 — 맨 앞에 '받은시각' 타임스탬프 포함)
 * 헤더 셀에는 각 항목의 한 줄 설명을 '메모(코멘트)'로 자동 첨부한다.
 *
 * ── 설치 (5분) ─────────────────────────────────────────────
 * 1) 구글 시트 새로 만들기 (sheets.new)
 * 2) 상단 메뉴 [확장 프로그램] > [Apps Script] → 기본 코드 지우고 이 파일 전체 붙여넣기 → 저장
 * 3) [배포] > [새 배포] > 유형 톱니 > "웹 앱"
 *      - 실행: 나(본인 계정)  /  액세스 권한: "모든 사용자"  ← 중요(테스터가 로그인 없이 보내야 함)
 *    [배포] → 권한 승인 → "웹 앱 URL"(.../exec) 복사
 * 4) 프로토타입 폴더에 .env.local 만들고:  VITE_KPI_ENDPOINT=<복사한 URL>  → dev 서버 재시작
 *
 * ── 헤더 메모(설명) 입히기 ──────────────────────────────────
 * 이미 데이터(헤더 행)가 있는 시트라면, 편집기 상단 함수 목록에서 'applyHeaderNotes' 선택 →
 * [실행] 한 번 누르면 헤더 1행 각 셀에 설명 메모가 붙는다(셀에 마우스 올리면 보임).
 * (새 빈 시트는 첫 데이터가 들어올 때 자동으로 헤더+메모가 생성됨)
 */

var HEADERS = [
  '받은시각', 'uid', 'sessionId', 'roundIndex', 'roundType',
  'startedAt', 'endedAt', 'durationMs',
  'ballPlayActiveMs', 'ballPlayCount',
  'ritualId', 'isTextWritten', 'textLength',
  'moodPre', 'moodPost', 'moodDelta',
  'rituals_json', 'schema',
];

// 헤더별 한 줄 설명 (셀 메모로 첨부)
var HEADER_NOTES = {
  '받은시각': '서버가 이 라운드를 받은 시각(구글폼 타임스탬프 역할, 자동 기록).',
  'uid': '기기·브라우저별 고유 익명 ID. 세션을 넘어 같은 사람을 묶는 키(localStorage 보존).',
  'sessionId': '앱을 한 번 열 때(방문)마다 새로 발급되는 ID.',
  'roundIndex': '그 방문(세션) 안에서의 라운드 순번(0부터).',
  'roundType': '라운드 유형: ball_only(공놀이만) / full(리츄얼까지) / abandoned(중간 이탈).',
  'startedAt': '라운드 시작 시각(기기 시간).',
  'endedAt': '라운드 종료 시각.',
  'durationMs': '라운드 총 소요시간(밀리초) = 종료-시작. 대기·멈춤 포함 전체.',
  'ballPlayActiveMs': '공놀이 활성 시간 합(ms) — 공을 실제 누르거나 끄는 동안만, 가만히 둔 시간 제외.',
  'ballPlayCount': '공놀이 상호작용(누름) 횟수.',
  'ritualId': '완료한 의식: burn(태우기)/shred(파쇄기)/plane(날리기)/jewelbox(보석함). 공놀이만이면 빈칸.',
  'isTextWritten': '글 작성 여부(TRUE/FALSE).',
  'textLength': '작성한 글자 수(내용은 저장 안 함, 길이만).',
  'moodPre': '공놀이 시작 전 기분 점수(0~10, 높을수록 마음이 무거움).',
  'moodPost': '마친 후 기분 점수(0~10).',
  'moodDelta': 'moodPre - moodPost. 양수=가벼워짐(클수록 호전), 음수=오히려 무거워짐.',
  'rituals_json': '의식별 {횟수, 누적시간(ms)}을 담은 JSON(한 칸). 보통 라운드당 1개.',
  'schema': '데이터 버전 태그(heulim.kpi.round.v1). 스키마 변경 추적용.',
};

// 헤더 1행에 설명 메모를 입힌다 (헤더가 없으면 먼저 헤더를 쓴다)
function setHeaderNotes_(sheet) {
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  var notes = [HEADERS.map(function (h) { return HEADER_NOTES[h] || ''; })];
  sheet.getRange(1, 1, 1, HEADERS.length).setNotes(notes);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1); // 헤더 고정
}

// 빈 시트면 헤더(+메모) 생성
function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) setHeaderNotes_(sheet);
}

// ▶ 기존 시트에 헤더 설명 메모를 입히고 싶을 때 편집기에서 직접 실행하는 함수
function applyHeaderNotes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  setHeaderNotes_(sheet);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // 동시 전송 시 행 꼬임 방지
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ensureHeader_(sheet); // 첫 행에 헤더 + 설명 메모

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
