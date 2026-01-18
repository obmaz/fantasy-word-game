// NOTE: `dayInfo` has been consolidated into `dayCatalog` (single source-of-truth).
// The original per-day labels were migrated into `dayCatalog` — see the canonical builder below.
// For backward compatibility a lightweight `dayInfo` view is derived from `dayCatalog` further down.

const stories = {
  1: { title: "시작의 평원", intro: "잔잔한 풀밭과 따뜻한 햇살이 있는 평화로운 시작 지역입니다.\n여기서 모험의 기초를 배우게 됩니다.", win: "첫 시련을 통과했습니다. 앞으로의 여정이 기대됩니다.", lose: "초반의 실수로 물러났습니다. 다시 준비해 도전하세요." },
  2: { title: "행복의 언덕", intro: "웃음이 넘치는 언덕.\n여기서 사람들은 작은 퀘스트를 통해 보상을 얻습니다.", win: "마을 사람들의 환호를 받았습니다.", lose: "언덕의 경사에 밀려 패배했습니다." },
  3: { title: "지혜의 도시", intro: "지식의 도시로 가는 길.\n수수께끼를 풀어야 문이 열립니다.", win: "수수께끼를 풀고 보상을 얻었습니다.", lose: "문을 열지 못하고 패배했습니다." },
  4: { title: "꽃의 정원", intro: "향기로운 정원에서 꽃의 정령들과 조우합니다.", win: "정령들과 화해하여 길을 얻었습니다.", lose: "정령들의 힘에 눌려 후퇴했습니다." },
  5: { title: "비 내리는 호수", intro: "부슬비가 내리는 고요한 호수.\n수상한 존재가 수면 아래에 숨어있습니다.", win: "수상한 존재를 쫓아내고 평화를 회복했습니다.", lose: "호수의 함정에 걸려 패배했습니다." },
  6: { title: "조용한 마을", intro: "겉보기엔 평온하지만 비밀이 숨어있는 마을입니다.", win: "진실을 밝혀내고 마을을 구했습니다.", lose: "비밀에 휘말려 참패했습니다." },
  7: { title: "속삭이는 숲", intro: "나무들이 속삭이는 신비한 숲.\n길을 잃지 않도록 주의하세요.", win: "숲의 수호자와 화해했습니다.", lose: "길을 잃고 탈출에 실패했습니다." },
  8: { title: "눈 덮인 산", intro: "눈보라가 거센 산.\n추위를 견디며 정상으로 향하세요.", win: "정상에서 영광을 얻었습니다.", lose: "혹한에 쓰러졌습니다." },
  9: { title: "별빛 극장", intro: "별들이 내려앉은 야외 극장.\n퍼즐과 연관된 적들이 나타납니다.", win: "무대를 지키고 승리했습니다.", lose: "공연은 실패로 끝났습니다." },
  10: { title: "음악의 계곡", intro: "리듬에 맞춰 싸우는 계곡입니다.", win: "완벽한 리듬으로 적을 제압했습니다.", lose: "리듬을 놓쳐 패배했습니다." },
  11: { title: "바람의 언덕", intro: "강한 바람이 특징인 지형입니다.", win: "바람을 이용해 승리했습니다.", lose: "바람에 밀려 실패했습니다." },
  12: { title: "분노의 하늘", intro: "천둥과 번개가 치는 위험한 하늘 길.", win: "폭풍을 이겨냈습니다.", lose: "번개를 맞아 쓰러졌습니다." },
  13: { title: "시간의 나라", intro: "시간이 왜곡되는 땅.\n과거의 적과 마주칠 수 있습니다.", win: "시간의 수수께끼를 풀고 승리했습니다.", lose: "시간의 함정에 빠졌습니다." },
  14: { title: "구름의 바다", intro: "구름 위를 걷는 듯한 이국적인 장소입니다.", win: "구름의 수호자를 물리쳤습니다.", lose: "구름 속으로 떨어졌습니다." },
  15: { title: "잠자는 숲", intro: "잠들어 있는 거대한 생물이 있는 숲.", win: "소환수를 제압하고 통과했습니다.", lose: "잠들어 있던 존재에 의해 패배했습니다." },
  16: { title: "강철의 도시", intro: "기계들이 지배하는 도시.\n정교한 함정을 조심하세요.", win: "기계의 중앙 제어를 무너뜨렸습니다.", lose: "기계 병기에 의해 패배했습니다." },
  17: { title: "노래하는 길", intro: "노랫소리가 길을 안내합니다.", win: "노래의 수수께끼를 풀고 전진했습니다.", lose: "노래를 해석하지 못했습니다." },
  18: { title: "꿈의 다리", intro: "현실과 꿈이 겹치는 다리입니다.", win: "꿈의 시련을 통과했습니다.", lose: "꿈에 갇혀 실패했습니다." },
  19: { title: "사랑의 해안", intro: "평화로운 해변.\n사소한 퀘스트들이 기다립니다.", win: "사랑을 되찾아 보상을 얻었습니다.", lose: "돌발 사건으로 패배했습니다." },
  20: { title: "예술의 광장", intro: "예술가들이 모여드는 광장.\n창의적인 적들이 등장합니다.", win: "예술가들을 돕고 명예를 얻었습니다.", lose: "혼란 속에 패배했습니다." },
  21: { title: "도서관의 미로", intro: "끝없는 서가와 숨겨진 지식의 방.", win: "지식을 얻어 강해졌습니다.", lose: "서가의 함정에 걸렸습니다." },
  22: { title: "여행자의 공항", intro: "다양한 차원의 여행자가 모이는 곳.", win: "안전하게 터미널을 확보했습니다.", lose: "혼란 속에서 밀려났습니다." },
  23: { title: "웃음의 시장", intro: "소란스럽지만 활기찬 시장입니다.", win: "상인들을 도와 보상을 얻었습니다.", lose: "사기꾼에게 속아 패배했습니다." },
  24: { title: "행운의 박물관", intro: "희귀한 유물이 전시된 장소.", win: "유물을 회수하고 명예를 얻었습니다.", lose: "유물의 저주에 당했습니다." },
  25: { title: "변화의 무대", intro: "모양이 계속 변하는 무대.", win: "무대를 극복하고 승리했습니다.", lose: "무대의 함정에 걸렸습니다." },
  26: { title: "태양의 역", intro: "빛과 열로 가득한 역.", win: "태양의 시험을 통과했습니다.", lose: "열기에 의해 탈진했습니다." },
  27: { title: "돌봄의 바다", intro: "치유의 힘이 흐르는 바다.", win: "치유의 축복을 받아 회복했습니다.", lose: "바다의 위협에 굴복했습니다." },
  28: { title: "진실의 공원", intro: "거짓이 통하지 않는 신비한 공원.", win: "진실을 밝혀 승리했습니다.", lose: "속임수에 당했습니다." },
  29: { title: "과학의 서점", intro: "실험과 발명이 가득한 서점.", win: "발명을 활용해 승리했습니다.", lose: "실험이 실패했습니다." },
  30: { title: "마법의 숲", intro: "마법이 춤추는 숲.", win: "마법의 시련을 이겨냈습니다.", lose: "마법에 휩쓸려 패배했습니다." },
  31: { title: "넓은 사무실", intro: "의외로 위험한 사무실 공간.", win: "업무를 완수하고 보상을 얻었습니다.", lose: "서류더미에 묻혀 패배했습니다." },
  32: { title: "위험한 캠프", intro: "야영지 주변의 위협을 제거하세요.", win: "캠프를 안전하게 만들었습니다.", lose: "야영지에서 패배했습니다." },
  33: { title: "역사의 홀", intro: "과거의 전투들이 재현되는 곳.", win: "역사의 시험을 통과했습니다.", lose: "과거에 묶여 패배했습니다." },
  34: { title: "거울의 체육관", intro: "자신의 그림자와 싸우는 장소.", win: "자신을 극복하고 승리했습니다.", lose: "그림자에게 무너졌습니다." },
  35: { title: "흥미의 강", intro: "다채로운 생물이 사는 강.", win: "강의 시련을 통과했습니다.", lose: "강의 흐름에 휩쓸렸습니다." },
  36: { title: "건강의 농장", intro: "회복과 강화의 장소.", win: "상처를 치유하고 강화되었습니다.", lose: "함정에 빠져 탈락했습니다." },
  37: { title: "비밀의 계곡", intro: "숨겨진 보물이 있는 계곡.", win: "보물을 찾아 승리했습니다.", lose: "함정에 걸려 후퇴했습니다." },
  38: { title: "축제의 언덕", intro: "항상 축제가 열리는 즐거운 장소.", win: "축제를 지키고 보상을 얻었습니다.", lose: "혼란 속에서 패배했습니다." },
  39: { title: "신문 가판대", intro: "소문과 정보가 오가는 곳.", win: "중요한 정보를 얻고 승리했습니다.", lose: "오보에 속아 패배했습니다." },
  40: { title: "정글의 심장", intro: "울창한 정글의 중심.\n야수들이 경계를 삼키고 있습니다.", win: "심장을 정화하고 안전을 되찾았습니다.", lose: "정글의 위협에 의해 쓰러졌습니다." },
  41: { title: "완벽한 찻집", intro: "평온한 찻집에서 작은 사건이 벌어집니다.", win: "사건을 해결하고 찻집의 평화를 되찾았습니다.", lose: "사건을 해결하지 못하고 물러났습니다." },
  42: { title: "실수의 들판", intro: "실수가 축적된 이상한 들판.", win: "실수를 극복하고 전진했습니다.", lose: "실수 때문에 패배했습니다." },
  43: { title: "만화방", intro: "만화 속 적들과 마주치는 공간.", win: "만화의 적들을 물리쳤습니다.", lose: "만화 속에 갇혀 패배했습니다." },
  44: { title: "조용한 마을", intro: "다시 찾은 평화로운 마을.\n이번에는 더 큰 위협이 숨어있습니다.", win: "마을을 지키고 축복을 받았습니다.", lose: "위협에 밀려 패배했습니다." },
  45: {
    title: "숲속 마을의 위기",
    intro: "평화롭던 숲속 마을이 어둠에 잠겼습니다.\n촌장은 당신의 손을 잡으며 간절히 부탁합니다.\n\"용사여, 마을을 지키는 정령들이 타락했습니다.\n그들을 정화하고 숲의 평화를 되찾아 주십시오!\"",
    win: "당신의 활약으로 숲은 다시 빛을 되찾았습니다.\n정령들은 감사의 뜻으로 고대 유물을 건넵니다.\n마을 사람들의 환호 속에 당신은 다음 여정을 준비합니다.",
    lose: "숲의 어둠은 너무나 깊었습니다...\n당신은 부상을 입고 마을 밖으로 후퇴합니다.\n\"아직 힘이 부족해...\" 당신은 복수를 다짐합니다."
  },
  46: {
    title: "비명 지르는 숲",
    intro: "바람 소리가 마치 비명처럼 들리는 저주받은 숲.\n이곳의 나무들은 살아있는 것들을 휘감으려 합니다.\n깊은 곳에 숨어있는 마녀를 처치해야만\n이 끔찍한 저주를 끝낼 수 있습니다.",
    win: "마녀가 쓰러지자 숲의 비명소리가 멈췄습니다.\n썩어가던 나무들에 다시 푸른 잎이 돋아납니다.\n당신은 저주를 푼 전설의 용사가 되었습니다.",
    lose: "나무 뿌리가 당신의 발목을 잡았습니다.\n점점 조여오는 공포 속에 시야가 흐려집니다.\n숲은 또 하나의 희생자를 삼켰습니다."
  },
  47: {
    title: "붉은 사막의 열기",
    intro: "타오르는 태양과 끝없는 모래 폭풍.\n붉은 사막은 나약한 자에게 죽음만을 선사합니다.\n전설 속 오아시스를 지키는 거대 전갈이\n당신의 앞길을 막아서고 있습니다.",
    win: "거대 전갈의 껍질을 부수고 승리했습니다!\n신기루 너머 진짜 오아시스가 모습을 드러냅니다.\n시원한 물 한 모금이 그 어떤 보물보다 달콤합니다.",
    lose: "더위와 갈증에 지쳐 쓰러졌습니다.\n모래 폭풍이 당신의 몸을 서서히 덮어옵니다.\n사막은 자비가 없습니다."
  },
  48: {
    title: "강철의 성채",
    intro: "차가운 금속음만이 가득한 기계들의 성.\n감정 없는 로봇 경비병들이 침입자를 감지했습니다.\n중앙 통제 시스템을 파괴하지 않으면\n이 성에서 영원히 나갈 수 없습니다.",
    win: "중앙 코어를 파괴하자 모든 기계가 멈췄습니다.\n강철 문이 열리고 자유의 바람이 불어옵니다.\n당신의 검은 강철보다 강했습니다.",
    lose: "레이저 포화 속에 갇혔습니다.\n강철 거인들의 압도적인 힘 앞에 무릎 꿇었습니다.\n시스템은 '침입자 제거 완료'를 선언합니다."
  },
  49: {
    title: "심해의 고대 신전",
    intro: "숨을 쉴 수 없는 깊은 바다 속.\n고대 신전에는 잊혀진 괴수들이 잠들어 있습니다.\n수압을 견디며 신전의 수호자를 물리치고\n심해의 보물을 차지하십시오.",
    win: "심해의 수호자가 깊은 바다 속으로 사라졌습니다.\n신전의 보물 상자가 빛을 발하며 열립니다.\n당신은 바다의 지배자로 인정받았습니다.",
    lose: "산소가 부족합니다...\n시야가 점점 좁아지고 의식이 흐려집니다.\n깊고 어두운 바다가 당신을 영원히 품습니다."
  },
  50: {
    title: "마왕의 탑",
    intro: "모든 악의 근원, 마왕의 탑 최상층.\n세상을 멸망시키려는 마왕이 당신을 기다립니다.\n이것이 마지막 싸움입니다.\n세상의 운명이 당신의 손에 달렸습니다!",
    win: "치열한 사투 끝에 마왕이 쓰러졌습니다.\n하늘에서 성스러운 빛이 내려와 당신을 감쌉니다.\n당신은 세상을 구한 전설이 되었습니다!",
    lose: "마왕의 힘은 상상을 초월했습니다.\"고작 그 정도인가?\" 마왕의 비웃음이 들립니다.\n세상은 어둠 속으로 떨어집니다..."
  },
  51: { title: "잊혀진 사원", intro: "고대의 의식이 흐르는 사원입니다.", win: "사원의 시련을 통과했습니다.", lose: "함정에 걸려 후퇴했습니다." },
  52: { title: "달빛 연못", intro: "달빛 아래 신비한 연못이 빛납니다.", win: "연못의 축복을 받았습니다.", lose: "연못의 환영에 속았습니다." },
  53: { title: "은빛 초원", intro: "은빛 풀밭에서 적들이 숨어있습니다.", win: "초원의 수호자를 물리쳤습니다.", lose: "초원의 안개에 갇혔습니다." },
  54: { title: "모래바람 고원", intro: "거센 모래바람이 시야를 가립니다.", win: "고원을 안전하게 통과했습니다.", lose: "모래바람에 휩쓸려 패배했습니다." },
  55: { title: "유령선 항구", intro: "유령선이 닻을 내린 음침한 항구.", win: "유령선을 정화하고 보물을 얻었습니다.", lose: "유령의 저주에 쓰러졌습니다." },
  56: { title: "깊은 동굴", intro: "어둠 속 숨겨진 생물이 위협합니다.", win: "동굴 깊은 곳의 보물을 얻었습니다.", lose: "미로에서 길을 잃었습니다." },
  57: { title: "하늘 정원", intro: "공중에 떠있는 정원에서 시련이 펼쳐집니다.", win: "정원의 시련을 이겨냈습니다.", lose: "공중에서 추락했습니다." },
  58: { title: "빙하 계곡", intro: "얼음으로 뒤덮인 협곡.", win: "빙하를 깨고 길을 열었습니다.", lose: "추위에 굴복했습니다." },
  59: { title: "불의 심장", intro: "끓어오르는 용암의 중심부.", win: "화염의 수호자를 물리쳤습니다.", lose: "불길에 삼켜졌습니다." },
  60: { title: "황혼의 탑", intro: "황혼이 내리는 탑에서 최후의 시련이 기다립니다.", win: "탑의 정상을 정복했습니다.", lose: "탑의 수호자에게 패배했습니다." },
  all: {
    title: "혼돈의 균열",
    intro: "시공간이 뒤틀린 혼돈의 땅.\n이곳에서는 과거와 현재, 미래의 적들이 쏟아져 나옵니다.\n예측할 수 없는 적들을 상대로\n당신의 실력을 증명하십시오.",
    win: "혼돈을 잠재우고 질서를 되찾았습니다.\n당신의 이름은 차원을 넘어 전해질 것입니다.",
    lose: "혼돈의 소용돌이에 휘말렸습니다.\n어디인지 알 수 없는 곳으로 떨어집니다..."
  },
  rush: {
    title: "무한의 전장 (Boss Rush)",
    intro: "끝없이 몰려오는 보스들!\n이곳은 오직 강자만이 살아남는 무한의 전장입니다.\n한 번의 실수는 곧 죽음입니다.\n당신의 한계를 시험해 보십시오!",
    win: "믿을 수 없는 기록입니다!\n당신은 이 전장의 새로운 지배자입니다.",
    lose: "훌륭한 싸움이었지만, 적들은 끝이 없었습니다.\n당신의 기록은 명예의 전당에 남을 것입니다."
  }
};

