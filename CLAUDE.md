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
- 글쓰기 textarea → 의식 선택(3종 그리드) → 의식 애니메이션(STEP1→2→3) → 잔상 → 완료 → 홈 리셋(카운터 +1, `heulim.releaseCount`)
- 감정 텍스트는 `resetHome()`에서 폐기(미저장)

### 아직 안 한 것 (다음 후보)
- 의식 애니메이션은 기본 수준 — 디테일 강화 여지(파티클/Canvas, afterglow 상징)
- 온보딩·위로 멘트 카피 확정 (현재 임시)
- 제스처 풀세트(튕기기·고무줄·터치 파장·굴리기), 가림 인터랙션
- 의식 10종 전체 + 보관형(keep) 4종
- 뒤섞기(scatter) 가속도 센서(DeviceMotion) — 권한/디바이스 검증 필요
- **빌드/실행 검증 자체를 못 함** (Node 미설치) → 설치 후 첫 `npm run dev`에서 오류 확인 필요

---

## 진행 로그

| 날짜 | 변경 | 파일 | 메모 |
|------|------|------|------|
| 2026-05-31 | 초기 MVP 화면 구조 | src/* 전체 | 단방향 FSM 7화면 + 의식 3종 |
| 2026-05-31 | **3단계 제스처 인터랙션(GST-01~04)** 최소 구현 | `components/JellyBall.tsx` | 홈 공에 굴리기/당겼다놓기/튕기기/터치파장. Framer `drag`+`dragSnapToOrigin`+ripple, Pointer 이벤트로 마우스·터치 동시 지원. **未실행 검증** |
| 2026-05-31 | **글쓰기 진입 = 탭 → 롱프레스(800ms)로 변경** | `JellyBall.tsx`, `Home.tsx`, `constants.ts` | 공을 `LONG_PRESS_MS`(800ms) 이상 누르면 글쓰기 진입. 누르는 동안 원형 SVG 게이지 차오름 + 공 살짝 눌림(scale 0.9). 800ms 전 떼면 리셋·원상복귀. 드래그 시작 시 `onDragStart`로 롱프레스 취소(굴리기/튕기기와 공존). 멘트는 pointerdown(`onPressStart`)에 사라짐. `onTap` 내비게이션 제거. **未실행 검증** |
| 2026-05-31 | **오브제 → 슬라임/젤리 물성으로 개편** | `components/JellyBall.tsx` | `useVelocity`+`useSpring`+`useTransform`로 드래그 속도를 읽어 진행 축 늘림+트레일 skew(끈적함). 누름은 비대칭 찌그러짐(scaleX1.12/scaleY0.82)+손가락 자리 딤플 음영+딤플 방향 이동. 떼면 스프링 복원(탄성 오버슈트). idle은 유기적 borderRadius 모핑(액체 출렁임)+젤 inset 음영. 3중 변형 레이어(속도/누름/모핑) 분리 합성. 게이지·ripple 유지. **未실행 검증** |

> 제스처 매핑: 굴리기=드래그 추종 / 당겼다놓기=탄성 복귀 / 튕기기=release 속도가 스프링에 실려 큰 복귀 / 터치파장=누른 지점 ripple. 4종이 *하나의 탄성 드래그 공*으로 통합 표현됨(최소 구현). 튕기기를 "날아가서 머무는" 물리로 분리하려면 dragEnd 속도 분기 추가 필요(후속).

## 다른 세션에서 이어서 할 때

1. 이 파일 + `docs/react_prototype_spec.md` 를 먼저 읽는다.
2. Node 설치 여부를 사용자에게 확인 → 설치됐으면 `npm install && npm run dev`로 **첫 실행 검증**부터.
3. 실행 중 TS/런타임 오류가 나오면 잡고, 그다음 위 "다음 후보"에서 우선순위를 정해 진행한다.
