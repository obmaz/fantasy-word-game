/**
 * 유틸리티 함수 모음
 * 프로젝트 전반에서 사용되는 공통 헬퍼 함수들
 */

/**
 * 배열에서 무작위로 하나의 요소를 선택합니다
 * @param {Array} arr - 선택할 배열
 * @returns {*} 무작위로 선택된 요소
 */
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 몬스터 이미지 에셋 정의
 */
const monsterAssets = {
    normal: [
        'images/battle_mode/monster_1.webp',
        'images/battle_mode/monster_2.webp',
        'images/battle_mode/monster_3.webp',
    ],
    boss: [
        'images/battle_mode/monster_1.webp',
        'images/battle_mode/monster_2.webp',
        'images/battle_mode/monster_3.webp',
    ],
    byDay: {
        // Day별 특정 몬스터 매핑 (필요시 추가)
        // 예: '5': ['images/battle_mode/monster_1.webp', 'images/battle_mode/monster_2.webp']
    },
    fallback: 'images/battle_mode/monster_1.webp',
};

/**
 * 문제 또는 Day에 맞는 몬스터 스프라이트를 선택합니다
 * @param {Object|string|number} q - 문제 객체 또는 Day 값
 * @param {boolean} isBoss - 보스 몬스터 여부
 * @returns {string} 몬스터 이미지 경로
 */
function pickMonsterSprite(q, isBoss) {
    try {
        // q는 문제 객체이거나 day 문자열/숫자일 수 있음
        const day =
            q && q.day
                ? String(q.day)
                : typeof q === 'string' || typeof q === 'number'
                  ? String(q)
                  : null;

        // Day별 특정 스프라이트가 있으면 우선 사용
        if (day && monsterAssets.byDay[day] && monsterAssets.byDay[day].length) {
            return pickRandom(monsterAssets.byDay[day]);
        }

        // 보스 vs 일반 몬스터
        if (isBoss) {
            return (
                pickRandom(monsterAssets.boss.length ? monsterAssets.boss : monsterAssets.normal) ||
                monsterAssets.fallback
            );
        }
        return pickRandom(monsterAssets.normal) || monsterAssets.fallback;
    } catch (err) {
        console.error('pickMonsterSprite 에러:', err);
        return monsterAssets.fallback;
    }
}

/**
 * 주어진 Day의 스토리 데이터를 해석합니다
 * 특정 항목이 없으면 <option> 텍스트를 제목으로 사용하여
 * UI가 사용자 선택을 반영하도록 합니다
 * @param {string|number} day - Day 값
 * @returns {Object} 스토리 데이터 객체
 */
function resolveStoryData(day) {
    // dayCatalog에서 우선 검색
    if (typeof dayCatalog !== 'undefined' && dayCatalog[day] && dayCatalog[day].story)
        return dayCatalog[day].story;
    if (day === 'boss')
        return (dayCatalog && dayCatalog['boss'] && dayCatalog['boss'].story) || null;
    const s = dayCatalog && dayCatalog[day] && dayCatalog[day].story ? dayCatalog[day].story : null;
    if (s) return s;

    // 없으면 <option> 텍스트에서 제목 추출
    const opt = document.querySelector(`#day-select option[value="${day}"]`);
    const optText = opt
        ? opt.textContent
        : day === 'all'
          ? dayCatalog && dayCatalog['all'] && dayCatalog['all'].label
          : `Day ${day}`;
    return {
        title: optText,
        intro: `선택한 지역 — ${optText}`,
        win:
            (dayCatalog &&
                dayCatalog['all'] &&
                dayCatalog['all'].story &&
                dayCatalog['all'].story.win) ||
            '',
        lose:
            (dayCatalog &&
                dayCatalog['all'] &&
                dayCatalog['all'].story &&
                dayCatalog['all'].story.lose) ||
            '',
    };
}
