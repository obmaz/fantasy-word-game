/**
 * 단어 데이터 로더
 *
 * 주의: `dayInfo`는 `dayCatalog`로 통합되었습니다 (단일 진실 공급원).
 * 기존 Day별 레이블은 `dayCatalog`로 마이그레이션되었습니다.
 * 하위 호환성을 위해 `dayInfo` 뷰가 `dayCatalog`에서 파생됩니다.
 *
 * 외부 JSON 파일에서 데이터를 로드합니다 (CORS 문제 방지를 위해 JavaScript 변수로 래핑)
 * 데이터 파일이 로드되지 않으면 빈 fallback 사용
 * game-data-loader.js가 먼저 로드되어 window.storiesData를 설정해야 함
 */
const stories = typeof window !== 'undefined' && window.storiesData ? window.storiesData : {};
console.log(
    '[words.js] stories loaded:',
    typeof stories,
    stories ? Object.keys(stories).length : 0,
    'keys'
);

// 표준 dayCatalog — Day 레이블 및 스토리 객체를 위한 단일 진실 공급원 (Single Source of Truth)
const dayCatalog = (function () {
    const c = {};
    // 레이블과 스토리 내용을 위해 명시적인 `stories` 항목 선호
    if (typeof stories !== 'undefined' && stories && Object.keys(stories).length > 0) {
        Object.keys(stories).forEach((k) => {
            // 숫자 문자열 키 처리 (JavaScript 객체 키는 항상 문자열)
            if (!isNaN(Number(k))) {
                const s = stories[k];
                const label = s && s.title ? `Day ${k} (${s.title})` : `Day ${k}`;
                c[k] = { label, story: s || null };
            }
        });
    }

    // 참고: `rawData`의 커버리지는 `dayCatalog.validateCoverage()`에 의해
    // 나중에 의도적으로 적용됩니다. 초기화 전 `rawData` 참조를 방지하기 위함입니다.
    // (TDZ / 런타임 ReferenceError 방지)

    // 표준 카탈로그에 'all'과 'boss'가 존재하는지 확인
    c.all = {
        label: stories && stories.all && stories.all.title ? stories.all.title : '배틀 모드',
        story: stories && stories.all ? stories.all : null,
    };
    c.boss = {
        label:
            stories && stories.boss && stories.boss.title
                ? stories.boss.title
                : '무한의 전장 (Boss Mode)',
        story: stories && stories.boss ? stories.boss : null,
    };
    console.log('[words.js] dayCatalog created:', Object.keys(c).length, 'entries');
    return c;
})();

// 파생된 뷰 (기존 전역 변수를 다시 선언하지 않음)
const derivedDayInfo = Object.fromEntries(
    Object.entries(dayCatalog)
        .filter(([k]) => !isNaN(Number(k)))
        .map(([k, v]) => [k, v.label])
);
const derivedStories = Object.fromEntries(Object.entries(dayCatalog).map(([k, v]) => [k, v.story]));
// 참고: `dayCatalog`가 이제 단일 진실 공급원입니다. 기존 전역 변수를 비파괴적으로 노출하여
// 기존 코드 경로가 계속 작동하도록 합니다 (이미 존재하는 경우 덮어쓰지 않음).
// 레거시 접근자 (DEPRECATED): 하위 호환 뷰를 노출하지만 경고를 한 번 표시하고 `dayCatalog`로 전달합니다.
(function () {
    const WARN = (k) => () => {
        console.warn(
            `[deprecated] window.${k} is deprecated — use dayCatalog (single source-of-truth)`
        );
    };
    if (typeof window !== 'undefined') {
        if (!Object.prototype.hasOwnProperty.call(window, 'dayInfo')) {
            Object.defineProperty(window, 'dayInfo', {
                configurable: true,
                get: function () {
                    if (!this.___warned_dayInfo) {
                        WARN('dayInfo')();
                        this.___warned_dayInfo = true;
                    }
                    return Object.assign({}, derivedDayInfo);
                },
            });
        }
        if (!Object.prototype.hasOwnProperty.call(window, 'stories')) {
            Object.defineProperty(window, 'stories', {
                configurable: true,
                get: function () {
                    if (!this.___warned_stories) {
                        WARN('stories')();
                        this.___warned_stories = true;
                    }
                    return Object.assign({}, derivedStories);
                },
            });
        }
    }
})();

