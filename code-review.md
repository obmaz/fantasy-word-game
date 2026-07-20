# 📋 코드 리뷰: 킹왕짱 RPG (Fantasy Word Game)

> 리뷰 일자: 2026-07-20 · 브랜치: `main` · 방식: 소스 직접 정독 (`scripts/`, `index.html`, `styles/`)
> 범위: 보안 항목 제외 (요청)
> **상태: 지적 항목 전건 반영 완료** — 아래는 "무엇을 왜 고쳤는지"의 기록입니다.

## 한눈에 보기

이전 리뷰(2026-06-29)의 핵심 결함(편향 셔플, 원본 배열 파괴, 무한 루프, 스킬 `NaN`)은
이미 해결된 상태였고, 이번 리뷰는 그 이후 남았거나 새로 드러난 문제를 다뤘습니다.

가장 값어치 있던 항목은 **B1(보상이 이전 문제의 잔여 시간으로 계산됨)**과
**B2(존재하지 않는 음악 파일 3개)** 였습니다. 둘 다 사용자가 체감하는 실제 오작동이면서
수정 비용은 몇 줄에 불과했습니다.

구조 측면에서는 **통계 영속화 책임이 게임 엔진에 흩어져 있던 것**이 가장 컸고,
이를 `database.js`로 되돌리면서 같은 초기화 블록 4중 복제와 레거시 이중 기록을 함께 정리했습니다.

검증 수단이 전무하던 상태에서 **테스트 16개**(순수 로직 13 + 로드 스모크 3)를 추가했습니다.

---

## 🐞 버그 (수정 완료)

### B1. 시간 제한 없는 문제의 보상이 "이전 문제의 잔여 시간"으로 계산됨 ⭐

주관식과 보스 모드는 타이머를 시작하지 않는데(`nextLevel`) 보상 계산은 `game.timeLeft`를 그대로 읽었습니다.

- **보스 모드**: `timeLeft`가 초기값 `0`에서 갱신되지 않아 `timeRatio = 0` →
  **보상이 항상 `floor(80 × 0.5) = 40G`로 고정**(설계상 최대 80G).
- **배틀 혼합형 주관식**: 직전 객관식이 남긴 시간을 그대로 사용 → 같은 난이도인데 보상이 널뜀.
  직전 문제가 타임아웃이었거나 첫 문제가 주관식이면 50%.

**수정** — `game-engine.js` `handleAnswer`: 시간 제한 유무를 판정해 배율을 분리.

```js
const isTimed = game.mode !== 'boss' && !(game.currentQ && game.currentQ.isBoss);
const timeRatio = isTimed ? game.timeLeft / game.maxTime : 1;
```

### B2. 음악 트랙 상한(23)이 실제 파일 수(20)와 불일치 ⭐

`data/`에는 `background_music_1~20.mp3`만 존재하는데 `max: 23`,
`settings.js`의 해금 목록도 `[1..23]`이었습니다. 21~23을 고르면 **404 → 무음**이고,
로드 실패로 `onended`가 발생하지 않아 다음 곡으로 넘어가지도 않았습니다.

**수정** — `audio-manager.js`에 `MUSIC_TRACK_COUNT = 20` 단일 상수를 두고,
`currentMusicIndices.max`와 `ui.renderMusicSelectOptions`가 모두 이 값을 참조하도록 통일.
파일을 추가/삭제하면 이제 상수 한 줄만 고치면 됩니다.

### B3. 데이터셋 변경을 "취소"해도 되돌아가지 않음

`changeDataSet()`이 확인을 받기 **전에** 전역(`rawDataData`/`storiesData`)과 `localStorage`를
교체해버려서, 취소해도 드롭박스가 복원되지 않고 `dayCatalog`(로드 시점 고정)와
실제 문제 풀이 어긋난 상태가 남았습니다.

**수정** — `game-data-loader.js`: 순서를 뒤집어 **존재 확인 → 사용자 확인 → 그다음 적용**.
취소 시에는 전역을 건드린 적이 없으므로 드롭박스만 되돌리면 됩니다.

### B4. `unlockedMusicTracks`가 저장되지 않아 잠금 시스템이 죽어 있었음

`settings.js`가 런타임에 해금 목록을 붙였지만 `database.js`의 settings 로더가
`musicPlay`/`wordRead`만 복원해 매번 버려졌습니다. 해금 조건이 구현된 적도 없어
안내 토스트는 도달 불가 코드였습니다.

