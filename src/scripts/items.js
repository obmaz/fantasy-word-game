// Load items data from external data file (wrapped as JavaScript variables to avoid CORS issues)
// If data file is not loaded, use empty fallback
const weapons = typeof window !== 'undefined' && window.weaponsData ? window.weaponsData : [];
const relics = typeof window !== 'undefined' && window.relicsData ? window.relicsData : [];
const items = typeof window !== 'undefined' && window.itemsData ? window.itemsData : [];
