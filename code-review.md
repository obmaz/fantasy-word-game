# 📋 코드 리뷰: 킹왕짱 RPG (Fantasy Word Game)

> 리뷰 일자: 2026-06-29 · 브랜치: `main` · 방식: 소스 직접 정독 (scripts/ 전반)

## 한눈에 보기

판타지 RPG 외피를 입힌 영단어 학습 게임. 순수 Vanilla JS/CSS + localStorage 구조이며,
연습/배틀/보스 모드와 단어장별 통계, 아이템/장비/상점 경제 시스템을 갖췄습니다.
기능적으로는 완성도 있게 동작하지만, **무작위성·전역 상태·렌더링 방식**에서
교정해야 할 실제 결함이 보입니다. 아래는 "동작은 하지만 틀린/위험한" 항목 위주입니다.

---

## 🐞 실제 버그 / 정확성 문제 (우선순위 높음)

### B1. 편향된 셔플 알고리즘
```js
// game-engine.js:802
shuffle: (arr) => arr.sort(() => Math.random() - 0.5),
```
`sort(() => Math.random() - 0.5)`는 균등 분포를 만들지 못하는 잘 알려진 안티패턴입니다.
엔진/브라우저에 따라 특정 위치가 통계적으로 더 자주 나오며, **퀴즈 게임에서는 정답 보기 위치나
문제 출현 순서가 치우칠 수 있습니다.** Fisher–Yates로 교체하세요.
```js
shuffle: (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
},
```

### B2. `shuffle`가 원본 배열을 파괴 (전역 데이터 오염)
`Array.prototype.sort`는 제자리(in-place) 정렬입니다. 그런데 `game.init`에서 `day === 'all'`일 때
`pool = currentRawData;` (복사 아님) 로 둔 뒤 `game.shuffle(pool)`을 호출합니다(L69, L113, L190).
즉 **원본 단어 데이터(`window.rawDataData`)의 순서가 매 판마다 영구적으로 뒤섞입니다.**
지금은 순서가 결과에 영향을 안 줘서 표면화되지 않을 뿐, 잠재적 버그입니다.
`game.shuffle([...pool])`처럼 항상 사본을 셔플하거나, Fisher–Yates를 새 배열에 적용하세요.

### B3. `getDistractors`의 무한 루프 가능성
```js
// game-engine.js:786
while (distractors.length < 3) {
    const emergencyDistractor = game.shuffle([...currentRawData])[0];
    ...
}
```
`rawData`에서 정답과 **다른 고유 값이 3개 미만**이면 이 루프는 절대 3개를 채우지 못하고 무한 반복 →
탭이 멈춥니다. `init`의 `pool.length < 4` 가드(L86)는 "행 개수"만 보고 "고유 단어/뜻 개수"는 보지 않으므로
완전한 방어가 아닙니다. 시도 횟수 상한을 두고, 부족하면 있는 만큼만 반환하도록 바꾸세요.

### B4. 정의되지 않은 스킬 구매 시 `NaN`
```js
// shop.js:131
db.skills[id] += skill.uses;
```
`db.skills` 기본값은 `{ hint: 0, ultimate: 0 }`(database.js:70)뿐입니다.
`hint`/`ultimate` 외의 새 스킬 id를 추가해 구매하면 `undefined += n → NaN`이 되어
저장·표시가 깨집니다. `db.skills[id] = (db.skills[id] || 0) + skill.uses;`로 가드하세요.

### B5. `onclick` 문자열에 데이터 직접 삽입
```js
// shop.js:79
`<button ... onclick="shop.buy('${item.id}', ${item.cost}, '${type}')">`
```
`item.id`에 작은따옴표가 들어가면 핸들러 문자열이 깨지고, 전역 `shop`에 의존하는 구조라
캡슐화도 불가능합니다. `addEventListener` + `dataset`(`data-id`)로 바인딩하세요.
같은 맥락에서 `shop`/`inventory`의 `innerHTML` 템플릿(이름·설명 직접 보간)도 데이터에 `<`,`>`가
섞이면 마크업이 깨집니다 — 외부/사용자 데이터를 받게 되면 XSS 경로가 됩니다.