// 런타임 검증기: rawData days와 dayCatalog를 비교하고 (선택적으로) 경량 플레이스홀더를 자동 채움
// - 스크립트 로드 후 호출 안전 (정의 시점에 자동 실행되지 않음)
// - UI가 'all'로 대체되는 것을 방지하기 위해 비파괴적 플레이스홀더 추가
if (typeof dayCatalog.validateCoverage === 'undefined') {
    dayCatalog.validateCoverage = function (opts = {}) {
        try {
            if (typeof rawData === 'undefined') {
                console.info(
                    '[dayCatalog.validateCoverage] rawData not yet defined — call after load.'
                );
                return;
            }
            const dataDays = Array.from(
                new Set(rawData.map((r) => Number(r.day)).filter((n) => !isNaN(n)))
            ).sort((a, b) => a - b);
            const catalogDays = Object.keys(dayCatalog)
                .filter((k) => !isNaN(Number(k)))
                .map(Number)
                .sort((a, b) => a - b);
            const missing = dataDays.filter((d) => catalogDays.indexOf(d) === -1);
            if (missing.length) {
                console.warn(
                    '[dayCatalog.validate] rawData contains days not present in dayCatalog:',
                    missing
                );
                // 비파괴적 자동 채우기: UI가 'all'로 대체되는 대신 합리적인 레이블을 표시하도록 함
                missing.forEach(function (d) {
                    if (!dayCatalog[d]) {
                        dayCatalog[d] = { label: `Day ${d}`, story: null };
                        console.info('[dayCatalog.validate] added placeholder for Day', d);
                    }
                });
            }
            const orphan = catalogDays.filter(function (d) {
                return dataDays.indexOf(d) === -1;
            });
            if (orphan.length)
                console.info(
                    '[dayCatalog.validate] dayCatalog에 rawData가 없는 Day가 포함됨 (플레이스홀더 예상):',
                    orphan
                );
        } catch (err) {
            console.error('[dayCatalog.validateCoverage] error', err);
        }
    };
}

// data-loader.js가 먼저 로드되어 window.rawDataData를 설정해야 함 (rawData_1 또는 rawData_2에서 로드됨)
const rawData = typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : [];
console.log('[words.js] rawData loaded:', rawData ? rawData.length : 0, 'items');

// ============================================================
// 유사 단어 그룹 기반 decoy (추천 방식)
//
// - 목표: "어떤 단어가 어떤 단어랑 유사한지"를 코드가 알 수 있도록
//         데이터에 '유사 단어 그룹(집합)'을 정의하고, 그 그룹에서 보기를 우선 뽑는다.
// - 방식: window.decoyWordsSet = [ [ 'machine', 'magazine' ], ... ] 처럼
//         (day 개념 없이) 유사한 단어들을 같은 배열(집합)로 묶는다.
// - 운영: 새 단어장이 추가될 때, 유사 보기가 필요한 단어만 그룹에 점진적으로 추가하면 됨.
// - 안정성: 그룹에 매핑이 없으면 기존 로직(랜덤 distractor)으로 fallback.
// ============================================================

function __normDecoyKey(v) {
    return String(v || '')
        .trim()
        .toLowerCase();
}

// 모든 단어장이 공유하는 decoyWordsSet 사용 (없으면 빈 배열)
const decoyWordGroups = (function () {
    if (typeof window === 'undefined') return [];
    return window.decoyWordsSet || [];
})();

// 그룹을 빠르게 조회할 수 있도록 인덱스(단어 -> 같은 그룹의 다른 단어들) 생성
const __decoyWordIndex = (function () {
    const idx = new Map(); // key(lower) -> Set(original word)
    if (!Array.isArray(decoyWordGroups)) return idx;

    decoyWordGroups.forEach((group) => {
        if (!Array.isArray(group)) return;
        const cleaned = group.map((w) => (typeof w === 'string' ? w.trim() : '')).filter((w) => w);
        if (cleaned.length < 2) return;

        cleaned.forEach((w) => {
            const k = __normDecoyKey(w);
            if (!k) return;
            const s = idx.get(k) || new Set();
            cleaned.forEach((other) => {
                if (__normDecoyKey(other) !== k) s.add(other);
            });
            idx.set(k, s);
        });
    });

    return idx;
})();

// 전역 helper로 노출 (init.js에서 사용)
if (typeof window !== 'undefined' && typeof window.getDecoyWordCandidates !== 'function') {
    window.getDecoyWordCandidates = function (word) {
        const k = __normDecoyKey(word);
        const s = __decoyWordIndex.get(k);
        return s ? Array.from(s) : [];
    };
}
