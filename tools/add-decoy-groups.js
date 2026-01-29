/**
 * rawData_1에만 있고 decoyWordsSet에 없는 단어를
 * 철자/발음 유사도로 기존 그룹 추가 + 새 그룹 생성.
 * - 1단계: 엄격 기준(길이 차이 1, 편집거리 1~2)으로 기존 그룹에 추가
 * - 2단계: 같은 엄격 기준으로 남은 단어끼리 새 그룹
 * - 3단계: 아직 안 들어간 단어는 완화 기준(길이 차이 2, 편집거리 2~4)으로 비슷한 단어 찾아 새 그룹
 * 실행: node tools/add-decoy-groups.js
 */
const fs = require('fs');
const path = require('path');

const gameDataPath = path.join(__dirname, '../data/game-data-1.js');
const decoyPath = path.join(__dirname, '../data/decoy-words-set.js');

// Levenshtein distance
function editDistance(a, b) {
    const m = a.length, n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}

function norm(w) {
    return String(w || '').trim().toLowerCase();
}

// 철자/발음 유사 (엄격): 길이 차이 1 이하 + 편집 거리 1~2
function isSimilar(a, b) {
    const x = norm(a), y = norm(b);
    if (x === y) return true;
    const lenA = x.length, lenB = y.length;
    if (Math.abs(lenA - lenB) > 1) return false;
    const dist = editDistance(x, y);
    if (Math.max(lenA, lenB) <= 5) return dist <= 1;
    if (Math.max(lenA, lenB) <= 10) return dist <= 2;
    return dist <= 3;
}

// 완화: 그룹에 안 들어간 단어끼리 묶을 때 (길이 차이 2, 편집거리 2~4)
function isSimilarRelaxed(a, b) {
    const x = norm(a), y = norm(b);
    if (x === y) return true;
    const lenA = x.length, lenB = y.length;
    if (Math.abs(lenA - lenB) > 2) return false;
    const dist = editDistance(x, y);
    if (Math.max(lenA, lenB) <= 6) return dist <= 2;
    if (Math.max(lenA, lenB) <= 10) return dist <= 3;
    return dist <= 4;
}

// rawData_1 words
const gameDataContent = fs.readFileSync(gameDataPath, 'utf8');
const rawWordMatches = gameDataContent.matchAll(/word:\s*['"]([^'"]+)['"]/g);
const allRawWords = [...new Set([...rawWordMatches].map((m) => m[1].trim()))];

// 기존 decoy 그룹 파싱: window.decoyWordsSet = [ ... ]; 안의 각 [...]
const decoyContent = fs.readFileSync(decoyPath, 'utf8');
const existingDecoyWords = new Set();
const existingGroups = [];
let depth = 0;
let start = -1;
for (let i = 0; i < decoyContent.length; i++) {
    if (decoyContent.slice(i).startsWith('window.decoyWordsSet')) {
        start = decoyContent.indexOf('[', i);
        break;
    }
}
if (start >= 0) {
    depth = 1;
    let groupStart = -1;
    for (let i = start + 1; i < decoyContent.length && depth > 0; i++) {
        const c = decoyContent[i];
        if (c === '[') {
            depth++;
            if (depth === 2) groupStart = i;
        } else if (c === ']') {
            if (depth === 2 && groupStart >= 0) {
                const block = decoyContent.slice(groupStart, i + 1);
                const words = [];
                for (const m of block.matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)) {
                    const word = m[1].replace(/\\'/g, "'").trim();
                    if (word && word !== 'undefined') {
                        words.push(word);
                        existingDecoyWords.add(norm(word));
                    }
                }
                if (words.length > 0) existingGroups.push(words);
            }
            depth--;
        }
    }
}

// decoy에 없는 802개
const notInDecoy = allRawWords.filter((w) => !existingDecoyWords.has(norm(w))).sort((a, b) => a.localeCompare(b));
console.error('Not in decoy count:', notInDecoy.length);

// 1) 기존 그룹에 추가: 802개 중 기존 그룹의 어떤 단어와 유사하면 해당 그룹에 추가
const addedToExisting = new Set();
const updatedExistingGroups = existingGroups.map((group) => {
    const next = [...group];
    for (const word of notInDecoy) {
        if (addedToExisting.has(norm(word))) continue;
        for (const g of group) {
            if (isSimilar(word, g)) {
                next.push(word);
                addedToExisting.add(norm(word));
                break;
            }
        }
    }
    return [...new Set(next)].sort((a, b) => a.localeCompare(b));
});

