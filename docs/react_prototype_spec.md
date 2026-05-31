# 흘림 / 토닥갤럭시 — React 프로토타입 구현 명세

> 출처: `기능명세서_감정해소앱-1.xlsx` (6단계·26기능) + `heulim_wireframe.html` (메인 플로우 9스텝) 교차 분석
> 기준일: 2026.05.27 회의 / 작성: 2026.05.31

---

## 0. 한눈에 보기

- **앱 성격**: 감정을 *기록*이 아니라 *흘려보내며 해소*하는 단일 세션형(one-shot) 인터랙티브 앱
- **핵심 사이클**: `홈 → 글쓰기 → 의식 선택 → 의식 진행 → 잔상 → 완료 → 홈 리셋(+1)` — **뒤로가기 없는 단방향 루프**
- **구현 관점 핵심**: 이건 "여러 페이지를 오가는 앱"이 아니라 **하나의 흐름을 따라가는 상태머신(FSM)**이다. 라우팅보다 단계 전환 관리가 본질.

---

## 1. 화면 목록 (Screens)

URL 라우트가 아니라 **플로우 단계(스텝)** 로 본다. 각 단계는 하나의 화면 컴포넌트.

| # | 스텝(코드) | 화면 | 와이어 step | 명세 대응 | MVP |
|---|-----------|------|------------|-----------|-----|
| 1 | `ONBOARDING` | 온보딩 | 01 | ONB-01 | ▲ (간소화) |
| 2 | `HOME` | 첫 화면(홈) | 02·03·03b | HOME-01~06 | ● 필수 |
| 3 | `WRITE` | 감정 글쓰기 | 04 (pour) | WRT-01·02 | ● 필수 |
| 4 | `RITUAL_PICK` | 의식 선택 | 05 | RIT 공통 | ● 필수 |
| 5 | `RITUAL_ACT` | 의식 진행 | 06 | RIT-01~10 | ● 필수(서브셋) |
| 6 | `AFTERGLOW` | 잔상 | 07 | END-01 | ● 필수 |
| 7 | `RELEASED` | 완료 ("다 보냈어요") | 08 | END-02·03 | ● 필수 |
| → | (홈 리셋, 카운터 +1) | — | 09 | END-04 | ● 필수 |

> 화면 = 7개. `RELEASED` 종료 후 `HOME`으로 되돌아가며 해소 카운터를 +1 한다.

### 화면별 구성 요소

**ONBOARDING** — 앱 소개("기록이 아닌 해소") → 사용법 → 홈 진입. 희미한 공이 정중앙. *최초 1회만* 노출(localStorage 플래그).

**HOME** (가장 복잡)
- 시간대별 배경 그라데이션 (아래 5구간)
- 상단 날짜 `YYYY.MM.DD`
- 진입 시 위로 멘트 fade-in → 공 터치 시 fade-out (멘트 사라짐 → 날짜까지 fade-out 2단계: `touched` → `touched·full clear`)
- 중앙 공(젤리) 오브제 — 제스처 인터랙션 대상
- 하단 해소 카운터
- 다음 화면 전환 트리거(스와이프 또는 공 터치 모션)

**WRITE** — 종이 위 자유 텍스트 입력. "아무에게도 안 보임" 톤. 작성 완료 → 의식 선택.

**RITUAL_PICK** — 10가지 의식 그리드. 흘려보내기(let go) 6종 + 보관하기(keep) 4종 구분.

**RITUAL_ACT** — 선택한 의식의 `STEP1 → STEP2 → STEP3` 애니메이션 재생. 종이에 작성 텍스트가 얹혀 함께 처리됨.

**AFTERGLOW** — 의식별 상징 잔상 이미지 3초 ("잔상이 남아요").

**RELEASED** — 3초 빈 화면(여운) → "다 보냈어요 / 처음으로 돌아가요".

---

## 2. 화면 전환 구조 (Navigation / FSM)

```
                 (최초 1회)
   ONBOARDING ─────────────▶ HOME ◀───────────────┐
                              │                    │
                  공 터치/스와이프                  │ home 리셋 (counter +1)
                              ▼                    │
                            WRITE                  │
                       (작성 완료)                 │
                              ▼                    │
                         RITUAL_PICK               │
                       (의식 선택)                 │
                              ▼                    │
                         RITUAL_ACT                │
                       (STEP1→2→3 종료)            │
                              ▼                    │
                         AFTERGLOW (3s)            │
                              ▼                    │
                         RELEASED (3s) ────────────┘
```

**전환 규칙**
- **단방향(forward-only)**: 의식 흐름에 들어가면 뒤로가기가 없다. (브라우저 back 버튼/제스처는 막거나 홈 리셋으로 흡수)
- `AFTERGLOW`, `RELEASED`는 **타이머 자동 전환**(각 3초). 사용자 입력 불필요.
- 루프의 끝은 항상 `HOME` 초기 상태로 리셋 + 카운터 증가.
- **react-router 불필요** — 한 번에 한 화면, URL 의미 없음. `currentStep` 상태값 하나로 전환 컴포넌트 스위칭(`<AnimatePresence>` + switch).

