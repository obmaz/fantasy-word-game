#!/usr/bin/env node

/**
 * 누락된 필드를 찾는 스크립트
 */

const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // { day: X, word: "...", meaning: "..." } 패턴 찾기 (koreanExplanation, englishExplanation 없음)
  const regex = /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)"\s*\}\s*(?:,|\])/g;
  
  const missing = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    missing.push({
      day: match[1],
      word: match[2],
      meaning: match[3],
      index: match.index
    });
  }
  
  return missing;
}

console.log('누락된 필드 검사 중...\n');

const files = [
  'src/data/game-data-1.js',
  'src/data/game-data-2.js'
];

files.forEach(file => {
  const missing = checkFile(file);
  if (missing.length > 0) {
    console.log(`${file}: ${missing.length}개 항목에 필드 누락`);
    console.log('예시:');
    missing.slice(0, 5).forEach(item => {
      console.log(`  Day ${item.day}: ${item.word} (${item.meaning})`);
    });
    if (missing.length > 5) {
      console.log(`  ... 외 ${missing.length - 5}개`);
    }
    console.log('');
  } else {
    console.log(`${file}: 모든 항목에 필드가 있습니다.\n`);
  }
});