---

## 🏗️ 구조 / 설계 문제

### S1. 전역 네임스페이스 + 로드 순서 결합 (가장 근본적)
`db`, `game`, `ui`, `shop`, `inventory`, `secret`, `statistics`, `story`, `weapons` … 거의 모든 모듈이
전역 `const`로 노출되고, `index.html`이 `<script>` 26개를 **순서대로** 로드해야만 동작합니다.
한 모듈이 다른 모듈을 직접 전역 이름으로 참조하므로(`ui.updateGold()`, `inventory.unequip()` …)
순서가 어긋나면 조용히 깨집니다. 일관성도 없습니다 — `game-data-loader.js`만 IIFE를 씁니다.
**권장**: `<script type="module">` + `import`/`export`로 전환(로드 순서·전역 오염 동시 해결),
당장 어렵다면 단일 `window.App` 네임스페이스로 묶기.

### S2. `game.init` 과적재 (게임 엔진 1,087줄)
`init` 한 함수가 풀 구성 → 카운트 결정 → 모드별 분기(boss/battle/practice) → 객관·주관 비율 배분 →
"연속 같은 타입 방지" 재셔플 루프 → `setTimeout`으로 화면 전환 → UI 갱신까지 모두 처리합니다.
특히 혼합형은 **번갈아 interleave 한 결과를 다시 `shuffle`로 풀어버린 뒤**(L149-164) 연속 여부를
최대 10회 재시도로 검사하는 우회 로직이라 의도가 모호합니다.
**권장**: `buildPool(day) / pickCount() / assignTypes(pool, type) / interleaveNoRepeat(a, b)`로 분리.
interleave를 하려면 셔플 후 재배치가 아니라 "두 큐를 지퍼처럼 합치는" 결정적 방식이 더 단순합니다.

### S3. `cloneNode`로 리스너 떼어내기 + JS 인라인 스타일
```js
// init.js:97
titlePracticeBtn.onclick = null;
const newBtn = titlePracticeBtn.cloneNode(true);
titlePracticeBtn.parentNode.replaceChild(newBtn, titlePracticeBtn);
freshPracticeBtn.style.zIndex = '25';  // 스타일을 JS로 강제
```
리스너 중복을 막으려 노드를 통째로 교체하는 것은 초기화가 한 번만 보장되지 않는다는 신호입니다.
또 `pointerEvents`/`zIndex`/`cursor`를 JS로 박는데 이는 CSS의 책임입니다. 같은 패턴이
`handleAnswer`/`showCorrectAnswer`에서도 버튼 색·테두리·transform을 인라인으로 설정합니다.
**권장**: 초기화 1회 보장(또는 `AbortController`), 상태는 CSS 클래스 토글(`.is-correct` 등)로.

### S4. 한 글자 단위 micro-save
`db.addGold`/`subGold`/`addStats` 등이 호출될 때마다 `db.save()`가 **localStorage 13개 키 전체를
JSON 직렬화**합니다. 정답 한 번에 골드 가산→save, 통계 가산→save로 중복 저장도 발생합니다.
치명적이진 않지만, 변경분만 저장하거나 프레임 끝에 한 번 flush 하는 편이 깔끔합니다.

---

## ⚠️ UX / 플랫폼 문제

| # | 항목 | 위치 | 설명 |
|---|------|------|------|
| U1 | `alert()` 14곳 | game-engine, shop, database, inventory | 메인 스레드 차단 → 애니메이션·흐름 끊김. 일부는 `location.reload()`로 진행 손실 |
| U2 | `confirm()`으로 강제 새로고침 | game-data-loader:148 | 데이터셋 변경마다 전체 리로드 — 모달/토스트 기반 전환 권장 |
| U3 | `onkeypress` (deprecated) | game-engine:435 | `keydown`으로 교체 |
| U4 | 매 프레임 `getElementById` | startTimer / render 계열 | 타이머 100ms마다 DOM 재조회 — 참조 캐싱 권장 |
| U5 | 첫 글자 생략 정답 처리 | game-engine:472 | 주관식에서 첫 글자 힌트를 빼고 입력해도 정답 — 의도된 동작이면 OK, 아니면 난이도 누수 |