**전환 애니메이션**: 화면 간 cross-fade / 부드러운 전환이 톤에 핵심. Framer Motion `AnimatePresence`로 mount/unmount 전환 처리 권장.

---

## 3. 구현할 인터랙션

### 3-1. 홈 — 공 오브제 제스처 (GST)
| 인터랙션 | 동작 | 난이도 | MVP |
|----------|------|--------|-----|
| 터치 | 공 터치 → 위로 멘트 사라짐 | 하 | ● |
| 튕기기 (GST-01) | 튕기면 물리 반응 이동 | 중 | ▲ |
| 고무줄 (GST-02) | 당겼다 놓으면 탄성 복귀 | 중상 | ○ 후순위 |
| 터치 파장 (GST-03) | 터치점 동심원 물결 | 중 | ▲ |
| 굴리기 (GST-04) | 드래그 방향대로 굴러 이동 | 중 | ○ 후순위 |
| 가림 (HOME-06) | 배경색 영역 진입 시 공이 묻힘 | 상 | ○ 후순위 |

### 3-2. 시간대별 배경 (HOME-01)
현재 시각 기준 5구간 그라데이션 (와이어프레임 정의):

| 구간 | 시간 | 톤 |
|------|------|----|
| dawn (새벽→일출) | 05–07 | 하늘색에서 |
| day (낮) | 07–16 | 부드러운 분홍 |
| dusk (노을) | 16–19 | 남색 하늘 |
| night (밤) | 19–04 | 짙은 남색 + 별빛 |
| pre-dawn (여명) | 04–05 | 진한 파랑 |

→ `new Date().getHours()`로 구간 판정. CSS gradient 변수 전환. 구간 경계 부드러운 보간은 후순위.

### 3-3. 글쓰기 (WRT)
- 자유 textarea, 형식/길이 제약 없음. 작성 텍스트는 의식 단계로 전달되어 종이 위에 렌더.

### 3-4. 의식 애니메이션 (RIT) — 핵심 연출
공통 구조: **STEP1(종이 등장) → STEP2(변형/진행) → STEP3(절정/소멸) → AFTERGLOW(3s 상징)**

**흘려보내기 6종 (let go)**
| 의식 | STEP2→3 핵심 | afterglow | 기술 |
|------|--------------|-----------|------|
| burn 태우기 | 위→아래로 타들어감 → 사라짐 | 촛불 하나 | CSS/Canvas 불꽃 |
| shred 파쇄 | 입구 진입 → 스트립 stagger 출력 | 바닥 종이더미 | DOM stagger |
| tear 찢기 | 두 갈래 분리 → 조각 회전 흩날림 | 꽃잎 무한 | 파티클(Canvas 권장) |
| crumple 구기기 | 점점 작아짐 → 공처럼 날아감 | 먼 곳 작은 점 | transform scale/translate |
| scatter 뒤섞기 | 글자 떠올라 → 가라앉음 | 마지막 글자 | **가속도 센서**(DeviceMotion) |
| unravel 실풀기 | 손가락 궤적 따라 풀림 → 사라짐 | 실 한 줄 흐름 | 드래그 추적 + SVG path |

**보관하기 4종 (keep)** — 소멸 대신 형태 변형 후 보관(아카이브 연계 검토)
| 의식 | STEP2→3 | afterglow |
|------|---------|-----------|
| heart 하트접기 | 반 접힘 → 하트 완성 | 하트 위로 떠오름 |
| letter 편지접기 | 모서리 접힘 → 봉투 | 새가 봉투 물고 날아감 |
| plane 종이비행기 | 화살촉 접힘 → 완성 | 비행기 사선 비행 |
| jewelbox 보석함 | 종이 담김 → 뚜껑 닫힘 | 어두운 공간 안치 |

> 명세 비고: 분출 행위는 **긍·부정 균형(개수 동일)**으로 구성 의도. 현재 6 let-go / 4 keep.

---

## 4. 상태관리 필요 여부

**결론: 무거운 라이브러리(Redux 등) 불필요.** 단방향 단일 세션 흐름이라 작은 전역 상태로 충분.

### 전역 상태 (앱 1개 store)
```ts
interface AppState {
  step: 'ONBOARDING'|'HOME'|'WRITE'|'RITUAL_PICK'|'RITUAL_ACT'|'AFTERGLOW'|'RELEASED'
  draftText: string            // WRITE에서 작성, RITUAL_ACT까지 전달
  selectedRitual: RitualId|null
  releaseCount: number         // 해소 카운터 (localStorage 영속)
  timeOfDay: 'dawn'|'day'|'dusk'|'night'|'pre-dawn'  // 진입 시 1회 계산
  onboarded: boolean           // localStorage 영속
}
```