// canonical dayCatalog — single source-of-truth for day labels + story objects
const dayCatalog = (function () {
  const c = {};
  // Prefer explicit `stories` entries for label + story content
  if (typeof stories !== 'undefined') {
    Object.keys(stories).forEach(k => {
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

const rawData = [
        // Day 1
        { day: 1, word: "machine", meaning: "기계" },
        { day: 1, word: "tip", meaning: "(뾰족한) 끝; 팁; 조언" },
        { day: 1, word: "lend", meaning: "빌려주다" },
        { day: 1, word: "twin", meaning: "쌍둥이; 쌍둥이의" },
        { day: 1, word: "through", meaning: "~을 통하여; ~을 지나서" },
        { day: 1, word: "display", meaning: "전시하다, 진열하다" },
        { day: 1, word: "wing", meaning: "날개" },
        { day: 1, word: "cave", meaning: "동굴" },
        { day: 1, word: "pure", meaning: "순수한; 맑은" },
        { day: 1, word: "exit", meaning: "출구; 나가다" },
        { day: 1, word: "lead", meaning: "안내하다, 이끌다" },
        { day: 1, word: "sharp", meaning: "날카로운, 뾰족한" },
        { day: 1, word: "stamp", meaning: "우표; 도장" },
        { day: 1, word: "at first", meaning: "처음에는" },
        { day: 1, word: "cash", meaning: "현금" },
        { day: 1, word: "put on", meaning: "입다; 쓰다; 신다" },
        { day: 1, word: "roll", meaning: "구르다; 굴리다" },
        { day: 1, word: "search", meaning: "찾다, 수색하다" },
        { day: 1, word: "at last", meaning: "마침내" },
        { day: 1, word: "still", meaning: "아직도, 여전히" },

        // Day 2
        { day: 2, word: "flood", meaning: "홍수" },
        { day: 2, word: "trouble", meaning: "어려움, 문제" },
        { day: 2, word: "dot", meaning: "(동그란) 점" },
        { day: 2, word: "piece", meaning: "조각; 한 개" },
        { day: 2, word: "moment", meaning: "순간; 잠시" },
        { day: 2, word: "oven", meaning: "오븐" },
        { day: 2, word: "fix", meaning: "수리하다; 고정시키다" },
        { day: 2, word: "useful", meaning: "유용한, 쓸모 있는" },
        { day: 2, word: "neighbor", meaning: "이웃" },
        { day: 2, word: "advice", meaning: "충고, 조언" },
        { day: 2, word: "perfect", meaning: "완벽한" },
        { day: 2, word: "war", meaning: "전쟁" },
        { day: 2, word: "shade", meaning: "그늘" },
        { day: 2, word: "proud", meaning: "자랑스러운; 거만한" },
        { day: 2, word: "stage", meaning: "무대; 단계" },
        { day: 2, word: "bury", meaning: "묻다, 매장하다" },
        { day: 2, word: "grow up", meaning: "자라다, 성장하다" },
        { day: 2, word: "copy", meaning: "복사하다; 따라 하다" },
        { day: 2, word: "contest", meaning: "대회, 콘테스트" },
        { day: 2, word: "borrow", meaning: "빌리다" },

        // Day 3
        { day: 3, word: "be in trouble", meaning: "곤경에 처하다" },
        { day: 3, word: "leader", meaning: "지도자, 리더" },
        { day: 3, word: "prize", meaning: "상, 상품" },
        { day: 3, word: "sleepy", meaning: "졸리는" },
        { day: 3, word: "be famous for", meaning: "~로 유명하다" },
        { day: 3, word: "pack", meaning: "(짐을) 싸다; 한 갑" },
        { day: 3, word: "sometime", meaning: "언젠가" },
        { day: 3, word: "award", meaning: "상; 수여하다" },
        { day: 3, word: "elder", meaning: "나이가 더 많은; 노인" },
        { day: 3, word: "final", meaning: "마지막의; 결승전" },
        { day: 3, word: "lift", meaning: "들어 올리다" },
        { day: 3, word: "root", meaning: "뿌리; 근원" },
        { day: 3, word: "simple", meaning: "간단한; 소박한" },
        { day: 3, word: "active", meaning: "활동적인; 적극적인" },
        { day: 3, word: "score", meaning: "점수; 득점하다" },
        { day: 3, word: "wonder", meaning: "궁금하다; 놀라움" },
        { day: 3, word: "mix", meaning: "섞다; 섞이다" },
        { day: 3, word: "desert", meaning: "사막" },
        { day: 3, word: "bark", meaning: "짖다" },
        { day: 3, word: "scene", meaning: "장면; 경치" },

        // Day 4
        { day: 4, word: "coach", meaning: "코치, 감독" },
        { day: 4, word: "court", meaning: "법정; 경기장" },
        { day: 4, word: "cartoon", meaning: "만화" },
        { day: 4, word: "pan", meaning: "팬, 프라이팬" },
        { day: 4, word: "male", meaning: "남성의; 수컷" },
        { day: 4, word: "view", meaning: "경치; 견해" },
        { day: 4, word: "nickname", meaning: "별명" },
        { day: 4, word: "finally", meaning: "마침내, 결국" },
        { day: 4, word: "dig", meaning: "파다" },
        { day: 4, word: "rule", meaning: "규칙; 지배하다" },
        { day: 4, word: "find out", meaning: "알아내다" },
        { day: 4, word: "valley", meaning: "계곡, 골짜기" },
        { day: 4, word: "total", meaning: "전체의; 합계" },
        { day: 4, word: "think up", meaning: "생각해내다" },
        { day: 4, word: "among", meaning: "~사이에" },
        { day: 4, word: "crash", meaning: "충돌하다; 추락하다" },
        { day: 4, word: "insect", meaning: "곤충" },
        { day: 4, word: "nature", meaning: "자연; 천성" },
        { day: 4, word: "harmony", meaning: "조화, 화합" },
        { day: 4, word: "healthy", meaning: "건강한" },

        // Day 5
        { day: 5, word: "noisy", meaning: "시끄러운" },
        { day: 5, word: "pain", meaning: "고통, 통증" },
        { day: 5, word: "shout", meaning: "소리치다" },
        { day: 5, word: "smart", meaning: "영리한, 똑똑한" },
        { day: 5, word: "hang", meaning: "걸다; 매달리다" },
        { day: 5, word: "bored", meaning: "지루한" },
        { day: 5, word: "care", meaning: "돌봄; 조심" },
        { day: 5, word: "invent", meaning: "발명하다" },
        { day: 5, word: "hero", meaning: "영웅" },
        { day: 5, word: "curl", meaning: "곱슬곱슬하게 하다" },
        { day: 5, word: "regular", meaning: "규칙적인" },
        { day: 5, word: "popular", meaning: "인기 있는" },
        { day: 5, word: "able", meaning: "할 수 있는" },
        { day: 5, word: "planet", meaning: "행성" },
        { day: 5, word: "teenager", meaning: "십대" },
        { day: 5, word: "uniform", meaning: "제복; 균일한" },
        { day: 5, word: "freeze", meaning: "얼다" },
        { day: 5, word: "dead", meaning: "죽은" },
        { day: 5, word: "beauty", meaning: "아름다움; 미인" },
        { day: 5, word: "lower", meaning: "낮추다; 아래의" },

        // Day 6
        { day: 6, word: "because of", meaning: "~때문에" },
        { day: 6, word: "female", meaning: "여성의; 암컷" },
        { day: 6, word: "usual", meaning: "보통의, 평소의" },
        { day: 6, word: "without", meaning: "~없이" },
        { day: 6, word: "miss", meaning: "놓치다; 그리워하다" },
        { day: 6, word: "sunlight", meaning: "햇빛" },
        { day: 6, word: "language", meaning: "언어" },
        { day: 6, word: "dive", meaning: "다이빙하다" },
        { day: 6, word: "meal", meaning: "식사" },
        { day: 6, word: "alarm", meaning: "경보; 알람" },
        { day: 6, word: "calm down", meaning: "진정하다" },
        { day: 6, word: "chance", meaning: "기회; 가능성" },
        { day: 6, word: "nobody", meaning: "아무도 ~않다" },
        { day: 6, word: "before long", meaning: "머지않아" },
        { day: 6, word: "exact", meaning: "정확한" },
        { day: 6, word: "taste", meaning: "맛; 맛보다" },
        { day: 6, word: "take care", meaning: "조심하다; 돌보다" },
        { day: 6, word: "regularly", meaning: "정기적으로" },
        { day: 6, word: "pill", meaning: "알약" },
        { day: 6, word: "soil", meaning: "흙, 토양" },

        // Day 7
        { day: 7, word: "silent", meaning: "조용한, 침묵하는" },
        { day: 7, word: "rub", meaning: "문지르다, 비비다" },
        { day: 7, word: "neat", meaning: "단정한, 깔끔한" },
        { day: 7, word: "teen", meaning: "십대" },
        { day: 7, word: "weigh", meaning: "무게가 나가다" },
        { day: 7, word: "shower", meaning: "샤워; 소나기" },
        { day: 7, word: "be different from", meaning: "~와 다르다" },
        { day: 7, word: "fill in", meaning: "채우다; 기입하다" },
        { day: 7, word: "take out", meaning: "꺼내다" },
        { day: 7, word: "guide", meaning: "안내하다; 안내자" },
        { day: 7, word: "channel", meaning: "채널; 수로" },
        { day: 7, word: "yet", meaning: "아직; 벌써" },
        { day: 7, word: "during", meaning: "~동안" },
        { day: 7, word: "mistake", meaning: "실수" },
        { day: 7, word: "tire", meaning: "피곤하게 하다; 타이어" },
        { day: 7, word: "flour", meaning: "밀가루" },
        { day: 7, word: "lawyer", meaning: "변호사" },
        { day: 7, word: "main", meaning: "주된" },
        { day: 7, word: "ache", meaning: "아프다; 통증" },
        { day: 7, word: "prepare", meaning: "준비하다" },

        // Day 8
        { day: 8, word: "coin", meaning: "동전" },
        { day: 8, word: "deaf", meaning: "귀가 먼" },
        { day: 8, word: "bar", meaning: "막대기; 술집" },
        { day: 8, word: "law", meaning: "법" },
        { day: 8, word: "soldier", meaning: "군인" },
        { day: 8, word: "pour", meaning: "붓다, 따르다" },
        { day: 8, word: "quite", meaning: "꽤, 상당히" },
        { day: 8, word: "patient", meaning: "환자; 참을성 있는" },
        { day: 8, word: "blank", meaning: "빈칸; 비어있는" },
        { day: 8, word: "important", meaning: "중요한" },
        { day: 8, word: "wallet", meaning: "지갑" },
        { day: 8, word: "course", meaning: "강의; 진로" },
        { day: 8, word: "skill", meaning: "기술, 솜씨" },
        { day: 8, word: "spicy", meaning: "매운" },
        { day: 8, word: "get out of", meaning: "~에서 나가다" },
        { day: 8, word: "elderly", meaning: "연세 드신" },
        { day: 8, word: "alike", meaning: "비슷한" },
        { day: 8, word: "freezing", meaning: "몹시 추운" },
        { day: 8, word: "collect", meaning: "모으다" },
        { day: 8, word: "recipe", meaning: "요리법" },

        // Day 9
        { day: 9, word: "natural", meaning: "자연의; 당연한" },
        { day: 9, word: "wild", meaning: "야생의" },
        { day: 9, word: "especially", meaning: "특히" },
        { day: 9, word: "make noise", meaning: "떠들다" },
        { day: 9, word: "actual", meaning: "실제의" },
        { day: 9, word: "online", meaning: "온라인의" },
        { day: 9, word: "help out", meaning: "도와주다" },
        { day: 9, word: "lost", meaning: "길을 잃은" },
        { day: 9, word: "curly", meaning: "곱슬곱슬한" },
        { day: 9, word: "blind", meaning: "눈먼" },
        { day: 9, word: "culture", meaning: "문화" },
        { day: 9, word: "excite", meaning: "흥분시키다" },
        { day: 9, word: "suck", meaning: "빨다" },
        { day: 9, word: "item", meaning: "항목, 품목" },
        { day: 9, word: "share", meaning: "공유하다" },
        { day: 9, word: "pick up", meaning: "집어 들다; 태우러 가다" },
        { day: 9, word: "hand in hand", meaning: "손을 잡고" },
        { day: 9, word: "designer", meaning: "디자이너" },
        { day: 9, word: "invention", meaning: "발명품" },
        { day: 9, word: "garbage", meaning: "쓰레기" },

        // Day 10
        { day: 10, word: "result", meaning: "결과" },
        { day: 10, word: "flow", meaning: "흐르다; 흐름" },
        { day: 10, word: "type", meaning: "유형, 종류" },
        { day: 10, word: "gallery", meaning: "미술관" },
        { day: 10, word: "lonely", meaning: "외로운" },
        { day: 10, word: "purse", meaning: "지갑" },
        { day: 10, word: "tasty", meaning: "맛있는" },
        { day: 10, word: "mind", meaning: "마음; 꺼리다" },
        { day: 10, word: "breath", meaning: "숨" },
        { day: 10, word: "prison", meaning: "감옥" },
        { day: 10, word: "chat", meaning: "수다 떨다" },
        { day: 10, word: "soap", meaning: "비누" },
        { day: 10, word: "form", meaning: "형태; 형성하다" },
        { day: 10, word: "rail", meaning: "레일; 철도" },
        { day: 10, word: "someday", meaning: "언젠가" },
        { day: 10, word: "secret", meaning: "비밀" },
        { day: 10, word: "couple", meaning: "커플, 부부" },
        { day: 10, word: "design", meaning: "디자인하다" },
        { day: 10, word: "stick", meaning: "막대기; 붙이다" },
];

const decoyWords = [
    // Day 1
    { day: 1, word: "machiney", meaning: "기계 같은" },
    { day: 1, word: "tippy", meaning: "불안정한" },
    { day: 1, word: "lend-lease", meaning: "무기 대여" },
    { day: 1, word: "twin-turbo", meaning: "트윈 터보" },
    { day: 1, word: "thorough", meaning: "철저한" },
    { day: 1, word: "displayer", meaning: "진열자" },
    { day: 1, word: "wing-ding", meaning: "요란한 파티" },
    { day: 1, word: "cavern", meaning: "큰 동굴" },
    { day: 1, word: "impure", meaning: "불순한" },
    { day: 1, word: "entry", meaning: "입장" },
    // Day 2
    { day: 2, word: "floodlight", meaning: "투광 조명" },
    { day: 2, word: "untroubled", meaning: "평온한" },
    { day: 2, word: "polka-dot", meaning: "물방울 무늬" },
    { day: 2, word: "piecemeal", meaning: "단편적인" },
    { day: 2, word: "momentary", meaning: "순간의" },
    { day: 2, word: "oversee", meaning: "감독하다" },
    { day: 2, word: "refix", meaning: "다시 고정하다" },
    { day: 2, word: "useless", meaning: "쓸모없는" },
    { day: 2, word: "neighborly", meaning: "이웃집의" },
    { day: 2, word: "advise", meaning: "충고하다" },
    // Day 3
    { day: 3, word: "leadership", meaning: "지도력" },
    { day: 3, word: "apprize", meaning: "통지하다" },
    { day: 3, word: "drowsy", meaning: "졸리는" },
    { day: 3, word: "infamous", meaning: "악명 높은" },
    { day: 3, word: "unpack", meaning: "짐을 풀다" },
    { day: 3, word: "sometimes", meaning: "때때로" },
    { day: 3, word: "reward", meaning: "보상" },
    { day: 3, word: "elderly", meaning: "연세가 드신" },
    { day: 3, word: "semifinal", meaning: "준결승" },
    { day: 3, word: "uplift", meaning: "희망을 주다" },
    // Day 4
    { day: 4, word: "poach", meaning: "밀렵하다" },
    { day: 4, word: "courtyard", meaning: "안뜰" },
    { day: 4, word: "car-toon", meaning: "자동차 만화" },
    { day: 4, word: "pancake", meaning: "팬케이크" },
    { day: 4, word: "female", meaning: "여성의" },
    { day: 4, word: "preview", meaning: "미리보기" },
    { day: 4, word: "surname", meaning: "성" },
    { day: 4, word: "finally-finally", meaning: "마침내 마침내" },
    { day: 4, word: "dig up", meaning: "파내다" },
    { day: 4, word: "overrule", meaning: "기각하다" },
    // Day 5
    { day: 5, word: "quiet", meaning: "조용한" },
    { day: 5, word: "painless", meaning: "고통 없는" },
    { day: 5, word: "shout-out", meaning: "감사의 말" },
    { day: 5, word: "smarter", meaning: "더 똑똑한" },
    { day: 5, word: "unhang", meaning: "내리다" },
    { day: 5, word: "boring", meaning: "지루한" },
    { day: 5, word: "careless", meaning: "부주의한" },
    { day: 5, word: "uninvent", meaning: "발명을 취소하다" },
    { day: 5, word: "heroine", meaning: "여주인공" },
    { day: 5, word: "uncurled", meaning: "펴진" },
    // Day 6
    { day: 6, word: "with", meaning: "함께" },
    { day: 6, word: "mail", meaning: "우편" },
    { day: 6, word: "unusual", meaning: "특이한" },
    { day: 6, word: "hit", meaning: "치다" },
    { day: 6, word: "moonlight", meaning: "달빛" },
    { day: 6, word: "slanguage", meaning: "속어" },
    { day: 6, word: "drive", meaning: "운전하다" },
    { day: 6, word: "snack", meaning: "간식" },
    { day: 6, word: "alarmist", meaning: "분위기를 해치는 사람" },
    { day: 6, word: "calmly", meaning: "차분하게" },
    // Day 7
    { day: 7, word: "violent", meaning: "폭력적인" },
    { day: 7, word: "scrub", meaning: "문지르다" },
    { day: 7, word: "messy", meaning: "지저분한" },
    { day: 7, word: "adult", meaning: "성인" },
    { day: 7, word: "underweigh", meaning: "무게가 미달이다" },
    { day: 7, word: "downpour", meaning: "폭우" },
    { day: 7, word: "unlike", meaning: "~와 다른" },
    { day: 7, word: "refill", meaning: "리필" },
    { day: 7, word: "bring out", meaning: "꺼내다" },
    { day: 7, word: "misguide", meaning: "잘못 안내하다" },
    // Day 8
    { day: 8, word: "join", meaning: "가입하다" },
    { day: 8, word: "leaf", meaning: "잎" },
    { day: 8, word: "barrier", meaning: "장벽" },
    { day: 8, word: "outlaw", meaning: "불법화하다" },
    { day: 8, word: "folder", meaning: "폴더" },
    { day: 8, word: "downpour", meaning: "폭우" },
    { day: 8, word: "quietly", meaning: "조용히" },
    { day: 8, word: "impatient", meaning: "참을성 없는" },
    { day: 8, word: "fill", meaning: "채우다" },
    { day: 8, word: "unimportant", meaning: "중요하지 않은" },
    // Day 9
    { day: 9, word: "unnatural", meaning: "부자연스러운" },
    { day: 9, word: "tame", meaning: "길들여진" },
    { day: 9, word: "generally", meaning: "일반적으로" },
    { day: 9, word: "be quiet", meaning: "조용히 해" },
    { day: 9, word: "virtual", meaning: "가상의" },
    { day: 9, word: "offline", meaning: "오프라인의" },
    { day: 9, word: "ignore", meaning: "무시하다" },
    { day: 9, word: "found", meaning: "설립하다" },
    { day: 9, word: "straight", meaning: "직선" },
    { day: 9, word: "aware", meaning: "알고 있는" },
    // Day 10
    { day: 10, word: "insult", meaning: "모욕" },
    { day: 10, word: "glow", meaning: "빛나다" },
    { day: 10, word: "style", meaning: "스타일" },
    { day: 10, word: "ball-gallery", meaning: "사격장" },
    { day: 10, word: "friendly", meaning: "친근한" },
    { day: 10, word: "wallet", meaning: "지갑" },
    { day: 10, word: "bland", meaning: "맛없는" },
    { day: 10, word: "remind", meaning: "상기시키다" },
    { day: 10, word: "death", meaning: "죽음" },
    { day: 10, word: "imprison", meaning: "투옥하다" }
];