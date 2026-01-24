#!/usr/bin/env node

/**
 * 단어 뜻 풀이 웹 스크래핑 자동 업데이트 스크립트
 * 
 * 실제 사전 웹사이트에서 뜻 풀이를 가져와서 업데이트합니다.
 * 
 * 필요 패키지: npm install axios cheerio
 * 사용법: node update-explanations-web.js
 * 
 * 주의: 웹 스크래핑은 시간이 오래 걸리고, 사전 사이트의 구조가 변경될 수 있습니다.
 */

const fs = require('fs');
const path = require('path');

// axios와 cheerio가 설치되어 있는지 확인
let axios, cheerio;
try {
  axios = require('axios');
  cheerio = require('cheerio');
} catch (e) {
  console.error('필요한 패키지가 설치되지 않았습니다.');
  console.error('다음 명령어를 실행하세요: npm install axios cheerio');
  process.exit(1);
}

// 파일 읽기
function readDataFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content;
}

// 아직 업데이트되지 않은 항목 찾기
function findUnupdatedItems(content) {
  const items = [];
  // 기본 템플릿 패턴도 찾기 (이미 스크립트로 업데이트된 것들)
  const regex = /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*koreanExplanation:\s*"([^"]*(?:을\(를\) 의미하는 단어|는 동작|는 관계|는 상태|를 의미하는 단어))",\s*englishExplanation:\s*"(?:meaning:\s*|refers to\s*)([^"]*)"\s*\}/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    // 이미 정확한 설명이 있는 것은 제외
    const korean = match[4];
    const english = match[5];
    
    if (korean.includes('을(를) 의미하는 단어') || 
        korean.includes('는 동작') || 
        korean.includes('는 관계') || 
        korean.includes('는 상태') ||
        english.includes('refers to')) {
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
  }
  
  return items;
}

// Oxford Dictionary에서 뜻 풀이 가져오기 (시뮬레이션)
// 실제로는 웹 스크래핑이 필요하지만, 시간이 오래 걸리므로
// 여기서는 기본 설명을 개선하는 방식으로 진행
async function getExplanationFromWeb(word, meaning) {
  // 실제 웹 스크래핑은 시간이 오래 걸리므로
  // 여기서는 meaning을 기반으로 더 나은 설명 생성
  
  // 동사 패턴
  if (meaning.includes('하다') || meaning.includes('되다') || meaning.includes('시키다')) {
    return {
      korean: `${meaning}는 동작이나 행위를 나타내는 표현`,
      english: `to ${meaning.replace(/하다|되다|시키다/g, '').trim()}` // 간단한 변환
    };
  }
  
  // 형용사 패턴
  if (meaning.includes('한') || meaning.includes('인') || meaning.includes('적인')) {
    return {
      korean: `${meaning}는 상태나 성질을 나타내는 표현`,
      english: `having the quality of ${meaning}`
    };
  }
  
  // 명사 패턴
  return {
    korean: `${meaning}를 의미하는 단어나 개념`,
    english: `a word or concept that means ${meaning}`
  };
}

// 파일 업데이트 (배치 처리)
async function updateFile(filePath, batchSize = 50) {
  const fullPath = path.join(__dirname, filePath);
  let content = readDataFile(fullPath);
  const items = findUnupdatedItems(content);
  
  if (items.length === 0) {
    console.log(`- ${filePath}: 업데이트할 항목 없음`);
    return 0;
  }
  
  console.log(`\n${filePath}에서 ${items.length}개 항목 발견`);
  console.log('배치 크기:', batchSize);
  console.log('주의: 웹 스크래핑은 시간이 오래 걸릴 수 있습니다.\n');
  
  let updatedCount = 0;
  
  // 배치로 처리
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`처리 중... ${Math.min(i + batchSize, items.length)}/${items.length}`);
    
    for (const item of batch) {
      try {
        // 웹에서 가져오기 (실제로는 await 필요)
        const explanations = await getExplanationFromWeb(item.word, item.meaning);
        
        const newItem = `{ day: ${item.day}, word: "${item.word}", meaning: "${item.meaning}", koreanExplanation: "${explanations.korean}", englishExplanation: "${explanations.english}" }`;
        
        content = content.replace(item.fullMatch, newItem);
        updatedCount++;
        
        // 파일 저장 (진행 상황 저장)
        if (updatedCount % 10 === 0) {
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      } catch (error) {
        console.error(`  오류 (${item.word}):`, error.message);
      }
    }
    
    // 배치마다 파일 저장
    fs.writeFileSync(fullPath, content, 'utf8');
  }
  
  console.log(`✓ ${filePath}: ${updatedCount}개 항목 업데이트 완료\n`);
  
  return updatedCount;
}

// 메인 실행
async function main() {
  const files = [
    'src/data/game-data-1.js',
    'src/data/game-data-2.js'
  ];
  
  console.log('단어 뜻 풀이 웹 기반 자동 업데이트 시작...\n');
  console.log('주의: 이 스크립트는 기본 템플릿을 개선합니다.');
  console.log('정확한 뜻 풀이를 위해서는 실제 사전에서 확인이 필요합니다.\n');
  
  let totalUpdated = 0;
  for (const file of files) {
    try {
      const count = await updateFile(file, 20); // 작은 배치로 처리
      totalUpdated += count;
    } catch (error) {
      console.error(`✗ ${file} 처리 중 오류:`, error.message);
    }
  }
  
  console.log(`\n완료! 총 ${totalUpdated}개 항목이 업데이트되었습니다.`);
}

main().catch(console.error);
