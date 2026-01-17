const weapons = [
    // Economy Weapons
    { id: 'goldDagger', name: '💰 도적의 단검', cost: 500, effect: 'gold', icon: '🗡️', multiplier: 1.2, desc: '골드 획득 x1.2' },
    { id: 'midasSword', name: '👑 왕가의 검', cost: 2000, effect: 'gold', icon: '⚔️', multiplier: 1.5, desc: '골드 획득 x1.5' },
    { id: 'tycoonAxe', name: '💎 재벌의 도끼', cost: 5000, effect: 'gold', icon: '🪓', multiplier: 2.0, desc: '골드 획득 x2.0' },

    // Visual Weapons
    { id: 'basic', name: '🗡️ 기본 검', cost: 0, effect: 'basic', icon: '🗡️', multiplier: 1.0, desc: '기본 무기' },
    { id: 'fire', name: '🔥 화염 검', cost: 300, effect: 'fire', icon: '🔥', multiplier: 1.0, desc: '화염 이펙트' },
    { id: 'ice', name: '❄️ 서리 낫', cost: 800, effect: 'ice', icon: '❄️', multiplier: 1.0, desc: '얼음 이펙트' },
    { id: 'lightning', name: '⚡ 뇌전 창', cost: 1500, effect: 'lightning', icon: '🔱', multiplier: 1.0, desc: '번개 이펙트' },
    { id: 'void', name: '🌌 우주 파괴자', cost: 4000, effect: 'void', icon: '🟣', multiplier: 1.0, desc: '우주 이펙트' },
];

const relics = [
    { id: 'hourglass', name: '⏳ 모래시계', cost: 500, desc: '제한시간 +5초', type: 'passive' },
    { id: 'goldGlove', name: '🥊 황금장갑', cost: 1000, desc: '골드 x1.5배 (30회)', type: 'consumable', durability: 30 },
    { id: 'shield', name: '🛡️ 수호 방패', cost: 1500, desc: '오답 손실 50% 방어', type: 'passive' },
    { id: 'backpack', name: '🎒 가방', cost: 1000, desc: '인벤토리 용량 +1', type: 'backpack' },
    { id: 'hint', name: '🧪 힌트', cost: 100, desc: '정답이 아닌 선택지 2개를 제거합니다. (10개)', type: 'skill', uses: 10 },
    { id: 'ultimate', name: '⚡ 필살기', cost: 200, desc: '문제를 즉시 해결합니다. (2개)', type: 'skill', uses: 2 }
];

const items = [
    { id: 'helmet', name: '⛑️ 투구', cost: 1000, desc: '머리 방어구', slot: 'head', icon: '⛑️' },
    { id: 'sword', name: '🗡️ 검', cost: 1000, desc: '무기', slot: 'hand-1', icon: '🗡️' },
    { id: 'shield_item', name: '🛡️ 방패', cost: 1000, desc: '방어구', slot: 'hand-2', icon: '🛡️' },
    { id: 'boots', name: '👢 부츠', cost: 1000, desc: '신발', slot: 'foot-1', icon: '👢' },
];
