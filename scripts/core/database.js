/**
 * 데이터베이스 관리 시스템
 * localStorage를 사용한 게임 데이터 저장 및 관리
 * - 골드, 아이템, 장비, 통계, 스킬 등 모든 게임 데이터 관리
 */

/**
 * 단어장별 기록의 저장 키를 만든다.
 *
 * 표시 이름(gameDataName_N)이 아니라 **데이터셋 ID**를 키로 쓴다.
 * 이름을 키로 쓰면 `data/game-data-N.js`에서 제목을 한 글자만 고쳐도
 * 그 단어장의 누적 통계와 암기 기록이 통째로 유실된다.
 */
function makeBookKey(dataSetId) {
    return `book-${dataSetId || '1'}`;
}

/** 현재 활성 데이터셋의 저장 키 */
function currentBookKey() {
    const id = typeof window !== 'undefined' ? window.currentGameDataSetId : null;
    return makeBookKey(id);
}

/**
 * 레거시 키(단어장 "이름")를 데이터셋 ID 키로 바꾼다.
 * 이름 → ID 매핑은 로드된 `gameDataName_N` 전역에서 찾고, 실패하면 1번 단어장으로 본다.
 * @param {Object} byName - { '단어장 이름': value } 형태의 기존 저장 객체
 * @param {(a:any,b:any)=>any} merge - 같은 키로 합쳐질 때 값을 병합하는 함수
 * @returns {Object} { 'book-N': value }
 */
function migrateBookKeys(byName, merge) {
    const out = {};
    if (!byName || typeof byName !== 'object') return out;

    const nameToId = {};
    if (typeof window !== 'undefined') {
        for (let i = 1; i <= 10; i++) {
            const name = window[`gameDataName_${i}`];
            if (typeof name === 'string') nameToId[name] = String(i);
        }
    }

    Object.keys(byName).forEach((key) => {
        // 이미 새 형식이면 그대로 통과
        const newKey = /^book-\d+$/.test(key) ? key : makeBookKey(nameToId[key]);
        out[newKey] = newKey in out ? merge(out[newKey], byName[key]) : byName[key];
    });
    return out;
}