**수정** — 잠금 개념을 **제거**했습니다(어중간한 상태가 가장 나쁨).
`playMusic`/`playNextMusic`/`setupMusicSelectListeners`가 크게 단순해졌고,
`lastValidMusicSelection` 롤백 상태도 함께 사라졌습니다.

### B5. 한 글자 단어에서 빈 입력이 정답 (주석 + 가드)

`answerWithoutFirst = answer.slice(1)`이 1글자 단어에서 `''`이 되어 무입력이 정답 처리됩니다.
현재 데이터셋에는 한 글자 단어가 없으므로 **규칙과 전제를 주석으로 명시**하고,
길이 가드(`answerWithoutFirst.length > 0`)를 함께 넣었습니다.
여러 단어 구문에서 힌트는 각 단어 첫 글자를 보여주지만 생략 허용은 맨 앞 1글자뿐이라는
비대칭도 같은 주석에 적어 두었습니다. (spec.md §5.2.1에도 규칙으로 기록)

### B6. `admin-tools.js`에 편향 셔플 잔존

문제지 출력 경로만 `sort(() => Math.random() - 0.5)`가 남아 정답 보기 위치가 치우쳤습니다.
인쇄물은 학습자가 패턴을 학습해버릴 수 있어 게임 화면보다 영향이 큽니다.
**수정** — `game.shuffle`(Fisher–Yates, 사본 반환) 재사용.

### B7. 배틀 모달 라디오 `change` 리스너 누적

`openBattleModeModal()`이 열릴 때마다 라디오마다 `addEventListener` → N번 열면 핸들러 N개.
**수정** — 그룹에 위임 리스너 1개 + `dataset.changeBound` 플래그, 레이블 동기화는
`syncQuestionTypeLabels()` 헬퍼로 분리.

---

## 📐 명세 위반 / 문서-코드 불일치 (수정 완료)

| #   | 항목                        | 조치                                                                                                                                                                   |
| --- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | native `confirm()` 3곳      | `showConfirm()`(비차단)으로 교체. `pendingAction`을 `async`로 전환 (spec §2.3 준수)                                                                                    |
| S2  | `ui.setStoryTitle` 미존재   | `ui-manager.js`에 실제로 구현. 매번 찍히던 `console.warn` 폴백 경로 제거                                                                                               |
| S3  | 보스 무한 큐 미구현         | 코드가 아니라 **명세를 현실에 맞춤** — 보스는 덱 소진 시 승리로 종료 (무한 재병합은 원래 없던 기능)                                                                    |
| S4  | 인라인 `onclick` 34곳       | 전부 `data-action` 속성으로 바꾸고 `init.js`의 `ACTION_HANDLERS` 표 + 문서 레벨 위임 리스너 1개로 처리. 인자는 `data-slot`/`data-digit`으로 전달. HTML의 `onclick` 0개 |
| S5  | 도달 불가 코드              | `_buildPracticeList`, `nextLevel`의 3번째 분기, `story.mode === 'practice'` 제거 (연습 모드는 `practiceMemorization.start()`가 담당)                                   |
| S6  | 무의미해진 음수 골드 클램프 | `db.addGold`가 이미 `Math.max(0, ...)`로 막고 있어 제거                                                                                                                |

---

## 🏗️ 구조 (수정 완료)

### A1. `game.end()` 280줄 → 렌더링만 담당

통계 **쓰기 로직이 게임 엔진에 있던 것**이 가장 큰 문제였습니다.
동일한 `books[key]` 초기화 블록이 4곳(`database.js`, `game-engine.js` ×2, `statistics.js`)에 복제돼
필드 하나 추가하려면 네 군데를 고쳐야 했습니다.

**수정** — 통계 구조의 소유권을 `database.js`로 되돌렸습니다.

| 새 API                            | 역할                                                                         |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `db.getBookStats(key?)`           | 단어장 통계 조회(없으면 생성) + 누락 하위 필드 보강. 구조를 아는 유일한 지점 |
| `db.recordBossWave(wave)`         | 보스 최고 기록 갱신(더 높을 때만)                                            |
| `db.recordPerfectDay(day, label)` | 주관식 퍼펙트 Day 기록(같은 Day는 최신 날짜로 갱신)                          |
| `db.getBookKey()`                 | 현재 데이터셋의 저장 키                                                      |

`game.end`는 `_resultRow` / `_renderResultRecord` / `_renderResultWrongWords` /
`_saveSessionRecords` / `dayLabel`로 쪼개져 각자 한 가지만 합니다.

### A2. 레거시 전역 통계 이중 기록 제거

