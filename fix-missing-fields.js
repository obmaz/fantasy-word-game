#!/usr/bin/env node

/**
 * 누락된 필드를 자동으로 추가하는 스크립트
 */

const fs = require('fs');
const path = require('path');

function generateKoreanExplanation(meaning) {
  if (meaning.includes('하다') || meaning.includes('되다') || meaning.includes('시키다') || meaning.includes('지다')) {
    const verb = meaning.replace(/하다|되다|시키다|지다/g, '').trim();
    return `${verb}는 동작이나 행위를 수행하는 것`;
  }
  if (meaning.includes('한') || meaning.includes('인') || meaning.includes('적인')) {
    const adj = meaning.replace(/한|인|적인/g, '').trim();
    return `${adj}는 상태나 성질을 나타내는 것`;
  }
  if (meaning.includes('~') || meaning.includes('으로') || meaning.includes('에게') || meaning.includes('에서') || meaning.includes('와')) {
    return `${meaning}는 관계나 방향을 나타내는 표현`;
  }
  return `${meaning}를 의미하는 단어나 개념`;
}

function generateEnglishExplanation(meaning) {
  if (meaning.includes('하다') || meaning.includes('되다') || meaning.includes('시키다')) {
    const verbBase = meaning.replace(/하다|되다|시키다/g, '').trim();
    return `to do or perform the action of ${verbBase}`;
  }
  if (meaning.includes('한') || meaning.includes('인')) {
    return `having the quality or characteristic of ${meaning.replace(/한|인/g, '').trim()}`;
  }
  return `a word or concept that means ${meaning}`;
}

function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // { day: X, word: "...", meaning: "..." } 패턴을 찾아서 업데이트
  const regex = /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)"\s*\}\s*(?=,|\])/g;
  
  let count = 0;
  content = content.replace(regex, (match, day, word, meaning) => {
    const koreanExplanation = generateKoreanExplanation(meaning);
    const englishExplanation = generateEnglishExplanation(meaning);
    count++;
    return `{ day: ${day}, word: "${word}", meaning: "${meaning}", koreanExplanation: "${koreanExplanation}", englishExplanation: "${englishExplanation}" }`;
  });
  
  fs.writeFileSync(fullPath, content, 'utf8');
  return count;
}

console.log('누락된 필드 자동 추가 중...\n');

const files = [
  'src/data/game-data-1.js'
];

files.forEach(file => {
  try {
    const count = fixFile(file);
    console.log(`✓ ${file}: ${count}개 항목 업데이트 완료`);
  } catch (error) {
    console.error(`✗ ${file} 처리 중 오류:`, error.message);
  }
});

console.log('\n완료!');