const db = {
    // 골드
    gold: parseInt(localStorage.getItem('v7_gold')) || 0,

    // 보유 아이템 ID 목록
    owned: JSON.parse(localStorage.getItem('v7_owned')) || ['basic'],

    // 장착된 무기 (하위 호환성)
    equippedWeapon: localStorage.getItem('v7_equip') || 'basic',

    // 아이템 내구도 { itemId: durability }
    durability: JSON.parse(localStorage.getItem('v7_dura')) || {},

    // 통계 데이터 (단어장별). 형태: { books: { 'book-N': BookStats } }
    stats: (() => {
        const saved = JSON.parse(localStorage.getItem('v7_stats')) || {};

        // [마이그레이션 1] 단어장 구분 없던 시절의 전역 누적치 → 1번 단어장으로 이관
        if (!saved.books) saved.books = {};
        if ((saved.solved > 0 || saved.correct > 0) && !saved.books[makeBookKey('1')]) {
            saved.books[makeBookKey('1')] = {
                solved: saved.solved || 0,
                correct: saved.correct || 0,
                objective: saved.objective || { solved: 0, correct: 0 },
                subjective: saved.subjective || { solved: 0, correct: 0, perfectDays: [] },
                bossMode: saved.bossMode || { bestWave: 0, bestWaveDate: null },
            };
        }

        // [마이그레이션 2] 단어장 "이름" 키 → 데이터셋 ID 키
        saved.books = migrateBookKeys(saved.books, (a, b) => ({
            solved: (a.solved || 0) + (b.solved || 0),
            correct: (a.correct || 0) + (b.correct || 0),
            objective: {
                solved: (a.objective?.solved || 0) + (b.objective?.solved || 0),
                correct: (a.objective?.correct || 0) + (b.objective?.correct || 0),
            },
            subjective: {
                solved: (a.subjective?.solved || 0) + (b.subjective?.solved || 0),
                correct: (a.subjective?.correct || 0) + (b.subjective?.correct || 0),
                perfectDays: [
                    ...(a.subjective?.perfectDays || []),
                    ...(b.subjective?.perfectDays || []),
                ],
            },
            bossMode:
                (a.bossMode?.bestWave || 0) >= (b.bossMode?.bestWave || 0)
                    ? a.bossMode
                    : b.bossMode,
        }));

        // [정리] 레거시 최상위 누적 필드 제거.
        // books[]에 같은 값을 이중으로 쓰면서 읽는 곳은 없었다(표시는 전부 books 기준).
        // 전체 합계가 필요해지면 books를 집계하면 된다.
        delete saved.solved;
        delete saved.correct;
        delete saved.objective;
        delete saved.subjective;
        delete saved.bossMode;

        return saved;
    })(),

    // 인벤토리 아이템 목록
    inventory: JSON.parse(localStorage.getItem('v7_inventory')) || [],

    // 장착된 장비 { slot: itemId }
    equipped: JSON.parse(localStorage.getItem('v7_equipped')) || {},

    // 인벤토리 용량
    inventoryCapacity: parseInt(localStorage.getItem('v7_inventory_capacity')) || 3,

    // 스킬 보유 개수 { hint: count, ultimate: count }
    skills: JSON.parse(localStorage.getItem('v7_skills')) || { hint: 0, ultimate: 0 },

    // 마지막 선택한 Day
    lastSelectedDay: localStorage.getItem('v7_last_day') || 'all',

    // 연습 모드 외운 단어 (단어장별) { 'book-N': ['word|meaning', ...] }
    practiceMemorized: migrateBookKeys(
        JSON.parse(localStorage.getItem('v7_practice_memorized')) || {},
        // 같은 데이터셋으로 합쳐지면 중복 제거 후 병합
        (a, b) => Array.from(new Set([...(a || []), ...(b || [])]))
    ),

    // 설정: 음악 재생, 단어 바로 읽기 (연습 모드 단어 바뀔 때 TTS) - 기본 true
    settings: (() => {
        const raw = localStorage.getItem('v7_settings');
        if (!raw) return { musicPlay: true, wordRead: true };
        const o = JSON.parse(raw);
        return {
            musicPlay: o.musicPlay !== false,
            wordRead: o.wordRead !== false,
        };
    })(),

    // 필드별 localStorage 직렬화 함수 (save에서 선택적으로 호출)
    _writers: {
        gold: () => localStorage.setItem('v7_gold', db.gold),
        owned: () => localStorage.setItem('v7_owned', JSON.stringify(db.owned)),
        equip: () => localStorage.setItem('v7_equip', db.equippedWeapon),
        dura: () => localStorage.setItem('v7_dura', JSON.stringify(db.durability)),
        stats: () => localStorage.setItem('v7_stats', JSON.stringify(db.stats)),
        inventory: () => localStorage.setItem('v7_inventory', JSON.stringify(db.inventory)),
        equipped: () => localStorage.setItem('v7_equipped', JSON.stringify(db.equipped)),
        capacity: () => localStorage.setItem('v7_inventory_capacity', db.inventoryCapacity),
        skills: () => localStorage.setItem('v7_skills', JSON.stringify(db.skills)),
        lastDay: () => localStorage.setItem('v7_last_day', db.lastSelectedDay),
        memorized: () => {
            if (db.practiceMemorized !== undefined) {
                localStorage.setItem('v7_practice_memorized', JSON.stringify(db.practiceMemorized));
            }
        },
        settings: () => {
            if (db.settings !== undefined) {
                localStorage.setItem('v7_settings', JSON.stringify(db.settings));
            }
        },
    },

    /**
     * 데이터를 localStorage에 저장합니다.
     * @param {...string} fields - 저장할 필드명(_writers 키). 생략 시 전체 저장.
     *   핫패스(골드/통계 가산 등)에서는 변경된 키만 넘겨 불필요한 직렬화를 줄입니다.
     */
    save: (...fields) => {
        const keys = fields.length ? fields : Object.keys(db._writers);
        keys.forEach((k) => {
            if (db._writers[k]) db._writers[k]();
        });
        ui.updateGold();
    },

    /**
     * 골드를 추가합니다 (음수 가능)
     * @param {number} n - 추가할 골드 양
     * @returns {number} 업데이트된 총 골드
     */
    addGold: (n) => {
        // 호출자가 음수/양수를 전달할 수 있음; 정수로 강제하고 0 이상으로 제한
        const delta = Number(n) || 0;
        db.gold = Math.max(0, Math.floor(db.gold) + Math.floor(delta));
        db.save('gold');
        return db.gold;
    },

    /**
     * 골드를 차감합니다
     * @param {number} n - 차감할 골드 양
     * @returns {number} 업데이트된 총 골드
     */
    subGold: (n) => {
        // addGold와 동일한 동작 유지
        return db.addGold(-(Number(n) || 0));
    },

    /**
     * 아이템을 보유하고 있는지 확인합니다
     * @param {string} id - 아이템 ID
     * @returns {boolean} 보유 여부
     */
    has: (id) => db.owned.includes(id),

    /**
     * 아이템을 장착합니다
     * @param {string} id - 아이템 ID
     */
    equip: (id) => {
        // 무기 메타데이터를 통해 카테고리/슬롯 규칙을 일관되게 적용
        const w = weapons.find((w) => w.id === id);
        if (!w) {
            db.equippedWeapon = id;
            db.save();
            ui.updateVisuals();
            return;
        }

        // effect 타입이면 hand-2에, weapon 타입이면 hand-1에 장착
        if (w.category === 'effect') {
            // 하나의 effect만 허용
            inventory.unequip('hand-2', true);
            db.equipped['hand-2'] = id;
        } else {
            // weapon 또는 기본 -> 메인 무기 슬롯은 hand-1
            inventory.unequip('hand-1', true);
            db.equipped['hand-1'] = id;
            db.equippedWeapon = id; // 하위 호환성을 위한 multiplier 참조 유지
        }
        db.save();
        ui.updateVisuals();
    },

    /** 현재 활성 데이터셋의 단어장 저장 키 ('book-N') */
    getBookKey: () => currentBookKey(),

    /** 빈 단어장 통계 한 벌 */
    _emptyBookStats: () => ({
        solved: 0,
        correct: 0,
        objective: { solved: 0, correct: 0 },
        subjective: { solved: 0, correct: 0, perfectDays: [] },
        bossMode: { bestWave: 0, bestWaveDate: null },
    }),

    /**
     * 단어장별 통계를 가져옵니다 (없으면 생성). 누락된 하위 필드도 함께 보강합니다.
     * 통계 구조를 아는 유일한 지점이므로, 필드가 늘어나면 여기만 고치면 됩니다.
     * @param {string} [bookKey] - 저장 키. 생략 시 현재 활성 데이터셋.
     * @returns {Object} 단어장 통계 객체 (db.stats.books에 연결된 실제 객체)
     */
    getBookStats: (bookKey) => {
        if (!db.stats.books) db.stats.books = {};
        const key = bookKey || currentBookKey();
        if (!db.stats.books[key]) db.stats.books[key] = db._emptyBookStats();

        const s = db.stats.books[key];
        if (!s.objective) s.objective = { solved: 0, correct: 0 };
        if (!s.subjective) s.subjective = { solved: 0, correct: 0, perfectDays: [] };
        if (!s.subjective.perfectDays) s.subjective.perfectDays = [];
        if (!s.bossMode) s.bossMode = { bestWave: 0, bestWaveDate: null };
        return s;
    },

    /**
     * 통계를 추가합니다
     * @param {boolean} isCorrect - 정답 여부
     * @param {string} questionType - 문제 타입 ('objective' 또는 'subjective')
     */
    addStats: (isCorrect, questionType = 'objective') => {
        const bookStats = db.getBookStats();

        bookStats.solved++;
        if (isCorrect) bookStats.correct++;

        if (!bookStats[questionType]) {
            bookStats[questionType] = { solved: 0, correct: 0 };
        }
        bookStats[questionType].solved++;
        if (isCorrect) bookStats[questionType].correct++;

        db.save('stats');
    },

    /**
     * 보스 모드 최고 wave 기록을 갱신합니다 (기존 기록보다 높을 때만).
     * @param {number} wave - 이번 판에서 도달한 wave
     * @returns {boolean} 갱신 여부
     */
    recordBossWave: (wave) => {
        if (!(wave > 0)) return false;
        const bossMode = db.getBookStats().bossMode;
        if (wave <= bossMode.bestWave) return false;

        const today = new Date();
        bossMode.bestWave = wave;
        bossMode.bestWaveDate = {
            date: db._todayISO(today),
            displayDate: db._todayDisplay(today),
        };
        db.save('stats');
        return true;
    },

    /**
     * 주관식을 전부 맞힌 Day를 기록합니다 (같은 Day는 최신 날짜로 갱신).
     * @param {string|number} day - Day 값 ('all' | 'boss' | 숫자)
     * @param {string} dayLabel - 표시용 라벨
     */
    recordPerfectDay: (day, dayLabel) => {
        const subjective = db.getBookStats().subjective;
        const today = new Date();
        const entry = {
            date: db._todayISO(today),
            displayDate: db._todayDisplay(today),
            day: day,
            dayLabel: dayLabel,
        };

        const existing = subjective.perfectDays.findIndex((d) => d.day === day);
        if (existing === -1) {
            subjective.perfectDays.push(entry);
        } else {
            subjective.perfectDays[existing].date = entry.date;
            subjective.perfectDays[existing].displayDate = entry.displayDate;
        }

        // 날짜순 정렬 (최신이 마지막)
        subjective.perfectDays.sort((a, b) => a.date.localeCompare(b.date));
        db.save('stats');
    },

    /** 저장용 날짜 문자열 (YYYY-MM-DD, 로컬 기준) */
    _todayISO: (d = new Date()) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    },

    /** 표시용 날짜 문자열 */
    _todayDisplay: (d = new Date()) =>
        d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),

    /**
     * 아이템을 사용합니다 (내구도 감소)
     * @param {string} id - 아이템 ID
     */
    useItem: (id) => {
        if (db.durability[id]) {
            db.durability[id]--;
            if (db.durability[id] <= 0) {
                delete db.durability[id];
                db.owned = db.owned.filter((x) => x !== id);
                showToast(
                    `[${id === 'goldGlove' ? '황금 장갑' : '아이템'}]이 파괴되었습니다!`,
                    'warn'
                );
            }
            db.save('dura', 'owned');
            ui.updateSkills(); // 황금장갑이 skill bar에 표시되므로
        }
    },
};