`addStats`와 `game.end`가 `books[]`와 최상위 `stats.*`에 매번 두 번 썼지만
읽는 곳은 `books`뿐이었습니다(최상위를 읽던 `ui.updateMainStats`는 `display:none` 요소에
그리는 죽은 UI였습니다).

**수정** — 최상위 누적 필드는 로드 시 1번 단어장으로 이관 후 삭제.
`ui.updateMainStats`와 숨겨진 `#stat-solved/correct/rate` 마크업도 함께 제거.

### A3. 통계 키를 이름 → 데이터셋 ID로 전환

`db.stats.books`와 `db.practiceMemorized`가 **표시 이름**을 키로 써서,
`gameDataName_N`을 한 글자만 고쳐도 누적 통계와 암기 기록이 통째로 유실됐습니다.

**수정** — 키를 `book-1`, `book-2` …(데이터셋 ID)로 바꾸고,
`migrateBookKeys()`가 기존 이름 키를 1회 자동 이관합니다.
이름 → ID 매핑은 로드된 `gameDataName_N`에서 찾고, 실패하면 1번으로 봅니다.
같은 키로 합쳐질 땐 수치는 합산, 최고 기록은 큰 쪽, 암기 목록은 중복 제거 병합.
**이 마이그레이션은 테스트로 검증됩니다.**

### A4. 모달 강제 숨김 코드 3중 복제 제거

5개 프로퍼티 × 4개 모달을 반복 설정하던 ~100줄이 세 곳에 있었습니다.

**수정** — `modal-manager.js`에 `resetScreenOverlay(id, {behind})` /
`resetScreenOverlays(ids)` / `GAME_ENTRY_OVERLAYS` 상수를 추가하고
`game.end`, `story.showEnding`, `closeResultScreen`, `story.startIntro`가 모두 이걸 씁니다.
(`showEnding`의 중복 호출은 `game.end`에 위임)

### A5. `cloneNode` 리스너 제거 패턴 삭제

핸들러가 클로저(`daySel`)를 쓰지 않도록 `story._onStartClick`으로 분리하니
노드 교체가 필요 없어졌습니다. `dataset.startBound` 플래그로 1회만 바인딩합니다.
JS로 박던 `pointerEvents`/`cursor`/`zIndex`는 이미 `.story-btn-area` CSS에 동일하게 있어 제거.

### A6. HTML 문자열 안의 인라인 스타일 → CSS 클래스

`statistics.render`와 `game.end`가 `style="font-size:15px; ..."`를 8회 이상 반복 보간했습니다.
**수정** — `statistics-modal.css` / `result-modal.css` / `buttons.css`에 클래스를 만들고
JS는 클래스만 붙입니다(`.statistics-stat-row`, `.result-stat-value`, `.option-btn-correct`,
`.boss-hint-revealed` 등). `statistics.js`는 195줄 → 137줄.

---

## ⚠️ 사소한 항목 (수정 완료)

| #   | 항목                         | 조치                                                                                                               |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| M1  | 오답 후 힌트 스타일 잔존     | 인라인 스타일 → `.boss-hint-revealed` 클래스, `renderBoss`가 다음 문제에서 제거                                    |
| M2  | 보기 3개 미만 허용           | `renderNormal`이 개수를 검증해 부족하면 **주관식으로 대체 출제**(`isBoss`를 올려 타이머·채점 타입까지 일관되게)    |
| M3  | `updateDurability` 빈 함수   | 함수 + `#durability-badge` 마크업 + `display:none !important` CSS + 호출부 2곳 모두 제거                           |
| M4  | `db.save()` 전체 저장        | 변경 필드만 저장하도록 범위 지정 (`save('settings')`, `save('lastDay')`, `save('skills')`, `save('memorized')` 등) |
| M5  | 테스트 0개                   | **테스트 16개 추가** (아래 참조)                                                                                   |
| M6  | `resolveStoryData` 중복 분기 | 같은 조건을 3번 검사하던 것을 1번으로 정리                                                                         |

---

## ✅ 추가된 테스트 (`npm test`)

의존성 없이 `node:test` + `node:vm`만 사용합니다 (`node_modules` 불필요).
브라우저용 전역 스크립트를 vm 샌드박스에서 실행해 꺼내오는 로더(`tests/helpers/load-module.js`)를 두었습니다.

**`tests/game-engine.test.js` — 순수 로직 13개**

