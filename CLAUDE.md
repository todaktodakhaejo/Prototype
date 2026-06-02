# CLAUDE.md — 흘림 / 토닥갤럭시 (감정 해소 앱)

> 세션 인수인계용 문서. 새 세션에서 이 파일을 먼저 읽고 이어서 작업한다.
> 최근 갱신: 2026-05-31

---

## 프로젝트 개요

- **앱**: 감정을 *기록*이 아니라 *흘려보내며 해소*하는 단일 세션형 인터랙티브 앱
- **타깃**: 내 감정 인식이 낯선 2030 "어른이"
- **핵심 컨셉**: 글쓰기로 감정에 직면 → 의식(분출 행위)으로 시각적으로 흘려보냄
- **신뢰 포인트**: 작성한 감정 텍스트는 **저장하지 않는다**(흘려보냄). 저장은 신뢰를 깬다.

## 내 역할

이 저장소에서 **React 기반 프로토타입 구현**을 담당한다. 기획/디자인 자료(`docs/`)는 다른 사람이 만들고, 나는 그것을 React로 구현한다.

---

## ⚠️ 환경 제약 (중요)

- 이 Windows PC에 **Node.js / npm이 설치되어 있지 않다** (PATH·일반 경로 모두 없음, 2026-05-31 확인).
  → 에이전트가 `npm install` / `npm run dev` / Vite를 **직접 실행할 수 없다.** 스캐폴드 파일만 작성 가능.
- Python도 WindowsApps 스텁만 있어 동작 안 함. Excel 파싱은 PowerShell `System.IO.Compression`으로 처리했다.
- 셸: PowerShell (Windows). 사용자가 직접 명령 실행 시 프롬프트에 `! <command>` 사용.

### 실행 방법 (사용자가 직접)
```powershell
# 1) Node LTS 설치: https://nodejs.org  또는  winget install OpenJS.NodeJS.LTS
# 2) 새 터미널 열고 프로젝트 폴더에서:
npm install
npm run dev      # http://localhost:5173 — 브라우저 창을 좁히면 폰 프레임
```

---

## 자료 (docs/)

| 파일 | 내용 |
|------|------|
| `기능명세서_감정해소앱-1.xlsx` | 6단계·26기능 상세 명세 (ONB/HOME/GST/WRT/RIT/END) |
| `heulim_wireframe.html` | 메인 플로우 9스텝, 의식별 STEP 구조, 시간대 5구간 (명세보다 정교) |
| `KakaoTalk_…png` | 전체 화면 흐름 스케치 |
| **`react_prototype_spec.md`** | **★ 내가 작성한 React 구현 명세 — 화면·전환·인터랙션·상태·MVP 범위** |

---

## 확정된 의사결정 (프로토타입 기준)

미확정 4개를 "빠른 수직 슬라이스 · 반응 검증 · 구현 용이성" 기준으로 결정:

1. **홈 전환 트리거 = 공 터치(탭)** — 스와이프 ✗. 1차 탭 멘트 fade-out, 2차 탭 WRITE 진입.
2. **마무리 연출 = 공통 통일** — 의식별 차이는 *진행 애니메이션*만, 잔상·완료는 모든 의식 공통.
3. **빈 화면 여운 = 1.5초** — `RELEASE_PAUSE_MS` 상수로 분리(쉽게 튜닝). 3초는 "멈춤/버그" 오인 위험.
4. **보관형 아카이브 = MVP 제외** — 흘려보내기(소멸형) 3종만. 아카이브는 별도 기능 덩어리.

기술 스택: **Vite + React + TS / Zustand(상태) / Framer Motion(전환·애니메이션) / 라우팅 없음(단방향 FSM)**.

---

## 현재 구현 상태 (MVP 화면 구조 완성)

### 단방향 플로우 (FSM)
```
ONBOARDING → HOME → WRITE → RITUAL_PICK → RITUAL_ACT → AFTERGLOW → RELEASED → (홈 리셋 +1) → HOME
```
뒤로가기 없음. `AFTERGLOW`·`RELEASED`는 타이머 자동 전환. `step` 상태값 하나로 화면 스위칭.

