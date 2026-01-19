// NOTE: `dayInfo` has been consolidated into `dayCatalog` (single source-of-truth).
// The original per-day labels were migrated into `dayCatalog` — see the canonical builder below.
// For backward compatibility a lightweight `dayInfo` view is derived from `dayCatalog` further down.

// Load data from external JSON files (wrapped as JavaScript variables to avoid CORS issues)
// If data files are not loaded, use empty fallback
const stories = typeof window !== 'undefined' && window.storiesData ? window.storiesData : {};
console.log('[words.js] stories loaded:', typeof stories, stories ? Object.keys(stories).length : 0, 'keys');

// canonical dayCatalog — single source-of-truth for day labels + story objects
const dayCatalog = (function () {
  const c = {};
  // Prefer explicit `stories` entries for label + story content
  if (typeof stories !== 'undefined' && stories && Object.keys(stories).length > 0) {
    Object.keys(stories).forEach(k => {
      // Handle numeric string keys (JavaScript object keys are always strings)
      if (!isNaN(Number(k))) {
        const s = stories[k];
        const label = (s && s.title) ? `Day ${k} (${s.title})` : `Day ${k}`;
        c[k] = { label, story: s || null };
      }
    });
  }

  // NOTE: coverage from `rawData` is intentionally applied later by
  // `dayCatalog.validateCoverage()` to avoid referencing `rawData` before
  // it is initialized (prevents TDZ / runtime ReferenceError).

  // ensure 'all' and 'rush' are present in the canonical catalog
  c.all = { label: (stories && stories.all && stories.all.title) ? stories.all.title : '혼돈의 균열', story: (stories && stories.all) ? stories.all : null };
  c.rush = { label: (stories && stories.rush && stories.rush.title) ? stories.rush.title : '무한의 전장 (Boss Rush)', story: (stories && stories.rush) ? stories.rush : null };
  console.log('[words.js] dayCatalog created:', Object.keys(c).length, 'entries');
  return c;
})();

// derived views (do NOT redeclare existing globals)
const derivedDayInfo = Object.fromEntries(Object.entries(dayCatalog).filter(([k]) => !isNaN(Number(k))).map(([k, v]) => [k, v.label]));
const derivedStories = Object.fromEntries(Object.entries(dayCatalog).map(([k, v]) => [k, v.story]));
// NOTE: `dayCatalog` is now the single source-of-truth. Expose legacy globals NON-DESTRUCTIVELY
// so existing codepaths continue to work (do not overwrite if already present).
// Legacy accessors (DEPRECATED): expose backward-compatible views but warn once and forward to `dayCatalog`.
(function () {
  const WARN = (k) => () => { console.warn(`[deprecated] window.${k} is deprecated — use dayCatalog (single source-of-truth)`); };
  if (typeof window !== 'undefined') {
    if (!Object.prototype.hasOwnProperty.call(window, 'dayInfo')) {
      Object.defineProperty(window, 'dayInfo', {
        configurable: true,
        get: function () { if (!this.___warned_dayInfo) { WARN('dayInfo')(); this.___warned_dayInfo = true; } return Object.assign({}, derivedDayInfo); }
      });
    }
    if (!Object.prototype.hasOwnProperty.call(window, 'stories')) {
      Object.defineProperty(window, 'stories', {
        configurable: true,
        get: function () { if (!this.___warned_stories) { WARN('stories')(); this.___warned_stories = true; } return Object.assign({}, derivedStories); }
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
        console.info('[dayCatalog.validateCoverage] rawData not yet defined — call after load.');
        return;
      }
      const dataDays = Array.from(new Set(rawData.map(r => Number(r.day)).filter(n => !isNaN(n)))).sort((a, b) => a - b);
      const catalogDays = Object.keys(dayCatalog).filter(k => !isNaN(Number(k))).map(Number).sort((a, b) => a - b);
      const missing = dataDays.filter(d => catalogDays.indexOf(d) === -1);
      if (missing.length) {
        console.warn('[dayCatalog.validate] rawData contains days not present in dayCatalog:', missing);
        // non-destructive auto-fill so UI shows a sensible label instead of falling back to 'all'
        missing.forEach(function (d) {
          if (!dayCatalog[d]) {
            dayCatalog[d] = { label: `Day ${d}`, story: null };
            console.info('[dayCatalog.validate] added placeholder for Day', d);
          }
        });
      }
      const orphan = catalogDays.filter(function (d) { return dataDays.indexOf(d) === -1; });
      if (orphan.length) console.info('[dayCatalog.validate] dayCatalog contains days with no rawData (expected placeholders):', orphan);
    } catch (err) {
      console.error('[dayCatalog.validateCoverage] error', err);
    }
  };
}

const rawData = typeof window !== 'undefined' && window.rawDataData ? window.rawDataData : [];

const decoyWords = typeof window !== 'undefined' && window.decoyWordsData ? window.decoyWordsData : [];