- `shuffle`: 원본 불변 / 사본 반환 / 빈·단일 배열 / **분포 편향 검사**(4000회 돌려 각 위치 등장 비율이 기대값 ±20% 이내 — 편향 셔플로 되돌아가면 실패)
- `_buildPool`: Day 간 누출 없음, 문자열/숫자 day 동일 취급
- `_interleave`: 번갈아 배치, 길이가 달라도 원소 보존
- `_buildBattleList`: 유형별 채우기, **혼합형에서 같은 유형이 연속되지 않음**, 원본 불변
- `getDistractors`: 정답 미포함·중복 없는 3개, **고유 값 부족 시 무한 루프 없이 종료**, decoy 그룹 우선 사용
- `dayLabel`: all/boss/카탈로그 라벨/기본 형식

**`tests/smoke-load.test.js` — 로드 스모크 3개**

- **index.html의 `<script>` 순서를 그대로 읽어** 최소 DOM 스텁 위에서 전부 실행.
  빌드 도구 없이 로드 순서에 의존하는 구조라, "순서가 어긋나 조용히 깨지는" 회귀를 잡습니다.
  핵심 전역 15개(`db`, `game`, `ui`, `resetScreenOverlays`, `showToast` …)의 존재도 확인.
- 이름 키 → ID 키 마이그레이션 검증 (수치 보존 포함)
- 레거시 최상위 누적 통계 → 1번 단어장 이관 후 제거 검증

```
ℹ tests 16   ℹ pass 16   ℹ fail 0
```

---

## 📄 함께 갱신한 문서

`spec.md`가 코드보다 앞서거나 뒤처진 곳을 맞췄습니다.

- 음악 트랙 수 23 → 20 + `MUSIC_TRACK_COUNT` 단일 진실 공급원 명시
- 트랙 잠금/해금 서술 삭제 (기능 자체가 없음)
- 보스 모드 "무한 재병합 큐" → 실제 동작(덱 소진 시 승리)으로 정정
- **신규**: 단어장 기록의 키 정책(데이터셋 ID) / 통계 구조의 소유권(`database.js`)
- **신규**: `data-action` + 위임 리스너 규약, `resetScreenOverlay` 사용 규약
- **신규**: 보상의 시간 배율 규칙(시간 제한 없는 문항은 배율 미적용)
- **신규**: 주관식 정답 판정 규칙과 "한 글자 단어 금지" 전제
- 오답 보기가 3개 미만일 때 주관식으로 대체 출제한다는 규칙 추가

---

## 🔭 남겨둔 것 (다음 후보)

의도적으로 손대지 않은 항목입니다. 판단이 필요하거나 이번 범위 밖입니다.

- **`#story-start-btn.boss-mode-btn` CSS 규칙이 매칭되지 않음** — 실제 버튼 id는
  `battle-mode-start-btn` / `boss-mode-start-btn`입니다. 값이 `.story-btn-area`와 동일해
  증상은 없지만 죽은 규칙입니다.
- **`secret.applyGold` / `resetGold` / `resetStats`가 UI에서 호출되지 않음** —
  버튼이 없어 도달 불가입니다. 버튼을 되살릴지 함수를 지울지 결정이 필요합니다.
- **ES Module 전환 / 번들러 도입** — 전역 + `<script>` 순서 의존이라는 근본 구조는 그대로입니다.
  다만 스모크 테스트가 로드 순서를 지켜주므로 급하지는 않습니다.
- **`equipped-summary`** — `display:none` 컨테이너 안에 렌더링됩니다.
  살릴 UI인지 확인 후 정리 대상입니다.

---

## 📊 평가 요약

| 항목      | 이전     | 현재       | 비고                                                            |
| --------- | -------- | ---------- | --------------------------------------------------------------- |
| 정확성    | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ | 보상 계산·음악 파일·데이터셋 전환 버그 해소, 회귀 테스트로 고정 |
| 구조      | ⭐⭐⭐   | ⭐⭐⭐⭐   | 통계 소유권 회수, 중복 4곳→1곳. 전역/스크립트 순서 의존은 잔존  |
| UX        | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 네이티브 `confirm` 전량 제거, 비차단 UI로 통일                  |
| 성능      | ⭐⭐⭐   | ⭐⭐⭐⭐   | 선택 저장 전면 적용. 번들 없음(정적 호스팅이라 수용 가능)       |
| 테스트    | ☆        | ⭐⭐⭐     | 0개 → 16개. 순수 로직 + 로드 스모크 + 마이그레이션              |
| 문서/주석 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | spec-코드 불일치 6건 해소, 규약 4건 신규 문서화                 |
