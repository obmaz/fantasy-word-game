// NOTE: `dayInfo` has been consolidated into `dayCatalog` (single source-of-truth).
// The original per-day labels were migrated into `dayCatalog` — see the canonical builder below.
// For backward compatibility a lightweight `dayInfo` view is derived from `dayCatalog` further down.

// Load data from external JSON files (wrapped as JavaScript variables to avoid CORS issues)
// If data files are not loaded, use empty fallback
// data-loader.js가 먼저 로드되어 window.storiesData를 설정해야 함
const stories = typeof window !== 'undefined' && window.storiesData ? window.storiesData : {};
console.log(
    '[words.js] stories loaded:',
    typeof stories,
    stories ? Object.keys(stories).length : 0,
    'keys'
);

// canonical dayCatalog — single source-of-truth for day labels + story objects
const dayCatalog = (function () {
    const c = {};
    // Prefer explicit `stories` entries for label + story content
    if (typeof stories !== 'undefined' && stories && Object.keys(stories).length > 0) {
        Object.keys(stories).forEach((k) => {
            // Handle numeric string keys (JavaScript object keys are always strings)
            if (!isNaN(Number(k))) {
                const s = stories[k];
                const label = s && s.title ? `Day ${k} (${s.title})` : `Day ${k}`;
                c[k] = { label, story: s || null };
            }
        });
    }

    // NOTE: coverage from `rawData` is intentionally applied later by
    // `dayCatalog.validateCoverage()` to avoid referencing `rawData` before
    // it is initialized (prevents TDZ / runtime ReferenceError).

    // ensure 'all' and 'boss' are present in the canonical catalog
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

// derived views (do NOT redeclare existing globals)
const derivedDayInfo = Object.fromEntries(
    Object.entries(dayCatalog)
        .filter(([k]) => !isNaN(Number(k)))
        .map(([k, v]) => [k, v.label])
);
const derivedStories = Object.fromEntries(Object.entries(dayCatalog).map(([k, v]) => [k, v.story]));
// NOTE: `dayCatalog` is now the single source-of-truth. Expose legacy globals NON-DESTRUCTIVELY
// so existing codepaths continue to work (do not overwrite if already present).
// Legacy accessors (DEPRECATED): expose backward-compatible views but warn once and forward to `dayCatalog`.
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

// runtime validator: compares rawData days → dayCatalog and (optionally) auto-fills lightweight placeholders
// - safe to call after scripts load (does not run automatically at define-time)
// - adds non-destructive placeholders to avoid UI falling back to 'all'
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
                // non-destructive auto-fill so UI shows a sensible label instead of falling back to 'all'
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
                    '[dayCatalog.validate] dayCatalog contains days with no rawData (expected placeholders):',
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

// 전역 helper로 노출 (app.js에서 사용)
if (typeof window !== 'undefined' && typeof window.getDecoyWordCandidates !== 'function') {
    window.getDecoyWordCandidates = function (word) {
        const k = __normDecoyKey(word);
        const s = __decoyWordIndex.get(k);
        return s ? Array.from(s) : [];
    };
}