---

## 🔧 위생(housekeeping) 항목

| 항목 | 위치 | 설명 |
|------|------|------|
| 잘못된 `"main"` | package.json:5 | `update-explanations-advanced.js` 미존재 |
| 테스트 없음 | 전체 | `"test"`가 `exit 1` 스텁 |
| 디버그 로그 방치 | 다수(~26회) | `console.log('[game.init] …')` 등 — `DEBUG` 플래그화 |
| 빈 스텁 호출 | modal-manager.js:90 | `adjustSelectFontSize()`가 본문 없음(주석으로 인정) |
| `backup/`, `.DS_Store` 추적 | 루트/`data/` | `.gitignore`로 제외 |
| 주석 언어 혼용 | 전체 | 한/영 혼재 — 통일 |
| 빌드 파이프라인 부재 | index.html | `<script>` 26 + `<link>` 15 개별 로드, minify/번들 없음 |

---

## ✅ 잘한 점 (유지할 것)

- **방어적 코딩**: `typeof x !== 'undefined'` 가드와 `try/catch`로 모듈 누락 시에도 부분 동작.
- **접근성 시도**: 인벤토리 슬롯에 `tabindex` + `Enter/Space` 키 핸들러, 닫기 버튼 `focus`/`scrollIntoView`.
- **모바일 대응**: `--app-height`로 주소창 높이 변동 흡수, 너비 변화만 레이아웃 재계산.
- **decoy 시스템**: `getDecoyWordCandidates`로 "그럴듯한 오답"을 우선 사용해 객관식 변별력 확보(좋은 설계).
- **데이터 마이그레이션**: `v7_*` 키 버전관리 + 전역→단어장별 통계 자동 이관.
- **다중 단어장 로더**: `gameDataName_N` 규칙으로 데이터셋을 동적 탐지하는 확장형 구조.

---

## 📊 평가 요약

| 항목 | 점수 | 비고 |
|------|------|------|
| 정확성 | ⭐⭐ | 셔플 편향(B1), 원본 파괴(B2), 무한루프 가능(B3), NaN(B4) |
| 구조 | ⭐⭐⭐ | 폴더 분리 양호하나 전역 결합·대형 함수 |
| UX | ⭐⭐⭐ | `alert`/`confirm`/강제 reload |
| 성능 | ⭐⭐⭐ | 번들 없음, 과도한 save/DOM 재조회 (체감은 양호) |
| 문서/주석 | ⭐⭐⭐⭐ | `spec.md`와 JSDoc 충실 |

---

## 🚀 권장 처리 순서

1. **버그 먼저**: B1(Fisher–Yates) → B2(사본 셔플) → B3(루프 상한) → B4(`|| 0` 가드). 코드량 대비 효과 큼.
2. **이벤트/스타일 정리**: `onclick` 문자열·`cloneNode`·JS 인라인 스타일 → `addEventListener` + CSS 클래스.
3. **알림 교체**: `alert`/`confirm` → 기존 `modal-manager` 기반 비차단 UI 재사용.
4. **모듈화**: ES Module 전환으로 전역 결합·로드 순서 문제 해소, 이어서 `game.init` 함수 분해.
5. **빌드/위생**: Vite·esbuild 도입, `package.json` 수정, `backup//.DS_Store` 정리, 로그 플래그화.

> **결론**: 학습용 게임으로서 기능 설계(decoy 보기, 단어장 통계, 다중 데이터셋)는 인상적입니다.
> 다만 무작위성 관련 4개 버그는 **결과의 공정성에 직접 영향**을 주므로 우선 고칠 가치가 있고,
> 그다음은 전역 상태/이벤트 관리 정리가 장기 유지보수의 핵심입니다.
