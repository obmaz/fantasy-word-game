/**
 * rawData_1의 word 중 decoyWordsSet에 없는 단어 확인
 * 실행: node tools/check-decoy.js
 */
const fs = require('fs');
const path = require('path');

const gameDataPath = path.join(__dirname, '../data/game-data-1.js');
const decoyPath = path.join(__dirname, '../data/decoy-words-set.js');

const gameDataContent = fs.readFileSync(gameDataPath, 'utf8');
const decoyContent = fs.readFileSync(decoyPath, 'utf8');

// rawData_1에서 word: '...' 추출 (word: "..." 도 허용)
const rawWordMatches = gameDataContent.matchAll(/word:\s*['"]([^'"]+)['"]/g);
const rawWords = [...new Set([...rawWordMatches].map((m) => m[1].trim().toLowerCase()))];

// decoyWordsSet에서 모든 단어 추출 (배열 안의 '...' 또는 "...")
const decoyWordMatches = decoyContent.matchAll(/['"]([^'"]+)['"]/g);
const decoyWords = new Set([...decoyWordMatches].map((m) => m[1].trim().toLowerCase()));

// rawData_1에 있지만 decoyWordsSet에는 없는 단어
const notInDecoy = rawWords.filter((w) => !decoyWords.has(w)).sort();

console.log('=== rawData_1 word 개수:', rawWords.length);
console.log('=== decoyWordsSet 단어 개수 (중복 제거):', decoyWords.size);
console.log('=== rawData_1에 있으나 decoyWordsSet에 없는 단어 개수:', notInDecoy.length);
console.log('\n--- decoy에 없는 단어 목록 (가나다/abc 순) ---');
notInDecoy.forEach((w) => console.log(w));
