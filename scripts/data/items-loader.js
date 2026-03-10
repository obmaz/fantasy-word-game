/**
 * 아이템 데이터 로더
 * 외부 데이터 파일에서 아이템 데이터를 로드합니다 (CORS 문제 방지를 위해 JavaScript 변수로 래핑)
 * 데이터 파일이 로드되지 않으면 빈 fallback 사용
 */
const weapons = typeof window !== 'undefined' && window.weaponsData ? window.weaponsData : [];
const relics = typeof window !== 'undefined' && window.relicsData ? window.relicsData : [];
const items = typeof window !== 'undefined' && window.itemsData ? window.itemsData : [];