### 권장 구현
- **`useReducer` + Context**(의존성 0) 또는 **Zustand**(보일러플레이트 최소) — 둘 다 적합. 프로토타입 속도 우선이면 Zustand 추천.
- 상태 전환은 **명시적 액션**(`goWrite`, `pickRitual(id)`, `finishRitual`, `resetHome`)으로 FSM 형태 관리 → 단방향 흐름 보장에 안전.
- **영속 대상**: `releaseCount`, `onboarded`만 localStorage. 작성 텍스트는 **세션 종료 시 폐기**(앱 컨셉상 "흘려보냄" — 저장하지 않는 게 핵심 가치).
- 애니메이션 진행 상태(STEP1/2/3)는 각 의식 컴포넌트 **로컬 state**로 관리, 전역에 올리지 않음.

> ⚠️ 컨셉 주의: 사용자가 적은 감정 텍스트를 서버/스토리지에 남기지 않는 것이 이 앱의 신뢰 포인트. 보관형(keep) 의식의 아카이브 연계는 별도 정책 결정 필요.

---

## 5. MVP 프로토타입 범위

목표: **전체 핵심 사이클을 한 바퀴 완주**하는 수직 슬라이스. "감정 적고 → 흘려보내는 경험"이 끝까지 작동하는 것이 1차 목표.

### ✅ MVP 포함
1. **온보딩** — 정적 3장 슬라이드(또는 1장), localStorage로 1회만
2. **홈** — 시간대 배경(5구간) + 날짜 + 위로 멘트 fade + 공 터치(멘트 사라짐) + 카운터
3. **전환** — 공 터치 → WRITE (스와이프는 후순위)
4. **글쓰기** — textarea 입력 → 완료
5. **의식 선택** — **3종만**(예: burn / crumple / tear — 연출 다양성 대표)
6. **의식 진행** — 선택 의식 STEP1→2→3 애니메이션 (Framer Motion/CSS)
7. **잔상 → 완료 → 홈 리셋(+1)** — 타이머 자동 전환, 카운터 증가

### ⏸ MVP 이후 (Phase 2+)
- 제스처 풀세트: 고무줄·굴리기·터치 파장·튕기기 물리
- 가림 인터랙션 (HOME-06)
- 의식 10종 전체 + 보관형(keep) 4종 아카이브
- **뒤섞기(scatter)** 가속도 센서 — 권한/디바이스 의존, 별도 검증
- 시간대 경계 부드러운 색 보간, 별빛 등 디테일
- 온보딩 카피·위로 멘트 카피 확정 (현재 "미정")

### 미확정 항목 (구현 전 기획 확인 필요)
- HOME-05 전환 트리거: 스와이프 vs 공 터치 모션 (명세 "미확정")
- END-01 마무리 연출: 의식별 차별화 vs 공통 통일 (명세 "결정 필요")
- END-02 빈 화면 지속시간 3초 (명세 "검증 필요")
- 보관형 의식의 아카이브(보관함) 존재 여부

---

## 6. 권장 기술 스택 (프로토타입)

| 영역 | 선택 | 이유 |
|------|------|------|
| 빌드 | **Vite + React + TS** | 가볍고 빠른 프로토타입 |
| 상태 | **Zustand** 또는 useReducer+Context | 단일 흐름, 과한 라이브러리 불필요 |
| 라우팅 | **없음** (step 상태로 스위칭) | 단방향·뒤로가기 없음 |
| 화면 전환 | **Framer Motion** `AnimatePresence` | cross-fade·부드러운 톤 |
| 의식 애니메이션 | Framer Motion + CSS, 파티클은 **Canvas** | tear/scatter 등 다수 조각 |
| 영속 | localStorage | 카운터·온보딩 플래그만 |
| 폰트/톤 | Instrument Serif, Gowun Batang (와이어 동일) | 시적 톤 유지 |

---

## 부록: 폴더 구조 제안

```
src/
  App.tsx                 # FSM 스위칭 + AnimatePresence
  store.ts                # 전역 상태 (step, draft, ritual, count)
  hooks/useTimeOfDay.ts   # 시간대 구간 판정
  screens/
    Onboarding.tsx
    Home.tsx              # 배경 + 공 + 멘트 + 카운터
    Write.tsx
    RitualPick.tsx
    RitualAct.tsx         # 선택 의식 → 해당 RitualXxx 렌더
    Afterglow.tsx
    Released.tsx
  rituals/
    Burn.tsx  Crumple.tsx  Tear.tsx  ...   # 의식별 STEP1→2→3
  components/JellyBall.tsx
  styles/tokens.css       # 색·폰트·시간대 그라데이션 변수
```
