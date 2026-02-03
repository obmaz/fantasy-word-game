/**
 * 데이터베이스 관리 시스템
 * localStorage를 사용한 게임 데이터 저장 및 관리
 * - 골드, 아이템, 장비, 통계, 스킬 등 모든 게임 데이터 관리
 */

const db = {
    // 골드
    gold: parseInt(localStorage.getItem('v7_gold')) || 0,

    // 보유 아이템 ID 목록
    owned: JSON.parse(localStorage.getItem('v7_owned')) || ['basic'],

    // 장착된 무기 (하위 호환성)
    equippedWeapon: localStorage.getItem('v7_equip') || 'basic',

    // 아이템 내구도 { itemId: durability }
    durability: JSON.parse(localStorage.getItem('v7_dura')) || {},

    // 통계 데이터 (단어장별)
    stats: (() => {
        const saved = JSON.parse(localStorage.getItem('v7_stats')) || { solved: 0, correct: 0 };

        // 단어장별 통계 구조로 마이그레이션
        if (!saved.books) {
            saved.books = {};
        }

        // 기존 전역 통계를 기본 단어장으로 마이그레이션 (호환성)
        if (saved.solved > 0 || saved.correct > 0) {
            const defaultBook = '기본 단어장';
            if (!saved.books[defaultBook]) {
                saved.books[defaultBook] = {
                    solved: saved.solved || 0,
                    correct: saved.correct || 0,
                    objective: saved.objective || { solved: 0, correct: 0 },
                    subjective: saved.subjective || { solved: 0, correct: 0, perfectDays: [] },
                    bossMode: saved.bossMode || { bestWave: 0, bestWaveDate: null },
                };
            }
        }

        // 기존 데이터와의 호환성: objective/subjective 필드가 없으면 추가
        if (!saved.objective) {
            saved.objective = { solved: 0, correct: 0 };
        }
        if (!saved.subjective) {
            saved.subjective = { solved: 0, correct: 0, perfectDays: [] };
        }
        if (!saved.subjective.perfectDays) {
            saved.subjective.perfectDays = [];
        }
        // 보스 모드 최고 wave 기록 초기화
        if (!saved.bossMode) {
            saved.bossMode = { bestWave: 0, bestWaveDate: null };
        }
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

    // 연습 모드 외운 단어 (단어장별) { bookName: ['word|meaning', ...] }
    practiceMemorized: JSON.parse(localStorage.getItem('v7_practice_memorized')) || {},

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

    /**
     * 모든 데이터를 localStorage에 저장합니다
     */
    save: () => {
        localStorage.setItem('v7_gold', db.gold);
        localStorage.setItem('v7_owned', JSON.stringify(db.owned));
        localStorage.setItem('v7_equip', db.equippedWeapon);
        localStorage.setItem('v7_dura', JSON.stringify(db.durability));
        localStorage.setItem('v7_stats', JSON.stringify(db.stats));
        localStorage.setItem('v7_inventory', JSON.stringify(db.inventory));
        localStorage.setItem('v7_equipped', JSON.stringify(db.equipped));
        localStorage.setItem('v7_inventory_capacity', db.inventoryCapacity);
        localStorage.setItem('v7_skills', JSON.stringify(db.skills));
        localStorage.setItem('v7_last_day', db.lastSelectedDay);
        if (db.practiceMemorized !== undefined) {
            localStorage.setItem('v7_practice_memorized', JSON.stringify(db.practiceMemorized));
        }
        if (db.settings !== undefined) {
            localStorage.setItem('v7_settings', JSON.stringify(db.settings));
        }
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
        db.save();
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

    /**
     * 통계를 추가합니다
     * @param {boolean} isCorrect - 정답 여부
     * @param {string} questionType - 문제 타입 ('objective' 또는 'subjective')
     */
    addStats: (isCorrect, questionType = 'objective') => {
        // 현재 단어장 정보 가져오기
        const bookName =
            typeof window !== 'undefined' && window.currentGameDataName
                ? window.currentGameDataName
                : '기본 단어장';

        // 단어장별 통계 초기화
        if (!db.stats.books) {
            db.stats.books = {};
        }
        if (!db.stats.books[bookName]) {
            db.stats.books[bookName] = {
                solved: 0,
                correct: 0,
                objective: { solved: 0, correct: 0 },
                subjective: { solved: 0, correct: 0, perfectDays: [] },
                bossMode: { bestWave: 0, bestWaveDate: null },
            };
        }

        // 단어장별 통계 업데이트
        const bookStats = db.stats.books[bookName];
        bookStats.solved++;
        if (isCorrect) bookStats.correct++;

        // 문제 타입별 통계 추가
        if (!bookStats[questionType]) {
            bookStats[questionType] = { solved: 0, correct: 0 };
        }
        bookStats[questionType].solved++;
        if (isCorrect) {
            bookStats[questionType].correct++;
            if (questionType === 'subjective') {
                // db.checkAndUnlockMusic(bookName); // 음악 언락 시스템 제거
            }
        }

        // 기존 전역 통계도 유지 (호환성)
        db.stats.solved++;
        if (isCorrect) db.stats.correct++;
        if (!db.stats[questionType]) {
            db.stats[questionType] = { solved: 0, correct: 0 };
        }
        db.stats[questionType].solved++;
        if (isCorrect) {
            db.stats[questionType].correct++;
        }

        db.save();
    },

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
                alert(`[${id === 'goldGlove' ? '황금 장갑' : '아이템'}]이 파괴되었습니다!`);
            }
            db.save();
            ui.updateSkills(); // 황금장갑이 skill bar에 표시되므로
        }
    },
};