### 파일 구조
```
src/
  App.tsx              # FSM 스위칭 + AnimatePresence cross-fade, data-tod로 시간대 배경
  main.tsx
  store.ts             # Zustand: step/draftText/selectedRitual/releaseCount/onboarded + 전환 액션
  types.ts             # Step · RitualId('burn'|'crumple'|'tear') · TimeOfDay
  constants.ts         # AFTERGLOW_MS, RELEASE_PAUSE_MS, COMFORT_MESSAGES, RITUALS
  hooks/useTimeOfDay.ts# 5구간(dawn/day/dusk/night/pre-dawn) 판정 + formatToday()
  styles/tokens.css    # 시간대별 그라데이션 변수(--bg, --on-bg)
  styles/global.css    # app-frame(폰 프레임 max 430px) + screen 레이어 + btn
  components/JellyBall.tsx   # 중앙 젤리 공, 탭만 지원
  screens/             # Onboarding, Home, Write, RitualPick, RitualAct, Afterglow, Released
  rituals/             # Burn, Crumple, Tear + Paper(공유 종이) + index.ts(레지스트리)
```

### 동작하는 것
- 온보딩 3슬라이드(최초 1회, localStorage `heulim.onboarded`)
- 홈: 시간대 배경 + 날짜 + 위로 멘트 fade + 공 2단계 탭 + 카운터
- 글쓰기 textarea → 의식 선택(4종 그리드: 태우기·파쇄기·날리기·보석함) → 의식 애니메이션(STEP1→2→3) → 잔상 → 완료 → 홈 리셋(카운터 +1, `heulim.releaseCount`)
- 감정 텍스트는 `resetHome()`에서 폐기(미저장)

### 아직 안 한 것 (다음 후보)
- 의식 애니메이션은 기본 수준 — 디테일 강화 여지(파티클/Canvas, afterglow 상징)
- 온보딩·위로 멘트 카피 확정 (현재 임시)
- 제스처 풀세트(튕기기·고무줄·터치 파장·굴리기), 가림 인터랙션
- 의식 10종 전체 + 보관형(keep) 4종
- 뒤섞기(scatter) 가속도 센서(DeviceMotion) — 권한/디바이스 검증 필요
- **빌드/실행 검증 자체를 못 함** (Node 미설치) → 설치 후 첫 `npm run dev`에서 오류 확인 필요

---

## 작업 규칙 (필수)

**코드를 변경하는 모든 기능 작업은 `feature-development` 스킬 절차를 따른다.**
빠른 프로토타이핑 단계라 **main에서 직접 작업한다(A안, 2026-05-31 결정)**: ① `git pull origin main`로 최신화 → ② main에서 직접 작업(작은 단위) → ③ `git add/commit` → ④ `git push origin main`. **피처 브랜치·PR 없음.** **🚨 충돌이 나면 임의로 해결하지 말고, 어떤 파일이 어떻게 충돌했는지 먼저 사용자에게 자세히 보고하고 결정을 받는다.** 상세는 `.claude/skills/feature-development/SKILL.md`.

## 진행 로그

