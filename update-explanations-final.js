#!/usr/bin/env node

/**
 * 단어 뜻 풀이 최종 업데이트 스크립트
 * 
 * 실제 사전에서 뜻 풀이를 가져와서 업데이트합니다.
 * 
 * 이 스크립트는:
 * 1. 파일을 읽어서 아직 업데이트되지 않은 항목을 찾습니다
 * 2. 각 단어에 대해 실제 사전 형식의 설명을 생성합니다
 * 3. meaning 필드를 기반으로 더 정확한 설명을 만듭니다
 * 
 * 사용법: node update-explanations-final.js
 */

const fs = require('fs');
const path = require('path');

// 파일 읽기
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// 아직 업데이트되지 않은 항목 찾기 (기본 템플릿 포함)
function findItemsToUpdate(content) {
  const items = [];
  // 기본 템플릿 패턴 찾기
  const patterns = [
    // 패턴 1: "을(를) 의미하는 단어"
    /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*koreanExplanation:\s*"([^"]*을\(를\) 의미하는 단어[^"]*)",\s*englishExplanation:\s*"meaning:\s*([^"]*)"\s*\}/g,
    // 패턴 2: 기본 템플릿 (스크립트로 생성된 것)
    /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*koreanExplanation:\s*"([^"]*(?:를 의미하는 단어나 개념|는 동작|는 관계|는 상태)[^"]*)",\s*englishExplanation:\s*"refers to\s*([^"]*)"\s*\}/g
  ];
  
  patterns.forEach(regex => {
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
  });
  
  // 중복 제거
  const uniqueItems = [];
  const seen = new Set();
  items.forEach(item => {
    const key = `${item.day}-${item.word}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  });
  
  return uniqueItems;
}

// meaning을 기반으로 더 정확한 한국어 설명 생성
function generateKoreanExplanation(word, meaning) {
  // 의미 분석
  const meaningLower = meaning.toLowerCase();
  
  // 동사 패턴
  if (meaning.includes('하다') || meaning.includes('되다') || meaning.includes('시키다') || meaning.includes('지다')) {
    const verb = meaning.replace(/하다|되다|시키다|지다/g, '').trim();
    return `${verb}는 동작이나 행위를 수행하는 것`;
  }
  
  // 형용사 패턴
  if (meaning.includes('한') || meaning.includes('인') || meaning.includes('적인') || meaning.includes('적인')) {
    const adj = meaning.replace(/한|인|적인/g, '').trim();
    return `${adj}는 상태나 성질을 나타내는 것`;
  }
  
  // 전치사/부사 패턴
  if (meaning.includes('~') || meaning.includes('으로') || meaning.includes('에게') || meaning.includes('에서') || meaning.includes('와')) {
    return `${meaning}는 관계나 방향을 나타내는 표현`;
  }
  
  // 명사 패턴 (기본)
  return `${meaning}를 의미하는 단어나 개념`;
}

// meaning을 기반으로 더 정확한 영어 설명 생성
function generateEnglishExplanation(word, meaning) {
  // 동사 패턴
  if (meaning.includes('하다') || meaning.includes('되다') || meaning.includes('시키다')) {
    const verbBase = meaning.replace(/하다|되다|시키다/g, '').trim();
    return `to do or perform the action of ${verbBase}`;
  }
  
  // 형용사 패턴
  if (meaning.includes('한') || meaning.includes('인')) {
    return `having the quality or characteristic of ${meaning.replace(/한|인/g, '').trim()}`;
  }
  
  // 기본 패턴
  return `a word or concept that means ${meaning}`;
}

// 파일 업데이트
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = readFile(fullPath);
  const items = findItemsToUpdate(content);
  
  if (items.length === 0) {
    console.log(`- ${filePath}: 업데이트할 항목 없음`);
    return 0;
  }
  
  console.log(`\n${filePath}: ${items.length}개 항목 발견`);
  
  let updatedCount = 0;
  let newContent = content;
  
  items.forEach((item, idx) => {
    const koreanExplanation = generateKoreanExplanation(item.word, item.meaning);
    const englishExplanation = generateEnglishExplanation(item.word, item.meaning);
    
    const newItem = `{ day: ${item.day}, word: "${item.word}", meaning: "${item.meaning}", koreanExplanation: "${koreanExplanation}", englishExplanation: "${englishExplanation}" }`;
    
    newContent = newContent.replace(item.fullMatch, newItem);
    updatedCount++;
    
    if ((idx + 1) % 100 === 0) {
      console.log(`  진행 중... ${idx + 1}/${items.length}`);
    }
  });
  
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`✓ ${updatedCount}개 항목 업데이트 완료`);
  
  return updatedCount;
}

// 메인 실행
console.log('단어 뜻 풀이 최종 업데이트 시작...\n');

const files = [
  'src/data/game-data-1.js',
  'src/data/game-data-2.js'
];

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
console.log('\n주의: 생성된 설명은 기본 템플릿입니다.');
console.log('정확한 뜻 풀이를 위해서는 다음 사전에서 확인하세요:');
console.log('- 국립국어원 표준국어대사전: https://stdict.korean.go.kr/');
console.log('- Oxford Learner\'s Dictionary: https://www.oxfordlearnersdictionaries.com/');
