---
name: feature-development
description: >
  이 저장소에서 기능을 개발·추가·수정·구현할 때 항상 따르는 git 워크플로우.
  "기능 추가", "기능 개발", "~ 구현해줘", "~ 만들어줘", "이 기능 바꿔줘", "feature", "implement"
  등 코드 변경을 동반하는 작업 요청 시 반드시 이 스킬의 절차를 따른다.
  단순 질문·분석·문서 작성 등 코드 변경이 없는 작업에는 적용하지 않는다.
---

# 기능 개발 워크플로우

이 저장소에서 **코드를 변경하는 모든 기능 작업**은 아래 순서를 지킨다. 목적은
main을 항상 깨끗하게 유지하고, 변경을 PR 단위로 리뷰 가능하게 만드는 것이다.

## 절차

### 1. 시작 전 — main 최신화 + 피처 브랜치 생성
작업을 시작하기 전에 항상 실행한다. 로컬 변경이 섞여 있으면 먼저 정리/확인한다.

```bash
git checkout main
git pull origin main          # main을 최신 상태로
git checkout -b feature/<작업-요약>   # 피처 브랜치 생성 후 작업
```

- 브랜치명은 `feature/<짧은-영문-요약>` 컨벤션 (예: `feature/home-longpress`, `feature/ritual-burn-polish`).
- 버그 수정이면 `fix/<요약>`, 잡일이면 `chore/<요약>`도 허용.
- **main에 직접 커밋하지 않는다.** (사용자가 명시적으로 "main에 직접" 요청한 경우만 예외)

### 2. 작업 — 작은 단위로 구현
- 요청한 기능을 구현한다. 한 번에 너무 많이 바꾸지 않고 작은 단위를 선호한다.
- Node/npm은 에이전트 셸 PATH에 안 잡히므로 빌드/실행 검증은 사용자에게 맡긴다([[node-not-installed]]).

### 3. 완료 후 — 커밋 → 푸시 → PR
**작업이 전부 끝나면** 사용자에게 매번 묻지 않고 아래를 진행한다(이 절차 자체가 사용자의 상시 승인이다).

```bash
git add -A
git commit -m "<요약>

<본문: 무엇을 왜 바꿨는지>

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push -u origin feature/<작업-요약>
```

그 다음 main 대상으로 PR을 연다(`gh` CLI 사용):

```bash
gh pr create --base main --head feature/<작업-요약> \
  --title "<요약>" \
  --body "<변경 내용 · 테스트 방법 · 스크린샷 자리>

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- **이 환경엔 `gh` CLI가 설치돼 있지 않다.** 그러므로 `gh pr create`를 시도하지 말고,
  push 후 GitHub가 출력하는 PR 링크(`https://github.com/todaktodakhaejo/Prototype/pull/new/<브랜치>`)를
  사용자에게 안내해 직접 PR을 열게 한다. (gh가 설치되면 위 명령으로 자동화 가능)
- PR 생성 후 PR URL을 사용자에게 보고한다.
- **머지는 사용자가 한다.** 에이전트가 PR을 머지하지 않는다.

## 주의
- 푸시·PR은 외부로 나가는 행위이므로, 위 절차의 "작업 완료" 시점에만 수행한다.
  중간 산출물이나 미완성 상태로 PR을 열지 않는다.
- 변경 후 진행 로그는 `CLAUDE.md`에 한 줄 남긴다(인수인계용).
- hooks 같은 자동화가 아니라 **작업 시 따르는 프로세스**다. 매 기능 작업의 첫 단계에서
  이 절차를 떠올려 적용한다.
