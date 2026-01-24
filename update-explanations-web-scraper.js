#!/usr/bin/env node

/**
 * 단어 뜻 풀이 웹 스크래핑 자동 업데이트 스크립트
 * 
 * 실제 사전 웹사이트에서 뜻 풀이를 가져와서 업데이트합니다.
 * 
 * 필요 패키지: npm install axios cheerio
 * 사용법: node update-explanations-web-scraper.js
 * 
 * 주의사항:
 * - 웹 스크래핑은 시간이 오래 걸립니다 (1800개 단어)
 * - 사전 사이트의 구조가 변경될 수 있습니다
 * - API 제한이나 차단이 있을 수 있습니다
 * - 배치 처리로 진행하며, 중간에 중단되면 재실행 가능합니다
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

// 요청 간 지연 시간 (ms) - 서버 부하 방지
const DELAY_BETWEEN_REQUESTS = 1000; // 1초
const BATCH_SIZE = 10; // 한 번에 처리할 항목 수

// 파일 읽기
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// 아직 업데이트되지 않은 항목 찾기
function findItemsToUpdate(content) {
  const items = [];
  // 기본 템플릿 패턴 찾기
  const patterns = [
    // 패턴 1: "을(를) 의미하는 단어"
    /\{\s*day:\s*(\d+),\s*word:\s*"([^"]+)",\s*meaning:\s*"([^"]+)",\s*koreanExplanation:\s*"([^"]*(?:을\(를\) 의미하는 단어|를 의미하는 단어나 개념|는 동작|는 관계|는 상태)[^"]*)",\s*englishExplanation:\s*"(?:meaning:\s*|refers to\s*|to do|having the quality|a word or concept that means\s*)([^"]*)"\s*\}/g
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

// 지연 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 네이버 국어사전에서 한국어 뜻 풀이 가져오기
async function getKoreanExplanation(word, meaning) {
  try {
    // 네이버 국어사전 검색 URL
    const searchUrl = `https://ko.dict.naver.com/search.nhn?query=${encodeURIComponent(meaning)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    
    // 첫 번째 검색 결과의 뜻 풀이 가져오기
    const explanation = $('.mean_list .mean').first().text().trim();
    
    if (explanation && explanation.length > 0) {
      return explanation.substring(0, 200); // 최대 200자
    }
  } catch (error) {
    // 오류 발생 시 기본 설명 반환
    console.error(`  한국어 설명 가져오기 실패 (${word}):`, error.message);
  }
  
  // 기본 설명 반환
  return `${meaning}를 의미하는 단어나 개념`;
}

// Oxford Dictionary에서 영어 뜻 풀이 가져오기
async function getEnglishExplanation(word, meaning) {
  try {
    // Oxford Learner's Dictionary 검색 URL
    const searchUrl = `https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(word)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });
    
    const $ = cheerio.load(response.data);
    
    // 첫 번째 정의 가져오기
    const definition = $('.def').first().text().trim();
    
    if (definition && definition.length > 0) {
      return definition.substring(0, 200); // 최대 200자
    }
  } catch (error) {
    // 오류 발생 시 기본 설명 반환
    console.error(`  영어 설명 가져오기 실패 (${word}):`, error.message);
  }
  
  // 기본 설명 반환
  return `a word or concept that means ${meaning}`;
}

// 단일 항목 업데이트
async function updateItem(item) {
  try {
    console.log(`  처리 중: ${item.word} (Day ${item.day})`);
    
    // 한국어와 영어 설명 가져오기
    const [koreanExplanation, englishExplanation] = await Promise.all([
      getKoreanExplanation(item.word, item.meaning),
      delay(DELAY_BETWEEN_REQUESTS / 2).then(() => getEnglishExplanation(item.word, item.meaning))
    ]);
    
    // 추가 지연
    await delay(DELAY_BETWEEN_REQUESTS / 2);
    
    return {
      ...item,
      koreanExplanation,
      englishExplanation
    };
  } catch (error) {
    console.error(`  오류 (${item.word}):`, error.message);
    // 오류 발생 시 기본 설명 사용
    return {
      ...item,
      koreanExplanation: `${item.meaning}를 의미하는 단어나 개념`,
      englishExplanation: `a word or concept that means ${item.meaning}`
    };
  }
}

// 파일 업데이트 (배치 처리)
async function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  let content = readFile(fullPath);
  const items = findItemsToUpdate(content);
  
  if (items.length === 0) {
    console.log(`- ${filePath}: 업데이트할 항목 없음`);
    return 0;
  }
  
  console.log(`\n${filePath}: ${items.length}개 항목 발견`);
  console.log(`배치 크기: ${BATCH_SIZE}, 요청 간 지연: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log('주의: 웹 스크래핑은 시간이 오래 걸릴 수 있습니다.\n');
  
  let updatedCount = 0;
  let newContent = content;
  
  // 배치로 처리
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    
    console.log(`\n배치 ${batchNum}/${totalBatches} 처리 중...`);
    
    // 배치 내 항목들을 병렬로 처리
    const updatedItems = await Promise.all(
      batch.map(item => updateItem(item))
    );
    
    // 파일 내용 업데이트
    updatedItems.forEach(updatedItem => {
      const newItem = `{ day: ${updatedItem.day}, word: "${updatedItem.word}", meaning: "${updatedItem.meaning}", koreanExplanation: "${updatedItem.koreanExplanation}", englishExplanation: "${updatedItem.englishExplanation}" }`;
      newContent = newContent.replace(updatedItem.fullMatch, newItem);
      updatedCount++;
    });
    
    // 배치마다 파일 저장 (진행 상황 저장)
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`  ✓ 배치 ${batchNum} 완료 (${updatedCount}/${items.length})`);
    
    // 마지막 배치가 아니면 추가 지연
    if (i + BATCH_SIZE < items.length) {
      console.log(`  대기 중... (${DELAY_BETWEEN_REQUESTS}ms)`);
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }
  
  console.log(`\n✓ ${filePath}: ${updatedCount}개 항목 업데이트 완료`);
  
  return updatedCount;
}

// 메인 실행
async function main() {
  const files = [
    'src/data/game-data-1.js',
    'src/data/game-data-2.js'
  ];
  
  console.log('단어 뜻 풀이 웹 스크래핑 자동 업데이트 시작...\n');
  console.log('주의사항:');
  console.log('- 웹 스크래핑은 시간이 오래 걸립니다 (약 30분~1시간 예상)');
  console.log('- 네트워크 오류나 사전 사이트 구조 변경 시 실패할 수 있습니다');
  console.log('- 중간에 중단되면 재실행하면 됩니다 (이미 업데이트된 항목은 건너뜀)\n');
  
  let totalUpdated = 0;
  for (const file of files) {
    try {
      const count = await updateFile(file);
      totalUpdated += count;
    } catch (error) {
      console.error(`\n✗ ${file} 처리 중 오류:`, error.message);
      console.error('스크립트를 재실행하면 중단된 지점부터 계속 진행됩니다.');
    }
  }
  
  console.log(`\n완료! 총 ${totalUpdated}개 항목이 업데이트되었습니다.`);
}

main().catch(console.error);
