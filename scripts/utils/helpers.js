/**
 * 유틸리티 함수 모음
 * 프로젝트 전반에서 사용되는 공통 헬퍼 함수들
 *
 * IIFE로 캡슐화: 내부 전용(pickRandom, monsterAssets)은 전역에 노출하지 않고,
 * 다른 모듈/HTML이 참조하는 함수만 window에 명시적으로 노출합니다.
 */
(function () {
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
                    pickRandom(
                        monsterAssets.boss.length ? monsterAssets.boss : monsterAssets.normal
                    ) || monsterAssets.fallback
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
        const catalog = typeof dayCatalog !== 'undefined' ? dayCatalog : null;

        // dayCatalog에 항목이 있으면 그대로 사용 ('boss'/'all'도 동일 경로로 처리됨)
        const entry = catalog && catalog[day];
        if (entry && entry.story) return entry.story;

        // 없으면 <option> 텍스트에서 제목 추출해 최소 형태를 합성
        const opt = document.querySelector(`#day-select option[value="${day}"]`);
        const allStory = (catalog && catalog['all'] && catalog['all'].story) || null;
        const optText = opt
            ? opt.textContent
            : day === 'all'
              ? catalog && catalog['all'] && catalog['all'].label
              : `Day ${day}`;

        return {
            title: optText,
            intro: `선택한 지역 — ${optText}`,
            win: (allStory && allStory.win) || '',
            lose: (allStory && allStory.lose) || '',
        };
    }

    /** TTS 재생 시 사용할 음성: Google 계열(en-US) 우선, 없으면 en-US, 그다음 en-* */
    function getPreferredTTSVoice() {
        const synth = window.speechSynthesis;
        if (!synth || typeof synth.getVoices !== 'function') return null;
        let voices = synth.getVoices();
        if (!voices.length) return null;
        const enVoices = voices.filter((v) => v.lang.startsWith('en'));
        if (!enVoices.length) return voices[0] || null;
        const google = enVoices.find((v) => /Google/i.test(v.name));
        if (google) return google;
        const enUS = enVoices.find((v) => v.lang === 'en-US');
        if (enUS) return enUS;
        return enVoices[0];
    }

    /**
     * Google Translate TTS API를 사용한 오디오 재생 (Fallback)
     * @param {string} text - 재생할 텍스트
     * @param {string} lang - 언어 코드 (기본: en)
     */
    function playGoogleTTS(text, lang = 'en') {
        if (!text) return;
        try {
            const audio = new Audio();
            // Google TTS URL (unofficial but widely used for simple fallbacks)
            // client=tw-ob is commonly used for this purpose.
            audio.src = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
            audio.play().catch((e) => console.warn('Google TTS playback failed:', e));
        } catch (err) {
            console.error('playGoogleTTS error:', err);
        }
    }

    // 다른 모듈/HTML이 참조하는 공개 API만 전역 노출 (pickRandom, monsterAssets는 내부 전용)
    window.pickMonsterSprite = pickMonsterSprite;
    window.resolveStoryData = resolveStoryData;
    window.getPreferredTTSVoice = getPreferredTTSVoice;
    window.playGoogleTTS = playGoogleTTS;
})();