// 2) 아직 안 넣은 단어들끼리만 진짜 유사한 것끼리 새 그룹 생성 (2명 이상일 때만)
const remaining = notInDecoy.filter((w) => !addedToExisting.has(norm(w)));
const newGroups = [];
const used = new Set();

for (const word of remaining) {
    const nw = norm(word);
    if (used.has(nw)) continue;
    const group = [word];
    used.add(nw);
    for (const other of remaining) {
        const no = norm(other);
        if (used.has(no)) continue;
        if (word === other) continue;
        if (group.some((g) => isSimilar(g, other))) {
            group.push(other);
            used.add(no);
        }
    }
    if (group.length >= 2) newGroups.push(group.sort((a, b) => a.localeCompare(b)));
}

// 3) 아직 그룹에 안 들어간 단어: 완화 기준으로 비슷한 단어 찾아 새 그룹
const inStrictNewGroups = new Set();
for (const g of newGroups) for (const w of g) inStrictNewGroups.add(norm(w));
const stillUngrouped = remaining.filter((w) => !inStrictNewGroups.has(norm(w)));
const usedInRelaxed = new Set();
const relaxedGroups = [];

for (const word of stillUngrouped) {
    const nw = norm(word);
    if (usedInRelaxed.has(nw)) continue;
    const group = [word];
    usedInRelaxed.add(nw);
    for (const other of stillUngrouped) {
        const no = norm(other);
        if (usedInRelaxed.has(no)) continue;
        if (word === other) continue;
        if (group.some((g) => isSimilarRelaxed(g, other))) {
            group.push(other);
            usedInRelaxed.add(no);
        }
    }
    if (group.length >= 2) relaxedGroups.push(group.sort((a, b) => a.localeCompare(b)));
}

// 3-2) 여전히 혼자 남은 단어: 편집거리 가장 가까운 단어 1명과 짝 지어 2명 그룹
const alone = stillUngrouped.filter((w) => !relaxedGroups.some((g) => g.includes(w)));
const paired = new Set();
for (const word of alone) {
    if (paired.has(norm(word))) continue;
    let best = null;
    let bestDist = 5;
    const x = norm(word);
    for (const other of alone) {
        if (other === word) continue;
        const y = norm(other);
        if (paired.has(y)) continue;
        const d = editDistance(x, y);
        if (d < bestDist && Math.abs(x.length - y.length) <= 3) {
            bestDist = d;
            best = other;
        }
    }
    if (best !== null && bestDist <= 4) {
        relaxedGroups.push([word, best].sort((a, b) => a.localeCompare(b)));
        paired.add(norm(word));
        paired.add(norm(best));
    }
}

newGroups.push(...relaxedGroups);

// 출력: JS 배열 형태
function formatGroup(arr) {
    return '        [' + arr.map((w) => "'" + String(w).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'").join(', ') + ']';
}

const allGroups = [...updatedExistingGroups, ...newGroups];
const out = `// 유사 단어 집합(decoyWordsSet) 수동 관리 파일
// ============================================================
// - 이 파일만 직접 수정해서 유사 단어 집합을 확장하세요.
// - day 개념 없이 "유사한 단어(철자/발음이 비슷한)"를 같은 집합으로 묶습니다.
// - 게임은 객관식(word 보기) 오답 생성 시, 정답 단어가 집합에 있으면
//   같은 집합의 다른 단어들을 우선적으로 오답 후보로 사용합니다.
// - 집합에 매핑이 없거나 후보가 부족하면 rawData에서 랜덤으로 보충합니다.
// ============================================================

(function () {
    if (typeof window === 'undefined') return;

    window.decoyWordsSet = [
${allGroups.map(formatGroup).join(',\n')}
    ];
})();
`;

fs.writeFileSync(decoyPath, out, 'utf8');
const inNewGroups = newGroups.reduce((s, g) => s + g.length, 0);
console.error('Done. Updated', decoyPath, 'with', allGroups.length, 'groups.');
console.error('Added to existing:', addedToExisting.size, '| New (strict):', newGroups.length - relaxedGroups.length, '| New (relaxed+pair):', relaxedGroups.length, '| Words in groups:', inNewGroups, '| Still ungrouped:', remaining.length - inNewGroups);
