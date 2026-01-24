#!/usr/bin/env node

/**
 * 단어 뜻 풀이 자동 업데이트 스크립트
 * 
 * 이 스크립트는 game-data-1.js와 game-data-2.js 파일에서
 * 아직 업데이트되지 않은 단어들을 찾아서 뜻 풀이를 추가합니다.
 * 
 * 사용법: node update-explanations.js
 */

const fs = require('fs');
const path = require('path');

// 업데이트할 파일들
const files = [
  'src/data/game-data-1.js',
  'src/data/game-data-2.js'
];

// 패턴: 아직 업데이트되지 않은 항목 찾기
const OLD_PATTERN = /koreanExplanation:\s*"[^"]*을\(를\) 의미하는 단어"/;
const OLD_ENGLISH_PATTERN = /englishExplanation:\s*"meaning:\s*[^"]*"/;

// meaning 필드를 기반으로 기본 설명 생성 (임시)
// 실제로는 사전 API를 사용하거나 웹 스크래핑이 필요합니다
function generateBasicExplanation(meaning, word) {
  // 의미를 기반으로 기본 설명 생성
  const koreanExplanation = meaning.includes('하다') || meaning.includes('되다') 
    ? `${meaning}는 동작이나 상태를 나타내는 표현`
    : meaning.includes('~') || meaning.includes('으로') || meaning.includes('에게')
    ? `${meaning}는 관계나 방향을 나타내는 표현`
    : `${meaning}를 의미하는 단어나 개념`;
  
  // 영어 설명도 기본적인 형태로 생성
  const englishExplanation = `refers to ${meaning}`;
  
  return { koreanExplanation, englishExplanation };
}

// 파일 업데이트 함수
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = false;
  let count = 0;
  
  // 패턴을 찾아서 업데이트
  content = content.replace(
    /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*koreanExplanation:\s*"([^"]*을\(를\) 의미하는 단어)",\s*englishExplanation:\s*"meaning:\s*([^"]*)"\s*\}/g,
    (match, day, word, meaning, oldKorean, oldEnglish) => {
      // 이미 업데이트된 항목은 건너뛰기
      if (!oldKorean.includes('을(를) 의미하는 단어')) {
        return match;
      }
      
      // 기본 설명 생성 (실제로는 사전에서 가져와야 함)
      const { koreanExplanation, englishExplanation } = generateBasicExplanation(meaning, word);
      
      updated = true;
      count++;
      
      return `{ day: ${day}, word: "${word}", meaning: "${meaning}", koreanExplanation: "${koreanExplanation}", englishExplanation: "${englishExplanation}" }`;
    }
  );
  
  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✓ ${filePath}: ${count}개 항목 업데이트됨`);
    return count;
  } else {
    console.log(`- ${filePath}: 업데이트할 항목 없음`);
    return 0;
  }
}

// 메인 실행
console.log('단어 뜻 풀이 자동 업데이트 시작...\n');

let totalUpdated = 0;
files.forEach(file => {
  try {
    const count = updateFile(file);
    totalUpdated += count;
  } catch (error) {
    console.error(`✗ ${file} 처리 중 오류:`, error.message);
  }
});

console.log(`\n완료! 총 ${totalUpdated}개 항목이 업데이트되었습니다.`);
console.log('\n주의: 이 스크립트는 기본 설명만 생성합니다.');
console.log('정확한 뜻 풀이를 위해서는 실제 사전에서 확인하여 수동으로 수정해야 합니다.');
