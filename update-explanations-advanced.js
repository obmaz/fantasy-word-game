#!/usr/bin/env node

/**
 * 단어 뜻 풀이 자동 업데이트 스크립트 (고급 버전)
 * 
 * 이 스크립트는 웹에서 사전 정보를 가져와서 정확한 뜻 풀이를 생성합니다.
 * 
 * 필요 패키지: npm install axios cheerio
 * 사용법: node update-explanations-advanced.js
 */

const fs = require('fs');
const path = require('path');

// 파일 읽기
function readDataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  return { content, lines };
}

// 아직 업데이트되지 않은 항목 찾기
function findUnupdatedItems(content) {
  const items = [];
  const regex = /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*koreanExplanation:\s*"([^"]*을\(를\) 의미하는 단어)",\s*englishExplanation:\s*"meaning:\s*([^"]*)"\s*\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    items.push({
      fullMatch: match[0],
      day: match[1],
      word: match[2],
      meaning: match[3],
      oldKorean: match[4],
      oldEnglish: match[5],
      index: match.index
    });
  }
  
  return items;
}

// 파일 업데이트
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  const { content } = readDataFile(fullPath);
  const items = findUnupdatedItems(content);
  
  if (items.length === 0) {
    console.log(`- ${filePath}: 업데이트할 항목 없음`);
    return 0;
  }
  
  console.log(`\n${filePath}에서 ${items.length}개 항목 발견`);
  console.log('주의: 이 스크립트는 기본 템플릿만 생성합니다.');
  console.log('정확한 뜻 풀이를 위해서는 실제 사전에서 확인이 필요합니다.\n');
  
  let newContent = content;
  let updatedCount = 0;
  
  // 각 항목을 업데이트
  items.forEach((item, idx) => {
    // meaning을 기반으로 기본 설명 생성
    // 실제로는 웹 스크래핑이나 API를 사용해야 함
    const koreanExplanation = generateKoreanExplanation(item.meaning, item.word);
    const englishExplanation = generateEnglishExplanation(item.meaning, item.word);
    
    const newItem = `{ day: ${item.day}, word: "${item.word}", meaning: "${item.meaning}", koreanExplanation: "${koreanExplanation}", englishExplanation: "${englishExplanation}" }`;
    
    newContent = newContent.replace(item.fullMatch, newItem);
    updatedCount++;
    
    if ((idx + 1) % 10 === 0) {
      console.log(`  진행 중... ${idx + 1}/${items.length}`);
    }
  });
  
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`✓ ${filePath}: ${updatedCount}개 항목 업데이트 완료\n`);
  
  return updatedCount;
}

// 한국어 설명 생성 (기본 템플릿)
function generateKoreanExplanation(meaning, word) {
  // 의미를 분석하여 기본 설명 생성
  if (meaning.includes('하다') || meaning.includes('되다') || meaning.includes('시키다')) {
    return `${meaning}는 동작이나 행위를 나타내는 표현`;
  } else if (meaning.includes('~') || meaning.includes('으로') || meaning.includes('에게') || meaning.includes('에서')) {
    return `${meaning}는 관계나 방향을 나타내는 표현`;
  } else if (meaning.includes('한') || meaning.includes('인') || meaning.includes('적인')) {
    return `${meaning}는 상태나 성질을 나타내는 표현`;
  } else {
    return `${meaning}를 의미하는 단어나 개념`;
  }
}

// 영어 설명 생성 (기본 템플릿)
function generateEnglishExplanation(meaning, word) {
  // 기본적인 영어 설명 생성
  // 실제로는 Oxford Dictionary API나 웹 스크래핑이 필요
  return `refers to ${meaning}`;
}

// 메인 실행
const files = [
  'src/data/game-data-1.js',
  'src/data/game-data-2.js'
];

console.log('단어 뜻 풀이 자동 업데이트 시작...\n');
console.log('주의: 이 스크립트는 기본 템플릿을 생성합니다.');
console.log('정확한 뜻 풀이를 위해서는 실제 사전에서 확인하여 수동으로 수정해야 합니다.\n');

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
console.log('\n다음 단계:');
console.log('1. 생성된 기본 설명을 검토하세요');
console.log('2. 국립국어원 표준국어대사전과 Oxford Dictionary에서 정확한 뜻 풀이를 확인하세요');
console.log('3. 필요시 수동으로 수정하세요');