| 날짜 | 변경 | 파일 | 메모 |
|------|------|------|------|
| 2026-05-31 | 초기 MVP 화면 구조 | src/* 전체 | 단방향 FSM 7화면 + 의식 3종 |
| 2026-05-31 | **3단계 제스처 인터랙션(GST-01~04)** 최소 구현 | `components/JellyBall.tsx` | 홈 공에 굴리기/당겼다놓기/튕기기/터치파장. Framer `drag`+`dragSnapToOrigin`+ripple, Pointer 이벤트로 마우스·터치 동시 지원. **未실행 검증** |
| 2026-05-31 | **글쓰기 진입 = 탭 → 롱프레스(800ms)로 변경** | `JellyBall.tsx`, `Home.tsx`, `constants.ts` | 공을 `LONG_PRESS_MS`(800ms) 이상 누르면 글쓰기 진입. 누르는 동안 원형 SVG 게이지 차오름 + 공 살짝 눌림(scale 0.9). 800ms 전 떼면 리셋·원상복귀. 드래그 시작 시 `onDragStart`로 롱프레스 취소(굴리기/튕기기와 공존). 멘트는 pointerdown(`onPressStart`)에 사라짐. `onTap` 내비게이션 제거. **未실행 검증** |
| 2026-05-31 | **의식 2종 추가: 비행기(RIT-09)·보석함(RIT-10)** → 총 5종 | `rituals/Plane.tsx`, `rituals/Jewelbox.tsx`, `types.ts`, `constants.ts`, `rituals/index.ts` | 비행기=종이 접힘→사선 비행 사라짐. 보석함=종이 투입→뚜껑 닫힘→후광+빛입자(12개) 확산. 보석함은 *시각 연출만*이고 텍스트 저장(아카이브)은 하지 않음(컨셉 유지). 레지스트리에 등록만 하면 선택 그리드 자동 노출. **未실행 검증** |
| 2026-05-31 | **의식 개편: 구기기·찢기 제거, 파쇄기(RIT-04) 추가, "비행기"→"날리기"** → 총 4종 | `rituals/Shred.tsx`(신규), `Crumple.tsx`·`Tear.tsx`(삭제), `types.ts`, `constants.ts`, `rituals/index.ts` | 파쇄기=종이가 투입구로 빨려들어가며 본체 진동→파쇄 조각이 폭죽처럼 사방 확산(confetti 18개, 색상 팔레트). 최종 의식: 태우기·파쇄기·날리기·보석함. **未실행 검증** |
| 2026-05-31 | **배경 그라데이션 깊이감 개선** (5단계) | `styles/tokens.css`, `styles/global.css` | 평면 2색 → 3레이어(비네트+광원 glow+하늘 베이스). 일출/낮/노을/밤/새벽 각각 채도 낮춘 몽환적 팔레트. `--bg`가 다층 image-list, `.app-frame`은 `background-image`로 수신. **未실행 검증** |
| 2026-05-31 | **오브제 → 슬라임/젤리 물성으로 개편** | `components/JellyBall.tsx` | `useVelocity`+`useSpring`+`useTransform`로 드래그 속도를 읽어 진행 축 늘림+트레일 skew(끈적함). 누름은 비대칭 찌그러짐(scaleX1.12/scaleY0.82)+손가락 자리 딤플 음영+딤플 방향 이동. 떼면 스프링 복원(탄성 오버슈트). idle은 유기적 borderRadius 모핑(액체 출렁임)+젤 inset 음영. 3중 변형 레이어(속도/누름/모핑) 분리 합성. 게이지·ripple 유지. **未실행 검증** |
| 2026-05-31 | **온보딩 멘트 8종 자동 순환** | `screens/Onboarding.tsx` | 3슬라이드(제목+본문) → 말랑이 소개 멘트 8개를 3.8초마다 페이드 순환. 하단 순환 점 8개 + "시작하기" 상시 노출. **未실행 검증** |
| 2026-05-31 | **위로 멘트 교체: 홈 3개 → 말랑이 8멘트** (온보딩과 공용) | `constants.ts`, `screens/Onboarding.tsx`, `screens/Home.tsx` | `COMFORT_MESSAGES`를 8개 두 줄 멘트로 교체(기존 '여기 있어요' 등 제거). 온보딩·홈이 같은 소스 사용(중복 제거). 홈 멘트는 `pre-line`+18px로 두 줄 표시. |
| 2026-05-31 | **KPI 수집 기능 통합** (feature/kpi-collection → main 머지) | `analytics.ts`(신규), `screens/MoodPre.tsx`·`MoodPost.tsx`(신규), `components/MoodScale.tsx`(신규), `store.ts`, `App.tsx`, `Home.tsx`, `Released.tsx`, `JellyBall.tsx`, `types.ts`, `constants.ts` | 라운드(MOOD_PRE→…→MOOD_POST) 단위 KPI: 기분 pre/post·delta, 공놀이 활성시간, 의식별 시간/횟수, 글 작성. localStorage(`heulim.kpi.rounds`) 적재 + `window.__heulimKPI` 콘솔 API + (옵션)HTTP 전송. `VITE_KPI_ENABLED`/`VITE_KPI_ENDPOINT` env. JellyBall은 **슬라임 물성 + onPlayActive 계측**으로 통합. **未실행 검증** |
| 2026-05-31 | **기분 질문 중복 수정 + 의식 분기 팝업** | `screens/RitualPrompt.tsx`·`Ended.tsx`(신규), `store.ts`, `Home.tsx`, `App.tsx`, `types.ts`, `constants.ts` | 의식 후 기분질문이 (post + 다음 라운드 pre)로 연달아 2번 뜨던 문제 해결. 공놀이 후 **RITUAL_PROMPT 팝업**(리츄얼까지/오늘은 여기까지) → 각 경로 끝에 기분 post 1회 → **ENDED(종료)**. 응답 후 자동으로 새 라운드(MOOD_PRE) 시작 안 함(중복 제거); 다시 시작은 ENDED의 버튼으로만. `tsc -b && vite build` **검증 통과** |
| 2026-05-31 | **흐름 수정: '오늘은 여기까지' → 홈 복귀** | `store.ts` | '오늘은 여기까지'가 기분척도(MOOD_POST)로 가서 같은 질문 반복처럼 보이던 문제 → 기분 질문 없이 라운드 종료(공놀이만 기록) 후 **홈(초기화면)** 복귀. 기분 pre는 상시 선노출 대신 **'리츄얼까지' 선택 후 글쓰기 직전**에 1회. 즉 기분 측정은 리츄얼 경로에서만(pre→post), 공놀이만 경로는 행동시간만. `tsc -b && vite build` 통과 |
| 2026-05-31 | **의식 연출 강화: 태우기·날리기** | `rituals/Burn.tsx`, `rituals/Plane.tsx` | 태우기=일렁이는 불꽃 5갈래(무한 flicker)+아래→위 그을림 front(이글거리는 잉걸 edge)+불티 12개 상승+바닥 광원. 날리기=종이 접힘→빛 꼬리(혜성 트레일)+후광 달고 완만한 곡선으로 하늘로 멀어짐, 사라지는 자리 반짝임+떠다니는 빛 입자 6개. |
| 2026-05-31 | **테마: 밝은 파스텔 노랑 배경** | `styles/tokens.css`·`global.css`, `components/MoodScale.tsx`, `screens/RitualPrompt.tsx`·`Ended.tsx`·`RitualPick.tsx` | 어두운 시간대별 배경 → 전 화면 공통 연한 파스텔 노랑(3레이어 그라데이션). `--on-bg`·`--ink` 따뜻한 다크로, body/frame 폴백도 노랑. 어두운 배경 가정이던 반투명 흰 버튼들을 밝은 배경용(흰 알약+그림자 / `.btn-ghost` 윤곽선)으로 교체. `tsc -b && vite build` 통과 |
| 2026-05-31 | **흐름 재수정: '오늘은 여기까지'도 기분 post 받기** | `store.ts`, `App.tsx`, `types.ts`, `constants.ts`, `screens/Ended.tsx`(삭제) | 직전 변경에서 '오늘은 여기까지'가 기분 질문 없이 홈으로 가던 것을 정정(KPI 질문 누락). 이제 **'오늘은 여기까지'→기분 post(ball_only)→응답 시 홈(시작)으로** 복귀. ENDED 종료화면 제거(응답 후 바로 시작으로). 기분 측정: ritual 경로=pre+post, 공놀이만=post. `tsc -b && vite build` 통과 |
| 2026-05-31 | **테마 되돌림: 시간대 5단계 그라데이션 복원** | `styles/tokens.css`·`global.css`, `components/MoodScale.tsx`, `screens/RitualPrompt.tsx`·`RitualPick.tsx` | 파스텔 노랑 폐기 → 실제 시각 기반 5단계(일출/낮/노을/밤/새벽) 그라데이션을 레퍼런스 이미지대로 재구현. day=분홍→라벤더, pre-dawn=진파랑→분홍여명, night=달무리+별빛 추가. 다크 배경용 버튼/칩 스타일 복원(`.btn-ghost` 제거). `tsc -b && vite build` 통과 |
| 2026-06-02 | **Vibration API 햅틱 피드백 추가** | `haptics.ts`(신규), `components/JellyBall.tsx` | 슬라임 촉각감 3종: ①벽 충돌=드래그 오프셋이 프레임 경계 넘는 순간 1회, 속도(`vx`/`vy`)로 진동 길이 6~28ms 차등+안쪽 복귀 시 래치 해제(재충돌 인식). ②누름=7ms 단발, 해제=`[10,24,22]` "삐-용" 두 박자(구분 가능). ③문지름=누른 채 이동 누적 14px마다 5ms 펄스(빠를수록 빈도↑, 멈추면 자동 정지). 미지원/예외는 `try/catch`로 조용히 무시(데스크톱·iOS Safari 등). 경계는 pointerdown 시 ball·`.app-frame` rect로 측정. x/y `motionValue.on('change')` 구독. `tsc -b && vite build` 통과 |
| 2026-06-02 | **의식 단계 햅틱 추가** (4종) | `haptics.ts`, `rituals/Shred.tsx`·`Burn.tsx`·`Plane.tsx`·`Jewelbox.tsx` | 파쇄기=갈기 이동 26px마다 4ms 끊김 펄스+완료 시 폭죽 성공 진동(`[30,24,18,30,14,36,24]`). 태우기=`lit` 동안 130ms 인터벌로 진행도(0~1)에 비례한 3~25ms 펄스(약→강 상승). 날리기=당김 변화 12px마다 세기 비례 약펄스(긴장감)+발사 순간 12~34ms 한 방. 보석함=담는 순간 부드러운 `[10,30,16]`+후광 시작(+2s)에 심장박동 `[25,60,18,500,25,60,18]`. 각 의식 언마운트 시 `stopVibration()`. `tsc -b && vite build` 통과 |
| 2026-06-02 | **시작 안내에 진동 점검 추가** | `components/StartupNotice.tsx` | 테스터가 무음/절전으로 진동을 못 느끼는 사례 → 시작 말풍선에 "📳 진동 안내"(무음·방해금지·절전 끄기) + "🔔 진동 느껴보기" 버튼(`navigator.vibrate` 직접 호출, 미지원 시 안내 문구). 자동 닫힘 13s→20s. `tsc -b && vite build` 통과. (cloudflared trycloudflare로 LAN 밖 제3자 폰 검증 중) |
| 2026-06-02 | **햅틱 튜닝: 태우기=빈도 램프 / 보석함=두근×3** | `haptics.ts`, `rituals/Burn.tsx`·`Jewelbox.tsx` | 태우기: 세기 램프 폐기 → 일정한 12ms 톡을 self-scheduling 타이머로, 진행도 0→1에서 간격 300ms→70ms로 좁혀 '빈도'가 위로 갈수록 잦아짐. 보석함: 심장박동 2박자→`[30,100,22,620,...]` **두근×3**(≈1.7s), 후광도 duration 1.6s→2.0s로 늘리고 opacity를 3회 부풀려(times 키프레임) 박동과 동기. `tsc -b && vite build` 통과 |

> 제스처 매핑: 굴리기=드래그 추종 / 당겼다놓기=탄성 복귀 / 튕기기=release 속도가 스프링에 실려 큰 복귀 / 터치파장=누른 지점 ripple. 4종이 *하나의 탄성 드래그 공*으로 통합 표현됨(최소 구현). 튕기기를 "날아가서 머무는" 물리로 분리하려면 dragEnd 속도 분기 추가 필요(후속).

## 다른 세션에서 이어서 할 때

1. 이 파일 + `docs/react_prototype_spec.md` 를 먼저 읽는다.
2. Node 설치 여부를 사용자에게 확인 → 설치됐으면 `npm install && npm run dev`로 **첫 실행 검증**부터.
3. 실행 중 TS/런타임 오류가 나오면 잡고, 그다음 위 "다음 후보"에서 우선순위를 정해 진행한다.
